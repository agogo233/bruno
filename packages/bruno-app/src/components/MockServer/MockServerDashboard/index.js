import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { startMockServer, stopMockServer, refreshMockRoutes, updateMockDelay, syncMockServerState } from 'providers/ReduxStore/slices/mock-server/index';
import { IconRefresh, IconCopy, IconCheck, IconPlayerPlay, IconPlayerStop, IconSettings } from '@tabler/icons';
import toast from 'react-hot-toast';
import { validateName, validateNameError } from 'utils/common/regex';
import RouteTable from './RouteTable';
import RequestLog from './RequestLog';
import CreateMockServerModal from 'components/MockServer/CreateMockServerModal';
import DeleteMockServerModal from 'components/MockServer/DeleteMockServerModal';
import {
  findMockServerInstance,
  getMockServerInstances,
  checkMockServerPortAvailable,
  getMockServerPortError,
  isMockServerNameTaken,
  resolveInstanceSpec,
  saveMockServerInstance,
  resolveMockServerStartPayload,
  resolveMockServerWorkspacePath,
  updateMockServerTabName
} from 'utils/mock-server/mock-server-instances';
import MockResponsesList from 'components/MockServer/MockResponse/MockResponsesList';
import Tab from 'components/Tab';
import ActionIcon from 'ui/ActionIcon';
import Button from 'ui/Button';
import { resolveMockResponseCollection, resolveMockResponseLocation } from 'utils/mock-server/mock-responses';
import StyledWrapper from './StyledWrapper';

const MockServerLogCount = ({ mockServerUid }) => {
  const logCount = useSelector((state) => (state.mockServer.requestLogs[mockServerUid] || []).length);

  if (!logCount) {
    return null;
  }

  return <sup className="ml-1 font-medium">{logCount}</sup>;
};

