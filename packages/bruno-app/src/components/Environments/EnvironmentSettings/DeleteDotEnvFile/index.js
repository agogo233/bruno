import React from 'react';
import Portal from 'components/Portal/index';
import Modal from 'components/Modal/index';
import StyledWrapper from './StyledWrapper';
import { useTranslation } from 'react-i18next';

const DeleteDotEnvFile = ({ onClose, onConfirm, filename = '.env' }) => {
  const { t } = useTranslation();
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Portal>
      <StyledWrapper>
        <Modal
          size="sm"
          title={t('ENVIRONMENTS.DELETE_DOT_ENV.TITLE', { filename })}
          confirmText={t('ENVIRONMENTS.DELETE_DOT_ENV.CONFIRM')}
          handleConfirm={handleConfirm}
          handleCancel={onClose}
          confirmButtonColor="danger"
        >
          {t('ENVIRONMENTS.DELETE_DOT_ENV.CONFIRM_MESSAGE', { filename })}
        </Modal>
      </StyledWrapper>
    </Portal>
  );
};

export default DeleteDotEnvFile;
