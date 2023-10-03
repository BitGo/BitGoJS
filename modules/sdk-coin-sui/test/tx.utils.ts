import {
  Inputs,
  TransactionBlock as ProgrammingTransactionBlockBuilder,
} from '../src/lib/mystenlab/builder';
import { BCS } from '@mysten/bcs';

describe('Craft custom transactions', function () {
  it('should craft a custom transaction', async function () {
    const programmingTxBuilder = new ProgrammingTransactionBlockBuilder();
    programmingTxBuilder.setSender('0x6c10d1bf12e4610da1d92ef15e6bc581e1d5e79db33024e8cc1e00c21f0c7ddf');
    programmingTxBuilder.setGasBudget(1000000000);
    programmingTxBuilder.setGasOwner('0x6c10d1bf12e4610da1d92ef15e6bc581e1d5e79db33024e8cc1e00c21f0c7ddf')
    programmingTxBuilder.setGasPrice(1000);
    programmingTxBuilder.setGasPayment([{
      digest: '8fRrJpUnbyNr6NkrmxxBrDNTfpFEKCDYP6Ce9ybmpvLX',
      version: 9,
      objectId: '0x1bd2697570295fbdfcd7cc66c3fab45cc8f8b0608f19fa13ec8a84e647ca6eb8',
    }]);
    const result = programmingTxBuilder.moveCall({
      target: '0000000000000000000000000000000000000000000000000000000000000003::staking_pool::split',
      arguments: [
        programmingTxBuilder.object(Inputs.ObjectRef({
          "objectId": "e7c9f34271ce60390f9a71b0bb49d352f5cfcb42dc7d4df884e5c642c3c3ced1",
          "version": "6515114",
          "digest": "AgZAupU1gUR8ChJ8urC6FEuhNUDMfQNCA2KDSV8mRk4v"
        })),
        programmingTxBuilder.pure(Inputs.Pure('5000000000',  BCS.U64))
        ]
    });

    const transferDest = programmingTxBuilder.pure(Inputs.Pure('0x5be5ee85cf5825bd07df7bbe78f19bcaafd42e9e685fda1acf24233cd7b925a6', BCS.ADDRESS));
    programmingTxBuilder.transferObjects([result], transferDest);

    const txData = programmingTxBuilder.blockData;
  });
});
