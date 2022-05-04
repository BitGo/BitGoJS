import React from 'react';
import ReactJson from 'react-json-view';

import { BitGo } from 'bitgo';

const sdk = new BitGo();

const BitGoJS = () => {
  return (
    <React.Fragment>
      <h3>BitGo SDK API</h3>
      <br />
      <ReactJson src={sdk} />
    </React.Fragment>
  );
};

export default BitGoJS;
