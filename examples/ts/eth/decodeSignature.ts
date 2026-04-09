/**
 *  Its a function to recover the signer address of the siganture payload for a eth multisig transaction
 *
 * Copyright 2024, BitGo, Inc.  All Rights Reserved.
 */
import { Eth } from '../../../modules/account-lib';
import * as ethUtil from 'ethereumjs-util';
import * as ethAbi from 'ethereumjs-abi';

const getOperationHash = (data: string): string => {
  const { expireTime, sequenceId, amount, to } = Eth.Utils.decodeTransferData(data);
  console.log('to             :  ', to);
  console.log('amount         :  ', amount);
  console.log('expireTime     :  ', expireTime);
  console.log('sequenceId     :  ', sequenceId);
  return ethAbi.soliditySHA3(
    ...[
      ['string', 'address', 'uint', 'uint', 'uint'],
      ['ETHER', to, amount, expireTime, sequenceId],
    ]
  );
};

const recoverSigner = function () {
  // decode your transaction hex using https://rawtxdecode.in/
  // use input as data here to decode the signature
  const data = ''; // TODO : add transaction data

  const { signature } = Eth.Utils.decodeTransferData(data);
  console.log('signature     :  ', signature);
  const { v, r, s } = ethUtil.fromRpcSig(signature);
  const operationHash = getOperationHash(data);
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore known compatibility issue with @types/ethereumjs-util
  const pubKeyBuffer = ethUtil.ecrecover(operationHash, v, r, s);
  console.log('operationHash     :  ', operationHash);
  console.log('pubKeyBuffer      :  ', ethUtil.bufferToHex(pubKeyBuffer));
  return ethUtil.bufferToHex(ethUtil.pubToAddress(ethUtil.importPublic(pubKeyBuffer)));
};

async function main() {
  const recoverAdd = recoverSigner();
  console.log('\n \n The provided transaction has been signed by', recoverAdd);
}

main().catch((e) => console.error(e));
