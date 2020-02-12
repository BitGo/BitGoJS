import * as should from 'should';
import * as Utils from '../../../../src/coin/xtz/utils';
import { signedSerializedOriginationTransaction } from "../../../resources/xtz/xtz";

describe('XTZ util library', function() {
  describe('address', function() {
    it('should validate addresses', function() {
      const validAddresses = [
        'tz1aWXP237BLwNHJcCD4b3DutCevhqq2T1Z9',
        'tz2SHdGxFGhs68wYNC4hEqxbWARxp2J4mVxv',
        'tz3gN8NTLNLJg5KRsUU47NHNVHbdhcFXjjaB',
        'KT1EGbAxguaWQFkV3Egb2Z1r933MWuEYyrJS',
      ];

      for (const address of validAddresses) {
        Utils.isValidAddress(address).should.be.true();
      }
    });

    it('should fail to validate invalid addresses', function() {
      const invalidAddresses = [
        'tz4aWXP237BLwNHJcCD4b3DutCevhqq2T1Z9',
        'xtz2SHdGxFGhs68wYNC4hEqxbWARxp2J4mVxv',
        'KT2EGbAxguaWQFkV3Egb2Z1r933MWuEYyrJS',
        'abc',
      ];

      for (const address of invalidAddresses) {
        should.doesNotThrow(() => Utils.isValidAddress(address));
        Utils.isValidAddress(address).should.be.false();
      }
    });
  });

  describe('block hash', function() {
    it('should validate block hashes', function() {
      const validHashes = [
        'BKoifs5gGffAzuRBcg3ygxbLdrCXyDDS1ALvMG8SFYWahzoYMku',
        'BL4oxWAkozJ3mJHwVFQqga5dQMBi8kBCPAQyBKgF78z7SQT1AvN',
        'BL29n92KHaarq1r7XjwTFotzCpxq7LtXMc9bF2qD9Qt26ZTYQia',
      ];

      for (const hash of validHashes) {
        Utils.isValidBlockHash(hash).should.be.true();
      }
    });

    it('should fail to validate invalid block hashes', function() {
      const invalidHashes = [
        'AKoifs5gGffAzuRBcg3ygxbLdrCXyDDS1ALvMG8SFYWahzoYMku',
        'BKoifs5gGffAzuRBcg3ygxbLdrCXyDDS1ALvMG8SFYWahzoYMku1111111111',
        'invalid',
      ];

      for (const hash of invalidHashes) {
        Utils.isValidBlockHash(hash).should.be.false();
      }
    });
  });

  describe('transaction hash', function() {
    it('should validate tx hashes', function() {
      const validHashes = [
        'opUmZNMueryYFxTbzzocS7K4dzs3NmgKqhhr9TkcftszDDnoRVu',
        'ookyzxsYF7vyTeDzsgs58XJ4PXuvBkK8wWqZJ4EoRS6RWQb4Y9P',
        'ooXQoUX32szALRvgzD2TDzeRPXtPfmfqwoehPaK5khbrBiMAtSw',
      ];

      for (const hash of validHashes) {
        Utils.isValidTransactionHash(hash).should.be.true();
      }
    });

    it('should fail to validate invalid tx hashes', function() {
      const invalidHashes = [
        'lpUmZNMueryYFxTbzzocS7K4dzs3NmgKqhhr9TkcftszDDnoRVu',
        'opUmZNMueryYFxTbzzocS7K4dzs3NmgKqhhr9TkcftszDDnoRVu1111111111',
        'invalid',
      ];

      for (const hash of invalidHashes) {
        Utils.isValidTransactionHash(hash).should.be.false();
      }
    });

    it('should calculate the transaction hash', async function() {
      const operationId = await Utils.calculateTransactionId(signedSerializedOriginationTransaction);
      operationId.should.equal('opPsNbm7EcqPyryBDDR28BjdthnriktK8TbMvpwc9r4NwmvToYP');
    });

    it('should calculate the originated account address', async function() {
      const accountAddress = await Utils.calculateOriginatedAddress('opPsNbm7EcqPyryBDDR28BjdthnriktK8TbMvpwc9r4NwmvToYP', 0);
      accountAddress.should.equal('KT1LJvp55fbdNwbisJFign9wA4cPgq9T9oc4');
    });
  });
});
