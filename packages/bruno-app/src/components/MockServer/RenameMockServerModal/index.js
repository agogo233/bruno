import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import toast from 'react-hot-toast';
import Portal from 'components/Portal';
import Modal from 'components/Modal';
import {
  findMockServerInstance,
  getMockServerInstances,
  getMockServerNameError,
  isMockServerNameTaken,
  saveMockServerInstance,
  updateMockServerTabName
} from 'utils/mock-server/mock-server-instances';

const RenameMockServerModal = ({ instance, onClose }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const inputRef = useRef();
  const activeWorkspaceUid = useSelector((state) => state.workspaces.activeWorkspaceUid);
  const storedInstance = useSelector((state) => (
    findMockServerInstance(state, instance.uid) || instance
  ));
  const existingInstances = useSelector((state) => getMockServerInstances(state, activeWorkspaceUid));

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      name: storedInstance.name
    },
    validationSchema: Yup.object({
      name: Yup.string()
        .trim()
        .min(1, () => t('MOCK_SERVER.RENAME_MODAL.MIN_CHAR'))
        .max(255, () => t('MOCK_SERVER.RENAME_MODAL.MAX_CHAR'))
        .test('is-valid-name', function (value) {
          const error = getMockServerNameError(value);
          return error ? this.createError({ message: error }) : true;
        })
        .required(() => t('MOCK_SERVER.RENAME_MODAL.NAME_REQUIRED'))
        .test('duplicate-name', () => t('MOCK_SERVER.RENAME_MODAL.DUPLICATE_NAME'), (value) => (
          !isMockServerNameTaken(existingInstances, value, storedInstance.uid)
        ))
    }),
    onSubmit: async (values) => {
      const nextInstance = {
        ...storedInstance,
        name: values.name.trim()
      };

      try {
        await dispatch(saveMockServerInstance(nextInstance));
        dispatch(updateMockServerTabName(nextInstance));
        toast.success(t('MOCK_SERVER.RENAME_MODAL.RENAMED'));
        onClose();
      } catch (err) {
        toast.error(err?.message || t('MOCK_SERVER.RENAME_MODAL.RENAME_FAILED'));
      }
    }
  });

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, []);

  const handleCancel = () => {
    formik.resetForm({ values: formik.values });
    onClose();
  };

  return (
    <Portal>
      <Modal
        size="md"
        title={t('MOCK_SERVER.RENAME_MODAL.TITLE')}
        confirmText={t('MOCK_SERVER.RENAME_MODAL.CONFIRM')}
        handleConfirm={() => formik.handleSubmit()}
        handleCancel={handleCancel}
        dataTestId="mock-server-rename-modal"
      >
        <form className="bruno-form" onSubmit={(event) => event.preventDefault()}>
          <div>
            <label htmlFor="mock-server-rename-name" className="block font-medium">
              {t('MOCK_SERVER.RENAME_MODAL.NAME')}
            </label>
            <input
              id="mock-server-rename-name"
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
              data-testid="mock-server-rename-name-input"
            />
            {formik.touched.name && formik.errors.name ? (
              <div className="text-red-500 mt-1">{formik.errors.name}</div>
            ) : null}
          </div>
        </form>
      </Modal>
    </Portal>
  );
};

export default RenameMockServerModal;