const MockServerDashboard = ({ instance, collection }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const mockServerUid = instance.uid;
  const [activeTab, setActiveTab] = useState('responses');
  const [copied, setCopied] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState(null);
  const [delayDraft, setDelayDraft] = useState(null);
  const [portError, setPortError] = useState(null);
  const collections = useSelector((state) => state.collections.collections);
  const apiSpecs = useSelector((state) => state.apiSpec.apiSpecs);
  const workspaces = useSelector((state) => state.workspaces.workspaces);
  const activeWorkspaceUid = useSelector((state) => state.workspaces.activeWorkspaceUid);
  const storedInstance = useSelector((state) => (
    findMockServerInstance(state, mockServerUid) || instance
  ));
  const workspaceInstances = useSelector((state) => getMockServerInstances(state, activeWorkspaceUid));

  const activeWorkspace = useMemo(() => (
    workspaces.find((workspace) => workspace.uid === activeWorkspaceUid) || null
  ), [workspaces, activeWorkspaceUid]);

  const resolvedCollection = useMemo(() => (
    resolveMockResponseCollection({
      collection,
      instance,
      collections,
      activeWorkspace
    })
  ), [collection, instance, collections, activeWorkspace]);

  const location = useMemo(() => (
    resolveMockResponseLocation(instance, resolvedCollection, collections, workspaces, activeWorkspace)
  ), [instance, resolvedCollection, collections, workspaces, activeWorkspace]);

  const serverState = useSelector((state) => state.mockServer.servers[mockServerUid]) || {
    status: 'stopped',
    port: null,
    baseUrl: null,
    routeCount: 0,
    exampleCount: 0,
    globalDelay: instance.globalDelay || 0
  };

  const isRunning = serverState.status === 'running';
  const isStarting = serverState.status === 'starting';
  const isStopping = serverState.status === 'stopping';
  const baseUrl = isRunning ? serverState.baseUrl : null;
  const activePort = isRunning ? serverState.port : storedInstance.port;
  const activeDelay = isRunning ? (serverState.globalDelay || 0) : (storedInstance.globalDelay || 0);
  const nameValue = nameDraft ?? storedInstance.name;
  const delayValue = delayDraft ?? activeDelay;

  useEffect(() => {
    validatePort(activePort);
  }, [activePort]);

  const validatePort = async (value = activePort) => {
    const trimmed = String(value).trim();

    if (!trimmed) {
      const error = t('MOCK_SERVER.DASHBOARD.PORT_REQUIRED');
      setPortError(error);
      return error;
    }

    const nextPort = Number(trimmed);
    if (!Number.isInteger(nextPort) || nextPort < 1 || nextPort > 65535) {
      const error = t('MOCK_SERVER.DASHBOARD.PORT_RANGE');
      setPortError(error);
      return error;
    }

    try {
      const portCheck = await checkMockServerPortAvailable(nextPort, workspaceInstances, {
        excludeUid: storedInstance.uid
      });
      const error = getMockServerPortError(portCheck, nextPort);
      setPortError(error);
      return error;
    } catch (err) {
      const error = err.message || t('MOCK_SERVER.DASHBOARD.PORT_VALIDATE_FAILED');
      setPortError(error);
      return error;
    }
  };

  useEffect(() => {
    dispatch(syncMockServerState(location));
  }, [dispatch, location.mockServerUid, location.collectionPath, location.sourceType, location.workspacePath]);

  const resolveStartPayload = () => resolveMockServerStartPayload(storedInstance, {
    collection,
    apiSpecs,
    workspacePath: resolveMockServerWorkspacePath(storedInstance, workspaces, activeWorkspace)
  });

  const handleStart = async () => {
    const validationError = await validatePort(activePort);
    if (validationError) {
      toast.error(validationError || t('MOCK_SERVER.DASHBOARD.FIX_PORT_BEFORE_START'));
      return;
    }

    try {
      const payload = resolveStartPayload();
      const result = await dispatch(startMockServer(payload)).unwrap();
      await dispatch(syncMockServerState(location));

      toast.success(t('MOCK_SERVER.DASHBOARD.STARTED_AT', { baseUrl: result.baseUrl }));
    } catch (err) {
      toast.error(err.message || t('MOCK_SERVER.DASHBOARD.START_FAILED'));
    }
  };

  const handleStop = async () => {
    try {
      await dispatch(stopMockServer({ mockServerUid })).unwrap();
      await dispatch(syncMockServerState(location));
      toast.success(t('MOCK_SERVER.DASHBOARD.STOPPED'));
    } catch (err) {
      toast.error(err.message || t('MOCK_SERVER.DASHBOARD.STOP_FAILED'));
    }
  };

  const handleRefresh = async () => {
    try {
      const result = await dispatch(refreshMockRoutes(location)).unwrap();
      toast.success(t('MOCK_SERVER.DASHBOARD.ROUTES_REFRESHED', { routeCount: result.routeCount, exampleCount: result.exampleCount }));
    } catch (err) {
      toast.error(err.message || t('MOCK_SERVER.DASHBOARD.REFRESH_FAILED'));
    }
  };

  const persistInstance = async (updates) => {
    const nextInstance = {
      ...storedInstance,
      ...updates
    };

    await dispatch(saveMockServerInstance(nextInstance));

    if (updates.name !== undefined) {
      dispatch(updateMockServerTabName(nextInstance));
    }
  };

  const handleNameBlur = async () => {
    const trimmedName = nameValue.trim();

    if (!trimmedName || trimmedName === storedInstance.name) {
      setNameDraft(null);
      return;
    }

    if (!validateName(trimmedName)) {
      toast.error(validateNameError(trimmedName));
      setNameDraft(null);
      return;
    }

    if (isMockServerNameTaken(workspaceInstances, trimmedName, storedInstance.uid)) {
      toast.error(t('MOCK_SERVER.DASHBOARD.DUPLICATE_NAME'));
      setNameDraft(null);
      return;
    }

    try {
      await persistInstance({ name: trimmedName });
    } catch {
      toast.error(t('MOCK_SERVER.DASHBOARD.SAVE_NAME_FAILED'));
    } finally {
      setNameDraft(null);
    }
  };

  const handleDelayChange = (event) => {
    setDelayDraft(Number(event.target.value) || 0);
  };

  const handleDelayBlur = async () => {
    const newDelay = Number(delayValue) || 0;

    if (newDelay === activeDelay) {
      setDelayDraft(null);
      return;
    }

    try {
      if (isRunning) {
        await dispatch(updateMockDelay({ mockServerUid, delay: newDelay })).unwrap();
      }

      await persistInstance({ globalDelay: newDelay });
    } catch (err) {
      toast.error(err.message || t('MOCK_SERVER.DASHBOARD.UPDATE_DELAY_FAILED'));
    } finally {
      setDelayDraft(null);
    }
  };

  const handleCopyUrl = async () => {
    if (!baseUrl) return;
    try {
      await navigator.clipboard.writeText(baseUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error(t('MOCK_SERVER.DASHBOARD.COPY_URL_FAILED'));
    }
  };

  const statusDotClass = isRunning ? 'running' : isStarting ? 'starting' : isStopping ? 'stopping' : serverState.status === 'error' ? 'error' : '';
  const statusLabel = isRunning
    ? t('MOCK_SERVER.DASHBOARD.RUNNING_ON_PORT', { port: serverState.port })
    : isStarting
      ? t('MOCK_SERVER.DASHBOARD.STARTING')
      : isStopping
        ? t('MOCK_SERVER.DASHBOARD.STOPPING')
        : serverState.status === 'error'
          ? t('MOCK_SERVER.DASHBOARD.ERROR')
          : t('MOCK_SERVER.DASHBOARD.STOPPED');

  const getTabPanel = (tab) => {
    switch (tab) {
      case 'responses':
        return <MockResponsesList instance={instance} collection={collection} />;
      case 'routes':
        return <RouteTable mockServerUid={mockServerUid} />;
      case 'log':
        return <RequestLog mockServerUid={mockServerUid} location={location} />;
      default:
        return null;
    }
  };

  const sourceLabel = useMemo(() => {
    if (instance.sourceType === 'manual') {
      return t('MOCK_SERVER.DASHBOARD.STANDALONE');
    }

    if (instance.sourceType === 'spec') {
      const spec = resolveInstanceSpec(instance, apiSpecs);
      if (spec?.pathname) {
        return spec.name || spec.filename || spec.pathname;
      }
      return spec.name || spec.filename || spec.pathname || t('MOCK_SERVER.DASHBOARD.API_SPEC');
    }

    return collection?.name || t('MOCK_SERVER.DASHBOARD.COLLECTION');
  }, [apiSpecs, collection?.name, instance, t]);

  return (
    <StyledWrapper className="flex flex-col h-full relative px-4 py-4 overflow-hidden" data-testid="mock-server-dashboard" data-mock-server-uid={mockServerUid}>
      {settingsOpen && (
        <CreateMockServerModal
          editingInstance={instance}
          onClose={() => setSettingsOpen(false)}
          onDelete={() => {
            setSettingsOpen(false);
            setDeleteOpen(true);
          }}
        />
      )}
      {deleteOpen && (
        <DeleteMockServerModal
          instance={instance}
          onClose={() => setDeleteOpen(false)}
        />
      )}

      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0 flex-1">
          <input
            type="text"
            className="mock-server-name-input"
            aria-label={t('MOCK_SERVER.DASHBOARD.MOCK_SERVER_NAME')}
            value={nameValue}
            onChange={(event) => setNameDraft(event.target.value)}
            onBlur={handleNameBlur}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.currentTarget.blur();
              }
            }}
            data-testid="mock-server-title-input"
          />
          <div className="source-label" data-testid="mock-server-source-label">
            {t('MOCK_SERVER.DASHBOARD.SOURCE_LABEL', { source: sourceLabel })}
          </div>
        </div>
        <ActionIcon
          label={t('MOCK_SERVER.DASHBOARD.SETTINGS_TOOLTIP')}
          onClick={() => setSettingsOpen(true)}
          data-testid="mock-server-settings-btn"
        >
          <IconSettings size={16} stroke={1.5} aria-hidden="true" />
        </ActionIcon>
      </div>

      <div className="server-bar" data-testid="mock-server-controls">
        <div className="server-bar-main">
          <div className="status-indicator">
            <div className={`status-dot ${statusDotClass}`} data-testid="mock-server-status-dot" />
            <span className="status-text" data-testid="mock-server-status-text">{statusLabel}</span>
          </div>

          {isRunning && baseUrl && (
            <button className="copy-url-btn" onClick={handleCopyUrl} title={t('MOCK_SERVER.DASHBOARD.COPY_URL_TITLE')} data-testid="mock-server-copy-url">
              {copied ? <IconCheck size={13} strokeWidth={2} /> : <IconCopy size={13} strokeWidth={1.5} />}
              <span className="url-text">{baseUrl}</span>
            </button>
          )}

          {isRunning && (
            <div className="server-stats" data-testid="mock-server-stats">
              <span>{t('MOCK_SERVER.DASHBOARD.ROUTES_COUNT', { count: serverState.routeCount })}</span>
              <span>{t('MOCK_SERVER.DASHBOARD.RESPONSES_COUNT', { count: serverState.exampleCount })}</span>
            </div>
          )}

          <div className="server-controls">
            <div className="control-group">
              <label htmlFor="mock-server-delay-input">{t('MOCK_SERVER.DASHBOARD.DELAY_LABEL')}</label>
              <input
                id="mock-server-delay-input"
                type="number"
                value={delayValue}
                onChange={handleDelayChange}
                onBlur={handleDelayBlur}
                disabled={isStarting}
                min={0}
                step={100}
                data-testid="mock-server-delay-input"
              />
            </div>

            {!isRunning && !isStopping ? (
              <Button
                size="sm"
                icon={<IconPlayerPlay size={14} stroke={1.5} />}
                onClick={handleStart}
                disabled={isStarting || Boolean(portError)}
                data-testid="mock-server-start-btn"
              >
                {isStarting ? t('MOCK_SERVER.DASHBOARD.STARTING') : t('MOCK_SERVER.DASHBOARD.START_SERVER')}
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  color="danger"
                  size="sm"
                  icon={<IconPlayerStop size={14} stroke={1.5} />}
                  onClick={handleStop}
                  disabled={isStopping}
                  data-testid="mock-server-stop-btn"
                >
                  {isStopping ? t('MOCK_SERVER.DASHBOARD.STOPPING') : t('MOCK_SERVER.DASHBOARD.STOP_SERVER')}
                </Button>
                {!isStopping && (
                  <ActionIcon label={t('MOCK_SERVER.DASHBOARD.REFRESH_ROUTES_LABEL')} onClick={handleRefresh} data-testid="mock-server-refresh-btn">
                    <IconRefresh size={16} stroke={1.5} aria-hidden="true" />
                  </ActionIcon>
                )}
              </>
            )}
          </div>
        </div>

        {isRunning && storedInstance.port && serverState.port && Number(storedInstance.port) !== Number(serverState.port) && (
          <div className="server-notice" data-testid="mock-server-port-mismatch">
            {t('MOCK_SERVER.DASHBOARD.PORT_MISMATCH', { storedPort: storedInstance.port, runningPort: serverState.port })}
          </div>
        )}

        {serverState.error && (
          <div className="server-error" data-testid="mock-server-error">{serverState.error}</div>
        )}
      </div>

      <div className="flex flex-wrap items-center tabs" role="tablist">
        <Tab
          name="responses"
          label={t('MOCK_SERVER.DASHBOARD.TAB_RESPONSES')}
          isActive={activeTab === 'responses'}
          onClick={setActiveTab}
          data-testid="mock-server-tab-responses"
        />
        <Tab
          name="routes"
          label={t('MOCK_SERVER.DASHBOARD.TAB_ROUTES')}
          count={serverState.routeCount}
          isActive={activeTab === 'routes'}
          onClick={setActiveTab}
          data-testid="mock-server-tab-routes"
        />
        <Tab
          name="log"
          label={<>{t('MOCK_SERVER.DASHBOARD.TAB_LOG')}<MockServerLogCount mockServerUid={mockServerUid} /></>}
          isActive={activeTab === 'log'}
          onClick={setActiveTab}
          data-testid="mock-server-tab-log"
        />
      </div>

      <section className="mt-4 h-full overflow-auto">
        {getTabPanel(activeTab)}
      </section>
    </StyledWrapper>
  );
};

export default MockServerDashboard;
