import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import {
  IconX,
  IconFileText,
  IconArrowRight,
  IconNetwork
} from '@tabler/icons';
import { clearSelectedRequest } from 'providers/ReduxStore/slices/logs';
import QueryResponse from 'components/ResponsePane/QueryResponse/index';
import Network from 'components/ResponsePane/Timeline/TimelineItem/Network';
import { sentHeadersFromTimeline } from 'utils/timeline';
import StyledWrapper from './StyledWrapper';
import { uuid } from 'utils/common/index';

const formatHeaders = (headers) => {
  if (!headers) return [];
  if (Array.isArray(headers)) return headers;
  return Object.entries(headers).map(([key, value]) => ({ name: key, value }));
};

const formatBody = (body, t) => {
  if (!body) return t('DEVTOOLS.REQUEST_DETAILS.NO_BODY');
  if (typeof body === 'string') return body;
  return JSON.stringify(body, null, 2);
};

const RequestTab = ({ request, response }) => {
  const { t } = useTranslation();
  const sentHeaders = sentHeadersFromTimeline(response?.timeline);
  /** In case of `bru.sendRequest` it builds its own entry in timeline,
   * so to show the headers sent in new request we need headers not sentHeaders */
  const headers = sentHeaders.length ? sentHeaders : formatHeaders(request?.headers);

  return (
    <div className="tab-content">
      <div className="section">
        <h4>{t('DEVTOOLS.REQUEST_DETAILS.GENERAL')}</h4>
        <div className="info-grid">
          <div className="info-item">
            <span className="label">{t('DEVTOOLS.REQUEST_DETAILS.REQUEST_URL')}:</span>
            <span className="value">{request?.url || 'N/A'}</span>
          </div>
          <div className="info-item">
            <span className="label">{t('DEVTOOLS.REQUEST_DETAILS.REQUEST_METHOD')}:</span>
            <span className="value">{request?.method || 'GET'}</span>
          </div>
        </div>
      </div>

      <div className="section">
        <h4>{t('DEVTOOLS.REQUEST_DETAILS.REQUEST_HEADERS')}</h4>
        {headers.length > 0 ? (
          <div className="headers-table" data-testid="request-details-request-headers">
            <table>
              <thead>
                <tr>
                  <td>{t('DEVTOOLS.REQUEST_DETAILS.NAME')}</td>
                  <td>{t('DEVTOOLS.REQUEST_DETAILS.VALUE')}</td>
                </tr>
              </thead>
              <tbody>
                {headers.map((header, index) => (
                  <tr key={index} data-testid="request-details-header-row">
                    <td className="header-name" data-testid="request-details-header-name">{header.name}</td>
                    <td className="header-value" data-testid="request-details-header-value">{header.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">{t('DEVTOOLS.REQUEST_DETAILS.NO_HEADERS')}</div>
        )}
      </div>

      {request?.data && (
        <div className="section">
          <h4>{t('DEVTOOLS.REQUEST_DETAILS.REQUEST_BODY')}</h4>
          <pre className="code-block">{formatBody(request.data, t)}</pre>
        </div>
      )}
    </div>
  );
};

const ResponseTab = ({ response, request, collection }) => {
  const { t } = useTranslation();

  return (
    <div className="tab-content">
      <div className="section">
        <h4>{t('DEVTOOLS.REQUEST_DETAILS.RESPONSE_HEADERS')}</h4>
        {formatHeaders(response?.headers).length > 0 ? (
          <div className="headers-table">
            <table>
              <thead>
                <tr>
                  <td>{t('DEVTOOLS.REQUEST_DETAILS.NAME')}</td>
                  <td>{t('DEVTOOLS.REQUEST_DETAILS.VALUE')}</td>
                </tr>
              </thead>
              <tbody>
                {formatHeaders(response.headers).map((header, index) => (
                  <tr key={index}>
                    <td className="header-name">{header.name}</td>
                    <td className="header-value">{header.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">{t('DEVTOOLS.REQUEST_DETAILS.NO_HEADERS')}</div>
        )}
      </div>

      <div className="section">
        <h4>{t('DEVTOOLS.REQUEST_DETAILS.RESPONSE_BODY')}</h4>
        <div className="response-body-container">
          {response?.data || response?.dataBuffer ? (
            <QueryResponse
              item={{ uid: uuid() }}
              collection={collection}
              data={response.data}
              dataBuffer={response.dataBuffer}
              headers={response.headers}
              error={response.error}
              disableRunEventListener={true}
            />
          ) : (
            <div className="empty-state">{t('DEVTOOLS.REQUEST_DETAILS.NO_RESPONSE_DATA')}</div>
          )}
        </div>
      </div>
    </div>
  );
};

const NetworkTab = ({ response }) => {
  const { t } = useTranslation();
  const timeline = response?.timeline || [];

  return (
    <div className="tab-content">
      <div className="section">
        <h4>{t('DEVTOOLS.REQUEST_DETAILS.NETWORK_LOGS')}</h4>
        <div className="network-logs-wrapper">
          {timeline.length > 0 ? (
            <Network logs={timeline} />
          ) : (
            <div className="empty-state">{t('DEVTOOLS.REQUEST_DETAILS.NO_NETWORK_LOGS_AVAILABLE')}</div>
          )}
        </div>
      </div>
    </div>
  );
};

const RequestDetailsPanel = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { selectedRequest } = useSelector((state) => state.logs);
  const collections = useSelector((state) => state.collections.collections);
  const [activeTab, setActiveTab] = useState('request');

  if (!selectedRequest) return null;

  const { data } = selectedRequest;
  const { request, response } = data;

  const collection = collections.find((c) => c.uid === selectedRequest.collectionUid);

  const handleClose = () => {
    dispatch(clearSelectedRequest());
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const getTabContent = () => {
    switch (activeTab) {
      case 'request':
        return <RequestTab request={request} response={response} />;
      case 'response':
        return <ResponseTab response={response} request={request} collection={collection} />;
      case 'network':
        return <NetworkTab response={response} />;
      default:
        return <RequestTab request={request} response={response} />;
    }
  };

  return (
    <StyledWrapper>
      <div className="panel-header">
        <div className="panel-title">
          <IconFileText size={16} strokeWidth={1.5} />
          <span>{t('DEVTOOLS.REQUEST_DETAILS.REQUEST_DETAILS')}</span>
          <span className="request-time">({formatTime(selectedRequest.timestamp)})</span>
        </div>

        <button
          className="close-button"
          onClick={handleClose}
          title={t('DEVTOOLS.REQUEST_DETAILS.CLOSE_DETAILS_PANEL')}
        >
          <IconX size={16} strokeWidth={1.5} />
        </button>
      </div>

      <div className="panel-tabs">
        <button
          className={`tab-button ${activeTab === 'request' ? 'active' : ''}`}
          data-testid="request-details-tab"
          onClick={() => setActiveTab('request')}
        >
          <IconArrowRight size={14} strokeWidth={1.5} />
          {t('DEVTOOLS.REQUEST_DETAILS.REQUEST')}
        </button>

        <button
          className={`tab-button ${activeTab === 'response' ? 'active' : ''}`}
          onClick={() => setActiveTab('response')}
        >
          <IconFileText size={14} strokeWidth={1.5} />
          {t('DEVTOOLS.REQUEST_DETAILS.RESPONSE')}
        </button>

        <button
          className={`tab-button ${activeTab === 'network' ? 'active' : ''}`}
          data-testid="network-details-tab"
          onClick={() => setActiveTab('network')}
        >
          <IconNetwork size={14} strokeWidth={1.5} />
          {t('DEVTOOLS.REQUEST_DETAILS.NETWORK')}
        </button>
      </div>

      <div className="panel-content">
        {getTabContent()}
      </div>
    </StyledWrapper>
  );
};

export default RequestDetailsPanel;
