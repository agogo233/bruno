import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { IconTrash } from '@tabler/icons';
import { clearMockLog, syncMockServerState } from 'providers/ReduxStore/slices/mock-server/index';
import { updateTableColumnWidths } from 'providers/ReduxStore/slices/tabs';
import { subscribeMockServerLog } from 'utils/mock-server/mock-server-log-subscription';
import EditableTable from 'components/EditableTable';
import FilterDropdown from 'components/FilterDropdown';
import Button from 'ui/Button';
import MethodBadge from 'ui/MethodBadge';
import StatusBadge from 'ui/StatusBadge';
import StyledWrapper from './StyledWrapper';

const getStatusBucket = (statusCode) => {
  if (statusCode >= 200 && statusCode < 300) return '2xx';
  if (statusCode >= 300 && statusCode < 400) return '3xx';
  if (statusCode >= 400 && statusCode < 500) return '4xx';
  if (statusCode >= 500 && statusCode < 600) return '5xx';
  return null;
};

const getStatusClass = (statusCode, matched) => {
  if (!matched) return 'status-unmatched';

  const bucket = getStatusBucket(statusCode);
  return bucket ? `status-${bucket}` : '';
};

const formatTimestamp = (iso) => {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
      + '.' + String(d.getMilliseconds()).padStart(3, '0');
  } catch {
    return iso;
  }
};

const formatConditionValue = (value, t) => {
  if (value === null || value === undefined) {
    return t('MOCK_SERVER.REQUEST_LOG.MISSING');
  }

  if (typeof value === 'string') {
    return `"${value}"`;
  }

  return String(value);
};

const formatCondition = (condition, t) => {
  if (!condition?.target) {
    return t('MOCK_SERVER.REQUEST_LOG.NO_RULES_FALLBACK');
  }

  const key = condition.key ? ` ${condition.key}` : '';
  return `${condition.target}${key} ${condition.operator} ${formatConditionValue(condition.expected, t)}`;
};

const getSelectionReasonLabel = (selectionReason, t) => {
  if (selectionReason === 'specific_rules') {
    return t('MOCK_SERVER.REQUEST_LOG.SELECTED_SPECIFIC_RULES');
  }

  if (selectionReason === 'fallback') {
    return t('MOCK_SERVER.REQUEST_LOG.SELECTED_FALLBACK');
  }

  return null;
};

const getMatchedMockResponseName = (entry) => (
  entry?.matchedMockResponseName
  || entry?.matchedExampleName
  || entry?.matchTrace?.selectedResponseName
  || null
);

const getFailureLabel = (failureReason, t) => {
  if (failureReason === 'no_route') {
    return t('MOCK_SERVER.REQUEST_LOG.NO_ROUTE');
  }

  if (failureReason === 'no_rule_match') {
    return t('MOCK_SERVER.REQUEST_LOG.NO_RULE_MATCH');
  }

  return null;
};

