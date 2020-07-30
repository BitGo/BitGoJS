import should from 'should';
import { coins } from '@bitgo/statics';
import { Transaction } from '../../../../src/coin/hbar/transaction';
import { toUint8Array } from '../../../../src/coin/hbar/utils';

describe('Hedera Transaction', () => {
  it('should create a transaction from serialized and serialize it again', () => {
    const tx = new Transaction(coins.get('thbar'));
    const serialized =
      '1a660a640a20d32b7b1eb103c10a6c8f6ec575b8002816e9725d95485b3d5509aa8c89b4528b1a405bd75a8d137f9e4f22893a768e9cd7179b575fc35a26785209b0578b0dffa6226936313037edb1d95862bbd8f3e143aae76c15782d765971385a228047f1e40822b5010a140a0c0887f085f9051080cf898a02120418d5d004120218041880c2d72f220208785a8f010a722a700802126c0a221220894f47f45f57d11498f16acd354aaee923d2555f9b96b6e186bd350767f7b2200a221220f560424f00738ba35388f85a693759c5b467407691be4316a4ce8e8ac50735c30a2212206f8ad5022814a007e2763ab9ed4687a1129f12efc02a09af32ad04878b8329f430ffffffffffffffff7f38ffffffffffffffff7f4a0508d0c8e103';
    tx.bodyBytes(toUint8Array(serialized));
    const txData = tx.toJson();
    should.equal(txData.id, '0.0.75861@1596028935.558000000');
    should.equal(txData.from, '0.0.75861');
    should.equal(txData.startTime, '1596028935.558000000');
    should.equal(
      txData.hash,
      'dd34758e2810bff2c15099b519ba26af1434dcbf21365dac9c9fb48fcd25cb40011400d17aca229d82141a8aed54e193',
    );
    should.equal(tx.toBroadcastFormat(), serialized);
  });
});
