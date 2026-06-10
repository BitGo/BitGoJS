import should from 'should';
import { coins } from '@bitgo/statics';
import { TransactionBuilderFactory } from '../../src/lib/transactionBuilderFactory';
import { Transaction } from '../../src/lib/transaction';
import { StarknetTransactionType } from '../../src/lib/iface';
import { Accounts, SandboxTransferData } from '../resources/starknet';
import { OZ_ETH_ACCOUNT_CLASS_HASH } from '../../src/lib/constants';

describe('Starknet WalletInitializationBuilder', () => {
  const coinConfig = coins.get('starknet');
  const chainId = SandboxTransferData.chainId;

  describe('Build deploy account transaction', () => {
    it('should build DEPLOY_ACCOUNT and produce a transactionHash', async () => {
      const factory = new TransactionBuilderFactory(coinConfig);
      const builder = factory.getWalletInitializationBuilder();

      builder.fromPublicKey(Accounts.account1.publicKey).nonce('0x0').chainId(chainId);

      const tx = (await builder.build()) as Transaction;
      const data = tx.starknetTransactionData;

      data.transactionType.should.equal(StarknetTransactionType.DEPLOY_ACCOUNT);
      should.exist(data.transactionHash);
      (data.transactionHash as string).should.startWith('0x');
      data.senderAddress.should.equal(Accounts.account1.address);
      (data.classHash as string).should.equal(OZ_ETH_ACCOUNT_CLASS_HASH);
      should.exist(data.constructorCalldata);
      should.exist(data.contractAddressSalt);
      data.calls.should.have.length(0);
    });

    it('should set signableHex from the Poseidon deploy hash', async () => {
      const factory = new TransactionBuilderFactory(coinConfig);
      const builder = factory.getWalletInitializationBuilder();

      builder.fromPublicKey(Accounts.account1.publicKey).nonce('0x0').chainId(chainId);

      const tx = (await builder.build()) as Transaction;
      tx.signableHex.should.equal(tx.starknetTransactionData.transactionHash);
      tx.id.should.equal(tx.starknetTransactionData.transactionHash);
    });

    it('should produce different hashes for different accounts', async () => {
      const factory = new TransactionBuilderFactory(coinConfig);

      const builder1 = factory.getWalletInitializationBuilder();
      builder1.fromPublicKey(Accounts.account1.publicKey).nonce('0x0').chainId(chainId);
      const tx1 = (await builder1.build()) as Transaction;

      const builder2 = factory.getWalletInitializationBuilder();
      builder2.fromPublicKey(Accounts.account2.publicKey).nonce('0x0').chainId(chainId);
      const tx2 = (await builder2.build()) as Transaction;

      tx1.signableHex.should.not.equal(tx2.signableHex);
    });

    it('should round-trip through toInternalHex and factory.from', async () => {
      const factory = new TransactionBuilderFactory(coinConfig);
      const builder = factory.getWalletInitializationBuilder();

      builder.fromPublicKey(Accounts.account1.publicKey).nonce('0x0').chainId(chainId);

      const tx = (await builder.build()) as Transaction;
      const internalHex = tx.toInternalHex();

      const factory2 = new TransactionBuilderFactory(coinConfig);
      const builder2 = await factory2.from(internalHex);
      const tx2 = (await builder2.build()) as Transaction;

      tx2.signableHex.should.equal(tx.signableHex);
      tx2.starknetTransactionData.transactionType.should.equal(StarknetTransactionType.DEPLOY_ACCOUNT);
    });

    it('toBroadcastFormat should return DEPLOY_ACCOUNT RPC JSON', async () => {
      const factory = new TransactionBuilderFactory(coinConfig);
      const builder = factory.getWalletInitializationBuilder();

      builder.fromPublicKey(Accounts.account1.publicKey).nonce('0x0').chainId(chainId);

      const tx = (await builder.build()) as Transaction;
      const broadcast = tx.toBroadcastFormat();
      const parsed = JSON.parse(broadcast);

      parsed.type.should.equal('DEPLOY_ACCOUNT');
      parsed.version.should.equal('0x3');
      parsed.sender_address.should.equal(Accounts.account1.address);
      parsed.class_hash.should.equal(OZ_ETH_ACCOUNT_CLASS_HASH);
      parsed.constructor_calldata.should.be.Array().and.not.empty();
      parsed.contract_address_salt.should.startWith('0x');
      parsed.nonce.should.equal('0x0');
      parsed.resource_bounds.should.have.property('l2_gas');
      parsed.nonce_data_availability_mode.should.equal('L1');
      parsed.fee_data_availability_mode.should.equal('L1');
      parsed.should.not.have.property('calldata');
      parsed.should.not.have.property('account_deployment_data');
    });
  });

  describe('Validation', () => {
    it('should reject build without public key or deploy fields', async () => {
      const factory = new TransactionBuilderFactory(coinConfig);
      const builder = factory.getWalletInitializationBuilder();
      builder.sender(Accounts.account1.address).nonce('0x0').chainId(chainId);

      await builder.build().should.be.rejectedWith(/public key|constructor calldata/i);
    });

    it('should reject mismatched address and public key', () => {
      const factory = new TransactionBuilderFactory(coinConfig);
      const builder = factory.getWalletInitializationBuilder();
      (() =>
        builder
          .fromPublicKey(Accounts.account1.publicKey)
          .sender(Accounts.account2.address, Accounts.account1.publicKey)).should.throw(/[Aa]ddress/);
    });
  });
});

describe('Starknet deploy account RPC wire format (live Sepolia)', () => {
  it('should reach node validation (not param parse error) for unsigned deploy', async function (this: Mocha.Context) {
    this.timeout(15000);
    const factory = new TransactionBuilderFactory(coins.get('starknet'));
    const builder = factory.getWalletInitializationBuilder();
    builder.fromPublicKey(Accounts.account1.publicKey).nonce('0x0').chainId(SandboxTransferData.chainId);
    const tx = (await builder.build()) as Transaction;
    const body = {
      jsonrpc: '2.0',
      method: 'starknet_addDeployAccountTransaction',
      params: [JSON.parse(tx.toBroadcastFormat())],
      id: 1,
    };

    const response = await fetch('https://api.cartridge.gg/x/starknet/sepolia', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = (await response.json()) as { error?: { message?: string } };

    should.exist(json.error);
    const msg = json.error?.message || '';
    msg.should.not.match(/parsing params|EOF/i);
    msg.should.match(/signature|Validate|nonce|fee|resource|Invalid params/i);
  });
});
