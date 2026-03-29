import React from 'react';
import { JsonView } from 'react-json-view-lite';
import 'react-json-view-lite/dist/index.css';

import { BitGo } from 'bitgo';

const sdk = new BitGo();

const BitGoJS = () => {
  return (
    <React.Fragment>
      <h3>BitGoJS SDK</h3>
      <br />
      <JsonView data={sdk} />
    </React.Fragment>
  );
};

export default BitGoJS;
