import React from 'react';
import { useTranslation } from 'react-i18next';
import classnames from 'classnames';
import StyledWrapper from './StyledWrapper';

const GrpcStatusCode = ({ status, text }) => {
  const { t } = useTranslation();
  // gRPC status codes: 0 is success, anything else is an error
  const getTabClassname = (status) => {
    const isPending = text === 'PENDING' || text === 'STREAMING';
    return classnames('ml-2', {
      'text-ok': parseInt(status) === 0,
      'text-pending': isPending,
      'text-error': parseInt(status) > 0 && !isPending
    });
  };

  const statusText = text || t(`RESPONSE_PANE.GRPC_STATUS.${status}`);

  return (
    <StyledWrapper className={getTabClassname(status)}>
      {Number.isInteger(status) ? <div className="mr-1" data-testid="grpc-response-status-code">{status}</div> : null}
      {statusText && <div data-testid="grpc-response-status-text">{statusText}</div>}
    </StyledWrapper>
  );
};

export default GrpcStatusCode;
