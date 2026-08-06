import React, { useRef } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import toast from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import Modal from 'components/Modal';
import Portal from 'components/Portal';
import { newApp } from 'providers/ReduxStore/slices/collections/actions';
import { sanitizeName, validateName, validateNameError } from 'utils/common/regex';
import { useTranslation } from 'react-i18next';

const NewApp = ({ collectionUid, item, onClose }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const submitLockRef = useRef(false);

  const collection = useSelector((state) =>
    state.collections.collections?.find((c) => c.uid === collectionUid)
  );

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: { appName: '' },
    validationSchema: Yup.object({
      appName: Yup.string()
        .trim()
        .min(1, t('SIDEBAR.NEW_APP.NAME_REQUIRED'))
        .max(255, 'Must be 255 characters or less')
        .test('valid-name', validateNameError, (value) => validateName(value || ''))
        .required(t('SIDEBAR.NEW_APP.NAME_REQUIRED'))
    }),
    onSubmit: (values) => {
      const name = values.appName.trim();
      return dispatch(
        newApp({
          appName: name,
          filename: sanitizeName(name),
          collectionUid,
          itemUid: item ? item.uid : null
        })
      )
        .then(() => {
          toast.success(t('SIDEBAR.NEW_APP.CREATED'));
          onClose();
        })
        .catch((err) => toast.error(err?.message || t('SIDEBAR.NEW_APP.FAILED')))
        .finally(() => { submitLockRef.current = false; });
    }
  });

  const onSubmit = () => {
    if (submitLockRef.current || formik.isSubmitting) return;
    submitLockRef.current = true;
    formik.handleSubmit();
    setTimeout(() => { submitLockRef.current = false; }, 0);
  };

  return (
    <Portal>
      <Modal
        size="md"
        title={t('SIDEBAR.NEW_APP.TITLE')}
        confirmText={t('SIDEBAR.NEW_APP.CREATE')}
        handleConfirm={onSubmit}
        handleCancel={onClose}
        disableEscapeKey={false}
        disableCloseOnOutsideClick={false}
        confirmDisabled={formik.isSubmitting}
      >
        <form
          className="bruno-form"
          onSubmit={(e) => e.preventDefault()}
          data-testid="new-app-form"
        >
          <label htmlFor="appName" className="block font-semibold">
{t('SIDEBAR.NEW_APP.NAME')}
          </label>
          <input
            id="appName"
            type="text"
            name="appName"
            data-testid="new-app-name-input"
            autoFocus
            autoComplete="off"
            spellCheck="false"
            className="block textbox mt-2 w-full"
            value={formik.values.appName}
            onChange={formik.handleChange}
          />
          {formik.touched.appName && formik.errors.appName ? (
            <div className="text-red-500 text-xs mt-2">{formik.errors.appName}</div>
          ) : (
            <div className="text-xs mt-2 opacity-70">
              Creates a standalone app file in {item ? 'this folder' : `collection "${collection?.name || ''}"`}.
            </div>
          )}
        </form>
      </Modal>
    </Portal>
  );
};

export default NewApp;
