import assert from 'assert';
import 'should';
import { utxoToInput } from '../../../src/lib/utxoEngine';
import { DecodedUtxoObj } from '../../../src/lib';
import { Buffer as BufferAvax } from 'avalanche';
import utils from './../../../src/lib/utils';

describe('AvaxP UTXO engine', () => {
  describe('should fail', () => {
    const sender: BufferAvax[] = [
      'P-fuji103cmntssp6qnucejahddy42wcy4qty0uj42822',
      'P-fuji1hdk7ntw0huhqmlhlheme9t7scsy9lhfhw3ywy4',
      'P-fuji1yzpfsdalhfwkq2ceewgs9wv7k0uft40ydpuj59',
    ].map((a) => utils.parseAddress(a));

    it('should return empty input for utxos of wrong type', () => {
      const utxos = [1, 2, 3, 4].map((n) => ({
        outputID: n,
        amount: '509999975',
        txid: 'CEbFa3hCDfMFu8ASZP9rT1s3X2X8wqoPAN258kkStk9JX3wsH',
        outputidx: '0',
        addresses: [
          'P-fuji1hdk7ntw0huhqmlhlheme9t7scsy9lhfhw3ywy4',
          'P-fuji1yzpfsdalhfwkq2ceewgs9wv7k0uft40ydpuj59',
          'P-fuji103cmntssp6qnucejahddy42wcy4qty0uj42822',
        ],
        threshold: 2,
      }));
      const { inputs } = utxoToInput(utxos, sender);
      inputs.should.be.empty();
    });

    it('should fail with wrong address', () => {
      const utxos = [
        {
          outputID: 7,
          amount: '509999975',
          txid: 'CEbFa3hCDfMFu8ASZP9rT1s3X2X8wqoPAN258kkStk9JX3wsH',
          outputidx: '0',
          addresses: [
            'P-fuji1hdk7ntw0huhqmlhlheme9t7scsy9lhfhw3ywy4',
            'P-fuji1yzpfsdalhfwkq2ceewgs9wv7k0uft40ydpuj59',
            'P-fuji13pyc89t4x5483fgdfgg9lcnpxz7ggr09vn6m6c',
          ],
          threshold: 2,
        },
      ];
      assert.throws(
        () => utxoToInput(utxos, sender),
        (e: any) => e.message === 'Addresses are inconsistent: CEbFa3hCDfMFu8ASZP9rT1s3X2X8wqoPAN258kkStk9JX3wsH'
      );
    });

    it('should fail with wrong threshold', () => {
      const utxos = [
        {
          outputID: 7,
          amount: '509999975',
          txid: 'CEbFa3hCDfMFu8ASZP9rT1s3X2X8wqoPAN258kkStk9JX3wsH',
          outputidx: '0',
          addresses: [
            'P-fuji1hdk7ntw0huhqmlhlheme9t7scsy9lhfhw3ywy4',
            'P-fuji1yzpfsdalhfwkq2ceewgs9wv7k0uft40ydpuj59',
            'P-fuji103cmntssp6qnucejahddy42wcy4qty0uj42822',
          ],
          threshold: 3,
        },
      ];
      assert.throws(
        () => utxoToInput(utxos, sender),
        (e: any) => e.message === 'Threshold is inconsistent'
      );
    });
  });

  describe('2 of 3 signers', () => {
    const utxos: DecodedUtxoObj[] = [
      {
        outputID: 7,
        amount: '509999975',
        txid: 'CEbFa3hCDfMFu8ASZP9rT1s3X2X8wqoPAN258kkStk9JX3wsH',
        outputidx: '0',
        addresses: [
          'P-fuji1hdk7ntw0huhqmlhlheme9t7scsy9lhfhw3ywy4',
          'P-fuji1yzpfsdalhfwkq2ceewgs9wv7k0uft40ydpuj59',
          'P-fuji103cmntssp6qnucejahddy42wcy4qty0uj42822',
        ],
        threshold: 2,
      },
      {
        outputID: 7,
        amount: '26932830273',
        txid: '2VyWNR4q8p7ZnKfaot37SbMBCWHbEbqEca7Af1tiRTArkJMdXt',
        outputidx: '0',
        addresses: [
          'P-fuji1yzpfsdalhfwkq2ceewgs9wv7k0uft40ydpuj59',
          'P-fuji103cmntssp6qnucejahddy42wcy4qty0uj42822',
          'P-fuji1hdk7ntw0huhqmlhlheme9t7scsy9lhfhw3ywy4',
        ],
        threshold: 2,
      },
    ];
    const sender: BufferAvax[] = [
      'P-fuji103cmntssp6qnucejahddy42wcy4qty0uj42822',
      'P-fuji1hdk7ntw0huhqmlhlheme9t7scsy9lhfhw3ywy4',
      'P-fuji1yzpfsdalhfwkq2ceewgs9wv7k0uft40ydpuj59',
    ].map((a) => utils.parseAddress(a));

    const firstSigner = sender[0].toString('hex');
    // second signer is Zeros credential.
    it('should return credential 2 of 3', () => {
      const { inputs } = utxoToInput(utxos, sender);
      inputs.forEach((input, i) => {
        const expectedSignature = input.signatures.map((signature) =>
          signature.toBuffer().toString('hex').substring(90)
        );
        expectedSignature.should.containEql(firstSigner);
        const fistSignatureIdx = input.signaturesIdx[expectedSignature.indexOf(firstSigner)];
        utils.parseAddress(utxos[i].addresses[fistSignatureIdx]).toString('hex').should.be.equal(firstSigner);
      });
    });
  });

  describe('4 of 4 signers', () => {
    const utxos: DecodedUtxoObj[] = [
      {
        outputID: 7,
        amount: '509999975',
        txid: 'CEbFa3hCDfMFu8ASZP9rT1s3X2X8wqoPAN258kkStk9JX3wsH',
        outputidx: '0',
        addresses: [
          'P-fuji1hdk7ntw0huhqmlhlheme9t7scsy9lhfhw3ywy4',
          'P-fuji1yzpfsdalhfwkq2ceewgs9wv7k0uft40ydpuj59',
          'P-fuji13pyc89t4x5483fgdfgg9lcnpxz7ggr09vn6m6c',
          'P-fuji103cmntssp6qnucejahddy42wcy4qty0uj42822',
        ],
        threshold: 4,
      },
      {
        outputID: 7,
        amount: '26932830273',
        txid: '2VyWNR4q8p7ZnKfaot37SbMBCWHbEbqEca7Af1tiRTArkJMdXt',
        outputidx: '0',
        addresses: [
          'P-fuji1yzpfsdalhfwkq2ceewgs9wv7k0uft40ydpuj59',
          'P-fuji13pyc89t4x5483fgdfgg9lcnpxz7ggr09vn6m6c',
          'P-fuji103cmntssp6qnucejahddy42wcy4qty0uj42822',
          'P-fuji1hdk7ntw0huhqmlhlheme9t7scsy9lhfhw3ywy4',
        ],
        threshold: 4,
      },
    ];
    const sender: BufferAvax[] = [
      'P-fuji103cmntssp6qnucejahddy42wcy4qty0uj42822',
      'P-fuji1hdk7ntw0huhqmlhlheme9t7scsy9lhfhw3ywy4',
      'P-fuji1yzpfsdalhfwkq2ceewgs9wv7k0uft40ydpuj59',
      'P-fuji13pyc89t4x5483fgdfgg9lcnpxz7ggr09vn6m6c',
    ].map((a) => utils.parseAddress(a));

    const firstSigner = sender[0].toString('hex');
    // second signer is Zeros credential.
    const thirdSigner = sender[2].toString('hex');
    const forthSigner = sender[3].toString('hex');

    it('should return credential', () => {
      const { inputs } = utxoToInput(utxos, sender, 4);
      inputs.forEach((input, i) => {
        const expectedSignature = input.signatures.map((signature) =>
          signature.toBuffer().toString('hex').substring(90)
        );
        expectedSignature.should.containEql(firstSigner);
        const fistSignatureIdx = input.signaturesIdx[expectedSignature.indexOf(firstSigner)];
        utils.parseAddress(utxos[i].addresses[fistSignatureIdx]).toString('hex').should.be.equal(firstSigner);

        expectedSignature.should.containEql(thirdSigner);
        const thirdSignatureIdx = input.signaturesIdx[expectedSignature.indexOf(thirdSigner)];
        utils.parseAddress(utxos[i].addresses[thirdSignatureIdx]).toString('hex').should.be.equal(thirdSigner);

        expectedSignature.should.containEql(forthSigner);
        const forthSignatureIdx = input.signaturesIdx[expectedSignature.indexOf(forthSigner)];
        utils.parseAddress(utxos[i].addresses[forthSignatureIdx]).toString('hex').should.be.equal(forthSigner);
      });
    });
  });
});
