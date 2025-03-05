import { payments } from "bitcoinjs-lib";
import {
  getPublicKeyNoCoord, isTaproot, isValidNoCoordPublicKey, transactionIdToHash,
} from '../../src/utils/btc';
import { networks } from 'bitcoinjs-lib';
import { testingNetworks } from '../helper';
import { deriveStakingOutputInfo } from '../../src/utils/staking';
import { Staking } from '../../src/staking';

describe('isTaproot', () => {
  describe.each(testingNetworks)('should return true for a valid Taproot address', 
  ({ network, datagen: { stakingDatagen: dataGenerator } }) => {
    const addresses = dataGenerator.getAddressAndScriptPubKey(
      dataGenerator.generateRandomKeyPair().publicKey
    );
    it('should return true for a valid Taproot address', () => {
      expect(isTaproot(addresses.taproot.address, network)).toBe(true);
    });

    it('should return false for non-Taproot address', () => {
      expect(isTaproot(addresses.nativeSegwit.address, network)).toBe(false);

      const legacyAddress = '16o1TKSUWXy51oDpL5wbPxnezSGWC9rMPv';
      expect(isTaproot(legacyAddress, network)).toBe(false);

      const nestedSegWidth = '3A2yqzgfxwwqxgse5rDTCQ2qmxZhMnfd5b';
      expect(isTaproot(nestedSegWidth, network)).toBe(false);
    });
  });

  const [mainnetDatagen, signetDatagen] = testingNetworks;
  const envNetworks = [
    {
      mainnetDatagen: mainnetDatagen.datagen.stakingDatagen,
      signetDatagen: signetDatagen.datagen.stakingDatagen,
    },
  ];

  envNetworks.forEach(({ mainnetDatagen, signetDatagen }) => {
    const mainnetAddresses = mainnetDatagen.getAddressAndScriptPubKey(
      mainnetDatagen.generateRandomKeyPair().publicKey
    );
    const signetAddresses = signetDatagen.getAddressAndScriptPubKey(
      signetDatagen.generateRandomKeyPair().publicKey
    );

  it('should return false for a signet non-Taproot address', () => {
    expect(isTaproot(signetAddresses.nativeSegwit.address, networks.testnet)).toBe(false);

    const legacyAddress = 'n2eq5iP3UsdfmGsJyEEMXyRGNx5ysUXLXb';
    expect(isTaproot(legacyAddress, networks.testnet)).toBe(false);

    const nestedSegWidth = '2NChmRbq92M6geBmwCXcFF8dCfmGr38FmX2';
    expect(isTaproot(nestedSegWidth, networks.testnet)).toBe(false);
  });

  it('should return false for an invalid address format', () => {
    const invalidAddress = 'invalid_address';
    expect(isTaproot(invalidAddress, networks.bitcoin)).toBe(false);
  });

  it('should return false for an incorrect network', () => {
    expect(isTaproot(mainnetAddresses.taproot.address, networks.testnet)).toBe(false);
    expect(isTaproot(mainnetAddresses.taproot.address, networks.regtest)).toBe(false);

    expect(isTaproot(signetAddresses.taproot.address, networks.bitcoin)).toBe(false);
  });
  });
});

describe.each(testingNetworks)('public keys', ({ datagen: {
  stakingDatagen: dataGenerator
}}) => {
  const { publicKey, publicKeyNoCoord } = dataGenerator.generateRandomKeyPair()
  describe('isValidNoCoordPublicKey', () => {
    it('should return true for a valid public key without a coordinate', () => {
      expect(isValidNoCoordPublicKey(publicKeyNoCoord)).toBe(true);
    });
  
    it('should return false for a public key with a coordinate', () => {
      expect(isValidNoCoordPublicKey(publicKey)).toBe(false);
    });

    it('should return false for an invalid public key', () => {
      const invalidPublicKey = 'invalid_public_key';
      expect(isValidNoCoordPublicKey(invalidPublicKey)).toBe(false);
    });
  });

  describe('getPublicKeyNoCoord', () => {
    it('should return the public key without the coordinate', () => {
      expect(getPublicKeyNoCoord(publicKey)).toBe(publicKeyNoCoord);
    });

    it('should return the same public key without the coordinate', () => {
      expect(getPublicKeyNoCoord(publicKeyNoCoord)).toBe(publicKeyNoCoord);
    });

    it('should throw an error for an invalid public key', () => {
      const invalidPublicKey = 'invalid_public_key';
      expect(() => getPublicKeyNoCoord(invalidPublicKey)).toThrow('Invalid public key without coordinate');
    });
  });  
});

describe.each(testingNetworks)('Derive staking output address', ({
  network,
  datagen: {
    stakingDatagen: dataGenerator
  }
}) => {
  const feeRate = 1;
  const finalityProviderPkNoCoordHex = dataGenerator.generateRandomKeyPair().publicKeyNoCoord;
  const { timelock, stakerInfo, params } = dataGenerator.generateRandomStakingTransaction(
    network, feeRate
  );

  describe("should derive the staking output address from the scripts", () => {
    const staking = new Staking(
      network, stakerInfo,
      params, finalityProviderPkNoCoordHex, timelock,
    );
    const scripts = staking.buildScripts();
    const { outputAddress } = deriveStakingOutputInfo(
      scripts, network
    );
    expect(isTaproot(outputAddress, network)).toBe(true);
  });

  it("should throw an error if no address available from creation of pay-2-taproot output", () => {
    jest.spyOn(payments, "p2tr").mockImplementation(() => {
      return {};
    });
    const staking = new Staking(
      network, stakerInfo,
      params, finalityProviderPkNoCoordHex, timelock,
    );
    const scripts = staking.buildScripts();
    expect(() => deriveStakingOutputInfo(scripts, network))
      .toThrow("Failed to build staking output");
  });

  it("should throw an error if fail to create pay-2-taproot output", () => {
    jest.spyOn(payments, "p2tr").mockImplementation(() => {
      throw new Error("oops");
    });
    const staking = new Staking(
      network, stakerInfo,
      params, finalityProviderPkNoCoordHex, timelock,
    );
    const scripts = staking.buildScripts();
    expect(() => deriveStakingOutputInfo(scripts, network))
      .toThrow("oops");
  });
});

describe('transactionIdToHash', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });
  describe.each(testingNetworks)('should correctly convert transaction id to hash', 
  ({ datagen: { stakingDatagen: dataGenerator } }) => {
    it('should correctly convert transaction id to hash', () => {
      const utxos = dataGenerator.generateRandomUTXOs(1000, 5); // Generate multiple UTXOs to test
      utxos.forEach(utxo => {
        const txid = utxo.txid;
        const expectedHash = Buffer.from(txid, 'hex').reverse();
        const result = transactionIdToHash(txid);
        expect(Buffer.isBuffer(result)).toBe(true);
        expect(result).toEqual(expectedHash);
        expect(result.toString('hex')).toBe(expectedHash.toString('hex'));
      });
    });

    it('should throw an error if the transaction id is empty', () => {
      const txId = '';
      expect(() => transactionIdToHash(txId)).toThrow("Transaction id cannot be empty");
    });
  });
});
