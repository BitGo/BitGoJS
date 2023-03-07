/*
Functions for dealing with inscriptions.

See https://docs.ordinals.com/inscriptions.html
*/

import * as assert from 'assert';
import { p2trPayments as payments, ecc as eccLib, script as bscript, Payment } from '@bitgo/utxo-lib';

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
 * @param userPubkey
 * @param contentType
 * @param inscriptionData
 * @returns inscription address
 */
export function createOutputScriptForInscription(
  userPubkey: Buffer,
  contentType: string,
  inscriptionData: Buffer
): Buffer {
  const dataPushBuffers = splitBuffer(inscriptionData, MAX_LENGTH_TAP_DATA_PUSH);

  const uncompiledScript = [
    userPubkey,
    OPS.OP_CHECKSIG,
    OPS.OP_FALSE,
    OPS.OP_IF,
    Buffer.from('ord', 'ascii'),
    OPS.OP_1,
    Buffer.from(contentType, 'ascii'),
    OPS.OP_0,
    ...dataPushBuffers,
    OPS.ENDIF,
  ];

  const compiledScript = bscript.compile(uncompiledScript);
  const redeem: Payment = {
    output: compiledScript,
    depth: 0,
  };
  const payment = payments.p2tr({ redeems: [redeem] }, { eccLib });

  assert(payment.output, 'Failed to create inscription output script');
  return payment.output;
}
