import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  IconCheck,
  IconPlus,
  IconTrash,
  IconArrowBackUp,
  IconExternalLink,
  IconAlertTriangle,
  IconInfoCircle,
  IconLoader2
} from '@tabler/icons';
import moment from 'moment';
import Button from 'ui/Button';
import StatusBadge from 'ui/StatusBadge';
import Modal from 'components/Modal';
import EndpointChangeSection from '../EndpointChangeSection';
import ExpandableEndpointRow from '../EndpointChangeSection/ExpandableEndpointRow';
import useEndpointActions from '../hooks/useEndpointActions';

const CollectionStatusSection = ({
  collection,
  collectionDrift,
  reloadDrift,
  specDrift,
  storedSpec,
  lastSyncDate,
  onOpenEndpoint,
  isLoading,
  onTabSelect
}) => {
  const { t } = useTranslation();
  const {
    pendingAction, setPendingAction,
    confirmPendingAction,
    handleResetEndpoint,
    handleResetAllModified,
    handleDeleteEndpoint,
    handleDeleteAllLocalOnly,
    handleRevertAllChanges,
    handleAddMissingEndpoint,
    handleAddAllMissing
  } = useEndpointActions(collection, collectionDrift, reloadDrift, t);

  const spec = storedSpec || specDrift?.newSpec;
  const hasStoredSpec = collectionDrift && !collectionDrift.noStoredSpec;
  const hasDrift = hasStoredSpec && (collectionDrift.modified?.length > 0
    || collectionDrift.missing?.length > 0
    || collectionDrift.localOnly?.length > 0);

  const renderDriftRow = (endpoint, idx, actions) => (
    <ExpandableEndpointRow
      key={endpoint.id}
      endpoint={endpoint}
      collectionPath={collection.pathname}
      newSpec={spec}
      showDecisions={false}
      diffLeftLabel={t('OPENAPI_SYNC.COLLECTION_STATUS.LAST_SYNCED_SPEC')}
      diffRightLabel={t('OPENAPI_SYNC.COLLECTION_STATUS.CURRENT_IN_COLLECTION')}
      swapDiffSides
      collectionUid={collection.uid}
      actions={actions}
    />
  );

  const modifiedCount = collectionDrift?.modified?.length || 0;
  const missingCount = collectionDrift?.missing?.length || 0;
  const localOnlyCount = collectionDrift?.localOnly?.length || 0;
  const version = specDrift?.storedVersion || storedSpec?.info?.version;

  const bannerState = useMemo(() => {
    if (hasDrift) {
      return {
        variant: 'muted',
        message: t('OPENAPI_SYNC.COLLECTION_STATUS.HAS_CHANGES'),
        badges: { modifiedCount, missingCount, localOnlyCount },
        actions: ['revert-all']
      };
    }
    return null;
  }, [hasDrift, modifiedCount, missingCount, localOnlyCount, version, lastSyncDate]);

  return (
    <div className="collection-status-section">
      {bannerState && (
        <div className={`spec-update-banner ${bannerState.variant}`}>
          <div className="banner-left">
            {bannerState.variant === 'success'
              ? <IconCheck size={16} className="status-check-icon" />
              : <div className={`status-dot ${bannerState.variant}`} />}
            <span className="banner-title">
              {bannerState.message}
            </span>
            {bannerState.badges && (
              <span className="banner-details">
                 {bannerState.badges.modifiedCount > 0 && <StatusBadge status="warning" radius="full">{t('OPENAPI_SYNC.COLLECTION_STATUS.MODIFIED', { count: bannerState.badges.modifiedCount })}</StatusBadge>}
                 {bannerState.badges.missingCount > 0 && <StatusBadge status="danger" radius="full">{t('OPENAPI_SYNC.COLLECTION_STATUS.DELETED', { count: bannerState.badges.missingCount })}</StatusBadge>}
                 {bannerState.badges.localOnlyCount > 0 && <StatusBadge status="muted" radius="full">{t('OPENAPI_SYNC.COLLECTION_STATUS.ADDED', { count: bannerState.badges.localOnlyCount })}</StatusBadge>}
              </span>
            )}
          </div>
          {bannerState.actions.includes('revert-all') && (
            <div className="banner-actions">
               <Button size="sm" variant="ghost" color="danger" onClick={handleRevertAllChanges}>
                 {t('OPENAPI_SYNC.COLLECTION_STATUS.REVERT_ALL_TO_SPEC')}
               </Button>
            </div>
          )}
        </div>
      )}

      {hasDrift && (
        <div className="sync-info-notice mt-4">
          <IconInfoCircle size={14} className="sync-info-icon" />
          <span><span className="whats-updated-title">{t('OPENAPI_SYNC.COLLECTION_STATUS.WHATS_TRACKED_TITLE')}</span>{t('OPENAPI_SYNC.COLLECTION_STATUS.WHATS_TRACKED_DESC')}</span>
        </div>
      )}

      {hasDrift ? (
        <div className="mt-5">
          {/* Modified in Collection */}
          <EndpointChangeSection
             title={t('OPENAPI_SYNC.SECTION.MODIFIED_IN_COLLECTION')}
            type="modified"
            endpoints={collectionDrift.modified || []}
            expandableLayout
            collectionUid={collection.uid}
            sectionKey="drift-modified"
            renderItem={(endpoint, idx) =>
              renderDriftRow(endpoint, idx, (
                <>
                   <Button size="xs" variant="ghost" onClick={() => onOpenEndpoint(endpoint.id)} title={t('OPENAPI_SYNC.ENDPOINT.OPEN_TOOLTIP')} icon={<IconExternalLink size={14} />}>
                    {t('OPENAPI_SYNC.ENDPOINT.OPEN')}
                  </Button>
                  <Button size="xs" variant="ghost" onClick={() => handleResetEndpoint(endpoint)} title={t('OPENAPI_SYNC.ENDPOINT.RESET_TOOLTIP')} icon={<IconArrowBackUp size={14} />}>
                    {t('OPENAPI_SYNC.ENDPOINT.RESET')}
                  </Button>
                </>
              ))}
            actions={(
              <Button
                size="xs"
                variant="outline"
                onClick={handleResetAllModified}
                title={t('OPENAPI_SYNC.ENDPOINT.RESET_ALL_TOOLTIP')}
                icon={<IconArrowBackUp size={14} />}
              >
                {t('OPENAPI_SYNC.ENDPOINT.RESET_ALL')}
              </Button>
            )}
          />

          {/* Deleted from Collection */}
          <EndpointChangeSection
             title={t('OPENAPI_SYNC.SECTION.DELETED_FROM_COLLECTION')}
            type="missing"
            endpoints={collectionDrift.missing || []}
            expandableLayout
            collectionUid={collection.uid}
            sectionKey="drift-missing"
            renderItem={(endpoint, idx) =>
              renderDriftRow(endpoint, idx, (
                <Button size="xs" variant="ghost" onClick={() => handleAddMissingEndpoint(endpoint)} title={t('OPENAPI_SYNC.ENDPOINT.RESTORE_TOOLTIP')} icon={<IconPlus size={14} />}>
                  {t('OPENAPI_SYNC.ENDPOINT.RESTORE')}
                </Button>
              ))}
            actions={(
              <Button
                size="xs"
                variant="outline"
                onClick={handleAddAllMissing}
                title={t('OPENAPI_SYNC.ENDPOINT.RESTORE_ALL_TOOLTIP')}
                icon={<IconPlus size={14} />}
              >
                {t('OPENAPI_SYNC.ENDPOINT.RESTORE_ALL')}
              </Button>
            )}
          />

          {/* Added to Collection */}
          <EndpointChangeSection
             title={t('OPENAPI_SYNC.SECTION.ADDED_TO_COLLECTION')}
            type="local-only"
            endpoints={collectionDrift.localOnly || []}
            expandableLayout
            collectionUid={collection.uid}
            sectionKey="drift-local-only"
            renderItem={(endpoint, idx) =>
              renderDriftRow(endpoint, idx, (
                <>
                   <Button size="xs" variant="ghost" onClick={() => onOpenEndpoint(endpoint.id)} title={t('OPENAPI_SYNC.ENDPOINT.OPEN_TOOLTIP')} icon={<IconExternalLink size={14} />}>
                    {t('OPENAPI_SYNC.ENDPOINT.OPEN')}
                  </Button>
                  <Button size="xs" variant="ghost" color="danger" onClick={() => handleDeleteEndpoint(endpoint)} title={t('OPENAPI_SYNC.ENDPOINT.DELETE_TOOLTIP')} icon={<IconTrash size={14} />}>
                    {t('OPENAPI_SYNC.ENDPOINT.DELETE')}
                  </Button>
                </>
              ))}
            actions={(
              <Button
                size="xs"
                variant="outline"
                color="danger"
                onClick={handleDeleteAllLocalOnly}
                title={t('OPENAPI_SYNC.ENDPOINT.DELETE_ALL_TOOLTIP')}
                icon={<IconTrash size={14} />}
              >
                {t('OPENAPI_SYNC.ENDPOINT.DELETE_ALL')}
              </Button>
            )}
          />
        </div>
      ) : isLoading ? (
        <div className="sync-review-empty-state mt-5">
          <IconLoader2 size={40} className="empty-state-icon animate-spin" />
          <h4>{t('OPENAPI_SYNC.COLLECTION_STATUS.CHECKING_UPDATES')}</h4>
          <p>{t('OPENAPI_SYNC.COLLECTION_STATUS.COMPARING_COLLECTION')}</p>
        </div>
      ) : !hasStoredSpec ? (
        <div className="sync-review-empty-state mt-5">
          <IconAlertTriangle size={40} className="empty-state-icon" />
          <h4>{lastSyncDate ? t('OPENAPI_SYNC.COLLECTION_STATUS.CANNOT_TRACK') : t('OPENAPI_SYNC.COLLECTION_STATUS.WAITING_INITIAL_SYNC')}</h4>
          <p>{lastSyncDate
            ? t('OPENAPI_SYNC.COLLECTION_STATUS.STORED_SPEC_MISSING')
            : t('OPENAPI_SYNC.COLLECTION_STATUS.ONCE_SYNCED')}
          </p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => onTabSelect('spec-updates')}>{t('OPENAPI_SYNC.COLLECTION_STATUS.GO_TO_SPEC_UPDATES')}</Button>
        </div>
      ) : (
        <div className="sync-review-empty-state mt-5">
          <IconCheck size={40} className="empty-state-icon" />
          <h4>{t('OPENAPI_SYNC.COLLECTION_STATUS.NO_CHANGES')}</h4>
          <p>{t('OPENAPI_SYNC.COLLECTION_STATUS.COLLECTION_MATCHES')}</p>
        </div>
      )}
      {/* Action confirmation modal */}
      {pendingAction && (
        <Modal size="sm" title={pendingAction.title} hideFooter={true} handleCancel={() => setPendingAction(null)}>
          <div className="action-confirm-modal">
            <p className="confirm-message">{pendingAction.message}</p>
            <div className="confirm-actions">
              <Button variant="ghost" onClick={() => setPendingAction(null)}>
                Cancel
              </Button>
              <Button
                color={pendingAction.type.includes('delete') ? 'danger' : 'primary'}
                onClick={confirmPendingAction}
              >
                Confirm
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default CollectionStatusSection;
