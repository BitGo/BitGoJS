import should from 'should';
import { getBuilder } from '../../../src/lib/builder';
import { WrappedBuilder } from '../../../src';
import {
  PARTICIPANTS,
  BLOCK_HASH,
  BLOCK_NUMBER,
  TOKEN_TX_CONTRACT,
  FEE_LIMIT,
  USDT_CONTRACT_ADDRESS,
  TOKEN_TRANSFER_RECIPIENT,
  TOKEN_TXID,
  TOKEN_TX_CONTRACT_2,
} from '../../resources';

describe('TRX Token Transfer Builder', () => {
  const initTxBuilder = (amount = 1000000000) => {
    const builder = (getBuilder('ttrx:usdt') as WrappedBuilder).getTokenTransferBuilder();
    builder
      .source({ address: PARTICIPANTS.custodian.address })
      .to({ address: USDT_CONTRACT_ADDRESS })
      .block({ number: BLOCK_NUMBER, hash: BLOCK_HASH })
      .fee({ feeLimit: FEE_LIMIT });
    return builder;
  };

  describe('should build', () => {
    describe('non serialized transactions', () => {
      it('a signed token contract call transaction', async () => {
        const txBuilder = initTxBuilder();
        txBuilder.tokenTransferData(TOKEN_TRANSFER_RECIPIENT, 1000000000).sign({ key: PARTICIPANTS.custodian.pk });
        const tx = await txBuilder.build();
        const txJson = tx.toJson();
        const rawData = txJson.raw_data;
        should.deepEqual(rawData.contract, TOKEN_TX_CONTRACT);
      });

      it('from a signed token contract call transaction', async () => {
        const txHex =
          '{"raw_data":{"contractType":2,"contract":[{"parameter":{"value":{"data":"a9059cbb0000000000000000000000008483618ca85c35a9b923d98bebca718f5a1db2790000000000000000000000000000000000000000000000000000000005f5e100","owner_address":"41c51fbeea78910b15b1d3e8a9b62914ca94d1a4ac","contract_address":"4142a1e39aefa49290f2b3f9ed688d7cecf86cd6e0"},"type_url":"type.googleapis.com/protocol.TriggerSmartContract"},"type":"TriggerSmartContract"}],"expiration":1674581767432,"timestamp":1674578167432,"ref_block_bytes":"578b","ref_block_hash":"6113bb9ac351432b","fee_limit":15000000},"raw_data_hex":"0a02578b22086113bb9ac351432b4088eae7a6de305aae01081f12a9010a31747970652e676f6f676c65617069732e636f6d2f70726f746f636f6c2e54726967676572536d617274436f6e747261637412740a1541c51fbeea78910b15b1d3e8a9b62914ca94d1a4ac12154142a1e39aefa49290f2b3f9ed688d7cecf86cd6e02244a9059cbb0000000000000000000000008483618ca85c35a9b923d98bebca718f5a1db2790000000000000000000000000000000000000000000000000000000005f5e10070888d8ca5de309001c0c39307","txID":"fe21c49f4febd9089125e3a006943c145721d8fcb7ab84136f8c6663ff92f8ed","signature":["0775cde302689eb8293883c66a89b31e80d608bfc3ad3c283b64a490ea4cc712c55a2fd2e62c75843dd7e77d8c4cb52e0f371fbb29b332c259f8cb63c2e6195301"]}';
        const txBuilder = getBuilder('ttrx:usdt').from(txHex);
        const tx = await txBuilder.build();
        tx.id.should.equal(TOKEN_TXID);
        const txJson = tx.toJson();
        const rawData = txJson.raw_data;
        should.deepEqual(rawData.contract, TOKEN_TX_CONTRACT_2);
      });
    });
  });
});
