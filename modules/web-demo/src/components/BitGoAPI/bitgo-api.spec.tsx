import React from 'react';
import { mount } from '@cypress/react';
import BGApi from './index';
import type { Buffer as WebBuffer } from 'buffer/index';
import { Buffer } from 'buffer';
import { expect } from 'chai';

it('renders the api-sdk', () => {
  mount(<BGApi />);
  cy.get('h3').contains('BitGo SDK API');
  cy.get('div').contains('https://app.bitgo-test.com');
});

it('CR-686: uses the correct version of Buffer', () => {
  const webBuffer = new Buffer('') as unknown as WebBuffer;
  expect(webBuffer.readBigUInt64BE).not.to.be.undefined;
});
