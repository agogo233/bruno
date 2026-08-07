import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { IconLoader2 } from '@tabler/icons';

const FullscreenLoader = ({ isLoading }) => {
  const [loadingMessage, setLoadingMessage] = useState('');
  const { t } = useTranslation();

  useEffect(() => {
    if (!isLoading) return;

    const messages = [
      t('SIDEBAR.POSTMAN_PACKAGE.LOADING_PROCESSING'),
      t('SIDEBAR.POSTMAN_PACKAGE.LOADING_ANALYZING'),
      t('SIDEBAR.POSTMAN_PACKAGE.LOADING_TRANSLATING'),
      t('SIDEBAR.POSTMAN_PACKAGE.LOADING_PREPARING'),
      t('SIDEBAR.POSTMAN_PACKAGE.LOADING_ALMOST_DONE')
    ];

    let messageIndex = 0;
    const interval = setInterval(() => {
      messageIndex = (messageIndex + 1) % messages.length;
      setLoadingMessage(messages[messageIndex]);
    }, 2000);

    setLoadingMessage(messages[0]);

    return () => clearInterval(interval);
  }, [isLoading, t]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm transition-all duration-300">
      <div className="flex flex-col items-center p-8 rounded-lg bg-white dark:bg-zinc-800 shadow-lg max-w-md text-center">
        <IconLoader2 className="animate-spin h-12 w-12 mb-4" strokeWidth={1.5} />
        <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-50 mb-2">{loadingMessage}</h3>
        <p className="text-zinc-500 dark:text-zinc-400">
          {t('SIDEBAR.POSTMAN_PACKAGE.LOADING_HINT')}
        </p>
      </div>
    </div>
  );
};

export default FullscreenLoader;
