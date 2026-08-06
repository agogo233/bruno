import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from 'components/Modal/index';
import { IconHeart, IconUser, IconUsers, IconPlus } from '@tabler/icons';
import StyledWrapper from './StyledWrapper';
import { useTheme } from 'providers/Theme/index';

const HeartIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      className="flex-shrink-0 w-5 h-4 text-yellow-600"
      viewBox="0 0 16 16"
    >
      <path fillRule="evenodd" d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314z" />
    </svg>
  );
};

const CheckIcon = () => {
  return (
    <svg
      className="flex-shrink-0 w-5 h-5 text-green-500"
      fill="currentColor"
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
        clipRule="evenodd"
      >
      </path>
    </svg>
  );
};

const GoldenEdition = ({ onClose }) => {
  const { t } = useTranslation();
  const { displayedTheme } = useTheme();

  const goldenEditionIndividuals = [
    t('SIDEBAR.GOLDEN_EDITION.FEATURE_EXPLORER'),
    t('SIDEBAR.GOLDEN_EDITION.FEATURE_GIT'),
    t('SIDEBAR.GOLDEN_EDITION.FEATURE_PROTOCOLS'),
    t('SIDEBAR.GOLDEN_EDITION.FEATURE_LOAD_DATA'),
    t('SIDEBAR.GOLDEN_EDITION.FEATURE_DEV_TOOLS'),
    t('SIDEBAR.GOLDEN_EDITION.FEATURE_OPENAPI'),
    t('SIDEBAR.GOLDEN_EDITION.FEATURE_LOAD_TESTING'),
    t('SIDEBAR.GOLDEN_EDITION.FEATURE_TERMINAL'),
    t('SIDEBAR.GOLDEN_EDITION.FEATURE_THEMES')
  ];

  const goldenEditionOrganizations = [
    t('SIDEBAR.GOLDEN_EDITION.FEATURE_LICENSE'),
    t('SIDEBAR.GOLDEN_EDITION.FEATURE_SECRETS'),
    t('SIDEBAR.GOLDEN_EDITION.FEATURE_REGISTRY'),
    t('SIDEBAR.GOLDEN_EDITION.FEATURE_FORMS'),
    t('SIDEBAR.GOLDEN_EDITION.FEATURE_SUPPORT')
  ];

  const [pricingOption, setPricingOption] = useState('individuals');

  const handlePricingOptionChange = (option) => {
    setPricingOption(option);
  };

  const themeBasedContainerClassNames = displayedTheme === 'light' ? 'text-gray-900' : 'text-white';
  const themeBasedTabContainerClassNames = displayedTheme === 'light' ? 'bg-gray-200' : 'bg-gray-800';
  const themeBasedActiveTabClassNames
    = displayedTheme === 'light' ? 'bg-white text-gray-900 font-medium' : 'bg-gray-700 text-white font-medium';

  return (
    <StyledWrapper>
      <Modal size="sm" title={t('SIDEBAR.GOLDEN_EDITION.TITLE')} handleCancel={onClose} hideFooter={true}>
        <div className={`flex flex-col w-full ${themeBasedContainerClassNames}`}>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">{t('SIDEBAR.GOLDEN_EDITION.TITLE')}</h3>
            <a
              onClick={() => {
                window.open('https://www.usebruno.com/pricing', '_blank');
              }}
              target="_blank"
              className="flex text-white bg-yellow-600 hover:bg-yellow-700 font-medium rounded-lg px-4 py-2 text-center cursor-pointer"
            >
              <IconHeart size={18} strokeWidth={1.5} /> <span className="ml-2">{t('SIDEBAR.GOLDEN_EDITION.BUY')}</span>
            </a>
          </div>
          {pricingOption === 'individuals' ? (
            <div>
              <div className="my-4">
                <span className="text-3xl font-extrabold">{t('SIDEBAR.GOLDEN_EDITION.INDIVIDUAL_PRICE')}</span>
              </div>
              <p className="bg-yellow-200 text-black rounded-md px-2 py-1 mb-2 inline-flex">{t('SIDEBAR.GOLDEN_EDITION.ONE_TIME')}</p>
              <p>{t('SIDEBAR.GOLDEN_EDITION.INDIVIDUAL_DESC')}</p>
            </div>
          ) : (
            <div>
              <div className="my-4">
                <span className="text-3xl font-extrabold">{t('SIDEBAR.GOLDEN_EDITION.ORG_PRICE')}</span>
                <span className="ml-2">{t('SIDEBAR.GOLDEN_EDITION.PER_USER')}</span>
              </div>
              <p className="bg-yellow-200 text-black rounded-md px-2 py-1 mb-2 inline-flex">{t('SIDEBAR.GOLDEN_EDITION.ONE_TIME')}</p>
              <p>{t('SIDEBAR.GOLDEN_EDITION.ORG_DESC')}</p>
            </div>
          )}
          <div
            className={`flex items-center justify-between my-8 w-40 rounded-full p-1 ${themeBasedTabContainerClassNames}`}
            style={{ width: '24rem' }}
          >
            <div
              className={`cursor-pointer w-1/2 h-8 flex items-center justify-center rounded-full ${
                pricingOption === 'individuals' ? themeBasedActiveTabClassNames : 'text-gray-500'
              }`}
              onClick={() => handlePricingOptionChange('individuals')}
            >
              <IconUser className="text-gray-500 mr-2 icon" size={16} strokeWidth={1.5} /> {t('SIDEBAR.GOLDEN_EDITION.INDIVIDUALS')}
            </div>
            <div
              className={`cursor-pointer w-1/2 h-8 flex items-center justify-center rounded-full ${
                pricingOption === 'organizations' ? themeBasedActiveTabClassNames : 'text-gray-500'
              }`}
              onClick={() => handlePricingOptionChange('organizations')}
            >
              <IconUsers className="text-gray-500 mr-2 icon" size={16} strokeWidth={1.5} /> {t('SIDEBAR.GOLDEN_EDITION.ORGANIZATIONS')}
            </div>
          </div>
          <ul role="list" className="space-y-3 text-left">
            <li className="flex items-center space-x-3">
              <HeartIcon />
              <span>{t('SIDEBAR.GOLDEN_EDITION.SUPPORT')}</span>
            </li>
            {pricingOption === 'individuals' ? (
              <>
                {goldenEditionIndividuals.map((item, index) => (
                  <li className="flex items-center space-x-3" key={index}>
                    <CheckIcon />
                    <span>{item}</span>
                  </li>
                ))}
              </>
            ) : (
              <>
                <li className="flex items-center space-x-3 pb-4">
                  <IconPlus size={16} strokeWidth={1.5} style={{ marginLeft: '2px' }} />
                  <span>{t('SIDEBAR.GOLDEN_EDITION.EVERYTHING_INDIVIDUAL')}</span>
                </li>
                {goldenEditionOrganizations.map((item, index) => (
                  <li className="flex items-center space-x-3" key={index}>
                    <CheckIcon />
                    <span>{item}</span>
                  </li>
                ))}
              </>
            )}
          </ul>
        </div>
      </Modal>
    </StyledWrapper>
  );
};

export default GoldenEdition;