import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { closeTabs } from 'providers/ReduxStore/slices/collections/actions';
import { useDispatch } from 'react-redux';
import ErrorBanner from 'ui/ErrorBanner';
import Button from 'ui/Button';

const RequestNotFound = ({ itemUid }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const [showErrorMessage, setShowErrorMessage] = useState(false);

  const closeTab = () => {
    dispatch(
      closeTabs({
        tabUids: [itemUid]
      })
    );
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowErrorMessage(true);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  if (!showErrorMessage) {
    return null;
  }

  const errors = [
    {
      title: t('REQUEST_TAB_PANEL.NOT_FOUND.REQUEST_TITLE'),
      message: t('REQUEST_TAB_PANEL.NOT_FOUND.REQUEST_MESSAGE')
    }
  ];

  return (
    <div className="mt-6 px-6">
      <ErrorBanner errors={errors} className="mb-4" />
      <Button size="md" color="secondary" variant="ghost" onClick={closeTab}>
        {t('REQUEST_TAB_PANEL.NOT_FOUND.CLOSE_TAB')}
      </Button>
    </div>
  );
};

export default RequestNotFound;
