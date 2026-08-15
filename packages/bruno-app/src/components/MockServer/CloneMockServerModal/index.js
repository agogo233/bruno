import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import toast from 'react-hot-toast';
import Portal from 'components/Portal';
import Modal from 'components/Modal';
import { loadMockResponses } from 'providers/ReduxStore/slices/mock-server/index';
import {
  cloneMockServerInstancePayload,
  checkMockServerPortAvailable,
  DEFAULT_MOCK_SERVER_PORT,
  getMockServerInstances,
  getMockServerNameError,
  getMockServerPortError,
  isMockServerNameTaken,
  isMockServerPortTaken,
  openMockServerDashboard,
  resolveTabCollectionUid,
  saveMockServerInstance,
  suggestAvailableMockServerPort
} from 'utils/mock-server/mock-server-instances';

const CloneMockServerModal = ({
  instance,
  workspacePath,
  workspaceCollections,
  activeWorkspace,
  onClose
}) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const inputRef = useRef();
  const activeWorkspaceUid = useSelector((state) => state.workspaces.activeWorkspaceUid);
  const configuredInstances = useSelector((state) => getMockServerInstances(state), shallowEqual);
  const existingInstances = useSelector((state) => getMockServerInstances(state, activeWorkspaceUid));

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      name: `${instance.name} copy`,
      port: DEFAULT_MOCK_SERVER_PORT
    },
    validationSchema: Yup.object({
      name: Yup.string()
        .trim()
        .min(1, () => t('MOCK_SERVER.CLONE_MODAL.MIN_CHAR'))
        .max(255, () => t('MOCK_SERVER.CLONE_MODAL.MAX_CHAR'))
        .test('is-valid-name', function (value) {
          const error = getMockServerNameError(value);
          return error ? this.createError({ message: error }) : true;
        })
        .required(() => t('MOCK_SERVER.CLONE_MODAL.NAME_REQUIRED'))
        .test('duplicate-name', () => t('MOCK_SERVER.CLONE_MODAL.DUPLICATE_NAME'), (value) => (
          !isMockServerNameTaken(existingInstances, value)
        )),
      port: Yup.number()
        .typeError(() => t('MOCK_SERVER.CLONE_MODAL.PORT_REQUIRED'))
        .required(() => t('MOCK_SERVER.CLONE_MODAL.PORT_REQUIRED'))
        .integer(() => t('MOCK_SERVER.CLONE_MODAL.PORT_INTEGER'))
        .min(1, () => t('MOCK_SERVER.CLONE_MODAL.PORT_MIN'))
        .max(65535, () => t('MOCK_SERVER.CLONE_MODAL.PORT_MAX'))
        .test('duplicate-port', () => t('MOCK_SERVER.CLONE_MODAL.DUPLICATE_PORT'), (value) => {
          const normalizedPort = Number(value);
          if (!normalizedPort) {
            return true;
          }

          return !isMockServerPortTaken(configuredInstances, normalizedPort);
        })
    }),
    onSubmit: async (values, { setFieldError }) => {
      if (!workspacePath) {
        toast.error(t('MOCK_SERVER.CLONE_MODAL.NO_WORKSPACE_PATH'));
        return;
      }

      const resolvedPort = Number(values.port);
      const portCheck = await checkMockServerPortAvailable(resolvedPort, configuredInstances);
      const portError = getMockServerPortError(portCheck, resolvedPort);
      if (portError) {
        setFieldError('port', portError);
        toast.error(portError);
        return;
      }

      const newInstance = cloneMockServerInstancePayload(instance, {
        name: values.name.trim(),
        port: resolvedPort,
        workspaceUid: activeWorkspaceUid
      });

      try {
        await dispatch(saveMockServerInstance(newInstance));

        const result = await window.ipcRenderer.invoke('renderer:mock-server-clone-responses', {
          workspacePath,
          sourceMockServerUid: instance.uid,
          targetMockServerUid: newInstance.uid
        });

        if (!result.success) {
          throw new Error(result.error);
        }

        await dispatch(loadMockResponses({
          mockServerUid: newInstance.uid,
          workspacePath
        }));

        const tabCollectionUid = resolveTabCollectionUid({
          sourceType: newInstance.sourceType,
          collectionUid: newInstance.collectionUid,
          activeWorkspace,
          workspaceCollections
        });

        dispatch(openMockServerDashboard(newInstance, tabCollectionUid));
        toast.success(t('MOCK_SERVER.CLONE_MODAL.CLONED'));
        onClose();
      } catch (err) {
        toast.error(err.message || t('MOCK_SERVER.CLONE_MODAL.CLONE_FAILED'));
      }
    }
  });

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    suggestAvailableMockServerPort(configuredInstances).then((port) => {
      if (!cancelled) {
        formik.setFieldValue('port', port);
      }
    }).catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [configuredInstances]);

  return (
    <Portal>
      <Modal
        size="md"
        title={t('MOCK_SERVER.CLONE_MODAL.TITLE')}
        confirmText={t('MOCK_SERVER.CLONE_MODAL.CONFIRM')}
        handleConfirm={() => formik.handleSubmit()}
        handleCancel={onClose}
        dataTestId="mock-server-clone-modal"
      >
        <form className="bruno-form" onSubmit={(event) => event.preventDefault()}>
          <div>
            <label htmlFor="mock-server-clone-name" className="block font-medium">
              {t('MOCK_SERVER.CLONE_MODAL.NAME')}
            </label>
            <input
              id="mock-server-clone-name"
              type="text"
              name="name"
              ref={inputRef}
              className="block textbox w-full mt-2"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              value={formik.values.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              data-testid="mock-server-clone-name-input"
            />
            {formik.touched.name && formik.errors.name ? (
              <div className="text-red-500 mt-1">{formik.errors.name}</div>
            ) : null}
          </div>

          <div className="mt-4">
            <label htmlFor="mock-server-clone-port" className="block font-medium">
              {t('MOCK_SERVER.CLONE_MODAL.PORT')}
            </label>
            <input
              id="mock-server-clone-port"
              type="number"
              name="port"
              className="block textbox w-full mt-2"
              min={1}
              max={65535}
              value={formik.values.port || ''}
              onChange={(event) => {
                formik.setFieldValue('port', event.target.value ? Number(event.target.value) : '');
              }}
              onBlur={formik.handleBlur}
              data-testid="mock-server-clone-port-input"
            />
            {formik.touched.port && formik.errors.port ? (
              <div className="text-red-500 mt-1">{formik.errors.port}</div>
            ) : null}
          </div>

          <p className="text-xs opacity-70 mt-4">
            {t('MOCK_SERVER.CLONE_MODAL.HINT')}
          </p>
        </form>
      </Modal>
    </Portal>
  );
};

export default CloneMockServerModal;
