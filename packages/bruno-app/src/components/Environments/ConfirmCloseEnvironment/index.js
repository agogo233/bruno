import React from 'react';
import { IconAlertTriangle } from '@tabler/icons';
import Modal from 'components/Modal';
import Portal from 'components/Portal';
import Button from 'ui/Button';
import { useTranslation } from 'react-i18next';

const ConfirmCloseEnvironment = ({ onCancel, onCloseWithoutSave, onSaveAndClose, isGlobal, isDotEnv }) => {
  const { t } = useTranslation();
  let settingsLabel = t('ENVIRONMENTS.CONFIRM_CLOSE.COLLECTION_SETTINGS');
  if (isDotEnv) {
    settingsLabel = t('ENVIRONMENTS.CONFIRM_CLOSE.DOT_ENV_FILE');
  } else if (isGlobal) {
    settingsLabel = t('ENVIRONMENTS.CONFIRM_CLOSE.GLOBAL_SETTINGS');
  }

  return (
    <Portal>
      <Modal
        size="md"
        title={t('ENVIRONMENTS.CONFIRM_CLOSE.TITLE')}
        disableEscapeKey={true}
        disableCloseOnOutsideClick={true}
        closeModalFadeTimeout={150}
        handleCancel={onCancel}
        hideFooter={true}
      >
        <div className="flex items-center font-normal">
          <IconAlertTriangle size={32} strokeWidth={1.5} className="text-yellow-600" />
          <h1 className="ml-2 text-lg font-medium">{t('ENVIRONMENTS.CONFIRM_CLOSE.HOLD_ON')}</h1>
        </div>
        <div className="font-normal mt-4">
          {t('ENVIRONMENTS.CONFIRM_CLOSE.MESSAGE', { settingsLabel })}
        </div>

        <div className="flex justify-between mt-6">
          <div>
            <Button color="danger" onClick={onCloseWithoutSave} data-testid="env-unsaved-close-without-save">
              {t('ENVIRONMENTS.CONFIRM_CLOSE.DONT_SAVE')}
            </Button>
          </div>
          <div className="flex gap-2">
            <Button color="secondary" variant="ghost" onClick={onCancel} data-testid="env-unsaved-cancel">
              {t('ENVIRONMENTS.CONFIRM_CLOSE.CANCEL')}
            </Button>
            <Button onClick={onSaveAndClose} data-testid="env-unsaved-save-and-close">
              {t('ENVIRONMENTS.CONFIRM_CLOSE.SAVE')}
            </Button>
          </div>
        </div>
      </Modal>
    </Portal>
  );
};

export default ConfirmCloseEnvironment;
