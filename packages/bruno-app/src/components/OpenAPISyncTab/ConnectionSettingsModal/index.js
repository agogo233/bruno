import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import Button from 'ui/Button';
import Modal from 'components/Modal';
import { isHttpUrl } from 'utils/url/index';
import { isOpenApiSpec } from 'utils/importers/openapi-collection';
import { parseFileAsJsonOrYaml } from 'utils/importers/file-reader';

const ConnectionSettingsModal = ({ collection, sourceUrl, onSave, onDisconnect, onClose }) => {
  const { t } = useTranslation();
  const openApiSyncConfig = collection?.brunoConfig?.openapi?.[0];
  const normalizedSourceUrl = (sourceUrl || '').trim();
  const isUrl = isHttpUrl(normalizedSourceUrl);
  const initialMode = isUrl ? 'url' : 'file';
  const [mode, setMode] = useState(initialMode);
  const [url, setUrl] = useState(isUrl ? normalizedSourceUrl : '');
  const [filePath, setFilePath] = useState(isUrl ? '' : normalizedSourceUrl);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef(null);

  const effectiveSource = mode === 'file' ? filePath : url.trim();
  const canSave = mode === 'file' ? !!effectiveSource : isHttpUrl(effectiveSource.trim());

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({ sourceUrl: effectiveSource });
      onClose();
    } catch (_) {
      // caller (handleSaveSettings) already shows a toast on failure
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      size="md"
      title={t('OPENAPI_SYNC.SETTINGS.TITLE')}
      hideFooter={true}
      handleCancel={onClose}
    >
      <div className="settings-modal">
        <div className="settings-body">
          <div className="settings-field">
            <label className="settings-label">{t('OPENAPI_SYNC.SETTINGS.SPEC_SOURCE')}</label>
            <div className="setup-mode-toggle" style={{ marginBottom: '8px' }}>
              <button
                type="button"
                className={`setup-mode-btn ${mode === 'url' ? 'active' : ''}`}
                onClick={() => setMode('url')}
              >
                {t('OPENAPI_SYNC.SETTINGS.URL_MODE')}
              </button>
              <button
                type="button"
                className={`setup-mode-btn ${mode === 'file' ? 'active' : ''}`}
                onClick={() => setMode('file')}
              >
                {t('OPENAPI_SYNC.SETTINGS.FILE_MODE')}
              </button>
            </div>

            {mode === 'url' ? (
              <input
                className="settings-input"
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder={t('OPENAPI_SYNC.SETTINGS.PLACEHOLDER_URL')}
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
                    if (file) {
                      try {
                        const data = await parseFileAsJsonOrYaml(file);
                        if (!isOpenApiSpec(data)) {
                          toast.error(t('OPENAPI_SYNC.SETTINGS.ERROR_INVALID_OPENAPI'));
                          return;
                        }
                        const path = window.ipcRenderer.getFilePath(file);
                        if (path) setFilePath(path);
                      } catch (err) {
                        toast.error(err.message || t('OPENAPI_SYNC.SETTINGS.ERROR_FILE_READ'));
                      }
                    }
                  }}
                />
                <button
                  type="button"
                  className="settings-input file-pick-btn"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {filePath ? filePath.split(/[\\/]/).pop() : t('OPENAPI_SYNC.SETTINGS.SELECT_FILE')}
                </button>
              </>
            )}
          </div>
        </div>

        <div className="settings-footer">
          <button className="disconnect-link" onClick={onDisconnect} type="button">
            {t('OPENAPI_SYNC.SETTINGS.DISCONNECT')}
          </button>
          <div className="settings-actions">
            <Button variant="ghost" color="secondary" size="sm" onClick={onClose}>{t('COMMON.CANCEL')}</Button>
            <Button size="sm" onClick={handleSave} loading={isSaving} disabled={!canSave || isSaving}>{t('COMMON.SAVE')}</Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ConnectionSettingsModal;
