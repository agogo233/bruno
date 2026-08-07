import React from 'react';
import { useTranslation } from 'react-i18next';
import { IconLoader2 } from '@tabler/icons';

const RequestTabPanelLoading = ({ name }) => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-muted">
      <IconLoader2 className="animate-spin" size={24} strokeWidth={1.5} />
      <span>{t('REQUEST_TAB_PANEL.LOADING_ITEM', { name: name ? `"${name}"` : t('REQUEST_TAB_PANEL.REQUEST') })}</span>
    </div>
  );
};

export default RequestTabPanelLoading;
