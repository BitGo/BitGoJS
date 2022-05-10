import React from 'react';
import { mount } from '@cypress/react';
import BitGoJSComponent from './index';

it('renders the BitGoJS SDK', () => {
  mount(<BitGoJSComponent />);
  cy.get('h3').contains('BitGoJS SDK');
  cy.get('div').contains('https://app.bitgo-test.com');
});
