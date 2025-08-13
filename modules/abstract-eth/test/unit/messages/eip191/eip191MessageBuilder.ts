import 'should';
import sinon from 'sinon';
import { BroadcastableMessage, MessageStandardType, serializeSignatures } from '@bitgo/sdk-core';
import { fixtures } from '../fixtures';
import { EIP191Message, Eip191MessageBuilder, MessageBuilderFactory } from '../../../../src';
import { BaseCoin } from '@bitgo/statics';

describe('EIP191 Message Builder', () => {
  const sandbox = sinon.createSandbox();

  afterEach(() => {
    sandbox.restore();
  });

  describe('constructor', () => {
    it('should initialize with the correct message type', () => {
      const builder = new Eip191MessageBuilder(fixtures.coin);
      // Test the builder's private property indirectly through build()
      builder.should.be.instanceof(Eip191MessageBuilder);
    });
  });

  describe('build method', () => {
    it('should build a valid EIP191 message', async () => {
      const builder = new Eip191MessageBuilder(fixtures.coin);

      builder.setPayload(fixtures.messages.validMessage).setMetadata({ customData: 'test data' });

      const message = await builder.build();

      message.should.be.instanceof(EIP191Message);
      message.getType().should.equal(MessageStandardType.EIP191);
      message.getPayload().should.equal(fixtures.messages.validMessage);
      message.getMetadata()!.should.have.property('customData', 'test data');
      message.getMetadata()!.should.have.property('encoding', 'utf8');
    });

    it('should throw an error when building without setting payload', async () => {
      const builder = new Eip191MessageBuilder(fixtures.coin);

      await builder.build().should.be.rejectedWith('Message payload must be set before building the message');
    });

    it('should include signers when building a message', async () => {
      const builder = new Eip191MessageBuilder(fixtures.coin);

      builder.setPayload(fixtures.messages.validMessage);
      builder.addSigner(fixtures.eip191.signer);

      const message = await builder.build();

      message.getSigners().should.containEql(fixtures.eip191.signer);
    });

    it('should include signatures when building a message', async () => {
      const builder = new Eip191MessageBuilder(fixtures.coin);

      builder.setPayload(fixtures.messages.validMessage);
      builder.addSignature(fixtures.eip191.signature);

      const message = await builder.build();

      message.getSignatures().should.containEql(fixtures.eip191.signature);
    });

    it('should override metadata.encoding with utf8', async () => {
      const builder = new Eip191MessageBuilder(fixtures.coin);

      builder.setPayload(fixtures.messages.validMessage);
      builder.setMetadata({ encoding: 'hex', customData: 'test data' });

      const message = await builder.build();

      message.getMetadata()!.should.have.property('encoding', 'utf8');
      message.getMetadata()!.should.have.property('customData', 'test data');
    });
  });

  describe('fromBroadcastFormat method', () => {
    it('should reconstruct a message from broadcast format', async () => {
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
      message.getMetadata()!.should.have.property('customData', 'test data');
    });

    it('should throw an error for incorrect message type', async () => {
      const builder = new Eip191MessageBuilder(fixtures.coin);

      const broadcastMessage: BroadcastableMessage = {
        type: MessageStandardType.UNKNOWN,
        payload: fixtures.messages.validMessage,
        serializedSignatures: serializeSignatures([fixtures.eip191.signature]),
        signers: [fixtures.eip191.signer],
        metadata: {},
      };

      await builder
        .fromBroadcastFormat(broadcastMessage)
        .should.be.rejectedWith(`Invalid message type, expected ${MessageStandardType.EIP191}`);
    });
  });

  describe('fromBroadcastString', function () {
    it('should parse broadcastable string and return correct builder type', async function () {
      const broadcastHex =
        '7b2274797065223a22454950313931222c227061796c6f6164223a2253544152203130303020746f20616464725f746573743171727139366830726a68743275366e336667776d7939307837676d6c38686475657774326e6d72327536636d6b707771743477373839776b346534387a6a73616b673237647533683730776d656a756b34386b783465343368767a737566736876362033316136626162353061383462383433396164636662373836626232303230663638303765366538666461363239623432343131306663376262316336623862222c2273657269616c697a65645369676e617475726573223a5b7b227075626c69634b6579223a22222c227369676e6174757265223a2274386c6e725a4b7a757264566c777343355a66422f4b314b5533516d4b5a3970343671576a3155795744307046464577584e6d754f327a4845644e3164372b2b414e5653796f5a3869547737375073546462334b3878773d227d5d2c227369676e657273223a5b22307866613061376634613064396535343463353761656361346533326233623130343862363333636466225d2c226d65746164617461223a7b22656e636f64696e67223a2275746638227d2c227369676e61626c655061796c6f6164223a224d546b304e5463304e6a67324e5463794e6a55334e545a6b4d6a41314d7a59354e6a63325a5459314e6a51794d44526b4e6a55334d7a637a4e6a45324e7a59314d32457759544d784d7a677a4e6a557a4e5451304d5455794d6a417a4d544d774d7a417a4d4449774e7a51325a6a49774e6a45324e4459304e7a49315a6a63304e6a55334d7a63304d7a45334d5463794e7a457a4f544d324e6a677a4d4463794e6d45324f4463304d7a49334e544d324e6d557a4d7a59324e6a63334e7a5a6b4e7a6b7a4f544d774e7a677a4e7a59334e6d5132597a4d344e6a67324e4463314e6a55334e7a63304d7a49325a545a6b4e7a497a4d6a63314d7a59324d7a5a6b4e6d49334d4463334e7a45334e444d304e7a637a4e7a4d344d7a6b334e7a5a694d7a51324e544d304d7a673359545a684e7a4d324d545a694e6a637a4d6a4d334e6a51334e544d7a4e6a677a4e7a4d774e7a63325a4459314e6d45334e545a694d7a517a4f445a694e7a677a4e4459314d7a517a4d7a59344e7a59335954637a4e7a55324e6a637a4e6a67334e6a4d324d6a417a4d7a4d784e6a457a4e6a59794e6a45324d6a4d314d7a41324d544d344d7a51324d6a4d344d7a517a4d7a4d354e6a45324e44597a4e6a59324d6a4d334d7a677a4e6a59794e6a497a4d6a4d774d7a497a4d4459324d7a597a4f444d774d7a63324e544d324e6a557a4f4459324e6a51324d544d324d7a497a4f5459794d7a517a4d6a4d304d7a457a4d544d774e6a59324d7a4d334e6a49324d6a4d784e6a4d7a4e6a59794d7a67324d673d3d227d';
      const coinConfig = { name: 'eth' } as BaseCoin;
      const factory = new MessageBuilderFactory(coinConfig);
      const builder = factory.fromBroadcastString(broadcastHex);
      const message = await builder.build();

      const payload = message.getPayload();
      const payloadParts = payload.split(' ');
      const address = message.getSigners()[0];
      address.should.equal('0xfa0a7f4a0d9e544c57aeca4e32b3b1048b633cdf');
      const destinationAddress = payloadParts[3];
      destinationAddress.should.equal(
        'addr_test1qrq96h0rjht2u6n3fgwmy90x7gml8hduewt2nmr2u6cmkpwqt4w789wk4e48zjsakg27du3h70wmejuk48kx4e43hvzsufshv6'
      );
      const amount = Number(payloadParts[1]);
      amount.should.equal(1000);

      const signature = message.getSignatures()[0].signature.toString('hex');
      signature.should.equal(
        'b7c967ad92b3bab755970b02e597c1fcad4a537426299f69e3aa968f5532583d291451305cd9ae3b6cc711d37577bfbe00d552ca867c893c3becfb1375bdcaf31c'
      );
      const publicKeyHex = message.getSignatures()[0].publicKey.pub;
      publicKeyHex.should.equal('');
    });
  });
});
