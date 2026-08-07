import React from 'react';
import { useTranslation } from 'react-i18next';
import { IconAlertTriangle } from '@tabler/icons';
import Modal from 'components/Modal';
import Button from 'ui/Button';

const ConfirmCollectionClose = ({ collection, onCancel, onCloseWithoutSave, onSaveAndClose }) => {
  const { t } = useTranslation();
  return (
    <Modal
      size="md"
      title={t('REQUEST_TABS.CONFIRM_CLOSE.UNSAVED_CHANGES')}
      confirmText={t('REQUEST_TABS.CONFIRM_CLOSE.SAVE_AND_CLOSE')}
      cancelText={t('REQUEST_TABS.CONFIRM_CLOSE.CLOSE_WITHOUT_SAVING')}
      disableEscapeKey={true}
      disableCloseOnOutsideClick={true}
      closeModalFadeTimeout={150}
      handleCancel={onCancel}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
      }}
      hideFooter={true}
    >
      <div className="flex items-center font-normal">
        <IconAlertTriangle size={32} strokeWidth={1.5} className="text-yellow-600" />
        <h1 className="ml-2 text-lg font-medium">{t('REQUEST_TABS.CONFIRM_CLOSE.HOLD_ON')}</h1>
      </div>
      <div className="font-normal mt-4">
        {t('REQUEST_TABS.CONFIRM_CLOSE.UNSAVED_CHANGES_IN_COLLECTION', { name: collection.name })}
      </div>

      <div className="flex justify-between mt-6">
        <div>
          <Button color="danger" onClick={onCloseWithoutSave}>
            {t('REQUEST_TABS.CONFIRM_CLOSE.DONT_SAVE')}
          </Button>
        </div>
        <div className="flex gap-2">
          <Button color="secondary" variant="ghost" onClick={onCancel}>
            {t('REQUEST_TABS.CONFIRM_CLOSE.CANCEL')}
          </Button>
          <Button onClick={onSaveAndClose}>
            {t('REQUEST_TABS.CONFIRM_CLOSE.SAVE')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmCollectionClose;
