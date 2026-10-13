import React, { useRef, useEffect, useCallback } from 'react';
import get from 'lodash/get';
import debounce from 'lodash/debounce';
import { useFormik } from 'formik';
import { useSelector, useDispatch } from 'react-redux';
import { savePreferences } from 'providers/ReduxStore/slices/app';
import { browseDirectory } from 'providers/ReduxStore/slices/collections/actions';
import StyledWrapper from './StyledWrapper';
import * as Yup from 'yup';
import toast from 'react-hot-toast';
import { IconTrash, IconUpload } from '@tabler/icons';
import path from 'utils/common/path';
import { SettingsGroup, CheckboxSetting, SettingsField } from '../SettingsLayout';
import { useTranslation } from 'react-i18next';
import i18n from 'i18next';

const General = () => {
  const { t } = useTranslation();
  const preferences = useSelector((state) => state.app.preferences);
  const dispatch = useDispatch();
  // The file input is hidden; the visible button forwards its click here.
  const inputFileCaCertificateRef = useRef();

  const preferencesSchema = Yup.object().shape({
    sslVerification: Yup.boolean(),
    customCaCertificate: Yup.object({
      enabled: Yup.boolean(),
      filePath: Yup.string().nullable()
    }),
    keepDefaultCaCertificates: Yup.object({
      enabled: Yup.boolean()
    }),
    storeCookies: Yup.boolean(),
    sendCookies: Yup.boolean(),
    timeout: Yup.mixed()
      .transform((value, originalValue) => {
        return originalValue === '' ? undefined : value;
      })
      .nullable()
      .test('isNumber', t('GENERAL.TIMEOUT_NUMBER'), (value) => {
        return value === undefined || !isNaN(value);
      })
      .test('isValidTimeout', t('GENERAL.TIMEOUT_MIN'), (value) => {
        return value === undefined || Number(value) >= 0;
      }),
    autoSave: Yup.object({
      enabled: Yup.boolean(),
      interval: Yup.mixed()
        .transform((value, originalValue) => {
          return originalValue === '' ? undefined : value;
        })
        .test('isNumber', t('GENERAL.SAVE_DELAY_NUMBER'), (value) => {
          return value === undefined || !isNaN(value);
        })
        .test('isValidInterval', t('GENERAL.SAVE_DELAY_MIN'), (value) => {
          return value === undefined || Number(value) >= 500;
        })
        .test('intervalRequired', t('GENERAL.SAVE_DELAY_REQUIRED'), function (value) {
          return !(this.parent.enabled && (value === undefined || value === ''));
        })
    }),
    oauth2: Yup.object({
      useSystemBrowser: Yup.boolean()
    }),
    defaultLocation: Yup.string().max(1024)
  });

  const formik = useFormik({
    initialValues: {
      sslVerification: preferences.request.sslVerification,
      customCaCertificate: {
        enabled: get(preferences, 'request.customCaCertificate.enabled', false),
        filePath: get(preferences, 'request.customCaCertificate.filePath', null)
      },
      keepDefaultCaCertificates: {
        enabled: get(preferences, 'request.keepDefaultCaCertificates.enabled', true)
      },
      timeout: preferences.request.timeout,
      storeCookies: get(preferences, 'request.storeCookies', true),
      sendCookies: get(preferences, 'request.sendCookies', true),
      autoSave: {
        enabled: get(preferences, 'autoSave.enabled', false),
        interval: get(preferences, 'autoSave.interval', 1000)
      },
      oauth2: {
        useSystemBrowser: get(preferences, 'request.oauth2.useSystemBrowser', false)
      },
      defaultLocation: get(preferences, 'general.defaultLocation', '')
    },
    validationSchema: preferencesSchema,
    onSubmit: async (values) => {
      try {
        const newPreferences = await preferencesSchema.validate(values, { abortEarly: true });
        handleSave(newPreferences);
      } catch (error) {
        console.error('Preferences validation error:', error.message);
      }
    }
  });

  const handleSave = useCallback((newPreferences) => {
    dispatch(
      savePreferences({
        ...preferences,
        request: {
          ...preferences.request,
          sslVerification: newPreferences.sslVerification,
          customCaCertificate: {
            enabled: newPreferences.customCaCertificate.enabled,
            filePath: newPreferences.customCaCertificate.filePath
          },
          keepDefaultCaCertificates: {
            enabled: newPreferences.keepDefaultCaCertificates.enabled
          },
          timeout: newPreferences.timeout,
          storeCookies: newPreferences.storeCookies,
          sendCookies: newPreferences.sendCookies,
          oauth2: {
            useSystemBrowser: newPreferences.oauth2.useSystemBrowser
          }
        },
        autoSave: {
          enabled: newPreferences.autoSave.enabled,
          interval: newPreferences.autoSave.interval
        },
        general: {
          defaultLocation: newPreferences.defaultLocation
        }
      }))
      .catch((err) => console.log(err) && toast.error(t('GENERAL.FAILED_UPDATE')));
  }, [dispatch, preferences]);

  const handleSaveRef = useRef(handleSave);
  handleSaveRef.current = handleSave;

  const debouncedSave = useCallback(
    debounce((values) => {
      preferencesSchema.validate(values, { abortEarly: true })
        .then((validatedValues) => {
          handleSaveRef.current(validatedValues);
        })
        .catch((error) => {
        });
    }, 500),
    []
  );

  useEffect(() => {
    if (formik.dirty && formik.isValid) {
      debouncedSave(formik.values);
    }
    return () => {
      debouncedSave.flush();
    };
  }, [formik.values, formik.dirty, formik.isValid, debouncedSave]);

  const addCaCertificate = (e) => {
    const filePath = window?.ipcRenderer?.getFilePath(e?.target?.files?.[0]);
    if (filePath) {
      formik.setFieldValue('customCaCertificate.filePath', filePath);
    }
  };

  const deleteCaCertificate = () => {
    formik.setFieldValue('customCaCertificate.filePath', null);
  };

  const browseDefaultLocation = () => {
    dispatch(browseDirectory())
      .then((dirPath) => {
        if (typeof dirPath === 'string') {
          formik.setFieldValue('defaultLocation', dirPath);
        }
      })
      .catch((error) => {
        // cancelling resolves false, so this is a real failure: keep the existing value
        console.error(error);
        toast.error('Failed to browse for a default location');
      });
  };

  const customCaCertificateEnabled = formik.values.customCaCertificate.enabled;
  const customCaCertificatePath = formik.values.customCaCertificate.filePath;
  const keepDefaultCaCertificatesDisabled = !(customCaCertificateEnabled && customCaCertificatePath);
  const autoSaveEnabled = formik.values.autoSave.enabled;

  // gate typed field errors on touched so they are not flashed on every keystroke
  const autoSaveIntervalTouched = get(formik.touched, 'autoSave.interval', false);
  const autoSaveError = autoSaveIntervalTouched ? formik.errors.autoSave?.interval : undefined;
  const timeoutError = formik.touched.timeout ? formik.errors.timeout : undefined;

  const handleLanguageChange = (e) => {
    const lng = e.target.value;
    i18n.changeLanguage(lng);
    localStorage.setItem('i18nextLng', lng);
  };

  return (
    <StyledWrapper className="w-full">
      <div className="section-header">{t('GENERAL.SETTINGS')}</div>
      <form className="bruno-form settings-form" onSubmit={formik.handleSubmit}>
        <SettingsGroup title="Certificates">
          <CheckboxSetting
            id="sslVerification"
            name="sslVerification"
            label={t('GENERAL.SSL_VERIFICATION')}
            checked={formik.values.sslVerification}
            onChange={formik.handleChange}
          />
          <CheckboxSetting
            id="customCaCertificateEnabled"
            name="customCaCertificate.enabled"
            label={t('GENERAL.USE_CUSTOM_CA')}
            checked={customCaCertificateEnabled}
            onChange={formik.handleChange}
          >
            <div className={`ca-certificate-picker ${customCaCertificateEnabled ? '' : 'is-disabled'}`}>
              {customCaCertificatePath ? (
                <span className="ca-certificate-file">
                  {path.basename(customCaCertificatePath)}
                  <button
                    type="button"
                    className="ca-certificate-remove"
                    aria-label="Remove custom CA certificate"
                    data-testid="general-remove-ca-certificate"
                    disabled={!customCaCertificateEnabled}
                    onClick={deleteCaCertificate}
                  >
                    <IconTrash strokeWidth={1.5} size={14} />
                  </button>
                </span>
              ) : (
                <>
                  <button
                    type="button"
                    className="ca-certificate-select"
                    data-testid="general-select-ca-certificate"
                    disabled={!customCaCertificateEnabled}
                    onClick={() => inputFileCaCertificateRef.current.click()}
                  >
                    <IconUpload strokeWidth={1.5} size={14} aria-hidden="true" />
                    {t('GENERAL.SELECT_FILE')}
                  </button>
                  <input
                    id="caCertFilePath"
                    type="file"
                    name="customCaCertificate.filePath"
                    className="hidden"
                    ref={inputFileCaCertificateRef}
                    disabled={!customCaCertificateEnabled}
                    onChange={addCaCertificate}
                  />
                </>
              )}
            </div>
            <CheckboxSetting
              id="keepDefaultCaCertificatesEnabled"
              name="keepDefaultCaCertificates.enabled"
              label={t('GENERAL.KEEP_DEFAULT_CA')}
              checked={formik.values.keepDefaultCaCertificates.enabled}
              onChange={formik.handleChange}
              disabled={keepDefaultCaCertificatesDisabled}
            />
          </CheckboxSetting>
        </SettingsGroup>

        <SettingsGroup title="Cookies & Authorization">
          <CheckboxSetting
            id="storeCookies"
            name="storeCookies"
            label={t('GENERAL.STORE_COOKIES')}
            checked={formik.values.storeCookies}
            onChange={formik.handleChange}
          />
          <CheckboxSetting
            id="sendCookies"
            name="sendCookies"
            label={t('GENERAL.SEND_COOKIES')}
            checked={formik.values.sendCookies}
            onChange={formik.handleChange}
          />
          <CheckboxSetting
            id="oauth2.useSystemBrowser"
            name="oauth2.useSystemBrowser"
            label={t('GENERAL.OAUTH2_SYSTEM_BROWSER')}
            checked={formik.values.oauth2.useSystemBrowser}
            onChange={formik.handleChange}
          />
        </SettingsGroup>

        <SettingsGroup title="Auto Save">
          <CheckboxSetting
            id="autoSaveEnabled"
            name="autoSave.enabled"
            label={t('GENERAL.ENABLE_AUTO_SAVE')}
            checked={autoSaveEnabled}
            onChange={formik.handleChange}
          />
          <SettingsField
            label={t('GENERAL.SAVE_DELAY')}
            htmlFor="autoSaveInterval"
            disabled={!autoSaveEnabled}
            error={autoSaveError}
          >
            <input
              id="autoSaveInterval"
              type="text"
              name="autoSave.interval"
              className="textbox numeric-input"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.autoSave.interval}
              disabled={!autoSaveEnabled}
            />
          </SettingsField>
        </SettingsGroup>

        <SettingsGroup title="Requests">
          <SettingsField label={t('GENERAL.REQUEST_TIMEOUT')} htmlFor="timeout" error={timeoutError}>
            <input
              id="timeout"
              type="text"
              name="timeout"
              className="textbox numeric-input"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.timeout}
            />
          </SettingsField>
        </SettingsGroup>

        <SettingsGroup
          title={t('GENERAL.DEFAULT_LOCATION')}
          description={t('GENERAL.DEFAULT_LOCATION_DESC')}
        >
          <SettingsField error={formik.errors.defaultLocation} className="default-location-field">
            <input
              type="text"
              name="defaultLocation"
              id="defaultLocation"
              aria-label="Default Location"
              data-testid="general-default-location-input"
              className="textbox cursor-pointer default-location-input"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              readOnly={true}
              onChange={formik.handleChange}
              value={formik.values.defaultLocation || ''}
              onClick={browseDefaultLocation}
              placeholder={t('GENERAL.DEFAULT_LOCATION_PLACEHOLDER')}
            />
            <button
              type="button"
              className="default-location-browse"
              data-testid="general-browse-default-location"
              onClick={browseDefaultLocation}
            >
              {t('GENERAL.BROWSE')}
            </button>
          </SettingsField>
        </SettingsGroup>

        <SettingsGroup title={t('GENERAL.LANGUAGE')}>
          <SettingsField htmlFor="language">
            <select
              id="language"
              className="textbox"
              value={i18n.language}
              onChange={handleLanguageChange}
            >
              <option value="en">English</option>
              <option value="zh-CN">简体中文</option>
            </select>
          </SettingsField>
        </SettingsGroup>
      </form>
    </StyledWrapper>
  );
};

export default General;
