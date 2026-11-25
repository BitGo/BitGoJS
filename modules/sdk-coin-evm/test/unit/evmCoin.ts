import 'should';
import { BitGoAPI } from '@bitgo/sdk-api';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { EvmCoin } from '../../src/evmCoin';
import { registerAll } from '../../src/register';
import { coins, ContractAddressDefinedToken, EthereumNetwork } from '@bitgo/statics';
import { TransactionType, Wallet } from '@bitgo/sdk-core';
import { ETHTransactionType, LegacyTxData, VerifyEthTransactionOptions } from '@bitgo/abstract-eth';
import { TransactionBuilder } from '../../src/lib';

/** Minimal big-endian buffer, empty for zero (matches ethereumjs bnToUnpaddedBuffer). */
function minimalBuffer(value: string | number): Buffer {
  const bigint = BigInt(value);
  if (bigint === 0n) {
    return Buffer.alloc(0);
  }
  const hex = bigint.toString(16);
  return Buffer.from(hex.length % 2 === 0 ? hex : `0${hex}`, 'hex');
}

function rlpHeader(length: number, shortOffset: number): Buffer {
  if (length <= 55) {
    return Buffer.from([shortOffset + length]);
  }
  const hex = length.toString(16);
  const lengthBytes = Buffer.from(hex.length % 2 === 0 ? hex : `0${hex}`, 'hex');
  return Buffer.concat([Buffer.from([shortOffset + 55 + lengthBytes.length]), lengthBytes]);
}

/** RLP encoder for the byte strings and flat lists used by legacy (type-0) transactions. */
function rlpEncode(input: Buffer | Buffer[]): Buffer {
  if (Array.isArray(input)) {
    const payload = Buffer.concat(input.map((item) => rlpEncode(item)));
    return Buffer.concat([rlpHeader(payload.length, 0xc0), payload]);
  }
  if (input.length === 1 && input[0] < 0x80) {
    return input;
  }
  return Buffer.concat([rlpHeader(input.length, 0x80), input]);
}

/**
 * Derive the EIP-155 signable payload locally: RLP([nonce, gasPrice, gasLimit, to, value, data,
 * chainId, 0, 0]). Matches AbstractEthLikeNewCoins.assertSignableConsistency without importing
 * @ethereumjs/rlp (not a dependency of this module).
 */
function deriveLegacySignableHex(tx: LegacyTxData): string {
  const data = tx.data && tx.data !== '0x' ? Buffer.from(tx.data.replace(/^0x/, ''), 'hex') : Buffer.alloc(0);
  const to = tx.to ? Buffer.from(tx.to.replace(/^0x/, ''), 'hex') : Buffer.alloc(0);
  return rlpEncode([
    minimalBuffer(tx.nonce),
    minimalBuffer(tx.gasPrice),
    minimalBuffer(tx.gasLimit),
    to,
    minimalBuffer(tx.value),
    data,
    minimalBuffer(tx.chainId ?? '0x0'),
    Buffer.alloc(0),
    Buffer.alloc(0),
  ]).toString('hex');
}

/** Encode ERC-20 transfer(address,uint256) without ethereumjs-abi. */
function encodeErc20Transfer(to: string, amount: string): string {
  const address = to.toLowerCase().replace(/^0x/, '').padStart(64, '0');
  const value = BigInt(amount).toString(16).padStart(64, '0');
  return `0xa9059cbb${address}${value}`;
}

/** Encode ERC-20 approve(address,uint256) without ethereumjs-abi. */
function encodeErc20Approve(spender: string, amount: string): string {
  const address = spender.toLowerCase().replace(/^0x/, '').padStart(64, '0');
  const value = BigInt(amount).toString(16).padStart(64, '0');
  return `0x095ea7b3${address}${value}`;
}

