/**
 * Transfer AVAX from single-sig X-chain wallet to a BitGo multi-sig P-chain wallet.
 *
 * Copyright 2022, BitGo, Inc.  All Rights Reserved.
 */
import { Avalanche, BinTools, BN, Buffer } from 'avalanche';
import {
  AVMAPI,
  KeyChain as AVMKeyChain,
  AmountOutput,
  UnsignedTx,
  ExportTx,
  TransferableOutput,
  TransferableInput,
  Tx as AVMTx,
} from 'avalanche/dist/apis/avm';
import {
  PlatformVMAPI,
  SECPTransferOutput,
  SECPTransferInput,
  UTXOSet,
  UTXO,
  UnsignedTx as PVMUnsignedTx,
  KeyChain as PlatformVMKeyChain,
  Tx as PlatformVMTx,
} from 'avalanche/dist/apis/platformvm';
import { Defaults, UnixNow } from 'avalanche/dist/utils';

type ChainConfig = {
  NODE_HOST: string;
  NODE_PORT: number;
  NODE_PROTOCOL: string;
  NODE_NETWORK_ID: number;
};

const FUJI: ChainConfig = {
  NODE_HOST: 'localhost',
  NODE_PORT: 9650,
  NODE_PROTOCOL: 'http',
  NODE_NETWORK_ID: 5,
};

// const MAINNET: ChainConfig = {
//   NODE_HOST: 'api.avax.network',
//   NODE_PORT: 9650,
//   NODE_PROTOCOL: 'http',
//   NODE_NETWORK_ID: 1,
// };

// Fuji or Mainnet config
const conf = FUJI;

// Private Key containing funds
// Example: PrivateKey-here
const avaxPrivateKey = '';

// multisig wallet receive addresses
// Example: [
//   'P-address1',
//   'P-address2',
//   'P-address3',
// ]
const pMultisigReceiveAddresses = [];

// amount to transfer cross-chain plus fees
const transferAmountVal = (1 + 0.002) * 1e9; // 1 AVAX + 0.002 AVAX fee

/*
 * This function transfers funds from a single X-chain wallet to a P-chain multisig wallet
 */
