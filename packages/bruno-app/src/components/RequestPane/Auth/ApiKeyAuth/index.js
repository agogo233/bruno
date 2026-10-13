import React, { useRef, forwardRef, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import get from 'lodash/get';
import { IconCaretDown } from '@tabler/icons';
import Dropdown from 'components/Dropdown';
import { useTheme } from 'providers/Theme';
import SingleLineEditor from 'components/SingleLineEditor';
import SensitiveFieldWarning from 'components/SensitiveFieldWarning';
import { useDetectSensitiveField } from 'hooks/useDetectSensitiveField';
import { sendRequest } from 'providers/ReduxStore/slices/collections/actions';
import StyledWrapper from './StyledWrapper';
import { humanizeRequestAPIKeyPlacement } from 'utils/collections';
import { useTranslation } from 'react-i18next';

const ApiKeyAuth = ({ item, collection, updateAuth, request, save, disabled }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { storedTheme } = useTheme();
  const dropdownTippyRef = useRef();
  const onDropdownCreate = (ref) => (dropdownTippyRef.current = ref);

  const apikeyAuth = get(request, 'auth.apikey', {});
  const { isSensitive } = useDetectSensitiveField(collection);
  const apiKeyValueSensitive = isSensitive(apikeyAuth.value, item);

  const handleRun = () => dispatch(sendRequest(item, collection.uid));

  const handleSave = () => {
    save();
  };

  const Icon = forwardRef((props, ref) => {
    return (
      <div ref={ref} data-testid="auth-placement-label" className="flex items-center justify-end auth-type-label select-none">
        {humanizeRequestAPIKeyPlacement(apikeyAuth?.placement)}
        <IconCaretDown className="caret ml-1 mr-1" size={14} strokeWidth={2} />
      </div>
    );
  });

  const handleAuthChange = (property, value) => {
    if (disabled) {
      return;
    }
    dispatch(
      updateAuth({
        mode: 'apikey',
        collectionUid: collection.uid,
        itemUid: item.uid,
        content: {
          ...apikeyAuth,
          [property]: value
        }
      })
    );
  };

  useEffect(() => {
    !disabled
    && !apikeyAuth?.placement
    && dispatch(
      updateAuth({
        mode: 'apikey',
        collectionUid: collection.uid,
        itemUid: item.uid,
        content: {
          placement: 'header'
        }
      })
    );
  }, [apikeyAuth, disabled]);

  return (
    <StyledWrapper className="w-full">
      <label className="block mb-1">{t('REQUEST_PANE.AUTH.KEY')}</label>
      <div className="single-line-editor-wrapper mb-3">
        <SingleLineEditor
          value={apikeyAuth.key || ''}
          theme={storedTheme}
          onSave={handleSave}
          onChange={(val) => handleAuthChange('key', val)}
          onRun={handleRun}
          collection={collection}
          readOnly={disabled}
          isCompact
        />
      </div>

      <label className="block mb-1">{t('REQUEST_PANE.AUTH.VALUE')}</label>
      <div className="single-line-editor-wrapper mb-3 flex items-center">
        <SingleLineEditor
          value={apikeyAuth.value || ''}
          theme={storedTheme}
          onSave={handleSave}
          onChange={(val) => handleAuthChange('value', val)}
          onRun={handleRun}
          collection={collection}
          item={item}
          isSecret={true}
          isCompact
          readOnly={disabled}
        />
        {apiKeyValueSensitive.showWarning && (
          <SensitiveFieldWarning fieldName="apikey-value" warningMessage={apiKeyValueSensitive.warningMessage} />
        )}
      </div>

      <label className="block mb-1">{t('REQUEST_PANE.AUTH.ADD_TO')}</label>
      <div data-testid="auth-placement-selector" className="inline-flex items-center cursor-pointer auth-placement-selector w-fit">
        <Dropdown onCreate={onDropdownCreate} icon={<Icon />} placement="bottom-end">
          <div
            className="dropdown-item"
            onClick={() => {
              dropdownTippyRef?.current?.hide();
              handleAuthChange('placement', 'header');
            }}
          >
            {t('REQUEST_PANE.AUTH.HEADER')}
          </div>
          <div
            className="dropdown-item"
            onClick={() => {
              dropdownTippyRef?.current?.hide();
              handleAuthChange('placement', 'queryparams');
            }}
          >
            {t('REQUEST_PANE.AUTH.QUERY_PARAM')}
          </div>
        </Dropdown>
      </div>
    </StyledWrapper>
  );
};

export default ApiKeyAuth;
