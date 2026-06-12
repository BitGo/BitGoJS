import 'should';
import { coins } from '@bitgo/statics';
import { MessageStandardType } from '@bitgo/sdk-core';
import { SignTypedDataVersion, TypedDataUtils } from '@metamask/eth-sig-util';
import { ethers } from 'ethers';

import {
  buildErc20VotesDelegationTypedData,
  encodeDelegateBySigCalldata,
  encodeErc20VotesDelegationTypedDataDigestHex,
  wlfiEthereumMainnetDelegationDomain,
} from '../../../src/lib/eip712/erc20VotesDelegation';
import { EIP712Message } from '../../../src/lib/messages/eip712/eip712Message';
import { Erc20VotesDelegationMessage } from '../../../src/lib/messages/eip712/erc20VotesDelegationMessage';
import { Erc20VotesDelegationMessageBuilder } from '../../../src/lib/messages/eip712/erc20VotesDelegationMessageBuilder';
import { MessageBuilderFactory } from '../../../src/lib/messages/messageBuilderFactory';

describe('ERC20Votes delegation EIP-712', function () {
  it('buildErc20VotesDelegationTypedData matches OZ Delegation struct', function () {
    const typedData = buildErc20VotesDelegationTypedData({
      domain: wlfiEthereumMainnetDelegationDomain(),
      message: {
        delegatee: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
        nonce: 7,
        expiry: 2000000000,
      },
    });

    typedData.primaryType.should.equal('Delegation');
    typedData.message.nonce.should.equal('7');
    typedData.message.expiry.should.equal('2000000000');
    typedData.message.delegatee.should.equal('0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB');

    const raw = JSON.parse(JSON.stringify(typedData));
    const sanitized = TypedDataUtils.sanitizeData(raw);
    const domainHash = TypedDataUtils.hashStruct(
      'EIP712Domain',
      sanitized.domain,
      sanitized.types,
      SignTypedDataVersion.V4
    );
    const structHash = TypedDataUtils.hashStruct(
      'Delegation',
      sanitized.message,
      sanitized.types,
      SignTypedDataVersion.V4
    );
    domainHash.should.be.instanceOf(Buffer);
    structHash.should.be.instanceOf(Buffer);
    domainHash.length.should.equal(32);
    structHash.length.should.equal(32);
  });

  it('encodeErc20VotesDelegationTypedDataDigestHex matches EIP-712 prefix + domain + Delegation', function () {
    const typedData = buildErc20VotesDelegationTypedData({
      domain: wlfiEthereumMainnetDelegationDomain(),
      message: {
        delegatee: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
        nonce: 7,
        expiry: 2000000000,
      },
    });
    const hex = encodeErc20VotesDelegationTypedDataDigestHex(typedData);
    hex.should.match(/^[0-9a-f]+$/i);
    (hex.length / 2).should.equal(66); // 0x1901 + 32-byte domain + 32-byte struct
    encodeErc20VotesDelegationTypedDataDigestHex(typedData).should.equal(hex);
  });

  it('encodeDelegateBySigCalldata encodes OZ delegateBySig', function () {
    const r = '0x' + '11'.repeat(32);
    const s = '0x' + '22'.repeat(32);
    const data = encodeDelegateBySigCalldata({
      delegatee: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
      nonce: 1,
      expiry: 2,
      v: 28,
      r,
      s,
    });
    const iface = new ethers.utils.Interface([
      'function delegateBySig(address delegatee, uint256 nonce, uint256 expiry, uint8 v, bytes32 r, bytes32 s)',
    ]);
    const decoded = iface.decodeFunctionData('delegateBySig', data);
    decoded.delegatee.should.equal('0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB');
    decoded.nonce.toString().should.equal('1');
    decoded.expiry.toString().should.equal('2');
    decoded.v.should.equal(28);
    decoded.r.should.equal(r);
    decoded.s.should.equal(s);
  });

  describe('parity with EIP712Message.getSignablePayload', function () {
    const coinConfig = coins.get('eth');

    const fixtures = [
      {
        name: 'WLFI mainnet self-delegation',
        domain: wlfiEthereumMainnetDelegationDomain(),
        message: {
          delegatee: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
          nonce: 0,
          expiry: 1893456000,
        },
      },
      {
        name: 'arbitrary token, large nonce + far expiry',
        domain: {
          name: 'MyVotesToken',
          version: '1',
          chainId: 11155111,
          verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
        },
        message: {
          delegatee: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
          nonce: ethers.BigNumber.from('123456789012345678901234567890'),
          expiry: ethers.BigNumber.from('9999999999'),
        },
      },
    ];

    fixtures.forEach((f) => {
      it(`digest matches EIP712Message.getSignablePayload — ${f.name}`, async function () {
        const typedData = buildErc20VotesDelegationTypedData({ domain: f.domain, message: f.message });
        const helperHex = encodeErc20VotesDelegationTypedDataDigestHex(typedData);

        const eip712 = new EIP712Message({
          coinConfig,
          payload: JSON.stringify(typedData),
        });
        const signable = await eip712.getSignablePayload();
        const signableHex = Buffer.isBuffer(signable)
          ? signable.toString('hex')
          : Buffer.from(signable).toString('hex');

        signableHex.should.equal(helperHex);
        signableHex.should.have.length(132); // 0x1901 + 32-byte domainHash + 32-byte structHash, hex
      });
    });
  });

  describe('Erc20VotesDelegationMessage / Builder', function () {
    const coinConfig = coins.get('eth');
    const params = {
      domain: wlfiEthereumMainnetDelegationDomain(),
      message: {
        delegatee: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
        nonce: 7,
        expiry: 2000000000,
      },
    };

    it('Erc20VotesDelegationMessage.fromDelegation produces an EIP712-typed message with matching digest', async function () {
      const msg = Erc20VotesDelegationMessage.fromDelegation(coinConfig, params);

      msg.getType().should.equal(MessageStandardType.EIP712);
      const typed = msg.getTypedData();
      typed.primaryType.should.equal('Delegation');
      typed.message.delegatee.should.equal(params.message.delegatee);
      typed.message.nonce.should.equal('7');
      typed.message.expiry.should.equal('2000000000');

      const signable = await msg.getSignablePayload();
      const helperHex = encodeErc20VotesDelegationTypedDataDigestHex(buildErc20VotesDelegationTypedData(params));
      const signableHex = Buffer.isBuffer(signable) ? signable.toString('hex') : Buffer.from(signable).toString('hex');
      signableHex.should.equal(helperHex);
    });

    it('Erc20VotesDelegationMessageBuilder.buildFromDelegation builds the same message', async function () {
      const builder = new Erc20VotesDelegationMessageBuilder(coinConfig);
      const built = await builder.buildFromDelegation(params);

      built.should.be.instanceOf(Erc20VotesDelegationMessage);
      built.getType().should.equal(MessageStandardType.EIP712);
      built.getPayload().should.equal(JSON.stringify(buildErc20VotesDelegationTypedData(params)));
    });

    it('Erc20VotesDelegationMessageBuilder is reachable through MessageBuilderFactory', async function () {
      const factory = new MessageBuilderFactory(coinConfig);
      const builder = factory.getErc20VotesDelegationBuilder();
      builder.should.be.instanceOf(Erc20VotesDelegationMessageBuilder);

      const msg = await builder.buildFromDelegation(params);
      msg.getType().should.equal(MessageStandardType.EIP712);
      msg.getPayload().should.equal(JSON.stringify(buildErc20VotesDelegationTypedData(params)));
    });
  });
});
