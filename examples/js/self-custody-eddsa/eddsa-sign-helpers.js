/**
 * Shared helpers for EdDSA TSS self-custody signing scripts (no network in offline helpers).
 */

const fs = require('fs');
const openpgp = require('openpgp');
openpgp.config.rejectCurves = new Set();

const {
  CommitmentType,
  EncryptedSignerShareType,
  SignatureShareType,
} = require('@bitgo/sdk-core');

const ShareKeyPosition = { USER: 1, BACKUP: 2, BITGO: 3 };

function getUnsignedTx(txRequest) {
  if (txRequest.apiVersion === 'full') {
    if (!txRequest.transactions || txRequest.transactions.length !== 1) {
      throw new Error('TxRequest must have exactly one transaction (apiVersion full)');
    }
    return txRequest.transactions[0].unsignedTx;
  }
  if (!txRequest.unsignedTxs || txRequest.unsignedTxs.length !== 1) {
    throw new Error('TxRequest must have exactly one unsignedTx (apiVersion lite)');
  }
  return txRequest.unsignedTxs[0];
}

function getEncryptedUserKey(workspacePath, files) {
  if (process.env.ENCRYPTED_USER_KEY) {
    return process.env.ENCRYPTED_USER_KEY;
  }
  const userMaterialPath = workspacePath(files.userSigningMaterial);
  if (fs.existsSync(userMaterialPath)) {
    const data = JSON.parse(fs.readFileSync(userMaterialPath, 'utf8'));
    if (data.encryptedPrv) return data.encryptedPrv;
    throw new Error('user-signing-material.json must contain encryptedPrv');
  }
  throw new Error('Missing user-signing-material.json and ENCRYPTED_USER_KEY not set');
}

function decryptUserSigningMaterial(bitgo, encryptedPrv, passphrase) {
  const prv = bitgo.decrypt({ input: encryptedPrv, password: passphrase });
  const signingMaterial = JSON.parse(prv);
  if (!signingMaterial.backupYShare || !signingMaterial.bitgoYShare) {
    throw new Error('Invalid user signing material: missing backupYShare or bitgoYShare');
  }
  return signingMaterial;
}

async function encryptTextToBitgo(text, bitgoGpgPublicKeyArmored) {
  const publicKey = await openpgp.readKey({ armoredKey: bitgoGpgPublicKeyArmored });
  const message = await openpgp.createMessage({ text });
  return openpgp.encrypt({
    message,
    encryptionKeys: [publicKey],
    format: 'armored',
    config: {
      rejectCurves: new Set(),
      showVersion: false,
      showComment: false,
    },
  });
}

async function deriveSigningKeyAndUserSignShare(txRequest, signingMaterial) {
  const { Ed25519Bip32HdTree } = require('@bitgo/sdk-lib-mpc');
  const { Eddsa, EDDSAMethods } = require('@bitgo/sdk-core');
  const { createUserSignShare } = EDDSAMethods;

  const unsignedTx = getUnsignedTx(txRequest);
  const hdTree = await Ed25519Bip32HdTree.initialize();
  const MPC = await Eddsa.initialize(hdTree);

  const signingKey = MPC.keyDerive(
    signingMaterial.uShare,
    [signingMaterial.bitgoYShare, signingMaterial.backupYShare],
    unsignedTx.derivationPath
  );

  const signablePayload = Buffer.from(unsignedTx.signableHex, 'hex');
  const userSignShare = await createUserSignShare(signablePayload, signingKey.pShare);

  return { userSignShare, signingKey, signablePayload, unsignedTx };
}

function createCommitmentShareRecord(commitment) {
  return {
    from: SignatureShareType.USER,
    to: SignatureShareType.BITGO,
    share: commitment,
    type: CommitmentType.COMMITMENT,
  };
}

function createEncryptedSignerShareRecord(encryptedArmored) {
  return {
    from: SignatureShareType.USER,
    to: SignatureShareType.BITGO,
    share: encryptedArmored,
    type: EncryptedSignerShareType.ENCRYPTED_SIGNER_SHARE,
  };
}

function createEncryptedRShareRecord(encryptedArmored) {
  return {
    from: SignatureShareType.USER,
    to: SignatureShareType.BITGO,
    share: encryptedArmored,
    type: EncryptedSignerShareType.ENCRYPTED_R_SHARE,
  };
}

async function buildCommitmentPayload(txRequest, signingMaterial, bitgoGpgPublicKeyArmored, bitgo, passphrase) {
  const { userSignShare, signingKey } = await deriveSigningKeyAndUserSignShare(txRequest, signingMaterial);

  const bitgoIndex = ShareKeyPosition.BITGO;
  const commitment = userSignShare.rShares[bitgoIndex]?.commitment;
  if (!commitment) {
    throw new Error('Missing user→BitGo commitment in user sign share');
  }

  const signerShare = signingKey.yShares[bitgoIndex].u + signingKey.yShares[bitgoIndex].chaincode;
  const encryptedSignerShareArmored = await encryptTextToBitgo(signerShare, bitgoGpgPublicKeyArmored);

  const commitmentShare = createCommitmentShareRecord(commitment);
  const encryptedSignerShare = createEncryptedSignerShareRecord(encryptedSignerShareArmored);

  const stringifiedSignShare = JSON.stringify(userSignShare);
  const encryptedSignShare = bitgo.encrypt({ input: stringifiedSignShare, password: passphrase });
  const encryptedUserToBitgoRShare = createEncryptedRShareRecord(encryptedSignShare);

  const rShare = userSignShare.rShares[bitgoIndex];
  const userToBitgoRSignatureShare = {
    from: SignatureShareType.USER,
    to: SignatureShareType.BITGO,
    share: rShare.r + rShare.R,
  };

  return {
    commitmentShare,
    encryptedSignerShare,
    encryptedUserToBitgoRShare,
    userToBitgoRSignatureShare,
  };
}

async function buildGSharePayload(txRequest, signingMaterial, bitgoToUserRShare, bitgoToUserCommitment, encryptedUserToBitgoRShare, bitgo, passphrase) {
  const { createUserToBitGoGShare } = require('@bitgo/sdk-core').EDDSAMethods;

  const decrypted = bitgo.decrypt({
    input: encryptedUserToBitgoRShare.share,
    password: passphrase,
  });
  const userSignShare = JSON.parse(decrypted);
  if (!userSignShare.xShare || !userSignShare.rShares) {
    throw new Error('Decrypted sign share missing xShare or rShares');
  }

  const { signablePayload } = await deriveSigningKeyAndUserSignShare(txRequest, signingMaterial);

  const userToBitGoGShare = await createUserToBitGoGShare(
    userSignShare,
    bitgoToUserRShare,
    signingMaterial.backupYShare,
    signingMaterial.bitgoYShare,
    signablePayload,
    bitgoToUserCommitment
  );

  return { gShare: userToBitGoGShare };
}

module.exports = {
  ShareKeyPosition,
  getUnsignedTx,
  getEncryptedUserKey,
  decryptUserSigningMaterial,
  buildCommitmentPayload,
  buildGSharePayload,
};
