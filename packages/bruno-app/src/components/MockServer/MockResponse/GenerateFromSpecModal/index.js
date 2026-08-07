import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import MockConfirmModal from 'components/MockServer/MockConfirmModal';

const GenerateFromSpecModal = ({ specName, onClose, onConfirm, isGenerating }) => {
  const { t } = useTranslation();
  const [generateFromSchema, setGenerateFromSchema] = useState(true);

  return (
    <MockConfirmModal
      size="md"
      title={t('MOCK_SERVER.GENERATE_FROM_SPEC.TITLE')}
      confirmText={isGenerating ? t('MOCK_SERVER.GENERATE_FROM_SPEC.GENERATING') : t('MOCK_SERVER.GENERATE_FROM_SPEC.GENERATE')}
      onConfirm={() => onConfirm({ generateFromSchema })}
      onClose={onClose}
      confirmDisabled={isGenerating}
      dataTestId="mock-response-generate-from-spec-modal"
    >
      <div className="space-y-4">
        <p className="text-sm leading-relaxed">
          {t('MOCK_SERVER.GENERATE_FROM_SPEC.BODY', { name: specName || t('MOCK_SERVER.GENERATE_FROM_SPEC.THIS_API_SPEC') })}
        </p>

        <label className="flex items-start gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={generateFromSchema}
            onChange={(event) => setGenerateFromSchema(event.target.checked)}
            data-testid="mock-response-generate-from-schema-checkbox"
          />
          <span>
            {t('MOCK_SERVER.GENERATE_FROM_SPEC.GENERATE_BODIES')}
            <span className="block text-xs opacity-70 mt-1">
              {t('MOCK_SERVER.GENERATE_FROM_SPEC.GENERATE_BODIES_DESC')}
            </span>
          </span>
        </label>
      </div>
    </MockConfirmModal>
  );
};

export default GenerateFromSpecModal;
