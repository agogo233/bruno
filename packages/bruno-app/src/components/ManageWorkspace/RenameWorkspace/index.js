import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import Portal from 'components/Portal/index';
import Modal from 'components/Modal/index';
import toast from 'react-hot-toast';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';
import { renameWorkspaceAction } from 'providers/ReduxStore/slices/workspaces/actions';

const RenameWorkspace = ({ onClose, workspace }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { workspaces } = useSelector((state) => state.workspaces);
  const inputRef = useRef();

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      name: workspace.name
    },
    validationSchema: Yup.object({
      name: Yup.string()
        .min(1, t('MANAGE_WORKSPACE.MIN_LENGTH'))
        .max(255, t('MANAGE_WORKSPACE.MAX_LENGTH'))
        .required(t('MANAGE_WORKSPACE.NAME_REQUIRED'))
        .test('unique-name', t('MANAGE_WORKSPACE.NAME_EXISTS'), function (value) {
          if (!value) return true;
          return !workspaces.some((w) =>
            w.uid !== workspace.uid && w.name && w.name.toLowerCase() === value.toLowerCase()
          );
        })
    }),
    onSubmit: (values) => {
      if (values.name === workspace.name) {
        onClose();
        return;
      }
      dispatch(renameWorkspaceAction(workspace.uid, values.name))
        .then(() => {
          onClose();
        })
        .catch((error) => {
          toast.error(error?.message || t('MANAGE_WORKSPACE.ERROR_RENAMING'));
        });
    }
  });

  useEffect(() => {
    if (inputRef && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [inputRef]);

  const onSubmit = () => {
    formik.handleSubmit();
  };

  return (
    <Portal>
      <Modal
        size="md"
        title={t('MANAGE_WORKSPACE.RENAME_TITLE')}
        confirmText={t('MANAGE_WORKSPACE.RENAME')}
        handleConfirm={onSubmit}
        handleCancel={onClose}
      >
        <form className="bruno-form" onSubmit={(e) => e.preventDefault()}>
          <div>
            <label htmlFor="workspace-name" className="block font-semibold">
              {t('MANAGE_WORKSPACE.WORKSPACE_NAME_LABEL')}
            </label>
            <input
              id="workspace-name"
              type="text"
              name="name"
              ref={inputRef}
              className="block textbox mt-2 w-full"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              onChange={formik.handleChange}
              value={formik.values.name || ''}
            />
            {formik.touched.name && formik.errors.name ? (
              <div className="text-red-500">{formik.errors.name}</div>
            ) : null}
          </div>
        </form>
      </Modal>
    </Portal>
  );
};

export default RenameWorkspace;
