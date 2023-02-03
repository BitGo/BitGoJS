import React from 'react';
import { coins } from '@bitgo/statics';
import { generateKeycard } from '@bitgo/key-card';
import { Keychain } from '@bitgo/sdk-core';

function downloadKeycard() {
  const userKeychain: Keychain = {
    id: '63e107b5ef7bba0007145e41065b26a6',
    pub: 'xpub661MyMwAqRbcFXFJ8wZhWjEiFg9wM89UamPyP3XsnEHg2VJ4m7wE7ALLszakPiEEy5cH9FCAvCrx1cL6rLE6jewaa1ubP8DjqsDtP4R7w5g',
    encryptedPrv:
      '{"iv":"pivw5c3fmgc0/1LP3SX7rA==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"XKtQHasaidc=","ct":"wXbSW115VD4e+r1pxX/wB1/2g332c4thdLkk91Fr+hrRzuoDzWyhYcaxndIP5Nzc5z0Q9HGc+cZ4Zb2Ij7O3cPoIyrsXv84NaHfVNN7rY2UopmxS4Xg05x1S936kxfZjDjlgNfj7lkrY9LzVh3wC8YGSxx960Vw="}',
    prv: 'xprv9s21ZrQH143K33Aq2v2h9bHyheKSwfRdDYUNaf8GDtkh9gxvDacyZN1s2gpDb4QLwAK4DzxoQpDAneJTNL7vgvnneTBAKptkKLYTVCNhya6',
    type: 'independent',
  };
  const backupKeychain: Keychain = {
    id: '63e107b51af424000794ea5e39db15c6',
    pub: 'xpub661MyMwAqRbcF7DseJgApbN9DtRXeUT3H41id4eSNCL9VDK7rDJ7kZNGS3Zz49a9XXH52qZ5KTQqQht9uciMZvaAJ7wy69a4hyKb94YMYqm',
    type: 'independent',
    prv: 'xprv9s21ZrQH143K2d9QYH9ATTRQfrb3F1jBuq67pgEporoAcQyyJfysCm3nanTyUvDhAhEQAHyooZsNaMFF6nYHd2sYb5nNRervxwsedLYfafh',
  };
  const bitgoKeychain: Keychain = {
    id: '63e107b5ca60390007008767278e5fc4',
    pub: 'xpub661MyMwAqRbcGWXcaHWYPH8Bz9qg6K3zSFac4hv8JZvKCorehqS8xVToEGXt7zJUfsT5aUaH1ZzjEYruXdgDRgFpAwfWxQyEuU9fpQzaPAE',
    type: 'independent',
  };

  generateKeycard({
    activationCode: '123456',
    backupKeychain,
    bitgoKeychain,
    coin: coins.get('tsol'),
    passcodeEncryptionCode: '654321',
    passphrase: 'test_wallet_passphrase',
    userKeychain,
    walletLabel: 'Hello World',
  });
}

const KeyCard = () => {
  return (
    <React.Fragment>
      <h3>Key Card</h3>
      <br />
      <button onClick={downloadKeycard}>Download</button>
    </React.Fragment>
  );
};

export default KeyCard;
