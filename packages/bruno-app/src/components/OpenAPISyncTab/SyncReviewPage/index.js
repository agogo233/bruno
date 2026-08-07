import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import {
  IconCheck,
  IconX,
  IconArrowRight,
  IconArrowsDiff,
  IconInfoCircle,
  IconLoader2
} from '@tabler/icons';
import Button from 'ui/Button';
import StatusBadge from 'ui/StatusBadge';
import EndpointChangeSection from '../EndpointChangeSection';
import ExpandableEndpointRow from '../EndpointChangeSection/ExpandableEndpointRow';
import ConfirmSyncModal from '../ConfirmSyncModal';
import SpecDiffModal from '../SpecDiffModal';
import Help from 'components/Help';
import { setReviewDecision, setReviewDecisions } from 'providers/ReduxStore/slices/openapi-sync';

/**
 * Categorize remoteDrift endpoints using three-way merge.
 * Uses specDrift and collectionDrift to determine who changed each modified endpoint.
 *
 * Returns:
 *  - specAddedEndpoints: new in spec, not yet in collection
 *  - specUpdatedEndpoints: modified in spec (includes conflicts where both sides changed)
 *  - localUpdatedEndpoints: modified only in the collection (spec didn't change)
 *  - specRemovedEndpoints: removed from spec, still in collection
 */
const categorizeEndpoints = (remoteDrift, specDrift, collectionDrift) => {
  // Only show endpoints as "New in Spec" if they were actually added to the spec
  // (i.e., they appear in specDrift.added). Endpoints the user deleted locally that
  // still exist in both stored and remote spec should not appear here — they belong
  // in "Collection Changes" only.
  const specAddedIds = new Set((specDrift?.added || []).map((ep) => ep.id));
  const specAddedEndpoints = (remoteDrift.missing || []).filter((ep) => specAddedIds.has(ep.id));

  // Only show endpoints as "Removed from Spec" if they were actually in the stored spec
  // (i.e., they appear in specDrift.removed). Locally-added endpoints that were never in
  // the spec should not appear here — they belong in "Collection Changes" only.
  const specRemovedIds = new Set((specDrift?.removed || []).map((ep) => ep.id));
  const specRemovedEndpoints = (remoteDrift.localOnly || []).filter((ep) => specRemovedIds.has(ep.id));

  // Build lookup sets to determine who changed each modified endpoint
  const specModifiedIds = new Set((specDrift?.modified || []).map((ep) => ep.id));
  const localModifiedIds = new Set((collectionDrift?.modified || []).map((ep) => ep.id));
  const noMergeBase = collectionDrift?.noStoredSpec;

  const specUpdatedEndpoints = [];
  const localUpdatedEndpoints = [];

  (remoteDrift.modified || []).forEach((ep) => {
    // When there's no merge base (noStoredSpec), we can't tell who changed what — treat as spec update
    const specChanged = !noMergeBase && specModifiedIds.has(ep.id);
    const localChanged = !noMergeBase && localModifiedIds.has(ep.id);

    if (!specChanged && localChanged) {
      // Only local changed — user modification, spec didn't change
      localUpdatedEndpoints.push({
        ...ep,
        source: 'collection-drift',
        localAction: 'modified'
      });
    } else {
      // Spec changed, both changed (conflict), no merge base, or sensitivity mismatch
      specUpdatedEndpoints.push({
        ...ep,
        source: 'spec-modified',
        specAction: 'modified',
        ...(specChanged && localChanged && { conflict: true, localAction: 'modified' })
      });
    }
  });

  return { specAddedEndpoints, specUpdatedEndpoints, localUpdatedEndpoints, specRemovedEndpoints };
};

