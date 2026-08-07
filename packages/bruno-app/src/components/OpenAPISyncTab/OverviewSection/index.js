import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { getTotalRequestCountInCollection } from 'utils/collections/';
import { countEndpoints } from '../utils';
import moment from 'moment';
import { IconCheck } from '@tabler/icons';
import Button from 'ui/Button';
import Help from 'components/Help';

const capitalize = (str) => str ? str.charAt(0).toUpperCase() + str.slice(1) : str;

const OVERVIEW_KEYS = {
  total: 'OVERVIEW.TOTAL_IN_COLLECTION',
  inSync: 'OVERVIEW.IN_SYNC_WITH_SPEC',
  changed: 'OVERVIEW.CHANGED_IN_COLLECTION',
  pending: 'OVERVIEW.SPEC_UPDATES_PENDING'
};

const OVERVIEW_TOOLTIPS = {
  total: 'OVERVIEW.TOTAL_TOOLTIP',
  inSync: 'OVERVIEW.IN_SYNC_TOOLTIP',
  changed: 'OVERVIEW.CHANGED_TOOLTIP',
  pending: 'OVERVIEW.PENDING_TOOLTIP'
};

const OVERVIEW_TABS = {
  changed: 'collection-changes',
  pending: 'spec-updates'
};

const OVERVIEW_COLORS = {
  total: 'blue',
  inSync: 'green',
  changed: 'muted',
  pending: 'amber'
};

const SUMMARY_CARDS = [
  {
    key: 'total',
    label: 'OVERVIEW_TOTAL',
    color: 'blue',
    tooltip: 'Total endpoints in your collection'
  },
  {
    key: 'inSync',
    label: 'In Sync with Spec',
    color: 'green',
    tooltip: 'Endpoints that currently match the latest spec from the source'
  },
  {
    key: 'changed',
    label: 'Changed in Collection',
    color: 'muted',
    tooltip: 'Endpoints modified, deleted, or added locally since last sync',
    tab: 'collection-changes'
  },
  {
    key: 'pending',
    label: 'Spec Updates Pending',
    color: 'amber',
    tooltip: 'Spec changes available to sync to your collection',
    tab: 'spec-updates'
  }
];

