import { useTranslation } from 'react-i18next';
import Portal from 'components/Portal';
import Modal from 'components/Modal';

const MockConfirmModal = ({
  title,
  confirmText,
  cancelText,
  onConfirm,
  onClose,
  confirmDisabled = false,
  confirmButtonColor,
  dataTestId,
  size = 'sm',
  children
}) => {
  const { t } = useTranslation();
  return (
    <Portal>
      <Modal
        size={size}
        title={title}
        confirmText={confirmText}
        cancelText={cancelText || t('MOCK_SERVER.CONFIRM_MODAL.CANCEL')}
        handleConfirm={onConfirm}
        handleCancel={onClose}
        confirmDisabled={confirmDisabled}
        confirmButtonColor={confirmButtonColor}
        dataTestId={dataTestId}
      >
        {children}
      </Modal>
    </Portal>
  );
};

export default MockConfirmModal;
