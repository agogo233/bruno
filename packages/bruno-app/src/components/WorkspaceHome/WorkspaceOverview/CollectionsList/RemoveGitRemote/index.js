import React from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import Modal from 'components/Modal';
import { disconnectCollectionFromGit } from 'providers/ReduxStore/slices/workspaces/actions';

const RemoveGitRemote = ({ collectionPath, collectionName, remoteUrl, onClose }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const activeWorkspaceUid = useSelector((state) => state.workspaces.activeWorkspaceUid);

  const handleConfirm = () => {
    dispatch(
      disconnectCollectionFromGit({
        workspaceUid: activeWorkspaceUid,
        collectionPath
      })
    )
      .then(() => {
        toast.success(t('WORKSPACE_HOME.REMOVE_GIT.REMOVED'));
        onClose();
      })
      .catch(() => {
        // toast already handled in the thunk
      });
  };

  return (
    <Modal
      size="md"
      title={t('WORKSPACE_HOME.REMOVE_GIT.TITLE')}
      confirmText={t('WORKSPACE_HOME.REMOVE_GIT.CONFIRM')}
      confirmButtonColor="primary"
      handleConfirm={handleConfirm}
      handleCancel={onClose}
    >
      <div className="text-sm leading-relaxed break-words">
        <p className="m-0">
          {t('WORKSPACE_HOME.REMOVE_GIT.CONFIRM_MESSAGE', { name: collectionName })}
        </p>
        {remoteUrl ? (
          <p className="mt-2 mb-0 font-mono text-xs text-muted break-all">{remoteUrl}</p>
        ) : null}
        <p className="mt-3 mb-0 text-xs text-muted">
          {t('WORKSPACE_HOME.REMOVE_GIT.DESCRIPTION')}
        </p>
      </div>
    </Modal>
  );
};

export default RemoveGitRemote;
