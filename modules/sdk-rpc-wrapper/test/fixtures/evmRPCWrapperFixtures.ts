import { TxRequest, SignatureShareType, RequestTracer, TypedMessage, MessageTypes } from '@bitgo/sdk-core';
import { EVMRPCTransactionOptions } from '../../src';

export const ethWalletData = {
  id: '598f606cd8fc24710d2ebadb1d9459bb',
  coin: 'hteth',
  keys: ['598f606cd8fc24710d2ebad89dce86c2', '598f606cc8e43aef09fcb785221d9dd2', '5935d59cf660764331bafcade1855fd7'],
  multisigType: 'tss',
};

export const reqId = new RequestTracer();

export const txRequestForMessageSigning: TxRequest = {
  txRequestId: reqId.toString(),
  transactions: [],
  intent: {
    intentType: 'signMessage',
  },
  date: new Date().toISOString(),
  latest: true,
  state: 'pendingUserSignature',
  userId: 'userId',
  walletType: 'hot',
  policiesChecked: false,
  version: 1,
  walletId: 'walletId',
  unsignedTxs: [],
  unsignedMessages: [],
  messages: [
    {
      state: 'signed',
      signatureShares: [{ from: SignatureShareType.USER, to: SignatureShareType.USER, share: '' }],
      combineSigShare: '0:rrr:sss:3',
      txHash: '0xrrrsss1b',
    },
  ],
};

export const txRequestForTypedDataSigning: TxRequest = {
  txRequestId: reqId.toString(),
  transactions: [],
  intent: {
    intentType: 'signMessage',
  },
  date: new Date().toISOString(),
  latest: true,
  state: 'pendingUserSignature',
  userId: 'userId',
  walletType: 'hot',
  policiesChecked: false,
  version: 1,
  walletId: 'walletId',
  unsignedTxs: [],
  unsignedMessages: [],
  messages: [
    {
      state: 'signed',
      signatureShares: [{ from: SignatureShareType.USER, to: SignatureShareType.USER, share: '' }],
      combineSigShare: '0:rrr:sss:3',
      txHash:
        '1901493fbf2ae1c27c3ced26a89070c6ab5d3fbf37ed778de9378e7703b7d1f116b3883077a61826129b98b622e54fc68c5008d1b1c16552e1eda6916f870d719220',
    },
  ],
};

const types: MessageTypes = {
  EIP712Domain: [
    {
      name: 'name',
      type: 'string',
    },
    {
      name: 'version',
      type: 'string',
    },
    {
      name: 'chainId',
      type: 'uint256',
    },
    {
      name: 'verifyingContract',
      type: 'address',
    },
  ],
  Message: [{ name: 'data', type: 'string' }],
};

export const typedMessage: TypedMessage<MessageTypes> = {
  domain: {
    name: 'bitgo',
    version: '1',
    chainId: 1,
    verifyingContract: '0x0000000000000000000000000000000000000000',
  },
  primaryType: 'Message',
  types,
  message: { data: 'bitgo says hello!' },
};

export const transactionOptions: EVMRPCTransactionOptions = {
  to: '',
  gasLimit: '0xb',
  gasPrice: '0xa',
  value: '',
};
