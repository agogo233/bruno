import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import get from 'lodash/get';
import isEqual from 'lodash/isEqual';

const VisualDiffAuth = ({ oldData, newData, showSide }) => {
  const { t } = useTranslation();
  const oldAuth = get(oldData, 'request.auth', {});
  const newAuth = get(newData, 'request.auth', {});

  const currentAuth = showSide === 'old' ? oldAuth : newAuth;
  const otherAuth = showSide === 'old' ? newAuth : oldAuth;

  const authTypes = useMemo(() => {
    const types = new Set([...Object.keys(currentAuth), ...Object.keys(otherAuth)]);
    types.delete('mode');
    return Array.from(types);
  }, [currentAuth, otherAuth]);

  const authSections = useMemo(() => {
    return authTypes.map((authType) => {
      const rawCurrentConfig = currentAuth[authType];
      const rawOtherConfig = otherAuth[authType];
      const currentConfig = (typeof rawCurrentConfig === 'object' && rawCurrentConfig !== null) ? rawCurrentConfig : {};
      const otherConfig = (typeof rawOtherConfig === 'object' && rawOtherConfig !== null) ? rawOtherConfig : {};

      if (Object.keys(currentConfig).length === 0 && showSide === 'old') {
        return null;
      }
      if (Object.keys(currentConfig).length === 0 && showSide === 'new') {
        return null;
      }

      let sectionStatus = 'unchanged';
      if (Object.keys(otherConfig).length === 0) {
        sectionStatus = showSide === 'old' ? 'deleted' : 'added';
      } else if (!isEqual(currentConfig, otherConfig)) {
        sectionStatus = 'modified';
      }

      const allFields = new Set([...Object.keys(currentConfig), ...Object.keys(otherConfig)]);
      const fields = Array.from(allFields).map((field) => {
        const currentValue = currentConfig[field];
        const otherValue = otherConfig[field];

        let status = 'unchanged';
        if (otherValue === undefined) {
          status = showSide === 'old' ? 'deleted' : 'added';
        } else if (currentValue !== otherValue) {
          status = 'modified';
        }

        let displayValue = currentValue;
        if (typeof displayValue === 'boolean') {
          displayValue = displayValue ? 'true' : 'false';
        } else if (displayValue === undefined || displayValue === null) {
          displayValue = '';
        }

        return {
          key: t(`GIT.DIFF.AUTH_FIELD.${field}`, field),
          value: String(displayValue),
          status
        };
      });

      return {
        type: authType,
        label: t(`GIT.DIFF.AUTH_TYPE.${authType}`, authType),
        status: sectionStatus,
        fields
      };
    }).filter(Boolean);
  }, [authTypes, currentAuth, otherAuth, showSide, t]);

  const currentMode = currentAuth.mode;
  const otherMode = otherAuth.mode;
  const modeStatus = currentMode !== otherMode ? (otherMode === undefined ? (showSide === 'old' ? 'deleted' : 'added') : 'modified') : 'unchanged';

  if (authSections.length === 0 && !currentMode) {
    return null;
  }

  return (
    <>
      {currentMode && (
        <div className="diff-section">
          <table className="diff-table">
            <thead>
              <tr>
                <th style={{ width: '30px' }}></th>
                <th style={{ width: '40%' }}>{t('GIT.DIFF.FIELD')}</th>
                <th>{t('GIT.DIFF.VALUE')}</th>
              </tr>
            </thead>
            <tbody>
              <tr className={modeStatus}>
                <td>
                  {modeStatus !== 'unchanged' && (
                    <span className={`status-badge ${modeStatus}`}>
                      {modeStatus === 'added' ? 'A' : modeStatus === 'deleted' ? 'D' : 'M'}
                    </span>
                  )}
                </td>
                <td className="key-cell">{t('GIT.DIFF.AUTH_MODE')}</td>
                <td className="value-cell">{t(`GIT.DIFF.AUTH_TYPE.${currentMode}`, currentMode)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
      {authSections.map((section) => (
        <div key={section.type} className="diff-section">
          <div className="diff-section-header">
            <span>{section.label}</span>
            {section.status !== 'unchanged' && (
              <span className={`status-badge ${section.status}`}>
                {section.status === 'added' ? 'A' : section.status === 'deleted' ? 'D' : 'M'}
              </span>
            )}
          </div>
          <table className="diff-table">
            <thead>
              <tr>
                <th style={{ width: '30px' }}></th>
                <th style={{ width: '40%' }}>{t('GIT.DIFF.FIELD')}</th>
                <th>{t('GIT.DIFF.VALUE')}</th>
              </tr>
            </thead>
            <tbody>
              {section.fields.map((field, index) => (
                <tr key={index} className={field.status}>
                  <td>
                    {field.status !== 'unchanged' && (
                      <span className={`status-badge ${field.status}`}>
                        {field.status === 'added' ? 'A' : field.status === 'deleted' ? 'D' : 'M'}
                      </span>
                    )}
                  </td>
                  <td className="key-cell">{field.key}</td>
                  <td className="value-cell">{field.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </>
  );
};

export default VisualDiffAuth;
