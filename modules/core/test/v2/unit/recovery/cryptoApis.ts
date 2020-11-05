import * as nock from 'nock';
import { TestBitGo } from '../../../lib/test_bitgo';
import { CryptoApi } from '../../../../src/v2/recovery/cryptoApi';

// BCHA is considered the "original" BCH by CryptoAPIs, so the acronym "BCH" refers to BCH-A fork
const coinNames = ['bch'];

function nockCryptoAPIs(env, coinName) {
  const baseUrl = CryptoApi.getBaseUrl(env, coinName);
  nock(baseUrl)
    .matchHeader('X-API-Key', 'my____ApiKey')
    .get('/address/2N3XcQGSrdZPDwj6z3tu3iaA3msrdzVoPXT') // Nock for account information
    .reply(200, {
        "payload" : {
            "address" : "bchtest:ppcv48up7qv7r6epdmy5nn3x3hyf9cjec5aglzm6x4",
            "addresses" : [
              "bchtest:ppcv48up7qv7r6epdmy5nn3x3hyf9cjec5aglzm6x4"
            ],
            "balance" : "11.9999439",
            "legacy" : "2N3XcQGSrdZPDwj6z3tu3iaA3msrdzVoPXT",
            "totalReceived" : "11.9999439",
            "totalSpent" : "0",
            "txi" : 0,
            "txo" : 1,
            "txsCount" : 1
        }
    })
    .matchHeader('X-API-Key', 'my____ApiKey')
    .get('/address/2N3XcQGSrdZPDwj6z3tu3iaA3msrdzVoPXT/unspent-transactions') // Nock for unspent information
    .reply(200, {
       "meta" : {
        "results" : 1,
          "totalCount" : 1
        },
        "payload" : [
        {
          "amount" : 11.9999439,
          "txid" : "dfa6e8fb31dcbcb4adb36ed247ceb37d32f44335f662b0bb41372a9e9419335a",
          "vout" : 0
        }
        ]
    });
  nock(baseUrl)
    .get('/address/2N7kMMaUjmBYCiZqQV7GDJhBSnJuJoTuBws/unspent-transactions')
    .reply(401, {
      "meta" : {
        "error" : {
          "code" : 34,
            "message" : "Authorization header (API Key) is missing"
        }
      }
    })
}

describe('blockchair api', function() {
  const apiKey = 'my____ApiKey';
  const bitgo = new TestBitGo({env: 'test'});
  const env = bitgo.getEnv() as string;
  for (const coinName of coinNames) {
    describe(`${coinName} should succeed`, function() {
      it('should get address information from cryptoAPIs', async function() {
        nockCryptoAPIs(env, coinName);
        const cryptoApi = new CryptoApi(bitgo, coinName, apiKey);
        const address = await cryptoApi.getAccountInfo('2N3XcQGSrdZPDwj6z3tu3iaA3msrdzVoPXT');
        address.txCount.should.equal(1);
        address.totalBalance.should.equal("11.9999439");
      });

      it('should get utxo information from cryptoAPIs', async function() {
        nockCryptoAPIs(env, coinName);
        const cryptoApi = new CryptoApi(bitgo, coinName, apiKey);
        const response = await cryptoApi.getUnspents('2N3XcQGSrdZPDwj6z3tu3iaA3msrdzVoPXT');
        response.length.should.equal(1);
        response[0].amount.should.equal(11.9999439);
        response[0].n.should.equal(0);
        response[0].txid.should.equal('dfa6e8fb31dcbcb4adb36ed247ceb37d32f44335f662b0bb41372a9e9419335a');
        response[0].address.should.equal('2N3XcQGSrdZPDwj6z3tu3iaA3msrdzVoPXT');
      });
    });

    describe(`${coinName} should fail`,  function() {
      it('should throw if the address value is an empty string', async function() {
        const cryptoApi = new CryptoApi(bitgo, coinName, apiKey);
        await cryptoApi.getUnspents('').should.be.rejectedWith('invalid address');
      });
      it('should throw if the API key is invalid', async function() {
        const cryptoApi = new CryptoApi(bitgo, coinName, '');
        await cryptoApi.getUnspents('2N7kMMaUjmBYCiZqQV7GDJhBSnJuJoTuBws').should.be.rejectedWith('Unauthorized');
      })
    });

  }

});
