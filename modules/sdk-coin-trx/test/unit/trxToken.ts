import assert from 'node:assert';
import { describe, it, before } from 'node:test';
import { BitGoAPI } from '@bitgo/sdk-api';
import { TestBitGoAPI, TestBitGo } from '@bitgo/sdk-test';
import { tokens } from '@bitgo/statics';
import { Trx } from '../../src/trx';
import { TrxToken } from '../../src/trxToken';
import { Ttrx } from '../../src/ttrx';
import { Utils } from '../../src/lib';

// Real TriggerSmartContract protobuf raw_data_hex encoding a TRC20 transfer:
//   owner:    41c51fbeea78910b15b1d3e8a9b62914ca94d1a4ac
//   contract: 4142a1e39aefa49290f2b3f9ed688d7cecf86cd6e0
//   data:     a9059cbb + abi(address=8483618ca85c35a9b923d98bebca718f5a1db279, uint256=100000000)
const TRC20_RAW_DATA_HEX =
  '0a02578b22086113bb9ac351432b4088eae7a6de305aae01081f12a9010a31747970652e676f6f676c65617069732e636f6d2f70726f746f636f6c2e54726967676572536d617274436f6e747261637412740a1541c51fbeea78910b15b1d3e8a9b62914ca94d1a4ac12154142a1e39aefa49290f2b3f9ed688d7cecf86cd6e02244a9059cbb0000000000000000000000008483618ca85c35a9b923d98bebca718f5a1db2790000000000000000000000000000000000000000000000000000000005f5e10070888d8ca5de309001c0c39307';

// Recipient address decoded from the ABI data above (41 prefix → base58)
const TRC20_RECIPIENT_HEX = '418483618ca85c35a9b923d98bebca718f5a1db279';
const TRC20_AMOUNT = '100000000';

