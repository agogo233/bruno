import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { IconCaretDown, IconForms, IconBraces, IconCode, IconFileText, IconDatabase, IconFile, IconX } from '@tabler/icons';
import MenuDropdown from 'ui/MenuDropdown';
import { humanizeRequestBodyMode } from 'utils/collections';
import StyledWrapper from './StyledWrapper';

const BodyModeSelector = ({
  currentMode,
  onModeChange,
  modes,
  disabled = false,
  className = '',
  wrapperClassName = '',
  placement = 'bottom-end',
  'data-testid': testId
}) => {
  const { t } = useTranslation();

  const defaultModes = useMemo(() => [
    {
      name: t('BODY_MODE_SELECTOR.GROUP_FORM'),
      options: [
        { id: 'multipartForm', label: t('BODY_MODE_SELECTOR.MULTIPART_FORM'), leftSection: IconForms },
        { id: 'formUrlEncoded', label: t('BODY_MODE_SELECTOR.FORM_URL_ENCODED'), leftSection: IconForms }
      ]
    },
    {
      name: t('BODY_MODE_SELECTOR.GROUP_RAW'),
      options: [
        { id: 'json', label: t('BODY_MODE_SELECTOR.JSON'), leftSection: IconBraces },
        { id: 'xml', label: t('BODY_MODE_SELECTOR.XML'), leftSection: IconCode },
        { id: 'text', label: t('BODY_MODE_SELECTOR.TEXT'), leftSection: IconFileText },
        { id: 'sparql', label: t('BODY_MODE_SELECTOR.SPARQL'), leftSection: IconDatabase }
      ]
    },
    {
      name: t('BODY_MODE_SELECTOR.GROUP_OTHER'),
      options: [
        { id: 'file', label: t('BODY_MODE_SELECTOR.FILE_BINARY'), leftSection: IconFile },
        { id: 'none', label: t('BODY_MODE_SELECTOR.NO_BODY'), leftSection: IconX }
      ]
    }
  ], [t]);

  const effectiveModes = modes ?? defaultModes;

  const menuItems = useMemo(() => {
    return effectiveModes.map((group) => ({
      ...group,
      options: group.options.map((option) => ({
        ...option,
        onClick: () => onModeChange(option.id)
      }))
    }));
  }, [effectiveModes, onModeChange]);

  return (
    <StyledWrapper className={wrapperClassName}>
      <div className={`inline-flex items-center body-mode-selector ${disabled ? 'cursor-default' : 'cursor-pointer'}`}>
        <MenuDropdown
          items={menuItems}
          placement={placement}
          disabled={disabled}
          className={className}
          selectedItemId={currentMode}
          showGroupDividers={false}
          groupStyle="select"
          data-testid={testId}
        >
          <div className="flex items-center justify-center pl-3 py-1 select-none selected-body-mode">
            {humanizeRequestBodyMode(currentMode)}
            {' '}
            <IconCaretDown className="caret ml-2" size={14} strokeWidth={2} />
          </div>
        </MenuDropdown>
      </div>
    </StyledWrapper>
  );
};

export default BodyModeSelector;
