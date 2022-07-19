import { Network } from '../../../src';
import { formatOutputId, WalletUnspent, ChainCode } from '../../../src/bitgo';

import { createOutputScript2of3, scriptTypeForChain } from '../../../src/bitgo/outputScripts';
import { fromOutputScript } from '../../../src/address';

import { getDefaultWalletKeys } from '../../testutil';
import { defaultTestOutputAmount, mockTransactionId } from '../../transaction_util';

export function mockOutputId(vout: number): string {
  return formatOutputId({
    txid: mockTransactionId(),
    vout,
  });
}

export function mockWalletUnspent<TNumber extends number | bigint = number>(
  network: Network,
  {
    chain = 0 as ChainCode,
    index = 0,
    value = defaultTestOutputAmount as TNumber,
    keys = getDefaultWalletKeys(),
    vout = 0,
    id = mockOutputId(vout),
  } = {}
): WalletUnspent<TNumber> {
  const derivedKeys = keys.deriveForChainAndIndex(chain, index);
  return {
    id,
    address: fromOutputScript(
      createOutputScript2of3(derivedKeys.publicKeys, scriptTypeForChain(chain)).scriptPubKey,
      network
    ),
    chain,
    index,
    value,
  };
}
