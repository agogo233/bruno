import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import MockConfirmModal from 'components/MockServer/MockConfirmModal';
import { deleteMockServerInstance } from 'utils/mock-server/mock-server-instances';

const DeleteMockServerModal = ({ instance, onClose, onDeleted }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const handleConfirm = async () => {
    try {
      await dispatch(deleteMockServerInstance(instance.uid));
      toast.success(t('MOCK_SERVER.DELETE_MODAL.DELETED'));
      onDeleted?.();
      onClose();
    } catch {
      toast.error(t('MOCK_SERVER.DELETE_MODAL.DELETE_FAILED'));
    }
  };

  return (
    <MockConfirmModal
      title={t('MOCK_SERVER.DELETE_MODAL.TITLE')}
      confirmText={t('MOCK_SERVER.DELETE_MODAL.CONFIRM')}
      onConfirm={handleConfirm}
      onClose={onClose}
      confirmButtonColor="danger"
      dataTestId="delete-mock-server-modal"
    >
      {t('MOCK_SERVER.DELETE_MODAL.BODY', { name: instance.name })}
      {instance.sourceType === 'spec' ? (
        <div className="text-xs mt-3 opacity-70">{t('MOCK_SERVER.DELETE_MODAL.SPEC_NOTE')}</div>
      ) : null}
    </MockConfirmModal>
  );
};

export default DeleteMockServerModal;
