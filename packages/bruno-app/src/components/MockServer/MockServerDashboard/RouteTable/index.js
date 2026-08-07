import React, { useState, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { IconCopy, IconCheck } from '@tabler/icons';
import toast from 'react-hot-toast';
import EditableTable from 'components/EditableTable';
import FilterDropdown from 'components/FilterDropdown';
import MockSearchInput from 'components/MockServer/MockSearchInput';
import MethodBadge from 'ui/MethodBadge';
import { buildMockRouteTable, countMatchedRouteHits } from 'utils/mock-server/mock-responses';
import StyledWrapper from './StyledWrapper';

const RouteTable = ({ mockServerUid }) => {
  const { t } = useTranslation();
  const responses = useSelector((state) => state.mockServer.mockResponses[mockServerUid]) || [];
  const requestLogs = useSelector((state) => state.mockServer.requestLogs[mockServerUid]) || [];
  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState(null);
  const [copiedRouteUid, setCopiedRouteUid] = useState(null);
  const copyResetTimeoutRef = useRef(null);

  const serverState = useSelector((state) => state.mockServer.servers[mockServerUid]) || {};
  const isRunning = serverState.status === 'running';
  const baseUrl = isRunning ? serverState.baseUrl : null;

  const routes = useMemo(() => buildMockRouteTable(responses), [responses]);
  const hitCounts = useMemo(() => countMatchedRouteHits(requestLogs), [requestLogs]);

  const filteredRoutes = useMemo(() => {
    return routes
      .filter((route) => {
        if (methodFilter && route.method !== methodFilter) return false;
        if (searchQuery && !route.path.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
      })
      .map((route) => ({
        ...route,
        uid: `${route.method} ${route.path}`,
        hits: hitCounts[`${route.method} ${route.path}`] || 0,
        source: route.responses?.[0]?.sourceFile || '-'
      }));
  }, [routes, searchQuery, methodFilter, hitCounts]);

  const methodOptions = useMemo(() => {
    const unique = new Set(routes.map((r) => r.method));
    return Array.from(unique).sort().map((m) => ({ value: m, label: m }));
  }, [routes]);

  const handleCopyRouteUrl = async (routeUid, path) => {
    if (!baseUrl) return;

    const routePath = path.startsWith('/') ? path : `/${path}`;

    try {
      await navigator.clipboard.writeText(`${baseUrl}${routePath}`);
      setCopiedRouteUid(routeUid);
      clearTimeout(copyResetTimeoutRef.current);
      copyResetTimeoutRef.current = setTimeout(() => setCopiedRouteUid(null), 1500);
    } catch {
      toast.error(t('MOCK_SERVER.ROUTE_TABLE.COPY_URL_FAILED'));
    }
  };

  const columns = [
    {
      key: 'method',
      name: t('MOCK_SERVER.ROUTE_TABLE.METHOD'),
      width: '80px',
      render: ({ value }) => (
        <MethodBadge method={value} className="method-badge" />
      )
    },
    {
      key: 'path',
      name: t('MOCK_SERVER.ROUTE_TABLE.PATH'),
      render: ({ value, row }) => (
        <div className="path-cell">
          <span className="route-path">{value}</span>
          {baseUrl && (
            <button
              type="button"
              className="copy-path-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleCopyRouteUrl(row.uid, value);
              }}
              title={t('MOCK_SERVER.ROUTE_TABLE.COPY_ROUTE_URL')}
              aria-label={t('MOCK_SERVER.ROUTE_TABLE.COPY_ROUTE_URL')}
            >
              {copiedRouteUid === row.uid
                ? <IconCheck size={13} strokeWidth={2} />
                : <IconCopy size={13} strokeWidth={1.5} />}
            </button>
          )}
        </div>
      )
    },
    {
      key: 'responseCount',
      name: t('MOCK_SERVER.ROUTE_TABLE.RESPONSES'),
      width: '90px',
      render: ({ row }) => <span>{row.responseCount}</span>
    },
    {
      key: 'defaultResponse',
      name: t('MOCK_SERVER.ROUTE_TABLE.DEFAULT'),
      width: '140px',
      render: ({ row }) => <span>{row.defaultResponse || '-'}</span>
    },
    {
      key: 'source',
      name: t('MOCK_SERVER.ROUTE_TABLE.SOURCE'),
      width: '120px',
      render: ({ value }) => <span className="text-muted source-file" title={value}>{value}</span>
    },
    {
      key: 'hits',
      name: t('MOCK_SERVER.ROUTE_TABLE.HITS'),
      width: '60px',
      render: ({ value }) => <span>{value}</span>
    }
  ];

  if (routes.length === 0) {
    return (
      <StyledWrapper className="h-full w-full">
        <div className="text-xs text-muted empty-state">
          {t('MOCK_SERVER.ROUTE_TABLE.EMPTY')}
        </div>
      </StyledWrapper>
    );
  }

  return (
    <StyledWrapper className="h-full w-full">
      <div className="flex items-center gap-2 mb-4">
        <MockSearchInput
          className="flex-1"
          placeholder={t('MOCK_SERVER.ROUTE_TABLE.SEARCH_ROUTES')}
          value={searchQuery}
          onChange={setSearchQuery}
          data-testid="mock-server-route-search"
        />
        <FilterDropdown
          label={t('MOCK_SERVER.ROUTE_TABLE.METHOD')}
          options={methodOptions}
          value={methodFilter}
          onChange={setMethodFilter}
          allLabel={t('MOCK_SERVER.ROUTE_TABLE.ALL_METHODS')}
          placement="right"
          testId="mock-server-method-filter"
        />
      </div>

      <EditableTable
        columns={columns}
        rows={filteredRoutes}
        onChange={() => {}}
        showCheckbox={false}
        showDelete={false}
        showAddRow={false}
        testId="mock-server-routes-table"
      />

      {filteredRoutes.length === 0 && routes.length > 0 && (
        <div className="text-xs text-muted mt-4 empty-state">{t('MOCK_SERVER.ROUTE_TABLE.NO_MATCH')}</div>
      )}
    </StyledWrapper>
  );
};

export default RouteTable;
