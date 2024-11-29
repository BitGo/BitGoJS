/**
 * @prettier
 */
import * as utxolib from '@bitgo/utxo-lib';
const { isWalletUnspent, signInputWithUnspent } = utxolib.bitgo;
type RootWalletKeys = utxolib.bitgo.RootWalletKeys;
type Unspent<TNumber extends number | bigint = number> = utxolib.bitgo.Unspent<TNumber>;
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
    value: number | string;
  }[];
};

function toTxOutput<TNumber extends number | bigint = number>(
  u: Unspent<TNumber>,
  network: utxolib.Network
): utxolib.TxOutput<TNumber> {
  return {
    script: utxolib.address.toOutputScript(u.address, network),
    value: u.value,
  };
}

export function transactionToObj<TNumber extends number | bigint = number>(
  tx: utxolib.bitgo.UtxoTransaction<TNumber>
): TransactionObj {
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
      value: typeof v.value === 'bigint' ? v.value.toString() : (v.value as number),
    })),
  };
}

export function transactionHexToObj(
  txHex: string,
  network: utxolib.Network,
  amountType: 'number' | 'bigint' = 'number'
): TransactionObj {
  const obj = transactionToObj(
    utxolib.bitgo.createTransactionFromBuffer(Buffer.from(txHex, 'hex'), network, { amountType })
  );
  if (obj.hex !== txHex) {
    throw new Error(`serialized txHex does not match input`);
  }
  return obj;
}

export function createPrebuildTransaction<TNumber extends number | bigint = number>(
  network: utxolib.Network,
  unspents: Unspent<TNumber>[],
  outputAddress: string
): utxolib.bitgo.UtxoTransaction<TNumber> {
  const txb = utxolib.bitgo.createTransactionBuilderForNetwork<TNumber>(network);
  unspents.forEach((u) => {
    const [txid, vin] = u.id.split(':');
    txb.addInput(txid, Number(vin));
  });
  const amountType = unspents.length > 0 && typeof unspents[0].value === 'bigint' ? 'bigint' : 'number';
  if (amountType === 'number') {
    unspents.forEach((u) => (u.value = Math.round(u.value as number) as TNumber));
  }
  const unspentSum = utxolib.bitgo.unspentSum<TNumber>(unspents, amountType);
  txb.addOutput(outputAddress, utxolib.bitgo.toTNumber<TNumber>(BigInt(unspentSum) - BigInt(1000), amountType));
  return txb.buildIncomplete();
}

function createTransactionBuilderWithSignedInputs<TNumber extends number | bigint = number>(
  network: utxolib.Network,
  unspents: Unspent<TNumber>[],
  signer: utxolib.bitgo.WalletUnspentSigner<RootWalletKeys>,
  inputTransaction: utxolib.bitgo.UtxoTransaction<TNumber>
): utxolib.bitgo.UtxoTransactionBuilder<TNumber> {
  const txBuilder = utxolib.bitgo.createTransactionBuilderFromTransaction<TNumber>(
    inputTransaction,
    unspents.map((u) => toTxOutput<TNumber>(u, network))
  );
  unspents.forEach((u, inputIndex) => {
    if (isWalletUnspent<TNumber>(u)) {
      signInputWithUnspent<TNumber>(txBuilder, inputIndex, u, signer);
    }
  });
  return txBuilder;
}

export function createHalfSignedTransaction<TNumber extends number | bigint = number>(
  network: utxolib.Network,
  unspents: Unspent<TNumber>[],
  outputAddress: string,
  signer: utxolib.bitgo.WalletUnspentSigner<RootWalletKeys>,
  prebuild?: utxolib.bitgo.UtxoTransaction<TNumber>
): utxolib.bitgo.UtxoTransaction<TNumber> {
  if (!prebuild) {
    prebuild = createPrebuildTransaction<TNumber>(network, unspents, outputAddress);
  }
  return createTransactionBuilderWithSignedInputs<TNumber>(network, unspents, signer, prebuild).buildIncomplete();
}

export function createFullSignedTransaction<TNumber extends number | bigint = number>(
  network: utxolib.Network,
  unspents: Unspent<TNumber>[],
  outputAddress: string,
  signer: utxolib.bitgo.WalletUnspentSigner<RootWalletKeys>,
  halfSigned?: utxolib.bitgo.UtxoTransaction<TNumber>
): utxolib.bitgo.UtxoTransaction<TNumber> {
  if (!halfSigned) {
    halfSigned = createHalfSignedTransaction<TNumber>(network, unspents, outputAddress, signer);
  }
  return createTransactionBuilderWithSignedInputs<TNumber>(
    network,
    unspents,
    new utxolib.bitgo.WalletUnspentSigner(signer.walletKeys, signer.cosigner, signer.signer),
    halfSigned
  ).build();
}
