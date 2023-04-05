/*
Functions for dealing with inscriptions.

See https://docs.ordinals.com/inscriptions.html
*/

import * as assert from 'assert';
import {
  p2trPayments as payments,
  ecc as eccLib,
  script as bscript,
  Payment,
  Network,
  bitgo,
  address,
  taproot,
  ECPair,
} from '@bitgo/utxo-lib';
import * as utxolib from '@bitgo/utxo-lib';
import { PreparedInscriptionRevealData } from '@bitgo/sdk-core';

const OPS = bscript.OPS;
const MAX_LENGTH_TAP_DATA_PUSH = 520;

/**
 * The max size of an individual OP_PUSH in a Taproot script is 520 bytes. This
 * function splits inscriptionData into an array buffer of 520 bytes length.
 * https://docs.ordinals.com/inscriptions.html
 * @param inscriptionData
 * @param chunkSize
 */
function splitBuffer(inscriptionData: Buffer, chunkSize: number) {
  const pushDataBuffers: Buffer[] = [];
  for (let i = 0; i < inscriptionData.length; i += chunkSize) {
    pushDataBuffers.push(inscriptionData.slice(i, i + chunkSize));
  }

  return pushDataBuffers;
}

/**
 *
 * @returns inscription payment object
 * @param pubkey
 * @param contentType
 * @param inscriptionData
 */
function createPaymentForInscription(pubkey: Buffer, contentType: string, inscriptionData: Buffer): Payment {
  const dataPushBuffers = splitBuffer(inscriptionData, MAX_LENGTH_TAP_DATA_PUSH);

  const uncompiledScript = [
    pubkey,
    OPS.OP_CHECKSIG,
    OPS.OP_FALSE,
    OPS.OP_IF,
    Buffer.from('ord', 'ascii'),
    1, // these two lines should be combined as a single OPS.OP_1,
    1, // but `ord`'s decoder has a bug so it has to be like this
    Buffer.from(contentType, 'ascii'),
    OPS.OP_0,
    ...dataPushBuffers,
    OPS.OP_ENDIF,
  ];

  const compiledScript = bscript.compile(uncompiledScript);
  const redeem: Payment = {
    output: compiledScript,
    depth: 0,
  };

  return payments.p2tr({ redeems: [redeem], redeemIndex: 0 }, { eccLib });
}

/**
 * @param payment
 * @param controlBlock
 * @param commitOutput
 * @param network
 * @return virtual size of a transaction with a single inscription reveal input and a single commitOutput
 */
function getInscriptionRevealSize(
  payment: Payment,
  controlBlock: Buffer,
  commitOutput: Buffer,
  network: Network
): number {
  const psbt = bitgo.createPsbtForNetwork({ network });
  const parsedControlBlock = taproot.parseControlBlock(eccLib, controlBlock);
  const leafHash = taproot.getTapleafHash(eccLib, parsedControlBlock, payment.redeem?.output as Buffer);

  psbt.addInput({
    hash: Buffer.alloc(32),
    index: 0,
    witnessUtxo: { script: commitOutput, value: BigInt(100_000) },
    tapLeafScript: [
      {
        controlBlock,
        script: payment.redeem?.output as Buffer,
        leafVersion: taproot.INITIAL_TAPSCRIPT_VERSION,
      },
    ],
  });
  psbt.addOutput({ script: commitOutput, value: BigInt(10_000) });

  psbt.signTaprootInput(
    0,
    {
      publicKey: Buffer.alloc(32),
      signSchnorr(hash: Buffer): Buffer {
        // dummy schnorr-sized signature
        return Buffer.alloc(64);
      },
    },
    [leafHash]
  );

  psbt.finalizeTapInputWithSingleLeafScriptAndSignature(0);
  return psbt.extractTransaction(/* disableFeeCheck */ true).virtualSize();
}

/**
 * @param pubkey
 * @param contentType
 * @param inscriptionData
 * @param network
 * @returns PreparedInscriptionRevealData
 */
export function createInscriptionRevealData(
  pubkey: Buffer,
  contentType: string,
  inscriptionData: Buffer,
  network: Network
): PreparedInscriptionRevealData {
  const payment = createPaymentForInscription(pubkey, contentType, inscriptionData);

  const { output: commitOutput, controlBlock } = payment;
  assert(commitOutput);
  assert(controlBlock);
  assert(payment.redeem?.output);
  const commitAddress = address.fromOutputScript(commitOutput, network);

  const tapLeafScript: utxolib.bitgo.TapLeafScript[] = [
    {
      controlBlock,
      script: payment.redeem?.output,
      leafVersion: taproot.INITIAL_TAPSCRIPT_VERSION,
    },
  ];
  const revealTransactionVSize = getInscriptionRevealSize(payment, controlBlock, commitOutput, network);

  return {
    address: commitAddress,
    revealTransactionVSize,
    tapLeafScript: tapLeafScript[0],
  };
}

/**
 * @param pubkey
 * @param contentType
 * @param inscriptionData
 * @returns inscription address
 */
export function createOutputScriptForInscription(pubkey: Buffer, contentType: string, inscriptionData: Buffer): Buffer {
  const payment = createPaymentForInscription(pubkey, contentType, inscriptionData);

  assert(payment.output, 'Failed to create inscription output script');
  return payment.output;
}

/**
 *
 * @param privateKey
 * @param tapLeafScript
 * @param commitAddress
 * @param recipientAddress
 * @param unsignedCommitTx
 * @param network
 *
 * @return a fully signed reveal transaction
 */
export function signRevealTransaction(
  privateKey: Buffer,
  tapLeafScript: utxolib.bitgo.TapLeafScript,
  commitAddress: string,
  recipientAddress: string,
  unsignedCommitTx: Buffer,
  network: Network
): utxolib.bitgo.UtxoPsbt {
  const unserCommitTxn = utxolib.bitgo.createTransactionFromBuffer(unsignedCommitTx, network);
  const hash = unserCommitTxn.getHash();
  const commitOutput = utxolib.address.toOutputScript(commitAddress, network);
  const vout = unserCommitTxn.outs.findIndex((out) => out.script.equals(commitOutput));

  if (vout === -1) {
    throw new Error('Invalid commit transaction');
  }

  const psbt = bitgo.createPsbtForNetwork({ network });
  psbt.addInput({
    hash,
    index: vout,
    witnessUtxo: { script: commitOutput, value: BigInt(unserCommitTxn.outs[vout].value) },
    tapLeafScript: [tapLeafScript],
  });

  const recipientOutput = address.toOutputScript(recipientAddress, network);
  psbt.addOutput({ script: recipientOutput, value: BigInt(10_000) });

  const signer = ECPair.fromPrivateKey(privateKey);
  const parsedControlBlock = taproot.parseControlBlock(eccLib, tapLeafScript.controlBlock);
  const leafHash = taproot.getTapleafHash(eccLib, parsedControlBlock, tapLeafScript.script as Buffer);
  psbt.signTaprootInput(0, signer, [leafHash]);

  return psbt;
}
