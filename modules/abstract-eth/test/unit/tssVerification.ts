import 'should';
import sinon from 'sinon';
import EthereumAbi from 'ethereumjs-abi';
import { FeeMarketEIP1559Transaction } from '@ethereumjs/tx';
import { BitGoAPI } from '@bitgo/sdk-api';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import {
  BitGoBase,
  resolveEffectiveTxParams,
  TxIntentMismatchRecipientError,
  TxRequest,
  Wallet,
} from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin, coins, EthereumNetwork } from '@bitgo/statics';
import { AbstractEthLikeNewCoins, TransactionBuilder, TransferBuilder } from '../../src';

class TestTransactionBuilder extends TransactionBuilder {
  constructor(_coinConfig: Readonly<StaticsBaseCoin>) {
    super(_coinConfig);
    this._transfer = new TransferBuilder();
  }

  transfer(data?: string): TransferBuilder {
    if (data) {
      this._transfer = new TransferBuilder(data);
    }
    return this._transfer as TransferBuilder;
  }
}
class TestEvmCoin extends AbstractEthLikeNewCoins {
  private readonly chainOverride?: string;
  private readonly baseChainOverride?: string;

  constructor(
    bitgo: BitGoBase,
    staticsCoin: Readonly<StaticsBaseCoin>,
    { chainOverride, baseChainOverride }: { chainOverride?: string; baseChainOverride?: string } = {}
  ) {
    super(bitgo, staticsCoin);
    this.chainOverride = chainOverride;
    this.baseChainOverride = baseChainOverride;
  }

  getChain(): string {
    return this.chainOverride ?? super.getChain();
  }

  getBaseChain(): string {
    return this.baseChainOverride ?? super.getBaseChain();
  }

