import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import Modal from 'components/Modal';
import { useDispatch, useSelector } from 'react-redux';
import { IconAlertTriangle } from '@tabler/icons';
import { removeCollectionFromWorkspaceAction } from 'providers/ReduxStore/slices/workspaces/actions';
import { findCollectionByUid } from 'utils/collections/index';
import StyledWrapper from './StyledWrapper';

const DeleteCollection = ({ onClose, collectionUid, workspaceUid }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const [confirmText, setConfirmText] = useState('');
  const collection = useSelector((state) => findCollectionByUid(state.collections.collections, collectionUid));
  const workspace = useSelector((state) => state.workspaces.workspaces.find((w) => w.uid === workspaceUid));

  const isConfirmed = confirmText.trim().toLowerCase() === t('SIDEBAR.DELETE_COLLECTION.DELETE_WORD').toLowerCase();

  const onConfirm = async () => {
    if (!collection || !workspace) {
      toast.error(t('SIDEBAR.COMMON.ERROR_DELETING'));
      onClose();
      return;
    }

    try {
      await dispatch(removeCollectionFromWorkspaceAction(workspace.uid, collection.pathname, { deleteFiles: true }));
      toast.success(`Deleted "${collection.name}" collection`);
      onClose();
    } catch (error) {
      console.error('Error deleting collection:', error);
      toast.error(error.message || t('SIDEBAR.COMMON.ERROR_DELETING'));
    }
  };

  if (!collection) {
    return null;
  }

  return (
    <StyledWrapper>
      <Modal
        size="sm"
        title={t('SIDEBAR.DELETE_COLLECTION.TITLE')}
        confirmText={t('SIDEBAR.DELETE_COLLECTION.DELETE')}
        cancelText={t('SIDEBAR.DELETE_COLLECTION.CANCEL')}
        confirmButtonColor="danger"
        confirmDisabled={!isConfirmed}
        handleConfirm={onConfirm}
        handleCancel={onClose}
      >
        <p className="modal-description">
          {t('SIDEBAR.DELETE_COLLECTION.CONFIRM')} <strong>"{collection.name}"</strong>?
        </p>
        <div className="collection-info-card">
          <div className="collection-name">{collection.name}</div>
          <div className="collection-path">{collection.pathname}</div>
        </div>
        <p className="warning-text">
          {t('SIDEBAR.DELETE_COLLECTION.IRREVERSIBLE')}
        </p>
        <div className="delete-confirmation">
          <label htmlFor="delete-confirm-input">
            {t('SIDEBAR.DELETE_COLLECTION.TYPE')} <span className="delete-keyword">{t('SIDEBAR.DELETE_COLLECTION.DELETE_WORD')}</span> {t('SIDEBAR.DELETE_COLLECTION.TO_CONFIRM')}
          </label>
          <input
            id="delete-confirm-input"
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={t('SIDEBAR.DELETE_COLLECTION.DELETE_WORD')}
            autoComplete="off"
            autoFocus
          />
        </div>
      </Modal>
    </StyledWrapper>
  );
};

export default DeleteCollection;
