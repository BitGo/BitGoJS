import should from 'should';
import { DecryptionDelegationBuilder } from '../../src/lib/decryptionDelegationBuilder';
import EthereumAbi from 'ethereumjs-abi';
import { buildDelegationCalldata, aclMulticallMethodId, callFromParentMethodId } from '../../src/lib/zamaUtils';

describe('DecryptionDelegationBuilder', () => {
  const ACL_ADDRESS = '0xf0Ffdc93b7E186bC2f8CB3dAA75D86d1930A433D';
  const DELEGATE_ADDRESS = '0x1111111111111111111111111111111111111111';
  const TOKEN_ADDRESS = '0x94167129172A35ab093B44b8b96213DDbc3cD387';
  const TOKEN_ADDRESS_2 = '0x4E7B06D78965594eB5EF5414c357ca21E1554491';
  const TOKEN_ADDRESS_3 = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
  const FORWARDER_ADDRESS = '0xDeADbeefdEAdbeefdEadbEEFdeadbeEFdEaDbeeF';
  const EXPIRY = Math.floor(Date.now() / 1000) + 365 * 86400;

  let builder: DecryptionDelegationBuilder;

  beforeEach(() => {
    builder = new DecryptionDelegationBuilder();
  });

  // -------------------------------------------------------------------------
  describe('Scenario 1: root wallet (multicall to ACL)', () => {
    it('should set to=ACL and selector=multicall for a single token', () => {
      const req = builder.build({
        aclContractAddress: ACL_ADDRESS,
        delegateAddress: DELEGATE_ADDRESS,
        tokenContractAddresses: [TOKEN_ADDRESS],
        expiryTimestamp: EXPIRY,
      });

      req.to.should.equal(ACL_ADDRESS);
      req.data.slice(0, 10).should.equal(aclMulticallMethodId);
      req.value.should.equal('0');
    });

    it('should set to=ACL and selector=multicall for multiple tokens', () => {
      const req = builder.build({
        aclContractAddress: ACL_ADDRESS,
        delegateAddress: DELEGATE_ADDRESS,
        tokenContractAddresses: [TOKEN_ADDRESS, TOKEN_ADDRESS_2],
        expiryTimestamp: EXPIRY,
      });

      req.to.should.equal(ACL_ADDRESS);
      req.data.slice(0, 10).should.equal(aclMulticallMethodId);
      req.value.should.equal('0');
    });

    it('single-token build should embed the correct decryption delegation inner call', () => {
      const req = builder.build({
        aclContractAddress: ACL_ADDRESS,
        delegateAddress: DELEGATE_ADDRESS,
        tokenContractAddresses: [TOKEN_ADDRESS],
        expiryTimestamp: EXPIRY,
      });

      const expectedInner = buildDelegationCalldata(DELEGATE_ADDRESS, TOKEN_ADDRESS, EXPIRY).slice(2);
      req.data.should.containEql(expectedInner);
    });

    it('multi-token build should embed inner calls for all tokens', () => {
      const req = builder.build({
        aclContractAddress: ACL_ADDRESS,
        delegateAddress: DELEGATE_ADDRESS,
        tokenContractAddresses: [TOKEN_ADDRESS, TOKEN_ADDRESS_2, TOKEN_ADDRESS_3],
        expiryTimestamp: EXPIRY,
      });

      const tokens = [TOKEN_ADDRESS, TOKEN_ADDRESS_2, TOKEN_ADDRESS_3];
      for (const token of tokens) {
        const expectedInner = buildDelegationCalldata(DELEGATE_ADDRESS, token, EXPIRY).slice(2);
        req.data.should.containEql(expectedInner);
      }
    });

    it('inner calls should not contain other tokens not in the list', () => {
      const req = builder.build({
        aclContractAddress: ACL_ADDRESS,
        delegateAddress: DELEGATE_ADDRESS,
        tokenContractAddresses: [TOKEN_ADDRESS],
        expiryTimestamp: EXPIRY,
      });

      const unexpectedInner = buildDelegationCalldata(DELEGATE_ADDRESS, TOKEN_ADDRESS_2, EXPIRY).slice(2);
      req.data.should.not.containEql(unexpectedInner);
    });

    it('should produce longer calldata for more tokens', () => {
      const single = builder.build({
        aclContractAddress: ACL_ADDRESS,
        delegateAddress: DELEGATE_ADDRESS,
        tokenContractAddresses: [TOKEN_ADDRESS],
        expiryTimestamp: EXPIRY,
      });
      const triple = builder.build({
        aclContractAddress: ACL_ADDRESS,
        delegateAddress: DELEGATE_ADDRESS,
        tokenContractAddresses: [TOKEN_ADDRESS, TOKEN_ADDRESS_2, TOKEN_ADDRESS_3],
        expiryTimestamp: EXPIRY,
      });
      triple.data.length.should.be.greaterThan(single.data.length);
    });
  });

  // -------------------------------------------------------------------------
  describe('Scenario 2: forwarder (callFromParent wrapping multicall)', () => {
    it('should set to=forwarder and selector=callFromParent for a single token', () => {
      const req = builder.build({
        aclContractAddress: ACL_ADDRESS,
        delegateAddress: DELEGATE_ADDRESS,
        tokenContractAddresses: [TOKEN_ADDRESS],
        expiryTimestamp: EXPIRY,
        forwarderAddress: FORWARDER_ADDRESS,
      });

      req.to.should.equal(FORWARDER_ADDRESS);
      req.data.slice(0, 10).should.equal(callFromParentMethodId);
      req.value.should.equal('0');
    });

    it('should set to=forwarder and selector=callFromParent for multiple tokens', () => {
      const req = builder.build({
        aclContractAddress: ACL_ADDRESS,
        delegateAddress: DELEGATE_ADDRESS,
        tokenContractAddresses: [TOKEN_ADDRESS, TOKEN_ADDRESS_2],
        expiryTimestamp: EXPIRY,
        forwarderAddress: FORWARDER_ADDRESS,
      });

      req.to.should.equal(FORWARDER_ADDRESS);
      req.data.slice(0, 10).should.equal(callFromParentMethodId);
      req.value.should.equal('0');
    });

    it('should encode ACL address as the callFromParent target', () => {
      const req = builder.build({
        aclContractAddress: ACL_ADDRESS,
        delegateAddress: DELEGATE_ADDRESS,
        tokenContractAddresses: [TOKEN_ADDRESS],
        expiryTimestamp: EXPIRY,
        forwarderAddress: FORWARDER_ADDRESS,
      });

      const payload = Buffer.from(req.data.slice(10), 'hex');
      const [target] = EthereumAbi.rawDecode(['address', 'uint256', 'bytes'], payload);
      (target as Buffer).toString('hex').should.equal(ACL_ADDRESS.slice(2).toLowerCase());
    });

    it('should encode value=0 inside callFromParent', () => {
      const req = builder.build({
        aclContractAddress: ACL_ADDRESS,
        delegateAddress: DELEGATE_ADDRESS,
        tokenContractAddresses: [TOKEN_ADDRESS],
        expiryTimestamp: EXPIRY,
        forwarderAddress: FORWARDER_ADDRESS,
      });

      const payload = Buffer.from(req.data.slice(10), 'hex');
      const [, value] = EthereumAbi.rawDecode(['address', 'uint256', 'bytes'], payload);
      value.toString().should.equal('0');
    });

    it('inner data (decoded from callFromParent) should be a valid multicall containing all tokens', () => {
      const req = builder.build({
        aclContractAddress: ACL_ADDRESS,
        delegateAddress: DELEGATE_ADDRESS,
        tokenContractAddresses: [TOKEN_ADDRESS, TOKEN_ADDRESS_2],
        expiryTimestamp: EXPIRY,
        forwarderAddress: FORWARDER_ADDRESS,
      });

      const outerPayload = Buffer.from(req.data.slice(10), 'hex');
      const [, , innerData] = EthereumAbi.rawDecode(['address', 'uint256', 'bytes'], outerPayload);
      const innerHex = '0x' + (innerData as Buffer).toString('hex');

      innerHex.slice(0, 10).should.equal(aclMulticallMethodId);

      const inner1 = buildDelegationCalldata(DELEGATE_ADDRESS, TOKEN_ADDRESS, EXPIRY).slice(2);
      const inner2 = buildDelegationCalldata(DELEGATE_ADDRESS, TOKEN_ADDRESS_2, EXPIRY).slice(2);
      innerHex.should.containEql(inner1);
      innerHex.should.containEql(inner2);
    });
  });

  // -------------------------------------------------------------------------
  describe('parameter isolation', () => {
    it('changing ACL address should change the to field (root wallet path)', () => {
      const ACL_2 = '0x2222222222222222222222222222222222222222';
      const r1 = builder.build({
        aclContractAddress: ACL_ADDRESS,
        delegateAddress: DELEGATE_ADDRESS,
        tokenContractAddresses: [TOKEN_ADDRESS],
        expiryTimestamp: EXPIRY,
      });
      const r2 = builder.build({
        aclContractAddress: ACL_2,
        delegateAddress: DELEGATE_ADDRESS,
        tokenContractAddresses: [TOKEN_ADDRESS],
        expiryTimestamp: EXPIRY,
      });
      r1.to.should.equal(ACL_ADDRESS);
      r2.to.should.equal(ACL_2);
    });

    it('changing forwarder address should change the to field', () => {
      const FWD_2 = '0x3333333333333333333333333333333333333333';
      const r1 = builder.build({
        aclContractAddress: ACL_ADDRESS,
        delegateAddress: DELEGATE_ADDRESS,
        tokenContractAddresses: [TOKEN_ADDRESS],
        expiryTimestamp: EXPIRY,
        forwarderAddress: FORWARDER_ADDRESS,
      });
      const r2 = builder.build({
        aclContractAddress: ACL_ADDRESS,
        delegateAddress: DELEGATE_ADDRESS,
        tokenContractAddresses: [TOKEN_ADDRESS],
        expiryTimestamp: EXPIRY,
        forwarderAddress: FWD_2,
      });
      r1.to.should.equal(FORWARDER_ADDRESS);
      r2.to.should.equal(FWD_2);
    });

    it('changing delegate address should change the calldata', () => {
      const DELEGATE_2 = '0x2222222222222222222222222222222222222222';
      const r1 = builder.build({
        aclContractAddress: ACL_ADDRESS,
        delegateAddress: DELEGATE_ADDRESS,
        tokenContractAddresses: [TOKEN_ADDRESS],
        expiryTimestamp: EXPIRY,
      });
      const r2 = builder.build({
        aclContractAddress: ACL_ADDRESS,
        delegateAddress: DELEGATE_2,
        tokenContractAddresses: [TOKEN_ADDRESS],
        expiryTimestamp: EXPIRY,
      });
      r1.data.should.not.equal(r2.data);
    });

    it('changing expiry should change the calldata', () => {
      const r1 = builder.build({
        aclContractAddress: ACL_ADDRESS,
        delegateAddress: DELEGATE_ADDRESS,
        tokenContractAddresses: [TOKEN_ADDRESS],
        expiryTimestamp: EXPIRY,
      });
      const r2 = builder.build({
        aclContractAddress: ACL_ADDRESS,
        delegateAddress: DELEGATE_ADDRESS,
        tokenContractAddresses: [TOKEN_ADDRESS],
        expiryTimestamp: EXPIRY + 86400,
      });
      r1.data.should.not.equal(r2.data);
    });
  });

  // -------------------------------------------------------------------------
  describe('value field', () => {
    it('should always be "0" for all scenarios', () => {
      const scenarios = [
        { tokenContractAddresses: [TOKEN_ADDRESS] },
        { tokenContractAddresses: [TOKEN_ADDRESS, TOKEN_ADDRESS_2] },
        { tokenContractAddresses: [TOKEN_ADDRESS], forwarderAddress: FORWARDER_ADDRESS },
        { tokenContractAddresses: [TOKEN_ADDRESS, TOKEN_ADDRESS_2], forwarderAddress: FORWARDER_ADDRESS },
      ];

      for (const extra of scenarios) {
        const req = builder.build({
          aclContractAddress: ACL_ADDRESS,
          delegateAddress: DELEGATE_ADDRESS,
          expiryTimestamp: EXPIRY,
          ...extra,
        });
        req.value.should.equal('0');
      }
    });
  });

  // -------------------------------------------------------------------------
  describe('error handling', () => {
    it('should throw when tokenContractAddresses is empty', () => {
      should.throws(
        () =>
          builder.build({
            aclContractAddress: ACL_ADDRESS,
            delegateAddress: DELEGATE_ADDRESS,
            tokenContractAddresses: [],
            expiryTimestamp: EXPIRY,
          }),
        /DecryptionDelegationBuilder: tokenContractAddresses must not be empty/
      );
    });
  });
});
