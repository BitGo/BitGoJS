export const sendMultisigMethodId = '0x39125215';
export const sendMultisigTokenMethodId = '0x0dcd7a6c';
export const v1CreateForwarderMethodId = '0xfb90b320';
export const v4CreateForwarderMethodId = '0x13b2f75c';
export const v1WalletInitializationFirstBytes = '0x60806040';
export const v1CreateWalletMethodId = '0x7117f3fa';
export const createForwarderMethodId = '0xa68a76cc';
export const walletInitializationFirstBytes = '0x60606040';
export const recoveryWalletInitializationFirstBytes = '0x60c06040';
export const flushForwarderTokensMethodId = '0x2da03409';
export const flushCoinsMethodId = '0x6b9f96ea';

export const ERC721SafeTransferTypeMethodId = '0xb88d4fde';
export const ERC1155SafeTransferTypeMethodId = '0xf242432a';
export const ERC1155BatchTransferTypeMethodId = '0x2eb2c2d6';
export const defaultForwarderVersion = 0;
export const defaultWalletVersion = 0;

export const walletSimpleConstructor = ['address[]'];
export const createV1WalletTypes = ['address[]', 'bytes32'];
export const flushTokensTypes = ['address', 'address'];
export const flushCoinsTypes = [];

export const sendMultiSigTypes = ['address', 'uint', 'bytes', 'uint', 'uint', 'bytes'];

export const sendMultiSigTokenTypes = ['address', 'uint', 'address', 'uint', 'uint', 'bytes'];

export const ERC721SafeTransferTypes = ['address', 'address', 'uint256', 'bytes'];

export const ERC1155SafeTransferTypes = ['address', 'address', 'uint256', 'uint256', 'bytes'];
export const ERC1155BatchTransferTypes = ['address', 'address', 'uint256[]', 'uint256[]', 'bytes'];
export const createV1ForwarderTypes = ['address', 'bytes32'];
export const createV4ForwarderTypes = ['address', 'address', 'bytes32'];
