import should from 'should';
import { coins } from '@bitgo/statics';
import { TransactionType } from '@bitgo/sdk-core';
import { bufferToHex } from 'ethereumjs-util';
import { TransactionBuilder } from '../../src/lib/transactionBuilder';
import {
  TransferBuilder,
  ERC721TransferBuilder,
  ERC1155TransferBuilder,
  TransferBuilderERC7984,
} from '../../src/lib';
import { ETHTransactionType } from '../../src/lib/iface';
import { SetCodeAuthorization } from '../../src/lib/eip7702';

const ADDRESS = '0xbe78addef3bf432e660f0944e372954d1d287fe2';
const AUTH_R = bufferToHex(
  Buffer.from([
    25, 229, 118, 20, 137, 169, 86, 96, 43, 249, 69, 39, 108, 155, 222, 155, 34, 67, 100, 144, 182, 168, 92, 18, 23,
    212, 148, 74, 48, 85, 15, 18,
  ])
);
const AUTH_S = bufferToHex(
  Buffer.from([
    113, 131, 176, 111, 21, 92, 14, 192, 100, 196, 201, 90, 152, 101, 90, 103, 97, 132, 66, 18, 156, 199, 146, 43,
    229, 16, 60, 235, 190, 188, 221, 235,
  ])
);

class TestBuilder extends TransactionBuilder {
  transfer(): TransferBuilder | ERC721TransferBuilder | ERC1155TransferBuilder | TransferBuilderERC7984 {
    throw new Error('transfer not used in this test');
  }

  public get tx() {
    return this.transaction;
  }
}

const coinConfig = coins.get('eth');

const authorizationList: SetCodeAuthorization[] = [
  { chainId: 1, address: ADDRESS, nonce: 0, yParity: 0, r: AUTH_R, s: AUTH_S },
];

describe('TransactionBuilder EIP-7702', () => {
  it('builds a 0x04 tx via eip7702() and setAuthorizationList()', async () => {
    const builder = new TestBuilder(coinConfig);
    builder.type(TransactionType.SingleSigSend);
    builder.contract(ADDRESS);
    builder.counter(0);
    builder.value('0');
    builder.fee({
      fee: '30',
      gasLimit: '21000',
      eip1559: { maxFeePerGas: '30', maxPriorityFeePerGas: '1' },
    });
    builder.eip7702().setAuthorizationList(authorizationList);

    const tx = await builder.build();
    const json = tx.toJson();

    should.equal(json._type, ETHTransactionType.EIP7702);
    should(tx.toBroadcastFormat().toLowerCase()).startWith('0x04');
  });

  it('loads a serialized 0x04 tx through from()', () => {
    const builder = new TestBuilder(coinConfig);
    // Serialized via the util; validateRawTransaction must accept the 0x04 type byte.
    const serialized =
      '0x04f8c10180011e82520894be78addef3bf432e660f0944e372954d1d287fe28080c0f85df85b0194be78addef3bf432e660f0944e372954d1d287fe2c18080a019e5761489a956602bf945276c9bde9b22436490b6a85c1217d4944a30550f12a007183b06f155c0ec064c4c95a98655a6761844219cc7922be5103cebbe8cddeb01a002fdfa74e15a8e803b851b31787d00ff6e6611f32e94432fc556bce51edd56f7a07a889b375db8ca4087664ea78a889115fdc05e8a9ef1879595a1316330f4a1fc';
    builder.from(serialized);
    const json = builder.tx.toJson();
    should.equal(json._type, ETHTransactionType.EIP7702);
    should(json.r).not.equal(undefined);
  });
});
