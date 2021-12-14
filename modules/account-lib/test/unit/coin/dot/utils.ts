import should from 'should';
import utils from '../../../../src/coin/dot/utils';
import { accounts, blockHash, signature } from '../../../resources/dot';
import * as DotResources from '../../../resources/dot';
import { TxData } from '../../../../src/coin/dot/iface';
import { TransactionType } from '../../../../src/coin/baseCoin';
import { buildTestConfig } from './transactionBuilder/base';
import { Transaction } from '../../../../src/coin/dot';
import { Keyring } from '@polkadot/keyring';
import { mnemonicGenerate } from '@polkadot/util-crypto';

class StubTransaction extends Transaction {
  private _txJson: TxData;

  setTxJson(json: TxData) {
    this._txJson = json;
  }

  toJson(): TxData {
    if (this._txJson) {
      return this._txJson;
    }
    return super.toJson();
  }
}

describe('utils', () => {
  let tx: StubTransaction;

  beforeEach(() => {
    const config = buildTestConfig();
    tx = new StubTransaction(config);
  });

  it('should validate addresses correctly', () => {
    should.equal(utils.isValidAddress(accounts.account1.address), true);
    should.equal(utils.isValidAddress(accounts.account2.address), true);
    should.equal(utils.isValidAddress(accounts.account3.address), true);
    should.equal(utils.isValidAddress(accounts.account4.address), true);
  });

  it('should validate block hash correctly', () => {
    should.equal(utils.isValidBlockId(blockHash.blockWithTransferOperation.hash), true);
    should.equal(utils.isValidBlockId(blockHash.blockWithStakingOperation.hash), true);
    should.equal(utils.isValidBlockId(blockHash.blockWithUnstakingOperation.hash), true);
    should.equal(utils.isValidBlockId(blockHash.blockWithProxyOperation.hash), true);
    should.equal(utils.isValidBlockId(blockHash.blockWithMultisigOperation.hash), true);
    should.equal(utils.isValidBlockId(blockHash.invalidBlockPrefix.hash), false);
    should.equal(utils.isValidBlockId(blockHash.invalidBlockLargerLength.hash), false);
    should.equal(utils.isValidBlockId(blockHash.invalidBlockShorterLength.hash), false);
  });

  it('should validate public key correctly', () => {
    should.equal(utils.isValidPublicKey(accounts.account1.publicKey), true);
    should.equal(utils.isValidPublicKey(accounts.account2.publicKey), true);
    should.equal(utils.isValidPublicKey(accounts.account3.publicKey), true);
    should.equal(utils.isValidPublicKey(accounts.account4.publicKey), true);
  });

  it('should validate private key correctly', () => {
    should.equal(utils.isValidPrivateKey(accounts.account1.secretKey), true);
    should.equal(utils.isValidPrivateKey(accounts.account2.secretKey), true);
    should.equal(utils.isValidPrivateKey(accounts.account3.secretKey), true);
    should.equal(utils.isValidPrivateKey(accounts.account4.secretKey), true);
  });

  it('should capitalize first letter correctly', () => {
    should.equal(utils.capitalizeFirstLetter('polkadot'), 'Polkadot');
  });

  it('should decode DOT address correctly', () => {
    should.equal(utils.decodeDotAddress(accounts.account1.address), '5EGoFA95omzemRssELLDjVenNZ68aXyUeqtKQScXSEBvVJkr');
  });

  it('should encode DOT address correctly', () => {
    should.equal(utils.encodeDotAddress(accounts.account1.address), '5EGoFA95omzemRssELLDjVenNZ68aXyUeqtKQScXSEBvVJkr');
  });

  it('should validate transfer transactionId correctly', () => {
    const json = JSON.parse(DotResources.jsonTransactions.transfer) as TxData;
    tx.setTxJson(json);
    tx.transactionType(TransactionType.Send);
    const explain = tx.explainTransaction();
    explain.id.should.equal('0xecb860905342cf985b39276a07d6e6696746de4623c07df863f69cba153f939a');
    should.equal(utils.isValidTransactionId(explain.id), true);
  });

  it('should validate proxy transfer transactionId correctly', () => {
    const json = JSON.parse(DotResources.jsonTransactions.proxyTransfer) as TxData;
    tx.setTxJson(json);
    tx.transactionType(TransactionType.Send);
    const explain = tx.explainTransaction();
    explain.id.should.equal('0x31ce82eb3d76a2d9814ad2f9499195a3bd9d2b16489834f8fd1c5615d9f1897f');
    should.equal(utils.isValidTransactionId(explain.id), true);
  });

  it('should validate wallet initialization transactionId correctly', () => {
    const json = JSON.parse(DotResources.jsonTransactions.walletInitialization) as TxData;
    tx.setTxJson(json);
    tx.transactionType(TransactionType.Send);
    const explain = tx.explainTransaction();
    explain.id.should.equal('0x181d71aa09c861b88b44c6252f8c68bf66d5bbad3b6ec551bbb1e715b6f8bc28');
    should.equal(utils.isValidTransactionId(explain.id), true);
  });

  it('should validate staking transactionId correctly', () => {
    const json = JSON.parse(DotResources.jsonTransactions.staking) as TxData;
    tx.setTxJson(json);
    tx.transactionType(TransactionType.Send);
    const explain = tx.explainTransaction();
    explain.id.should.equal('0xd95bb6cef42b931e0ee45b87a57dac7d42108e3b6798fd3788758482bbd69ff1');
    should.equal(utils.isValidTransactionId(explain.id), true);
  });

  it('should validate staking payee transactionId correctly', () => {
    const json = JSON.parse(DotResources.jsonTransactions.stakingPayee) as TxData;
    tx.setTxJson(json);
    tx.transactionType(TransactionType.Send);
    const explain = tx.explainTransaction();
    explain.id.should.equal('0x5e308428590cd19f576d7a3836b9f661633dd3a19025a7f0d26ed27cbf73b408');
    should.equal(utils.isValidTransactionId(explain.id), true);
  });

  it('should validate unstaking transactionId correctly', () => {
    const json = JSON.parse(DotResources.jsonTransactions.unstaking) as TxData;
    tx.setTxJson(json);
    tx.transactionType(TransactionType.Send);
    const explain = tx.explainTransaction();
    explain.id.should.equal('0xcfc19a1c80041f807c321d381579bbfddbf0a76713d6d631e27d4ddda89f3699');
    should.equal(utils.isValidTransactionId(explain.id), true);
  });

  it('should verify signature correctly', () => {
    const keyring = new Keyring({ type: 'sr25519', ss58Format: 2 });
    const mnemonic = mnemonicGenerate();
    const pair = keyring.addFromUri(mnemonic, { name: 'first pair' }, 'ed25519');
    const message = 'this is our message';
    const signature = utils.signMessage(pair, message);
    should.equal(utils.verifySignature(message, signature, pair.address), true);
  });

  it('should validate signature correctly', () => {
    should.equal(utils.isValidSignature(signature.validTransfer.signature), true);
    should.equal(utils.isValidSignature(signature.invalidTransfer.signature), false);
  });
});
