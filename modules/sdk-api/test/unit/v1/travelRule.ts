import * as sinon from 'sinon';
import 'should';
import { BitGoAPI } from '../../../src/bitgoAPI';

const TravelRule = require('../../../src/v1/travelRule');

// Use a real 33-byte compressed public key from the utxo-lib test vector set.
const KNOWN_RECIPIENT_PUB = '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798';

describe('TravelRule unit tests', () => {
  let bitgo: BitGoAPI;
  let travel: typeof TravelRule;

  beforeEach(() => {
    bitgo = new BitGoAPI({ env: 'test' });
    travel = new TravelRule(bitgo);
  });

  afterEach(() => {
    sinon.restore();
  });

  // ---------------------------------------------------------------------------
  // decryptReceivedTravelInfo
  // ---------------------------------------------------------------------------
  describe('decryptReceivedTravelInfo', () => {
    it('throws when tx param is missing', async () => {
      await travel.decryptReceivedTravelInfo({}).should.be.rejectedWith(/expecting tx param to be object/);
    });

    it('returns tx unchanged when receivedTravelInfo is empty', async () => {
      const tx = { receivedTravelInfo: [] };
      const result = await travel.decryptReceivedTravelInfo({ tx });
      result.should.equal(tx);
    });

    it('returns tx unchanged when receivedTravelInfo is not present', async () => {
      const tx = { id: 'txid456' };
      const result = await travel.decryptReceivedTravelInfo({ tx });
      result.should.equal(tx);
    });

    it('calls decrypt for each travel info entry', async () => {
      const decryptStub = sinon.stub(bitgo, 'decrypt').resolves(JSON.stringify({ fromUserName: 'Alice' }));

      const xprv =
        'xprv9s21ZrQH143K2fJ91S4BRsupcYrE6mmY96fcX5HkhoTrrwmwjd16Cn87cWinJjByrfpojjx7ezsJLx7TAKLT8m8hM5Kax9YcoxnBeJZ3t2k';
      const keychain = { xprv };
      const tx = {
        receivedTravelInfo: [
          {
            toPubKeyPath: 'm/0/0',
            fromPubKey: KNOWN_RECIPIENT_PUB,
            encryptedTravelInfo: 'someEncryptedBlob',
            travelInfo: '',
            transactionId: 'txid1',
            outputIndex: 0,
          },
        ],
      };

      const result = await travel.decryptReceivedTravelInfo({ tx, keychain });
      decryptStub.callCount.should.equal(1);
      result.should.equal(tx);
    });
  });

  // ---------------------------------------------------------------------------
  // prepareParams
  // ---------------------------------------------------------------------------
  describe('prepareParams', () => {
    it('throws when recipient is missing', async () => {
      await travel
        .prepareParams({
          txid: 'abc123',
          travelInfo: { fromUserName: 'Alice' },
        })
        .should.be.rejectedWith(/invalid or missing recipient/);
    });

    it('throws when travelInfo is missing', async () => {
      await travel
        .prepareParams({
          txid: 'abc123',
          recipient: { enterprise: 'SDKTest', pubKey: KNOWN_RECIPIENT_PUB, outputIndex: '0' },
        })
        .should.be.rejectedWith(/invalid or missing travelInfo/);
    });

    it('calls encrypt and returns expected output shape', async () => {
      const encryptStub = sinon.stub(bitgo, 'encrypt').resolves('asyncEncryptedBlob');

      const result = await travel.prepareParams({
        txid: 'txid789',
        recipient: { enterprise: 'SDKTest', pubKey: KNOWN_RECIPIENT_PUB, outputIndex: '1' },
        travelInfo: { fromUserName: 'Bob', toAddress: '1BitGo' },
      });

      encryptStub.callCount.should.equal(1);
      result.should.have.property('txid', 'txid789');
      result.should.have.property('toPubKey', KNOWN_RECIPIENT_PUB);
      result.should.have.property('fromPubKey').which.is.a.String();
      result.should.have.property('encryptedTravelInfo', 'asyncEncryptedBlob');
    });
  });
});
