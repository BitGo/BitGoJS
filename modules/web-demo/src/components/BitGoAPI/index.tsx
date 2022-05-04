import React from 'react';
import ReactJson from 'react-json-view';
import { BitGoAPI } from '@bitgo/sdk-api';

class MyAPI extends BitGoAPI {}

const sdk = new MyAPI();
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
