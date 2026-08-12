import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from 'components/Modal';
import Portal from 'components/Portal';
import statusCodePhraseMap from 'components/ResponsePane/StatusCode/get-status-code-phrase';

const CreateExampleModal = ({ isOpen, onClose, onSave, title, initialName = '', showMockFields = false, confirmText }) => {
  const { t } = useTranslation();

  const defaultTitle = t('RESPONSE_EXAMPLE.CREATE_EXAMPLE_MODAL.DEFAULT_TITLE');
  const defaultConfirmText = t('RESPONSE_EXAMPLE.CREATE_EXAMPLE_MODAL.DEFAULT_CONFIRM_TEXT');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [nameError, setNameError] = useState('');
  const [statusCode, setStatusCode] = useState(200);
  const [bodyType, setBodyType] = useState('json');

  const handleNameChange = (e) => {
    setName(e.target.value);
    // Clear error when user starts typing
    if (nameError) {
      setNameError('');
    }
  };

  const handleConfirm = () => {
    if (name.trim()) {
      if (showMockFields) {
        onSave(name.trim(), description.trim(), { statusCode: Number(statusCode) || 200, bodyType });
      } else {
        onSave(name.trim(), description.trim());
      }
      // Reset form
      setName('');
      setDescription('');
      setNameError('');
      setStatusCode(200);
      setBodyType('json');
    } else {
      setNameError(t('RESPONSE_EXAMPLE.CREATE_EXAMPLE_MODAL.NAME_REQUIRED'));
    }
  };

  const handleClose = () => {
    // Reset form when closing
    setName('');
    setDescription('');
    setNameError('');
    setStatusCode(200);
    setBodyType('json');
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      setName(initialName);
      setDescription('');
      setNameError('');
      setStatusCode(200);
      setBodyType('json');
    }
  }, [isOpen, initialName]);

  if (!isOpen) {
    return null;
  }

  return (
    <Portal>
      <Modal
        size="md"
        title={title || defaultTitle}
        handleCancel={handleClose}
        handleConfirm={handleConfirm}
        confirmText={confirmText || defaultConfirmText}
        cancelText={t('COMMON.CANCEL')}
        isOpen={isOpen}
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="exampleName" className="block font-medium">
              {t('RESPONSE_EXAMPLE.CREATE_EXAMPLE_MODAL.NAME_LABEL')}<span className="text-red-600">*</span>
            </label>
            <input
              id="exampleName"
              type="text"
              className="textbox mt-2 w-full"
              value={name}
              onChange={handleNameChange}
              autoFocus
              required
              data-testid="create-example-name-input"
            />
            {nameError && (
              <div className="text-red-500 mt-1" data-testid="name-error">
                {nameError}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="exampleDescription" className="block font-medium">
              {t('RESPONSE_EXAMPLE.CREATE_EXAMPLE_MODAL.DESCRIPTION_LABEL')}
            </label>
            <textarea
              id="exampleDescription"
              className="textbox mt-2 w-full"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              data-testid="create-example-description-input"
            />
          </div>

          {showMockFields && (
            <>
              <div>
                <label htmlFor="statusCode" className="block font-medium">
                  {t('RESPONSE_EXAMPLE.CREATE_EXAMPLE_MODAL.STATUS_CODE_LABEL')}
                </label>
                <select
                  id="statusCode"
                  className="textbox mt-2 w-full"
                  value={statusCode}
                  onChange={(e) => setStatusCode(Number(e.target.value))}
                  data-testid="status-code-select"
                >
                  {Object.entries(statusCodePhraseMap).map(([code, phrase]) => (
                    <option key={code} value={code}>{code} {phrase}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="bodyType" className="block font-medium">
                  {t('RESPONSE_EXAMPLE.CREATE_EXAMPLE_MODAL.BODY_TYPE_LABEL')}
                </label>
                  <select
                    id="bodyType"
                    className="textbox mt-2 w-full"
                    value={bodyType}
                    onChange={(e) => setBodyType(e.target.value)}
                    data-testid="body-type-select"
                  >
                    <option value="json">{t('RESPONSE_EXAMPLE.CREATE_EXAMPLE_MODAL.BODY_TYPES.JSON')}</option>
                    <option value="text">{t('RESPONSE_EXAMPLE.CREATE_EXAMPLE_MODAL.BODY_TYPES.TEXT')}</option>
                    <option value="xml">{t('RESPONSE_EXAMPLE.CREATE_EXAMPLE_MODAL.BODY_TYPES.XML')}</option>
                    <option value="html">{t('RESPONSE_EXAMPLE.CREATE_EXAMPLE_MODAL.BODY_TYPES.HTML')}</option>
                  </select>
              </div>
            </>
          )}
        </div>
      </Modal>
    </Portal>
  );
};

export default CreateExampleModal;
