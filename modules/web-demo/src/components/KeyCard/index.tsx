import React from 'react';
import {
  downloadKeycardForHotEthTSSWallet,
  downloadKeycardForHotLtcWallet,
  downloadKeycardForSelfManagedHotAdvancedPolygonWallet,
  downloadKeycardForSelfManagedColdEddsaKey,
  downloadKeycardForSelfManagedColdEddsaKeyWithDerivedKeys,
  downloadKeycardForDKLsTSS,
} from '@components/KeyCard/fixtures';

const KeyCard = () => {
  return (
    <React.Fragment>
      <h3>Key Card</h3>
      <br />
      <button onClick={downloadKeycardForHotLtcWallet}>
        Download for Hot LTC Wallet
      </button>
      <button onClick={downloadKeycardForDKLsTSS}>
        Download for Hot DKLS Wallet
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
      <button
        onClick={downloadKeycardForSelfManagedColdEddsaKeyWithDerivedKeys}
      >
        Download for Self Managed Cold Eddsa Key with Derived Keys
      </button>
    </React.Fragment>
  );
};

export default KeyCard;
