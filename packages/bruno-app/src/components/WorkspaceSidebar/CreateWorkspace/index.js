import React, { useRef, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFormik } from 'formik';
import { useDispatch, useSelector } from 'react-redux';
import * as Yup from 'yup';
import toast from 'react-hot-toast';
import { IconArrowBackUp, IconEdit } from '@tabler/icons';
import Modal from 'components/Modal';
import Help from 'components/Help';
import PathDisplay from 'components/PathDisplay/index';
import { createWorkspaceAction } from 'providers/ReduxStore/slices/workspaces/actions';
import { browseDirectory } from 'providers/ReduxStore/slices/collections/actions';
import { multiLineMsg } from 'utils/common/index';
import { formatIpcError } from 'utils/common/error';
import { sanitizeName, validateName, validateNameError } from 'utils/common/regex';
import get from 'lodash/get';

const CreateWorkspace = ({ onClose }) => {
  const { t } = useTranslation();
  const inputRef = useRef();
  const dispatch = useDispatch();
  const workspaces = useSelector((state) => state.workspaces.workspaces);
  const preferences = useSelector((state) => state.app.preferences);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const defaultLocation = get(preferences, 'general.defaultLocation', '');

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      workspaceName: '',
      workspaceFolderName: '',
      workspaceLocation: defaultLocation
    },
    validationSchema: Yup.object({
      workspaceName: Yup.string()
        .trim()
        .min(1, t('WORKSPACE_SIDEBAR.CREATE_WORKSPACE.NAME_CANNOT_BE_EMPTY'))
        .max(255, t('WORKSPACE_SIDEBAR.CREATE_WORKSPACE.NAME_MAX_LENGTH'))
        .required(t('WORKSPACE_SIDEBAR.CREATE_WORKSPACE.NAME_REQUIRED'))
        .test('unique-name', t('WORKSPACE_SIDEBAR.CREATE_WORKSPACE.NAME_ALREADY_EXISTS'), function (value) {
          if (!value) return true;

          return !workspaces.some((w) =>
            !w.isCreating && w.name && w.name.toLowerCase() === value.toLowerCase());
        }),
      workspaceFolderName: Yup.string()
        .min(1, t('WORKSPACE_SIDEBAR.CREATE_WORKSPACE.FOLDER_MIN_LENGTH'))
        .max(255, t('WORKSPACE_SIDEBAR.CREATE_WORKSPACE.FOLDER_MAX_LENGTH'))
        .test('is-valid-folder-name', function (value) {
          const isValid = validateName(value);
          return isValid ? true : this.createError({ message: validateNameError(value) });
        })
        .required(t('WORKSPACE_SIDEBAR.CREATE_WORKSPACE.FOLDER_REQUIRED')),
      workspaceLocation: Yup.string().min(1, t('WORKSPACE_SIDEBAR.CREATE_WORKSPACE.LOCATION_REQUIRED')).required(t('WORKSPACE_SIDEBAR.CREATE_WORKSPACE.LOCATION_REQUIRED'))
    }),
    onSubmit: async (values) => {
      if (isSubmitting) return;

      try {
        setIsSubmitting(true);

        await dispatch(createWorkspaceAction(values.workspaceName.trim(), values.workspaceFolderName, values.workspaceLocation));
        toast.success(t('WORKSPACE_SIDEBAR.CREATE_WORKSPACE.WORKSPACE_CREATED'));
        onClose();
      } catch (error) {
        toast.error(multiLineMsg(t('WORKSPACE_SIDEBAR.CREATE_WORKSPACE.ERROR_CREATING_WORKSPACE'), formatIpcError(error)));
      } finally {
        setIsSubmitting(false);
      }
    }
  });

  const browse = () => {
    dispatch(browseDirectory())
      .then((dirPath) => {
        if (typeof dirPath === 'string') {
          formik.setFieldValue('workspaceLocation', dirPath);
        }
      })
      .catch((error) => {
        formik.setFieldValue('workspaceLocation', '');
        console.error(error);
      });
  };

  useEffect(() => {
    if (inputRef && inputRef.current) {
      inputRef.current.focus();
    }
  }, [inputRef]);

  return (
    <Modal
      size="md"
      title={t('WORKSPACE_SIDEBAR.CREATE_WORKSPACE.TITLE')}
      description={t('WORKSPACE_SIDEBAR.CREATE_WORKSPACE.DESCRIPTION')}
      confirmText={isSubmitting ? t('WORKSPACE_SIDEBAR.CREATE_WORKSPACE.CREATING') : t('WORKSPACE_SIDEBAR.CREATE_WORKSPACE.CREATE_WORKSPACE')}
      handleConfirm={formik.handleSubmit}
      handleCancel={onClose}
      style="new"
      confirmDisabled={isSubmitting}
    >
      <div>
        <form className="bruno-form" onSubmit={formik.handleSubmit}>
          <div className="mb-4">
            <label htmlFor="workspaceName" className="block font-semibold mb-2">
              {t('WORKSPACE_SIDEBAR.CREATE_WORKSPACE.NAME')}
            </label>
            <input
              id="workspace-name"
              type="text"
              name="workspaceName"
              ref={inputRef}
              className="block textbox w-full"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              onChange={(e) => {
                const workspaceName = e.target.value;
                if (!isEditing) {
                  formik.setValues((values) => ({
                    ...values,
                    workspaceName,
                    workspaceFolderName: sanitizeName(workspaceName)
                  }));
                  return;
                }

                formik.handleChange(e);
              }}
              value={formik.values.workspaceName || ''}
            />
            {formik.touched.workspaceName && formik.errors.workspaceName ? (
              <div className="text-red-500 text-sm mt-1">{formik.errors.workspaceName}</div>
            ) : null}
          </div>

          {formik.values.workspaceName?.trim()?.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="workspaceFolderName" className="flex items-center font-semibold">
                  {t('WORKSPACE_SIDEBAR.CREATE_WORKSPACE.FOLDER_NAME')}
                  <Help width="300">
                    <p>
                      {t('WORKSPACE_SIDEBAR.CREATE_WORKSPACE.FOLDER_NAME_HINT_1')}
                    </p>
                    <p className="mt-2">
                      {t('WORKSPACE_SIDEBAR.CREATE_WORKSPACE.FOLDER_NAME_HINT_2')}
                    </p>
                  </Help>
                </label>
                {isEditing ? (
                  <IconArrowBackUp
                    className="cursor-pointer opacity-50 hover:opacity-80"
                    size={16}
                    strokeWidth={1.5}
                    onClick={() => setIsEditing(false)}
                  />
                ) : (
                  <IconEdit
                    className="cursor-pointer opacity-50 hover:opacity-80"
                    size={16}
                    strokeWidth={1.5}
                    onClick={() => setIsEditing(true)}
                  />
                )}
              </div>
              {isEditing ? (
                <input
                  id="workspace-folder-name"
                  type="text"
                  name="workspaceFolderName"
                  className="block textbox w-full"
                  onChange={formik.handleChange}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                  value={formik.values.workspaceFolderName || ''}
                />
              ) : (
                <PathDisplay baseName={formik.values.workspaceFolderName} />
              )}
              {formik.touched.workspaceFolderName && formik.errors.workspaceFolderName ? (
                <div className="text-red-500 text-sm mt-1">{formik.errors.workspaceFolderName}</div>
              ) : null}
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="workspaceLocation" className="font-semibold mb-2 flex items-center">
              {t('WORKSPACE_SIDEBAR.CREATE_WORKSPACE.LOCATION')}
              <Help>
                <p>
                  {t('WORKSPACE_SIDEBAR.CREATE_WORKSPACE.LOCATION_HINT_1')}
                </p>
                <p className="mt-2">
                  {t('WORKSPACE_SIDEBAR.CREATE_WORKSPACE.LOCATION_HINT_2')}
                </p>
              </Help>
            </label>
            <input
              id="workspace-location"
              type="text"
              name="workspaceLocation"
              readOnly={true}
              className="block textbox mt-2 w-full cursor-pointer"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              value={formik.values.workspaceLocation || ''}
              onClick={browse}
            />
            {formik.touched.workspaceLocation && formik.errors.workspaceLocation ? (
              <div className="text-red-500 text-sm mt-1">{formik.errors.workspaceLocation}</div>
            ) : null}
            <div className="mt-1">
              <span
                className="text-link cursor-pointer hover:underline"
                onClick={browse}
              >
                {t('WORKSPACE_SIDEBAR.CREATE_WORKSPACE.BROWSE')}
              </span>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default CreateWorkspace;
