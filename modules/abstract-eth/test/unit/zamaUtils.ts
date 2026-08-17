import should from 'should';
import EthereumAbi from 'ethereumjs-abi';
import {
  buildApproveCalldata,
  buildWrapCalldata,
  decodeWrapCalldata,
  buildDelegationCalldata,
  buildMulticallDelegationCalldata,
  buildConfidentialTransferByHandleCalldata,
  buildFlushERC7984ForwarderTokenCalldata,
  decodeFlushERC7984ForwarderTokenCalldata,
  wrapInCallFromParent,
  approveMethodId,
  wrapMethodId,
  UINT64_MAX,
  delegateForUserDecryptionMethodId,
  aclMulticallMethodId,
  callFromParentMethodId,
} from '../../src/lib/zamaUtils';
import { confidentialTransferNoProofMethodId } from '../../src/lib/walletUtil';

describe('Zama Utils', () => {
  const ACL_ADDRESS = '0xf0Ffdc93b7E186bC2f8CB3dAA75D86d1930A433D';
  const DELEGATE_ADDRESS = '0x1111111111111111111111111111111111111111';
  const TOKEN_ADDRESS = '0x94167129172A35ab093B44b8b96213DDbc3cD387';
  const TOKEN_ADDRESS_2 = '0x4E7B06D78965594eB5EF5414c357ca21E1554491';
  const TOKEN_ADDRESS_3 = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
  const FORWARDER_ADDRESS = '0xDeADbeefdEAdbeefdEadbEEFdeadbeEFdEaDbeeF';
  // Hoodi hteth:cusdt wrapper (spender for exact-amount approve)
  const WRAPPER_ADDRESS = '0x2debbe0487ef921df4457f9e36ed05be2df1ac75';
  const EXPIRY = Math.floor(Date.now() / 1000) + 365 * 86400;

  // Helper: decode a delegateForUserDecryption call
  function decodeDelegationCall(calldata: string): [string, string, number] {
    const payload = Buffer.from(calldata.slice(10), 'hex');
    const decoded = EthereumAbi.rawDecode(['address', 'address', 'uint64'], payload);
    return [(decoded[0] as Buffer).toString('hex'), (decoded[1] as Buffer).toString('hex'), Number(decoded[2])];
  }

  // -------------------------------------------------------------------------
  describe('Method IDs', () => {
    it('should have correct selector for delegateForUserDecryption(address,address,uint64)', () => {
      delegateForUserDecryptionMethodId.should.equal('0x04f61a95');
    });

    it('should have correct selector for multicall(bytes[])', () => {
      aclMulticallMethodId.should.equal('0xac9650d8');
    });

    it('should have correct selector for callFromParent(address,uint256,bytes)', () => {
      callFromParentMethodId.should.equal('0x77e60b35');
    });

    it('should have correct selector for approve(address,uint256)', () => {
      approveMethodId.should.equal('0x095ea7b3');
    });

    it('should have correct selector for wrap(address,uint256)', () => {
      wrapMethodId.should.equal('0xbf376c7a');
    });

    it('method IDs should all be distinct', () => {
      const ids = new Set([
        delegateForUserDecryptionMethodId,
        aclMulticallMethodId,
        callFromParentMethodId,
        approveMethodId,
        wrapMethodId,
      ]);
      ids.size.should.equal(5);
    });
  });

  // -------------------------------------------------------------------------
  describe('buildApproveCalldata', () => {
    const EXACT_AMOUNT = '1000000'; // 1 USDT (6 decimals)

    describe('output format', () => {
      it('should produce a 0x-prefixed hex string', () => {
        const calldata = buildApproveCalldata(WRAPPER_ADDRESS, EXACT_AMOUNT);
        calldata.should.be.a.String();
        calldata.should.startWith('0x');
      });

      it('should have exact length: 4-byte selector + 2 × 32-byte ABI words = 68 bytes (138 chars)', () => {
        const calldata = buildApproveCalldata(WRAPPER_ADDRESS, EXACT_AMOUNT);
        calldata.length.should.equal(138); // '0x' + 136 hex chars
      });

      it('should start with approve selector 0x095ea7b3', () => {
        const calldata = buildApproveCalldata(WRAPPER_ADDRESS, EXACT_AMOUNT);
        calldata.slice(0, 10).should.equal(approveMethodId);
        calldata.slice(0, 10).should.equal('0x095ea7b3');
      });
    });

    describe('ABI parameter encoding', () => {
      it('should encode wrapper as spender in the first ABI word', () => {
        const calldata = buildApproveCalldata(WRAPPER_ADDRESS, EXACT_AMOUNT);
        const word1 = calldata.slice(10, 74);
        word1.should.equal(WRAPPER_ADDRESS.slice(2).toLowerCase().padStart(64, '0'));
      });

      it('should encode exact amount in the second ABI word', () => {
        const calldata = buildApproveCalldata(WRAPPER_ADDRESS, EXACT_AMOUNT);
        const word2 = calldata.slice(74, 138);
        word2.should.equal(BigInt(EXACT_AMOUNT).toString(16).padStart(64, '0'));
      });

      it('should encode approve(0) reset when amount is 0', () => {
        const calldata = buildApproveCalldata(WRAPPER_ADDRESS, 0);
        calldata.slice(0, 10).should.equal(approveMethodId);
        calldata.slice(74, 138).should.equal('0'.repeat(64));
      });

      it('should accept amount as bigint', () => {
        const calldata = buildApproveCalldata(WRAPPER_ADDRESS, 1000000n);
        calldata.slice(74, 138).should.equal(BigInt(EXACT_AMOUNT).toString(16).padStart(64, '0'));
      });

      it('should accept amount as number', () => {
        const calldata = buildApproveCalldata(WRAPPER_ADDRESS, 1000000);
        calldata.slice(74, 138).should.equal(BigInt(EXACT_AMOUNT).toString(16).padStart(64, '0'));
      });
    });

    describe('validation', () => {
      it('should reject an invalid wrapper address', () => {
        (() => buildApproveCalldata('not-an-address', EXACT_AMOUNT)).should.throw(/invalid wrapper address/);
      });

      it('should reject a bad EIP-55 checksum', () => {
        // Mixed case that does not match the correct checksum
        const badChecksum = '0x2Debbe0487ef921df4457f9e36ed05be2df1ac75';
        (() => buildApproveCalldata(badChecksum, EXACT_AMOUNT)).should.throw(/invalid wrapper address/);
      });

      it('should accept all-lowercase addresses', () => {
        const calldata = buildApproveCalldata(WRAPPER_ADDRESS.toLowerCase(), EXACT_AMOUNT);
        calldata.slice(0, 10).should.equal(approveMethodId);
      });

      it('should reject a negative amount', () => {
        (() => buildApproveCalldata(WRAPPER_ADDRESS, -1)).should.throw(/amount must be >= 0/);
      });

      it('should reject a non-numeric amount string', () => {
        (() => buildApproveCalldata(WRAPPER_ADDRESS, 'abc')).should.throw(/invalid amount/);
      });
    });
  });

  // -------------------------------------------------------------------------
  describe('buildWrapCalldata', () => {
    const RECIPIENT = '0x1111111111111111111111111111111111111111';
    const EXACT_AMOUNT = '1000000';
    const RATE_ONE = '1';
    const RATE_1E12 = '1000000000000'; // hteth:ctest1

    describe('output format', () => {
      it('should produce a 0x-prefixed hex string', () => {
        const calldata = buildWrapCalldata(RECIPIENT, EXACT_AMOUNT, RATE_ONE);
        calldata.should.be.a.String();
        calldata.should.startWith('0x');
      });

      it('should have exact length: 4-byte selector + 2 × 32-byte ABI words = 68 bytes (138 chars)', () => {
        const calldata = buildWrapCalldata(RECIPIENT, EXACT_AMOUNT, RATE_ONE);
        calldata.length.should.equal(138);
      });

      it('should start with wrap selector 0xbf376c7a', () => {
        const calldata = buildWrapCalldata(RECIPIENT, EXACT_AMOUNT, RATE_ONE);
        calldata.slice(0, 10).should.equal(wrapMethodId);
        calldata.slice(0, 10).should.equal('0xbf376c7a');
      });
    });

    describe('ABI parameter encoding', () => {
      it('should encode recipient in the first ABI word', () => {
        const calldata = buildWrapCalldata(RECIPIENT, EXACT_AMOUNT, RATE_ONE);
        const word1 = calldata.slice(10, 74);
        word1.should.equal(RECIPIENT.slice(2).toLowerCase().padStart(64, '0'));
      });

      it('should encode amount in the second ABI word', () => {
        const calldata = buildWrapCalldata(RECIPIENT, EXACT_AMOUNT, RATE_ONE);
        const word2 = calldata.slice(74, 138);
        word2.should.equal(BigInt(EXACT_AMOUNT).toString(16).padStart(64, '0'));
      });

      it('should round-trip through decodeWrapCalldata', () => {
        const calldata = buildWrapCalldata(RECIPIENT, EXACT_AMOUNT, RATE_ONE);
        const decoded = decodeWrapCalldata(calldata);
        decoded.to.toLowerCase().should.equal(RECIPIENT.toLowerCase());
        decoded.amount.should.equal(EXACT_AMOUNT);
      });
    });

    describe('validation', () => {
      it('should reject an invalid to address', () => {
        (() => buildWrapCalldata('not-an-address', EXACT_AMOUNT, RATE_ONE)).should.throw(/invalid to address/);
      });

      it('should reject a bad EIP-55 checksum', () => {
        // Mixed case that does not match the correct checksum (same pattern as approve tests)
        const badChecksum = '0x2Debbe0487ef921df4457f9e36ed05be2df1ac75';
        (() => buildWrapCalldata(badChecksum, EXACT_AMOUNT, RATE_ONE)).should.throw(/invalid to address/);
      });

      it('should reject amount 0', () => {
        (() => buildWrapCalldata(RECIPIENT, 0, RATE_ONE)).should.throw(/amount must be > 0/);
      });

      it('should reject a negative amount', () => {
        (() => buildWrapCalldata(RECIPIENT, -1, RATE_ONE)).should.throw(/amount must be > 0/);
      });

      it('should reject when amount × rate exceeds uint64', () => {
        // UINT64_MAX / 1e12 + 1 overflows for ctest1-style rate
        const tooLarge = (UINT64_MAX / BigInt(RATE_1E12) + 1n).toString();
        (() => buildWrapCalldata(RECIPIENT, tooLarge, RATE_1E12)).should.throw(/exceeds uint64/);
      });

      it('should accept amount × rate that fits uint64 for rate 1e12', () => {
        const ok = (UINT64_MAX / BigInt(RATE_1E12)).toString();
        const calldata = buildWrapCalldata(RECIPIENT, ok, RATE_1E12);
        calldata.slice(0, 10).should.equal(wrapMethodId);
      });

      it('should encode without rate when rate is omitted (deserialize path)', () => {
        const calldata = buildWrapCalldata(RECIPIENT, EXACT_AMOUNT);
        calldata.slice(0, 10).should.equal(wrapMethodId);
      });
    });
  });

  // -------------------------------------------------------------------------
  describe('buildDelegationCalldata', () => {
    describe('output format', () => {
      it('should produce a 0x-prefixed hex string', () => {
        const calldata = buildDelegationCalldata(DELEGATE_ADDRESS, TOKEN_ADDRESS, EXPIRY);
        calldata.should.be.a.String();
        calldata.should.startWith('0x');
      });

      it('should have exact length: 4-byte selector + 3 × 32-byte ABI words = 100 bytes (202 chars)', () => {
        const calldata = buildDelegationCalldata(DELEGATE_ADDRESS, TOKEN_ADDRESS, EXPIRY);
        calldata.length.should.equal(202); // '0x' + 200 hex chars
      });

      it('should start with delegateForUserDecryption selector', () => {
        const calldata = buildDelegationCalldata(DELEGATE_ADDRESS, TOKEN_ADDRESS, EXPIRY);
        calldata.slice(0, 10).should.equal(delegateForUserDecryptionMethodId);
      });
    });

    describe('ABI parameter encoding — position and value', () => {
      it('should encode delegate address as first ABI word (bytes 4–35)', () => {
        const calldata = buildDelegationCalldata(DELEGATE_ADDRESS, TOKEN_ADDRESS, EXPIRY);
        // First 32-byte word after 4-byte selector = hex chars 10–74
        const word1 = calldata.slice(10, 74);
        word1.should.equal(DELEGATE_ADDRESS.slice(2).toLowerCase().padStart(64, '0'));
      });

      it('should encode token address as second ABI word (bytes 36–67)', () => {
        const calldata = buildDelegationCalldata(DELEGATE_ADDRESS, TOKEN_ADDRESS, EXPIRY);
        const word2 = calldata.slice(74, 138);
        word2.should.equal(TOKEN_ADDRESS.slice(2).toLowerCase().padStart(64, '0'));
      });

      it('should encode expiry timestamp as third ABI word (bytes 68–99)', () => {
        const calldata = buildDelegationCalldata(DELEGATE_ADDRESS, TOKEN_ADDRESS, EXPIRY);
        const word3 = calldata.slice(138, 202);
        const encodedExpiry = EXPIRY.toString(16).padStart(64, '0');
        word3.should.equal(encodedExpiry);
      });

      it('should round-trip decode to original parameters', () => {
        const calldata = buildDelegationCalldata(DELEGATE_ADDRESS, TOKEN_ADDRESS, EXPIRY);
        const [delegate, token, expiry] = decodeDelegationCall(calldata);
        delegate.should.equal(DELEGATE_ADDRESS.slice(2).toLowerCase());
        token.should.equal(TOKEN_ADDRESS.slice(2).toLowerCase());
        expiry.should.equal(EXPIRY);
      });
    });

    describe('parameter isolation', () => {
      it('different delegate addresses should produce different calldata', () => {
        const DELEGATE_2 = '0x2222222222222222222222222222222222222222';
        const c1 = buildDelegationCalldata(DELEGATE_ADDRESS, TOKEN_ADDRESS, EXPIRY);
        const c2 = buildDelegationCalldata(DELEGATE_2, TOKEN_ADDRESS, EXPIRY);
        c1.should.not.equal(c2);
        // Only first word differs
        c1.slice(10, 74).should.not.equal(c2.slice(10, 74));
        c1.slice(74).should.equal(c2.slice(74)); // token and expiry unchanged
      });

      it('different token addresses should produce different calldata', () => {
        const c1 = buildDelegationCalldata(DELEGATE_ADDRESS, TOKEN_ADDRESS, EXPIRY);
        const c2 = buildDelegationCalldata(DELEGATE_ADDRESS, TOKEN_ADDRESS_2, EXPIRY);
        c1.should.not.equal(c2);
        // Only second word differs
        c1.slice(10, 74).should.equal(c2.slice(10, 74)); // delegate unchanged
        c1.slice(74, 138).should.not.equal(c2.slice(74, 138));
        c1.slice(138).should.equal(c2.slice(138)); // expiry unchanged
      });

      it('different expiry timestamps should produce different calldata', () => {
        const c1 = buildDelegationCalldata(DELEGATE_ADDRESS, TOKEN_ADDRESS, EXPIRY);
        const c2 = buildDelegationCalldata(DELEGATE_ADDRESS, TOKEN_ADDRESS, EXPIRY + 86400);
        c1.should.not.equal(c2);
        // Only third word differs
        c1.slice(10, 138).should.equal(c2.slice(10, 138)); // delegate + token unchanged
        c1.slice(138).should.not.equal(c2.slice(138));
      });
    });

    describe('address case handling', () => {
      it('should normalise checksummed (mixed-case) addresses to lowercase in encoding', () => {
        // TOKEN_ADDRESS_3 is EIP-55 checksummed: 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48
        const calldata = buildDelegationCalldata(DELEGATE_ADDRESS, TOKEN_ADDRESS_3, EXPIRY);
        const word2 = calldata.slice(74, 138);
        word2.should.equal(TOKEN_ADDRESS_3.slice(2).toLowerCase().padStart(64, '0'));
      });
    });
  });

  // -------------------------------------------------------------------------
  describe('buildMulticallDelegationCalldata', () => {
    describe('output format', () => {
      it('should produce a 0x-prefixed hex string', () => {
        const calldata = buildMulticallDelegationCalldata(DELEGATE_ADDRESS, [TOKEN_ADDRESS], EXPIRY);
        calldata.should.be.a.String();
        calldata.should.startWith('0x');
      });

      it('should start with multicall selector', () => {
        const calldata = buildMulticallDelegationCalldata(DELEGATE_ADDRESS, [TOKEN_ADDRESS], EXPIRY);
        calldata.slice(0, 10).should.equal(aclMulticallMethodId);
      });
    });

    describe('inner call correctness', () => {
      // Strategy: build expected inner calls independently, then verify they are
      // embedded in the multicall payload. This avoids decoding the complex bytes[]
      // ABI structure and directly verifies what matters: the right calls are present.

      it('should contain the expected inner delegation call for each token', () => {
        const inner1 = buildDelegationCalldata(DELEGATE_ADDRESS, TOKEN_ADDRESS, EXPIRY).slice(2);
        const inner2 = buildDelegationCalldata(DELEGATE_ADDRESS, TOKEN_ADDRESS_2, EXPIRY).slice(2);
        const inner3 = buildDelegationCalldata(DELEGATE_ADDRESS, TOKEN_ADDRESS_3, EXPIRY).slice(2);

        const calldata = buildMulticallDelegationCalldata(
          DELEGATE_ADDRESS,
          [TOKEN_ADDRESS, TOKEN_ADDRESS_2, TOKEN_ADDRESS_3],
          EXPIRY
        );

        calldata.should.containEql(inner1);
        calldata.should.containEql(inner2);
        calldata.should.containEql(inner3);
      });

      it('single-token multicall should contain its inner call but not others', () => {
        const inner1 = buildDelegationCalldata(DELEGATE_ADDRESS, TOKEN_ADDRESS, EXPIRY).slice(2);
        const inner2 = buildDelegationCalldata(DELEGATE_ADDRESS, TOKEN_ADDRESS_2, EXPIRY).slice(2);

        const single = buildMulticallDelegationCalldata(DELEGATE_ADDRESS, [TOKEN_ADDRESS], EXPIRY);

        single.should.containEql(inner1);
        single.should.not.containEql(inner2);
      });

      it('each inner call should start with delegateForUserDecryption selector', () => {
        const tokens = [TOKEN_ADDRESS, TOKEN_ADDRESS_2, TOKEN_ADDRESS_3];
        const calldata = buildMulticallDelegationCalldata(DELEGATE_ADDRESS, tokens, EXPIRY);

        for (const token of tokens) {
          const expectedInner = buildDelegationCalldata(DELEGATE_ADDRESS, token, EXPIRY).slice(2);
          // Each inner call starts with delegateForUserDecryption selector
          expectedInner.should.startWith(delegateForUserDecryptionMethodId.slice(2));
          calldata.should.containEql(expectedInner);
        }
      });

      it('different expiry timestamps change all inner calls', () => {
        const c1 = buildMulticallDelegationCalldata(DELEGATE_ADDRESS, [TOKEN_ADDRESS, TOKEN_ADDRESS_2], EXPIRY);
        const c2 = buildMulticallDelegationCalldata(DELEGATE_ADDRESS, [TOKEN_ADDRESS, TOKEN_ADDRESS_2], EXPIRY + 86400);

        // Inner calls with old expiry should NOT appear in the new multicall
        const inner1Old = buildDelegationCalldata(DELEGATE_ADDRESS, TOKEN_ADDRESS, EXPIRY).slice(2);
        c2.should.not.containEql(inner1Old);

        // And vice versa
        const inner1New = buildDelegationCalldata(DELEGATE_ADDRESS, TOKEN_ADDRESS, EXPIRY + 86400).slice(2);
        c1.should.not.containEql(inner1New);
      });

      it('should produce longer calldata for more tokens', () => {
        const single = buildMulticallDelegationCalldata(DELEGATE_ADDRESS, [TOKEN_ADDRESS], EXPIRY);
        const double = buildMulticallDelegationCalldata(DELEGATE_ADDRESS, [TOKEN_ADDRESS, TOKEN_ADDRESS_2], EXPIRY);
        const triple = buildMulticallDelegationCalldata(
          DELEGATE_ADDRESS,
          [TOKEN_ADDRESS, TOKEN_ADDRESS_2, TOKEN_ADDRESS_3],
          EXPIRY
        );
        double.length.should.be.greaterThan(single.length);
        triple.length.should.be.greaterThan(double.length);
      });

      it('different token orderings should produce different calldata', () => {
        const c1 = buildMulticallDelegationCalldata(DELEGATE_ADDRESS, [TOKEN_ADDRESS, TOKEN_ADDRESS_2], EXPIRY);
        const c2 = buildMulticallDelegationCalldata(DELEGATE_ADDRESS, [TOKEN_ADDRESS_2, TOKEN_ADDRESS], EXPIRY);
        c1.should.not.equal(c2);
      });
    });

    describe('error handling', () => {
      it('should throw when given an empty token array', () => {
        should.throws(
          () => buildMulticallDelegationCalldata(DELEGATE_ADDRESS, [], EXPIRY),
          /tokenContractAddresses must not be empty/
        );
      });
    });
  });

  // -------------------------------------------------------------------------
  describe('wrapInCallFromParent', () => {
    describe('output format', () => {
      it('should produce a 0x-prefixed hex string', () => {
        const inner = buildDelegationCalldata(DELEGATE_ADDRESS, TOKEN_ADDRESS, EXPIRY);
        const wrapped = wrapInCallFromParent(ACL_ADDRESS, inner);
        wrapped.should.be.a.String();
        wrapped.should.startWith('0x');
      });

      it('should start with callFromParent selector', () => {
        const inner = buildDelegationCalldata(DELEGATE_ADDRESS, TOKEN_ADDRESS, EXPIRY);
        const wrapped = wrapInCallFromParent(ACL_ADDRESS, inner);
        wrapped.slice(0, 10).should.equal(callFromParentMethodId);
      });

      it('should produce longer calldata than the inner calldata', () => {
        const inner = buildDelegationCalldata(DELEGATE_ADDRESS, TOKEN_ADDRESS, EXPIRY);
        const wrapped = wrapInCallFromParent(FORWARDER_ADDRESS, inner);
        wrapped.length.should.be.greaterThan(inner.length);
      });
    });

    describe('ABI parameter decoding', () => {
      it('should decode target address correctly', () => {
        const inner = buildDelegationCalldata(DELEGATE_ADDRESS, TOKEN_ADDRESS, EXPIRY);
        const wrapped = wrapInCallFromParent(ACL_ADDRESS, inner);
        const payload = Buffer.from(wrapped.slice(10), 'hex');
        const [target] = EthereumAbi.rawDecode(['address', 'uint256', 'bytes'], payload);
        (target as Buffer).toString('hex').should.equal(ACL_ADDRESS.slice(2).toLowerCase());
      });

      it('should encode value as 0 (no ETH transfer)', () => {
        const inner = buildDelegationCalldata(DELEGATE_ADDRESS, TOKEN_ADDRESS, EXPIRY);
        const wrapped = wrapInCallFromParent(ACL_ADDRESS, inner);
        const payload = Buffer.from(wrapped.slice(10), 'hex');
        const [, value] = EthereumAbi.rawDecode(['address', 'uint256', 'bytes'], payload);
        value.toString().should.equal('0');
      });

      it('should preserve inner calldata exactly', () => {
        const inner = buildDelegationCalldata(DELEGATE_ADDRESS, TOKEN_ADDRESS, EXPIRY);
        const wrapped = wrapInCallFromParent(ACL_ADDRESS, inner);
        const payload = Buffer.from(wrapped.slice(10), 'hex');
        const [, , data] = EthereumAbi.rawDecode(['address', 'uint256', 'bytes'], payload);
        ('0x' + (data as Buffer).toString('hex')).should.equal(inner);
      });

      it('should preserve multicall inner calldata exactly', () => {
        const inner = buildMulticallDelegationCalldata(DELEGATE_ADDRESS, [TOKEN_ADDRESS, TOKEN_ADDRESS_2], EXPIRY);
        const wrapped = wrapInCallFromParent(ACL_ADDRESS, inner);
        const payload = Buffer.from(wrapped.slice(10), 'hex');
        const [, , data] = EthereumAbi.rawDecode(['address', 'uint256', 'bytes'], payload);
        ('0x' + (data as Buffer).toString('hex')).should.equal(inner);
      });
    });

    describe('target address isolation', () => {
      it('different target addresses should produce different calldata', () => {
        const inner = buildDelegationCalldata(DELEGATE_ADDRESS, TOKEN_ADDRESS, EXPIRY);
        const w1 = wrapInCallFromParent(ACL_ADDRESS, inner);
        const w2 = wrapInCallFromParent(FORWARDER_ADDRESS, inner);
        w1.should.not.equal(w2);
      });
    });
  });

  // -------------------------------------------------------------------------
  describe('buildConfidentialTransferByHandleCalldata', () => {
    const HANDLE = '0x' + 'ab'.repeat(32); // 32-byte mock handle

    it('should return a 0x-prefixed hex string', () => {
      const result = buildConfidentialTransferByHandleCalldata(DELEGATE_ADDRESS, HANDLE);
      result.should.be.a.String();
      result.should.startWith('0x');
    });

    it('should start with the confidentialTransferNoProof selector (0x5bebed7e)', () => {
      const result = buildConfidentialTransferByHandleCalldata(DELEGATE_ADDRESS, HANDLE);
      result.should.startWith(confidentialTransferNoProofMethodId);
    });

    it('should encode the recipient address correctly', () => {
      const result = buildConfidentialTransferByHandleCalldata(DELEGATE_ADDRESS, HANDLE);
      const payload = Buffer.from(result.slice(10), 'hex');
      const decoded = EthereumAbi.rawDecode(['address', 'bytes32'], payload);
      ('0x' + (decoded[0] as Buffer).toString('hex')).toLowerCase().should.equal(DELEGATE_ADDRESS.toLowerCase());
    });

    it('should encode the encrypted handle correctly', () => {
      const result = buildConfidentialTransferByHandleCalldata(DELEGATE_ADDRESS, HANDLE);
      const payload = Buffer.from(result.slice(10), 'hex');
      const decoded = EthereumAbi.rawDecode(['address', 'bytes32'], payload);
      ('0x' + (decoded[1] as Buffer).toString('hex')).should.equal(HANDLE);
    });

    it('different handles should produce different calldata', () => {
      const h1 = '0x' + '01'.repeat(32);
      const h2 = '0x' + '02'.repeat(32);
      buildConfidentialTransferByHandleCalldata(DELEGATE_ADDRESS, h1).should.not.equal(
        buildConfidentialTransferByHandleCalldata(DELEGATE_ADDRESS, h2)
      );
    });

    it('different recipient addresses should produce different calldata', () => {
      buildConfidentialTransferByHandleCalldata(DELEGATE_ADDRESS, HANDLE).should.not.equal(
        buildConfidentialTransferByHandleCalldata(TOKEN_ADDRESS, HANDLE)
      );
    });
  });

  // -------------------------------------------------------------------------
  describe('buildFlushERC7984ForwarderTokenCalldata', () => {
    const PARENT_ADDRESS = '0x2222222222222222222222222222222222222222';
    const HANDLE = '0x' + 'cd'.repeat(32);

    it('should return a 0x-prefixed hex string', () => {
      const result = buildFlushERC7984ForwarderTokenCalldata(TOKEN_ADDRESS, PARENT_ADDRESS, HANDLE);
      result.should.be.a.String();
      result.should.startWith('0x');
    });

    it('should start with the callFromParent selector', () => {
      const result = buildFlushERC7984ForwarderTokenCalldata(TOKEN_ADDRESS, PARENT_ADDRESS, HANDLE);
      result.should.startWith(callFromParentMethodId);
    });

    it('inner calldata should start with confidentialTransferNoProof selector', () => {
      const result = buildFlushERC7984ForwarderTokenCalldata(TOKEN_ADDRESS, PARENT_ADDRESS, HANDLE);
      const payload = Buffer.from(result.slice(10), 'hex');
      const decoded = EthereumAbi.rawDecode(['address', 'uint256', 'bytes'], payload);
      const innerCalldata = '0x' + (decoded[2] as Buffer).toString('hex');
      innerCalldata.should.startWith(confidentialTransferNoProofMethodId);
    });

    it('outer target address should equal the token contract address', () => {
      const result = buildFlushERC7984ForwarderTokenCalldata(TOKEN_ADDRESS, PARENT_ADDRESS, HANDLE);
      const payload = Buffer.from(result.slice(10), 'hex');
      const decoded = EthereumAbi.rawDecode(['address', 'uint256', 'bytes'], payload);
      ('0x' + (decoded[0] as Buffer).toString('hex')).toLowerCase().should.equal(TOKEN_ADDRESS.toLowerCase());
    });

    it('inner recipient should equal the parent address', () => {
      const result = buildFlushERC7984ForwarderTokenCalldata(TOKEN_ADDRESS, PARENT_ADDRESS, HANDLE);
      const payload = Buffer.from(result.slice(10), 'hex');
      const decoded = EthereumAbi.rawDecode(['address', 'uint256', 'bytes'], payload);
      const innerCalldata = '0x' + (decoded[2] as Buffer).toString('hex');
      const innerPayload = Buffer.from(innerCalldata.slice(10), 'hex');
      const innerDecoded = EthereumAbi.rawDecode(['address', 'bytes32'], innerPayload);
      ('0x' + (innerDecoded[0] as Buffer).toString('hex')).toLowerCase().should.equal(PARENT_ADDRESS.toLowerCase());
    });

    it('different token addresses should produce different calldata', () => {
      buildFlushERC7984ForwarderTokenCalldata(TOKEN_ADDRESS, PARENT_ADDRESS, HANDLE).should.not.equal(
        buildFlushERC7984ForwarderTokenCalldata(TOKEN_ADDRESS_2, PARENT_ADDRESS, HANDLE)
      );
    });
  });

  // -------------------------------------------------------------------------
  describe('decodeFlushERC7984ForwarderTokenCalldata', () => {
    const PARENT_ADDRESS = '0x2222222222222222222222222222222222222222';
    const HANDLE = '0x' + 'ef'.repeat(32);

    it('should round-trip encode and decode correctly', () => {
      const encoded = buildFlushERC7984ForwarderTokenCalldata(TOKEN_ADDRESS, PARENT_ADDRESS, HANDLE);
      const decoded = decodeFlushERC7984ForwarderTokenCalldata(encoded);
      decoded.tokenContractAddress.toLowerCase().should.equal(TOKEN_ADDRESS.toLowerCase());
      decoded.parentAddress.toLowerCase().should.equal(PARENT_ADDRESS.toLowerCase());
      decoded.encryptedHandle.should.equal(HANDLE);
    });

    it('should throw for calldata with wrong outer selector', () => {
      const bad = '0xdeadbeef' + '00'.repeat(64);
      should.throws(() => decodeFlushERC7984ForwarderTokenCalldata(bad), /Invalid FlushERC7984ForwarderToken calldata/);
    });

    it('should throw for calldata with correct outer but wrong inner selector', () => {
      // Wrap delegation calldata in callFromParent — inner starts with 0x04f61a95, not 0x5bebed7e
      const innerCalldata = buildDelegationCalldata(DELEGATE_ADDRESS, TOKEN_ADDRESS, EXPIRY);
      const wrapped = wrapInCallFromParent(TOKEN_ADDRESS, innerCalldata);
      should.throws(
        () => decodeFlushERC7984ForwarderTokenCalldata(wrapped),
        /Invalid FlushERC7984ForwarderToken inner calldata/
      );
    });

    it('decoded tokenContractAddress should be checksummed or lowercase consistently', () => {
      const encoded = buildFlushERC7984ForwarderTokenCalldata(TOKEN_ADDRESS, PARENT_ADDRESS, HANDLE);
      const decoded = decodeFlushERC7984ForwarderTokenCalldata(encoded);
      should.exist(decoded.tokenContractAddress);
      decoded.tokenContractAddress.should.be.a.String();
    });
  });
});