const MatchTracePanel = ({ entry }) => {
  const { t } = useTranslation();
  const trace = entry?.matchTrace;

  if (!trace) {
    return (
      <div className="match-trace-panel" data-testid="mock-server-match-trace">
        {entry?.error ? (
          <div className="match-trace-error" data-testid="mock-server-log-error">{entry.error}</div>
        ) : (
          <div className="match-trace-empty">{t('MOCK_SERVER.REQUEST_LOG.NO_MATCH_TRACE')}</div>
        )}
      </div>
    );
  }

  const failureLabel = getFailureLabel(trace.failureReason, t);
  const selectionReasonLabel = getSelectionReasonLabel(trace.selectionReason, t);
  const routeLabel = trace.routeKey || `${entry.method} ${entry.path}`;

  return (
    <div className="match-trace-panel" data-testid="mock-server-match-trace">
      {entry?.error ? (
        <div className="match-trace-error" data-testid="mock-server-log-error">{entry.error}</div>
      ) : null}

      {!trace && !entry?.error ? (
        <div className="match-trace-empty">{t('MOCK_SERVER.REQUEST_LOG.NO_MATCH_TRACE')}</div>
      ) : null}

      {trace ? (
        <div className="match-trace-header">
          <span className="match-trace-route">{routeLabel}</span>
          {entry.matched
            ? (
                <span className="match-trace-result match-trace-result-success">
                  {t('MOCK_SERVER.REQUEST_LOG.MATCHED_LABEL')}: {trace.selectedResponseName || getMatchedMockResponseName(entry)}
                  {selectionReasonLabel ? ` (${selectionReasonLabel})` : ''}
                </span>
              )
            : <span className="match-trace-result match-trace-result-fail">{failureLabel || t('MOCK_SERVER.REQUEST_LOG.NO_MATCH')}</span>}
        </div>
      ) : null}

      {trace?.availableRoutes?.length ? (
        <div className="match-trace-section">
          <div className="match-trace-section-title">{t('MOCK_SERVER.REQUEST_LOG.AVAILABLE_ROUTES')}</div>
          <ul className="match-trace-list">
            {trace.availableRoutes.map((route) => (
              <li key={route} title={route}>{route}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {trace?.candidates?.length ? (
        <div className="match-trace-section">
          <div className="match-trace-section-title">{t('MOCK_SERVER.REQUEST_LOG.RESPONSES_CONSIDERED')}</div>
          {trace.candidates.map((candidate) => (
            <div
              key={candidate.responseUid || candidate.responseName}
              className={`match-trace-candidate ${candidate.selected ? 'is-selected' : ''}`}
            >
              <div className="match-trace-candidate-header">
                <span>{candidate.responseName}</span>
                {candidate.isFallback ? <span className="match-trace-badge">{t('MOCK_SERVER.REQUEST_LOG.FALLBACK_BADGE')}</span> : null}
                {candidate.selected ? <span className="match-trace-badge selected">{t('MOCK_SERVER.REQUEST_LOG.SELECTED_BADGE')}</span> : null}
                {candidate.matched && !candidate.selected ? (
                  <span className="match-trace-badge skipped">{t('MOCK_SERVER.REQUEST_LOG.MATCHED_NOT_SELECTED')}</span>
                ) : null}
              </div>

              {candidate.conditions?.length ? (
                <ul className="match-trace-conditions">
                  {candidate.conditions.map((condition, index) => (
                    <li
                      key={`${candidate.responseUid || candidate.responseName}-${index}`}
                      className={condition.pass ? 'pass' : 'fail'}
                    >
                      <span className="match-trace-condition-status">{condition.pass ? 'pass' : 'fail'}</span>
                      <span>{formatCondition(condition, t)}</span>
                      {!condition.pass ? (
                        <span className="match-trace-actual">{t('MOCK_SERVER.REQUEST_LOG.GOT_LABEL')} {formatConditionValue(condition.actual, t)}</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="match-trace-fallback-note">{t('MOCK_SERVER.REQUEST_LOG.MATCHES_ANY_REQUEST')}</div>
              )}

              {!candidate.matched && candidate.ruleOperator && candidate.conditions?.length ? (
                <div className="match-trace-operator">
                  {t('MOCK_SERVER.REQUEST_LOG.RULE_GROUP')}: {candidate.ruleOperator}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
};

const LOG_ROW_TESTID_PREFIX = 'mock-server-log-row-';

const MATCH_FILTER_OPTIONS = [
  { value: 'matched', label: 'matched' },
  { value: 'unmatched', label: 'unmatched' }
];

const STATUS_FILTER_OPTIONS = [
  { value: '2xx', label: '2xx' },
  { value: '3xx', label: '3xx' },
  { value: '4xx', label: '4xx' },
  { value: '5xx', label: '5xx' }
];

const RequestLog = ({ mockServerUid, location }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const logs = useSelector((state) => state.mockServer.requestLogs[mockServerUid]) || [];
  const tabs = useSelector((state) => state.tabs.tabs);
  const activeTabUid = useSelector((state) => state.tabs.activeTabUid);
  const [matchFilter, setMatchFilter] = useState(null);
  const [statusFilter, setStatusFilter] = useState(null);
  const [selectedLogUid, setSelectedLogUid] = useState(null);
  const [collapsedLogUid, setCollapsedLogUid] = useState(null);

  useEffect(() => {
    const unsubscribe = subscribeMockServerLog(mockServerUid);
    dispatch(syncMockServerState(location));

    return unsubscribe;
  }, [dispatch, mockServerUid, location.workspacePath]);

  const filteredLogs = useMemo(() => {
    return logs.filter((entry) => {
      if (matchFilter === 'matched' && !entry.matched) return false;
      if (matchFilter === 'unmatched' && entry.matched) return false;

      if (statusFilter && getStatusBucket(entry.statusCode) !== statusFilter) return false;

      return true;
    });
  }, [logs, matchFilter, statusFilter]);

  const displayedLogs = useMemo(() => [...filteredLogs].reverse(), [filteredLogs]);

  const autoExpandUid = displayedLogs[0]?.matchTrace ? displayedLogs[0].uid : null;
  const isSelectionVisible = selectedLogUid && displayedLogs.some((entry) => entry.uid === selectedLogUid);
  const expandedLogUid = isSelectionVisible
    ? selectedLogUid
    : (collapsedLogUid === autoExpandUid ? null : autoExpandUid);

  const handleClear = () => {
    dispatch(clearMockLog({ mockServerUid }));
    setSelectedLogUid(null);
    setCollapsedLogUid(null);
  };

  const toggleTrace = (uid) => {
    const isExpanded = expandedLogUid === uid;
    setSelectedLogUid(isExpanded ? null : uid);
    setCollapsedLogUid(isExpanded ? uid : null);
  };

  const focusedTab = tabs?.find((tab) => tab.uid === activeTabUid);
  const logWidths = focusedTab?.tableColumnWidths?.['mock-server-log'] || {};

  const handleColumnWidthsChange = (widths) => {
    dispatch(updateTableColumnWidths({ uid: activeTabUid, tableId: 'mock-server-log', widths }));
  };

  const tableRows = useMemo(() => displayedLogs.flatMap((entry) => (
    entry.uid === expandedLogUid
      ? [entry, { uid: `${entry.uid}::trace`, entry, isTraceRow: true }]
      : [entry]
  )), [displayedLogs, expandedLogUid]);

  const rowConfig = useMemo(() => ({
    renderFullWidth: (row) => (row.isTraceRow ? <MatchTracePanel entry={row.entry} /> : null),
    className: (row) => {
      if (row.isTraceRow) return 'log-trace-row';
      return row.uid === expandedLogUid ? 'log-row-expanded' : '';
    },
    testId: (row) => (row.isTraceRow ? undefined : `${LOG_ROW_TESTID_PREFIX}${row.uid}`)
  }), [expandedLogUid]);

  const handleRowClick = (event) => {
    const row = event.target.closest(`tr[data-testid^="${LOG_ROW_TESTID_PREFIX}"]`);
    if (!row) return;

    if (event.detail > 1 || window.getSelection()?.toString()) return;

    toggleTrace(row.dataset.testid.slice(LOG_ROW_TESTID_PREFIX.length));
  };

  const columns = [
    {
      key: 'method',
      name: t('MOCK_SERVER.REQUEST_LOG.METHOD'),
      width: '9%',
      render: ({ value }) => <MethodBadge method={value} className="method-badge" />
    },
    {
      key: 'path',
      name: t('MOCK_SERVER.REQUEST_LOG.PATH'),
      render: ({ value }) => <span className="log-path truncate-cell" title={value}>{value}</span>
    },
    {
      key: 'mockResponse',
      name: t('MOCK_SERVER.REQUEST_LOG.MOCK_RESPONSE'),
      width: '18%',
      getValue: getMatchedMockResponseName,
      render: ({ value, row }) => (
        row.matched
          ? <span className="truncate-cell" title={value || undefined}>{value || '-'}</span>
          : <span className="no-match-label">{t('MOCK_SERVER.REQUEST_LOG.NO_MATCH')}</span>
      )
    },
    {
      key: 'statusCode',
      name: t('MOCK_SERVER.REQUEST_LOG.STATUS'),
      width: '8%',
      render: ({ value, row }) => (
        <span className={`status-code truncate-cell ${getStatusClass(value, row.matched)}`} title={String(value)}>{value}</span>
      )
    },
    {
      key: 'delay',
      name: t('MOCK_SERVER.REQUEST_LOG.DELAY'),
      width: '8%',
      render: ({ value }) => {
        const label = value > 0 ? `${value}ms` : '-';

        return <span className="truncate-cell" title={label}>{label}</span>;
      }
    },
    {
      key: 'duration',
      name: t('MOCK_SERVER.REQUEST_LOG.DURATION'),
      width: '9%',
      render: ({ value }) => <span className="truncate-cell" title={`${value}ms`}>{value}ms</span>
    }
  ];

  if (logs.length === 0) {
    return (
      <StyledWrapper className="h-full w-full">
        <div className="text-xs text-muted empty-state">
          {t('MOCK_SERVER.REQUEST_LOG.EMPTY')}
        </div>
      </StyledWrapper>
    );
  }

  return (
    <StyledWrapper className="h-full w-full">
      <div className="flex items-center gap-2 mb-4">
        <FilterDropdown
          label={t('MOCK_SERVER.REQUEST_LOG.FILTER_MATCH')}
          options={MATCH_FILTER_OPTIONS.map((option) => ({
            value: option.value,
            label: t(`MOCK_SERVER.REQUEST_LOG.MATCH_${option.value.toUpperCase()}`)
          }))}
          value={matchFilter}
          onChange={setMatchFilter}
          allLabel={t('MOCK_SERVER.REQUEST_LOG.ALL_REQUESTS')}
          testId="mock-server-match-filter"
        />
        <FilterDropdown
          label={t('MOCK_SERVER.REQUEST_LOG.FILTER_STATUS')}
          options={STATUS_FILTER_OPTIONS.map((option) => ({
            value: option.value,
            label: t(`MOCK_SERVER.REQUEST_LOG.STATUS_${option.value.toUpperCase()}_LABEL`)
          }))}
          value={statusFilter}
          onChange={setStatusFilter}
          allLabel={t('MOCK_SERVER.REQUEST_LOG.ALL_STATUS')}
          testId="mock-server-status-filter"
        />
        <div className="flex-grow" />
        <span className="text-xs text-muted" data-testid="mock-server-log-count">{t('MOCK_SERVER.REQUEST_LOG.REQUESTS_COUNT', { count: logs.length })}</span>
        <Button
          variant="ghost"
          color="secondary"
          size="xs"
          icon={<IconTrash size={14} stroke={1.5} />}
          onClick={handleClear}
          data-testid="mock-server-log-clear"
        >
          {t('MOCK_SERVER.REQUEST_LOG.CLEAR')}
        </Button>
      </div>

      <div onClick={handleRowClick}>
        <EditableTable
          tableId="mock-server-log"
          columns={columns}
          rows={tableRows}
          onChange={() => {}}
          rowConfig={rowConfig}
          showCheckbox={false}
          showDelete={false}
          showAddRow={false}
          columnWidths={logWidths}
          onColumnWidthsChange={handleColumnWidthsChange}
          testId="mock-server-log-table"
        />
      </div>
    </StyledWrapper>
  );
};

export default RequestLog;