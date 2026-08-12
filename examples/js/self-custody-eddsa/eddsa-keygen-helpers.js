/**
 * Helpers for EdDSA TSS self-custody wallet creation (offline/online split).
 * Aligns with https://developers.bitgo.com/docs/wallets-create-mpc-keys (EdDSA section)
 * and EddsaUtils in @bitgo/sdk-core.
 */

const openpgp = require('openpgp');
openpgp.config.rejectCurves = new Set();

const BITGO_INDEX = 3;
const M = 2;
const N = 3;

async function generateLocalKeyMaterial() {
  const { Eddsa, generateGPGKeyPair } = require('@bitgo/sdk-core');
  const { Ed25519Bip32HdTree } = require('@bitgo/sdk-lib-mpc');

  const hdTree = await Ed25519Bip32HdTree.initialize();
  const MPC = await Eddsa.initialize(hdTree);

  const userKeyShare = MPC.keyShare(1, M, N);
  const backupKeyShare = MPC.keyShare(2, M, N);
  const userGpgKey = await generateGPGKeyPair('secp256k1');
  const backupGpgKey = await generateGPGKeyPair('secp256k1');

  return { userKeyShare, backupKeyShare, userGpgKey, backupGpgKey };
}

async function buildToBitgoKeyShare(keyShare, gpgPrivateKey) {
  const { createShareProof } = require('@bitgo/sdk-core');

  const publicShare = Buffer.concat([
    Buffer.from(keyShare.uShare.y, 'hex'),
    Buffer.from(keyShare.uShare.chaincode, 'hex'),
  ]).toString('hex');

  const privateShare = Buffer.concat([
    Buffer.from(keyShare.yShares[BITGO_INDEX].u, 'hex'),
    Buffer.from(keyShare.yShares[BITGO_INDEX].chaincode, 'hex'),
  ]).toString('hex');

  return {
    publicShare,
    privateShare,
    privateShareProof: await createShareProof(gpgPrivateKey, privateShare.slice(0, 64), 'eddsa'),
    vssProof: keyShare.yShares[BITGO_INDEX].v,
  };
}

async function buildBitgoKeychainPayload(userKeyShare, backupKeyShare, userGpgKey, backupGpgKey, bitgoGpgPublicKeyArmored) {
  const { encryptText } = require('@bitgo/sdk-core');
  const bitgoKey = await openpgp.readKey({ armoredKey: bitgoGpgPublicKeyArmored });

  const userToBitgo = await buildToBitgoKeyShare(userKeyShare, userGpgKey.privateKey);
  const backupToBitgo = await buildToBitgoKeyShare(backupKeyShare, backupGpgKey.privateKey);

  const encUserPrivateShare = await encryptText(userToBitgo.privateShare, bitgoKey);
  const encBackupPrivateShare = await encryptText(backupToBitgo.privateShare, bitgoKey);

  return {
    keyType: 'tss',
    source: 'bitgo',
    keyShares: [
      {
        from: 'user',
        to: 'bitgo',
        publicShare: userToBitgo.publicShare,
        privateShare: encUserPrivateShare,
        privateShareProof: userToBitgo.privateShareProof,
        vssProof: userToBitgo.vssProof,
      },
      {
        from: 'backup',
        to: 'bitgo',
        publicShare: backupToBitgo.publicShare,
        privateShare: encBackupPrivateShare,
        privateShareProof: backupToBitgo.privateShareProof,
        vssProof: backupToBitgo.vssProof,
      },
    ],
    userGPGPublicKey: userGpgKey.publicKey,
    backupGPGPublicKey: backupGpgKey.publicKey,
  };
}

/**
 * Decrypt BitGo→party private share (GPG-encrypted only, not signed).
 * Matches MpcUtils.decryptPrivateShare in @bitgo/sdk-core — do not use readSignedMessage here.
 */
async function decryptPrivateShare(encryptedPrivateShare, gpgKeyPair) {
  const { readMessage, readPrivateKey, decrypt } = openpgp;
  const privateShareMessage = await readMessage({ armoredMessage: encryptedPrivateShare });
  const userGpgPrivateKey = await readPrivateKey({ armoredKey: gpgKeyPair.privateKey });
  const decrypted = await decrypt({
    message: privateShareMessage,
    decryptionKeys: [userGpgPrivateKey],
    format: 'utf8',
  });
  return decrypted.data;
}

