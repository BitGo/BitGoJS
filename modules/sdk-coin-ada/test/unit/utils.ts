import should from 'should';
import { KeyPair, Utils } from '../../src';
import { AddressFormat, toHex } from '@bitgo/sdk-core';
import { Ed25519Signature, DRep } from '@emurgo/cardano-serialization-lib-nodejs';
import {
  address,
  blockHash,
  enterpriseAccounts,
  privateKeys,
  publicKeys,
  signatures,
  txIds,
  rawTx,
} from '../resources';

describe('utils', () => {
  it('should validate addresses correctly', () => {
    should.equal(Utils.default.isValidAddress(address.address1), true);
    should.equal(Utils.default.isValidAddress(address.address2), true);
    should.equal(Utils.default.isValidAddress(address.address3), true);
    should.equal(Utils.default.isValidAddress(address.address4), true);
    should.equal(Utils.default.isValidAddress('dfjk35y'), false);
    should.equal(Utils.default.isValidAddress(undefined as unknown as string), false);
    should.equal(Utils.default.isValidAddress(''), false);

    // validator addresses
    should.equal(Utils.default.isValidAddress(address.address7), true);
    should.equal(Utils.default.isValidAddress(address.address8), true);
    should.equal(Utils.default.isValidAddress(address.address9), false);
    should.equal(Utils.default.isValidAddress(address.address10), false);
    should.equal(Utils.default.isValidAddress(address.address11), false);
    should.equal(Utils.default.isValidAddress(address.address12), false);
    should.equal(Utils.default.isValidAddress(address.address13), false);
    should.equal(Utils.default.isValidAddress(address.address14), false);
    should.equal(Utils.default.isValidAddress(address.address15), false);
    should.equal(Utils.default.isValidAddress(address.address16), false);

    // Byron addresses
    should.equal(Utils.default.isValidAddress(address.byron1), true);
    should.equal(Utils.default.isValidAddress(address.byron2), true);
    should.equal(Utils.default.isValidAddress(address.byron3), true);
    should.equal(Utils.default.isValidAddress(address.byron4), false);
    should.equal(Utils.default.isValidAddress(address.byron5), false);
    should.equal(Utils.default.isValidAddress(address.byron6), false);
  });

  it('should create stake and payment keys correctly', () => {
    const keyPair1 = new KeyPair({ pub: enterpriseAccounts.account1.publicKey });
    const keyPair2 = new KeyPair({ pub: enterpriseAccounts.account3.publicKey });
    should.equal(
      Utils.default.createBaseAddressWithStakeAndPaymentKey(keyPair1, keyPair2, AddressFormat.testnet),
      'addr_test1qq9arfq9pugs57apr3535z470ma2tvg8pnjy54q6s60muz5kelhytwhzrw9snh7759n9m8fr2xurpk4zyw8hmvk2avdsf62mmj'
    );
  });

  it('should create stake and payment keys correctly from private keys', () => {
    const keyPair1 = new KeyPair({ prv: privateKeys.prvKey4 });
    const keyPair2 = new KeyPair({ prv: privateKeys.prvKey2 });
    should.equal(
      Utils.default.createBaseAddressWithStakeAndPaymentKey(keyPair1, keyPair2, AddressFormat.testnet),
      'addr_test1qqvglhn9k8um66dsahxyukn9l2f6zdmnpy8puth00gjulk7g0xp5f99mdzwswz4rmfwu00x724w2jahygheyk2zqg9lsvz2muj'
    );
  });

  it('should create stake and payment keys correctly with keypairs initialized from nothing', () => {
    const keyPair1 = new KeyPair();
    const keyPair2 = new KeyPair();
    should.equal(
      Utils.default.createBaseAddressWithStakeAndPaymentKey(keyPair1, keyPair2, AddressFormat.testnet),
      Utils.default.createBaseAddressWithStakeAndPaymentKey(keyPair1, keyPair2, AddressFormat.testnet)
    );
  });

  it('should validate block hash correctly', () => {
    should.equal(Utils.default.isValidBlockId(blockHash.hash1), true);
    should.equal(Utils.default.isValidBlockId(blockHash.hash2), true);
    // param is coming as undefined so it was causing an issue
    should.equal(Utils.default.isValidBlockId(undefined as unknown as string), false);
    should.equal(Utils.default.isValidBlockId(''), false);
  });

  it('should validate invalid block hash correctly', () => {
    should.equal(Utils.default.isValidBlockId(''), false);
    should.equal(Utils.default.isValidBlockId('0xade35465gfvdcsxsz24300'), false);
    should.equal(Utils.default.isValidBlockId(blockHash.hash2 + 'ff'), false);
  });

  it('should validate public key correctly', () => {
    should.equal(
      Utils.default.isValidPublicKey('da025aa02990ef466069fadce5e3dcfad663914d6bf42fea3be50a8c3094d8e8'),
      true
    );
    should.equal(Utils.default.isValidPublicKey(publicKeys.pubKey1), true);
    should.equal(Utils.default.isValidPublicKey(publicKeys.pubKey2), true);
    should.equal(Utils.default.isValidPublicKey(publicKeys.pubKey3), true);
    should.equal(Utils.default.isValidPublicKey(publicKeys.pubKey4), false);
  });

  it('should validate private key correctly', () => {
    should.equal(Utils.default.isValidPrivateKey(privateKeys.prvKeyExtended), true);
    should.equal(Utils.default.isValidPrivateKey(privateKeys.prvKey2), true);
    should.equal(Utils.default.isValidPrivateKey(privateKeys.prvKey3WrongFormat), false);
    should.equal(Utils.default.isValidPrivateKey(privateKeys.prvKey4), true);
    should.equal(Utils.default.isValidPrivateKey(privateKeys.prvKey5WrongFormat), false);
  });

  it('should validate signature correctly', () => {
    should.equal(
      Utils.default.isValidSignature(toHex(Ed25519Signature.from_bech32(signatures.signature1).to_bytes())),
      true
    );
    should.equal(
      Utils.default.isValidSignature(toHex(Ed25519Signature.from_bech32(signatures.signature2).to_bytes())),
      true
    );
  });

  it('should validate invalid signature correctly', () => {
    should.equal(Utils.default.isValidSignature(''), false);
    should.equal(Utils.default.isValidSignature('0x00'), false);
    should.equal(Utils.default.isValidSignature(privateKeys.prvKeyExtended), false);
    should.equal(Utils.default.isValidSignature(signatures.signature1.slice(2)), false);
    should.equal(Utils.default.isValidSignature(signatures.signature2 + 'ff'), false);
  });

  it('should validate transaction id correctly', () => {
    should.equal(Utils.default.isValidTransactionId(txIds.hash1), true);
    should.equal(Utils.default.isValidTransactionId(txIds.hash2), true);
    should.equal(Utils.default.isValidTransactionId(txIds.hash3), true);
  });

  it('should validate invalid transaction id correctly', () => {
    should.equal(Utils.default.isValidTransactionId(''), false);
    should.equal(Utils.default.isValidTransactionId(txIds.hash1.slice(3)), false);
    should.equal(Utils.default.isValidTransactionId(txIds.hash3 + '00'), false);
    should.equal(Utils.default.isValidTransactionId('dalij43ta0ga2dadda02'), false);
  });

  it('should validate DRepId correctly', () => {
    should.equal(Utils.default.isValidDRepId('always-abstain'), true);
    should.equal(Utils.default.isValidDRepId('not-a-correct-choice'), false);
    should.equal(Utils.default.isValidDRepId('always-no-confidence'), true);
    should.equal(Utils.default.isValidDRepId('drep13d6sxkyz6st9h65qqrzd8ukpywhr8swe9f6357qntgjqye0incorrect'), false);
    // CIP-105 standard DRepId
    should.equal(Utils.default.isValidDRepId('drep13d6sxkyz6st9h65qqrzd8ukpywhr8swe9f6357qntgjqye0gttd'), true);
    // CIP-129 standard DRepId
    should.equal(Utils.default.isValidDRepId('drep1y29h2q6cst2pvkl2sqqvf5ljcy36uv7pmy482xnczddzgqshus24w'), true);
  });

  it('should get DRep entity from DRepId correctly', () => {
    should.equal(Utils.default.getDRepFromDRepId('always-abstain').to_json(), DRep.new_always_abstain().to_json());
    should.equal(
      Utils.default.getDRepFromDRepId('always-no-confidence').to_json(),
      DRep.new_always_no_confidence().to_json()
    );
    should.equal(
      Utils.default.getDRepFromDRepId('drep13d6sxkyz6st9h65qqrzd8ukpywhr8swe9f6357qntgjqye0gttd').to_json(),
      DRep.from_bech32('drep13d6sxkyz6st9h65qqrzd8ukpywhr8swe9f6357qntgjqye0gttd').to_json()
    );
    // DRep should be the same from both CIP-105 and CIP-129 IDs
    should.equal(
      Utils.default.getDRepFromDRepId('drep1y29h2q6cst2pvkl2sqqvf5ljcy36uv7pmy482xnczddzgqshus24w').to_json(),
      Utils.default.getDRepFromDRepId('drep13d6sxkyz6st9h65qqrzd8ukpywhr8swe9f6357qntgjqye0gttd').to_json()
    );
  });

  it('should get DRepId from DRep entity correctly', () => {
    should.equal(Utils.default.getDRepIdFromDRep(DRep.new_always_abstain()), 'always-abstain');
    should.equal(Utils.default.getDRepIdFromDRep(DRep.new_always_no_confidence()), 'always-no-confidence');
    // Regardless of whether DRep was created from CIP-105 or CIP-129 ID, the DRepId from getDRepIdFromDRep will be the ID format from `to_bech32`
    should.equal(
      Utils.default.getDRepIdFromDRep(
        Utils.default.getDRepFromDRepId('drep13d6sxkyz6st9h65qqrzd8ukpywhr8swe9f6357qntgjqye0gttd')
      ),
      'drep13d6sxkyz6st9h65qqrzd8ukpywhr8swe9f6357qntgjqye0gttd'
    );
    should.equal(
      Utils.default.getDRepIdFromDRep(
        Utils.default.getDRepFromDRepId('drep1y29h2q6cst2pvkl2sqqvf5ljcy36uv7pmy482xnczddzgqshus24w')
      ),
      'drep13d6sxkyz6st9h65qqrzd8ukpywhr8swe9f6357qntgjqye0gttd'
    );
  });

  it('should get transaction body correctly', () => {
    const {
      unsignedTx,
      unsignedTxBody,
      unsignedVoteDelegationTx,
      unsignedVoteDelegationTxBody,
      unsignedStakingActiveTx,
      unsignedStakingActiveTxBody,
      unsignedStakingDeactiveTx,
      unsignedStakingDeactiveTxBody,
      unsignedStakingWithdrawTx,
      unsignedStakingWithdrawTxBody,
      unsignedUpdatePledgeTx,
      unsignedUpdatePledgeTxBody,
      unsignedNewPledgeTx,
      unsignedNewPledgeTxBody,
      partiallySignedPledgeTx,
    } = rawTx;
    should.equal(Utils.default.getTransactionBody(unsignedTx), unsignedTxBody);
    should.equal(Utils.default.getTransactionBody(unsignedVoteDelegationTx), unsignedVoteDelegationTxBody);
    should.equal(Utils.default.getTransactionBody(unsignedStakingActiveTx), unsignedStakingActiveTxBody);
    should.equal(Utils.default.getTransactionBody(unsignedStakingDeactiveTx), unsignedStakingDeactiveTxBody);
    should.equal(Utils.default.getTransactionBody(unsignedStakingWithdrawTx), unsignedStakingWithdrawTxBody);
    should.equal(Utils.default.getTransactionBody(unsignedUpdatePledgeTx), unsignedUpdatePledgeTxBody);
    should.equal(Utils.default.getTransactionBody(unsignedNewPledgeTx), unsignedNewPledgeTxBody);
    should.equal(Utils.default.getTransactionBody(partiallySignedPledgeTx), unsignedNewPledgeTxBody);
  });
});
