import React from 'react';
import Portal from 'components/Portal/index';
import toast from 'react-hot-toast';
import Modal from 'components/Modal/index';
import { deleteEnvironment } from 'providers/ReduxStore/slices/collections/actions';
import { useDispatch } from 'react-redux';
import StyledWrapper from './StyledWrapper';
import { useTranslation } from 'react-i18next';

const DeleteEnvironment = ({ onClose, environment, collection }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const onConfirm = () => {
    dispatch(deleteEnvironment(environment.uid, collection.uid))
      .then(() => {
        toast.success(t('ENVIRONMENTS.DELETE.SUCCESS'));
        onClose();
      })
      .catch(() => toast.error(t('ENVIRONMENTS.DELETE.ERROR')));
  };

  return (
    <Portal>
      <StyledWrapper>
        <Modal
          size="md"
          title={t('ENVIRONMENTS.DELETE.TITLE')}
          confirmText={t('ENVIRONMENTS.DELETE.CONFIRM')}
          handleConfirm={onConfirm}
          handleCancel={onClose}
          confirmButtonColor="danger"
        >
          {t('ENVIRONMENTS.DELETE.CONFIRM_MESSAGE', { name: environment.name })}
        </Modal>
      </StyledWrapper>
    </Portal>
  );
};

export default DeleteEnvironment;