async function buildUserAndBackupKeychainParams(bitgoKeychain, offlineState, passphrase, bitgo) {
  const { Eddsa, EddsaUtils } = require('@bitgo/sdk-core');

  const stateJson = bitgo.decrypt({ input: offlineState.encryptedState, password: passphrase });
  const state = JSON.parse(stateJson);
  const { userKeyShare, backupKeyShare, userGpgKey, backupGpgKey } = state;

  const bitgoKeyShares = bitgoKeychain.keyShares;
  if (!bitgoKeyShares) {
    throw new Error('BitGo keychain response missing keyShares');
  }

  const coinId = process.env.COIN || 'tsol';
  const baseCoin = bitgo.coin(coinId);
  const eddsaUtils = new EddsaUtils(bitgo, baseCoin);

  const bitGoToUserShare = bitgoKeyShares.find((ks) => ks.from === 'bitgo' && ks.to === 'user');
  const bitGoToBackupShare = bitgoKeyShares.find((ks) => ks.from === 'bitgo' && ks.to === 'backup');
  if (!bitGoToUserShare || !bitGoToBackupShare) {
    throw new Error('Missing bitgo→user or bitgo→backup key share in BitGo keychain response');
  }

  const bitGoToUserPrivateShare = await decryptPrivateShare(bitGoToUserShare.privateShare, userGpgKey);
  await eddsaUtils.verifyWalletSignatures(
    userGpgKey.publicKey,
    backupGpgKey.publicKey,
    bitgoKeychain,
    bitGoToUserPrivateShare,
    1
  );

  const bitGoToBackupPrivateShare = await decryptPrivateShare(bitGoToBackupShare.privateShare, backupGpgKey);
  await eddsaUtils.verifyWalletSignatures(
    userGpgKey.publicKey,
    backupGpgKey.publicKey,
    bitgoKeychain,
    bitGoToBackupPrivateShare,
    2
  );

  const hdTree = await require('@bitgo/sdk-lib-mpc').Ed25519Bip32HdTree.initialize();
  const MPC = await Eddsa.initialize(hdTree);

  const bitgoToUser = {
    i: 1,
    j: 3,
    y: bitGoToUserShare.publicShare.slice(0, 64),
    v: bitGoToUserShare.vssProof,
    u: bitGoToUserPrivateShare.slice(0, 64),
    chaincode: bitGoToUserPrivateShare.slice(64),
  };

  const bitgoToBackup = {
    i: 2,
    j: 3,
    y: bitGoToBackupShare.publicShare.slice(0, 64),
    v: bitGoToBackupShare.vssProof,
    u: bitGoToBackupPrivateShare.slice(0, 64),
    chaincode: bitGoToBackupPrivateShare.slice(64),
  };

  const userCombined = MPC.keyCombine(userKeyShare.uShare, [backupKeyShare.yShares[1], bitgoToUser]);
  const commonKeychain = userCombined.pShare.y + userCombined.pShare.chaincode;
  if (commonKeychain !== bitgoKeychain.commonKeychain) {
    throw new Error('Failed to create user keychain - commonKeychains do not match');
  }

  const backupCombined = MPC.keyCombine(backupKeyShare.uShare, [userKeyShare.yShares[2], bitgoToBackup]);
  const backupCommon = backupCombined.pShare.y + backupCombined.pShare.chaincode;
  if (backupCommon !== bitgoKeychain.commonKeychain) {
    throw new Error('Failed to create backup keychain - commonKeychains do not match');
  }

  const userSigningMaterial = {
    uShare: userKeyShare.uShare,
    bitgoYShare: bitgoToUser,
    backupYShare: backupKeyShare.yShares[1],
  };

  const backupSigningMaterial = {
    uShare: backupKeyShare.uShare,
    bitgoYShare: bitgoToBackup,
    userYShare: userKeyShare.yShares[2],
  };

  const encryptedPrvUser = bitgo.encrypt({
    input: JSON.stringify(userSigningMaterial),
    password: passphrase,
  });

  const backupPrv = JSON.stringify(backupSigningMaterial);
  const encryptedPrvBackup = bitgo.encrypt({ input: backupPrv, password: passphrase });

  const originalPasscodeEncryptionCode = process.env.ORIGINAL_PASSCODE_ENCRYPTION_CODE;

  const userKeychainParams = {
    source: 'user',
    keyType: 'tss',
    commonKeychain: bitgoKeychain.commonKeychain,
    encryptedPrv: encryptedPrvUser,
  };
  if (originalPasscodeEncryptionCode) {
    userKeychainParams.originalPasscodeEncryptionCode = originalPasscodeEncryptionCode;
  }

  const backupKeychainParams = {
    source: 'backup',
    keyType: 'tss',
    commonKeychain: bitgoKeychain.commonKeychain,
    prv: backupPrv,
    encryptedPrv: encryptedPrvBackup,
  };

  return {
    userKeychainParams,
    backupKeychainParams,
    userSigningMaterial: { encryptedPrv: encryptedPrvUser },
  };
}

module.exports = {
  generateLocalKeyMaterial,
  buildBitgoKeychainPayload,
  buildUserAndBackupKeychainParams,
};
