/**
 * @prettier
 */
import * as utxolib from '@bitgo/utxo-lib';
import {
  isWalletUnspent,
  RootWalletKeys,
  signInputWithUnspent,
  Unspent,
  WalletUnspentSigner,
} from '@bitgo/utxo-lib/dist/src/bitgo';

export type TransactionObj = {
  id: string;
  hex: string;
  ins: {
    txid: string;
    index: number;
    scriptSig?: string;
    witness?: string[];
  }[];
  outs: {
    script: string;
    value: number;
  }[];
};

function toTxOutput(u: Unspent, network: utxolib.Network): utxolib.TxOutput {
  return {
    script: utxolib.address.toOutputScript(u.address, network),
    value: u.value,
  };
}

export function transactionToObj(tx: utxolib.bitgo.UtxoTransaction): TransactionObj {
  return {
    id: tx.getId(),
    hex: tx.toBuffer().toString('hex'),
    ins: tx.ins.map((v) => ({
      txid: Buffer.from(v.hash).reverse().toString('hex'),
      index: v.index,
      script: v.script?.toString('hex'),
      witness: v.witness?.map((v) => v.toString('hex')),
    })),
    outs: tx.outs.map((v) => ({
      script: v.script.toString('hex'),
      value: v.value,
    })),
  };
}

export function transactionHexToObj(txHex: string, network: utxolib.Network): TransactionObj {
  const obj = transactionToObj(utxolib.bitgo.createTransactionFromBuffer(Buffer.from(txHex, 'hex'), network));
  if (obj.hex !== txHex) {
    throw new Error(`serialized txHex does not match input`);
  }
  return obj;
}

export function createPrebuildTransaction(
  network: utxolib.Network,
  unspents: Unspent[],
  outputAddress: string
): utxolib.bitgo.UtxoTransaction {
  const txb = utxolib.bitgo.createTransactionBuilderForNetwork(network);
  unspents.forEach((u) => {
    const [txid, vin] = u.id.split(':');
    txb.addInput(txid, Number(vin));
  });
  const unspentSum = Math.round(unspents.reduce((sum, u) => sum + u.value, 0));
  txb.addOutput(outputAddress, unspentSum - 1000);
  return txb.buildIncomplete();
}

function createTransactionBuilderWithSignedInputs(
  network: utxolib.Network,
  unspents: Unspent[],
  signer: WalletUnspentSigner<RootWalletKeys>,
  inputTransaction: utxolib.bitgo.UtxoTransaction
): utxolib.bitgo.UtxoTransactionBuilder {
  const txBuilder = utxolib.bitgo.createTransactionBuilderFromTransaction(
    inputTransaction,
    unspents.map((u) => toTxOutput(u, network))
  );
  unspents.forEach((u, inputIndex) => {
    if (isWalletUnspent(u)) {
      signInputWithUnspent(txBuilder, inputIndex, u, signer);
    }
  });
  return txBuilder;
}

export function createHalfSignedTransaction(
  network: utxolib.Network,
  unspents: Unspent[],
  outputAddress: string,
  signer: WalletUnspentSigner<RootWalletKeys>,
  prebuild?: utxolib.bitgo.UtxoTransaction
): utxolib.bitgo.UtxoTransaction {
  if (!prebuild) {
    prebuild = createPrebuildTransaction(network, unspents, outputAddress);
  }
  return createTransactionBuilderWithSignedInputs(network, unspents, signer, prebuild).buildIncomplete();
}

export function createFullSignedTransaction(
  network: utxolib.Network,
  unspents: Unspent[],
  outputAddress: string,
  signer: WalletUnspentSigner<RootWalletKeys>,
  halfSigned?: utxolib.bitgo.UtxoTransaction
): utxolib.bitgo.UtxoTransaction {
  if (!halfSigned) {
    halfSigned = createHalfSignedTransaction(network, unspents, outputAddress, signer);
  }
  return createTransactionBuilderWithSignedInputs(
    network,
    unspents,
    new WalletUnspentSigner(signer.walletKeys, signer.cosigner, signer.signer),
    halfSigned
  ).build();
}
