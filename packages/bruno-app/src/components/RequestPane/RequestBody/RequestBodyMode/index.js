import React, { useMemo, useCallback } from 'react';
import get from 'lodash/get';
import {
  IconCaretDown,
  IconForms,
  IconBraces,
  IconCode,
  IconFileText,
  IconDatabase,
  IconFile,
  IconX
} from '@tabler/icons';
import MenuDropdown from 'ui/MenuDropdown';
import { useDispatch } from 'react-redux';
import { updateRequestBodyMode } from 'providers/ReduxStore/slices/collections';
import { humanizeRequestBodyMode } from 'utils/collections';
import StyledWrapper from './StyledWrapper';
import { updateRequestBody } from 'providers/ReduxStore/slices/collections/index';
import { toastError } from 'utils/common/error';
import { prettifyJsonString } from 'utils/common/index';
import xmlFormat from 'xml-formatter';
import { useTranslation } from 'react-i18next';

const DEFAULT_MODES = (t) => [
  {
    name: t('REQUEST_PANE.FORM'),
    options: [
      { id: 'multipartForm', label: t('REQUEST_PANE.MULTIPART_FORM'), leftSection: IconForms },
      { id: 'formUrlEncoded', label: t('REQUEST_PANE.FORM_URL_ENCODED'), leftSection: IconForms }
    ]
  },
  {
    name: t('REQUEST_PANE.RAW'),
    options: [
      { id: 'json', label: t('REQUEST_PANE.JSON'), leftSection: IconBraces },
      { id: 'xml', label: t('REQUEST_PANE.XML'), leftSection: IconCode },
      { id: 'text', label: t('REQUEST_PANE.TEXT'), leftSection: IconFileText },
      { id: 'sparql', label: t('REQUEST_PANE.SPARQL'), leftSection: IconDatabase }
    ]
  },
  {
    name: t('REQUEST_PANE.OTHER'),
    options: [
      { id: 'file', label: t('REQUEST_PANE.FILE_BINARY'), leftSection: IconFile },
      { id: 'none', label: t('REQUEST_PANE.NO_BODY'), leftSection: IconX }
    ]
  }
];

const RequestBodyMode = ({ item, collection }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const body = item.draft ? get(item, 'draft.request.body') : get(item, 'request.body');
  const bodyMode = body?.mode;

  const onModeChange = useCallback((value) => {
    dispatch(
      updateRequestBodyMode({
        itemUid: item.uid,
        collectionUid: collection.uid,
        mode: value
      })
    );
  }, [dispatch, item.uid, collection.uid]);

  const onPrettify = () => {
    if (body?.json && bodyMode === 'json') {
      try {
        const prettyBodyJson = prettifyJsonString(body.json);
        dispatch(
          updateRequestBody({
            content: prettyBodyJson,
            itemUid: item.uid,
            collectionUid: collection.uid
          })
        );
      } catch (e) {
        toastError(new Error(t('REQUEST_PANE.UNABLE_PRETTIFY_INVALID_JSON')));
      }
    } else if (body?.xml && bodyMode === 'xml') {
      try {
        const prettyBodyXML = xmlFormat(body.xml, { collapseContent: true });
        dispatch(
          updateRequestBody({
            content: prettyBodyXML,
            itemUid: item.uid,
            collectionUid: collection.uid
          })
        );
      } catch (e) {
        toastError(new Error(t('REQUEST_PANE.UNABLE_PRETTIFY_INVALID_XML')));
      }
    }
  };

  const menuItems = useMemo(() => {
    return DEFAULT_MODES(t).map((group) => ({
      ...group,
      options: group.options.map((option) => ({
        ...option,
        onClick: () => onModeChange(option.id)
      }))
    }));
  }, [onModeChange, t]);

  return (
    <StyledWrapper>
      <div className="inline-flex items-center cursor-pointer body-mode-selector" data-testid="request-body-mode-selector">
        <MenuDropdown
          items={menuItems}
          placement="bottom-end"
          selectedItemId={bodyMode}
          showGroupDividers={false}
          groupStyle="select"
          data-testid="request-body-mode-label"
        >
          <div className="flex items-center justify-center pl-3 py-1 select-none selected-body-mode">
            {humanizeRequestBodyMode(bodyMode)} <IconCaretDown className="caret ml-1" size={14} strokeWidth={2} />
          </div>
        </MenuDropdown>
      </div>
      {(bodyMode === 'json' || bodyMode === 'xml') && (
        <button className="ml-2" onClick={onPrettify}>
{t('REQUEST_PANE.PRETTIFY')}
        </button>
      )}
    </StyledWrapper>
  );
};
export default RequestBodyMode;
