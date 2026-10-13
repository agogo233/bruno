import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import i18n from 'i18n';
import en from 'i18n/translation/en.json';
import QueryResponse from 'components/ResponsePane/QueryResponse/index';
import BodyBlock from './index';

jest.mock('components/ResponsePane/QueryResponse/index', () => jest.fn(() => <div data-testid="query-response" />));

describe('Timeline BodyBlock', () => {
  beforeAll(async () => {
    await i18n.changeLanguage('en');
  });

  beforeEach(() => QueryResponse.mockClear());

  it('renders the response view for a body held back for size', () => {
    render(<BodyBlock item={{ uid: 'item-1' }} data={null} dataBuffer="" type="response" isLoaded />);

    expect(screen.getByTestId('query-response')).toBeInTheDocument();
  });

  it('says there is no body when there is none', () => {
    render(<BodyBlock item={{ uid: 'item-1' }} data={null} dataBuffer="" type="response" />);

    expect(screen.getByText(en.RESPONSE_PANE.TIMELINE.NO_BODY)).toBeInTheDocument();
    expect(QueryResponse).not.toHaveBeenCalled();
  });
});
