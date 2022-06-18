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
import { PlatformVMAPI,
  SECPTransferOutput,
  SECPTransferInput,
  UTXOSet,
  UTXO,
  UnsignedTx as PVMUnsignedTx,
  KeyChain as PlatformVMKeyChain,
  Tx as PlatformVMTx,
} from 'avalanche/dist/apis/platformvm';
import {
  Defaults,
  UnixNow,
} from 'avalanche/dist/utils';

async function getAvalanche(conf: ChainConfig) {
  console.log('Connecting to network...');
  const avalanche = new Avalanche(conf.NODE_HOST, conf.NODE_PORT, conf.NODE_PROTOCOL, conf.NODE_NETWORK_ID);
  const networkID = await avalanche.Info().getNetworkID();
  const networkName = await avalanche.Info().getNetworkName();
  console.log('Network:', { networkName, networkID });
  return avalanche;
}

type ChainConfig = {
  NODE_HOST: string;
  NODE_PORT: number;
  NODE_PROTOCOL: string;
  NODE_NETWORK_ID: number;
};

const FUJI: ChainConfig = {
  NODE_HOST: 'api.avax-test.network',
  NODE_PORT: 443,
  NODE_PROTOCOL: 'https',
  NODE_NETWORK_ID: 5,
};

const main = async (): Promise<any> => {

  // paste your private key here, like PrivateKey-12345678903gkRXXZkYPtye2ZqFrbSA13uDiutLK5ercixX
  const avaxPrivateKey = '';

  // paste your BitGo P-chain receive addresses here like: 
  // ['P-fuji1512390847askljdghfaklsdjfh', 'P-fuji239p58iuqwopierthjaskldjgfn', 'P-fujisoejkldfghaskldfj23wekjrlaf'];
  const pAddressesStrings = [];

  const avalanche: Avalanche = await getAvalanche(FUJI);
  const networkID = 5;

  const avaxAssetID = 'U8iRqJoiJm8xZHAacmvYyZVwqQx6uDNtQeP3CQ6fcgQk3JqnK';
  const locktime: BN = new BN(0);
  const memo: Buffer = Buffer.from(
    'Manually Export AVAX from X-Chain to P-Chain'
  );
  const xBlockchainID: string = Defaults.network[networkID].X.blockchainID;
  const pBlockchainID: string = Defaults.network[networkID].P.blockchainID;


  const pchain: PlatformVMAPI = avalanche.PChain();
  const xchain: AVMAPI = avalanche.XChain();
  const bintools: BinTools = BinTools.getInstance();
  const xKeychain: AVMKeyChain = xchain.keyChain();
  const pKeychain: PlatformVMKeyChain = pchain.keyChain();

  xKeychain.importKey(avaxPrivateKey);
  pKeychain.importKey(avaxPrivateKey);

  const xAddressesStrings = xKeychain.getAddressStrings();
  const xAddressesBufs = xKeychain.getAddresses();
  

  const fee: BN = pchain.getDefaultTxFee();
  console.log(`fee = ${fee}`);

  const avmUTXOResponse: any = await xchain.getUTXOs(xAddressesStrings);
  const utxoSet: UTXOSet = avmUTXOResponse.utxos;
  const utxos: UTXO[] = utxoSet.getAllUTXOs();
  // print the length of utxos 
  console.log(`utxos length = ${utxos.length}`);

  const outputs: TransferableOutput[] = [];
  const exportedOuts: TransferableOutput[] = [];
  const inputs: TransferableInput[] = [];

  // const pAddressesBufs = _.map(pAddressesStrings, (address) => {
  //   return pchain.parseAddress(address);
  // });

  // let totalAmount = new BN(0);
  utxos.forEach((utxo: UTXO) => {
    if (utxo.getOutput().getTypeID() !== 6) {

      // get utxo amount
      const amountOutput: AmountOutput = utxo.getOutput() as AmountOutput;
      const amount: BN = amountOutput.getAmount().clone();
      const assetID: Buffer = utxo.getAssetID();
      console.log(`utxo asset:amount = ${bintools.bufferToB58(assetID)}:${amount.toString()}`);
      
      // get utxo txid
      const txid: Buffer = utxo.getTxID();
      const outputidx: Buffer = utxo.getOutputIdx();
      console.log(`utxo txid:outputIdx = ${bintools.bufferToB58(txid)}:${new BN(outputidx).toString()}`);

      console.log(`from addresses = ${xAddressesStrings}`);
      console.log(`to   addresses = ${pAddressesStrings}`);
      // let sendAmount = amount.sub(fee);
      // if (!totalAmount.add(sendAmount).lt(transferAmount)) {
      //   sendAmount = 
      // } else {
      //   sendAmount = transferAmount.sub(totalAmount);
      // }
      
      // create output utxo (p-chain)
      let secpTransferOutput: SECPTransferOutput = new SECPTransferOutput();
      const avaxAssetIDBuf: Buffer = bintools.cb58Decode(avaxAssetID);
      if (avaxAssetIDBuf.toString('hex') === assetID.toString('hex')) {
        secpTransferOutput = new SECPTransferOutput(
          amount.sub(fee),
          xAddressesBufs,
          locktime,
          1
        );
      } else {
        throw Error('Asset ID does not match');
      }

      // push exported output
      const transferableOutput: TransferableOutput = new TransferableOutput(
        assetID,
        secpTransferOutput
      );
      exportedOuts.push(transferableOutput);
      
      // create inputs
      const secpTransferInput: SECPTransferInput = new SECPTransferInput(amount);
      if (utxo.getOutput().getAddresses().length > 1) {
        throw Error('Exported UTXO should have only one address');
      }
      secpTransferInput.addSignatureIdx(0, xAddressesBufs[0]);
      const input: TransferableInput = new TransferableInput(
        txid,
        outputidx,
        assetID,
        secpTransferInput
      );
      inputs.push(input);
    } else {
      throw Error('utxo is not avax');
    }
  });

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
  
  const exportTxid: string = await xchain.issueTx(signedExportTx);
  console.log(`Export success! TXID: ${exportTxid}`);

  // sleep for 5 seconds
  console.log('Wait 5 seconds for export to confirm...');
  
  await new Promise(resolve => setTimeout(resolve, 5000));

  // create import tx

  const pxAddressStrings = xAddressesStrings.map((address) => {
    return 'P-' + address.slice(2);
  });

  // get the exported p utxo
  const platformVMUTXOResponse: any = await pchain.getUTXOs(
    pxAddressStrings,
    pBlockchainID
  );
  const pvmUtxoSet: UTXOSet = platformVMUTXOResponse.utxos;
  console.log(`pvmUtxoSet length = ${pvmUtxoSet.getAllUTXOs().length}`);
  
  const unsignedImportTx: PVMUnsignedTx = await pchain.buildImportTx(
    pvmUtxoSet,
    pxAddressStrings,
    xBlockchainID,
    pAddressesStrings,
    pxAddressStrings,
    pAddressesStrings,
    memo,
    UnixNow(),
    locktime,
    2, // threshold of 2 in the resulting utxo
  );
  const signedImportTx: PlatformVMTx = unsignedImportTx.sign(pKeychain);
  const txid: string = await pchain.issueTx(signedImportTx);
  console.log(`Import Success! TXID: ${txid}`);

};

main();
