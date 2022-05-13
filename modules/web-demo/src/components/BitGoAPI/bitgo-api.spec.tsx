import React from 'react';
import { mount } from '@cypress/react';
import BGApi from './index';

it('renders the api-sdk', () => {
  mount(<BGApi />);
  cy.get('h3').contains('BitGo SDK API');
  cy.get('div').contains('https://app.bitgo-test.com');
});
