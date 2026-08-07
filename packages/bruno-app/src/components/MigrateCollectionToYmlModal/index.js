import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { migrateCollectionToYml, cancelMigrateCollectionToYml } from 'providers/ReduxStore/slices/collections/actions';
import { hideMigrateToYmlModal } from 'providers/ReduxStore/slices/collection-migration';
import { findCollectionByUid } from 'utils/collections';
import Modal from 'components/Modal';
import Portal from 'components/Portal';
import Button from 'ui/Button';
import StyledWrapper from './StyledWrapper';

const PHASE_LABELS = {
  parsing: 'parsing',
  writing: 'writing',
  finalizing: 'finalizing'
};

// Rendered at app level (AppProvider) and driven by the collectionMigration slice: the
// collection is removed from the store while it migrates, so a modal hosted under the
// collection UI would unmount mid-migration.
const MigrateCollectionToYmlModal = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const migration = useSelector((state) => state.collectionMigration);
  // Present while confirming; gone during migration — name/pathname come from the slice.
  const collection = useSelector((state) =>
    findCollectionByUid(state.collections.collections, migration.collectionUid)
  );
  const [isExporting, setIsExporting] = useState(false);

  if (migration.status === 'idle') {
    return null;
  }

  const isMigrating = migration.status === 'migrating' || migration.status === 'cancelling';
  const isCancelling = migration.status === 'cancelling';
  // Migration walks the whole collection tree on disk; kicking it off before the mount
  // finishes races with the watcher's initial scan and can leave the tree half-loaded.
  const isCollectionMounted = collection?.mountStatus === 'mounted';

  const handleMigrate = () => {
    dispatch(migrateCollectionToYml(migration.collectionUid)).catch(() => {});
  };

  const handleCancelMigration = () => {
    dispatch(cancelMigrateCollectionToYml(migration.collectionUid)).catch(() => {});
  };

  const handleClose = () => {
    dispatch(hideMigrateToYmlModal());
  };

  const handleExportBackup = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const { ipcRenderer } = window;
      const result = await ipcRenderer.invoke(
        'renderer:export-collection-zip',
        migration.collectionPathname,
        migration.collectionName
      );
      if (result?.success) {
        toast.success(t('MIGRATE_COLLECTION.BACKUP_EXPORTED'));
      }
    } catch (error) {
      toast.error(t('MIGRATE_COLLECTION.BACKUP_FAILED'));
    } finally {
      setIsExporting(false);
    }
  };

  const confirmDisabled = isMigrating ? isCancelling : isExporting || !isCollectionMounted;
  const progressPercent = migration.total ? Math.round((migration.current / migration.total) * 100) : 0;
  const progressLabel = migration.phase
    ? `${t(`MIGRATE_COLLECTION.PHASE_${migration.phase.toUpperCase()}`)}: ${migration.current}/${migration.total}`
    : t('MIGRATE_COLLECTION.PREPARING');

  return (
    <Portal>
      <StyledWrapper>
        <Modal
          size="md"
          title={t('MIGRATE_COLLECTION.TITLE')}
          confirmText={isMigrating ? (isCancelling ? t('MIGRATE_COLLECTION.CANCELLING') : t('COMMON.CANCEL')) : t('MIGRATE_COLLECTION.MIGRATE')}
          confirmButtonColor={isMigrating ? 'danger' : 'primary'}
          confirmDisabled={confirmDisabled}
          handleConfirm={isMigrating ? handleCancelMigration : handleMigrate}
          handleCancel={handleClose}
          hideCancel={isMigrating}
          hideClose={isMigrating}
          disableCloseOnOutsideClick={isMigrating}
          disableEscapeKey={isMigrating}
        >
          <div>
            <p>
              {t('MIGRATE_COLLECTION.DESCRIPTION', { collectionName: migration.collectionName })}
            </p>
            {isMigrating ? (
              <div
                className="migration-progress mt-4"
                data-testid="migration-progress"
                role="progressbar"
                aria-valuenow={progressPercent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={isCancelling ? t('MIGRATE_COLLECTION.ARIA_CANCELLING') : progressLabel}
              >
                <div className="migration-progress-track">
                  <div
                    className="migration-progress-fill"
                    data-testid="migration-progress-bar"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="migration-progress-label" data-testid="migration-progress-label">
                  {isCancelling ? t('MIGRATE_COLLECTION.CANCELLING_RESTORE') : progressLabel}
                </div>
              </div>
            ) : (
              <>
                <div className="mt-4 text-sm text-muted">
                  <p className="font-medium mb-2">{t('MIGRATE_COLLECTION.WHAT_WILL_HAPPEN')}:</p>
                  <ul className="list-disc ml-5 flex flex-col gap-1">
                    <li>{t('MIGRATE_COLLECTION.WHAT_HAPPEN_1')}</li>
                    <li>{t('MIGRATE_COLLECTION.WHAT_HAPPEN_2')}</li>
                    <li>{t('MIGRATE_COLLECTION.WHAT_HAPPEN_3')}</li>
                    <li>{t('MIGRATE_COLLECTION.WHAT_HAPPEN_4')}</li>
                  </ul>
                  {!isCollectionMounted && (
                    <p className="mt-3">{t('MIGRATE_COLLECTION.WAITING_FOR_LOAD')}</p>
                  )}
                </div>
                <div className="backup-section mt-4">
                  <div className="backup-section-head">
                    <span className="backup-section-title">{t('MIGRATE_COLLECTION.BACKUP')}</span>
                  </div>
                    <p className="backup-section-help">
                      {t('MIGRATE_COLLECTION.BACKUP_HELP')}
                  </p>
                  <div className="backup-section-action">
                    <Button
                      data-testid="export-collection-backup-button"
                      size="sm"
                      color="secondary"
                      variant="outline"
                      onClick={handleExportBackup}
                      disabled={isExporting}
                    >
                      {isExporting ? t('MIGRATE_COLLECTION.EXPORTING') : t('MIGRATE_COLLECTION.EXPORT_COLLECTION')}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </Modal>
      </StyledWrapper>
    </Portal>
  );
};

export default MigrateCollectionToYmlModal;
