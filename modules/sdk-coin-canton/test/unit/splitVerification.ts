import 'should';
import { BitGoAPI } from '@bitgo/sdk-api';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { IWallet, resolveEffectiveTxParams, TransactionParams, TxRequest } from '@bitgo/sdk-core';
import { tokens } from '@bitgo/statics';

import { Canton, CantonToken, Tcanton } from '../../src';
import utils from '../../src/lib/utils';
import { PreparedTransaction } from '../../resources/proto/preparedTransaction';
import {
  CantonNativeSplitTxRequest,
  CantonSplitTxRequest,
  CantonUsdcxMultiInputSplitTxRequest,
} from '../splitFixtures';

const TOKEN_COIN = 'tcanton:tc1';

describe('Canton split (fanout) txRequest verification at signing time', function () {
  let bitgo: TestBitGoAPI;
  let nativeCoin: Tcanton;
  let tokenCoin: CantonToken;

  const txRequest = CantonSplitTxRequest as unknown as TxRequest;
  const unsignedTx = CantonSplitTxRequest.transactions[0].unsignedTx;
  const intentRecipient = CantonSplitTxRequest.intent.recipients[0];
  const wallet = {
    coinSpecific: () => ({ rootAddress: intentRecipient.address }),
    multisigType: () => 'tss',
  } as unknown as IWallet;

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    bitgo.safeRegister('canton', Canton.createInstance);
    bitgo.safeRegister('tcanton', Tcanton.createInstance);
    const tokenConfig = tokens.testnet.canton.tokens.find((t) => t.type === TOKEN_COIN);
    if (!tokenConfig) {
      throw new Error(`${TOKEN_COIN} not found in statics`);
    }
    bitgo.safeRegister(TOKEN_COIN, CantonToken.createTokenConstructor(tokenConfig));
    bitgo.initializeTestVars();
    nativeCoin = bitgo.coin('tcanton') as Tcanton;
    tokenCoin = bitgo.coin(TOKEN_COIN) as CantonToken;
  });

  // Same two calls EddsaMPCv2Utils.signRequestBase makes, with the txParams that
  // wallet.signAndSendTxRequest passes (none).
  async function verifyLikeSignRequestBase(coin: Tcanton | CantonToken, callerTxParams?: TransactionParams) {
    const txParams = resolveEffectiveTxParams(txRequest, callerTxParams, coin.getChain());
    return coin.verifyTransaction({
      txPrebuild: { txHex: unsignedTx.serializedTxHex },
      txParams,
      wallet,
      walletType: 'tss',
    });
  }

  describe('what the fixture looks like to the SDK', function () {
    it('parses a two-way split as a single 2.5B output while the intent amount is the full 5B', async function () {
      const explained = await tokenCoin.explainTransaction({ txHex: unsignedTx.serializedTxHex });
      explained.outputs.length.should.equal(1);
      explained.outputs[0].amount.should.equal('2500000000');
      intentRecipient.amount.value.should.equal('5000000000');
      CantonSplitTxRequest.intent.numberOfSplits.should.equal(2);
    });

    it('stores the intent recipient address as a plain string', function () {
      (typeof intentRecipient.address).should.equal('string');
    });
  });

  describe('signAndSendTxRequest path (no txParams from the caller)', function () {
    // Regression: resolveEffectiveTxParams used to read recipient.address.address (undefined for a string address),
    // then Canton verifyTransaction crashed calling address.split('?memoId=') on it.
    it('token coin: verifies a split txRequest built by wallet-platform', async function () {
      const result = await verifyLikeSignRequestBase(tokenCoin);
      result.should.equal(true);
    });

    it('native coin: verifies a split txRequest built by wallet-platform', async function () {
      const result = await verifyLikeSignRequestBase(nativeCoin);
      result.should.equal(true);
    });
  });

  describe('rejects splits that do not match the intent', function () {
    const baseTxParams = (overrides: Partial<TransactionParams> = {}): TransactionParams =>
      ({
        type: 'payment',
        numberOfSplits: 2,
        recipients: [{ address: intentRecipient.address, amount: intentRecipient.amount.value, tokenName: TOKEN_COIN }],
        ...overrides,
      } as TransactionParams);

    const verify = (txParams: TransactionParams, txHex = unsignedTx.serializedTxHex, w: IWallet = wallet) =>
      tokenCoin.verifyTransaction({ txPrebuild: { txHex }, txParams, wallet: w, walletType: 'tss' });

    // Rewrites the receiver of the last transfer in the batch and re-encodes the prepared transaction.
    function withForeignReceiverOnLastTransfer(txHex: string, foreignParty: string): string {
      const outer = JSON.parse(Buffer.from(txHex, 'base64').toString());
      const decoded = PreparedTransaction.fromBinary(
        Buffer.from(outer.prepareCommandResponse.preparedTransaction, 'base64')
      );
      const transferNodeFields = (decoded.transaction?.nodes ?? []).flatMap((node) => {
        const versioned = node.versionedNode;
        if (versioned.oneofKind !== 'v1' || versioned.v1.nodeType.oneofKind !== 'exercise') return [];
        const exercise = versioned.v1.nodeType.exercise;
        const argument = exercise.chosenValue?.sum;
        if (exercise.choiceId !== 'TransferFactory_Transfer' || argument?.oneofKind !== 'record') return [];
        const transfer = argument.record?.fields.find((f) => f.label === 'transfer')?.value?.sum;
        return transfer?.oneofKind === 'record' ? [transfer.record?.fields ?? []] : [];
      });
      const lastTransfer = transferNodeFields[transferNodeFields.length - 1];
      const receiver = lastTransfer.find((f) => f.label === 'receiver')?.value;
      if (!receiver) throw new Error('fixture has no receiver to tamper with');
      receiver.sum = { oneofKind: 'party', party: foreignParty };
      outer.prepareCommandResponse.preparedTransaction = Buffer.from(PreparedTransaction.toBinary(decoded)).toString(
        'base64'
      );
      return Buffer.from(JSON.stringify(outer)).toString('base64');
    }

    it('accepts the untouched fixture (control for the tampering cases)', async function () {
      (await verify(baseTxParams())).should.equal(true);
    });

    it('rejects a batch where one transfer goes to another party', async function () {
      const foreignParty = `attacker::${'1'.repeat(68)}`;
      const tampered = withForeignReceiverOnLastTransfer(unsignedTx.serializedTxHex, foreignParty);
      await verify(baseTxParams(), tampered).should.be.rejectedWith(/other than the wallet itself/);
    });

    it('rejects when the number of transfers differs from numberOfSplits', async function () {
      await verify(baseTxParams({ numberOfSplits: 3 })).should.be.rejectedWith(/has 2 transfers, expected 3/);
    });

    it('rejects when the transfers move more than the intent amount', async function () {
      const recipients = [{ address: intentRecipient.address, amount: '4000000000', tokenName: TOKEN_COIN }];
      await verify(baseTxParams({ recipients })).should.be.rejectedWith(/does not match expected amount/);
    });

    it('rejects when the recipient is not the wallet own address', async function () {
      const otherWallet = {
        coinSpecific: () => ({ rootAddress: `other::${'2'.repeat(68)}` }),
        multisigType: () => 'tss',
      } as unknown as IWallet;
      await verify(baseTxParams(), unsignedTx.serializedTxHex, otherWallet).should.be.rejectedWith(
        /not the wallet's own address/
      );
    });

    it('rejects when the transfers are not of the expected token', async function () {
      const recipients = [
        { address: intentRecipient.address, amount: intentRecipient.amount.value, tokenName: 'tcanton:other' },
      ];
      await verify(baseTxParams({ recipients })).should.be.rejectedWith(/does not match expected/);
    });

    [0, 1, undefined].forEach((numberOfSplits) => {
      it(`keeps the original recipient-matching path when numberOfSplits is ${numberOfSplits}`, async function () {
        // A batch of two 2.5B transfers must NOT pass as a plain send of 5B: only a real split (>1) is verified as a batch.
        await verify(baseTxParams({ numberOfSplits })).should.be.rejectedWith(
          /Tx outputs do not match with expected txParams recipients/
        );
      });
    });

    it('rejects a recipient without an address with a clear error instead of a TypeError', async function () {
      const recipients = [
        { address: undefined, amount: '1', tokenName: TOKEN_COIN },
      ] as unknown as TransactionParams['recipients'];
      await verify(baseTxParams({ recipients, numberOfSplits: undefined })).should.be.rejectedWith(
        /Recipient address is required/
      );
    });
  });

  describe('second failure behind the TypeError', function () {
    // Regression: failed with "Tx outputs do not match with expected txParams recipients" because the SDK
    // only read the first transfer of the BatchTransfer (2.5B) while the intent amount is the full 5B.
    it('verifies when the recipient address is already resolved correctly', async function () {
      const txParams = {
        type: 'payment',
        numberOfSplits: CantonSplitTxRequest.intent.numberOfSplits,
        recipients: [{ address: intentRecipient.address, amount: intentRecipient.amount.value, tokenName: TOKEN_COIN }],
      } as TransactionParams;
      const result = await tokenCoin.verifyTransaction({
        txPrebuild: { txHex: unsignedTx.serializedTxHex },
        txParams,
        wallet,
        walletType: 'tss',
      });
      result.should.equal(true);
    });
  });

  describe('native Canton Coin split (test-env capture)', function () {
    const nativeRequest = CantonNativeSplitTxRequest as unknown as TxRequest;
    const nativeTx = CantonNativeSplitTxRequest.transactions[0].unsignedTx;
    const nativeRecipient = CantonNativeSplitTxRequest.intent.recipients[0];
    const nativeWallet = {
      coinSpecific: () => ({ rootAddress: nativeRecipient.address }),
      multisigType: () => 'tss',
    } as unknown as IWallet;

    const verifyNative = (txParams: TransactionParams, w: IWallet = nativeWallet) =>
      nativeCoin.verifyTransaction({
        txPrebuild: { txHex: nativeTx.serializedTxHex },
        txParams,
        wallet: w,
        walletType: 'tss',
      });

    it('verifies the txRequest on the signAndSendTxRequest path (intent only)', async function () {
      const txParams = resolveEffectiveTxParams(nativeRequest, undefined, nativeCoin.getChain());
      txParams.numberOfSplits?.should.equal(2);
      (await verifyNative(txParams)).should.equal(true);
    });

    it('parses both transfers of the batch as self-transfers of half the UTXO', function () {
      const transfers = utils.parseBatchTransfers(
        JSON.parse(Buffer.from(nativeTx.serializedTxHex, 'base64').toString()).prepareCommandResponse
          .preparedTransaction
      );
      transfers.should.have.length(2);
      transfers.forEach((transfer) => {
        transfer.sender.should.equal(nativeRecipient.address);
        transfer.receiver.should.equal(nativeRecipient.address);
        transfer.amount.should.equal('5000000000');
        (transfer.token === undefined).should.equal(true);
      });
    });

    it('rejects a native split verified as a token split', async function () {
      const txParams = resolveEffectiveTxParams(nativeRequest, undefined, nativeCoin.getChain());
      const tokenRecipients = [
        { ...txParams.recipients?.[0], tokenName: TOKEN_COIN },
      ] as TransactionParams['recipients'];
      await verifyNative({ ...txParams, recipients: tokenRecipients }).should.be.rejectedWith(
        /does not match expected/
      );
    });

    it('rejects when the intent amount exceeds what the batch moves by a full split', async function () {
      const txParams = resolveEffectiveTxParams(nativeRequest, undefined, nativeCoin.getChain());
      const recipients = [{ ...txParams.recipients?.[0], amount: '10000000002' }] as TransactionParams['recipients'];
      await verifyNative({ ...txParams, recipients }).should.be.rejectedWith(/does not match expected amount/);
    });
  });

  describe('USDCx split of multiple input UTXOs into four (test-env capture)', function () {
    const usdcxRequest = CantonUsdcxMultiInputSplitTxRequest as unknown as TxRequest;
    const usdcxTx = CantonUsdcxMultiInputSplitTxRequest.transactions[0].unsignedTx;
    const usdcxRecipient = CantonUsdcxMultiInputSplitTxRequest.intent.recipients[0];
    const usdcxWallet = {
      coinSpecific: () => ({ rootAddress: usdcxRecipient.address }),
      multisigType: () => 'tss',
    } as unknown as IWallet;
    let usdcxCoin: CantonToken;

    before(function () {
      const tokenConfig = tokens.testnet.canton.tokens.find((t) => t.type === 'tcanton:usdcx');
      if (!tokenConfig) {
        throw new Error('tcanton:usdcx not found in statics');
      }
      bitgo.safeRegister('tcanton:usdcx', CantonToken.createTokenConstructor(tokenConfig));
      usdcxCoin = bitgo.coin('tcanton:usdcx') as CantonToken;
    });

    const verifyUsdcx = (txParams: TransactionParams) =>
      usdcxCoin.verifyTransaction({
        txPrebuild: { txHex: usdcxTx.serializedTxHex },
        txParams,
        wallet: usdcxWallet,
        walletType: 'tss',
      });

    it('has several input unspents and a split count larger than the input count', function () {
      CantonUsdcxMultiInputSplitTxRequest.intent.unspents.length.should.equal(2);
      CantonUsdcxMultiInputSplitTxRequest.intent.numberOfSplits.should.equal(4);
    });

    it('verifies the txRequest on the signAndSendTxRequest path (intent only)', async function () {
      const txParams = resolveEffectiveTxParams(usdcxRequest, undefined, usdcxCoin.getChain());
      txParams.numberOfSplits?.should.equal(4);
      (await verifyUsdcx(txParams)).should.equal(true);
    });

    it('parses four equal self-transfers that add up to the full input value', function () {
      const transfers = utils.parseBatchTransfers(
        JSON.parse(Buffer.from(usdcxTx.serializedTxHex, 'base64').toString()).prepareCommandResponse.preparedTransaction
      );
      transfers.should.have.length(4);
      transfers.forEach((transfer) => {
        transfer.sender.should.equal(usdcxRecipient.address);
        transfer.receiver.should.equal(usdcxRecipient.address);
        transfer.amount.should.equal('2000000000');
        transfer.token?.should.equal('tcanton:usdcx');
      });
    });

    it('rejects when the split count does not match the number of transfers', async function () {
      const txParams = resolveEffectiveTxParams(usdcxRequest, undefined, usdcxCoin.getChain());
      await verifyUsdcx({ ...txParams, numberOfSplits: 5 }).should.be.rejectedWith(/has 4 transfers, expected 5/);
    });
  });
});
