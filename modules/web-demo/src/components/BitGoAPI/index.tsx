import React from 'react';
import ReactJson from 'react-json-view';
import { BitGoAPI } from '@bitgo/sdk-api';
import { Txrp } from '@bitgo/sdk-coin-xrp';

const sdk = new BitGoAPI();

sdk.register('txrp', Txrp.createInstance);

const BGApi = () => {
  return (
    <React.Fragment>
      <h3>BitGo SDK API</h3>
      <br />
      <ReactJson src={sdk} />
    </React.Fragment>
  );
};

export default BGApi;
