import 'should';
import sinon from 'sinon';
import { BroadcastableMessage, MessageStandardType, serializeSignatures } from '@bitgo/sdk-core';
import { fixtures } from './fixtures';
import { Eip191MessageBuilder, EIP191Message } from '@bitgo/abstract-eth';

describe('BSC EIP191 Message Builder', () => {
  const sandbox = sinon.createSandbox();

  afterEach(() => {
    sandbox.restore();
  });

  describe('constructor', () => {
    it('should initialize with BSC coin configuration', () => {
      const builder = new Eip191MessageBuilder(fixtures.coin);

      builder.should.be.instanceof(Eip191MessageBuilder);
      // Verify it's using BSC coin config
      fixtures.coin.name.should.equal('tbsc');
    });
  });

  describe('build method', () => {
    it('should build a valid EIP191 message for BSC', async () => {
      const builder = new Eip191MessageBuilder(fixtures.coin);

      builder.setPayload(fixtures.messages.validMessage).setMetadata({ customData: 'BSC test data' });

      const message = await builder.build();

      message.should.be.instanceof(EIP191Message);
      message.getType().should.equal(MessageStandardType.EIP191);
      message.getPayload().should.equal(fixtures.messages.validMessage);
      message.getMetadata()!.should.have.property('customData', 'BSC test data');
      message.getMetadata()!.should.have.property('encoding', 'utf8');
    });

    it('should throw an error when building without setting payload', async () => {
      const builder = new Eip191MessageBuilder(fixtures.coin);

      await builder.build().should.be.rejectedWith('Message payload must be set before building the message');
    });

    it('should include BSC signers when building a message', async () => {
      const builder = new Eip191MessageBuilder(fixtures.coin);

      builder.setPayload(fixtures.messages.validMessage);
      builder.addSigner(fixtures.eip191.signer);

      const message = await builder.build();

      message.getSigners().should.containEql(fixtures.eip191.signer);
    });

    it('should include signatures when building a BSC message', async () => {
      const builder = new Eip191MessageBuilder(fixtures.coin);

      builder.setPayload(fixtures.messages.validMessage);
      builder.addSignature(fixtures.eip191.signature);

      const message = await builder.build();

      message.getSignatures().should.containEql(fixtures.eip191.signature);
    });

    it('should override metadata.encoding with utf8 for BSC', async () => {
      const builder = new Eip191MessageBuilder(fixtures.coin);

      builder.setPayload(fixtures.messages.validMessage);
      builder.setMetadata({ encoding: 'hex', customData: 'BSC test data', network: 'bsc' });

      const message = await builder.build();

      message.getMetadata()!.should.have.property('encoding', 'utf8');
      message.getMetadata()!.should.have.property('customData', 'BSC test data');
      message.getMetadata()!.should.have.property('network', 'bsc');
    });

    it('should handle BSC-specific metadata fields', async () => {
      const builder = new Eip191MessageBuilder(fixtures.coin);

      builder.setPayload(fixtures.messages.validMessage);
      builder.setMetadata({
        network: 'bsc',
        chainId: 97, // BSC testnet chain ID
        customData: 'BSC-specific data',
      });

      const message = await builder.build();

      message.getMetadata()!.should.have.property('network', 'bsc');
      message.getMetadata()!.should.have.property('chainId', 97);
      message.getMetadata()!.should.have.property('customData', 'BSC-specific data');
    });
  });

  describe('fromBroadcastFormat method', () => {
    it('should reconstruct a BSC message from broadcast format', async () => {
      const builder = new Eip191MessageBuilder(fixtures.coin);

      const broadcastMessage: BroadcastableMessage = {
        type: MessageStandardType.EIP191,
        payload: fixtures.messages.validMessage,
        serializedSignatures: serializeSignatures([fixtures.eip191.signature]),
        signers: [fixtures.eip191.signer],
        metadata: fixtures.eip191.metadata,
      };

      const message = await builder.fromBroadcastFormat(broadcastMessage);

      message.should.be.instanceof(EIP191Message);
      message.getType().should.equal(MessageStandardType.EIP191);
      message.getPayload().should.equal(fixtures.messages.validMessage);
      message.getSignatures().should.containEql(fixtures.eip191.signature);
      message.getSigners().should.containEql(fixtures.eip191.signer);
      message.getMetadata()!.should.have.property('encoding', 'utf8');
      message.getMetadata()!.should.have.property('customData', 'BSC test data');
      message.getMetadata()!.should.have.property('network', 'bsc');
    });

    it('should handle broadcast format with empty metadata for BSC', async () => {
      const builder = new Eip191MessageBuilder(fixtures.coin);

      const broadcastMessage: BroadcastableMessage = {
        type: MessageStandardType.EIP191,
        payload: fixtures.messages.validMessage,
        serializedSignatures: serializeSignatures([fixtures.eip191.signature]),
        signers: [fixtures.eip191.signer],
        metadata: {},
      };

      const message = await builder.fromBroadcastFormat(broadcastMessage);

      message.getMetadata()!.should.have.property('encoding', 'utf8');
      message.getPayload().should.equal(fixtures.messages.validMessage);
    });

    it('should handle special characters in BSC broadcast format', async () => {
      const builder = new Eip191MessageBuilder(fixtures.coin);

      const broadcastMessage: BroadcastableMessage = {
        type: MessageStandardType.EIP191,
        payload: fixtures.messages.specialCharsMessage,
        serializedSignatures: serializeSignatures([fixtures.eip191.signature]),
        signers: [fixtures.eip191.signer],
        metadata: { network: 'bsc' },
      };

      const message = await builder.fromBroadcastFormat(broadcastMessage);

      message.getPayload().should.equal(fixtures.messages.specialCharsMessage);
      message.getMetadata()!.should.have.property('network', 'bsc');
    });
  });

  describe('BSC-specific scenarios', () => {
    it('should work with multiple signers for BSC multisig scenarios', async () => {
      const builder = new Eip191MessageBuilder(fixtures.coin);
      const secondSigner = '0x1234567890123456789012345678901234567890';

      builder.setPayload(fixtures.messages.validMessage);
      builder.addSigner(fixtures.eip191.signer);
      builder.addSigner(secondSigner);

      const message = await builder.build();

      message.getSigners().should.containEql(fixtures.eip191.signer);
      message.getSigners().should.containEql(secondSigner);
      message.getSigners().length.should.equal(2);
    });

    it('should preserve BSC chain-specific metadata throughout build process', async () => {
      const builder = new Eip191MessageBuilder(fixtures.coin);

      builder.setPayload(fixtures.messages.validMessage);
      builder.setMetadata({
        network: 'bsc',
        chainId: 56, // BSC mainnet
        gasPrice: '5000000000', // 5 Gwei
        contractAddress: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', // WBNB
      });

      const message = await builder.build();

      const metadata = message.getMetadata()!;
      metadata.should.have.property('network', 'bsc');
      metadata.should.have.property('chainId', 56);
      metadata.should.have.property('gasPrice', '5000000000');
      metadata.should.have.property('contractAddress', '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c');
    });
  });
});
