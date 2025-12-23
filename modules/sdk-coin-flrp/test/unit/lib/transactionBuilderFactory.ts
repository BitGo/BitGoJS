import 'should';
import { coins } from '@bitgo/statics';
import { TransactionBuilderFactory, TxData } from '../../../src/lib';
import { EXPORT_IN_P } from '../../resources/transactionData/exportInP';
import { IMPORT_IN_P } from '../../resources/transactionData/importInP';
import { IMPORT_IN_C } from '../../resources/transactionData/importInC';
import { EXPORT_IN_C } from '../../resources/transactionData/exportInC';

describe('Flrp Transaction Builder Factory', () => {
  const factory = new TransactionBuilderFactory(coins.get('tflrp'));

  describe('Cross chain transfer has source and destination chains', () => {
    // P-chain Export to C-chain: source is P, destination is C
    const p2cExportTxs = [EXPORT_IN_P.unsignedHex, EXPORT_IN_P.halfSigntxHex, EXPORT_IN_P.fullSigntxHex];

    // C-chain Import from P-chain: source is P, destination is C
    const p2cImportTxs = [IMPORT_IN_C.unsignedHex, IMPORT_IN_C.halfSigntxHex, IMPORT_IN_C.fullSigntxHex];

    // P-chain Import from C-chain: source is C, destination is P
    const c2pImportTxs = [IMPORT_IN_P.unsignedHex, IMPORT_IN_P.halfSigntxHex, IMPORT_IN_P.fullSigntxHex];

    // C-chain Export to P-chain: source is C, destination is P
    const c2pExportTxs = [EXPORT_IN_C.unsignedHex, EXPORT_IN_C.signedHex];

    async function toJson(txHex: string): Promise<TxData> {
      const txBuilder = factory.from(txHex);
      const tx = await txBuilder.build();
      return tx.toJson();
    }

    describe('P to C chain transfers', () => {
      it('Should have sourceChain P and destinationChain C for Export from P-chain', async () => {
        for (const rawTx of p2cExportTxs) {
          const txJson = await toJson(rawTx);
          txJson.sourceChain!.should.equal('P');
          txJson.destinationChain!.should.equal('C');
        }
      });

      it('Should have sourceChain P and destinationChain C for Import to C-chain', async () => {
        for (const rawTx of p2cImportTxs) {
          const txJson = await toJson(rawTx);
          txJson.sourceChain!.should.equal('P');
          txJson.destinationChain!.should.equal('C');
        }
      });
    });

    describe('C to P chain transfers', () => {
      it('Should have sourceChain C and destinationChain P for Import to P-chain', async () => {
        for (const rawTx of c2pImportTxs) {
          const txJson = await toJson(rawTx);
          txJson.sourceChain!.should.equal('C');
          txJson.destinationChain!.should.equal('P');
        }
      });

      it('Should have sourceChain C and destinationChain P for Export from C-chain', async () => {
        for (const rawTx of c2pExportTxs) {
          const txJson = await toJson(rawTx);
          txJson.sourceChain!.should.equal('C');
          txJson.destinationChain!.should.equal('P');
        }
      });
    });
  });
});
