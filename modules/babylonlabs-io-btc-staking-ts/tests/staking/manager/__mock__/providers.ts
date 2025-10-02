export const btcProvider = {
  signPsbt: jest.fn(),
  signMessage: jest.fn(),
  getTransactionHex: jest.fn(),
};

export const babylonProvider = {
  signTransaction: jest.fn(),
  getCurrentHeight: jest.fn(),
  getChainId: jest.fn(),
};

export const mockChainId = "bbn-1";
