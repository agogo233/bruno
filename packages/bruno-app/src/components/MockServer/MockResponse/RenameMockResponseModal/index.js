import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Portal from 'components/Portal';
import Modal from 'components/Modal';

const RenameMockResponseModal = ({
  response,
  onClose,
  onConfirm,
  isSaving = false
}) => {
  const { t } = useTranslation();
  const inputRef = useRef();
  const [name, setName] = useState(response?.name || '');

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, []);

  const handleConfirm = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return;
    }

    onConfirm(trimmedName);
  };

  return (
    <Portal>
      <Modal
        size="sm"
        title={t('MOCK_SERVER.RESPONSE_RENAME_MODAL.TITLE')}
        confirmText={isSaving ? t('MOCK_SERVER.RESPONSE_RENAME_MODAL.RENAMING') : t('MOCK_SERVER.RESPONSE_RENAME_MODAL.RENAME')}
        cancelText={t('MOCK_SERVER.RESPONSE_RENAME_MODAL.CANCEL')}
        handleConfirm={handleConfirm}
        handleCancel={onClose}
        confirmDisabled={isSaving || !name.trim()}
        dataTestId="rename-mock-response-modal"
      >
        <div>
          <label htmlFor="mock-response-rename-name" className="block font-medium">
            {t('MOCK_SERVER.RESPONSE_RENAME_MODAL.NAME')}
          </label>
          <input
            id="mock-response-rename-name"
            ref={inputRef}
            type="text"
            className="textbox mt-2 w-full"
            value={name}
            onChange={(event) => setName(event.target.value)}
            data-testid="mock-response-rename-name-input"
          />
        </div>
      </Modal>
    </Portal>
  );
};

export default RenameMockResponseModal;
