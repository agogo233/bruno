import React from 'react';
import { useTranslation } from 'react-i18next';
import classnames from 'classnames';
import StyledWrapper from './StyledWrapper';

const WSStatusCode = ({ status, text }) => {
  const { t } = useTranslation();
  const getTabClassname = (status) => {
    return classnames('ml-2', {
      // ok if normal connect and normal closure
      'text-ok': parseInt(status) === 0 || parseInt(status) === 1000,
      'text-error': parseInt(status) !== 1000 && parseInt(status) !== 0
    });
  };

  const statusText = text || t(`RESPONSE_PANE.WS_STATUS.${status}`);

  return (
    <StyledWrapper className={getTabClassname(status)}>
      {Number.isInteger(status) && status != 0 ? <div className="mr-1">{status}</div> : null}
      {statusText && <div>{statusText}</div>}
    </StyledWrapper>
  );
};

export default WSStatusCode;
