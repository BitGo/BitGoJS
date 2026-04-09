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
  const webBuffer = new Buffer('') as unknown as WebBuffer;
  expect(webBuffer.readBigUInt64BE).not.to.be.undefined;
});

it('BG-61420: use isBuffer() of the polyfilled Buffer version in browser', () => {
  const array = new Uint8Array([1, 2, 3, 4, 5]);
  expect(Buffer.isBuffer(array)).to.be.false;

  const buffer = Buffer.from(array);
  /*
   * This^ buffer object created is using the polyfilled Buffer version in browser
   * instead of the NodeJS native Buffer. It can be verified by logging it and checking
   * that the _isBuffer property is set to true, which is done only by the polyfilled
   * version.
   * console.log('LOG: ', buffer, buffer.toJSON()); // Uncomment to verify
   * */
  expect(Buffer.isBuffer(buffer)).to.be.true;
});

it('BG-61420: use equals() of the polyfilled Buffer version in browser', () => {
  const array = new Uint8Array([1, 2, 3, 4, 5]);
  const buffer = Buffer.from(array);

  try {
    buffer.equals(array);
  } catch (error) {
    expect(error.message).to.eq('Argument must be a Buffer');
  }

  const areBuffersEqual = buffer.equals(Buffer.from(array));
  expect(areBuffersEqual).to.be.true;
});
