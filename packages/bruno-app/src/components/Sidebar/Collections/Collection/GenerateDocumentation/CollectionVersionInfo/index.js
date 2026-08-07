import React, { memo, Fragment } from 'react';
import { useTranslation } from 'react-i18next';

const CollectionVersionInfo = ({ name, version, folderCount = 0, requestCount = 0, environmentCount = 0 }) => {
  const { t } = useTranslation();
  const folderLabel = folderCount === 1 ? t('SIDEBAR.GENERATE_DOCS.FOLDER') : t('SIDEBAR.GENERATE_DOCS.FOLDERS');
  const requestLabel = requestCount === 1 ? t('SIDEBAR.GENERATE_DOCS.REQUEST_SINGULAR') : t('SIDEBAR.GENERATE_DOCS.REQUEST_PLURAL');

  return (
    <div className="version-info" data-testid="version-info">
      <div className="version-line">
        <span className="collection-name" data-testid="collection-name">{name}</span>
        <span className="version-value" data-testid="version-value">{t('SIDEBAR.GENERATE_DOCS.VERSION_LABEL', { version: version || t('SIDEBAR.GENERATE_DOCS.NOT_SET') })}</span>
      </div>
      <p className="version-summary" data-testid="version-summary">
        <span>{folderCount} {folderLabel}</span>
        <span className="version-dot" aria-hidden="true" />
        <span>{requestCount} {requestLabel}</span>
        {environmentCount === 0 ? (
          <Fragment>
            <span className="version-dot" aria-hidden="true" />
            <span>{t('SIDEBAR.GENERATE_DOCS.ENVIRONMENTS_COUNT', { count: 0 })}</span>
          </Fragment>
        ) : null}
      </p>
    </div>
  );
};

export default memo(CollectionVersionInfo);
