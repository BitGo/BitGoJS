import { BaseCoin } from '@bitgo-beta/statics';
import sinon from 'sinon';
import should from 'should';
import { BroadcastableMessage, MessageStandardType, SimpleMessage } from '@bitgo-beta/sdk-core';
import * as bs58 from 'bs58';
import { MessageBuilderFactory } from '../../../src';

describe('Solana SimpleMessageBuilder', function () {
  let sandbox: sinon.SinonSandbox;
  let factory: MessageBuilderFactory;
  const coinConfig = { name: 'tsol' } as BaseCoin;

  beforeEach(function () {
    sandbox = sinon.createSandbox();
    factory = new MessageBuilderFactory(coinConfig);
  });

  afterEach(function () {
    sandbox.restore();
  });

  describe('build', function () {
    it('should build a SimpleMessage with correct payload', async function () {
      const payload = 'Hello, Solana!';
      const builder = factory.getMessageBuilder(MessageStandardType.SIMPLE);
      builder.setPayload(payload);

      const message = await builder.build();
      should.exist(message);
      message.should.be.instanceof(SimpleMessage);
      should.equal(message.getType(), MessageStandardType.SIMPLE);
      should.equal(message.getPayload(), payload);
    });

    it('should build a SimpleMessage with signatures', async function () {
      const payload = 'Sign this message';
      const signatures = [
        {
          publicKey: { pub: 'solPubKey1' },
          signature: Buffer.from('solSignature1'),
        },
      ];

      const builder = factory.getMessageBuilder(MessageStandardType.SIMPLE);
      builder.setPayload(payload).setSignatures(signatures);

      const message = await builder.build();
      should.exist(message);
      should.equal(message.getPayload(), payload);
      should.deepEqual(message.getSignatures(), signatures);
    });

    it('should build a SimpleMessage with signers', async function () {
      const payload = 'Message with signers';
      const signers = ['solSigner1', 'solSigner2'];

      const builder = factory.getMessageBuilder(MessageStandardType.SIMPLE);
      builder.setPayload(payload).setSigners(signers);

      const message = await builder.build();
      should.exist(message);
      should.equal(message.getPayload(), payload);
      should.deepEqual(message.getSigners(), signers);
    });

    it('should build a SimpleMessage with metadata', async function () {
      const payload = 'Message with metadata';
      const metadata = { solNetwork: 'testnet', timestamp: 1625097600 };

      const builder = factory.getMessageBuilder(MessageStandardType.SIMPLE);
      builder.setPayload(payload).setMetadata(metadata);

      const message = await builder.build();
      should.exist(message);
      should.equal(message.getPayload(), payload);
      const messageMetadata = message.getMetadata();
      should.equal(messageMetadata?.solNetwork, metadata.solNetwork);
      should.equal(messageMetadata?.timestamp, metadata.timestamp);
    });

    it('should throw error when building without payload', async function () {
      const builder = factory.getMessageBuilder(MessageStandardType.SIMPLE);
      await should(builder.build()).be.rejectedWith('Message payload must be set before building the message');
    });
  });

  describe('getSignablePayload', function () {
    it('should return Buffer with correct payload', async function () {
      const payload = 'Signable Solana message';
      const builder = factory.getMessageBuilder(MessageStandardType.SIMPLE);
      builder.setPayload(payload);

      const message = await builder.build();
      const signablePayload = await message.getSignablePayload();

      should.exist(signablePayload);
      Buffer.isBuffer(signablePayload).should.be.true();
      signablePayload.toString().should.equal(payload);
    });
  });

  describe('toBroadcastFormat', function () {
    it('should convert SimpleMessage to broadcastable format', async function () {
      const payload = 'Broadcast me';
      const signers = ['solAddress1'];
      const signatures = [
        {
          publicKey: { pub: 'solPubKey1' },
          signature: Buffer.from('solSignature1'),
        },
      ];

      const builder = factory.getMessageBuilder(MessageStandardType.SIMPLE);
      builder.setPayload(payload).setSigners(signers).setSignatures(signatures);

      const message = await builder.build();
      const broadcastFormat = await message.toBroadcastFormat();

      should.exist(broadcastFormat);
      should.equal(broadcastFormat.type, MessageStandardType.SIMPLE);
      should.equal(broadcastFormat.payload, payload);
      should.deepEqual(broadcastFormat.signers, signers);
      should.exist(broadcastFormat.serializedSignatures);
      const serializedSignatures = broadcastFormat.serializedSignatures;
      should.equal(serializedSignatures?.length, 1);
      should.equal(serializedSignatures?.[0].publicKey, 'solPubKey1');
      should.equal(serializedSignatures?.[0].signature, Buffer.from('solSignature1').toString('base64'));
    });
  });

  describe('fromBroadcastFormat', function () {
    it('should rebuild message from broadcastable format', async function () {
      const broadcastMessage: BroadcastableMessage = {
        type: MessageStandardType.SIMPLE,
        payload: 'Solana test message',
        serializedSignatures: [
          {
            publicKey: 'solPubKey1',
            signature: Buffer.from('solSignature1').toString('base64'),
          },
        ],
        signers: ['solSigner1'],
        metadata: { network: 'testnet', encoding: 'utf8' },
      };

      const builder = factory.getMessageBuilder(MessageStandardType.SIMPLE);
      const message = await builder.fromBroadcastFormat(broadcastMessage);

      should.exist(message);
      should.equal(message.getType(), MessageStandardType.SIMPLE);
      should.equal(message.getPayload(), broadcastMessage.payload);
      should.deepEqual(message.getSigners(), broadcastMessage.signers);
      should.exist(message.getSignatures());
      should.equal(message.getSignatures().length, 1);
    });
  });

  describe('fromBroadcastString', function () {
    it('should parse broadcastable string and return correct builder type', async function () {
      const broadcastHex =
        '7b2274797065223a2253494d504c45222c227061796c6f6164223a2253544152203438373934363720746f2061646472317178763965397a70353578763336307767686c3830366430327933353839397a6b6b7132726874667876377836777963746a3279726667766572353775333037776c35363735667267773232396476713538776b6a76657564357571666e6d74657a2033316136626162353061383462383433396164636662373836626232303230663638303765366538666461363239623432343131306663376262316336623862222c2273657269616c697a65645369676e617475726573223a5b7b227075626c69634b6579223a22475a6d6a57464a543964556e70574e714a61626e524d7134747779714372396b584663337a4d4765506d6139222c227369676e6174757265223a22675235434446464f5242522f6756416b4b624a4635534d6f36495063674a376a6976694f2f7631535a7056514b6a67566e6f414f45695855614472656d6c4735516743775942725a6132486a547739386c65396e44673d3d227d5d2c227369676e657273223a5b22475a6d6a57464a543964556e70574e714a61626e524d7134747779714372396b584663337a4d4765506d6139225d2c226d65746164617461223a7b22656e636f64696e67223a2275746638227d2c227369676e61626c655061796c6f6164223a2255315242556941304f4463354e445933494852764947466b5a484978635868324f575535656e41314e5868324d7a59776432646f624467774e6d51774d6e6b7a4e5467354f58707261334579636d68305a6e68324e33673264336c6a64476f7965584a6d5a335a6c636a553364544d774e3364734e5459334e575a795a3363794d6a6c6b646e45314f486472616e5a6c645751316458466d626d31305a586f674d7a46684e6d4a68596a557759546730596a67304d7a6c685a474e6d596a63344e6d4a694d6a41794d4759324f4441335a545a6c4f475a6b595459794f5749304d6a51784d54426d597a6469596a466a4e6d493459673d3d227d';
      const coinConfig = { name: 'sol' } as BaseCoin;
      const factory = new MessageBuilderFactory(coinConfig);
      const builder = factory.fromBroadcastString(broadcastHex);
      const message = await builder.build();

      const payload = message.getPayload();
      const payloadParts = payload.split(' ');
      const address = message.getSigners()[0];
      address.should.equal('GZmjWFJT9dUnpWNqJabnRMq4twyqCr9kXFc3zMGePma9');
      const destinationAddress = payloadParts[3];
      destinationAddress.should.equal(
        'addr1qxv9e9zp55xv360wghl806d02y35899zkkq2rhtfxv7x6wyctj2yrfgver57u307wl5675frgw229dvq58wkjveud5uqfnmtez'
      );
      const amount = Number(payloadParts[1]);
      amount.should.equal(4879467);

      const signatureBuff = message.getSignatures()[0].signature;
      const signatureBase58 = bs58.encode(signatureBuff);
      signatureBase58.should.equal(
        '3aj7xDGJrFAbNF6GLrWTHpy8UW94i6xFADJ1KdomDLaCDjUyz8Gj5vPc5mZLduFhRAUCU4BUcnBWu5te1DbMXCFf'
      );
      const signatureHex = signatureBuff.toString('hex');
      signatureHex.should.equal(
        '811e420c514e44147f81502429b245e52328e883dc809ee38af88efefd526695502a38159e800e1225d4683ade9a51b94200b0601ad96b61e34f0f7c95ef670e'
      );
      const publicKeyHex = message.getSignatures()[0].publicKey.pub;
      publicKeyHex.should.equal('GZmjWFJT9dUnpWNqJabnRMq4twyqCr9kXFc3zMGePma9');
    });
  });
});
