import React, { useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import Modal from 'components/Modal';
import { isGitRepositoryUrl } from 'utils/git';
import { connectCollectionToGit } from 'providers/ReduxStore/slices/workspaces/actions';

const ConnectGitRemote = ({ collectionPath, collectionName, initialUrl = '', onClose }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const inputRef = useRef();
  const activeWorkspaceUid = useSelector((state) => state.workspaces.activeWorkspaceUid);

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      remoteUrl: initialUrl
    },
    validationSchema: Yup.object({
      remoteUrl: Yup.string()
        .trim()
         .required(t('WORKSPACE_HOME.CONNECT_GIT.URL_REQUIRED'))
         .test('is-git-url', t('WORKSPACE_HOME.CONNECT_GIT.INVALID_URL'), (value) => isGitRepositoryUrl(value))
    }),
    onSubmit: (values) => {
      dispatch(
        connectCollectionToGit({
          workspaceUid: activeWorkspaceUid,
          collectionPath,
          remoteUrl: values.remoteUrl.trim()
        })
      )
        .then(() => {
           toast.success(t('WORKSPACE_HOME.CONNECT_GIT.CONNECTED'));
          onClose();
        })
        .catch(() => {
          // toast already handled in the thunk
        });
    }
  });

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const title = initialUrl ? t('WORKSPACE_HOME.CONNECT_GIT.TITLE_UPDATE') : t('WORKSPACE_HOME.CONNECT_GIT.TITLE_CONNECT');
  const confirmText = initialUrl ? t('WORKSPACE_HOME.CONNECT_GIT.CONFIRM_UPDATE') : t('WORKSPACE_HOME.CONNECT_GIT.CONFIRM_CONNECT');

  return (
    <Modal size="md" title={title} confirmText={confirmText} handleConfirm={() => formik.handleSubmit()} handleCancel={onClose}>
      <form className="bruno-form" onSubmit={(e) => e.preventDefault()}>
        {collectionName ? (
          <div className="text-sm text-muted mb-3 leading-relaxed break-words space-y-2">
             <p className="m-0">
               {t('WORKSPACE_HOME.CONNECT_GIT.DESCRIPTION_LINE1', { name: collectionName })}
             </p>
             <p className="m-0">
               {t('WORKSPACE_HOME.CONNECT_GIT.DESCRIPTION_LINE2')}
             </p>
          </div>
        ) : null}
        <div>
           <label htmlFor="remoteUrl" className="block font-medium">
             {t('WORKSPACE_HOME.CONNECT_GIT.LABEL')}
           </label>
           <input
             id="remoteUrl"
             type="text"
             name="remoteUrl"
             ref={inputRef}
             className="block textbox mt-2 w-full"
             placeholder={t('WORKSPACE_HOME.CONNECT_GIT.PLACEHOLDER')}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            onChange={formik.handleChange}
            value={formik.values.remoteUrl || ''}
          />
          {formik.touched.remoteUrl && formik.errors.remoteUrl ? (
            <div className="text-red-500">{formik.errors.remoteUrl}</div>
          ) : null}
        </div>
      </form>
    </Modal>
  );
};

export default ConnectGitRemote;
