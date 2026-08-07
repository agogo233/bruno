import React from 'react';
import { IconAlertTriangle } from '@tabler/icons';
import StyledWrapper from './StyledWrapper';
import Button from 'ui/Button/index';
import { withTranslation } from 'react-i18next';

class QueryBuilderErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
    this.reset = this.reset.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[QueryBuilder] Unexpected render error:', error, errorInfo);
  }

  reset() {
    this.setState({ hasError: false, error: null });
  }

  render() {
    const { t } = this.props;
    if (this.state.hasError) {
      return (
        <StyledWrapper>
          <div className="schema-empty-state">
            <IconAlertTriangle size={32} strokeWidth={1.5} className="empty-state-icon warning" />
            <div className="empty-state-title">{t('REQUEST_PANE.SOMETHING_WENT_WRONG')}</div>
            <div className="empty-state-description">
              {t('REQUEST_PANE.QUERY_BUILDER_ERROR')}
            </div>
            <Button color="secondary" onClick={this.reset}>
              {t('REQUEST_PANE.TRY_AGAIN')}
            </Button>
          </div>
        </StyledWrapper>
      );
    }
    return this.props.children;
  }
}

export default withTranslation()(QueryBuilderErrorBoundary);
