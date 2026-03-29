import React from 'react';
import { JsonView } from 'react-json-view-lite';
import 'react-json-view-lite/dist/index.css';
import { BitGoAPI } from '@bitgo/sdk-api';

const sdk = new BitGoAPI();

const BGApi = () => {
  return (
    <React.Fragment>
      <h3>BitGo SDK API</h3>
      <br />
      <JsonView data={sdk} />
    </React.Fragment>
  );
};

export default BGApi;
