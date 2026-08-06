import React from 'react';
import Modal from 'components/Modal';
import Portal from 'components/Portal';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { deleteResponseExample } from 'providers/ReduxStore/slices/collections';
import { saveRequest, closeTabs } from 'providers/ReduxStore/slices/collections/actions';

const DeleteResponseExampleModal = ({ onClose, example, item, collection }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const onConfirm = (e) => {
    e.stopPropagation();
    dispatch(closeTabs({ tabUids: [example.uid] }));
    dispatch(deleteResponseExample({
      itemUid: item.uid,
      collectionUid: collection.uid,
      exampleUid: example.uid
    }));
    dispatch(saveRequest(item.uid, collection.uid, true))
      .then(() => {
        onClose();
      });
  };

  return (
    <Portal>
      <Modal
        size="sm"
        title={t('SIDEBAR.DELETE_EXAMPLE.TITLE')}
        confirmText={t('SIDEBAR.DELETE_EXAMPLE.DELETE')}
        handleConfirm={onConfirm}
        handleCancel={onClose}
        confirmButtonColor="danger"
      >
        {t('SIDEBAR.DELETE_EXAMPLE.CONFIRM')} <span className="font-medium">{example.name}</span>?
      </Modal>
    </Portal>
  );
};

export default DeleteResponseExampleModal;
