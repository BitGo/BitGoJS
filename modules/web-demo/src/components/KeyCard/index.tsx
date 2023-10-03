import React from 'react';
import {
  downloadKeycardForHotEthTSSWallet,
  downloadKeycardForHotLtcWallet,
  downloadKeycardForSelfManagedHotAdvancedPolygonWallet,
  downloadKeycardForSelfManagedColdEddsaKey,
} from '@components/KeyCard/fixtures';

const KeyCard = () => {
  return (
    <React.Fragment>
      <h3>Key Card</h3>
      <br />
      <button onClick={downloadKeycardForHotLtcWallet}>
        Download for Hot LTC Wallet
      </button>
      <button onClick={downloadKeycardForHotEthTSSWallet}>
        Download for Hot ETH TSS Wallet
      </button>
      <button onClick={downloadKeycardForSelfManagedHotAdvancedPolygonWallet}>
        Download for Self Managed Hot Advanced Polygon Wallet
      </button>
      <button onClick={downloadKeycardForSelfManagedColdEddsaKey}>
        Download for Self Managed Cold Eddsa Key
      </button>
    </React.Fragment>
  );
};

export default KeyCard;
