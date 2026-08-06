import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import Modal from 'components/Modal';
import { useDispatch, useSelector } from 'react-redux';
import { moveCollectionToWorkspace } from 'providers/ReduxStore/slices/collections/actions';
import { findCollectionByUid, flattenItems, isItemARequest, hasRequestChanges } from 'utils/collections/index';
import filter from 'lodash/filter';
import brunoPath from 'utils/common/path';
import ConfirmMoveDrafts from './ConfirmMoveDrafts';
import StyledWrapper from './StyledWrapper';

const MoveToWorkspace = ({ onClose, collectionUid }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const collection = useSelector((state) => findCollectionByUid(state.collections.collections, collectionUid));
  const activeWorkspace = useSelector((state) =>
    state.workspaces.workspaces.find((w) => w.uid === state.workspaces.activeWorkspaceUid)
  );
  const [isMoving, setIsMoving] = useState(false);

  // Detect unsaved drafts in the collection
  const drafts = useMemo(() => {
    if (!collection) return [];
    const items = flattenItems(collection.items);
    return filter(items, (item) => isItemARequest(item) && hasRequestChanges(item));
  }, [collection]);

  const onConfirm = () => {
    if (!collection) {
      toast.error(t('SIDEBAR.COMMON.ERROR_OCCURRED'));
      onClose();
      return;
    }
    if (isMoving) {
      return;
    }
    setIsMoving(true);
    dispatch(moveCollectionToWorkspace(collection.uid))
      .then(() => {
        toast.success(t('SIDEBAR.MOVE_TO_WORKSPACE.MOVED'));
        onClose();
      })
      .catch((err) => {
        toast.error(err?.message || t('SIDEBAR.COMMON.ERROR_MOVING'));
        setIsMoving(false);
      });
  };

  if (!collection) {
    return <div>Collection not found</div>;
  }

  if (!activeWorkspace?.pathname) {
    return null;
  }

  // Save or discard unsaved drafts before moving
  if (drafts.length > 0) {
    return <ConfirmMoveDrafts onClose={onClose} collection={collection} collectionUid={collectionUid} />;
  }

  const targetLocation = brunoPath.join(activeWorkspace.pathname, 'collections');

  return (
    <StyledWrapper>
      <Modal
        size="sm"
        title={t('SIDEBAR.MOVE_TO_WORKSPACE.TITLE')}
        confirmText={isMoving ? t('SIDEBAR.MOVE_TO_WORKSPACE.MOVING') : t('SIDEBAR.MOVE_TO_WORKSPACE.MOVE')}
        confirmDisabled={isMoving}
        handleConfirm={onConfirm}
        handleCancel={onClose}
      >
        <p className="mb-4">
          {t('SIDEBAR.MOVE_TO_WORKSPACE.HINT')} {activeWorkspace?.name} {t('SIDEBAR.MOVE_TO_WORKSPACE.WORKSPACE')}
        </p>
        <div className="collection-info-card">
          <div className="collection-name">{collection.name}</div>
          <div className="collection-path">{collection.pathname}</div>
        </div>
        <div className="mt-3 collection-info-card">
          <div className="collection-label">{t('SIDEBAR.MOVE_TO_WORKSPACE.DESTINATION')}</div>
          <div className="collection-path">{targetLocation}</div>
        </div>
        <p className="mt-4 text-muted text-sm">
          {t('SIDEBAR.MOVE_TO_WORKSPACE.RELOAD_HINT')}
        </p>
      </Modal>
    </StyledWrapper>
  );
};

export default MoveToWorkspace;