describe('TrxToken verifyTransaction:', function () {
  const bitgo: TestBitGoAPI = TestBitGo.decorate(BitGoAPI, { env: 'test' });
  bitgo.initializeTestVars();
  bitgo.safeRegister('trx', Trx.createInstance);
  bitgo.safeRegister('ttrx', Ttrx.createInstance);

  let tokenCoin: TrxToken;

  before(function () {
    const usdtConfig = tokens.testnet.trx.tokens.find((t) => t.type === 'ttrx:usdt');
    assert.ok(usdtConfig, 'ttrx:usdt token config not found');
    tokenCoin = new TrxToken(bitgo, usdtConfig);
  });

  describe('TSS wallet — TriggerSmartContract validation', () => {
    it('should validate a correct TRC20 transfer', async function () {
      const recipientBase58 = Utils.getBase58AddressFromHex(TRC20_RECIPIENT_HEX);

      const result = await tokenCoin.verifyTransaction({
        txPrebuild: { txHex: TRC20_RAW_DATA_HEX },
        txParams: { recipients: [{ address: recipientBase58, amount: TRC20_AMOUNT }] },
        walletType: 'tss',
      } as any);

      assert.strictEqual(result, true);
    });

    it('should validate when txHex is a serialized JSON (prebuildAndSignTransaction path)', async function () {
      const recipientBase58 = Utils.getBase58AddressFromHex(TRC20_RECIPIENT_HEX);
      const serializedTxHex = JSON.stringify({ txID: 'abc', raw_data_hex: TRC20_RAW_DATA_HEX, raw_data: {} });

      const result = await tokenCoin.verifyTransaction({
        txPrebuild: { txHex: serializedTxHex },
        txParams: { recipients: [{ address: recipientBase58, amount: TRC20_AMOUNT }] },
        walletType: 'tss',
      } as any);

      assert.strictEqual(result, true);
    });

    it('should throw when amount does not match', async function () {
      const recipientBase58 = Utils.getBase58AddressFromHex(TRC20_RECIPIENT_HEX);

      await assert.rejects(
        tokenCoin.verifyTransaction({
          txPrebuild: { txHex: TRC20_RAW_DATA_HEX },
          txParams: { recipients: [{ address: recipientBase58, amount: '999' }] },
          walletType: 'tss',
        } as any),
        { message: 'transaction amount in txPrebuild does not match the value given by client' }
      );
    });

    it('should throw when recipient address does not match', async function () {
      await assert.rejects(
        tokenCoin.verifyTransaction({
          txPrebuild: { txHex: TRC20_RAW_DATA_HEX },
          txParams: { recipients: [{ address: 'TLWh67P93KgtnZNCtGnEHM1H33Nhq2uvvN', amount: TRC20_AMOUNT }] },
          walletType: 'tss',
        } as any),
        { message: 'destination address does not match with the recipient address' }
      );
    });

    it('should throw when recipients is empty', async function () {
      await assert.rejects(
        tokenCoin.verifyTransaction({
          txPrebuild: { txHex: TRC20_RAW_DATA_HEX },
          txParams: { recipients: [] },
          walletType: 'tss',
        } as any),
        { message: 'missing or invalid required property recipients' }
      );
    });

    it('should throw when contract type is not TriggerSmartContract', async function () {
      // Use a native TRX Transfer protobuf as txHex — TrxToken only handles TriggerSmartContract
      const recipientBase58 = Utils.getBase58AddressFromHex(TRC20_RECIPIENT_HEX);
      const nativeTrxRawDataHex = Utils.generateRawDataHex({
        contract: [
          {
            parameter: {
              value: {
                amount: 100000000,
                owner_address: '4173a5993cd182ae152adad8203163f780c65a8aa5',
                to_address: TRC20_RECIPIENT_HEX,
              } as any,
              type_url: 'type.googleapis.com/protocol.TransferContract',
            },
            type: 'TransferContract',
          } as any,
        ],
        refBlockBytes: 'c8cf',
        refBlockHash: '89177fd84c5d9196',
        expiration: Date.now() + 3600000,
        timestamp: Date.now(),
      });

      await assert.rejects(
        tokenCoin.verifyTransaction({
          txPrebuild: { txHex: nativeTrxRawDataHex },
          txParams: { recipients: [{ address: recipientBase58, amount: '100000000' }] },
          walletType: 'tss',
        } as any),
        { message: /Expected TriggerSmartContract for TRC20 token transfer/ }
      );
    });
  });

  describe('non-TSS wallet — builder-based validation (existing path)', () => {
    it('should validate a correct non-TSS TRC20 transfer using txBuilder', async function () {
      // The non-TSS path uses getBuilder().from(rawTx).build() and checks tx.outputs[0]
      // This test uses the full JSON tx format that the builder understands.
      const txHex =
        '{"raw_data":{"contractType":2,"contract":[{"parameter":{"value":{"data":"a9059cbb0000000000000000000000008483618ca85c35a9b923d98bebca718f5a1db2790000000000000000000000000000000000000000000000000000000005f5e100","owner_address":"41c51fbeea78910b15b1d3e8a9b62914ca94d1a4ac","contract_address":"4142a1e39aefa49290f2b3f9ed688d7cecf86cd6e0"},"type_url":"type.googleapis.com/protocol.TriggerSmartContract"},"type":"TriggerSmartContract"}],"expiration":1674581767432,"timestamp":1674578167432,"ref_block_bytes":"578b","ref_block_hash":"6113bb9ac351432b","fee_limit":15000000},"raw_data_hex":"0a02578b22086113bb9ac351432b4088eae7a6de305aae01081f12a9010a31747970652e676f6f676c65617069732e636f6d2f70726f746f636f6c2e54726967676572536d617274436f6e747261637412740a1541c51fbeea78910b15b1d3e8a9b62914ca94d1a4ac12154142a1e39aefa49290f2b3f9ed688d7cecf86cd6e02244a9059cbb0000000000000000000000008483618ca85c35a9b923d98bebca718f5a1db2790000000000000000000000000000000000000000000000000000000005f5e10070888d8ca5de309001c0c39307","txID":"fe21c49f4febd9089125e3a006943c145721d8fcb7ab84136f8c6663ff92f8ed","signature":["0775cde302689eb8293883c66a89b31e80d608bfc3ad3c283b64a490ea4cc712c55a2fd2e62c75843dd7e77d8c4cb52e0f371fbb29b332c259f8cb63c2e6195301"]}';
      const recipientBase58 = Utils.getBase58AddressFromHex(TRC20_RECIPIENT_HEX);

      const result = await tokenCoin.verifyTransaction({
        txPrebuild: { txHex },
        txParams: { recipients: [{ address: recipientBase58, amount: TRC20_AMOUNT }] },
      } as any);

      assert.strictEqual(result, true);
    });
  });
});
