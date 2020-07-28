export const ACCOUNT_1 = {
  accountId: '0.0.81320',
  privateKey: '302e020100300506032b65700422042062b0b669de0ab5e91b4328e1431859a5ca47e7426e701019272f5c2d52825b01',
  publicKey: '302a300506032b65700321005a9111b5e6881ff20b9243a42ac1a9a67fa16cd4f01e58bab30c1fe611ea8cf9',
  privateKeyBytes: Uint8Array.from(
    Buffer.from('62b0b669de0ab5e91b4328e1431859a5ca47e7426e701019272f5c2d52825b01', 'hex'),
  ),
  publicKeyBytes: Uint8Array.from(
    Buffer.from('5a9111b5e6881ff20b9243a42ac1a9a67fa16cd4f01e58bab30c1fe611ea8cf9', 'hex'),
  ),
};

export const ACCOUNT_2 = {
  accountId: '0.0.75861',
  privateKey: '5bb72603f237c0993f7973d37fdade32c71aa94aee686aa79d260acba1882d9a',
  publicKey: '302a300506032b6570032100592a4fbb7263c59d450e651df96620dc9208ee7c7d9d6f2fdcb91c53f8831261',
};

export const ACCOUNT_3 = {
  accountId: '0.0.78963',
  privateKey: '310a775bcc36016275d64cb8e4508e19437708852e42a3948a641b664be800a9',
  publicKey: '302a300506032b6570032100fa344793601cef71348f994f30a168c2dd55f357426a180a5a724d7e03585e91',
};

export const ed25519PrivKeyPrefix = '302e020100300506032b657004220420';

export const ed25519PubKeyPrefix = '302a300506032b6570032100';

export const OWNER1 = ACCOUNT_1.publicKey;

export const OWNER2 = ACCOUNT_2.publicKey;

export const OWNER3 = ACCOUNT_3.publicKey;

export const FEE = '1000000000';

export const VALID_ADDRESS = { address: '10.0.24141' };

export const INVALID_ADDRESS = { address: '1002.4141' };

export const WALLET_INITIALIZATION =
  '229f010a100a080888e1e0f8051000120418d5d00412021804188094ebdc03220208785a7d0a722a700802126c0a2212201c5b8332673e2bdd7d677970e549e05157ea6a94f41a5da5020903c1c391f8ef0a221220265f7cc91c0330ef27a626ff8688da761ab0543d33ba63c8315e2c91b6c595af0a22122003ad12643db2a6ba5cf8a1da14d4bd5ee46625f88886d01cc70d2d9c6ee2266610004a0508d0c8e103';

export const sourcePrv =
  '0a410c8fe4912e3652b61dd222b1b4d7773261537d7ebad59df6cd33622a693e0a410c8fe4912e3652b61dd222b1b4d7773261537d7ebad59df6cd33622a693e';

export const PRIVATE_KEY = '422042088b5af9484cef4b0aab6e0ba1002313fdfdfacfdf23d6d0957dc5f2c24fc3b81';

export const TXDATA = 'not defined';

export const UNSIGNED_TX = 'not defined';

export const ENCODED_TRANSACTION = 'not defined';
export const errorMessageInvalidPrivateKey = 'Invalid private key';
export const errorMessageInvalidPublicKey = 'Invalid public key:';
export const errorMessageNotPossibleToDeriveAddress = 'Address derivation is not supported in Hedera';
export const errorMessageFailedToParse = 'Failed to parse correct key';

export const UNSIGNED_TRASNFER_TRANSACTION =
  '22360a140a0c08f2b1fcf80510fdcd93dd02120418a8fb0412021804188094ebdc032202087872100a0e0a0c0a080800100018d5d0041014';

export const SIGNED_TRASNFER_TRANSACTION = '';
