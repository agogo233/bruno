import { useTheme } from '../../../../providers/Theme';
import { useDispatch } from 'react-redux';
import { setIsOpeningCollection } from 'providers/ReduxStore/slices/app';
import { useTranslation } from 'react-i18next';

import styled from 'styled-components';
import StyledWrapper from './StyledWrapper';

const LinkStyle = styled.span`
  color: ${(props) => props.theme['text-link']};
`;

const CreateOrOpenCollection = ({ onCreateClick }) => {
  const { theme } = useTheme();
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const handleOpenCollection = () => {
    dispatch(setIsOpeningCollection(true));
  };
  const CreateLink = () => (
    <LinkStyle
      className="underline text-link cursor-pointer"
      theme={theme}
      onClick={onCreateClick}
    >
      {t('SIDEBAR.CREATE_OR_OPEN.CREATE')}
    </LinkStyle>
  );

  return (
    <StyledWrapper className="px-2 mt-4">
      <div className="text-xs text-center">
        <div>{t('SIDEBAR.CREATE_OR_OPEN.NO_COLLECTIONS')}</div>
        <div className="mt-2">
          <CreateLink /> {t('SIDEBAR.CREATE_OR_OPEN.OR')} <OpenLink /> {t('SIDEBAR.CREATE_OR_OPEN.COLLECTION')}
        </div>
      </div>
    </StyledWrapper>
  );
};

export default CreateOrOpenCollection;
