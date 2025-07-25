import { BaseCoin } from '@bitgo/statics';
import sinon from 'sinon';
import should from 'should';
import { BroadcastableMessage, MessageStandardType, serializeSignatures } from '../../../../../src';
import { TestMessageBuilder } from './fixtures';

describe('Base Message Builder', () => {
  let builder: TestMessageBuilder;
  let mockCoinConfig: sinon.SinonStubbedInstance<BaseCoin>;

  beforeEach(() => {
    mockCoinConfig = sinon.createStubInstance(BaseCoin);
    builder = new TestMessageBuilder(mockCoinConfig as unknown as BaseCoin, MessageStandardType.EIP191);
  });

  it('should initialize with default values', () => {
    should.equal(builder.getPayload(), '');
    should.equal(builder.getType(), MessageStandardType.EIP191);
    should.deepEqual(builder.getSignatures(), []);
    should.deepEqual(builder.getSigners(), []);
    should.deepEqual(builder.getMetadata(), {});
    should.equal(builder.getDigest(), undefined);
  });

  it('should set and get payload', () => {
    const payload = 'test payload';
    builder.setPayload(payload);
    should.equal(builder.getPayload(), payload);
  });

  it('should set and get metadata', () => {
    const metadata = { key: 'value', num: 123 };
    builder.setMetadata(metadata);
    should.deepEqual(builder.getMetadata(), metadata);
  });

  it('should set and get type', () => {
    const type = MessageStandardType.UNKNOWN;
    builder.setType(type);
    should.equal(builder.getType(), type);
  });

  it('should set and get signatures', () => {
    const signatures = [
      {
        publicKey: { pub: 'pubKey1' },
        signature: Buffer.from('sig1'),
      },
      {
        publicKey: { pub: 'pubKey2' },
        signature: Buffer.from('sig2'),
      },
      {
        publicKey: { pub: 'pubKey3' },
        signature: Buffer.from('sig3'),
      },
    ];
    builder.setSignatures(signatures);
    should.deepEqual(builder.getSignatures(), signatures);
  });

  it('should set and get signers', () => {
    const signers = ['address1', 'address2', 'address3'];
    builder.setSigners(signers);
    should.deepEqual(builder.getSigners(), signers);
  });

  it('should set and get digest', () => {
    const digest = '0x1234abcd';
    builder.setDigest(digest);
    should.equal(builder.getDigest(), digest);
  });

  it('should build a message with the correct properties', async () => {
    const payload = 'test message';
    const metadata = { foo: 'bar', encoding: 'utf8' };
    const signatures = [
      {
        publicKey: { pub: 'pubKey1' },
        signature: Buffer.from('sig1'),
      },
      {
        publicKey: { pub: 'pubKey2' },
        signature: Buffer.from('sig2'),
      },
    ];
    const signers = ['addr1', 'addr2'];

    builder
      .setType(MessageStandardType.EIP191)
      .setPayload(payload)
      .setMetadata(metadata)
      .setSignatures(signatures)
      .setSigners(signers);

    const message = await builder.build();

    should.equal(message.getType(), MessageStandardType.EIP191);
    should.equal(message.getPayload(), payload);
    should.deepEqual(message.getMetadata(), metadata);
    should.deepEqual(message.getSignatures(), signatures);
    should.deepEqual(message.getSigners(), signers);

    const signablePayload = await message.getSignablePayload();
    should.deepEqual(signablePayload, Buffer.from(payload));
  });

  it('should correctly handle toBroadcastFormat', async () => {
    const payload = 'hello world';
    const metadata = { version: '1.0', encoding: 'utf8' };
    const signatures = [
      {
        publicKey: { pub: 'pubKey1' },
        signature: Buffer.from('sig1'),
      },
    ];
    const signers = ['addr1'];

    builder
      .setType(MessageStandardType.EIP191)
      .setPayload(payload)
      .setMetadata(metadata)
      .setSignatures(signatures)
      .setSigners(signers);

    const message = await builder.build();
    const broadcastFormat = await message.toBroadcastFormat();
    const expectedBroadcastFormat: BroadcastableMessage = {
      type: MessageStandardType.EIP191,
      payload: payload,
      serializedSignatures: serializeSignatures(signatures),
      signers: signers,
      metadata: metadata,
      signablePayload: 'aGVsbG8gd29ybGQ=',
    };

    should.deepEqual(broadcastFormat, expectedBroadcastFormat);
  });

  it('should correctly handle fromBroadcastFormat', async () => {
    const broadcastMessage = {
      type: MessageStandardType.EIP191,
      payload: 'broadcast test',
      signatures: [
        {
          publicKey: { pub: 'pubKey1' },
          signature: Buffer.from('sig1'),
        },
        {
          publicKey: { pub: 'pubKey2' },
          signature: Buffer.from('sig2'),
        },
      ],
      signers: ['addr1', 'addr2'],
      metadata: { chainId: 1, encoding: 'utf8' },
    };

    const message = await builder.fromBroadcastFormat(broadcastMessage);

    should.equal(message.getType(), broadcastMessage.type);
    should.equal(message.getPayload(), broadcastMessage.payload);
    should.deepEqual(message.getSignatures(), broadcastMessage.signatures);
    should.deepEqual(message.getSigners(), broadcastMessage.signers);
    should.deepEqual(message.getMetadata(), broadcastMessage.metadata);
  });

  it('should correctly handle toBroadcastString', async () => {
    const payload = 'serialize me';
    const signatures = [
      {
        publicKey: { pub: 'pubKey1' },
        signature: Buffer.from('sig1'),
      },
    ];
    const signers = ['addr1'];

    builder.setType(MessageStandardType.EIP191).setPayload(payload).setSignatures(signatures).setSigners(signers);

    const message = await builder.build();
    const broadcastHex = await message.toBroadcastString();

    const expectedJson = JSON.stringify({
      type: MessageStandardType.EIP191,
      payload: payload,
      serializedSignatures: serializeSignatures(signatures),
      signers: signers,
      metadata: { encoding: 'utf8' },
      signablePayload: 'c2VyaWFsaXplIG1l',
    });
    const expectedHex = Buffer.from(expectedJson).toString('hex');

    should.equal(broadcastHex, expectedHex);
  });
});
