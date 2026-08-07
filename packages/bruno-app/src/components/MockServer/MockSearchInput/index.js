import React from 'react';
import { useTranslation } from 'react-i18next';
import { IconSearch } from '@tabler/icons';
import StyledWrapper from './StyledWrapper';

const MockSearchInput = ({ value, onChange, placeholder, className = '', ...rest }) => {
  const { t } = useTranslation();
  return (
    <StyledWrapper className={className}>
      <IconSearch size={14} stroke={1.5} aria-hidden="true" />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder || t('MOCK_SERVER.SEARCH_INPUT.PLACEHOLDER')}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
        {...rest}
      />
    </StyledWrapper>
  );
};

export default MockSearchInput;
