import Modal from 'components/Modal/index';
import Portal from 'components/Portal/index';
import { useFormik } from 'formik';
import { copyEnvironment } from 'providers/ReduxStore/slices/collections/actions';
import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useDispatch } from 'react-redux';
import * as Yup from 'yup';
import { useTranslation } from 'react-i18next';

const CopyEnvironment = ({ collection, environment, onClose }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const inputRef = useRef();
  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      name: environment.name + ' - Copy'
    },
    validationSchema: Yup.object({
      name: Yup.string()
        .min(1, t('ENVIRONMENTS.COPY.MIN_LENGTH'))
        .max(50, t('ENVIRONMENTS.COPY.MAX_LENGTH'))
        .required(t('ENVIRONMENTS.COPY.NAME_REQUIRED'))
    }),
    onSubmit: (values) => {
      dispatch(copyEnvironment(values.name, environment.uid, collection.uid))
        .then(() => {
          toast.success(t('ENVIRONMENTS.COPY.SUCCESS_COLLECTION'));
          onClose();
        })
        .catch(() => toast.error(t('ENVIRONMENTS.COPY.ERROR')));
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
      <Modal size="sm" title={t('ENVIRONMENTS.COPY.TITLE')} confirmText={t('ENVIRONMENTS.COPY.CONFIRM')} handleConfirm={onSubmit} handleCancel={onClose}>
        <form className="bruno-form" onSubmit={(e) => e.preventDefault()}>
          <div>
            <label htmlFor="name" className="block font-medium">
              {t('ENVIRONMENTS.COPY.NAME_LABEL')}
            </label>
            <input
              id="environment-name"
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

export default CopyEnvironment;
