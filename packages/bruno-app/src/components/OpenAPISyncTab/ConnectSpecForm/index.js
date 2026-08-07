import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { IconCheck } from '@tabler/icons';
import Button from 'ui/Button';
import { isHttpUrl } from 'utils/url/index';
import { isOpenApiSpec } from 'utils/importers/openapi-collection';
import { parseFileAsJsonOrYaml } from 'utils/importers/file-reader';

const ConnectSpecForm = ({ sourceUrl, setSourceUrl, isLoading, error, setError, onConnect }) => {
  const { t } = useTranslation();
  const [mode, setMode] = useState('url');
  const fileInputRef = useRef(null);

  return (
    <div className="setup-section">
      <div className="setup-header">
        <h2 className="setup-title">{t('OPENAPI_SYNC.CONNECT.TITLE')}</h2>
        <p className="setup-description">
          {t('OPENAPI_SYNC.CONNECT.DESCRIPTION')}
        </p>
      </div>

      <form
        className="setup-form"
        onSubmit={(e) => {
          e.preventDefault(); onConnect();
        }}
      >
        <label className="url-label">{t('OPENAPI_SYNC.CONNECT.LABEL')}</label>
        <div className="url-row">
          <div className="setup-mode-toggle">
            <button
              type="button"
              className={`setup-mode-btn ${mode === 'url' ? 'active' : ''}`}
              onClick={() => {
                setMode('url'); setSourceUrl('');
              }}
            >
              {t('OPENAPI_SYNC.CONNECT.URL_MODE')}
            </button>
            <button
              type="button"
              className={`setup-mode-btn ${mode === 'file' ? 'active' : ''}`}
              onClick={() => {
                setMode('file'); setSourceUrl('');
             }}
            >
              {t('OPENAPI_SYNC.CONNECT.FILE_MODE')}
            </button>
          </div>

          {mode === 'url' ? (
            <input
              type="text"
              className="url-input"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder={t('OPENAPI_SYNC.CONNECT.URL_MODE') + ': https://api.example.com/openapi.json'}
            />
          ) : (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.yaml,.yml"
                style={{ display: 'none' }}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setError(null);
                  setSourceUrl('');
                  try {
                    const data = await parseFileAsJsonOrYaml(file);
                    if (!isOpenApiSpec(data)) {
                      setError(t('OPENAPI_SYNC.CONNECT.ERROR_INVALID_OPENAPI'));
                      return;
                    }
                    if (data.swagger && String(data.swagger).startsWith('2')) {
                      setError(t('OPENAPI_SYNC.CONNECT.ERROR_SWAGGER_NOT_SUPPORTED'));
                      return;
                    }
                    const filePath = window.ipcRenderer.getFilePath(file);
                    if (filePath) setSourceUrl(filePath);
                  } catch (err) {
                    setError(err.message || t('OPENAPI_SYNC.CONNECT.ERROR_FILE_READ'));
                  }
                }}
              />
              <button
                type="button"
                className="url-input file-pick-btn"
                onClick={() => fileInputRef.current?.click()}
              >
                {sourceUrl ? sourceUrl.split(/[\\/]/).pop() : t('OPENAPI_SYNC.CONNECT.SELECT_FILE')}
              </button>
            </>
          )}

          <Button
            type="submit"
            size="sm"
            disabled={mode === 'url' ? !isHttpUrl(sourceUrl.trim()) : !sourceUrl.trim()}
            loading={isLoading}
          >
            {t('OPENAPI_SYNC.CONNECT.CONNECT')}
          </Button>
        </div>
        <p className="setup-hint">
          {mode === 'url'
            ? t('OPENAPI_SYNC.CONNECT.HINT_URL')
            : t('OPENAPI_SYNC.CONNECT.HINT_FILE')}
        </p>
        {error && (
          <p className="setup-error">{error}</p>
        )}
      </form>

      <div className="setup-features">
        {t('OPENAPI_SYNC.CONNECT.FEATURES', { returnObjects: true }).map((text, idx) => (
          <div className="setup-feature" key={idx}>
            <IconCheck size={16} />
            <span>{text}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ConnectSpecForm;
