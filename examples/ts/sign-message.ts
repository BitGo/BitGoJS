/**
 * Sign a Message from an MPC wallet at BitGo.
 *
 * Copyright 2025, BitGo, Inc.  All Rights Reserved.
 */
import { BitGo } from 'bitgo';
import { MessageStandardType } from '@bitgo/sdk-core';

const bitgo = new BitGo({ env: 'test' });

const coin = 'hteth';
const basecoin = bitgo.coin(coin);
const accessToken = '';
const walletId = '';
const walletPassphrase = '';

async function signMessage(): Promise<void> {
  await bitgo.authenticateWithAccessToken({ accessToken });
  const walletInstance = await basecoin.wallets().get({ id: walletId });

  // EIP712 requires a structured typed data format (JSON stringified)
  const eip712TypedData = {
    types: {
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' },
      ],
      Message: [{ name: 'contents', type: 'string' }],
    },
    primaryType: 'Message',
    domain: {
      name: 'BitGo Wallet',
      version: '1',
      chainId: 17000, // Holesky testnet chain ID
      verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
    },
    message: {
      contents: 'Hello, this is a test message!',
    },
  };

  const testnetMessageRaw = JSON.stringify(eip712TypedData);

  const messageTxn = await walletInstance.signMessage({
    message: {
      messageRaw: testnetMessageRaw,
      messageStandardType: MessageStandardType.EIP712,
    },
    walletPassphrase,
  });

  console.log(messageTxn);
}

signMessage().catch(console.error);
