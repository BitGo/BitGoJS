import React from 'react';
import ReactJson from 'react-json-view';

import { BitGo } from 'bitgo';
import { KeyPair } from '@bitgo/sdk-coin-ada';

const sdk = new BitGo();

console.log(new KeyPair().getAddress('testnet'));
const BitGoJS = () => {
  return (
    <React.Fragment>
      <h3>BitGoJS SDK</h3>
      <br />
      <ReactJson src={sdk} />
    </React.Fragment>
  );
};

export default BitGoJS;
