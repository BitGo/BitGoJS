import should from 'should';
import sinon from 'sinon';
import { Buffer } from 'buffer';
import { BroadcastableMessage, MessageStandardType, serializeSignatures, Signature } from '@bitgo-beta/sdk-core';
import { BaseCoin } from '@bitgo-beta/statics';
import { cip8TestResources } from '../../../resources/cip8Resources';
import { Cip8Message, Cip8MessageBuilder, MessageBuilderFactory } from '../../../../src';
import { bufferToCoseObjectsOutput } from '../../../../src/lib/messages/cip8/utils';

describe('Cip8MessageBuilder', function () {
  let sandbox: sinon.SinonSandbox;
  let builder: Cip8MessageBuilder;
  const coinConfig = { name: 'tada' } as BaseCoin;

  beforeEach(function () {
    sandbox = sinon.createSandbox();
    builder = new Cip8MessageBuilder(coinConfig);
  });

  afterEach(function () {
    sandbox.restore();
  });

  describe('constructor', function () {
    it('should create a builder with correct message type', function () {
      const builder = new Cip8MessageBuilder(coinConfig);
      should.exist(builder);
      builder.getType().should.equal(MessageStandardType.CIP8);
    });
  });

  describe('build', function () {
    it('should throw error if payload is not set', async function () {
      await should(builder.build()).be.rejectedWith('Message payload must be set before building the message');
    });

    it('should create a CIP8 message with correct properties', async function () {
      const payload = cip8TestResources.messages.simple;
      const signer = cip8TestResources.address.bech32;
      const metadata = { extra: 'data' };

      builder.setPayload(payload).addSigner(signer).setMetadata(metadata);

      const message = await builder.build();

      should.exist(message);
      message.should.be.instanceof(Cip8Message);
      message.getPayload().should.equal(payload);
      message.getSigners().should.deepEqual([signer]);
      const messageMetadata = message.getMetadata();
      should.exist(messageMetadata);
      messageMetadata!.should.containEql(metadata);
      messageMetadata!.should.containEql({ encoding: 'utf8' });
    });

    it('should include signatures when provided', async function () {
      const payload = cip8TestResources.messages.simple;
      const signer = cip8TestResources.address.bech32;
      const signatures: Signature[] = [
        {
          signature: Buffer.from('test-signature'),
          publicKey: { pub: cip8TestResources.keyPair.pub } as any,
        },
      ];

      builder.setPayload(payload).addSigner(signer).setSignatures(signatures);

      const message = await builder.build();

      should.exist(message);
      message.getSignatures().should.deepEqual(signatures);
    });
  });

  describe('fromBroadcastFormat', function () {
    it('should throw error if message type is invalid', async function () {
      const broadcastMessage: BroadcastableMessage = {
        type: MessageStandardType.UNKNOWN as any, // Incorrect type
        payload: 'test-payload',
        serializedSignatures: serializeSignatures([]),
        signers: [cip8TestResources.address.bech32],
        metadata: {},
      };
      await should(builder.fromBroadcastFormat(broadcastMessage)).be.rejectedWith(
        `Invalid message type, expected ${MessageStandardType.CIP8}`
      );
    });

    it('should recreate message from broadcast format', async function () {
      const signatures: Signature[] = [
        {
          signature: Buffer.from('test-signature'),
          publicKey: { pub: cip8TestResources.keyPair.pub } as any,
        },
      ];

      const broadcastMessage: BroadcastableMessage = {
        type: MessageStandardType.CIP8,
        payload: cip8TestResources.messages.simple,
        serializedSignatures: serializeSignatures(signatures),
        signers: [cip8TestResources.address.bech32],
        metadata: { extra: 'data' },
      };

      const message = await builder.fromBroadcastFormat(broadcastMessage);

      should.exist(message);
      message.should.be.instanceof(Cip8Message);
      message.getPayload().should.equal(broadcastMessage.payload);
      message.getSigners().should.deepEqual(broadcastMessage.signers);
      const messageMetadata = message.getMetadata();
      should.exist(messageMetadata);
      messageMetadata!.should.containEql(broadcastMessage.metadata);
      messageMetadata!.should.containEql({ encoding: 'utf8' });

      // Check signatures were deserialized correctly
      message.getSignatures().should.have.length(signatures.length);
      const messageSignature = message.getSignatures()[0];
      messageSignature.signature.should.deepEqual(signatures[0].signature);
      messageSignature.publicKey.should.deepEqual(signatures[0].publicKey);
    });

    describe('fromBroadcastString', function () {
      it('should parse broadcastable string and return correct builder type', async function () {
        const broadcastHex =
          '7b2274797065223a2243495038222c227061796c6f6164223a225354415220373238323535343520746f2061646472317178763965397a70353578763336307767686c3830366430327933353839397a6b6b7132726874667876377836777963746a3279726667766572353775333037776c35363735667267773232396476713538776b6a76657564357571666e6d74657a2033316136626162353061383462383433396164636662373836626232303230663638303765366538666461363239623432343131306663376262316336623862222c2273657269616c697a65645369676e617475726573223a5b7b227075626c69634b6579223a2265633861346630343534303764313134353736663963623033313832663564636163386165626434323232323332313638343332343139306539323737383431222c227369676e6174757265223a226f6e4a74595735315957784462334e6c55326c6e626a46495a586835417034344e4455344e445a684d6a41784d6a63324e7a59784e6a51324e4463794e6a55334d7a637a4e54677a4f5441784e4455784d57526c4d7a5a6d4e544a6959575669593259314e6a4d7a4d7a6b334f574979597a67325a444e6c5a6a49324e4749305a5464684d474934596a6b345a5441784d6a4d32595445304e5445785a47557a4e6d59314d6d4a685a574a6a5a6a55324d7a4d7a4f546335596a4a6a4f445a6b4d32566d4d6a5930596a526c4e324577596a68694f54686c4d4445794d7a5a684d5745784e6a59324f4459784e7a4d324f4459314e6a526d4e445534596a6b314d7a55304e4445314d6a49774d7a637a4d6a4d344d7a497a4e544d314d7a517a4e5449774e7a51325a6a49774e6a45324e4459304e7a497a4d5463784e7a67334e6a4d354e6a557a4f5464684e7a417a4e544d314e7a67334e6a4d7a4d7a597a4d4463334e6a63324f445a6a4d7a677a4d444d324e6a517a4d444d794e7a6b7a4d7a4d314d7a677a4f544d354e324532596a5a694e7a457a4d6a63794e6a67334e4459324e7a67334e6a4d334e7a677a4e6a63334e7a6b324d7a63304e6d457a4d6a63354e7a49324e6a59334e7a59324e5463794d7a557a4e7a63314d7a4d7a4d444d334e7a6332597a4d314d7a597a4e7a4d314e6a59334d6a59334e7a637a4d6a4d794d7a6b324e4463324e7a457a4e544d344e7a6332596a5a684e7a59324e5463314e6a517a4e5463314e7a45324e6a5a6c4e6d51334e4459314e3245794d444d7a4d7a45324d544d324e6a49324d5459794d7a557a4d4459784d7a677a4e4459794d7a677a4e444d7a4d7a6b324d5459304e6a4d324e6a59794d7a637a4f444d324e6a49324d6a4d794d7a417a4d6a4d774e6a597a4e6a4d344d7a417a4e7a59314d7a59324e544d344e6a59324e4459784d7a597a4d6a4d354e6a497a4e444d794d7a517a4d544d784d7a41324e6a597a4d7a63324d6a59794d7a45324d7a4d324e6a497a4f4459794e5467304d44566c5a5467335a4455784f54566859544a6b5a546b344d3251795a546332597a6c6c4f54426a4d475a6c597a59794e32466d4f5449305a47457a4f5451334f44426b596a6c684f445a6d595467354e4463775a6a4a6c595755774d7a4d305a54646b4d6d49344e6a4177596a5a694e4445354e6a686c4d54526c596a4931596a52694f5759314e5451354d544e6a596a4a6a5a5441795a6d55784e4463794e444d345a544d785a6a426d63473168626e566862454e766332564c5a586c495a586834564745304d4445774d54417a4d6a63794d4441324d6a45314f4449775a574d345954526d4d4451314e4441335a4445784e4455334e6d5935593249774d7a45344d6d59315a474e68597a68685a574a6b4e4449794d6a497a4d6a45324f44517a4d6a51784f54426c4f5449334e7a67304d513d3d227d5d2c227369676e657273223a5b22616464723171397a337268336b37353436613038347676656530786576736d663737666a7466656171687a756375716672646732397a38307264616674343637303263656e6a37646a65706b6e61756e796b6e6e36707739653363716a78367373796333737937225d2c226d65746164617461223a7b22656e636f64696e67223a2275746638227d2c227369676e61626c655061796c6f6164223a22684770546157647559585231636d5578574561694153646e5957526b636d567a6331673541555552336a62314b36363839574d7a6c357373687450764a6b744f6567754c6d4f41534e71464645643432395375757650566a4d3565624c49625437795a4c546e6f4c69356a67456a61685146693555315242556941334d6a67794e5455304e534230627942685a4752794d584634646a6c6c4f5870774e545634646a4d324d48646e614777344d445a6b4d444a354d7a55344f546c36613274784d6e4a6f64475a34646a64344e6e6435593352714d6e6c795a6d64325a5849314e33557a4d446433624455324e7a566d636d64334d6a49355a485a784e546833613270325a58566b4e5856785a6d35746447563649444d7859545a69595749314d4745344e4749344e444d355957526a5a6d49334f445a69596a49774d6a426d4e6a67774e3255325a54686d5a4745324d6a6c694e4449304d5445775a6d4d33596d4978597a5a694f47493d227d';
        const coinConfig = { name: 'ada' } as BaseCoin;
        const factory = new MessageBuilderFactory(coinConfig);
        const builder = factory.fromBroadcastString(broadcastHex);
        const message = await builder.build();

        const payload = message.getPayload();
        const payloadParts = payload.split(' ');
        const address = message.getSigners()[0];
        address.should.equal(
          'addr1q9z3rh3k7546a084vvee0xevsmf77fjtfeaqhzucuqfrdg29z80rdaft46702cenj7djepknaunyknn6pw9e3cqjx6ssyc3sy7'
        );
        const destinationAddress = payloadParts[3];
        destinationAddress.should.equal(
          'addr1qxv9e9zp55xv360wghl806d02y35899zkkq2rhtfxv7x6wyctj2yrfgver57u307wl5675frgw229dvq58wkjveud5uqfnmtez'
        );
        const amount = Number(payloadParts[1]);
        amount.should.equal(72825545);

        const signature = message.getSignatures()[0].signature;
        const publicKeyHex = message.getSignatures()[0].publicKey.pub;
        publicKeyHex.should.equal('ec8a4f045407d114576f9cb03182f5dcac8aebd42222321684324190e9277841');

        const coseObjectsOutput = await bufferToCoseObjectsOutput(signature);
        const coseKey = coseObjectsOutput.manualCoseKeyHex;
        coseKey.should.equal('a4010103272006215820ec8a4f045407d114576f9cb03182f5dcac8aebd42222321684324190e9277841');
        const coseSign1 = coseObjectsOutput.manualCoseSign1Hex;
        coseSign1.should.equal(
          '845846a2012767616464726573735839014511de36f52baebcf56333979b2c86d3ef264b4e7a0b8b98e01236a14511de36f52baebcf56333979b2c86d3ef264b4e7a0b8b98e01236a1a166686173686564f458b95354415220373238323535343520746f2061646472317178763965397a70353578763336307767686c3830366430327933353839397a6b6b7132726874667876377836777963746a3279726667766572353775333037776c35363735667267773232396476713538776b6a76657564357571666e6d74657a203331613662616235306138346238343339616463666237383662623230323066363830376536653866646136323962343234313130666337626231633662386258405ee87d5195aa2de983d2e76c9e90c0fec627af924da394780db9a86fa89470f2eae0334e7d2b8600b6b41968e14eb25b4b9f554913cb2ce02fe1472438e31f0f'
        );
      });
    });
  });
});
