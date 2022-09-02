import { Network, Transaction } from '../../../src';
import { formatOutputId, WalletUnspent, ChainCode, createPsbtForNetwork, isSegwit } from '../../../src/bitgo';

import { createOutputScript2of3, scriptTypeForChain } from '../../../src/bitgo/outputScripts';
import { fromOutputScript } from '../../../src/address';

import { getDefaultWalletKeys } from '../../testutil';
import { mockTransactionId } from '../../transaction_util';
import * as utxolib from '../../../src';
import * as noble from '@noble/secp256k1';

export function mockOutputId(vout: number): string {
  return formatOutputId({
    txid: mockTransactionId(),
    vout,
  });
}

export function mockPrevTx(vout: number, outputScript: Buffer, value: bigint, network: Network): Transaction<bigint> {
  const psbtFromNetwork = createPsbtForNetwork(network);
  const prevTx = psbtFromNetwork.tx;

  const privKey = noble.utils.randomPrivateKey();
  const pubkey = Buffer.from(noble.getPublicKey(privKey, true));
  const payment = utxolib.payments.p2pkh({ pubkey });

  for (let index = 0; index < vout; index++) {
    if (index === vout) {
      prevTx.addOutput(outputScript, value);
    } else {
      prevTx.addOutput(payment.output!, value);
    }
  }
  prevTx.addInput(Buffer.alloc(32, 0x01), 0);
  const sig = noble.signSync(prevTx.hashForSignature(0, payment.output!, utxolib.Transaction.SIGHASH_ALL), privKey);
  prevTx.ins[0].script = utxolib.script.compile([
    Buffer.concat([sig, Buffer.from([utxolib.Transaction.SIGHASH_ALL])]),
    pubkey,
  ]);
  return prevTx;
}

export function mockWalletUnspent<TNumber extends number | bigint>(
  network: Network,
  value: TNumber,
  { chain = 0 as ChainCode, index = 0, keys = getDefaultWalletKeys(), vout = 0, id = undefined } = {}
): WalletUnspent<TNumber> {
  const derivedKeys = keys.deriveForChainAndIndex(chain, index);
  const prevTx = mockPrevTx(
    vout,
    createOutputScript2of3(derivedKeys.publicKeys, scriptTypeForChain(chain), network).scriptPubKey,
    BigInt(value),
    network
  );
  const defaultId = !id ? mockOutputId(vout) : id;

  return {
    id: isSegwit(chain) && !id ? prevTx.getId() : defaultId,
    address: fromOutputScript(
      createOutputScript2of3(derivedKeys.publicKeys, scriptTypeForChain(chain)).scriptPubKey,
      network
    ),
    chain,
    index,
    value,
  };
}