describe('EvmCoin', function () {
  let bitgo: TestBitGoAPI;
  let evmCoin: EvmCoin;

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
  });

  describe('isValidAddress', function () {
    beforeEach(function () {
      // Create EvmCoin instance for testing
      const staticsCoin = coins.get('hbarevm');
      evmCoin = new (EvmCoin as any)(bitgo, staticsCoin);
    });

    it('should validate standard Ethereum addresses (backward compatible)', function () {
      const validAddresses = [
        '0x5aAeb6053f3E94C9b9A09f33669435E7Ef1BeAed',
        '0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359',
        '0xdbF03B407c01E7cD3CBea99509d93f8DDDC8C6FB',
        '0xD1220A0cf47c7B9Be7A2E6BA89F429762e7b9aDb',
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1',
      ];

      validAddresses.forEach((address) => {
        evmCoin.isValidAddress(address).should.be.true(`${address} should be valid`);
      });
    });

    it('should validate addresses without 0x prefix (backward compatible)', function () {
      const validAddresses = ['5aAeb6053f3E94C9b9A09f33669435E7Ef1BeAed', 'fB6916095ca1df60bB79Ce92cE3Ea74c37c5d359'];

      validAddresses.forEach((address) => {
        evmCoin.isValidAddress(address).should.be.true(`${address} should be valid`);
      });
    });

    it('should reject invalid Ethereum addresses (backward compatible)', function () {
      const invalidAddresses = [
        '0xInvalidAddress',
        '0x123',
        'not-an-address',
        '',
        '0x',
        '0xzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz',
      ];

      invalidAddresses.forEach((address) => {
        evmCoin.isValidAddress(address).should.be.false(`${address} should be invalid`);
      });
    });

    it('should work with first parameter only (backward compatible)', function () {
      const address = '0x5aAeb6053f3E94C9b9A09f33669435E7Ef1BeAed';
      evmCoin.isValidAddress(address).should.be.true();
    });

    describe('with optional isAlternateAddress parameter for HBAREVM', function () {
      it('should validate Hedera account IDs when isAlternateAddress is true', function () {
        const validHederaAccountIds = ['0.0.123456', '0.0.1234567890', '0.0.1'];

        validHederaAccountIds.forEach((accountId) => {
          evmCoin.isValidAddress(accountId, true).should.be.true(`${accountId} should be valid`);
        });
      });

      it('should reject invalid Hedera account IDs when isAlternateAddress is true', function () {
        const invalidHederaAccountIds = ['0.0', '0.0.abc', '0.0.-123', 'not-an-account-id'];

        invalidHederaAccountIds.forEach((accountId) => {
          evmCoin.isValidAddress(accountId, true).should.be.false(`${accountId} should be invalid`);
        });
      });

      it('should still validate Ethereum addresses when isAlternateAddress is false', function () {
        const ethAddress = '0x5aAeb6053f3E94C9b9A09f33669435E7Ef1BeAed';
        evmCoin.isValidAddress(ethAddress, false).should.be.true();
      });

      it('should validate Ethereum addresses when isAlternateAddress is undefined (default)', function () {
        const ethAddress = '0x5aAeb6053f3E94C9b9A09f33669435E7Ef1BeAed';
        evmCoin.isValidAddress(ethAddress, undefined).should.be.true();
      });
    });

    describe('for non-HBAREVM coins', function () {
      beforeEach(function () {
        // Create a non-HBAREVM coin instance
        const staticsCoin = coins.get('polygon');
        evmCoin = new (EvmCoin as any)(bitgo, staticsCoin);
      });

      it('should validate standard Ethereum addresses regardless of isAlternateAddress flag', function () {
        const ethAddress = '0x5aAeb6053f3E94C9b9A09f33669435E7Ef1BeAed';
        evmCoin.isValidAddress(ethAddress).should.be.true();
        evmCoin.isValidAddress(ethAddress, false).should.be.true();
        evmCoin.isValidAddress(ethAddress, true).should.be.true();
      });

      it('should not validate Hedera account IDs even with isAlternateAddress=true', function () {
        const hederaAccountId = '0.0.123456';
        evmCoin.isValidAddress(hederaAccountId, true).should.be.false();
      });
    });
  });

  describe('verifyTssTransaction for non-EIP1559 legacy chains', function () {
    const recipientAddress = '0x9c1c5e6c9e2a4e0f6c2b8d3a1f4e5d6c7b8a9f01';
    const wrongAddress = '0x1111111111111111111111111111111111111111';
    // tprividiumeth:tMMF, the only non-EIP1559 family in statics that defines ERC-20 tokens.
    const tokenContractAddress = '0xde1c06e0aabf9c224c36e80cc13259f13237d0df';
    const maxUint256 = ((1n << 256n) - 1n).toString(10);
    const chains = ['kavaevm', 'tkavaevm', 'prividiumeth', 'tprividiumeth'];

    function coinFor(chain: string): EvmCoin {
      return EvmCoin.createInstance(bitgo, coins.get(chain)) as EvmCoin;
    }

    function tssParams(
      coin: EvmCoin,
      txHex: string,
      txParams: VerifyEthTransactionOptions['txParams']
    ): VerifyEthTransactionOptions {
      return {
        txParams,
        txPrebuild: {
          txHex,
          buildParams: { recipients: [] },
          recipients: [],
          nextContractSequenceId: 0,
          gasPrice: 10,
          gasLimit: 60000,
          isBatch: false,
          coin: coin.getChain(),
        },
        wallet: new Wallet(bitgo, coin, { coinSpecific: { baseAddress: recipientAddress } }),
      };
    }

    async function buildLegacyTx(
      chain: string,
      params: { to: string; value: string; data?: string }
    ): Promise<{ serializedTxHex: string; signableHex: string }> {
      const builder = new TransactionBuilder(coins.get(chain));
      builder.type(params.data && params.data !== '0x' ? TransactionType.ContractCall : TransactionType.SingleSigSend);
      builder.fee({ fee: '10', gasLimit: '60000' });
      builder.counter(1);
      builder.contract(params.to);
      builder.value(params.value);
      if (params.data && params.data !== '0x') {
        builder.data(params.data);
      }
      const tx = await builder.build();
      const txJson = tx.toJson();
      if (txJson._type !== ETHTransactionType.LEGACY) {
        throw new Error(`expected a legacy type-0 transaction on ${chain}`);
      }
      return {
        serializedTxHex: tx.toBroadcastFormat().replace(/^0x/, ''),
        signableHex: deriveLegacySignableHex(txJson),
      };
    }

    it('should not override the parent TSS verifier', function () {
      Object.prototype.hasOwnProperty.call(EvmCoin.prototype, 'verifyTssTransaction').should.be.false();
      Object.prototype.hasOwnProperty.call(EvmCoin.prototype, 'verifyLegacyTssTransaction').should.be.false();
    });

    for (const chain of chains) {
      describe(chain, function () {
        it('verifies a matching legacy type-0 payment via serializedTxHex + assertSignableConsistency', async function () {
          const coin = coinFor(chain);
          const { serializedTxHex, signableHex } = await buildLegacyTx(chain, {
            to: recipientAddress,
            value: '1000',
          });

          const verified = await coin.verifyTssTransaction(
            tssParams(coin, serializedTxHex, {
              type: 'transfer',
              recipients: [{ address: recipientAddress, amount: '1000' }],
            })
          );
          verified.should.be.true();

          coin.assertSignableConsistency(serializedTxHex, signableHex);
        });

        it('rejects a legacy payment whose amount does not match the intent', async function () {
          const coin = coinFor(chain);
          const { serializedTxHex } = await buildLegacyTx(chain, { to: recipientAddress, value: '1000' });

          await coin
            .verifyTssTransaction(
              tssParams(coin, serializedTxHex, {
                type: 'transfer',
                recipients: [{ address: recipientAddress, amount: '999' }],
              })
            )
            .should.be.rejectedWith('the transaction amount in txPrebuild does not match the value given by client');
        });

        it('rejects a legacy payment whose destination does not match the intent', async function () {
          const coin = coinFor(chain);
          const { serializedTxHex } = await buildLegacyTx(chain, { to: wrongAddress, value: '1000' });

          await coin
            .verifyTssTransaction(
              tssParams(coin, serializedTxHex, {
                type: 'transfer',
                recipients: [{ address: recipientAddress, amount: '1000' }],
              })
            )
            .should.be.rejectedWith('destination address does not match with the recipient address');
        });

        it('rejects a signableHex that does not match the serialized legacy tx', async function () {
          const coin = coinFor(chain);
          const benign = await buildLegacyTx(chain, { to: recipientAddress, value: '1000' });
          const malicious = await buildLegacyTx(chain, { to: wrongAddress, value: '1000' });

          (() => coin.assertSignableConsistency(benign.serializedTxHex, malicious.signableHex)).should.throw(
            'signableHex is inconsistent with serializedTxHex: possible server tampering'
          );
        });
      });
    }

    describe('existing guards', function () {
      it('keeps the missing txParams guard', async function () {
        const coin = coinFor('tkavaevm');
        const { serializedTxHex } = await buildLegacyTx('tkavaevm', { to: recipientAddress, value: '1000' });

        await coin
          .verifyTssTransaction(tssParams(coin, serializedTxHex, {}))
          .should.be.rejectedWith('missing txParams');
      });

      it('keeps the missing params guard', async function () {
        const coin = coinFor('tkavaevm');
        const { serializedTxHex } = await buildLegacyTx('tkavaevm', { to: recipientAddress, value: '1000' });

        // wallet intentionally omitted to exercise the guard
        const params = {
          txParams: { type: 'transfer', recipients: [{ address: recipientAddress, amount: '1000' }] },
          txPrebuild: { txHex: serializedTxHex },
        } as unknown as VerifyEthTransactionOptions;

        await coin.verifyTssTransaction(params).should.be.rejectedWith('missing params');
      });

      it('keeps the batch-and-hop guard', async function () {
        const coin = coinFor('tkavaevm');
        const { serializedTxHex } = await buildLegacyTx('tkavaevm', { to: recipientAddress, value: '1000' });

        await coin
          .verifyTssTransaction(
            tssParams(coin, serializedTxHex, {
              type: 'transfer',
              hop: true,
              recipients: [
                { address: recipientAddress, amount: '500' },
                { address: wrongAddress, amount: '500' },
              ],
            })
          )
          .should.be.rejectedWith('tx cannot be both a batch and hop transaction');
      });
    });

    describe('tprividiumeth:tMMF token payments', function () {
      it('verifies a matching legacy ERC-20 transfer', async function () {
        const coin = coinFor('tprividiumeth');
        const data = encodeErc20Transfer(recipientAddress, '5000');
        const { serializedTxHex, signableHex } = await buildLegacyTx('tprividiumeth', {
          to: tokenContractAddress,
          value: '0',
          data,
        });

        const verified = await coin.verifyTssTransaction(
          tssParams(coin, serializedTxHex, {
            type: 'transfer',
            tokenName: 'tprividiumeth:tMMF',
            recipients: [{ address: recipientAddress, amount: '5000', tokenName: 'tprividiumeth:tMMF' }],
          })
        );
        verified.should.be.true();

        coin.assertSignableConsistency(serializedTxHex, signableHex);
      });

      it('rejects a swapped-in approve(attacker, MAX) calldata before signing', async function () {
        const coin = coinFor('tprividiumeth');
        const { serializedTxHex } = await buildLegacyTx('tprividiumeth', {
          to: tokenContractAddress,
          value: '0',
          data: encodeErc20Approve(wrongAddress, maxUint256),
        });

        await coin
          .verifyTssTransaction(
            tssParams(coin, serializedTxHex, {
              type: 'transfer',
              tokenName: 'tprividiumeth:tMMF',
              recipients: [{ address: recipientAddress, amount: '5000', tokenName: 'tprividiumeth:tMMF' }],
            })
          )
          .should.be.rejectedWith('payment calldata is not a native send or an ERC-20 transfer(address,uint256)');
      });

      it('rejects an approve(attacker, MAX) that replaces explicit transfer calldata', async function () {
        const coin = coinFor('tprividiumeth');
        const { serializedTxHex } = await buildLegacyTx('tprividiumeth', {
          to: tokenContractAddress,
          value: '0',
          data: encodeErc20Approve(wrongAddress, maxUint256),
        });
        const intendedData = encodeErc20Transfer(recipientAddress, '5000');

        await coin
          .verifyTssTransaction(
            tssParams(coin, serializedTxHex, {
              type: 'transfer',
              tokenName: 'tprividiumeth:tMMF',
              recipients: [
                { address: tokenContractAddress, amount: '0', tokenName: 'tprividiumeth:tMMF', data: intendedData },
              ],
            })
          )
          .should.be.rejectedWith('transaction calldata does not match the calldata given by client');
      });
    });

    describe('tokens registered through registerAll', function () {
      let registeredBitgo: TestBitGoAPI;

      before(function () {
        registeredBitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
        registerAll(registeredBitgo);
      });

      // Both Prividium testnet ERC-20 tokens are registered from the mainnet base coin, so each
      // must still resolve its statics coin (and chain ID) from the testnet network.
      const testnetTokens = ['tprividiumeth:USB-ESCROW-D', 'tprividiumeth:tMMF'];

      for (const tokenName of testnetTokens) {
        describe(tokenName, function () {
          const staticsToken = coins.get(tokenName);
          if (!(staticsToken instanceof ContractAddressDefinedToken)) {
            throw new Error(`${tokenName} is not a contract-address token`);
          }
          const { contractAddress } = staticsToken;

          it('registers the token with the testnet chain ID', function () {
            const token = registeredBitgo.coin(tokenName) as EvmCoin;
            const staticsTokenNetwork = coins.get(tokenName).network as EthereumNetwork;
            const mainnetNetwork = coins.get('prividiumeth').network as EthereumNetwork;

            token.getChainId().should.equal(staticsTokenNetwork.chainId);
            token.getChainId().should.not.equal(mainnetNetwork.chainId);
          });

          it('verifies a matching type-0 ERC-20 transfer via the registered token', async function () {
            const token = registeredBitgo.coin(tokenName) as EvmCoin;
            const { serializedTxHex, signableHex } = await buildLegacyTx('tprividiumeth', {
              to: contractAddress,
              value: '0',
              data: encodeErc20Transfer(recipientAddress, '5000'),
            });

            const verified = await token.verifyTssTransaction(
              tssParams(token, serializedTxHex, {
                type: 'transfer',
                tokenName,
                recipients: [{ address: recipientAddress, amount: '5000', tokenName }],
              })
            );
            verified.should.be.true();

            token.assertSignableConsistency(serializedTxHex, signableHex);
          });

          it('rejects a swapped-in approve(attacker, MAX) via the registered token', async function () {
            const token = registeredBitgo.coin(tokenName) as EvmCoin;
            const { serializedTxHex } = await buildLegacyTx('tprividiumeth', {
              to: contractAddress,
              value: '0',
              data: encodeErc20Approve(wrongAddress, maxUint256),
            });

            await token
              .verifyTssTransaction(
                tssParams(token, serializedTxHex, {
                  type: 'transfer',
                  tokenName,
                  recipients: [{ address: recipientAddress, amount: '5000', tokenName }],
                })
              )
              .should.be.rejectedWith('payment calldata is not a native send or an ERC-20 transfer(address,uint256)');
          });

          it('rejects a signableHex that does not match the serialized legacy token tx', async function () {
            const token = registeredBitgo.coin(tokenName) as EvmCoin;
            const benign = await buildLegacyTx('tprividiumeth', {
              to: contractAddress,
              value: '0',
              data: encodeErc20Transfer(recipientAddress, '5000'),
            });
            const malicious = await buildLegacyTx('tprividiumeth', {
              to: contractAddress,
              value: '0',
              data: encodeErc20Transfer(wrongAddress, '5000'),
            });

            (() => token.assertSignableConsistency(benign.serializedTxHex, malicious.signableHex)).should.throw(
              'signableHex is inconsistent with serializedTxHex: possible server tampering'
            );
          });
        });
      }
    });
  });
});
