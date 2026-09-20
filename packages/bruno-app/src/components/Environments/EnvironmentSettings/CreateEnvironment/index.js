import React, { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useFormik } from 'formik';
import { addEnvironment } from 'providers/ReduxStore/slices/collections/actions';
import * as Yup from 'yup';
import { useDispatch } from 'react-redux';
import Portal from 'components/Portal';
import Modal from 'components/Modal';
import { validateName, validateNameError } from 'utils/common/regex';
import { useTranslation } from 'react-i18next';

const CreateEnvironment = ({ collection, onClose, onEnvironmentCreated }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const inputRef = useRef();

  const validateEnvironmentName = (name) => {
    return !collection?.environments?.some((env) => env?.name?.toLowerCase().trim() === name?.toLowerCase().trim());
  };

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      name: ''
    },
    validationSchema: Yup.object({
      name: Yup.string()
        .min(1, t('ENVIRONMENTS.CREATE.MIN_LENGTH'))
        .max(255, t('ENVIRONMENTS.CREATE.MAX_LENGTH'))
        .test('is-valid-filename', function (value) {
          const isValid = validateName(value);
          return isValid ? true : this.createError({ message: validateNameError(value) });
        })
        .required(t('ENVIRONMENTS.CREATE.NAME_REQUIRED'))
        .test('duplicate-name', t('ENVIRONMENTS.CREATE.ENV_EXISTS'), validateEnvironmentName)
    }),
    onSubmit: (values) => {
      dispatch(addEnvironment(values.name, collection.uid))
        .then(() => {
          toast.success(t('ENVIRONMENTS.CREATE.SUCCESS'));
          onClose();
          // Call the callback if provided
          if (onEnvironmentCreated) {
            onEnvironmentCreated();
          }
        })
        .catch(() => toast.error(t('ENVIRONMENTS.CREATE.ERROR')));
    }
  });

  useEffect(() => {
    if (inputRef && inputRef.current) {
      inputRef.current.focus();
    }
  }, [inputRef]);

  const onSubmit = () => {
    formik.handleSubmit();
  };

  return (
    <Portal>
      <Modal
        size="md"
        title={t('ENVIRONMENTS.CREATE.TITLE')}
        confirmText={t('ENVIRONMENTS.CREATE.CONFIRM')}
        handleConfirm={onSubmit}
        handleCancel={onClose}
        dataTestId="create-environment-modal"
      >
        <form className="bruno-form" onSubmit={(e) => e.preventDefault()}>
          <div>
            <label htmlFor="name" className="block font-medium">
              {t('ENVIRONMENTS.CREATE.NAME_LABEL')}
            </label>
            <div className="flex items-center mt-2">
              <input
                id="environment-name"
                type="text"
                name="name"
                ref={inputRef}
                data-testid="environment-name-input"
                className="block textbox w-full"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                onChange={formik.handleChange}
                value={formik.values.name || ''}
              />
            </div>
            {formik.touched.name && formik.errors.name ? (
              <div className="text-red-500">{formik.errors.name}</div>
            ) : null}
          </div>
        </form>
      </Modal>
    </Portal>
  );
};

export default CreateEnvironment;
