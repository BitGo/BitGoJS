import React from 'react';
import {
  createNewSMHAWalletAndDownloadKeycard,
  downloadKeycardForHotEthTSSWallet,
  downloadKeycardForHotLtcWallet,
  downloadKeycardForSelfManagedHotAdvancedPolygonWallet,
} from '@components/KeyCard/fixtures';

const KeyCard = () => {
  return (
    <React.Fragment>
      <h3>Key Card</h3>
      <h4>Static Key Cards</h4>
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
      <h4>Create new SMAH Wallet with Key Card</h4>
      <label htmlFor="accessToken">Access Token:</label>
      <input type="text" id="accessToken" name="accessToken" />
      <label htmlFor="accessToken">Enterprise ID:</label>
      <input type="text" id="enterpriseId" name="enterpriseId" />
      <br />
      <button onClick={createNewSMHAWalletAndDownloadKeycard}>
        Create Wallet and Download Key Card
      </button>
    </React.Fragment>
  );
};

export default KeyCard;
