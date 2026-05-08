import React from 'react';
import ReactJson from 'react-json-view';

import { BitGo } from 'bitgo';

const sdk = new BitGo();

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