export async function crossChainTransfer(
  conf: ChainConfig,
  avaxPrivateKey: string,
  pMultisigReceiveAddresses: string[],
  transferAmountVal: number
): Promise<any> {
  // connect to network and get info
  console.log('Connecting to network...');
  const avalanche = new Avalanche(conf.NODE_HOST, conf.NODE_PORT, conf.NODE_PROTOCOL, conf.NODE_NETWORK_ID);
  const networkID = await avalanche.Info().getNetworkID();
  const networkName = await avalanche.Info().getNetworkName();
  console.log('Network:', { networkName, networkID });

  // set basic params
  const bintools: BinTools = BinTools.getInstance();
  const avaxAssetID: string = Defaults.network[networkID].P.avaxAssetID as string;
  const avaxAssetIDBuf = bintools.cb58Decode(avaxAssetID);
  const locktime: BN = new BN(0);
  const memo: Buffer = Buffer.from('Manually Export AVAX from single-sig X-Chain to multi-sig P-Chain');
  const xBlockchainID: string = Defaults.network[networkID].X.blockchainID;
  const pBlockchainID: string = Defaults.network[networkID].P.blockchainID;

  // import the key into keychains
  const pchain: PlatformVMAPI = avalanche.PChain();
  const xchain: AVMAPI = avalanche.XChain();
  const xKeychain: AVMKeyChain = xchain.keyChain();
  const pKeychain: PlatformVMKeyChain = pchain.keyChain();
  xKeychain.importKey(avaxPrivateKey);
  pKeychain.importKey(avaxPrivateKey);

  // get X-chain address
  const xAddressesStrings = xKeychain.getAddressStrings();
  const xAddressesBufs = xKeychain.getAddresses();
  console.log('X-Chain addresses:', xAddressesStrings);

  // set fees
  const fee: BN = pchain.getDefaultTxFee();
  console.log(`Fee = ${fee}`);

  // get utxos
  const avmUTXOResponse: any = await xchain.getUTXOs(xAddressesStrings);
  const utxoSet: UTXOSet = avmUTXOResponse.utxos;
  const utxos: UTXO[] = utxoSet.getAllUTXOs();

  const outputs: TransferableOutput[] = [];
  const exportedOuts: TransferableOutput[] = [];
  const inputs: TransferableInput[] = [];

  let totalInputsAmount: BN = new BN(0);
  const transferAmount: BN = new BN(transferAmountVal);

  utxos.forEach((utxo: UTXO) => {
    // type 7 is transferable output
    if (utxo.getOutput().getTypeID() === 7 && totalInputsAmount.lt(transferAmount.add(fee).add(fee))) {
      console.log('\nSelected utxo:');

      // get amount and asset
      const amountOutput: AmountOutput = utxo.getOutput() as AmountOutput;
      const amount: BN = amountOutput.getAmount().clone();
      const assetID: Buffer = utxo.getAssetID();
      console.log(`utxo asset:amount = ${bintools.bufferToB58(assetID)}:${amount.toString()}`);

      // get utxo txid
      const txid: Buffer = utxo.getTxID();
      const outputidx: Buffer = utxo.getOutputIdx();
      console.log(`utxo txid:outputIdx = ${bintools.bufferToB58(txid)}:${new BN(outputidx).toString()}\n`);

      // create inputs
      const secpTransferInput: SECPTransferInput = new SECPTransferInput(amount);
      if (utxo.getOutput().getAddresses().length > 1) {
        throw Error('Exported UTXO should have only one address');
      }
      secpTransferInput.addSignatureIdx(0, xAddressesBufs[0]);

      const input: TransferableInput = new TransferableInput(txid, outputidx, assetID, secpTransferInput);
      inputs.push(input);
      totalInputsAmount = totalInputsAmount.add(amount);
    } else {
      throw Error('utxo is not avax');
    }
  });
  console.log(`total imported: amount = ${totalInputsAmount}\n`);

  // cross chain export output
  let secpTransferOutput: SECPTransferOutput = new SECPTransferOutput();
  secpTransferOutput = new SECPTransferOutput(transferAmount.sub(fee), xAddressesBufs, locktime, 1);

  // push exported output
  exportedOuts.push(new TransferableOutput(avaxAssetIDBuf, secpTransferOutput));
  console.log(`exported utxo: amount = ${secpTransferOutput.getAmount()}\n`);

  // create change
  const secpTransferOutputChange = new SECPTransferOutput(
    totalInputsAmount.sub(secpTransferOutput.getAmount().add(fee)),
    xAddressesBufs,
    locktime,
    1
  );

  // push change output
  outputs.push(new TransferableOutput(avaxAssetIDBuf, secpTransferOutputChange));
  console.log(`change utxo: amount = ${secpTransferOutputChange.getAmount()}\n`);

  // create export tx
  const exportTx: ExportTx = new ExportTx(
    networkID,
    bintools.cb58Decode(xBlockchainID),
    outputs,
    inputs,
    memo,
    bintools.cb58Decode(pBlockchainID),
    exportedOuts
  );

  const unsignedExportTx: UnsignedTx = new UnsignedTx(exportTx);
  const signedExportTx: AVMTx = unsignedExportTx.sign(xKeychain);

  console.log('Issuing Export...');
  const exportTxid: string = await xchain.issueTx(signedExportTx);
  console.log(`Export success! TXID: https://explorer-xp.avax-test.network/tx/${exportTxid}`);

  // sleep for 5 seconds
  console.log('Wait 5 seconds for export to confirm...');

  await new Promise((resolve) => setTimeout(resolve, 5000));

  // create import tx

  // X-chain exported out address strings
  const pxAddressStrings = xAddressesStrings.map((address) => {
    return 'P-' + address.slice(2);
  });

  // get the exported p utxos
  const platformVMUTXOResponse: any = await pchain.getUTXOs(pxAddressStrings, pBlockchainID);
  const pvmUtxoSet: UTXOSet = platformVMUTXOResponse.utxos;
  console.log(`pvmUtxoSet length = ${pvmUtxoSet.getAllUTXOs().length}`);

  // create import tx
  const unsignedImportTx: PVMUnsignedTx = await pchain.buildImportTx(
    pvmUtxoSet,
    pxAddressStrings,
    xBlockchainID,
    pMultisigReceiveAddresses,
    pxAddressStrings,
    pMultisigReceiveAddresses,
    memo,
    UnixNow(),
    locktime,
    2 // threshold of 2 in the resulting utxo
  );

  const signedImportTx: PlatformVMTx = unsignedImportTx.sign(pKeychain);
  console.log('Issuing Import...');
  const txid: string = await pchain.issueTx(signedImportTx);
  console.log(`Import Success! TXID: https://explorer-xp.avax-test.network/tx/${txid}`);

  await new Promise((resolve) => setTimeout(resolve, 5000));
}

crossChainTransfer(conf, avaxPrivateKey, pMultisigReceiveAddresses, transferAmountVal);
