import React from 'react';
import Portal from 'components/Portal/index';
import toast from 'react-hot-toast';
import Modal from 'components/Modal/index';
import { useDispatch } from 'react-redux';
import StyledWrapper from './StyledWrapper';
import { deleteGlobalEnvironment } from 'providers/ReduxStore/slices/global-environments';
import { useTranslation } from 'react-i18next';

const DeleteEnvironment = ({ onClose, environment }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const onConfirm = () => {
    dispatch(deleteGlobalEnvironment({ environmentUid: environment.uid }))
      .then(() => {
        toast.success(t('ENVIRONMENTS.DELETE.SUCCESS'));
        onClose();
      })
      .catch(() => toast.error(t('ENVIRONMENTS.DELETE.ERROR')));
  };

  return (
    <Portal>
      <StyledWrapper>
        <Modal
          size="md"
          title={t('ENVIRONMENTS.DELETE.TITLE')}
          confirmText={t('ENVIRONMENTS.DELETE.CONFIRM')}
          handleConfirm={onConfirm}
          handleCancel={onClose}
        >
          {t('ENVIRONMENTS.DELETE.CONFIRM_MESSAGE', { name: environment.name })}
        </Modal>
      </StyledWrapper>
    </Portal>
  );
};

export default DeleteEnvironment;
