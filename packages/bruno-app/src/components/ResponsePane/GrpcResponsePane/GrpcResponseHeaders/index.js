import React from 'react';
import { useTranslation } from 'react-i18next';
import StyledWrapper from './StyledWrapper';

const GrpcResponseHeaders = ({ metadata }) => {
  const { t } = useTranslation();
  // Ensure headers is an array
  const metadataArray = Array.isArray(metadata) ? metadata : [];

  return (
    <StyledWrapper className="pb-4 w-full">
      <table>
        <thead>
          <tr>
            <td>{t('RESPONSE_PANE.NAME')}</td>
            <td>{t('RESPONSE_PANE.VALUE')}</td>
          </tr>
        </thead>
        <tbody>
          {metadataArray && metadataArray.length ? (
            metadataArray.map((metadata, index) => (
              <tr key={index}>
                <td className="key">{metadata.name}</td>
                <td className="value">{metadata.value}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="2" className="text-center py-4 empty-message">
                {t('RESPONSE_PANE.GRPC.NO_METADATA')}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </StyledWrapper>
  );
};

export default GrpcResponseHeaders;
