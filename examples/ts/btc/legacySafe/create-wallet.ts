import { encrypt } from '@bitgo/sdk-api';
import { legacySafeConfig } from './config';
const encryptUserKey = () => {
  return encrypt(legacySafeConfig.userPassword, '<enter-user-private-key-wif-here>');
};

// This API request was successful by commenting keychains related checks & by passing these
// params as-is in Wallets.prototype.add function in modules/sdk-api/src/v1/wallets.ts file.
const createWallet = async () => {
  const params = {
    enterprise: '635a6935b1a3e600083265dd0dd584bc',
    label: 'v1-safe-wallet-uncompressed-keys',
    type: 'safe',
    m: 2,
    n: 3,
    userPublicKey:
      '04b9aea0bf6be18d3ed48d1cc3495e9af5e499ad90a84930990ba58b198ee81b5e83f6aa2f617c04401616e844f51802c0f1d827422efc1f3856dc222dd8beed16',
    backupPublicKey:
      '0435e9d7c48e3a5254d5881b60abf004cf6eedc6ab842393caa2fdd20d6d0ad170cc32c4664603de3e9b9d1fd01b070d192fad570fcbb3b185c034ec5a4a0b1fb4',
    encryptedUserPrivateKey:
      ' {"iv":"lp64eGp9aIr5vKFhVkDd2Q==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"X9IGug0eW7c=","ct":"ISoh89i1pHzgkji89zyqrd7DS59GE9sKsfoB/hawun1lvYE/LN752DmDM53U2LGq57/25z8M5vfX4NA="}',
    useUncompressedPubKeys: true,
  };
  return await legacySafeConfig.bitgo.wallets().add(params);
};

export const getV1SafeWallet = async () => {
  await legacySafeConfig.bitgo.unlock({ otp: '000000' });
  const v1SafeWallet = await legacySafeConfig.bitgo
    .wallets()
    .get({ id: '2N85TyC2JdbBpanfme6w8XNQaSr5wcc9Ry9', gpk: true });

  return v1SafeWallet;
};

getV1SafeWallet()
  .then(() => console.log('v1 safe wallet create & get example complete!'))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
