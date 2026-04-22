import nock from 'nock';
import 'should';

import { isHtsEvmAddress, recovery_HBAREVM_BlockchainExplorerQuery } from '../../src/lib/utils';

describe('EVM Coin Utils', function () {
  describe('isHtsEvmAddress', () => {
    it('should return true for HTS native token addresses (long-zero format)', () => {
      isHtsEvmAddress('0x00000000000000000000000000000000007ac203').should.be.true();
      isHtsEvmAddress('0x00000000000000000000000000000000007103a5').should.be.true();
      isHtsEvmAddress('0x0000000000000000000000000000000000728a62').should.be.true();
      isHtsEvmAddress('0x00000000000000000000000000000000007ac19c').should.be.true();
    });

    it('should return false for standard Solidity contract addresses', () => {
      isHtsEvmAddress('0x5df4076613e714a4cc4284abac87caa927b918a8').should.be.false();
      isHtsEvmAddress('0xcee79325714727016c125f80ef1a5d1f47b3d8d2').should.be.false();
      isHtsEvmAddress('0xc795c4faae7f16a69bec13c5dfd9e8a156a68625').should.be.false();
      isHtsEvmAddress('0x8f977e912ef500548a0c3be6ddde9899f1199b81').should.be.false();
    });

    it('should handle uppercase hex characters', () => {
      isHtsEvmAddress('0x00000000000000000000000000000000007AC203').should.be.true();
      isHtsEvmAddress('0x5DF4076613E714A4CC4284ABAC87CAA927B918A8').should.be.false();
    });

    it('should return false for invalid format', () => {
      isHtsEvmAddress('0x1234').should.be.false();
      isHtsEvmAddress('not-an-address').should.be.false();
    });
  });

  describe('recovery_HBAREVM_BlockchainExplorerQuery', function () {
    const mockRpcUrl = 'https://testnet.hashio.io/api';
    const mockExplorerUrl = 'https://testnet.mirrornode.hedera.com/api/v1';
    const mockAddress = '0xe9591fe1bd82ebc6b293fb355c79f22e204d6d84';
    const mockToken = 'test-api-token';

    beforeEach(function () {
      nock.cleanAll();
    });

    afterEach(function () {
      nock.cleanAll();
    });

    describe('account.balance', function () {
      it('should return balance in wei from Hedera Mirror Node API', async function () {
        const query = {
          module: 'account',
          action: 'balance',
          address: mockAddress,
        };

        const mockResponse = {
          balance: {
            balance: 10000000000, // 100 HBAR in tinybars
          },
        };

        nock(mockExplorerUrl).get(`/accounts/${mockAddress}?transactions=false`).reply(200, mockResponse);

        const result = await recovery_HBAREVM_BlockchainExplorerQuery(query, mockRpcUrl, mockExplorerUrl, mockToken);

        result.should.have.property('result');
        (result.result as string).should.equal('100000000000000000000'); // 100 HBAR in wei
      });

      it('should return 0 balance when balance is not provided', async function () {
        const query = {
          module: 'account',
          action: 'balance',
          address: mockAddress,
        };

        const mockResponse = {};

        nock(mockExplorerUrl).get(`/accounts/${mockAddress}?transactions=false`).reply(200, mockResponse);

        const result = await recovery_HBAREVM_BlockchainExplorerQuery(query, mockRpcUrl, mockExplorerUrl, mockToken);

        result.should.have.property('result');
        (result.result as string).should.equal('0');
      });

      it('should throw error when API request fails', async function () {
        const query = {
          module: 'account',
          action: 'balance',
          address: mockAddress,
        };

        nock(mockExplorerUrl).get(`/accounts/${mockAddress}?transactions=false`).reply(500, 'Internal Server Error');

        try {
          await recovery_HBAREVM_BlockchainExplorerQuery(query, mockRpcUrl, mockExplorerUrl, mockToken);
          throw new Error('Expected function to throw');
        } catch (error) {
          // The superagent library throws this error for 500 responses
          (error as Error).message.should.match(/Internal Server Error/);
        }
      });
    });

    describe('account.txlist', function () {
      it('should return nonce from Hedera Mirror Node API', async function () {
        const query = {
          module: 'account',
          action: 'txlist',
          address: mockAddress,
        };

        const mockResponse = {
          ethereum_nonce: 42,
        };

        nock(mockExplorerUrl).get(`/accounts/${mockAddress}?transactions=false`).reply(200, mockResponse);

        const result = await recovery_HBAREVM_BlockchainExplorerQuery(query, mockRpcUrl, mockExplorerUrl, mockToken);

        result.should.have.property('nonce');
        (result.nonce as number).should.equal(42);
      });

      it('should return 0 nonce when ethereum_nonce is not provided', async function () {
        const query = {
          module: 'account',
          action: 'txlist',
          address: mockAddress,
        };

        const mockResponse = {};

        nock(mockExplorerUrl).get(`/accounts/${mockAddress}?transactions=false`).reply(200, mockResponse);

        const result = await recovery_HBAREVM_BlockchainExplorerQuery(query, mockRpcUrl, mockExplorerUrl, mockToken);

        result.should.have.property('nonce');
        (result.nonce as number).should.equal(0);
      });
    });

    describe('account.tokenbalance', function () {
      it('should return token balance in wei from Hedera Mirror Node API', async function () {
        const contractAddress = '0x123456789';
        const query = {
          module: 'account',
          action: 'tokenbalance',
          contractaddress: contractAddress,
          address: mockAddress,
        };

        const mockResponse = {
          tokens: [
            {
              token_id: contractAddress,
              contract_address: contractAddress,
              balance: 5000000000, // 50 tokens in tinybars
            },
          ],
        };

        nock(mockExplorerUrl).get(`/accounts/${mockAddress}/tokens`).reply(200, mockResponse);

        const result = await recovery_HBAREVM_BlockchainExplorerQuery(query, mockRpcUrl, mockExplorerUrl, mockToken);

        result.should.have.property('result');
        (result.result as string).should.equal('50000000000000000000'); // 50 tokens in wei
      });

      it('should return 0 balance when token is not found', async function () {
        const contractAddress = '0x123456789';
        const query = {
          module: 'account',
          action: 'tokenbalance',
          contractaddress: contractAddress,
          address: mockAddress,
        };

        const mockResponse = {
          tokens: [],
        };

        nock(mockExplorerUrl).get(`/accounts/${mockAddress}/tokens`).reply(200, mockResponse);

        const result = await recovery_HBAREVM_BlockchainExplorerQuery(query, mockRpcUrl, mockExplorerUrl, mockToken);

        result.should.have.property('result');
        (result.result as string).should.equal('0');
      });

      it('should find token by contract_address when token_id does not match', async function () {
        const contractAddress = '0x123456789';
        const query = {
          module: 'account',
          action: 'tokenbalance',
          contractaddress: contractAddress,
          address: mockAddress,
        };

        const mockResponse = {
          tokens: [
            {
              token_id: 'different_id',
              contract_address: contractAddress,
              balance: 2500000000, // 25 tokens in tinybars
            },
          ],
        };

        nock(mockExplorerUrl).get(`/accounts/${mockAddress}/tokens`).reply(200, mockResponse);

        const result = await recovery_HBAREVM_BlockchainExplorerQuery(query, mockRpcUrl, mockExplorerUrl, mockToken);

        result.should.have.property('result');
        (result.result as string).should.equal('25000000000000000000'); // 25 tokens in wei
      });
    });

    describe('proxy.eth_gasPrice', function () {
      it('should return gas price from RPC endpoint', async function () {
        const query = {
          module: 'proxy',
          action: 'eth_gasPrice',
        };

        const mockResponse = {
          jsonrpc: '2.0',
          id: 1,
          result: '0x84b6a5c400', // 570 Gwei in hex
        };

        nock(mockRpcUrl)
          .post('', '{"jsonrpc":"2.0","method":"eth_gasPrice","params":[],"id":1}')
          .reply(200, mockResponse);

        const result = await recovery_HBAREVM_BlockchainExplorerQuery(query, mockRpcUrl, mockExplorerUrl, mockToken);

        result.should.have.property('jsonrpc');
        result.should.have.property('result');
        (result.jsonrpc as string).should.equal('2.0');
        (result.result as string).should.equal('0x84b6a5c400');
      });

      it('should throw error when RPC request fails', async function () {
        const query = {
          module: 'proxy',
          action: 'eth_gasPrice',
        };

        nock(mockRpcUrl)
          .post('', '{"jsonrpc":"2.0","method":"eth_gasPrice","params":[],"id":1}')
          .reply(500, 'Internal Server Error');

        try {
          await recovery_HBAREVM_BlockchainExplorerQuery(query, mockRpcUrl, mockExplorerUrl, mockToken);
          throw new Error('Expected function to throw');
        } catch (error) {
          // The superagent library throws this error for 500 responses
          (error as Error).message.should.match(/Internal Server Error/);
        }
      });
    });

    describe('proxy.eth_estimateGas', function () {
      it('should return gas estimate from RPC endpoint', async function () {
        const query = {
          module: 'proxy',
          action: 'eth_estimateGas',
          from: '0xfrom',
          to: '0xto',
          data: '0xdata',
        };

        const mockResponse = {
          jsonrpc: '2.0',
          id: 1,
          result: '0x5208', // 21000 gas in hex
        };

        nock(mockRpcUrl)
          .post(
            '',
            '{"jsonrpc":"2.0","method":"eth_estimateGas","params":[{"from":"0xfrom","to":"0xto","data":"0xdata"}],"id":1}'
          )
          .reply(200, mockResponse);

        const result = await recovery_HBAREVM_BlockchainExplorerQuery(query, mockRpcUrl, mockExplorerUrl, mockToken);

        result.should.have.property('jsonrpc');
        result.should.have.property('result');
        (result.jsonrpc as string).should.equal('2.0');
        (result.result as string).should.equal('0x5208');
      });
    });

    describe('proxy.eth_call', function () {
      it('should return sequence ID from RPC endpoint', async function () {
        const query = {
          module: 'proxy',
          action: 'eth_call',
          to: '0xcontract',
          data: '0xfunctiondata',
        };

        const mockResponse = {
          jsonrpc: '2.0',
          id: 1,
          result: '0x0000000000000000000000000000000000000000000000000000000000000001', // sequence ID 1
        };

        nock(mockRpcUrl)
          .post(
            '',
            '{"jsonrpc":"2.0","method":"eth_call","params":[{"to":"0xcontract","data":"0xfunctiondata"}],"id":1}'
          )
          .reply(200, mockResponse);

        const result = await recovery_HBAREVM_BlockchainExplorerQuery(query, mockRpcUrl, mockExplorerUrl, mockToken);

        result.should.have.property('jsonrpc');
        result.should.have.property('result');
        (result.jsonrpc as string).should.equal('2.0');
        (result.result as string).should.equal('0x0000000000000000000000000000000000000000000000000000000000000001');
      });
    });

    describe('unsupported API calls', function () {
      it('should throw error for unsupported module.action combination', async function () {
        const query = {
          module: 'unsupported',
          action: 'unknown',
        };

        await recovery_HBAREVM_BlockchainExplorerQuery(
          query,
          mockRpcUrl,
          mockExplorerUrl,
          mockToken
        ).should.be.rejectedWith('Unsupported API call: unsupported.unknown');
      });
    });

    describe('URL handling', function () {
      it('should handle explorer URL with trailing slash', async function () {
        const explorerUrlWithSlash = mockExplorerUrl + '/';
        const query = {
          module: 'account',
          action: 'balance',
          address: mockAddress,
        };

        const mockResponse = {
          balance: {
            balance: 10000000000,
          },
        };

        nock(mockExplorerUrl) // Note: nock should match without trailing slash
          .get(`/accounts/${mockAddress}?transactions=false`)
          .reply(200, mockResponse);

        const result = await recovery_HBAREVM_BlockchainExplorerQuery(
          query,
          mockRpcUrl,
          explorerUrlWithSlash,
          mockToken
        );

        result.should.have.property('result');
        (result.result as string).should.equal('100000000000000000000');
      });
    });

    describe('API token handling', function () {
      it('should add apikey to query when token is provided', async function () {
        const query: Record<string, string> = {
          module: 'account',
          action: 'balance',
          address: mockAddress,
        };

        // Since the token is added to the query object but not used in the actual request for Hedera,
        // we just verify the function doesn't break when token is provided
        const mockResponse = {
          balance: {
            balance: 10000000000,
          },
        };

        nock(mockExplorerUrl).get(`/accounts/${mockAddress}?transactions=false`).reply(200, mockResponse);

        const result = await recovery_HBAREVM_BlockchainExplorerQuery(query, mockRpcUrl, mockExplorerUrl, mockToken);

        result.should.have.property('result');
        (result.result as string).should.equal('100000000000000000000');

        // Verify that apikey was added to the query object
        query.should.have.property('apikey');
        query.apikey.should.equal(mockToken);
      });
    });

    describe('BigInt conversion', function () {
      it('should handle large balance numbers correctly', async function () {
        const query = {
          module: 'account',
          action: 'balance',
          address: mockAddress,
        };

        const mockResponse = {
          balance: {
            balance: 50000000000000, // Very large balance in tinybars
          },
        };

        nock(mockExplorerUrl).get(`/accounts/${mockAddress}?transactions=false`).reply(200, mockResponse);

        const result = await recovery_HBAREVM_BlockchainExplorerQuery(query, mockRpcUrl, mockExplorerUrl, mockToken);

        result.should.have.property('result');
        (result.result as string).should.equal('500000000000000000000000'); // Large number in wei
      });

      it('should handle zero balance correctly', async function () {
        const query = {
          module: 'account',
          action: 'balance',
          address: mockAddress,
        };

        const mockResponse = {
          balance: {
            balance: 0,
          },
        };

        nock(mockExplorerUrl).get(`/accounts/${mockAddress}?transactions=false`).reply(200, mockResponse);

        const result = await recovery_HBAREVM_BlockchainExplorerQuery(query, mockRpcUrl, mockExplorerUrl, mockToken);

        result.should.have.property('result');
        (result.result as string).should.equal('0');
      });
    });
  });
});
