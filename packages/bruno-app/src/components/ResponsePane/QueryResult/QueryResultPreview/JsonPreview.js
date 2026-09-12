import React from 'react';
import { useTranslation } from 'react-i18next';
import ReactJson from 'react-json-view';
import ErrorBanner from 'ui/ErrorBanner';
import { isHttpUrl } from 'utils/url';

const JsonPreview = ({ data, displayedTheme, onLinkClick }) => {
  const { t } = useTranslation();
  // Helper function to validate and parse JSON data
  const validateJsonData = (data) => {
    // If data is already an object or array, use it directly
    if (typeof data === 'object' && data !== null) {
      return { data, error: null };
    }

    // If data is a string, try to parse it
    if (typeof data === 'string') {
      try {
        const parsed = JSON.parse(data);
        return { data: parsed, error: null };
      } catch (e) {
        return { data: null, error: t('RESPONSE_PANE.QUERY_RESULT_PREVIEW.INVALID_JSON', { message: e.message }) };
      }
    }

    // For other types, return error
    return { data: null, error: t('RESPONSE_PANE.QUERY_RESULT_PREVIEW.INVALID_INPUT') };
  };

  // Validate and parse JSON data
  const jsonData = validateJsonData(data);

  // Show error if parsing failed
  if (jsonData.error) {
    return <ErrorBanner errors={[{ title: t('RESPONSE_PANE.QUERY_RESULT_PREVIEW.CANNOT_PREVIEW_JSON'), message: jsonData.error }]} />;
  }

  // Validate that data can be rendered as JSON tree
  if (jsonData.data === null || jsonData.data === undefined) {
    return <ErrorBanner errors={[{ title: t('RESPONSE_PANE.QUERY_RESULT_PREVIEW.CANNOT_PREVIEW_JSON'), message: t('RESPONSE_PANE.QUERY_RESULT_PREVIEW.NULL_DATA') }]} />;
  }

  if (typeof jsonData.data !== 'object') {
    return <ErrorBanner errors={[{ title: t('RESPONSE_PANE.QUERY_RESULT_PREVIEW.CANNOT_PREVIEW_JSON'), message: t('RESPONSE_PANE.QUERY_RESULT_PREVIEW.NOT_RENDERABLE') }]} />;
  }

  const handleSelect = (selection) => {
    if (typeof onLinkClick !== 'function' || !isHttpUrl(selection?.value)) {
      return;
    }

    onLinkClick(selection.value.trim());
  };

  return (
    <ReactJson
      src={jsonData.data}
      theme={displayedTheme === 'light' ? 'rjv-default' : 'monokai'}
      collapsed={1}
      displayDataTypes={false}
      displayObjectSize={true}
      enableClipboard={true}
      onSelect={handleSelect}
      name={false}
      style={{
        backgroundColor: 'transparent',
        fontSize: '12px',
        fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
        padding: '16px'
      }}
    />
  );
};

export default JsonPreview;
