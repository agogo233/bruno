import React from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Portal from 'components/Portal';
import Modal from 'components/Modal';
import StyledWrapper from './StyledWrapper';

const SaveFileErrorModal = ({ error }) => {
  const { t } = useTranslation();
  const [showModal, setShowModal] = useState(true);
  return (
    <>
      {showModal ? (
        <Portal>
          <StyledWrapper>
            <Modal
              size="sm"
              title={t('ERRORS.saveFileErrorTitle')}
              hideFooter={true}
              hideCancel={true}
              handleCancel={() => {
                setShowModal(false);
              }}
              disableCloseOnOutsideClick={true}
              disableEscapeKey={true}
            >
              <pre className="w-full flex flex-wrap whitespace-pre-wrap">{error}</pre>
            </Modal>
          </StyledWrapper>
        </Portal>
      ) : null}
    </>
  );
};

export default SaveFileErrorModal;
