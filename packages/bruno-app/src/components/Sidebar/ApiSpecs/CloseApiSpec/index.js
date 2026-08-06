import React from 'react';
import toast from 'react-hot-toast';
import Modal from 'components/Modal';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { IconFileCode } from '@tabler/icons';
import { closeApiSpecFile } from 'providers/ReduxStore/slices/apiSpec';

const CloseApiSpec = ({ onClose, apiSpec }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const onConfirm = () => {
    dispatch(closeApiSpecFile({ uid: apiSpec.uid }))
      .then(() => {
        toast.success(t('SIDEBAR.CLOSE_API_SPEC.CLOSED'));
        onClose();
      })
      .catch(() => toast.error(t('SIDEBAR.COMMON.ERROR_CLOSING')));
  };

  return (
    <Modal size="sm" title={t('SIDEBAR.CLOSE_API_SPEC.TITLE')} confirmText={t('SIDEBAR.CLOSE_API_SPEC.CLOSE')} handleConfirm={onConfirm} handleCancel={onClose}>
      <div className="flex items-center">
        <IconFileCode size={18} strokeWidth={1.5} />
        <span className="ml-2 mr-4 font-semibold">{apiSpec.name}</span>
      </div>
      <div className="break-words text-xs mt-1">{apiSpec.pathname}</div>
      <div className="mt-4">
        {t('SIDEBAR.CLOSE_API_SPEC.CONFIRM')} <span className="font-semibold">{apiSpec.name}</span> in Bruno?
      </div>
      <div className="mt-4">
        {t('SIDEBAR.CLOSE_API_SPEC.HINT')}
      </div>
    </Modal>
  );
};

export default CloseApiSpec;