  protected getTransactionBuilder(): TransactionBuilder {
    return new TestTransactionBuilder(this.staticsCoin as Readonly<StaticsBaseCoin>);
  }
}
describe('AbstractEthLikeNewCoins TSS verification (HyperEVM bridgeFunds & Hedera NFT transferFrom)', function () {
  const baseAddress = '0x174cfd823af8ce27ed0afee3fcf3c3ba259116be';
  const recipient = '0x7e85bdc27c050e3905ebf4b8e634d9ad6edd0de6';
  const attacker = '0x9f8d0b5e1b3c3f0e2f4b7a6c1d2e3f4a5b6c7d8e';
  const coreWriter = '0x3333333333333333333333333333333333333333';
  const systemAddress = '0x2222222222222222222222222222222222222222';

  let bitgo: TestBitGoAPI;
  let warn: sinon.SinonStub;

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
    bitgo.initializeTestVars();
  });

  beforeEach(function () {
    warn = sinon.stub(console, 'warn');
  });

  afterEach(function () {
    sinon.restore();
  });

  function makeCoin(chain: string): TestEvmCoin {
    return new TestEvmCoin(bitgo, coins.get(chain));
  }

  function makeTokenCoin(tokenChain: string, baseChain: string): TestEvmCoin {
    // Mirror EthLikeToken / Erc20Token: staticsCoin is the base chain (with EIP-1559), while
    // getChain() returns the token's statics name (e.g. 'arbeth:usdt') and getBaseChain() returns
    // the base chain ('arbeth').
    return new TestEvmCoin(bitgo, coins.get(baseChain), {
      chainOverride: tokenChain,
      baseChainOverride: baseChain,
    });
  }

  function buildRawEip1559Tx(
    coin: TestEvmCoin,
    { to, value = '0', data = '0x' }: { to: string; value?: string; data?: string }
  ): string {
    const chainId = (coin.getNetwork() as EthereumNetwork).chainId;
    const common = AbstractEthLikeNewCoins.getCustomChainCommon(chainId);
    const tx = FeeMarketEIP1559Transaction.fromTxData(
      {
        nonce: 1,
        maxPriorityFeePerGas: 10,
        maxFeePerGas: 100,
        gasLimit: 100000,
        to,
        value: '0x' + BigInt(value).toString(16),
        data,
        chainId,
      },
      { common }
    );
    return '0x' + tx.serialize().toString('hex');
  }

  function buildBridgeCalldata({
    version = 1,
    actionId = 6,
    destination = systemAddress,
    tokenId = 150,
    scaledAmount = '2100000',
    extraInnerHex = '',
    extraOuterHex = '',
  }: {
    version?: number;
    actionId?: number;
    destination?: string;
    tokenId?: number;
    scaledAmount?: string;
    extraInnerHex?: string;
    extraOuterHex?: string;
  } = {}): string {
    const encodedArgs = EthereumAbi.rawEncode(['address', 'uint64', 'uint64'], [destination, tokenId, scaledAmount]);
    const header = Buffer.from([version & 0xff, (actionId >> 16) & 0xff, (actionId >> 8) & 0xff, actionId & 0xff]);
    const payload = Buffer.concat([header, encodedArgs, Buffer.from(extraInnerHex, 'hex')]);
    const selector = EthereumAbi.methodID('sendRawAction', ['bytes']);
    const encodedParams = EthereumAbi.rawEncode(['bytes'], [payload]);
    return '0x' + Buffer.concat([selector, encodedParams]).toString('hex') + extraOuterHex;
  }

  async function expectMismatch(p: Promise<unknown>, pattern: RegExp): Promise<void> {
    try {
      await p;
    } catch (e) {
      e.should.be.instanceOf(TxIntentMismatchRecipientError);
      (e as Error).message.should.match(pattern);
      return;
    }
    throw new Error('expected verifyTransaction to reject');
  }

  describe('HyperEVM bridgeFunds verification', function () {
    const prodAmountWei = '21000000000000000'; // 0.021 HYPE -> 2100000 (0x200b20) at 8 decimals

    it('verifies a prod-shaped mainnet hypeevm bridgeFunds transaction (tokenId 150, CoreWriter, 18->8 scaling)', async function () {
      const hype = makeCoin('hypeevm');
      const wallet = new Wallet(bitgo, hype, { coinSpecific: { baseAddress } });
      const data = buildBridgeCalldata({ tokenId: 150, scaledAmount: '2100000' });
      const txHex = buildRawEip1559Tx(hype, { to: coreWriter, value: '0', data });

      const result = await hype.verifyTransaction({
        txParams: { type: 'bridgeFunds', intentAmount: { value: prodAmountWei, symbol: 'hypeevm' } } as never,
        txPrebuild: { txHex, coin: 'hypeevm', walletId: 'fakeWalletId' } as never,
        wallet,
        verification: {},
        walletType: 'tss',
      });
      result.should.be.true();
      warn.called.should.be.false();
    });

    it('verifies a testnet thypeevm bridgeFunds transaction using stored-intent amount field (tokenId 1105)', async function () {
      const thype = makeCoin('thypeevm');
      const wallet = new Wallet(bitgo, thype, { coinSpecific: { baseAddress } });
      // Verify truncation semantics: 123456789012345678 / 1e10 === 12345678
      const data = buildBridgeCalldata({ tokenId: 1105, scaledAmount: '12345678' });
      const txHex = buildRawEip1559Tx(thype, { to: coreWriter, value: '0', data });

      const result = await thype.verifyTransaction({
        txParams: { type: 'bridgeFunds', amount: { value: '123456789012345678', symbol: 'thypeevm' } } as never,
        txPrebuild: { txHex, coin: 'thypeevm', walletId: 'fakeWalletId' } as never,
        wallet,
        verification: {},
        walletType: 'tss',
      });
      result.should.be.true();
      warn.called.should.be.false();
    });

    it('verifies the stored-intent prod shape after real resolveEffectiveTxParams reconstruction', async function () {
      const hype = makeCoin('hypeevm');
      const wallet = new Wallet(bitgo, hype, { coinSpecific: { baseAddress } });
      const data = buildBridgeCalldata({ tokenId: 150, scaledAmount: '2100000' });
      const txHex = buildRawEip1559Tx(hype, { to: coreWriter, value: '0', data });

      // Rebuild the exact stored-intent shape (no caller txParams), as pendingApproval re-signing does.
      const txParams = resolveEffectiveTxParams(
        {
          txRequestId: 'stored-bridge-funds',
          walletId: 'fakeWalletId',
          intent: { intentType: 'bridgeFunds', amount: { symbol: 'hypeevm', value: prodAmountWei } },
        } as unknown as TxRequest,
        undefined,
        'hypeevm'
      );
      txParams.intentAmount!.should.deepEqual({ value: prodAmountWei, symbol: 'hypeevm' });

      const result = await hype.verifyTransaction({
        txParams: txParams as never,
        txPrebuild: { txHex, coin: 'hypeevm', walletId: 'fakeWalletId' } as never,
        wallet,
        verification: {},
        walletType: 'tss',
      });
      result.should.be.true();
      warn.called.should.be.false();
    });

    it('rejects a reconstructed stored intent whose signed scaled amount differs', async function () {
      const hype = makeCoin('hypeevm');
      const wallet = new Wallet(bitgo, hype, { coinSpecific: { baseAddress } });
      // Calldata bridges 2100001 units while the stored intent declared 2100000.
      const data = buildBridgeCalldata({ tokenId: 150, scaledAmount: '2100001' });
      const txHex = buildRawEip1559Tx(hype, { to: coreWriter, value: '0', data });
      const txParams = resolveEffectiveTxParams(
        {
          txRequestId: 'stored-bridge-funds',
          walletId: 'fakeWalletId',
          intent: { intentType: 'bridgeFunds', amount: { symbol: 'hypeevm', value: prodAmountWei } },
        } as unknown as TxRequest,
        undefined,
        'hypeevm'
      );

      await expectMismatch(
        hype.verifyTransaction({
          txParams: txParams as never,
          txPrebuild: { txHex, coin: 'hypeevm', walletId: 'fakeWalletId' } as never,
          wallet,
          verification: {},
          walletType: 'tss',
        }),
        /scaled amount does not match the declared amount/
      );
    });

    it('rejects zero, sub-unit dust, and uint64-overflow declared amounts', async function () {
      const hype = makeCoin('hypeevm');
      const wallet = new Wallet(bitgo, hype, { coinSpecific: { baseAddress } });
      const data = buildBridgeCalldata({ tokenId: 150, scaledAmount: '2100000' });
      const txHex = buildRawEip1559Tx(hype, { to: coreWriter, value: '0', data });
      const verifyAmount = (value: string) =>
        hype.verifyTransaction({
          txParams: { type: 'bridgeFunds', intentAmount: { value, symbol: 'hypeevm' } } as never,
          txPrebuild: { txHex, coin: 'hypeevm', walletId: 'fakeWalletId' } as never,
          wallet,
          verification: {},
          walletType: 'tss',
        });

      // Zero, 1 wei, and just under one 8-decimal HyperCore unit all truncate to 0.
      await expectMismatch(verifyAmount('0'), /at least one HyperCore unit/);
      await expectMismatch(verifyAmount('1'), /at least one HyperCore unit/);
      await expectMismatch(verifyAmount('9999999999'), /at least one HyperCore unit/);
      // 2^64 units is one past the uint64 payload limit.
      await expectMismatch(verifyAmount((2n ** 64n * 10n ** 10n).toString()), /exceeds the HyperCore uint64 limit/);
    });

    it('accepts the exact uint64 scaled-amount boundary and one unit above dust', async function () {
      const hype = makeCoin('hypeevm');
      const wallet = new Wallet(bitgo, hype, { coinSpecific: { baseAddress } });
      const maxUnits = (2n ** 64n - 1n).toString();
      const verifyScaled = (scaledAmount: string) => {
        const txHex = buildRawEip1559Tx(hype, {
          to: coreWriter,
          value: '0',
          data: buildBridgeCalldata({ tokenId: 150, scaledAmount }),
        });
        return hype.verifyTransaction({
          txParams: {
            type: 'bridgeFunds',
            intentAmount: { value: (BigInt(scaledAmount) * 10n ** 10n).toString(), symbol: 'hypeevm' },
          } as never,
          txPrebuild: { txHex, coin: 'hypeevm', walletId: 'fakeWalletId' } as never,
          wallet,
          verification: {},
          walletType: 'tss',
        });
      };

      (await verifyScaled(maxUnits)).should.be.true();
      (await verifyScaled('1')).should.be.true();
    });

    it('rejects wrong contract, nonzero native value, wrong header, wrong destination, wrong tokenId, wrong amount, and non-canonical bytes', async function () {
      const hype = makeCoin('hypeevm');
      const wallet = new Wallet(bitgo, hype, { coinSpecific: { baseAddress } });
      const verifyBridge = (
        txHex: string,
        txParams: Record<string, unknown> = {
          type: 'bridgeFunds',
          intentAmount: { value: prodAmountWei, symbol: 'hypeevm' },
        }
      ) =>
        hype.verifyTransaction({
          txParams: txParams as never,
          txPrebuild: { txHex, coin: 'hypeevm', walletId: 'fakeWalletId' } as never,
          wallet,
          verification: {},
          walletType: 'tss',
        });

      const validData = buildBridgeCalldata({ tokenId: 150, scaledAmount: '2100000' });

      // Wrong destination contract (not CoreWriter 0x3333...3333)
      await expectMismatch(
        verifyBridge(buildRawEip1559Tx(hype, { to: attacker, value: '0', data: validData })),
        /not sent to the HyperEVM CoreWriter contract/
      );
      // Nonzero native value
      await expectMismatch(
        verifyBridge(buildRawEip1559Tx(hype, { to: coreWriter, value: '1', data: validData })),
        /must not carry native value/
      );
      // Wrong outer selector
      const wrongSelectorData =
        '0x' +
        Buffer.concat([
          EthereumAbi.methodID('transfer', ['address', 'uint256']),
          EthereumAbi.rawEncode(['address', 'uint256'], [attacker, '100']),
        ]).toString('hex');
      await expectMismatch(
        verifyBridge(buildRawEip1559Tx(hype, { to: coreWriter, value: '0', data: wrongSelectorData })),
        /must use sendRawAction\(bytes\)/
      );
      // Wrong version byte
      await expectMismatch(
        verifyBridge(buildRawEip1559Tx(hype, { to: coreWriter, data: buildBridgeCalldata({ version: 2 }) })),
        /payload header must be version 1 and actionId 6/
      );
      // Wrong actionId (e.g. actionId 7 instead of 6)
      await expectMismatch(
        verifyBridge(buildRawEip1559Tx(hype, { to: coreWriter, data: buildBridgeCalldata({ actionId: 7 }) })),
        /payload header must be version 1 and actionId 6/
      );
      // Wrong bridge destination (attacker instead of systemAddress 0x2222...2222)
      await expectMismatch(
        verifyBridge(buildRawEip1559Tx(hype, { to: coreWriter, data: buildBridgeCalldata({ destination: attacker }) })),
        /destination does not match the HyperEVM system address/
      );
      // Wrong tokenId (testnet 1105 on mainnet hypeevm)
      await expectMismatch(
        verifyBridge(buildRawEip1559Tx(hype, { to: coreWriter, data: buildBridgeCalldata({ tokenId: 1105 }) })),
        /tokenId does not match/
      );
      // Wrong scaled amount
      await expectMismatch(
        verifyBridge(
          buildRawEip1559Tx(hype, { to: coreWriter, data: buildBridgeCalldata({ scaledAmount: '2100001' }) })
        ),
        /scaled amount does not match/
      );
      // Extra trailing bytes inside inner payload
      await expectMismatch(
        verifyBridge(buildRawEip1559Tx(hype, { to: coreWriter, data: buildBridgeCalldata({ extraInnerHex: '00' }) })),
        /payload has invalid length/
      );
      // Extra trailing bytes after outer ABI encoding
      await expectMismatch(
        verifyBridge(
          buildRawEip1559Tx(hype, { to: coreWriter, data: buildBridgeCalldata({ extraOuterHex: '00'.repeat(32) }) })
        ),
        /not canonical/
      );
      // Missing amount in txParams
      await expectMismatch(
        verifyBridge(buildRawEip1559Tx(hype, { to: coreWriter, data: validData }), { type: 'bridgeFunds' }),
        /requires a declared amount/
      );
      // Wrong symbol in txParams
      await expectMismatch(
        verifyBridge(buildRawEip1559Tx(hype, { to: coreWriter, data: validData }), {
          type: 'bridgeFunds',
          intentAmount: { value: prodAmountWei, symbol: 'thypeevm' },
        }),
        /declared symbol 'thypeevm' does not match chain 'hypeevm'/
      );
      // Non-empty contradictory txParams.recipients must fail closed
      await expectMismatch(
        verifyBridge(buildRawEip1559Tx(hype, { to: coreWriter, data: validData }), {
          type: 'bridgeFunds',
          intentAmount: { value: prodAmountWei, symbol: 'hypeevm' },
          recipients: [{ address: attacker, amount: prodAmountWei }],
        }),
        /bridgeFunds transaction must not declare recipients/
      );
    });
  });

  describe('Hedera EVM (hbarevm) HTS NFT transferFrom handling', function () {
    const htsNftContract = '0x00000000000000000000000000000000007ac203';
    const htsErc20Contract = '0x0000000000000000000000000000000000728a62'; // thbarevm:hbarnativetoken (registered Erc20Coin)

    const transferFromData = (from: string, to: string, idOrAmount: string) =>
      '0x' +
      Buffer.concat([
        EthereumAbi.methodID('transferFrom', ['address', 'address', 'uint256']),
        EthereumAbi.rawEncode(['address', 'address', 'uint256'], [from, to, idOrAmount]),
      ]).toString('hex');

    it('warns on HTS NFT transferFrom on thbarevm when targeting an NFT contract with zero native value', async function () {
      const thbarevm = makeCoin('thbarevm');
      const wallet = new Wallet(bitgo, thbarevm, { coinSpecific: { baseAddress } });
      const txHex = buildRawEip1559Tx(thbarevm, {
        to: htsNftContract,
        value: '0',
        data: transferFromData(baseAddress, recipient, '1'),
      });

      const result = await thbarevm.verifyTransaction({
        txParams: {
          type: 'transferToken',
          recipients: [
            {
              address: recipient,
              amount: '0',
              tokenData: {
                tokenType: 'ERC721',
                tokenQuantity: '1',
                tokenId: '1',
                tokenContractAddress: htsNftContract,
              },
            },
          ],
        } as never,
        txPrebuild: { txHex, coin: 'thbarevm', walletId: 'fakeWalletId' } as never,
        wallet,
        verification: {},
        walletType: 'tss',
      });
      result.should.be.true();
      warn
        .getCalls()
        .some((call) => /NFT token transfer \(ERC721\)/.test(String(call.args[0])))
        .should.be.true();
    });

    it('rejects transferFrom targeting a registered ERC-20 contract even on thbarevm', async function () {
      const thbarevm = makeCoin('thbarevm');
      const wallet = new Wallet(bitgo, thbarevm, { coinSpecific: { baseAddress } });
      const txHex = buildRawEip1559Tx(thbarevm, {
        to: htsErc20Contract,
        value: '0',
        data: transferFromData(baseAddress, attacker, '999999'),
      });

      await expectMismatch(
        thbarevm.verifyTransaction({
          txParams: {
            type: 'transferToken',
            recipients: [
              {
                address: recipient,
                amount: '0',
                tokenData: {
                  tokenType: 'ERC721',
                  tokenQuantity: '1',
                  tokenId: '1',
                  tokenContractAddress: htsErc20Contract,
                },
              },
            ],
          } as never,
          txPrebuild: { txHex, coin: 'thbarevm', walletId: 'fakeWalletId' } as never,
          wallet,
          verification: {},
          walletType: 'tss',
        }),
        /canonical NFT safeTransferFrom/
      );
    });

    it('never warns-only for an unregistered contract without a positive NFT classification', async function () {
      // Same NFT-shaped calldata, but the intent declares no tokenType and no resolvable token:
      // "not a registered ERC-20" must not be enough to inherit the warn-only path.
      const hbarevm = makeCoin('hbarevm');
      const wallet = new Wallet(bitgo, hbarevm, { coinSpecific: { baseAddress } });
      const txHex = buildRawEip1559Tx(hbarevm, {
        to: htsNftContract,
        value: '0',
        data: transferFromData(baseAddress, recipient, '1'),
      });

      await expectMismatch(
        hbarevm.verifyTransaction({
          txParams: { type: 'transferToken', recipients: [{ address: recipient, amount: '0' }] } as never,
          txPrebuild: { txHex, coin: 'hbarevm', walletId: 'fakeWalletId' } as never,
          wallet,
          verification: {},
          walletType: 'tss',
        }),
        /requires a declared ERC-20 token/
      );
      warn.called.should.be.false();
    });

    it('rejects an NFT transfer whose signed recipient differs from the declared recipient', async function () {
      const hbarevm = makeCoin('hbarevm');
      const wallet = new Wallet(bitgo, hbarevm, { coinSpecific: { baseAddress } });
      const txHex = buildRawEip1559Tx(hbarevm, {
        to: htsNftContract,
        value: '0',
        data: transferFromData(baseAddress, attacker, '1'),
      });

      await expectMismatch(
        hbarevm.verifyTransaction({
          txParams: {
            type: 'transferToken',
            recipients: [
              {
                address: recipient,
                amount: '0',
                tokenData: {
                  tokenType: 'ERC721',
                  tokenQuantity: '1',
                  tokenId: '1',
                  tokenContractAddress: htsNftContract,
                },
              },
            ],
          } as never,
          txPrebuild: { txHex, coin: 'hbarevm', walletId: 'fakeWalletId' } as never,
          wallet,
          verification: {},
          walletType: 'tss',
        }),
        /NFT transferToken destination address does not match the recipient address/
      );
    });

    it('requires the calldata form of the declared NFT standard', async function () {
      const hbarevm = makeCoin('hbarevm');
      const wallet = new Wallet(bitgo, hbarevm, { coinSpecific: { baseAddress } });
      // A declared ERC-1155 must not be verified against the 3-argument ERC-721 form.
      const txHex = buildRawEip1559Tx(hbarevm, {
        to: htsNftContract,
        value: '0',
        data: transferFromData(baseAddress, recipient, '1'),
      });

      await expectMismatch(
        hbarevm.verifyTransaction({
          txParams: {
            type: 'transferToken',
            recipients: [
              {
                address: recipient,
                amount: '0',
                tokenData: {
                  tokenType: 'ERC1155',
                  tokenQuantity: '1',
                  tokenId: '1',
                  tokenContractAddress: htsNftContract,
                },
              },
            ],
          } as never,
          txPrebuild: { txHex, coin: 'hbarevm', walletId: 'fakeWalletId' } as never,
          wallet,
          verification: {},
          walletType: 'tss',
        }),
        /canonical NFT safeTransferFrom/
      );
    });

    it('rejects a Hedera transferFrom whose sender is not the wallet base address', async function () {
      const hbarevm = makeCoin('hbarevm');
      const wallet = new Wallet(bitgo, hbarevm, { coinSpecific: { baseAddress } });
      // Contract and recipient both match the declaration; only arg 0 is someone else's address.
      const txHex = buildRawEip1559Tx(hbarevm, {
        to: htsNftContract,
        value: '0',
        data: transferFromData(attacker, recipient, '1'),
      });

      await expectMismatch(
        hbarevm.verifyTransaction({
          txParams: {
            type: 'transferToken',
            recipients: [
              {
                address: recipient,
                amount: '0',
                tokenData: {
                  tokenType: 'ERC721',
                  tokenQuantity: '1',
                  tokenId: '1',
                  tokenContractAddress: htsNftContract,
                },
              },
            ],
          } as never,
          txPrebuild: { txHex, coin: 'hbarevm', walletId: 'fakeWalletId' } as never,
          wallet,
          verification: {},
          walletType: 'tss',
        }),
        /NFT transferToken sender does not match wallet base address/
      );
      warn.called.should.be.false();
    });

    it('rejects a Hedera transferFrom when the wallet has no base address to bind the sender against', async function () {
      const hbarevm = makeCoin('hbarevm');
      const wallet = new Wallet(bitgo, hbarevm, { coinSpecific: {} });
      const txHex = buildRawEip1559Tx(hbarevm, {
        to: htsNftContract,
        value: '0',
        data: transferFromData(baseAddress, recipient, '1'),
      });

      await expectMismatch(
        hbarevm.verifyTransaction({
          txParams: {
            type: 'transferToken',
            recipients: [
              {
                address: recipient,
                amount: '0',
                tokenData: {
                  tokenType: 'ERC721',
                  tokenQuantity: '1',
                  tokenId: '1',
                  tokenContractAddress: htsNftContract,
                },
              },
            ],
          } as never,
          txPrebuild: { txHex, coin: 'hbarevm', walletId: 'fakeWalletId' } as never,
          wallet,
          verification: {},
          walletType: 'tss',
        }),
        /NFT transferToken requires a wallet base address to bind the sender/
      );
      warn.called.should.be.false();
    });
  });

  describe('Cross-network token resolution & bare-symbol binding (CECHO-2690 P0)', function () {
    const arbethUsdtContract = '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9';
    const ethUsdtContract = '0xdac17f958d2ee523a2206206994597c13d831ec7';
    const arbethUsdcContract = '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8';
    const tokenQuantity = '1000000';

    const erc20TransferData = (to: string, amount: string) =>
      '0x' +
      Buffer.concat([
        EthereumAbi.methodID('transfer', ['address', 'uint256']),
        EthereumAbi.rawEncode(['address', 'uint256'], [to, amount]),
      ]).toString('hex');

    it('resolves stored bare symbol usdt to Arbitrum USDT (not Ethereum USDT) on arbeth:usdt token wallet', async function () {
      const arbethUsdt = makeTokenCoin('arbeth:usdt', 'arbeth');
      const wallet = new Wallet(bitgo, arbethUsdt, { coinSpecific: { baseAddress } });
      const txHex = buildRawEip1559Tx(arbethUsdt, {
        to: arbethUsdtContract,
        value: '0',
        data: erc20TransferData(recipient, tokenQuantity),
      });

      const txParams = resolveEffectiveTxParams(
        {
          txRequestId: 'stored-arbeth-usdt',
          walletId: 'fakeWalletId',
          intent: {
            intentType: 'transferToken',
            recipients: [
              {
                address: { address: recipient },
                amount: { value: '0', symbol: 'usdt' },
                tokenData: { tokenName: 'usdt', tokenQuantity, tokenType: 'ERC20' },
              },
            ],
          },
        } as unknown as TxRequest,
        undefined,
        arbethUsdt.getChain()
      );

      const result = await arbethUsdt.verifyTransaction({
        txParams: txParams as never,
        txPrebuild: { txHex, coin: 'arbeth:usdt', walletId: 'fakeWalletId' } as never,
        wallet,
        verification: {},
        walletType: 'tss',
      });
      result.should.be.true();
      warn.called.should.be.false();
    });

    it('resolves stored bare symbol usdt to Arbitrum USDT on base arbeth coin', async function () {
      const arbeth = makeCoin('arbeth');
      const wallet = new Wallet(bitgo, arbeth, { coinSpecific: { baseAddress } });
      const txHex = buildRawEip1559Tx(arbeth, {
        to: arbethUsdtContract,
        value: '0',
        data: erc20TransferData(recipient, tokenQuantity),
      });

      const txParams = resolveEffectiveTxParams(
        {
          txRequestId: 'stored-arbeth-base-usdt',
          walletId: 'fakeWalletId',
          intent: {
            intentType: 'transferToken',
            recipients: [
              {
                address: { address: recipient },
                amount: { value: '0', symbol: 'usdt' },
                tokenData: { tokenName: 'usdt', tokenQuantity, tokenType: 'ERC20' },
              },
            ],
          },
        } as unknown as TxRequest,
        undefined,
        'arbeth'
      );

      const result = await arbeth.verifyTransaction({
        txParams: txParams as never,
        txPrebuild: { txHex, coin: 'arbeth', walletId: 'fakeWalletId' } as never,
        wallet,
        verification: {},
        walletType: 'tss',
      });
      result.should.be.true();
      warn.called.should.be.false();
    });

    it('rejects Ethereum USDT contract when signing on arbeth', async function () {
      const arbeth = makeCoin('arbeth');
      const wallet = new Wallet(bitgo, arbeth, { coinSpecific: { baseAddress } });
      const txHex = buildRawEip1559Tx(arbeth, {
        to: ethUsdtContract,
        value: '0',
        data: erc20TransferData(recipient, tokenQuantity),
      });

      await expectMismatch(
        arbeth.verifyTransaction({
          txParams: {
            type: 'transferToken',
            recipients: [
              {
                address: recipient,
                amount: '0',
                tokenData: { tokenName: 'usdt', tokenQuantity, tokenType: 'ERC20' },
              },
            ],
          } as never,
          txPrebuild: { txHex, coin: 'arbeth', walletId: 'fakeWalletId' } as never,
          wallet,
          verification: {},
          walletType: 'tss',
        }),
        /not sent to the declared token contract/
      );

      // Explicit cross-network contract address is also rejected
      await expectMismatch(
        arbeth.verifyTransaction({
          txParams: {
            type: 'transferToken',
            recipients: [
              {
                address: recipient,
                amount: '0',
                tokenData: {
                  tokenName: 'usdt',
                  tokenQuantity,
                  tokenType: 'ERC20',
                  tokenContractAddress: ethUsdtContract,
                },
              },
            ],
          } as never,
          txPrebuild: { txHex, coin: 'arbeth', walletId: 'fakeWalletId' } as never,
          wallet,
          verification: {},
          walletType: 'tss',
        }),
        /declared tokenContractAddress does not match/
      );
    });

    it('rejects a mismatched bare symbol (usdc) or unknown bare symbol on an arbeth:usdt token wallet', async function () {
      const arbethUsdt = makeTokenCoin('arbeth:usdt', 'arbeth');
      const wallet = new Wallet(bitgo, arbethUsdt, { coinSpecific: { baseAddress } });
      const txToUsdt = buildRawEip1559Tx(arbethUsdt, {
        to: arbethUsdtContract,
        value: '0',
        data: erc20TransferData(recipient, tokenQuantity),
      });
      const txToUsdc = buildRawEip1559Tx(arbethUsdt, {
        to: arbethUsdcContract,
        value: '0',
        data: erc20TransferData(recipient, tokenQuantity),
      });

      // Mismatched bare symbol 'usdc' on an 'arbeth:usdt' wallet must be rejected even if tx calls arbeth:usdt or arbeth:usdc
      for (const txHex of [txToUsdt, txToUsdc]) {
        await expectMismatch(
          arbethUsdt.verifyTransaction({
            txParams: {
              type: 'transferToken',
              recipients: [
                {
                  address: recipient,
                  amount: '0',
                  tokenData: { tokenName: 'usdc', tokenQuantity, tokenType: 'ERC20' },
                },
              ],
            } as never,
            txPrebuild: { txHex, coin: 'arbeth:usdt', walletId: 'fakeWalletId' } as never,
            wallet,
            verification: {},
            walletType: 'tss',
          }),
          /does not match signing token 'arbeth:usdt'/
        );
      }

      // Unknown bare symbol must NOT silently fall back to the signing token
      await expectMismatch(
        arbethUsdt.verifyTransaction({
          txParams: {
            type: 'transferToken',
            recipients: [
              {
                address: recipient,
                amount: '0',
                tokenData: { tokenName: 'notatoken', tokenQuantity, tokenType: 'ERC20' },
              },
            ],
          } as never,
          txPrebuild: { txHex: txToUsdt, coin: 'arbeth:usdt', walletId: 'fakeWalletId' } as never,
          wallet,
          verification: {},
          walletType: 'tss',
        }),
        /cannot be resolved to a contract on this network/
      );
    });
  });

  describe('Known token conflicts fail closed on every TSS path (CECHO-2690 P1 #1)', function () {
    const arbethUsdcContract = '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8';
    const arbethBatcher = (coins.get('arbeth').network as EthereumNetwork).batcherContractAddress as string;

    const erc20TransferData = (to: string, amount: string) =>
      '0x' +
      Buffer.concat([
        EthereumAbi.methodID('transfer', ['address', 'uint256']),
        EthereumAbi.rawEncode(['address', 'uint256'], [to, amount]),
      ]).toString('hex');
    const batchTransferFromData = (token: string, addresses: string[], amounts: string[]) =>
      '0x' +
      Buffer.concat([
        EthereumAbi.methodID('batchTransferFrom', ['address', 'address[]', 'uint256[]']),
        EthereumAbi.rawEncode(['address', 'address[]', 'uint256[]'], [token, addresses, amounts]),
      ]).toString('hex');

    it('rejects a single payment whose declared token differs from the signing token', async function () {
      const arbethUsdt = makeTokenCoin('arbeth:usdt', 'arbeth');
      const wallet = new Wallet(bitgo, arbethUsdt, { coinSpecific: { baseAddress } });
      const txHex = buildRawEip1559Tx(arbethUsdt, {
        to: arbethUsdcContract,
        value: '0',
        data: erc20TransferData(recipient, '1000000'),
      });

      await expectMismatch(
        arbethUsdt.verifyTransaction({
          txParams: {
            type: 'transfer',
            recipients: [{ address: recipient, amount: '1000000', tokenName: 'arbeth:usdc' }],
          } as never,
          txPrebuild: { txHex, coin: 'arbeth:usdt', walletId: 'fakeWalletId' } as never,
          wallet,
          verification: {},
          walletType: 'tss',
        }),
        /does not match signing token 'arbeth:usdt'/
      );
    });

    it('rejects a single payment declaring a token that statics only knows on another network', async function () {
      const arbeth = makeCoin('arbeth');
      const wallet = new Wallet(bitgo, arbeth, { coinSpecific: { baseAddress } });
      const txHex = buildRawEip1559Tx(arbeth, { to: recipient, value: '1000' });

      await expectMismatch(
        arbeth.verifyTransaction({
          txParams: {
            type: 'transfer',
            recipients: [{ address: recipient, amount: '1000', tokenName: 'erc721:witch' }],
          } as never,
          txPrebuild: { txHex, coin: 'arbeth', walletId: 'fakeWalletId' } as never,
          wallet,
          verification: {},
          walletType: 'tss',
        }),
        /cannot be resolved to a contract on this network/
      );
    });

    it('rejects a batch payment whose declared token differs from the signing token', async function () {
      const arbethUsdt = makeTokenCoin('arbeth:usdt', 'arbeth');
      const wallet = new Wallet(bitgo, arbethUsdt, { coinSpecific: { baseAddress } });
      const txHex = buildRawEip1559Tx(arbethUsdt, {
        to: arbethBatcher,
        value: '0',
        data: batchTransferFromData(arbethUsdcContract, [recipient, attacker], ['1000', '2000']),
      });

      await expectMismatch(
        arbethUsdt.verifyTransaction({
          txParams: {
            type: 'transfer',
            recipients: [
              { address: recipient, amount: '1000', tokenName: 'arbeth:usdc' },
              { address: attacker, amount: '2000', tokenName: 'arbeth:usdc' },
            ],
          } as never,
          txPrebuild: { txHex, coin: 'arbeth:usdt', walletId: 'fakeWalletId' } as never,
          wallet,
          verification: {},
          walletType: 'tss',
        }),
        /does not match signing token 'arbeth:usdt'/
      );
    });

    it('rejects a token consolidation whose declared token differs from the signing token', async function () {
      const arbethUsdt = makeTokenCoin('arbeth:usdt', 'arbeth');
      const wallet = new Wallet(bitgo, arbethUsdt, { coinSpecific: { baseAddress } });
      const txHex = buildRawEip1559Tx(arbethUsdt, {
        to: arbethUsdcContract,
        value: '0',
        data: erc20TransferData(baseAddress, '1000'),
      });

      await expectMismatch(
        arbethUsdt.verifyTransaction({
          txParams: { type: 'consolidateToken', tokenName: 'arbeth:usdc' } as never,
          txPrebuild: { txHex, coin: 'arbeth:usdt', walletId: 'fakeWalletId' } as never,
          wallet,
          verification: {},
          walletType: 'tss',
        }),
        /Consolidation token declaration is invalid: .*does not match signing token 'arbeth:usdt'/
      );
    });
  });

  describe('NFT warn-only contract binding & same-network enforcement (CECHO-2690 P1 #2)', function () {
    const hoodiNftContract = '0x8397b091514c1f7bebb9dea6ac267ea23b570605'; // terc721:bitgoerc721 (Hoodi)
    const ethNftContract = '0x5180db8f5c931aae63c74266b211f580155ecac8'; // erc721:witch (Ethereum mainnet)

    const safeTransferFromData = (from: string, to: string, tokenId: string) =>
      '0x' +
      Buffer.concat([
        EthereumAbi.methodID('safeTransferFrom', ['address', 'address', 'uint256']),
        EthereumAbi.rawEncode(['address', 'address', 'uint256'], [from, to, tokenId]),
      ]).toString('hex');

    it('rejects NFT transferToken without any concrete same-network contract address', async function () {
      const hteth = makeCoin('hteth');
      const wallet = new Wallet(bitgo, hteth, { coinSpecific: { baseAddress } });
      const txHex = buildRawEip1559Tx(hteth, {
        to: hoodiNftContract,
        value: '0',
        data: safeTransferFromData(baseAddress, recipient, '42'),
      });

      // Declared tokenType: 'ERC721' with no contract address
      await expectMismatch(
        hteth.verifyTransaction({
          txParams: {
            type: 'transferToken',
            recipients: [
              {
                address: recipient,
                amount: '0',
                tokenData: { tokenType: 'ERC721', tokenQuantity: '1', tokenId: '42' },
              },
            ],
          } as never,
          txPrebuild: { txHex, coin: 'hteth', walletId: 'fakeWalletId' } as never,
          wallet,
          verification: {},
          walletType: 'tss',
        }),
        /requires a declared or registered same-network contract address/
      );
      warn.called.should.be.false();

      // Generic statics NFT placeholder (`terc721:token` has non-hex contract `0xterc721:token`) without declared contract
      await expectMismatch(
        hteth.verifyTransaction({
          txParams: {
            type: 'transferToken',
            recipients: [
              {
                address: recipient,
                amount: '0',
                tokenData: { tokenName: 'terc721:token', tokenQuantity: '1', tokenId: '42' },
              },
            ],
          } as never,
          txPrebuild: { txHex, coin: 'hteth', walletId: 'fakeWalletId' } as never,
          wallet,
          verification: {},
          walletType: 'tss',
        }),
        /requires a declared or registered same-network contract address/
      );
      warn.called.should.be.false();
    });

    it('rejects a cross-network statics NFT name (erc721:witch on hteth)', async function () {
      const hteth = makeCoin('hteth');
      const wallet = new Wallet(bitgo, hteth, { coinSpecific: { baseAddress } });
      const txHex = buildRawEip1559Tx(hteth, {
        to: ethNftContract,
        value: '0',
        data: safeTransferFromData(baseAddress, recipient, '42'),
      });

      // Without tokenType: must NOT classify as NFT from a cross-network statics coin
      await expectMismatch(
        hteth.verifyTransaction({
          txParams: {
            type: 'transferToken',
            recipients: [
              {
                address: recipient,
                amount: '0',
                tokenData: { tokenName: 'erc721:witch', tokenQuantity: '1', tokenId: '42' },
              },
            ],
          } as never,
          txPrebuild: { txHex, coin: 'hteth', walletId: 'fakeWalletId' } as never,
          wallet,
          verification: {},
          walletType: 'tss',
        }),
        /cannot be resolved to a contract on this network/
      );
      warn.called.should.be.false();

      // With tokenType: 'ERC721' and cross-network tokenName: must still fail closed
      await expectMismatch(
        hteth.verifyTransaction({
          txParams: {
            type: 'transferToken',
            recipients: [
              {
                address: recipient,
                amount: '0',
                tokenData: {
                  tokenType: 'ERC721',
                  tokenName: 'erc721:witch',
                  tokenContractAddress: ethNftContract,
                  tokenQuantity: '1',
                  tokenId: '42',
                },
              },
            ],
          } as never,
          txPrebuild: { txHex, coin: 'hteth', walletId: 'fakeWalletId' } as never,
          wallet,
          verification: {},
          walletType: 'tss',
        }),
        /does not belong to this network/
      );
      warn.called.should.be.false();
    });

    it('warns and passes for a same-network statics NFT with matching contract, recipient, canonical calldata, and zero value', async function () {
      const hteth = makeCoin('hteth');
      const wallet = new Wallet(bitgo, hteth, { coinSpecific: { baseAddress } });
      const txHex = buildRawEip1559Tx(hteth, {
        to: hoodiNftContract,
        value: '0',
        data: safeTransferFromData(baseAddress, recipient, '42'),
      });

      const result = await hteth.verifyTransaction({
        txParams: {
          type: 'transferToken',
          recipients: [
            {
              address: recipient,
              amount: '0',
              tokenData: { tokenName: 'terc721:bitgoerc721', tokenQuantity: '1', tokenId: '42' },
            },
          ],
        } as never,
        txPrebuild: { txHex, coin: 'hteth', walletId: 'fakeWalletId' } as never,
        wallet,
        verification: {},
        walletType: 'tss',
      });
      result.should.be.true();
      warn
        .getCalls()
        .some((call) => /NFT token transfer \(ERC721\)/.test(String(call.args[0])))
        .should.be.true();

      // Same statics NFT name targeting a different contract must fail closed
      const wrongContractTx = buildRawEip1559Tx(hteth, {
        to: attacker,
        value: '0',
        data: safeTransferFromData(baseAddress, recipient, '42'),
      });
      await expectMismatch(
        hteth.verifyTransaction({
          txParams: {
            type: 'transferToken',
            recipients: [
              {
                address: recipient,
                amount: '0',
                tokenData: { tokenName: 'terc721:bitgoerc721', tokenQuantity: '1', tokenId: '42' },
              },
            ],
          } as never,
          txPrebuild: { txHex: wrongContractTx, coin: 'hteth', walletId: 'fakeWalletId' } as never,
          wallet,
          verification: {},
          walletType: 'tss',
        }),
        /not sent to the declared contract/
      );
    });

    it('never infers an NFT classification from a contract-only match on a same-type network (Hoodi NFT on teth)', async function () {
      // No tokenName: only the contract address is declared, and `getToken` matches any testnet. The
      // foreign statics entry must not classify the contract as an NFT, so the declared contract is
      // bound as an (unregistered) ERC-20 and the NFT-shaped calldata fails closed.
      const teth = makeCoin('teth');
      const wallet = new Wallet(bitgo, teth, { coinSpecific: { baseAddress } });
      const txHex = buildRawEip1559Tx(teth, {
        to: hoodiNftContract,
        value: '0',
        data: safeTransferFromData(baseAddress, recipient, '42'),
      });

      await expectMismatch(
        teth.verifyTransaction({
          txParams: {
            type: 'transferToken',
            recipients: [
              {
                address: recipient,
                amount: '0',
                tokenData: { tokenContractAddress: hoodiNftContract, tokenQuantity: '1', tokenId: '42' },
              },
            ],
          } as never,
          txPrebuild: { txHex, coin: 'teth', walletId: 'fakeWalletId' } as never,
          wallet,
          verification: {},
          walletType: 'tss',
        }),
        /transferToken calldata must use ERC-20 transfer\(address,uint256\)/
      );
      warn.called.should.be.false();
    });
  });

  describe('NFT sender binding (CECHO-2690 review)', function () {
    const hoodiNftContract = '0x8397b091514c1f7bebb9dea6ac267ea23b570605'; // terc721:bitgoerc721 (Hoodi)

    const safeTransferFromData = (from: string, to: string, tokenId: string) =>
      '0x' +
      Buffer.concat([
        EthereumAbi.methodID('safeTransferFrom', ['address', 'address', 'uint256']),
        EthereumAbi.rawEncode(['address', 'address', 'uint256'], [from, to, tokenId]),
      ]).toString('hex');

    const nftTxParams = {
      type: 'transferToken',
      recipients: [
        {
          address: recipient,
          amount: '0',
          tokenData: { tokenName: 'terc721:bitgoerc721', tokenQuantity: '1', tokenId: '42' },
        },
      ],
    };

    it('accepts a canonical NFT transfer whose sender is the wallet base address (case-insensitive)', async function () {
      const hteth = makeCoin('hteth');
      // ABI encoding lowercases addresses, so the mixed-case value has to sit on the wallet metadata
      // side: the calldata carries the lowercase base address and the verifier must lower-case the
      // wallet's checksum-cased base address before comparing.
      const wallet = new Wallet(bitgo, hteth, {
        coinSpecific: { baseAddress: '0x174CFD823AF8ce27ED0Afee3FCF3c3ba259116bE' },
      });
      const txHex = buildRawEip1559Tx(hteth, {
        to: hoodiNftContract,
        value: '0',
        data: safeTransferFromData(baseAddress, recipient, '42'),
      });

      const result = await hteth.verifyTransaction({
        txParams: nftTxParams as never,
        txPrebuild: { txHex, coin: 'hteth', walletId: 'fakeWalletId' } as never,
        wallet,
        verification: {},
        walletType: 'tss',
      });
      result.should.be.true();
      warn
        .getCalls()
        .some((call) => /NFT token transfer \(ERC721\)/.test(String(call.args[0])))
        .should.be.true();
    });

    it('rejects a canonical NFT transfer whose sender is not the wallet base address', async function () {
      const hteth = makeCoin('hteth');
      const wallet = new Wallet(bitgo, hteth, { coinSpecific: { baseAddress } });
      // Correct contract, correct recipient, canonical calldata — only `from` is a third party.
      const txHex = buildRawEip1559Tx(hteth, {
        to: hoodiNftContract,
        value: '0',
        data: safeTransferFromData(attacker, recipient, '42'),
      });

      await expectMismatch(
        hteth.verifyTransaction({
          txParams: nftTxParams as never,
          txPrebuild: { txHex, coin: 'hteth', walletId: 'fakeWalletId' } as never,
          wallet,
          verification: {},
          walletType: 'tss',
        }),
        /NFT transferToken sender does not match wallet base address/
      );
      warn.called.should.be.false();
    });

    it('rejects a canonical NFT transfer when the wallet has no base address to bind the sender against', async function () {
      const hteth = makeCoin('hteth');
      const wallet = new Wallet(bitgo, hteth, { coinSpecific: {} });
      const txHex = buildRawEip1559Tx(hteth, {
        to: hoodiNftContract,
        value: '0',
        data: safeTransferFromData(baseAddress, recipient, '42'),
      });

      await expectMismatch(
        hteth.verifyTransaction({
          txParams: nftTxParams as never,
          txPrebuild: { txHex, coin: 'hteth', walletId: 'fakeWalletId' } as never,
          wallet,
          verification: {},
          walletType: 'tss',
        }),
        /NFT transferToken requires a wallet base address to bind the sender/
      );
      warn.called.should.be.false();
    });
  });

  describe('Explicitly empty tokenName is a declaration, not an omission (CECHO-2690 P1 #3)', function () {
    const arbethUsdtContract = '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9';
    const tokenQuantity = '1000000';

    const erc20TransferData = (to: string, amount: string) =>
      '0x' +
      Buffer.concat([
        EthereumAbi.methodID('transfer', ['address', 'uint256']),
        EthereumAbi.rawEncode(['address', 'uint256'], [to, amount]),
      ]).toString('hex');

    it('rejects an explicitly empty tokenName on a native coin payment', async function () {
      const arbeth = makeCoin('arbeth');
      const wallet = new Wallet(bitgo, arbeth, { coinSpecific: { baseAddress } });
      const txHex = buildRawEip1559Tx(arbeth, { to: recipient, value: '1000' });

      await expectMismatch(
        arbeth.verifyTransaction({
          txParams: {
            type: 'transfer',
            recipients: [{ address: recipient, amount: '1000', tokenName: '' }],
          } as never,
          txPrebuild: { txHex, coin: 'arbeth', walletId: 'fakeWalletId' } as never,
          wallet,
          verification: {},
          walletType: 'tss',
        }),
        /declared tokenName is empty/
      );
    });

    it('rejects an explicitly empty tokenName on a token-scoped coin payment', async function () {
      const arbethUsdt = makeTokenCoin('arbeth:usdt', 'arbeth');
      const wallet = new Wallet(bitgo, arbethUsdt, { coinSpecific: { baseAddress } });
      const txHex = buildRawEip1559Tx(arbethUsdt, {
        to: arbethUsdtContract,
        value: '0',
        data: erc20TransferData(recipient, tokenQuantity),
      });

      await expectMismatch(
        arbethUsdt.verifyTransaction({
          txParams: {
            type: 'transfer',
            recipients: [{ address: recipient, amount: tokenQuantity, tokenName: '' }],
          } as never,
          txPrebuild: { txHex, coin: 'arbeth:usdt', walletId: 'fakeWalletId' } as never,
          wallet,
          verification: {},
          walletType: 'tss',
        }),
        /declared tokenName is empty/
      );
    });

    it('rejects an explicitly empty tokenData.tokenName on a native coin transferToken', async function () {
      const arbeth = makeCoin('arbeth');
      const wallet = new Wallet(bitgo, arbeth, { coinSpecific: { baseAddress } });
      const txHex = buildRawEip1559Tx(arbeth, {
        to: arbethUsdtContract,
        value: '0',
        data: erc20TransferData(recipient, tokenQuantity),
      });

      await expectMismatch(
        arbeth.verifyTransaction({
          txParams: {
            type: 'transferToken',
            recipients: [
              {
                address: recipient,
                amount: '0',
                tokenData: { tokenName: '', tokenQuantity, tokenType: 'ERC20' },
              },
            ],
          } as never,
          txPrebuild: { txHex, coin: 'arbeth', walletId: 'fakeWalletId' } as never,
          wallet,
          verification: {},
          walletType: 'tss',
        }),
        /transferToken declared tokenName is empty/
      );
    });

    it('rejects a whitespace-only tokenData.tokenName on a token-scoped coin transferToken', async function () {
      const arbethUsdt = makeTokenCoin('arbeth:usdt', 'arbeth');
      const wallet = new Wallet(bitgo, arbethUsdt, { coinSpecific: { baseAddress } });
      const txHex = buildRawEip1559Tx(arbethUsdt, {
        to: arbethUsdtContract,
        value: '0',
        data: erc20TransferData(recipient, tokenQuantity),
      });

      await expectMismatch(
        arbethUsdt.verifyTransaction({
          txParams: {
            type: 'transferToken',
            recipients: [
              {
                address: recipient,
                amount: '0',
                tokenData: { tokenName: '   ', tokenQuantity, tokenType: 'ERC20' },
              },
            ],
          } as never,
          txPrebuild: { txHex, coin: 'arbeth:usdt', walletId: 'fakeWalletId' } as never,
          wallet,
          verification: {},
          walletType: 'tss',
        }),
        /transferToken declared tokenName is empty/
      );
    });
  });

  describe('fillNonce receiveAddress binding (CECHO-2690 review)', function () {
    const receiveAddress = '0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed';
    // Checksummed spelling: the binding is case-insensitive against the decoded lowercase `to`.
    const checksummedReceiveAddress = '0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359';

    function verifyFillNonce(
      coin: TestEvmCoin,
      wallet: Wallet,
      txHex: string,
      txParams: Record<string, unknown>
    ): Promise<boolean> {
      return coin.verifyTransaction({
        txParams: { type: 'fillNonce', ...txParams } as never,
        txPrebuild: { txHex, coin: coin.getChain(), walletId: 'fakeWalletId' } as never,
        wallet,
        verification: {},
        walletType: 'tss',
      });
    }

    it('accepts a fillNonce self-send to the caller-declared receiveAddress', async function () {
      const arbeth = makeCoin('arbeth');
      const wallet = new Wallet(bitgo, arbeth, { coinSpecific: { baseAddress } });
      const txHex = buildRawEip1559Tx(arbeth, { to: checksummedReceiveAddress.toLowerCase(), value: '1' });

      const result = await verifyFillNonce(arbeth, wallet, txHex, { receiveAddress: checksummedReceiveAddress });
      result.should.be.true();
      warn.called.should.be.false();
    });

    it('rejects a fillNonce whose destination is not the declared receiveAddress', async function () {
      const arbeth = makeCoin('arbeth');
      const wallet = new Wallet(bitgo, arbeth, { coinSpecific: { baseAddress } });
      const txHex = buildRawEip1559Tx(arbeth, { to: baseAddress, value: '1' });

      await expectMismatch(
        verifyFillNonce(arbeth, wallet, txHex, { receiveAddress }),
        /does not match the declared receive address/
      );
    });

    it('binds a fillNonce without a declared receiveAddress to the wallet base address', async function () {
      const arbeth = makeCoin('arbeth');
      const wallet = new Wallet(bitgo, arbeth, { coinSpecific: { baseAddress } });

      const selfSendTx = buildRawEip1559Tx(arbeth, { to: baseAddress, value: '1' });
      (await verifyFillNonce(arbeth, wallet, selfSendTx, {})).should.be.true();

      const redirectedTx = buildRawEip1559Tx(arbeth, { to: attacker, value: '1' });
      await expectMismatch(verifyFillNonce(arbeth, wallet, redirectedTx, {}), /does not match wallet base address/);
    });

    it('rejects an empty or malformed declared receiveAddress instead of falling back', async function () {
      const arbeth = makeCoin('arbeth');
      const wallet = new Wallet(bitgo, arbeth, { coinSpecific: { baseAddress } });
      const txHex = buildRawEip1559Tx(arbeth, { to: baseAddress, value: '1' });

      for (const badReceiveAddress of ['', '   ', '0x1234', `0x${'g'.repeat(40)}`]) {
        await expectMismatch(
          verifyFillNonce(arbeth, wallet, txHex, { receiveAddress: badReceiveAddress }),
          /declared receiveAddress is not a valid EVM address/
        );
      }
      warn.called.should.be.false();
    });

    it('binds the stored intent receiveAddress propagated by resolveEffectiveTxParams', async function () {
      const arbeth = makeCoin('arbeth');
      const wallet = new Wallet(bitgo, arbeth, { coinSpecific: { baseAddress } });
      const txHex = buildRawEip1559Tx(arbeth, { to: receiveAddress, value: '1' });

      const txParams = resolveEffectiveTxParams(
        {
          txRequestId: 'stored-fillnonce',
          walletId: 'fakeWalletId',
          intent: { intentType: 'fillNonce', receiveAddress },
        } as unknown as TxRequest,
        undefined,
        arbeth.getChain()
      );
      txParams.receiveAddress?.should.equal(receiveAddress);

      (
        await arbeth.verifyTransaction({
          txParams: txParams as never,
          txPrebuild: { txHex, coin: 'arbeth', walletId: 'fakeWalletId' } as never,
          wallet,
          verification: {},
          walletType: 'tss',
        })
      ).should.be.true();
      warn.called.should.be.false();
    });
  });

  describe('Unregistered ERC-20 transferToken binds the declared contract (CECHO-2690 review)', function () {
    // Not in @bitgo/statics (an AMS-only or post-release token on Wallet Platform).
    const unregisteredContract = '0x8e0d6b1c0b0c9b6d9f2f0a5c1e4d3b2a1f0e9d8c';
    const tokenQuantity = '1000000';

    const erc20TransferData = (to: string, amount: string) =>
      '0x' +
      Buffer.concat([
        EthereumAbi.methodID('transfer', ['address', 'uint256']),
        EthereumAbi.rawEncode(['address', 'uint256'], [to, amount]),
      ]).toString('hex');

    function verifyTransferToken(
      coin: TestEvmCoin,
      wallet: Wallet,
      txHex: string,
      recipientParams: Record<string, unknown>
    ): Promise<boolean> {
      return coin.verifyTransaction({
        txParams: {
          type: 'transferToken',
          recipients: [{ address: recipient, amount: '0', ...recipientParams }],
        } as never,
        txPrebuild: { txHex, coin: coin.getChain(), walletId: 'fakeWalletId' } as never,
        wallet,
        verification: {},
        walletType: 'tss',
      });
    }

    it('warns and passes when the token is not in statics but declares its contract address', async function () {
      const arbeth = makeCoin('arbeth');
      const wallet = new Wallet(bitgo, arbeth, { coinSpecific: { baseAddress } });
      const txHex = buildRawEip1559Tx(arbeth, {
        to: unregisteredContract,
        value: '0',
        data: erc20TransferData(recipient, tokenQuantity),
      });

      const result = await verifyTransferToken(arbeth, wallet, txHex, {
        tokenData: {
          tokenName: 'ams:newtoken',
          tokenType: 'ERC20',
          tokenQuantity,
          tokenContractAddress: unregisteredContract,
        },
      });
      result.should.be.true();
      warn
        .getCalls()
        .some(
          (call) =>
            /transferToken/.test(String(call.args[0])) && /declared tokenContractAddress/.test(String(call.args[0]))
        )
        .should.be.true();
    });

    it('still enforces contract, calldata, recipient, amount, and zero value for an unregistered token', async function () {
      const arbeth = makeCoin('arbeth');
      const wallet = new Wallet(bitgo, arbeth, { coinSpecific: { baseAddress } });
      const tokenData = {
        tokenName: 'ams:newtoken',
        tokenType: 'ERC20',
        tokenQuantity,
        tokenContractAddress: unregisteredContract,
      };

      // Different contract than declared
      const wrongContractTx = buildRawEip1559Tx(arbeth, {
        to: attacker,
        value: '0',
        data: erc20TransferData(recipient, tokenQuantity),
      });
      await expectMismatch(
        verifyTransferToken(arbeth, wallet, wrongContractTx, { tokenData }),
        /not sent to the declared token contract/
      );

      // Native value attached
      const valueTx = buildRawEip1559Tx(arbeth, {
        to: unregisteredContract,
        value: '1',
        data: erc20TransferData(recipient, tokenQuantity),
      });
      await expectMismatch(verifyTransferToken(arbeth, wallet, valueTx, { tokenData }), /must not carry native value/);

      // Recipient in calldata differs from the declared recipient
      const wrongRecipientTx = buildRawEip1559Tx(arbeth, {
        to: unregisteredContract,
        value: '0',
        data: erc20TransferData(attacker, tokenQuantity),
      });
      await expectMismatch(
        verifyTransferToken(arbeth, wallet, wrongRecipientTx, { tokenData }),
        /destination address does not match the recipient address/
      );

      // Declared quantity differs from the calldata amount
      const wrongAmountTx = buildRawEip1559Tx(arbeth, {
        to: unregisteredContract,
        value: '0',
        data: erc20TransferData(recipient, '2000000'),
      });
      await expectMismatch(
        verifyTransferToken(arbeth, wallet, wrongAmountTx, { tokenData }),
        /does not match the declared token amount/
      );
    });

    it('still fails closed for a known cross-network token conflict despite a declared contract', async function () {
      const arbeth = makeCoin('arbeth');
      const wallet = new Wallet(bitgo, arbeth, { coinSpecific: { baseAddress } });
      const txHex = buildRawEip1559Tx(arbeth, {
        to: unregisteredContract,
        value: '0',
        data: erc20TransferData(recipient, tokenQuantity),
      });

      await expectMismatch(
        verifyTransferToken(arbeth, wallet, txHex, {
          tokenData: {
            tokenName: 'erc721:witch',
            tokenType: 'ERC20',
            tokenQuantity,
            tokenContractAddress: unregisteredContract,
          },
        }),
        /cannot be resolved to a contract on this network/
      );
      warn.called.should.be.false();
    });

    it('fails closed when the token is unresolvable and no concrete contract is declared', async function () {
      const arbeth = makeCoin('arbeth');
      const wallet = new Wallet(bitgo, arbeth, { coinSpecific: { baseAddress } });
      const txHex = buildRawEip1559Tx(arbeth, {
        to: unregisteredContract,
        value: '0',
        data: erc20TransferData(recipient, tokenQuantity),
      });

      // No contract address at all
      await expectMismatch(
        verifyTransferToken(arbeth, wallet, txHex, {
          tokenData: { tokenName: 'ams:newtoken', tokenType: 'ERC20', tokenQuantity },
        }),
        /cannot be resolved to a contract on this network/
      );

      // Malformed contract address
      await expectMismatch(
        verifyTransferToken(arbeth, wallet, txHex, {
          tokenData: {
            tokenName: 'ams:newtoken',
            tokenType: 'ERC20',
            tokenQuantity,
            tokenContractAddress: '0xdeadbeef',
          },
        }),
        /cannot be resolved to a contract on this network/
      );
      warn.called.should.be.false();
    });
  });

  describe('Fail-closed default for missing/unknown/unverified intent types (CECHO-2861)', function () {
    function makeVerifiedCoin(chain: string) {
      const coin = makeCoin(chain);
      const wallet = new Wallet(bitgo, coin, { coinSpecific: { baseAddress } });
      const txHex = buildRawEip1559Tx(coin, { to: attacker, value: '1000000000000000000' });
      return { coin, wallet, txHex };
    }

    it('rejects missing, empty, or whitespace-only intent type even when recipients are present', async function () {
      const { coin, wallet, txHex } = makeVerifiedCoin('hteth');
      const recipients = [{ address: attacker, amount: '1000000000000000000' }];

      for (const badType of [undefined, '', '   ']) {
        await expectMismatch(
          coin.verifyTransaction({
            txParams: { ...(badType !== undefined ? { type: badType } : {}), recipients } as never,
            txPrebuild: { txHex, coin: 'hteth', walletId: 'fakeWalletId' } as never,
            wallet,
            verification: {},
            walletType: 'tss',
          }),
          /requires a declared intent type/
        );
      }
      warn.called.should.be.false();
    });

    it('rejects missing intent type without recipients when stakingRequestId bypasses missing-txParams guard', async function () {
      const { coin, wallet, txHex } = makeVerifiedCoin('hteth');

      await expectMismatch(
        coin.verifyTransaction({
          txParams: { stakingRequestId: 'stake-req-1' } as never,
          txPrebuild: { txHex, coin: 'hteth', walletId: 'fakeWalletId' } as never,
          wallet,
          verification: {},
          walletType: 'tss',
        }),
        /requires a declared intent type/
      );
      warn.called.should.be.false();
    });

    it('rejects transfer and payment with empty recipients array', async function () {
      const { coin, wallet, txHex } = makeVerifiedCoin('hteth');

      for (const type of ['transfer', 'payment']) {
        await expectMismatch(
          coin.verifyTransaction({
            txParams: { type, recipients: [] } as never,
            txPrebuild: { txHex, coin: 'hteth', walletId: 'fakeWalletId' } as never,
            wallet,
            verification: {},
            walletType: 'tss',
          }),
          new RegExp(`${type} transaction requires at least one declared recipient`)
        );
      }
      warn.called.should.be.false();
    });

    it('rejects unknown/unlisted intent types and unused NO_RECIPIENT_TX_TYPES labels (direct and stored-intent paths)', async function () {
      const { coin, wallet, txHex } = makeVerifiedCoin('hteth');
      const unusedOrUnknownTypes = [
        // Unused on EVM from Sanket retest + NO_RECIPIENT_TX_TYPES
        'disableToken',
        'disabletoken',
        'unstake',
        'transferStake',
        'increaseStake',
        'goUnstake',
        'createAccount',
        'pledge',
        'deactivate',
        'authorize',
        'cantonCommand',
        'transferAccept',
        // Arbitrary / typo / prototype-property labels
        'unknownIntent',
        'acceleraton',
        ' transfer ',
        'constructor',
        'toString',
        '__proto__',
      ];

      for (const type of unusedOrUnknownTypes) {
        // Direct path with recipients present
        await expectMismatch(
          coin.verifyTransaction({
            txParams: { type, recipients: [{ address: recipient, amount: '1000' }] } as never,
            txPrebuild: { txHex, coin: 'hteth', walletId: 'fakeWalletId' } as never,
            wallet,
            verification: {},
            walletType: 'tss',
          }),
          /no TSS transaction verifier is implemented for intent type/
        );

        // Direct path without recipients when stakingRequestId bypasses entry guard
        await expectMismatch(
          coin.verifyTransaction({
            txParams: { type, stakingRequestId: 'stake-req-1' } as never,
            txPrebuild: { txHex, coin: 'hteth', walletId: 'fakeWalletId' } as never,
            wallet,
            verification: {},
            walletType: 'tss',
          }),
          /no TSS transaction verifier is implemented for intent type/
        );
      }

      // Stored-intent path via resolveEffectiveTxParams (e.g. disableToken or unknown label with recipients)
      for (const intent of [
        { intentType: 'disableToken' },
        {
          intentType: 'customUnlistedLabel',
          recipients: [{ address: { address: recipient }, amount: { value: '1000', symbol: 'hteth' } }],
        },
      ]) {
        const txParams = resolveEffectiveTxParams(
          { txRequestId: 'req-unlisted', apiVersion: 'full', walletId: 'w', intent } as unknown as TxRequest,
          undefined,
          'hteth'
        );
        await expectMismatch(
          coin.verifyTransaction({
            txParams: txParams as never,
            txPrebuild: { txHex, coin: 'hteth', walletId: 'fakeWalletId' } as never,
            wallet,
            verification: {},
            walletType: 'tss',
          }),
          /no TSS transaction verifier is implemented for intent type/
        );
      }
      warn.called.should.be.false();
    });

    it('enforces chain-family scoping on family-restricted allowlisted exemptions', async function () {
      const arbeth = makeVerifiedCoin('arbeth');
      const flr = makeVerifiedCoin('tflr');
      const hype = makeVerifiedCoin('thypeevm');
      const eth = makeVerifiedCoin('hteth');

      // FLR atomic export/import: allowed (with warning) on flr, rejected on arbeth and eth
      for (const type of ['export', 'Export', 'import', 'importtoc']) {
        warn.resetHistory();
        (
          await flr.coin.verifyTransaction({
            txParams: { type, recipients: [{ address: recipient, amount: '1000' }] } as never,
            txPrebuild: { txHex: flr.txHex, coin: 'tflr', walletId: 'fakeWalletId' } as never,
            wallet: flr.wallet,
            verification: {},
            walletType: 'tss',
          })
        ).should.be.true();
        warn.calledOnce.should.be.true();

        await expectMismatch(
          arbeth.coin.verifyTransaction({
            txParams: { type, recipients: [{ address: recipient, amount: '1000' }] } as never,
            txPrebuild: { txHex: arbeth.txHex, coin: 'arbeth', walletId: 'fakeWalletId' } as never,
            wallet: arbeth.wallet,
            verification: {},
            walletType: 'tss',
          }),
          /no TSS transaction verifier is implemented for intent type/
        );
      }

      // HyperEVM spotTransfer: allowed (with warning) on hypeevm, rejected on eth and arbeth
      warn.resetHistory();
      (
        await hype.coin.verifyTransaction({
          txParams: { type: 'spotTransfer', recipients: [{ address: recipient, amount: '1000' }] } as never,
          txPrebuild: { txHex: hype.txHex, coin: 'thypeevm', walletId: 'fakeWalletId' } as never,
          wallet: hype.wallet,
          verification: {},
          walletType: 'tss',
        })
      ).should.be.true();
      warn.calledOnce.should.be.true();

      await expectMismatch(
        eth.coin.verifyTransaction({
          txParams: { type: 'spotTransfer', recipients: [{ address: recipient, amount: '1000' }] } as never,
          txPrebuild: { txHex: eth.txHex, coin: 'hteth', walletId: 'fakeWalletId' } as never,
          wallet: eth.wallet,
          verification: {},
          walletType: 'tss',
        }),
        /no TSS transaction verifier is implemented for intent type/
      );

      // Kebab-case DeFi spellings are NOT exempt (CECHO-2861 P1 #1): a recipient-less stored
      // request is already rejected in resolveEffectiveTxParams, and a request that does carry
      // recipients must not skip the camelCase defiApprove/defiDeposit/defiWithdraw verifiers.
      // They therefore fail closed on every family, including eth itself.
      warn.resetHistory();
      for (const type of ['defi-approve', 'defi-deposit', 'defi-withdraw']) {
        for (const target of [eth, arbeth]) {
          await expectMismatch(
            target.coin.verifyTransaction({
              txParams: { type, recipients: [{ address: recipient, amount: '0' }] } as never,
              txPrebuild: {
                txHex: target.txHex,
                coin: target === eth ? 'hteth' : 'arbeth',
                walletId: 'fakeWalletId',
              } as never,
              wallet: target.wallet,
              verification: {},
              walletType: 'tss',
            }),
            /no TSS transaction verifier is implemented for intent type/
          );
        }
      }
      warn.called.should.be.false();

      // ETH-only wrap/Zama legs: allowed (with warning) on eth family, rejected on arbeth
      for (const type of [
        'wrapNative',
        'wrap-native',
        'unwrapNative',
        'unwrap-native',
        'enableToken',
        'enabletoken',
        'wrap',
        'unwrap',
        'finalizeUnwrap',
      ]) {
        warn.resetHistory();
        (
          await eth.coin.verifyTransaction({
            txParams: { type, recipients: [{ address: recipient, amount: '0' }] } as never,
            txPrebuild: { txHex: eth.txHex, coin: 'hteth', walletId: 'fakeWalletId' } as never,
            wallet: eth.wallet,
            verification: {},
            walletType: 'tss',
          })
        ).should.be.true();
        warn.calledOnce.should.be.true();

        await expectMismatch(
          arbeth.coin.verifyTransaction({
            txParams: { type, recipients: [{ address: recipient, amount: '0' }] } as never,
            txPrebuild: { txHex: arbeth.txHex, coin: 'arbeth', walletId: 'fakeWalletId' } as never,
            wallet: arbeth.wallet,
            verification: {},
            walletType: 'tss',
          }),
          /no TSS transaction verifier is implemented for intent type/
        );
      }
    });

    it('warns and passes for the family-agnostic acceleration exemption', async function () {
      // `acceleration` is a fee-bump replacement (CECHO-2871) and is not chain-scoped.
      const { coin, wallet, txHex } = makeVerifiedCoin('arbeth');
      warn.resetHistory();
      (
        await coin.verifyTransaction({
          txParams: { type: 'acceleration', stakingRequestId: 'stake-req-1' } as never,
          txPrebuild: { txHex, coin: 'arbeth', walletId: 'fakeWalletId' } as never,
          wallet,
          verification: {},
          walletType: 'tss',
        })
      ).should.be.true();
      warn
        .getCalls()
        .some((call) => /acceleration: no verifier is implemented/.test(String(call.args[0])))
        .should.be.true();
    });

    it('scopes each staking exemption to its audited families (CECHO-2861 P1 #2)', async function () {
      const cases: Array<[type: string, chain: string, passes: boolean]> = [
        // Audited families: warn-and-pass (no verifier, but the intent is served there).
        ['stake', 'hteth', true],
        ['stake', 'thypeevm', true],
        ['stake', 'txdc', true],
        ['stakeWithCallData', 'hteth', true],
        ['unstakeWithCallData', 'hteth', true],
        ['switchValidatorWithCallData', 'tcoredao', true],
        // ETH validator consolidation behind the staking-service feature flag (hteth fixture).
        ['switchValidatorWithCallData', 'hteth', true],
        ['delegate', 'tbsc', true],
        ['delegate', 'tbera', true],
        ['undelegate', 'txdc', true],
        ['switchValidator', 'tflr', true],
        ['claim', 'txdc', true],
        ['stakeClaimRewards', 'tcoredao', true],
        // Unrelated families: fail closed instead of inheriting a blanket exemption.
        ['stake', 'tarbeth', false],
        ['stakeWithCallData', 'tarbeth', false],
        ['stakeWithCallData', 'tpolygon', false],
        ['unstakeWithCallData', 'tarbeth', false],
        ['switchValidatorWithCallData', 'tarbeth', false],
        ['switchValidatorWithCallData', 'tpolygon', false],
        ['delegate', 'hteth', false],
        ['delegate', 'tarbeth', false],
        ['switchValidator', 'tcoredao', false],
        ['claim', 'tcoredao', false],
        ['stakeClaimRewards', 'txdc', false],
      ];

      for (const [type, chain, passes] of cases) {
        const target = makeVerifiedCoin(chain);
        warn.resetHistory();
        const request = target.coin.verifyTransaction({
          txParams: { type, stakingRequestId: 'stake-req-1' } as never,
          txPrebuild: { txHex: target.txHex, coin: chain, walletId: 'fakeWalletId' } as never,
          wallet: target.wallet,
          verification: {},
          walletType: 'tss',
        });
        if (passes) {
          (await request).should.be.true();
          warn
            .getCalls()
            .some((call) => new RegExp(`${type}: no verifier is implemented`).test(String(call.args[0])))
            .should.be.true();
        } else {
          await expectMismatch(request, /no TSS transaction verifier is implemented for intent type/);
          warn.called.should.be.false();
        }
      }
    });

    // CECHO-2861 P2: `tstt.getFamily()` returns `stt` (not `somi`), and Wallet Platform serves
    // Somnia testnet staking, so the Somnia exemptions must cover both family labels.
    it('serves Somnia testnet (stt) staking exemptions (CECHO-2861 P2)', async function () {
      const target = makeVerifiedCoin('tstt');
      target.coin.getFamily().should.equal('stt');

      for (const type of ['delegate', 'undelegate', 'switchValidator', 'claim', 'stakeClaimRewards']) {
        warn.resetHistory();
        (
          await target.coin.verifyTransaction({
            txParams: { type, stakingRequestId: 'stake-req-1' } as never,
            txPrebuild: { txHex: target.txHex, coin: 'tstt', walletId: 'fakeWalletId' } as never,
            wallet: target.wallet,
            verification: {},
            walletType: 'tss',
          })
        ).should.be.true();
        warn
          .getCalls()
          .some((call) => new RegExp(`${type}: no verifier is implemented`).test(String(call.args[0])))
          .should.be.true();
      }

      // Labels exempt only on other families still fail closed on Somnia testnet.
      warn.resetHistory();
      await expectMismatch(
        target.coin.verifyTransaction({
          txParams: { type: 'stake', stakingRequestId: 'stake-req-1' } as never,
          txPrebuild: { txHex: target.txHex, coin: 'tstt', walletId: 'fakeWalletId' } as never,
          wallet: target.wallet,
          verification: {},
          walletType: 'tss',
        }),
        /no TSS transaction verifier is implemented for intent type/
      );
      warn.called.should.be.false();
    });

    // CECHO-2861 P1 #3: a consolidateId must never reinterpret a declared intent type as a sweep,
    // and a triggered consolidation must actually run its sweep check (never warn-and-pass).
    describe('consolidateId cannot bypass the fail-closed default (CECHO-2861 P1 #3)', function () {
      function verifyWith(
        target: { coin: TestEvmCoin; wallet: Wallet },
        txParams: Record<string, unknown>,
        txPrebuild: Record<string, unknown>,
        verification: Record<string, unknown> = {}
      ) {
        return target.coin.verifyTransaction({
          txParams: txParams as never,
          txPrebuild: txPrebuild as never,
          wallet: target.wallet,
          verification: verification as never,
          walletType: 'tss',
        });
      }

      it('keeps the legitimate ID-only sweep: no declared type plus consolidateId and a valid sweep tx', async function () {
        const eth = makeVerifiedCoin('hteth');
        const txHex = buildRawEip1559Tx(eth.coin, { to: baseAddress, value: '1000000000000000000' });

        (
          await verifyWith(
            eth,
            { prebuildTx: { consolidateId: 'cid' } },
            { txHex, consolidateId: 'cid', coin: 'hteth', walletId: 'fakeWalletId' }
          )
        ).should.be.true();
        warn.called.should.be.false();
      });

      it('still runs the sweep check on an ID-only consolidation (attacker destination rejects)', async function () {
        const eth = makeVerifiedCoin('hteth');
        const txHex = buildRawEip1559Tx(eth.coin, { to: attacker, value: '1000000000000000000' });

        await expectMismatch(
          verifyWith(eth, { prebuildTx: { consolidateId: 'cid' } }, { txHex, coin: 'hteth', walletId: 'fakeWalletId' }),
          /does not match wallet base address/
        );
      });

      for (const badType of ['unknownLabel', ' transfer ', 'bogus', 'constructor']) {
        it(`rejects a declared type of ${JSON.stringify(
          badType
        )} even when a consolidateId is present`, async function () {
          const eth = makeVerifiedCoin('hteth');
          const txHex = buildRawEip1559Tx(eth.coin, { to: baseAddress, value: '1000000000000000000' });

          await expectMismatch(
            verifyWith(
              eth,
              { type: badType, recipients: [{ address: baseAddress, amount: '1000000000000000000' }] },
              { txHex, consolidateId: 'cid', coin: 'hteth', walletId: 'fakeWalletId' }
            ),
            /no TSS transaction verifier is implemented for intent type/
          );
        });
      }

      for (const emptyType of ['', '   ']) {
        it(`rejects a present-but-empty type of ${JSON.stringify(
          emptyType
        )} even when a consolidateId is present`, async function () {
          const eth = makeVerifiedCoin('hteth');
          const txHex = buildRawEip1559Tx(eth.coin, { to: baseAddress, value: '1000000000000000000' });

          await expectMismatch(
            verifyWith(
              eth,
              { type: emptyType, recipients: [{ address: baseAddress, amount: '1000000000000000000' }] },
              { txHex, consolidateId: 'cid', coin: 'hteth', walletId: 'fakeWalletId' }
            ),
            /requires a declared intent type/
          );
        });
      }

      // A `null`/non-string type is a declaration, not an omission (CECHO-2861 P1 #1 round 2): it
      // must not be collapsed into the ID-only sweep path.
      for (const malformedType of [null, 123, {}]) {
        it(`rejects a malformed declared type of ${JSON.stringify(
          malformedType
        )} even when a consolidateId is present`, async function () {
          const eth = makeVerifiedCoin('hteth');
          const txHex = buildRawEip1559Tx(eth.coin, { to: baseAddress, value: '1000000000000000000' });

          await expectMismatch(
            verifyWith(
              eth,
              { type: malformedType, recipients: [{ address: baseAddress, amount: '1000000000000000000' }] },
              { txHex, consolidateId: 'cid', coin: 'hteth', walletId: 'fakeWalletId' }
            ),
            /requires a declared intent type/
          );
        });
      }

      describe('consolidationToBaseAddress cannot bypass the fail-closed default (CECHO-2861 P1 #1)', function () {
        const consolidation = { consolidationToBaseAddress: true };

        it('passes with a genuinely omitted type and a valid sweep tx', async function () {
          const eth = makeVerifiedCoin('hteth');
          const txHex = buildRawEip1559Tx(eth.coin, { to: baseAddress, value: '1000000000000000000' });

          (
            await verifyWith(
              eth,
              { recipients: [{ address: baseAddress, amount: '1000000000000000000' }] },
              { txHex, coin: 'hteth', walletId: 'fakeWalletId' },
              consolidation
            )
          ).should.be.true();
          warn.called.should.be.false();
        });

        it('passes with a declared consolidation intent type', async function () {
          const eth = makeVerifiedCoin('hteth');
          const txHex = buildRawEip1559Tx(eth.coin, { to: baseAddress, value: '1000000000000000000' });

          for (const type of ['consolidate', 'consolidateToken', 'consolidate-token']) {
            (
              await verifyWith(eth, { type }, { txHex, coin: 'hteth', walletId: 'fakeWalletId' }, consolidation)
            ).should.be.true();
          }
          warn.called.should.be.false();
        });

        it('still enforces the sweep for an omitted type (attacker destination rejects)', async function () {
          const eth = makeVerifiedCoin('hteth');
          const txHex = buildRawEip1559Tx(eth.coin, { to: attacker, value: '1000000000000000000' });

          await expectMismatch(
            verifyWith(
              eth,
              { recipients: [{ address: baseAddress, amount: '1000000000000000000' }] },
              { txHex, coin: 'hteth', walletId: 'fakeWalletId' },
              consolidation
            ),
            /does not match wallet base address/
          );
        });

        // A sweep is the one intent that legitimately carries neither recipients nor a type: the
        // caller only sets the `consolidationToBaseAddress` hint, so `txParams` may be `{}`.
        it('admits a recipient-less flag-only sweep to the base address', async function () {
          const eth = makeVerifiedCoin('hteth');
          const txHex = buildRawEip1559Tx(eth.coin, { to: baseAddress, value: '1000000000000000000' });

          (
            await verifyWith(eth, {}, { txHex, coin: 'hteth', walletId: 'fakeWalletId' }, consolidation)
          ).should.be.true();
          warn.called.should.be.false();
        });

        it('runs the sweep check on a recipient-less flag-only sweep (attacker destination rejects)', async function () {
          const eth = makeVerifiedCoin('hteth');
          const txHex = buildRawEip1559Tx(eth.coin, { to: attacker, value: '1000000000000000000' });

          await expectMismatch(
            verifyWith(eth, {}, { txHex, coin: 'hteth', walletId: 'fakeWalletId' }, consolidation),
            /does not match wallet base address/
          );
          warn.called.should.be.false();
        });

        // The flag admits only a genuinely omitted type: a present-but-malformed type on the same
        // recipient-less request is still a malformed declaration and trips the missing-params guard.
        for (const malformedType of [null, '', 123]) {
          it(`rejects a recipient-less flag-only sweep declaring a malformed type of ${JSON.stringify(
            malformedType
          )}`, async function () {
            const eth = makeVerifiedCoin('hteth');
            const txHex = buildRawEip1559Tx(eth.coin, { to: baseAddress, value: '1000000000000000000' });

            await verifyWith(
              eth,
              { type: malformedType },
              { txHex, coin: 'hteth', walletId: 'fakeWalletId' },
              consolidation
            ).should.be.rejectedWith('missing txParams');
            warn.called.should.be.false();
          });
        }

        for (const badType of ['unknownLabel', ' transfer ', 'transferFrom', 'constructor']) {
          it(`still rejects a declared type of ${JSON.stringify(badType)}`, async function () {
            const eth = makeVerifiedCoin('hteth');
            const txHex = buildRawEip1559Tx(eth.coin, { to: baseAddress, value: '1000000000000000000' });

            await expectMismatch(
              verifyWith(
                eth,
                { type: badType, recipients: [{ address: baseAddress, amount: '1000000000000000000' }] },
                { txHex, coin: 'hteth', walletId: 'fakeWalletId' },
                consolidation
              ),
              /no TSS transaction verifier is implemented for intent type/
            );
            warn.called.should.be.false();
          });
        }

        for (const malformedType of [null, '', '   ', 123]) {
          it(`still rejects a malformed declared type of ${JSON.stringify(malformedType)}`, async function () {
            const eth = makeVerifiedCoin('hteth');
            const txHex = buildRawEip1559Tx(eth.coin, { to: baseAddress, value: '1000000000000000000' });

            await expectMismatch(
              verifyWith(
                eth,
                { type: malformedType, recipients: [{ address: baseAddress, amount: '1000000000000000000' }] },
                { txHex, coin: 'hteth', walletId: 'fakeWalletId' },
                consolidation
              ),
              /requires a declared intent type/
            );
            warn.called.should.be.false();
          });
        }
      });

      it('fails closed when a declared consolidation has no wallet base address', async function () {
        const eth = makeVerifiedCoin('hteth');
        const noBaseWallet = new Wallet(bitgo, eth.coin, { coinSpecific: {} });
        const txHex = buildRawEip1559Tx(eth.coin, { to: baseAddress, value: '1000000000000000000' });

        await expectMismatch(
          verifyWith(
            { coin: eth.coin, wallet: noBaseWallet },
            { type: 'consolidate' },
            { txHex, coin: 'hteth', walletId: 'fakeWalletId' }
          ),
          /Unable to determine base address for consolidation/
        );
        warn.called.should.be.false();
      });

      it('fails closed when an ID-only consolidation has no wallet base address', async function () {
        const eth = makeVerifiedCoin('hteth');
        const noBaseWallet = new Wallet(bitgo, eth.coin, { coinSpecific: {} });
        const txHex = buildRawEip1559Tx(eth.coin, { to: baseAddress, value: '1000000000000000000' });

        await expectMismatch(
          verifyWith(
            { coin: eth.coin, wallet: noBaseWallet },
            { prebuildTx: { consolidateId: 'cid' } },
            { txHex, consolidateId: 'cid', coin: 'hteth', walletId: 'fakeWalletId' }
          ),
          /Unable to determine base address for consolidation/
        );
        warn.called.should.be.false();
      });

      it('fails closed when a declared consolidation has no txHex', async function () {
        const eth = makeVerifiedCoin('hteth');

        await expectMismatch(
          verifyWith(eth, { type: 'consolidate' }, { consolidateId: 'cid', coin: 'hteth', walletId: 'fakeWalletId' }),
          /missing txHex in txPrebuild/
        );
        warn.called.should.be.false();
      });

      it('fails closed when an ID-only consolidation has no txHex', async function () {
        const eth = makeVerifiedCoin('hteth');

        await expectMismatch(
          verifyWith(
            eth,
            { prebuildTx: { consolidateId: 'cid' } },
            { consolidateId: 'cid', coin: 'hteth', walletId: 'fakeWalletId' }
          ),
          /missing txHex in txPrebuild/
        );
        warn.called.should.be.false();
      });
    });
  });
});
