import should from 'should';
import { coins } from '@bitgo/statics';
import { TransactionType } from '@bitgo/sdk-core';
import { TransactionBuilderFactory } from '../../src/lib/transactionBuilderFactory';
import { Transaction } from '../../src/lib/transaction';
import { UdcDeployBuilder } from '../../src/lib/udcDeployBuilder';
import { Accounts, SandboxTransferData } from '../resources/starknet';
import { OZ_ETH_ACCOUNT_CLASS_HASH, UDC_ADDRESS, UDC_DEPLOY_ENTRYPOINT } from '../../src/lib/constants';
import utils from '../../src/lib/utils';
import { StarknetTransactionType } from '../../src/lib/iface';

describe('Starknet UdcDeployBuilder', () => {
  const coinConfig = coins.get('starknet');
  const master = Accounts.account1;
  const target = Accounts.account2;

  const getBuilder = (): UdcDeployBuilder => new TransactionBuilderFactory(coinConfig).getUdcDeployBuilder();

  function buildUdcRawHex(
    overrides: {
      unique?: string;
      ctorLen?: string;
      constructorCalldata?: string[];
      omitCtor?: boolean;
    } = {}
  ): string {
    const derived = utils.computeStarknetAddress(utils.getUncompressedPublicKey(target.publicKey));
    const ctor = overrides.constructorCalldata ?? derived.constructorCalldata;
    const calldata = overrides.omitCtor
      ? [OZ_ETH_ACCOUNT_CLASS_HASH, derived.salt, overrides.unique ?? '0x0', overrides.ctorLen ?? '0x99']
      : [
          OZ_ETH_ACCOUNT_CLASS_HASH,
          derived.salt,
          overrides.unique ?? '0x0',
          overrides.ctorLen ?? '0x' + BigInt(ctor.length).toString(16),
          ...ctor,
        ];
    return Buffer.from(
      JSON.stringify({
        senderAddress: master.address,
        calls: [
          {
            contractAddress: UDC_ADDRESS,
            entrypoint: UDC_DEPLOY_ENTRYPOINT,
            calldata,
          },
        ],
        nonce: '0x0',
        chainId: SandboxTransferData.chainId,
        transactionType: StarknetTransactionType.INVOKE,
      }),
      'utf-8'
    ).toString('hex');
  }

  describe('Build UDC deploy transaction', () => {
    it('should build from target public key and produce a transactionHash', async () => {
      const builder = getBuilder();
      builder.sender(master.address).nonce('0x0').chainId(SandboxTransferData.chainId).fromPublicKey(target.publicKey);

      const expected = utils.computeStarknetAddress(utils.getUncompressedPublicKey(target.publicKey));
      builder.getTargetAddress()!.should.equal(expected.address);
      utils.normalizeAddress(builder.getTargetAddress()!).should.equal(utils.normalizeAddress(target.address));

      const tx = (await builder.build()) as Transaction;
      const data = tx.starknetTransactionData;

      should.exist(data.transactionHash);
      (data.transactionHash as string).should.startWith('0x');
      data.calls.length.should.equal(1);
      data.calls[0].contractAddress.should.equal(UDC_ADDRESS);
      data.calls[0].entrypoint.should.equal(UDC_DEPLOY_ENTRYPOINT);
      data.calls[0].calldata[0].should.equal(OZ_ETH_ACCOUNT_CLASS_HASH);
      data.calls[0].calldata[2].should.equal('0x0'); // unique=false
      data.calls[0].calldata[3].should.equal('0x4'); // EthAccount ctor len
      data.calls[0].calldata.slice(4).should.deepEqual(expected.constructorCalldata);
    });

    it('should keep derived address consistent with computeStarknetAddress', async () => {
      const builder = getBuilder();
      builder.fromPublicKey(target.publicKey);
      const derived = utils.computeStarknetAddress(utils.getUncompressedPublicKey(target.publicKey));
      builder.getTargetAddress()!.should.equal(derived.address);
      derived.salt.should.equal(
        utils.parseUdcDeployCall({
          contractAddress: UDC_ADDRESS,
          entrypoint: UDC_DEPLOY_ENTRYPOINT,
          calldata: [OZ_ETH_ACCOUNT_CLASS_HASH, derived.salt, '0x0', '0x4', ...derived.constructorCalldata],
        })!.salt
      );
    });

    it('should include compiledCalldata with a single UDC call', async () => {
      const builder = getBuilder();
      builder.sender(master.address).nonce('0x0').chainId(SandboxTransferData.chainId).fromPublicKey(target.publicKey);

      const tx = (await builder.build()) as Transaction;
      const compiled = tx.starknetTransactionData.compiledCalldata as string[];
      compiled[0].should.equal('0x1');
      utils.normalizeAddress(compiled[1]).should.equal(utils.normalizeAddress(UDC_ADDRESS));
    });

    it('should round-trip through toInternalHex and from()', async () => {
      const builder = getBuilder();
      builder.sender(master.address).nonce('0x0').chainId(SandboxTransferData.chainId).fromPublicKey(target.publicKey);

      const tx = (await builder.build()) as Transaction;
      const internalHex = tx.toInternalHex();

      const builder2 = await new TransactionBuilderFactory(coinConfig).from(internalHex);
      builder2.should.be.instanceof(UdcDeployBuilder);
      const tx2 = (await builder2.build()) as Transaction;

      tx2.signableHex.should.equal(tx.signableHex);
      tx2.id.should.equal(tx.id);
      (builder2 as UdcDeployBuilder).getTargetAddress()!.should.equal(target.address);
      const parsed = utils.parseUdcDeployCall(tx2.starknetTransactionData.calls[0]);
      should.exist(parsed);
      parsed!.unique.should.equal(false);
      utils
        .normalizeAddress(
          utils.calculateContractAddressFromHash(parsed!.salt, parsed!.classHash, parsed!.constructorCalldata, 0)
        )
        .should.equal(utils.normalizeAddress(target.address));
    });

    it('toBroadcastFormat should return Starknet RPC-ready INVOKE JSON', async () => {
      const builder = getBuilder();
      builder.sender(master.address).nonce('0x0').chainId(SandboxTransferData.chainId).fromPublicKey(target.publicKey);

      const tx = (await builder.build()) as Transaction;
      const parsed = JSON.parse(tx.toBroadcastFormat());

      parsed.type.should.equal('INVOKE');
      parsed.version.should.equal('0x3');
      parsed.sender_address.should.equal(master.address);
      parsed.calldata.should.be.Array();
      parsed.calldata[0].should.equal('0x1');
    });

    it('should accept explicit deployParams', async () => {
      const derived = utils.computeStarknetAddress(utils.getUncompressedPublicKey(target.publicKey));
      const builder = getBuilder();
      builder.sender(master.address).nonce('0x0').chainId(SandboxTransferData.chainId).deployParams({
        classHash: OZ_ETH_ACCOUNT_CLASS_HASH,
        salt: derived.salt,
        constructorCalldata: derived.constructorCalldata,
      });

      builder.getTargetAddress()!.should.equal(derived.address);
      const tx = (await builder.build()) as Transaction;
      should.exist(tx.starknetTransactionData.transactionHash);
    });

    it('toJson/explainTransaction should expose target address with amount 0', async () => {
      const builder = getBuilder();
      builder.sender(master.address).nonce('0x0').chainId(SandboxTransferData.chainId).fromPublicKey(target.publicKey);

      const tx = (await builder.build()) as Transaction;
      const json = tx.toJson();
      json.type.should.equal(TransactionType.ContractCall);
      json.sender.should.equal(master.address);
      utils.normalizeAddress(json.recipient!).should.equal(utils.normalizeAddress(target.address));
      json.amount!.should.equal('0');

      const explained = tx.explainTransaction();
      explained.outputs.length.should.equal(1);
      utils.normalizeAddress(explained.outputs[0].address).should.equal(utils.normalizeAddress(target.address));
      explained.outputs[0].amount.should.equal('0');
      explained.type!.should.equal(TransactionType.ContractCall);
    });
  });

  describe('Validation', () => {
    it('should reject build without sender', async () => {
      const builder = getBuilder();
      builder.nonce('0x0').chainId(SandboxTransferData.chainId).fromPublicKey(target.publicKey);
      await builder.build().should.be.rejectedWith(/[Ss]ender/);
    });

    it('should reject build without deploy params', async () => {
      const builder = getBuilder();
      builder.sender(master.address).nonce('0x0').chainId(SandboxTransferData.chainId);
      await builder.build().should.be.rejectedWith(/UDC deploy requires/);
    });

    it('should reject invalid target public key', () => {
      const builder = getBuilder();
      (() => builder.fromPublicKey('invalid')).should.throw(/[Ii]nvalid/);
    });

    it('should reject empty constructor calldata in deployParams', () => {
      const builder = getBuilder();
      (() =>
        builder.deployParams({
          classHash: OZ_ETH_ACCOUNT_CLASS_HASH,
          salt: '0x1',
          constructorCalldata: [],
        })).should.throw(/Constructor calldata/);
    });

    it('should reject salt 0x0', () => {
      const builder = getBuilder();
      (() =>
        builder.deployParams({
          classHash: OZ_ETH_ACCOUNT_CLASS_HASH,
          salt: '0x0',
          constructorCalldata: ['0x1', '0x2', '0x3', '0x4'],
        })).should.throw(/Invalid salt/);
    });

    it('should reject unique=true on rehydration via from()', async () => {
      const hex = buildUdcRawHex({ unique: '0x1' });
      await new TransactionBuilderFactory(coinConfig).from(hex).should.be.rejectedWith(/unique=true/);
    });

    it('should reject malformed UDC calldata (bad ctor_len) on from()', async () => {
      const hex = buildUdcRawHex({ omitCtor: true, ctorLen: '0x99' });
      await new TransactionBuilderFactory(coinConfig).from(hex).should.be.rejectedWith(/Invalid UDC deploy calldata/);
    });
  });
});
