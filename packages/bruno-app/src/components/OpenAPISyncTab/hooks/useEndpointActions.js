import { useState } from 'react';
import toast from 'react-hot-toast';

const useEndpointActions = (collection, collectionDrift, reloadDrift, t) => {
  const [pendingAction, setPendingAction] = useState(null);

  // Action execution helper — runs IPC call(s), shows toast, reloads drift
  const executeEndpointAction = async (ipcCalls, successMsg, errorMsg) => {
    try {
      const { ipcRenderer } = window;
      if (Array.isArray(ipcCalls[0])) {
        await Promise.all(ipcCalls.map(([channel, params]) => ipcRenderer.invoke(channel, params)));
      } else {
        const [channel, params] = ipcCalls;
        await ipcRenderer.invoke(channel, params);
      }
      toast.success(successMsg);
      await reloadDrift();
    } catch (err) {
      console.error(`Error: ${errorMsg}`, err);
      toast.error(errorMsg);
    }
  };

  // Confirmation handlers — show modal before executing
  const handleResetEndpoint = (endpoint) => {
    setPendingAction({
      type: 'reset-endpoint',
      title: t('OPENAPI_SYNC.ENDPOINT.RESET_TITLE'),
      message: t('OPENAPI_SYNC.ENDPOINT.CONFIRM_RESET', { method: endpoint.method, path: endpoint.path }),
      endpoint
    });
  };

  const handleResetAllModified = () => {
    if (!collectionDrift?.modified?.length) return;
    setPendingAction({
      type: 'reset-all-modified',
      title: t('OPENAPI_SYNC.ENDPOINT.RESET_ALL_TITLE'),
      message: t('OPENAPI_SYNC.ENDPOINT.CONFIRM_RESET_ALL', { count: collectionDrift.modified.length })
    });
  };

  const handleDeleteEndpoint = (endpoint) => {
    setPendingAction({
      type: 'delete-endpoint',
      title: t('OPENAPI_SYNC.ENDPOINT.DELETE_TITLE'),
      message: t('OPENAPI_SYNC.ENDPOINT.CONFIRM_DELETE', { method: endpoint.method, path: endpoint.path }),
      endpoint
    });
  };

  const handleDeleteAllLocalOnly = () => {
    if (!collectionDrift?.localOnly?.length) return;
    setPendingAction({
      type: 'delete-all-local',
      title: t('OPENAPI_SYNC.ENDPOINT.DELETE_ALL_TITLE'),
      message: t('OPENAPI_SYNC.ENDPOINT.CONFIRM_DELETE_ALL', { count: collectionDrift.localOnly.length })
    });
  };

  const handleRevertAllChanges = () => {
    const modifiedCount = collectionDrift?.modified?.length || 0;
    const missingCount = collectionDrift?.missing?.length || 0;
    const localOnlyCount = collectionDrift?.localOnly?.length || 0;

    setPendingAction({
      type: 'revert-all',
      title: t('OPENAPI_SYNC.ENDPOINT.REVERT_ALL_TITLE'),
      message: t('OPENAPI_SYNC.ENDPOINT.CONFIRM_REVERT_ALL', {
        modified: modifiedCount, missing: missingCount, local: localOnlyCount
      })
    });
  };

  const handleAddMissingEndpoint = (endpoint) => {
    setPendingAction({
      type: 'restore-endpoint',
      title: t('OPENAPI_SYNC.ENDPOINT.RESTORE_TITLE'),
      message: t('OPENAPI_SYNC.ENDPOINT.CONFIRM_RESTORE', { method: endpoint.method, path: endpoint.path }),
      endpoint
    });
  };

  const handleAddAllMissing = () => {
    if (!collectionDrift?.missing?.length) return;
    setPendingAction({
      type: 'restore-all-missing',
      title: t('OPENAPI_SYNC.ENDPOINT.RESTORE_ALL_TITLE'),
      message: t('OPENAPI_SYNC.ENDPOINT.CONFIRM_RESTORE_ALL', { count: collectionDrift.missing.length })
    });
  };

  // Execute confirmed action
  const confirmPendingAction = async () => {
    if (!pendingAction) return;

    const { type, endpoint } = pendingAction;
    setPendingAction(null);

    switch (type) {
      case 'reset-endpoint':
        return executeEndpointAction(
          ['renderer:reset-endpoints-to-spec', { collectionPath: collection.pathname, endpoints: [endpoint] }],
           t('OPENAPI_SYNC.TOAST.RESET_ENDPOINT', { method: endpoint.method, path: endpoint.path }),
          t('OPENAPI_SYNC.TOAST.RESET_FAILED')
        );
      case 'reset-all-modified':
        return executeEndpointAction(
          ['renderer:reset-endpoints-to-spec', { collectionPath: collection.pathname, endpoints: collectionDrift.modified }],
          t('OPENAPI_SYNC.TOAST.RESET_ENDPOINTS', { count: collectionDrift.modified.length }),
          t('OPENAPI_SYNC.TOAST.RESET_FAILED')
        );
      case 'delete-endpoint':
        return executeEndpointAction(
          ['renderer:delete-endpoints', { collectionPath: collection.pathname, collectionUid: collection.uid, endpoints: [endpoint] }],
          t('OPENAPI_SYNC.TOAST.DELETE_ENDPOINT', { method: endpoint.method, path: endpoint.path }),
          t('OPENAPI_SYNC.TOAST.DELETE_FAILED')
        );
      case 'delete-all-local':
        return executeEndpointAction(
          ['renderer:delete-endpoints', { collectionPath: collection.pathname, collectionUid: collection.uid, endpoints: collectionDrift.localOnly }],
          t('OPENAPI_SYNC.TOAST.DELETE_ENDPOINTS', { count: collectionDrift.localOnly.length }),
          t('OPENAPI_SYNC.TOAST.DELETE_FAILED')
        );
      case 'revert-all': {
        const calls = [];
        if (collectionDrift?.modified?.length > 0) {
          calls.push(['renderer:reset-endpoints-to-spec', { collectionPath: collection.pathname, endpoints: collectionDrift.modified }]);
        }
        if (collectionDrift?.missing?.length > 0) {
          calls.push(['renderer:add-missing-endpoints', { collectionPath: collection.pathname, endpoints: collectionDrift.missing }]);
        }
        if (collectionDrift?.localOnly?.length > 0) {
          calls.push(['renderer:delete-endpoints', { collectionPath: collection.pathname, collectionUid: collection.uid, endpoints: collectionDrift.localOnly }]);
        }
        return executeEndpointAction(calls, t('OPENAPI_SYNC.TOAST.DISCARD_SUCCESS'), t('OPENAPI_SYNC.TOAST.DISCARD_FAILED'));
      }
      case 'restore-endpoint':
        return executeEndpointAction(
          ['renderer:add-missing-endpoints', { collectionPath: collection.pathname, endpoints: [endpoint] }],
          t('OPENAPI_SYNC.TOAST.ADD_ENDPOINT', { method: endpoint.method, path: endpoint.path }),
          t('OPENAPI_SYNC.TOAST.ADD_FAILED')
        );
      case 'restore-all-missing':
        return executeEndpointAction(
          ['renderer:add-missing-endpoints', { collectionPath: collection.pathname, endpoints: collectionDrift.missing }],
          t('OPENAPI_SYNC.TOAST.ADD_ENDPOINTS', { count: collectionDrift.missing.length }),
          t('OPENAPI_SYNC.TOAST.ADD_FAILED')
        );
    }
  };

  return {
    pendingAction, setPendingAction,
    confirmPendingAction,
    handleResetEndpoint,
    handleResetAllModified,
    handleDeleteEndpoint,
    handleDeleteAllLocalOnly,
    handleRevertAllChanges,
    handleAddMissingEndpoint,
    handleAddAllMissing
  };
};

export default useEndpointActions;
