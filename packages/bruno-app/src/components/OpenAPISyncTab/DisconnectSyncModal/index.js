import { useTranslation } from 'react-i18next';
import Button from 'ui/Button';
import Modal from 'components/Modal';

const DisconnectSyncModal = ({ onConfirm, onClose }) => {
  const { t } = useTranslation();
  return (
    <Modal
      size="sm"
      title={t('OPENAPI_SYNC.DISCONNECT.TITLE')}
      hideFooter={true}
      handleCancel={onClose}
    >
      <div className="disconnect-modal">
        <p className="disconnect-message">
          <>{t('OPENAPI_SYNC.DISCONNECT.MESSAGE')} </> <br /> <br />
          <>{t('OPENAPI_SYNC.DISCONNECT.MESSAGE_MORE')}</>
        </p>
        <div className="disconnect-actions">
          <Button variant="ghost" color="secondary" onClick={onClose}>
            {t('COMMON.CANCEL')}
          </Button>
          <Button color="danger" onClick={onConfirm}>
            {t('OPENAPI_SYNC.DISCONNECT.CONFIRM')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default DisconnectSyncModal;