const SyncReviewPage = ({
  specDrift,
  remoteDrift,
  collectionDrift,
  collectionPath,
  collectionUid,
  newSpec,
  isSyncing,
  isLoading,
  onApplySync
}) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const tabUiState = useSelector((state) => state.openapiSync?.tabUiState?.[collectionUid] || {});
  const [preserveValues, setPreserveValues] = useState(true);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showSpecDiffModal, setShowSpecDiffModal] = useState(false);
  const [isOpeningSpecDiff, setIsOpeningSpecDiff] = useState(false);

  // setTimeout lets the button's spinner paint before the modal mounts —
  // without it, React batches both state updates and the spinner never shows.
  const handleOpenSpecDiff = () => {
    setIsOpeningSpecDiff(true);
    setTimeout(() => {
      setShowSpecDiffModal(true);
      setIsOpeningSpecDiff(false);
    }, 0);
  };

  const { specAddedEndpoints, specUpdatedEndpoints, localUpdatedEndpoints, specRemovedEndpoints } = useMemo(() => {
    if (!remoteDrift) {
      return { specAddedEndpoints: [], specUpdatedEndpoints: [], localUpdatedEndpoints: [], specRemovedEndpoints: [] };
    }
    return categorizeEndpoints(remoteDrift, specDrift, collectionDrift);
  }, [specDrift, remoteDrift, collectionDrift]);

  const conflictCount = specUpdatedEndpoints.filter((ep) => ep.conflict).length;
  const hasConflicts = conflictCount > 0;

  // Track decisions in Redux (persisted across navigations)
  const savedDecisions = tabUiState.reviewDecisions || {};

  // Compute defaults for any endpoints not yet in Redux
  const decisions = useMemo(() => {
    const merged = { ...savedDecisions };
    // Spec changes: accept-incoming by default, null for conflicts (must resolve manually)
    specUpdatedEndpoints.forEach((ep) => {
      if (!(ep.id in merged)) merged[ep.id] = ep.conflict ? null : 'accept-incoming';
    });
    // Local changes: keep-mine (preserved silently, not shown in review)
    localUpdatedEndpoints.forEach((ep) => {
      if (!(ep.id in merged)) merged[ep.id] = 'keep-mine';
    });
    // Added + removed endpoints: accept-incoming
    [...specAddedEndpoints, ...specRemovedEndpoints].forEach((ep) => {
      if (!(ep.id in merged)) merged[ep.id] = 'accept-incoming';
    });
    return merged;
  }, [savedDecisions, specUpdatedEndpoints, localUpdatedEndpoints, specRemovedEndpoints, specAddedEndpoints]);

  // Sync computed defaults back to Redux when they differ from saved state
  useEffect(() => {
    const hasNewDefaults = Object.keys(decisions).some((id) => !(id in savedDecisions));
    if (hasNewDefaults) {
      dispatch(setReviewDecisions({ collectionUid, decisions }));
    }
  }, [decisions, savedDecisions, collectionUid, dispatch]);

  const handleDecisionChange = (endpointId, decision) => {
    dispatch(setReviewDecision({ collectionUid, endpointId, decision }));
  };

  // Bulk actions — all spec-driven sections
  const decidableEndpoints = useMemo(() => {
    return [...specUpdatedEndpoints, ...specAddedEndpoints, ...specRemovedEndpoints];
  }, [specUpdatedEndpoints, specAddedEndpoints, specRemovedEndpoints]);

  const setBulkDecision = (decision) => {
    const newDecisions = {};
    decidableEndpoints.forEach((ep) => { newDecisions[ep.id] = decision; });
    dispatch(setReviewDecisions({ collectionUid, decisions: newDecisions }));
  };

  const allAccepted = decidableEndpoints.length > 0
    && decidableEndpoints.every((ep) => decisions[ep.id] === 'accept-incoming');
  const allSkipped = decidableEndpoints.length > 0
    && decidableEndpoints.every((ep) => decisions[ep.id] === 'keep-mine');

  const unresolvedConflicts = specUpdatedEndpoints.filter((ep) => ep.conflict && !decisions[ep.id]).length;

  // Confirmation summary — grouped endpoint lists
  const confirmGroups = useMemo(() => {
    const groups = [];
    const addGroup = (label, type, endpoints) => {
      if (endpoints.length > 0) groups.push({ label, type, endpoints });
    };

    const isAccepted = (ep) => decisions[ep.id] === 'accept-incoming';
    const isSkipped = (ep) => decisions[ep.id] === 'keep-mine';

    // Accepted
    addGroup(t('OPENAPI_SYNC.REVIEW.NEW_IN_SPEC'), 'add', specAddedEndpoints.filter(isAccepted));
    addGroup(t('OPENAPI_SYNC.REVIEW.UPDATED_IN_SPEC'), 'update', specUpdatedEndpoints.filter(isAccepted));
    addGroup(t('OPENAPI_SYNC.REVIEW.REMOVED_FROM_SPEC'), 'remove', specRemovedEndpoints.filter(isAccepted));

    // Skipped
    addGroup(t('OPENAPI_SYNC.ENDPOINT.KEEP_CURRENT'), 'keep', specUpdatedEndpoints.filter((ep) => ep.conflict && isSkipped(ep)));
    addGroup(t('OPENAPI_SYNC.REVIEW.REMOVED_FROM_SPEC'), 'keep', specRemovedEndpoints.filter(isSkipped));
    addGroup(t('OPENAPI_SYNC.REVIEW.NEW_IN_SPEC'), 'keep', specAddedEndpoints.filter(isSkipped));
    addGroup(t('OPENAPI_SYNC.REVIEW.KEEPING_CURRENT_VERSION'), 'keep', specUpdatedEndpoints.filter((ep) => !ep.conflict && isSkipped(ep)));

    return groups;
  }, [specAddedEndpoints, specUpdatedEndpoints, specRemovedEndpoints, decisions]);

  const handleConfirmApply = () => {
    setShowConfirmation(false);

    // Filter based on decisions
    const filteredAddedEndpoints = specAddedEndpoints.filter(
      (ep) => decisions[ep.id] === 'accept-incoming'
    );
    const filteredSpecChanges = specUpdatedEndpoints.filter(
      (ep) => !ep.conflict && decisions[ep.id] === 'accept-incoming'
    );

    // Collect "Not in Spec" endpoints where user chose to remove
    const localOnlyIds = specRemovedEndpoints
      .filter((ep) => decisions[ep.id] === 'accept-incoming')
      .map((ep) => ep.id);

    onApplySync({
      endpointDecisions: decisions,
      localOnlyIds,
      // Pass filtered categorized endpoints for performSync to construct the right backend diff
      newToCollection: filteredAddedEndpoints,
      specUpdates: filteredSpecChanges,
      resolvedConflicts: specUpdatedEndpoints.filter((ep) => ep.conflict && decisions[ep.id] === 'accept-incoming'),
      localChangesToReset: localUpdatedEndpoints.filter((ep) => decisions[ep.id] === 'accept-incoming'),
      preserveValues
    });
  };

  const totalChanges = specAddedEndpoints.length + specUpdatedEndpoints.length + localUpdatedEndpoints.length + specRemovedEndpoints.length;
  const hasRemoteUpdates = specAddedEndpoints.length + specUpdatedEndpoints.length + specRemovedEndpoints.length > 0;

  const buttonLabel = unresolvedConflicts > 0
    ? t(unresolvedConflicts === 1 ? 'OPENAPI_SYNC.REVIEW.RESOLVE_CONFLICT_SYNC' : 'OPENAPI_SYNC.REVIEW.RESOLVE_CONFLICTS_SYNC', { count: unresolvedConflicts })
    : !hasRemoteUpdates && specDrift?.storedSpecMissing
        ? t('OPENAPI_SYNC.REVIEW.RESTORE_SPEC_FILE')
        : t('OPENAPI_SYNC.REVIEW.SYNC_COLLECTION');

  return (
    <div className="sync-review-page sync-mode">
      {hasRemoteUpdates && (
        <div className="sync-review-header">
          <div className="title-row">
            <div className="title-left">
              <h3 className="review-title">{t('OPENAPI_SYNC.REVIEW.REVIEW_CHANGES')}</h3>
              {totalChanges > 0 && (
                <p className="review-subtitle">
                  {t('OPENAPI_SYNC.REVIEW.CHOOSE_VERSION')}
                </p>
              )}
            </div>
            {(specDrift?.unifiedDiff || decidableEndpoints.length > 0) && (
              <div className="bulk-actions">
                <div className="preserve-values-control">
                  <button
                    type="button"
                    role="switch"
                    aria-pressed={preserveValues}
                    className={`preserve-toggle ${preserveValues ? 'active' : ''}`}
                    onClick={() => setPreserveValues((v) => !v)}
                  >
                    <span className="preserve-toggle-knob" />
                  </button>
                    <span className="preserve-values-label">{t('OPENAPI_SYNC.REVIEW.PRESERVE_VALUES')}</span>
                    <Help icon="info" size={12} placement="top" width={260}>
                      {t('OPENAPI_SYNC.REVIEW.PRESERVE_TOOLTIP')}
                    </Help>
                </div>
                {specDrift?.unifiedDiff && (
                  <button
                    className="bulk-btn"
                    onClick={handleOpenSpecDiff}
                    disabled={isOpeningSpecDiff || showSpecDiffModal}
                  >
                    {isOpeningSpecDiff ? (
                      <IconLoader2 size={12} className="animate-spin" />
                    ) : (
                      <IconArrowsDiff size={12} />
                    )}{' '}
                    {t('OPENAPI_SYNC.REVIEW.VIEW_SPEC_DIFF')}
                  </button>
                )}
                {decidableEndpoints.length > 0 && (
                  <>
                    <button
                      className={`bulk-btn ${allSkipped ? 'active' : ''}`}
                      onClick={() => setBulkDecision('keep-mine')}
                    >
                      <IconX size={12} /> {t('OPENAPI_SYNC.REVIEW.SKIP_ALL')}
                    </button>
                    <button
                      className={`bulk-btn ${allAccepted ? 'active' : ''}`}
                      onClick={() => setBulkDecision('accept-incoming')}
                    >
                      <IconCheck size={12} /> {t('OPENAPI_SYNC.REVIEW.ACCEPT_ALL')}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="sync-review-body">
        {!hasRemoteUpdates ? (
          <div className="sync-review-empty-state">
            {isLoading ? (
              <>
                <IconLoader2 size={40} className="empty-state-icon animate-spin" />
                <h4>{t('OPENAPI_SYNC.REVIEW.CHECKING_UPDATES')}</h4>
                <p>{t('OPENAPI_SYNC.REVIEW.COMPARING_SPEC')}</p>
              </>
            ) : (
              <>
                <IconCheck size={40} className="empty-state-icon" />
                <h4>{t('OPENAPI_SYNC.REVIEW.NO_UPDATES')}</h4>
                <p>{t('OPENAPI_SYNC.REVIEW.SPEC_NOT_UPDATED')}</p>
              </>
            )}
          </div>
        ) : (
          <div className="endpoints-review-sections">
            {/* === Updates from Spec === */}
            {decidableEndpoints.length > 0 && (
              <div className="review-group">

                <EndpointChangeSection
                  title={t('OPENAPI_SYNC.REVIEW.UPDATED_IN_SPEC')}
                  type="spec-modified"
                  endpoints={specUpdatedEndpoints}
                  defaultExpanded={true}
                  expandableLayout
                  subtitle={t('OPENAPI_SYNC.REVIEW.UPDATED_SUBTITLE')}
                  headerExtra={conflictCount > 0 ? (
                    <StatusBadge
                      status="danger"
                      rightSection={(
                        <Help icon="info" size={11} placement="top" width={250}>
                          {t('OPENAPI_SYNC.REVIEW.CONFLICT_TOOLTIP', { count: conflictCount, plural: conflictCount !== 1 ? 'plural' : 'singular' })}
                        </Help>
                      )}
                    >
                      {conflictCount} {t(conflictCount === 1 ? 'OPENAPI_SYNC.REVIEW.CONFLICT' : 'OPENAPI_SYNC.REVIEW.CONFLICTS', { count: conflictCount })}
                    </StatusBadge>
                  ) : null}
                  collectionUid={collectionUid}
                  sectionKey="review-spec-modified"
                  renderItem={(endpoint, idx) => (
                    <ExpandableEndpointRow
                      key={endpoint.id || idx}
                      endpoint={endpoint}
                      decision={decisions?.[endpoint.id]}
                      onDecisionChange={(decision) => handleDecisionChange(endpoint.id, decision)}
                      collectionPath={collectionPath}
                      newSpec={newSpec}
                      showDecisions={true}
                      decisionLabels={{ keep: 'Keep Current', accept: 'Update' }}
                      collectionUid={collectionUid}
                      preserveValues={preserveValues}
                    />
                  )}
                />

                <EndpointChangeSection
                  title={t('OPENAPI_SYNC.REVIEW.NEW_IN_SPEC')}
                  type="added"
                  endpoints={specAddedEndpoints}
                  defaultExpanded={true}
                  expandableLayout
                  subtitle={t('OPENAPI_SYNC.REVIEW.NEW_SUBTITLE')}
                  collectionUid={collectionUid}
                  sectionKey="review-added"
                  renderItem={(endpoint, idx) => (
                    <ExpandableEndpointRow
                      key={endpoint.id || idx}
                      endpoint={endpoint}
                      decision={decisions?.[endpoint.id]}
                      onDecisionChange={(decision) => handleDecisionChange(endpoint.id, decision)}
                      collectionPath={collectionPath}
                      newSpec={newSpec}
                      showDecisions={true}
                      decisionLabels={{ keep: 'Skip', accept: 'Add' }}
                      collectionUid={collectionUid}
                      preserveValues={preserveValues}
                    />
                  )}
                />

                <EndpointChangeSection
                  title={t('OPENAPI_SYNC.REVIEW.REMOVED_FROM_SPEC')}
                  type="removed"
                  endpoints={specRemovedEndpoints}
                  defaultExpanded={true}
                  expandableLayout
                  subtitle={t('OPENAPI_SYNC.REVIEW.REMOVED_SUBTITLE')}
                  collectionUid={collectionUid}
                  sectionKey="review-removed"
                  renderItem={(endpoint, idx) => (
                    <ExpandableEndpointRow
                      key={endpoint.id || idx}
                      endpoint={endpoint}
                      decision={decisions?.[endpoint.id]}
                      onDecisionChange={(decision) => handleDecisionChange(endpoint.id, decision)}
                      collectionPath={collectionPath}
                      newSpec={newSpec}
                      showDecisions={true}
                      decisionLabels={{ keep: 'Keep', accept: 'Delete' }}
                      collectionUid={collectionUid}
                      preserveValues={preserveValues}
                    />
                  )}
                />
              </div>
            )}

          </div>
        )}
      </div>

      {hasRemoteUpdates && (
        <div className="sync-info-notice mt-4">
          <IconInfoCircle size={14} className="sync-info-icon" />
          <span><span className="whats-updated-title">{t('OPENAPI_SYNC.REVIEW.WHATS_UPDATED_TITLE')}</span>{t('OPENAPI_SYNC.REVIEW.WHATS_UPDATED_DESC')}</span>
        </div>
      )}

      {hasRemoteUpdates && (
        <div className="sync-review-bottom-bar mt-4">
          <div className="bar-stats">
            {totalChanges === 0 && (
              <span className="stats-prefix">
                {specDrift?.storedSpecMissing ? t('OPENAPI_SYNC.REVIEW.SYNC_WILL_UPDATE') : t('OPENAPI_SYNC.REVIEW.NO_ENDPOINT_CHANGES')}
              </span>
            )}
          </div>
          <div className="bar-actions">
            <Button
              onClick={totalChanges === 0 ? handleConfirmApply : () => setShowConfirmation(true)}
              disabled={unresolvedConflicts > 0 || isSyncing}
              loading={isSyncing}
            >
              {buttonLabel}
              {unresolvedConflicts === 0 && <IconArrowRight size={14} style={{ marginLeft: 4 }} />}
            </Button>
          </div>
        </div>
      )}

      {showConfirmation && (
        <ConfirmSyncModal
          groups={confirmGroups}
          onCancel={() => setShowConfirmation(false)}
          onSync={handleConfirmApply}
          isSyncing={isSyncing}
        />
      )}

      {showSpecDiffModal && (
        <SpecDiffModal
          specDrift={specDrift}
          onClose={() => setShowSpecDiffModal(false)}
        />
      )}
    </div>
  );
};

export default SyncReviewPage;
