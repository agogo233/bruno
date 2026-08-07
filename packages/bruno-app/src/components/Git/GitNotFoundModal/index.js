import React from 'react';
import { useTranslation } from 'react-i18next';
import Modal from 'components/Modal/index';
import Portal from 'components/Portal/index';

const getOSName = (t) => {
  const platform = window.navigator.userAgentData?.platform || '';
  if (platform.startsWith('Win')) {
    return 'Windows';
  } else if (platform.startsWith('Mac')) {
    return 'macOS';
  } else if (platform.startsWith('Linux')) {
    return 'Linux';
  } else {
    return t('GIT.NOT_FOUND.YOUR_OS');
  }
};

const getDownloadUrl = (os) => {
  switch (os) {
    case 'Windows':
      return 'https://git-scm.com/download/win';
    case 'macOS':
      return 'https://git-scm.com/download/mac';
    case 'Linux':
      return 'https://git-scm.com/download/linux';
    default:
      return 'https://git-scm.com/download';
  }
};

const GitNotFoundModal = ({ onClose }) => {
  const { t } = useTranslation();
  const osName = getOSName(t);
  const downloadUrl = getDownloadUrl(osName);

  return (
    <Portal>
      <Modal
        size="sm"
        title={t('GIT.NOT_FOUND.TITLE')}
        handleCancel={onClose}
        hideFooter={true}
      >
        <div>
          <p>{t('GIT.NOT_FOUND.DESCRIPTION')}</p>
          <p className="mt-2">
            {t('GIT.NOT_FOUND.DOWNLOAD_FOR', { osName })}
          </p>
          <p>
            <span
              className="text-blue-600 cursor-pointer border-b border-blue-600"
              onClick={() => window.open(downloadUrl, '_blank')}
            >
              {t('GIT.NOT_FOUND.DOWNLOAD', { osName })}
            </span>
          </p>
        </div>
      </Modal>
    </Portal>
  );
};

export default GitNotFoundModal;
