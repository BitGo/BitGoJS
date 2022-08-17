import React from 'react';
import { mount } from '@cypress/react';
import BitGoJSComponent from './index';
import type { Buffer as WebBuffer } from 'buffer/index';
import { Buffer } from 'buffer';
import { expect } from 'chai';

it('renders the BitGoJS SDK', () => {
  mount(<BitGoJSComponent />);
  cy.get('h3').contains('BitGoJS SDK');
  cy.get('div').contains('https://app.bitgo-test.com');
});

it('CR-686: uses the correct version of Buffer', () => {
  const webBuffer: WebBuffer = new Buffer('') as unknown as WebBuffer;
  expect(webBuffer.readBigUInt64BE).not.to.be.undefined;
});
