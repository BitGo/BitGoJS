import should from 'should';
import sinon from 'sinon';
import { TestBitGo } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import { Starknet } from '../../../src/index';

describe('Starknet Recovery', function () {
  let bitgo;
  let basecoin;
  let fetchStub;

  // Test keys from sdk-coin-icp resources (encrypted with walletPassphrase below)
  const userKey =
    '{"iv":"ZfhJQF9+MUj7hZ8OoesfcA==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"+f/agM4bM8s=","ct":"2dQxSuUKSyFbe3vSYHSRG4p4PJ4XWA/yz7Af9dPpmFDN+2G4iXsUdkyscBsU1QGZ1gDgB7EUPnNIoa36Kbm2Ioh9QR1pms2xPzkHMvdO9UtMwch+tDPFMSYBCOfIWXjAVIIDpJcJthepIK+f2W8JiuWIz9m+TGV+R6kA1ahBURgyKBA7pyUuPrnXmWWj4ihEOOvxjt5df14ZcQ11KjtnaE4Mal2Zm+oXQj4VwW39CUF7QI+5XIBlhq3uXfJ6NLhRQ1DjH2imQVp8iCE1to8lBLj9V09beXNdXQBAomm4fugl6ejTp5tsig/75VKazYJzjNuOAAKaEHDkdMOUzdp8oOWq3eiBFMgD+9Zy31tYxCHGlKyMNjgOlwrKxmuv1zWrhEbYkALB+m7AUc2+qkCYUK+L+FfAPO/U0Ww3gq/mYtFDvdqSF6wDa68r5eab9fc04k1phrxRRuL1K02Hf68z6nvw0I9CCzaW9C2Gmyz8K06o7YlRBy7fkya11L++OWpEL5zGs8Fnamaz3EImLakL/gKSvJVNXLRxrh2btjAbs/hEXek3WMntJCK1RiwALbMVakBYZiKgKCXlD0AvMdz+s8/pFyyQuDk1fmJtrnaCNnR6ozcvmd4+ZLtVOcte5f6t7DCHlIvEy3ys4sCQlr6zAXAtg2kX7uHkuEls2lTMwRb4PekNAoO4oxLRbKo+L9t4FnmnXBSDQW0+TqBfduMZ8rzLqppoTyep8dyFySBXQLQAaCrNsWgEnuHk7dKLWwKzYTCDJbX/UClS2ehoyoJcMQwmRIMjY9FmJPNK03RTBA9jllUk/JrNfEXkHwKeT+SWuQgAeMCqbWJ8A/b9SIPDRJFdR5mt1+H9sL5Y+6+2lcqXtAvSUnUgTMt9oUZirAXE7Wt2qZewaXYmaRarFRH/bw/xzVkSfjrLD22iribAKivIGDzPLIirhN+9xAXBlsErAOT/V8aejuPw9k9oL9Ae/Ok0NZfPZMR8/7uutiGvDgw7vJVDelYMIjEOJHXFDnj+rH3vwPnMNI4Y6M6fNt0yrgMR+eMjgbxxGFYTZO9vlsQRiL/pxP6ceM9ReampgOWLmnYfIhTx91DMURfN"}';
  const backupKey =
    '{"iv":"ZKCXaP1L5fVxDOjVKKZuCg==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"4mmZz3KxTqs=","ct":"R2UVujh0H0FmPFkxTLnAGg+/P50DVnNP8d7VbsVJWJJWJvbV5tf+eYpvuz+5dpCC7D6xR7vN08ZXuZf6whUFerYOev+LSTcq2T1uar5xLvZBTd7alD889aJQJcd9+Om2JIjdPq3drFaqQF366d2H9tsVY+3iGsuJwCMHf6k8pxePxx5vk3iu4lcy4mJWp4d0zdo95nc4IZCrDp9i9i1p+w/mPhR0Rn+9c6T770vblRm87ft8vfyLZwMEqvJp3QW2XR+6vSyCkzbeZ/+m2nJmsK/Wt6sRqv27KDGVh23YEKp+yY3T9hT4FK0kzaF3tR8yq62Nj40eQ2iHIz50teiyW6HFm7IL4BT/vhL7qFa+VBz6qowON9p/96/21D2Nq40QnAxnOVfxW9DfQwnfBWyZJ8cLvHQ2s24LJX/YdHilPbElbjHncrpqf1jT/AELfBar/i5rrQZ5T0kxNC6t1VJpTUqiWuGUU42GTfzj12XHdqEdj+PcycLWjx8/DoqNPxqcPiEenBl8mst5SWNp1LW/FfEFgyB9p7L2UkxHhRYEzQ4WqIpQ6wERFqmpF6tRgXcYvwu5qc903C9CkRp2HXx2zmryW/vpODBXqwtRiwK1TGXQ0FPuEML+vwhh2LoYRGKOqcfQDTY4qX25kcly6D0zyY7YPTqALJnQYEGXOP42CBO+i5NkTjNCWsJRQMyNqRgEuAE8m1MWjcUIFQWebSJEyss6Ty14HHv+p6ACk6bDVMSLQLhVW3eccvRV5cBu4O6xFAehtvJ74Hc44iDZd5MFjBCZhj9dB3qfrkVFuIjT9WJkXYAn4f6b8Src+COrscklpYvcObGjeel5/Hx80q3jzboYmo9wgisKVpGhtz0XuqrxfZUiHUOGCoWMXFsdLmruh6u3CKKLnobBFgcmFAHJZaotYKOvpK0Lge7qN5vsGVZQhLu6ba/mUJdueDnUPmIJfMczi/yZ+600OcYjD2hetxzzrhkJ7qYRx0WCAyWUKHDl/1QqmavS+wKbnmbziAhgq6BL9cOG7hlPYIx0OERHzpmA3BCpeojI1Fgu27sADyZWLzO1YNfqeTX9fYvgEUE1XmTiSshvkwQxa/KNNHE9+A=="}';
  const bitgoKey =
    '036ded8b5a849409935a4fa1a1cf921233f2c755162987804c861ab3aff95cf8fd8553beb55f568dc886b05c5b6831d946e7c442468fef9c953f62f9b1e06ac9d9';
  const walletPassphrase = 'Eaglefenaus@1994';
  const recoveryDestination = '0x02e153ef86ae7682160f69f4218b6a41aebc79ca11dabb1a4fcd7cc55f16f977';

  const DEPLOYED_CLASS_HASH = '0x3940bc18abf1df6bc540cabadb1cad9486c6803b95801e57b6153ae21abfe06';
  // 100 STRK in fri — comfortably above the BGMS-style maxFee ceiling (fixed 40M L2 gas amount).
  const BALANCE_100_STRK = '0x56bc75e2d63100000';

  const mockRpcResponse = (result: any) => ({
    ok: true,
    json: async () => ({ jsonrpc: '2.0', id: 1, result }),
  });

  const mockRpcError = (code: number, message: string) => ({
    ok: true,
    json: async () => ({ jsonrpc: '2.0', id: 1, error: { code, message } }),
  });

  // Live-shaped Sepolia block header gas prices (price_in_fri).
  const mockBlock = () =>
    mockRpcResponse({
      l1_gas_price: { price_in_fri: '0x62234cebb523' },
      l2_gas_price: { price_in_fri: '0x682341b1e' },
      l1_data_gas_price: { price_in_fri: '0x6447b483a9' },
    });

  const decodeTx = (hex: string) => JSON.parse(Buffer.from(hex, 'hex').toString('utf-8'));

  before(async function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
    bitgo.safeRegister('starknet', Starknet.createInstance);
    bitgo.safeRegister('tstarknet', Starknet.createInstance);
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('tstarknet');
  });

  beforeEach(function () {
    fetchStub = sinon.stub(global, 'fetch');
  });

  afterEach(function () {
    sinon.restore();
  });

  /**
   * RPC call order in recover():
   * 1. starknet_getClassHashAt (deployment check)
   * 2. starknet_getNonce (deployed accounts only)
   * 3. starknet_call (balance_of)
   * 4. starknet_getBlockWithTxHashes (live gas prices)
   * 5+ broadcast / receipt-poll calls (signed only)
   */

  it('should successfully build a signed sweep transaction for already deployed account', async function () {
    let i = 0;
    fetchStub.onCall(i++).resolves(mockRpcResponse(DEPLOYED_CLASS_HASH)); // classHash (deployed)
    fetchStub.onCall(i++).resolves(mockRpcResponse('0x0')); // nonce
    fetchStub.onCall(i++).resolves(mockRpcResponse([BALANCE_100_STRK, '0x0'])); // balance
    fetchStub.onCall(i++).resolves(mockBlock()); // gas prices

    const signStub = sinon.stub(Starknet.prototype, 'signRecoveryTransaction' as any).resolves({
      r: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      s: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      recid: 0,
    });

    const recovery = await basecoin.recover({ userKey, backupKey, walletPassphrase, recoveryDestination, bitgoKey });

    should.exist(recovery.txRequests);
    recovery.txRequests.length.should.equal(1);
    const txRequest = recovery.txRequests[0];
    txRequest.transactions.length.should.equal(1);

    const txItem = txRequest.transactions[0];
    txItem.unsignedTx.parsedTx.type.should.equal('send');
    should.exist(txItem.unsignedTx.broadcastFormat);
    txItem.unsignedTx.broadcastFormat.signature.should.not.be.empty();

    signStub.calledOnce.should.be.true();
    (signStub.firstCall.args[0] as Buffer).length.should.equal(32);
  });

  it('should successfully build and sign deploy + sweep for undeployed account', async function () {
    let i = 0;
    fetchStub.onCall(i++).resolves(mockRpcError(20, 'Contract not found')); // classHash (undeployed)
    fetchStub.onCall(i++).resolves(mockRpcResponse([BALANCE_100_STRK, '0x0'])); // balance
    fetchStub.onCall(i++).resolves(mockBlock()); // gas prices

    const signStub = sinon.stub(Starknet.prototype, 'signRecoveryTransaction' as any).resolves({
      r: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      s: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      recid: 0,
    });

    const recovery = await basecoin.recover({ userKey, backupKey, walletPassphrase, recoveryDestination, bitgoKey });

    should.exist(recovery.txRequests);
    recovery.txRequests.length.should.equal(1);
    const txRequest = recovery.txRequests[0];
    txRequest.transactions.length.should.equal(2);

    txRequest.transactions[0].unsignedTx.parsedTx.type.should.equal('deploy_account');
    should.exist(txRequest.transactions[0].unsignedTx.broadcastFormat);
    txRequest.transactions[0].unsignedTx.broadcastFormat.signature.should.not.be.empty();

    txRequest.transactions[1].unsignedTx.parsedTx.type.should.equal('send');
    should.exist(txRequest.transactions[1].unsignedTx.broadcastFormat);
    txRequest.transactions[1].unsignedTx.broadcastFormat.signature.should.not.be.empty();

    signStub.calledTwice.should.be.true();
    (signStub.firstCall.args[0] as Buffer).length.should.equal(32);
    (signStub.secondCall.args[0] as Buffer).length.should.equal(32);
  });

  it('should generate unsigned sweep with deploy + transfer for undeployed account (nonce 0 then 1)', async function () {
    let i = 0;
    fetchStub.onCall(i++).resolves(mockRpcError(20, 'Contract not found')); // classHash (undeployed)
    fetchStub.onCall(i++).resolves(mockRpcResponse([BALANCE_100_STRK, '0x0'])); // balance
    fetchStub.onCall(i++).resolves(mockBlock()); // gas prices

    const recovery = await basecoin.recover({ recoveryDestination, bitgoKey });

    should.exist(recovery.txRequests);
    recovery.txRequests.length.should.equal(1);
    const txRequest = recovery.txRequests[0];
    txRequest.transactions.length.should.equal(2);
    txRequest.transactions[0].unsignedTx.parsedTx.type.should.equal('deploy_account');
    txRequest.transactions[1].unsignedTx.parsedTx.type.should.equal('send');

    // Nonce fix: deploy uses nonce 0x0, the following sweep uses nonce 1.
    const deployData = decodeTx(txRequest.transactions[0].unsignedTx.serializedTx);
    const sweepData = decodeTx(txRequest.transactions[1].unsignedTx.serializedTx);
    deployData.nonce.should.equal('0x0');
    sweepData.nonce.should.equal('0x1');
  });

  it('should generate unsigned sweep for already deployed account', async function () {
    let i = 0;
    fetchStub.onCall(i++).resolves(mockRpcResponse(DEPLOYED_CLASS_HASH)); // classHash (deployed)
    fetchStub.onCall(i++).resolves(mockRpcResponse('0x5')); // nonce
    fetchStub.onCall(i++).resolves(mockRpcResponse([BALANCE_100_STRK, '0x0'])); // balance
    fetchStub.onCall(i++).resolves(mockBlock()); // gas prices

    const recovery = await basecoin.recover({ recoveryDestination, bitgoKey });

    should.exist(recovery.txRequests);
    const txRequest = recovery.txRequests[0];
    txRequest.transactions.length.should.equal(1);
    txRequest.transactions[0].unsignedTx.parsedTx.type.should.equal('send');
    // Deployed account: sweep keeps the live nonce.
    decodeTx(txRequest.transactions[0].unsignedTx.serializedTx).nonce.should.equal('0x5');
  });

  it('should throw if STRK balance cannot cover estimated fee', async function () {
    let i = 0;
    fetchStub.onCall(i++).resolves(mockRpcResponse(DEPLOYED_CLASS_HASH)); // classHash (deployed)
    fetchStub.onCall(i++).resolves(mockRpcResponse('0x0')); // nonce
    fetchStub.onCall(i++).resolves(mockRpcResponse(['0x5af3107a4000', '0x0'])); // balance ~0.0001 STRK
    fetchStub.onCall(i++).resolves(mockBlock()); // gas prices

    await basecoin.recover({ recoveryDestination, bitgoKey }).should.be.rejectedWith(/Insufficient STRK balance/);
  });

  it('should throw if recoveryDestination is missing', async function () {
    await basecoin.recover({ bitgoKey }).should.be.rejectedWith(/Invalid recoveryDestination/);
  });

  it('should throw if bitgoKey is missing', async function () {
    await basecoin.recover({ recoveryDestination }).should.be.rejectedWith(/Missing bitgoKey/);
  });
});