const OverviewSection = ({ collection, storedSpec, collectionDrift, specDrift, remoteDrift, onTabSelect, error, onOpenSettings }) => {
  const { t } = useTranslation();
  const openApiSyncConfig = collection?.brunoConfig?.openapi?.[0];

  const specMeta = useSelector((state) => state.openapiSync?.storedSpecMeta?.[collection.uid] || null);
  const activeError = error;

  const version = specMeta?.version;
  const endpointCount = specMeta?.endpointCount ?? null;
  const lastSyncDate = openApiSyncConfig?.lastSyncDate;
  const groupBy = openApiSyncConfig?.groupBy || 'tags';

  // Endpoint Summary counts
  // Total: from collection items in Redux; In Sync: from remote spec comparison
  // Changed/Conflicts: compare against stored spec in AppData (0 on initial sync)
  const hasDriftData = collectionDrift && !collectionDrift.noStoredSpec;

  const totalInCollection = getTotalRequestCountInCollection(collection);

  const inSyncCount = remoteDrift
    ? (remoteDrift.inSync?.length || 0)
    : null;

  const changedInCollection = hasDriftData
    ? (collectionDrift.modified?.length || 0) + (collectionDrift.missing?.length || 0) + (collectionDrift.localOnly?.length || 0)
    : 0;

  const specUpdatesPending = hasDriftData
    ? (specDrift?.added?.length || 0) + (specDrift?.modified?.length || 0) + (specDrift?.removed?.length || 0)
    : (remoteDrift?.modified?.length || 0) + (remoteDrift?.missing?.length || 0);

  // Conflict count: endpoints modified in both spec and collection
  const conflictCount = hasDriftData && specDrift?.modified
    ? (() => {
        const localModifiedIds = new Set((collectionDrift.modified || []).map((ep) => ep.id));
        return specDrift.modified.filter((ep) => localModifiedIds.has(ep.id)).length;
      })()
    : 0;

  const summaryValues = {
    total: totalInCollection,
    inSync: inSyncCount,
    changed: changedInCollection,
    pending: activeError ? null : specDrift ? specUpdatesPending : null
  };

  const details = [
    { label: t('OPENAPI_SYNC.OVERVIEW.SPEC_VERSION'), value: version ? `v${version}` : '–' },
    { label: t('OPENAPI_SYNC.OVERVIEW.ENDPOINTS_IN_SPEC'), value: endpointCount != null ? endpointCount : '–' },
    { label: t('OPENAPI_SYNC.OVERVIEW.LAST_SYNCED_AT'), value: lastSyncDate ? moment(lastSyncDate).fromNow() : '–', tooltip: lastSyncDate ? moment(lastSyncDate).format('MMMM D, YYYY [at] h:mm A') : undefined },
    { label: t('OPENAPI_SYNC.OVERVIEW.FOLDER_GROUPING'), value: capitalize(groupBy) }
  ];

  const hasCollectionChanges = changedInCollection > 0;
  const hasSpecUpdates = specUpdatesPending > 0;

  const bannerState = useMemo(() => {
    const versionInfo = (specDrift?.storedVersion && specDrift?.newVersion && specDrift.storedVersion !== specDrift.newVersion)
      ? ` (v${specDrift.storedVersion} → v${specDrift.newVersion})`
      : '';

    if (activeError) {
      return {
        variant: 'danger',
        title: t('OPENAPI_SYNC.OVERVIEW.FAILED_CHECK'),
        subtitle: activeError,
        buttons: ['open-settings']
      };
    }
    if (specDrift?.storedSpecMissing && !lastSyncDate) {
      return {
        variant: 'warning',
        title: t('OPENAPI_SYNC.OVERVIEW.INITIAL_SYNC_REQUIRED'),
        subtitle: t('OPENAPI_SYNC.OVERVIEW.INITIAL_SYNC_SUBTITLE'),
        buttons: ['review']
      };
    }
    if (hasSpecUpdates && hasCollectionChanges) {
      return {
        variant: 'warning',
        title: t('OPENAPI_SYNC.OVERVIEW.SPEC_COLLECTION_CHANGES', { version: versionInfo }),
        subtitle: t('OPENAPI_SYNC.OVERVIEW.SPEC_COLLECTION_SUBTITLE'),
        buttons: ['sync', 'changes']
      };
    }
    if (hasSpecUpdates) {
      return {
        variant: 'warning',
        title: t('OPENAPI_SYNC.OVERVIEW.SPEC_NEW_UPDATES', { version: versionInfo }),
        subtitle: t('OPENAPI_SYNC.OVERVIEW.NEW_REQUESTS_AVAILABLE'),
        buttons: ['sync']
      };
    }
    if (specDrift?.storedSpecMissing && lastSyncDate) {
      return {
        variant: 'warning',
        title: t('OPENAPI_SYNC.OVERVIEW.LAST_SYNCED_MISSING'),
        subtitle: t('OPENAPI_SYNC.OVERVIEW.LAST_SYNCED_MISSING_SUBTITLE'),
        buttons: ['spec-details']
      };
    }
    if (!hasDriftData) return null;
    if (hasCollectionChanges) {
      return {
        variant: 'muted',
        title: t('OPENAPI_SYNC.OVERVIEW.COLLECTION_CHANGES_TITLE'),
        subtitle: t('OPENAPI_SYNC.OVERVIEW.COLLECTION_CHANGES_SUBTITLE'),
        buttons: ['changes']
      };
    }
    return null;
  }, [activeError, hasDriftData, hasSpecUpdates, hasCollectionChanges, specDrift?.storedSpecMissing, specDrift?.storedVersion, specDrift?.newVersion, lastSyncDate]);

  return (
    <div className="overview-section">
      {bannerState && (
        <div className={`overview-status-banner ${bannerState.variant}`}>
          <div className="banner-text">
            <div className="banner-title-row">
              {bannerState.variant === 'success'
                ? <IconCheck size={16} className="status-check-icon" />
                : <div className={`status-dot ${bannerState.variant}`} />}
              <span className="banner-title">{bannerState.title}</span>
            </div>
            {bannerState.subtitle && (
              <p className="banner-subtitle">{bannerState.subtitle}</p>
            )}
          </div>
          {bannerState.buttons.length > 0 && (
            <div className="banner-button-row">
              {bannerState.buttons.includes('changes') && (
                <Button
                  size="sm"
                  variant={bannerState.buttons.includes('sync') ? 'outline' : 'filled'}
                  color={bannerState.buttons.includes('sync') ? 'secondary' : 'primary'}
                  onClick={() => onTabSelect('collection-changes')}
                >
                    {t('OPENAPI_SYNC.OVERVIEW.VIEW_COLLECTION_CHANGES')}
                </Button>
              )}
              {(bannerState.buttons.includes('sync') || bannerState.buttons.includes('review')) && (
                <Button size="sm" onClick={() => onTabSelect('spec-updates')}>
                    {t('OPENAPI_SYNC.OVERVIEW.REVIEW_AND_SYNC')}
                </Button>
              )}
              {bannerState.buttons.includes('spec-details') && (
                <Button variant="outline" size="sm" onClick={() => onTabSelect('spec-updates')}>
                    {t('OPENAPI_SYNC.OVERVIEW.GO_TO_SPEC_UPDATES')}
                </Button>
              )}
              {bannerState.buttons.includes('open-settings') && (
                <Button variant="outline" size="sm" onClick={onOpenSettings}>
                    {t('OPENAPI_SYNC.OVERVIEW.UPDATE_CONNECTION_SETTINGS')}
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      <h4 className="overview-section-title mt-5">{t('OPENAPI_SYNC.OVERVIEW.ENDPOINT_SUMMARY')}</h4>
      <div className="sync-summary-cards">
        {Object.entries(OVERVIEW_KEYS).map(([key, labelKey]) => {
          const count = summaryValues[key];
          const resolvedColor = count > 0 ? OVERVIEW_COLORS[key] : 'muted';
          const tab = OVERVIEW_TABS[key];
          const isClickable = tab && count > 0;
          return (
            <div
              className={`summary-card${isClickable ? ' clickable' : ''}`}
              key={key}
              onClick={isClickable ? () => onTabSelect(tab) : undefined}
            >
              <span className="card-info-icon">
                <Help icon="info" size={12} placement="top" width={220}>{t('OPENAPI_SYNC.' + OVERVIEW_TOOLTIPS[key])}</Help>
              </span>
              <div className="summary-count-row">
                <span className={`summary-count ${resolvedColor}`}>{count != null ? count : '–'}</span>
                {key === 'pending' && conflictCount > 0 && (
                  <span className="conflict-annotation">({conflictCount} {conflictCount === 1 ? t('OPENAPI_SYNC.REVIEW.CONFLICT') : t('OPENAPI_SYNC.REVIEW.CONFLICTS', { count: conflictCount })})</span>
                )}
              </div>
              <div className="summary-label">
                {t('OPENAPI_SYNC.' + labelKey)}
              </div>
            </div>
          );
        })}
      </div>

      <h4 className="overview-section-title mt-7">{t('OPENAPI_SYNC.OVERVIEW.LAST_SYNCED_SPEC_DETAILS')}</h4>
      <div className="spec-details-grid">
        {details.map(({ label, value, tooltip }) => (
          <div className="spec-detail-item" key={label}>
            <div className="spec-detail-label">{label}</div>
            <div className="spec-detail-value">
              {value}
              {tooltip && (
                <Help icon="info" size={11} placement="top" width={200}>{tooltip}</Help>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OverviewSection;
