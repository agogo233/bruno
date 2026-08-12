import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Portal from 'components/Portal';
import Modal from 'components/Modal';
import statusCodePhraseMap from 'components/ResponsePane/StatusCode/get-status-code-phrase';
import {
  collectCollectionExamples,
  getMockResponseNameError,
  getMockResponseNameLengthError,
  getMockResponseDescriptionError,
  isMockResponseNameTaken
} from 'utils/mock-server/mock-responses';

const BODY_TYPES = [
  { value: 'json', labelKey: 'JSON' },
  { value: 'text', labelKey: 'TEXT' },
  { value: 'xml', labelKey: 'XML' },
  { value: 'html', labelKey: 'HTML' }
];

const CreateMockResponseModal = ({ collection, existingResponses = [], onCreate, onClose }) => {
  const { t } = useTranslation();
  const nameInputRef = useRef();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [statusCode, setStatusCode] = useState(200);
  const [bodyType, setBodyType] = useState('json');
  const [nameError, setNameError] = useState('');
  const [exampleError, setExampleError] = useState('');
  const [useExample, setUseExample] = useState(false);
  const [selectedExampleKey, setSelectedExampleKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const examples = useMemo(() => (
    collection ? collectCollectionExamples(collection) : []
  ), [collection]);

  const selectedExample = useMemo(() => {
    if (!selectedExampleKey) {
      return null;
    }

    return examples.find(({ item, example }) => `${item.uid}:${example.uid}` === selectedExampleKey) || null;
  }, [examples, selectedExampleKey]);

  // A picked example owns the response shape, so its values drive the (disabled) fields
  const linkedExample = useExample ? selectedExample : null;
  const nameValue = name || linkedExample?.example?.name || '';
  const statusValue = Number(linkedExample?.example?.response?.status) || statusCode;
  const bodyTypeValue = linkedExample?.example?.response?.body?.type || bodyType;
  const descriptionError = getMockResponseDescriptionError(description);

  useEffect(() => {
    if (nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, []);

  const handleConfirm = async () => {
    const trimmedName = nameValue.trim();

    const validationError = getMockResponseNameError(trimmedName);
    if (validationError) {
      setNameError(validationError);
      return;
    }

    if (isMockResponseNameTaken(existingResponses, trimmedName)) {
      setNameError('A mock response with this name already exists');
      return;
    }

    if (descriptionError) {
      return;
    }

    if (useExample && !selectedExample) {
      setExampleError(t('MOCK_SERVER.RESPONSE_CREATE_MODAL.SELECT_EXAMPLE'));
      return;
    }

    setIsSaving(true);
    try {
      await onCreate({
        name: trimmedName,
        description: description.trim(),
        statusCode: Number(statusValue) || 200,
        bodyType: bodyTypeValue,
        exampleSelection: linkedExample
      });
      onClose();
    } catch {
      setIsSaving(false);
    }
  };

  return (
    <Portal>
      <Modal
        size="md"
        title={t('MOCK_SERVER.RESPONSE_CREATE_MODAL.TITLE')}
        confirmText={isSaving ? t('MOCK_SERVER.RESPONSE_CREATE_MODAL.CREATING') : t('MOCK_SERVER.RESPONSE_CREATE_MODAL.CREATE')}
        confirmDisabled={isSaving}
        handleConfirm={handleConfirm}
        handleCancel={() => {
          if (!isSaving) {
            onClose();
          }
        }}
        dataTestId="create-mock-response-modal"
      >
        <form className="bruno-form" onSubmit={(event) => event.preventDefault()}>
          <div>
            <label htmlFor="mock-response-create-name" className="block font-medium">
              {t('MOCK_SERVER.RESPONSE_CREATE_MODAL.NAME')}
            </label>
            <input
              id="mock-response-create-name"
              type="text"
              ref={nameInputRef}
              className="block textbox w-full mt-2"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              value={nameValue}
              onChange={(event) => {
                setName(event.target.value);
                setNameError(getMockResponseNameLengthError(event.target.value) || '');
              }}
              data-testid="mock-response-create-name-input"
            />
            {nameError ? (
              <div className="text-red-500 mt-1">{nameError}</div>
            ) : null}
          </div>

          <div className="mt-4">
            <label htmlFor="mock-response-create-description" className="block font-medium">
              {t('MOCK_SERVER.RESPONSE_CREATE_MODAL.DESCRIPTION')}
            </label>
            <textarea
              id="mock-response-create-description"
              className="block textbox w-full mt-2"
              rows={2}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              data-testid="mock-response-create-description-input"
            />
            {descriptionError ? (
              <div className="text-red-500 mt-1">{descriptionError}</div>
            ) : null}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="mock-response-create-status" className="block font-medium">
                {t('MOCK_SERVER.RESPONSE_CREATE_MODAL.STATUS_CODE')}
              </label>
              <select
                id="mock-response-create-status"
                className="textbox w-full mt-2"
                value={statusValue}
                onChange={(event) => setStatusCode(Number(event.target.value))}
                disabled={Boolean(linkedExample)}
                data-testid="mock-response-create-status-input"
              >
                {Object.entries(statusCodePhraseMap).map(([code, phrase]) => (
                  <option key={code} value={code}>{code} {phrase}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="mock-response-create-body-type" className="block font-medium">
                {t('MOCK_SERVER.RESPONSE_CREATE_MODAL.BODY_TYPE')}
              </label>
              <select
                id="mock-response-create-body-type"
                className="textbox w-full mt-2"
                value={bodyTypeValue}
                onChange={(event) => setBodyType(event.target.value)}
                disabled={Boolean(linkedExample)}
              >
                {BODY_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>{t(`MOCK_SERVER.RESPONSE_CREATE_MODAL.BODY_TYPE_${type.labelKey}`)}</option>
                ))}
              </select>
            </div>
          </div>

          {examples.length > 0 ? (
            <div className="mt-4">
              <label className="flex items-start gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="mt-1 cursor-pointer"
                  checked={useExample}
                  onChange={(event) => {
                    setUseExample(event.target.checked);
                    setExampleError('');
                    if (!event.target.checked) {
                      setSelectedExampleKey('');
                    }
                  }}
                  data-testid="mock-response-use-example-checkbox"
                />
                <span>
                  <span className="block font-medium">{t('MOCK_SERVER.RESPONSE_CREATE_MODAL.COPY_FROM_EXAMPLE')}</span>
                  <span className="block text-xs opacity-70 mt-1">
                    {t('MOCK_SERVER.RESPONSE_CREATE_MODAL.COPY_FROM_EXAMPLE_DESC')}
                  </span>
                </span>
              </label>

              {useExample ? (
                <>
                  <select
                    className="textbox w-full mt-2"
                    value={selectedExampleKey}
                    onChange={(event) => {
                      setSelectedExampleKey(event.target.value);
                      setExampleError('');
                    }}
                    data-testid="mock-response-example-select"
                  >
                    <option value="">{t('MOCK_SERVER.RESPONSE_CREATE_MODAL.SELECT_EXAMPLE')}</option>
                    {examples.map(({ item, example }) => (
                      <option key={`${item.uid}-${example.uid}`} value={`${item.uid}:${example.uid}`}>
                        {example.name} ({item.name})
                      </option>
                    ))}
                  </select>
                  {exampleError ? (
                    <div className="text-red-500 mt-1">{exampleError}</div>
                  ) : null}
                </>
              ) : null}
            </div>
          ) : null}
        </form>
      </Modal>
    </Portal>
  );
};

export default CreateMockResponseModal;
