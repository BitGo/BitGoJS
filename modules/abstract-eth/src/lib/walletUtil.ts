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
export const flushForwarderTokensMethodIdV4 = '0x3ef13367';
export const flushCoinsMethodId = '0x6b9f96ea';
export const flushERC721ForwarderTokensMethodId = '0x5a953d0a';
export const flushERC721ForwarderTokensMethodIdV4 = '0x159e44d7';
export const flushERC1155ForwarderTokensMethodId = '0xe6bd0aa4';
export const flushERC1155ForwarderTokensMethodIdV4 = '0x8972c17c';

export const ERC721SafeTransferTypeMethodId = '0xb88d4fde';
export const ERC1155SafeTransferTypeMethodId = '0xf242432a';
export const ERC1155BatchTransferTypeMethodId = '0x2eb2c2d6';
export const defaultForwarderVersion = 0;
export const defaultWalletVersion = 0;

export const walletSimpleConstructor = ['address[]'];
export const createV1WalletTypes = ['address[]', 'bytes32'];
export const flushTokensTypes = ['address', 'address'];
export const flushTokensTypesv4 = ['address'];
export const flushCoinsTypes = [];
export const flushERC721TokensTypes = ['address', 'address', 'uint256'];
export const flushERC721TokensTypesv4 = ['address', 'uint256'];
export const flushERC1155TokensTypes = ['address', 'address', 'uint256'];
export const flushERC1155TokensTypesv4 = ['address', 'uint256'];

export const sendMultiSigTypes = ['address', 'uint', 'bytes', 'uint', 'uint', 'bytes'];
export const sendMultiSigTypesFirstSigner = ['string', 'address', 'uint', 'bytes', 'uint', 'uint'];

export const sendMultiSigTokenTypes = ['address', 'uint', 'address', 'uint', 'uint', 'bytes'];
export const sendMultiSigTokenTypesFirstSigner = ['string', 'address', 'uint', 'address', 'uint', 'uint'];

export const ERC721SafeTransferTypes = ['address', 'address', 'uint256', 'bytes'];

export const ERC1155SafeTransferTypes = ['address', 'address', 'uint256', 'uint256', 'bytes'];
export const ERC1155BatchTransferTypes = ['address', 'address', 'uint256[]', 'uint256[]', 'bytes'];
export const createV1ForwarderTypes = ['address', 'bytes32'];
export const createV4ForwarderTypes = ['address', 'address', 'bytes32'];
