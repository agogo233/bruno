import React from 'react';
import { IconFileOff } from '@tabler/icons';
import { useTranslation } from 'react-i18next';

const DotEnvEmptyState = () => {
  const { t } = useTranslation();
  return (
    <div className="empty-state">
      <IconFileOff size={48} strokeWidth={1.5} />
      <div className="title">{t('ENVIRONMENTS.DOT_ENV_EMPTY.TITLE')}</div>
      <div className="description">
        {t('ENVIRONMENTS.DOT_ENV_EMPTY.DESCRIPTION')}
      </div>
    </div>
  );
};

export default DotEnvEmptyState;
