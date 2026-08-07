import React, { useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import get from 'lodash/get';
import { IconCaretDown } from '@tabler/icons';
import MenuDropdown from 'ui/MenuDropdown';
import StatusBadge from 'ui/StatusBadge/index';
import { useDispatch } from 'react-redux';
import { updateRequestAuthMode } from 'providers/ReduxStore/slices/collections';
import { humanizeRequestAuthMode } from 'utils/collections';
import StyledWrapper from './StyledWrapper';

const AuthMode = ({ item, collection }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const authMode = item.draft ? get(item, 'draft.request.auth.mode') : get(item, 'request.auth.mode');

  const onModeChange = useCallback((value) => {
    dispatch(
      updateRequestAuthMode({
        itemUid: item.uid,
        collectionUid: collection.uid,
        mode: value
      })
    );
  }, [dispatch, item.uid, collection.uid]);

  const menuItems = useMemo(() => [
    {
      id: 'awsv4',
      label: t('REQUEST_PANE.AUTH.AWS_SIG_V4'),
      onClick: () => onModeChange('awsv4')
    },
    {
      id: 'basic',
      label: t('REQUEST_PANE.AUTH.BASIC'),
      onClick: () => onModeChange('basic')
    },
    {
      id: 'bearer',
      label: t('REQUEST_PANE.AUTH.BEARER'),
      onClick: () => onModeChange('bearer')
    },
    {
      id: 'digest',
      label: t('REQUEST_PANE.AUTH.DIGEST'),
      onClick: () => onModeChange('digest')
    },
    {
      id: 'ntlm',
      label: t('REQUEST_PANE.AUTH.NTLM'),
      onClick: () => onModeChange('ntlm')
    },
    {
      id: 'oauth1',
      label: t('REQUEST_PANE.AUTH.OAUTH_1'),
      onClick: () => onModeChange('oauth1')
    },
    {
      id: 'oauth2',
      label: t('REQUEST_PANE.AUTH.OAUTH_2'),
      onClick: () => onModeChange('oauth2')
    },
    {
      id: 'wsse',
      label: t('REQUEST_PANE.AUTH.WSSE'),
      onClick: () => onModeChange('wsse')
    },
    {
      id: 'apikey',
      label: t('REQUEST_PANE.AUTH.API_KEY'),
      onClick: () => onModeChange('apikey')
    },
    {
      id: 'akamai-edgegrid',
      label: (
        <span className="flex items-center gap-2">
          {t('REQUEST_PANE.AUTH.EDGEGRID')}
          <StatusBadge status="info" size="xs">{t('REQUEST_PANE.AUTH.BETA')}</StatusBadge>
        </span>
      ),
      ariaLabel: `${t('REQUEST_PANE.AUTH.EDGEGRID')} (${t('REQUEST_PANE.AUTH.BETA')})`,
      onClick: () => onModeChange('akamai-edgegrid')
    },
    {
      id: 'inherit',
      label: t('REQUEST_PANE.AUTH.INHERIT'),
      onClick: () => onModeChange('inherit')
    },
    {
      id: 'none',
      label: t('REQUEST_PANE.AUTH.NO_AUTH'),
      onClick: () => onModeChange('none')
    }
  ], [onModeChange, t]);

  return (
    <StyledWrapper>
      <div className="inline-flex items-center cursor-pointer auth-mode-selector" data-testid="auth-mode-selector">
        <MenuDropdown
          items={menuItems}
          placement="bottom-end"
          selectedItemId={authMode}
          showTickMark={true}
          data-testid="auth-mode-dropdown"
        >
          <div className="flex items-center justify-center auth-mode-label select-none" data-testid="auth-mode-label">
            {humanizeRequestAuthMode(authMode)} <IconCaretDown className="caret ml-1" size={14} strokeWidth={2} />
          </div>
        </MenuDropdown>
      </div>
    </StyledWrapper>
  );
};
export default AuthMode;
