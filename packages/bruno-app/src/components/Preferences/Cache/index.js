import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { savePreferences, clearHttpHttpsAgentCache } from 'providers/ReduxStore/slices/app';
import toast from 'react-hot-toast';
import get from 'lodash/get';
import { IconEraser } from '@tabler/icons';
import { useTheme } from 'providers/Theme';
import ToggleSwitch from 'components/ToggleSwitch';
import ActionIcon from 'ui/ActionIcon';
import StyledWrapper from './StyledWrapper';
import { formatSize } from 'utils/common';

const Cache = () => {
  const { t } = useTranslation();
  const preferences = useSelector((state) => state.app.preferences);
  const dispatch = useDispatch();
  const { theme } = useTheme();
  const { ipcRenderer } = window;

  const fileCacheEnabled = get(preferences, 'cache.file.enabled', false);
  const sslSessionEnabled = get(preferences, 'cache.sslSession.enabled', false);

  const [fileCacheSize, setFileCacheSize] = useState(null);

  const refreshFileCacheSize = useCallback(() => {
    if (!ipcRenderer) return;
    ipcRenderer
      .invoke('renderer:get-file-cache-size')
      .then((size) => setFileCacheSize(size))
      .catch(() => setFileCacheSize(null));
  }, [ipcRenderer]);

  useEffect(() => {
    refreshFileCacheSize();
  }, [refreshFileCacheSize, fileCacheEnabled]);

  const persist = (next) => {
    dispatch(savePreferences({ ...preferences, cache: next })).catch(() => {
      toast.error(t('CACHE.FAILED_UPDATE'));
    });
  };

  const handleToggleFileCache = () => {
    persist({
      ...preferences.cache,
      file: { enabled: !fileCacheEnabled }
    });
  };

  const handleToggleSslSession = () => {
    const next = !sslSessionEnabled;
    persist({
      ...preferences.cache,
      sslSession: { enabled: next }
    });
    if (!next) {
      dispatch(clearHttpHttpsAgentCache()).catch(() => {});
    }
  };

  const handleClearFileCache = () => {
    if (!ipcRenderer) return;
    ipcRenderer
      .invoke('renderer:clear-file-cache')
      .then((size) => {
        setFileCacheSize(size);
        toast.success(t('CACHE.FILE_CACHE_CLEARED'));
      })
      .catch(() => toast.error(t('CACHE.FAILED_CLEAR_FILE')));
  };

  const handleClearSslSession = () => {
    dispatch(clearHttpHttpsAgentCache())
      .then(() => toast.success(t('CACHE.SSL_CACHE_CLEARED')))
      .catch(() => toast.error(t('CACHE.FAILED_CLEAR_SSL')));
  };

  return (
    <StyledWrapper className="w-full">
      <div className="cache-section-title">{t('CACHE.HEADER')}</div>

      <div className="cache-item">
        <div className="cache-item-header">
          <div className="cache-item-title-group">
            <span className="cache-item-title">{t('CACHE.FILE_CACHE')}</span>
            <span className="beta-badge">{t('CACHE.BETA')}</span>
          </div>
          <ToggleSwitch
            data-testid="cache.file.enabled"
            isOn={fileCacheEnabled}
            handleToggle={handleToggleFileCache}
            size="2xs"
            activeColor={theme.primary.solid}
          />
        </div>
        <div className="cache-item-body">
          <div className="cache-item-body-text">
            <p className="cache-item-description">
              {t('CACHE.FILE_CACHE_DESC')}
            </p>
            <p className="cache-item-size">
              {t('CACHE.CACHE_SIZE')} <strong>{fileCacheSize == null ? '—' : formatSize(fileCacheSize)}</strong>
            </p>
          </div>
          <ActionIcon
            label={t('CACHE.CLEAR_CACHE')}
            onClick={handleClearFileCache}
            disabled={!fileCacheSize}
            colorOnHover={theme.colors.text.danger}
          >
            <IconEraser size={16} strokeWidth={1.5} />
          </ActionIcon>
        </div>
      </div>

      <div className="cache-item">
        <div className="cache-item-header">
          <div className="cache-item-title-group">
            <span className="cache-item-title">{t('CACHE.SSL_SESSION_CACHE')}</span>
          </div>
          <ToggleSwitch
            data-testid="sslSession.enabled"
            isOn={sslSessionEnabled}
            handleToggle={handleToggleSslSession}
            size="2xs"
            activeColor={theme.primary.solid}
          />
        </div>
        <div className="cache-item-body">
          <div className="cache-item-body-text">
            <p className="cache-item-description">
              {t('CACHE.SSL_CACHE_DESC')}
            </p>
          </div>
          <ActionIcon
            label={t('CACHE.CLEAR_CACHE')}
            onClick={handleClearSslSession}
            colorOnHover={theme.colors.text.danger}
          >
            <IconEraser size={16} strokeWidth={1.5} />
          </ActionIcon>
        </div>
      </div>
    </StyledWrapper>
  );
};

export default Cache;
