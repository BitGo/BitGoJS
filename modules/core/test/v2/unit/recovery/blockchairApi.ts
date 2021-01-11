import * as nock from 'nock';
import * as should from 'should';
import { Environments } from '../../../../src/v2/environments';
import { TestBitGo } from '../../../lib/test_bitgo';
import { BlockchairApi } from '../../../../src/v2/recovery/blockchairApi';

const coinNames = ['bitcoin', 'bitcoin-sv', 'bitcoin-abc'];

function nockBlockchair(env, coinName) {
  const baseUrl = BlockchairApi.getBaseUrl(env, coinName);
  nock(baseUrl)
    .get('/dashboards/address/2N7kMMaUjmBYCiZqQV7GDJhBSnJuJoTuBws?key=my____ApiKey') // unspent
    .reply(200, {
      data: {
        '2N7kMMaUjmBYCiZqQV7GDJhBSnJuJoTuBws': {
          address: {
            type: 'scripthash',
            script_hex: 'a9149f13f940a9461ac6e5393859faca8c513f93cd6e87',
            balance: 20000,
            balance_usd: 0,
            received: 20000,
            received_usd: 0,
            spent: 20000,
            spent_usd: 0,
            output_count: 1,
            unspent_output_count: 0,
            first_seen_receiving: '2019-01-16 23:52:45',
            last_seen_receiving: '2019-01-16 23:52:45',
            first_seen_spending: '2019-01-17 02:27:18',
            last_seen_spending: '2019-01-17 02:27:18',
            scripthash_type: 'multisig_2_of_3',
            transaction_count: 2,
          },
          transactions: [
            '0f58644f28726159e833c2b4dbf7a46be2c0eb7f8d36c244bca765b05113880a',
            '9a57cdf7a8ce94c1cdad90f639fd8dcab8d20f68a117a7c30dbf468652fbf7e0',
          ],
          utxo: [
            {
              block_id: 643436,
              transaction_hash: '9a57cdf7a8ce94c1cdad90f639fd8dcab8d20f68a117a7c30dbf468652fbf7e0',
              index: 0,
              value: 20000,
            },
          ],
        },
      }
    });
}

describe('blockchair api', function() {
  const apiKey = 'my____ApiKey';
  const bitgo = new TestBitGo({env: 'test'});
  const env = bitgo.getEnv() as string;
  for (const coinName of coinNames) {
    describe(`${coinName} should succeed`, function() {
      it('should get address information from blockchair', async function() {
        nockBlockchair(env, coinName);
        const blockchair = new BlockchairApi(bitgo, coinName, apiKey);
        const address = await blockchair.getAccountInfo('2N7kMMaUjmBYCiZqQV7GDJhBSnJuJoTuBws');
        address.txCount.should.equal(2);
        address.totalBalance.should.equal(20000);
      });
      it('should get utxo information from blockchair', async function() {
        nockBlockchair(env, coinName);
        const blockchair = new BlockchairApi(bitgo, coinName, apiKey);
        const response = await blockchair.getUnspents('2N7kMMaUjmBYCiZqQV7GDJhBSnJuJoTuBws');
        response.length.should.equal(1);
        response[0].amount.should.equal(20000);
        response[0].n.should.equal(0);
        response[0].txid.should.equal('9a57cdf7a8ce94c1cdad90f639fd8dcab8d20f68a117a7c30dbf468652fbf7e0');
        response[0].address.should.equal('2N7kMMaUjmBYCiZqQV7GDJhBSnJuJoTuBws');
      });
    });
    describe(`${coinName} should fail`,  function() {
      it('should throw if the address value is an empty string', async function() {
        const blockchair = new BlockchairApi(bitgo, coinName);
        await blockchair.getUnspents('').should.be.rejectedWith('invalid address');
      });
    });
  }

});
