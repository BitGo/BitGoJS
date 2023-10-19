import { TestBitGo } from '@bitgo/sdk-test';
import { BitGo } from '../../../src/bitgo';

import * as nock from 'nock';
import { bip32 } from '@bitgo/utxo-lib';
import { common, TransactionType } from '@bitgo/sdk-core';
import { AvaxC as AvaxCAccountLib, getBuilder } from '../../../../account-lib';

nock.enableNetConnect();

describe('MMI:', function () {
  let bitgo;
  describe('MMI', async function () {
    before(function () {
      const bitgoKeyXprv =
        'xprv9s21ZrQH143K3tpWBHWe31sLoXNRQ9AvRYJgitkKxQ4ATFQMwvr7hHNqYRUnS7PsjzB7aK1VxqHLuNQjj1sckJ2Jwo2qxmsvejwECSpFMfC';
      const bitgoKey = bip32.fromBase58(bitgoKeyXprv);
      if (!bitgoKey.privateKey) {
        throw new Error('no privateKey');
      }
      const bitgoXpub = bitgoKey.neutered().toBase58();

      const env = 'test';
      bitgo = TestBitGo.decorate(BitGo, { env: 'test' });
      common.Environments[env].hsmXpub = bitgoXpub;
      bitgo.initializeTestVars();
    });

    after(function () {
      nock.cleanAll();
    });

    it(`should sign an eth mmi transaction with custodianTransactionId`, async function () {
      const coin = bitgo.coin('hteth');
      const userKeychain = {
        prv: 'xprv9s21ZrQH143K3hekyNj7TciR4XNYe1kMj68W2ipjJGNHETWP7o42AjDnSPgKhdZ4x8NBAvaL72RrXjuXNdmkMqLERZza73oYugGtbLFXG8g',
        pub: 'xpub661MyMwAqRbcGBjE5QG7pkf9cZD33UUD6K46q7ELrbuG7FqXfLNGiXYGHeEnGBb5AWREnk1eA28g8ArZvURbhshXWkTtddHRo54fgyVvLdb',
        rawPub: '023636e68b7b204573abda2616aff6b584910dece2543f1cc6d842caac7d74974b',
        rawPrv: '7438a50010ce7b1dfd86e68046cc78ba1ebd242d6d85d9904d3fcc08734bc172',
      };
      const params = {
        custodianTransactionId: 'mmitx',
        txPrebuild: {
          eip1559: { maxPriorityFeePerGas: 10, maxFeePerGas: 10 },
          isBatch: false,
          recipients: [
            {
              amount: '0',
              address: '0xc93b13642d93b4218bb85f67317d6b37286e8028',
            },
          ],
          expireTime: 1627949214,
          contractSequenceId: 12,
          gasLimit: undefined,
          gasPrice: undefined,
          hopTransaction: undefined,
          backupKeyNonce: undefined,
          sequenceId: undefined,
          nextContractSequenceId: 0,
        },
        prv: userKeychain.prv,
      };
      const halfSignedTransaction = await coin.signTransaction(params);

      halfSignedTransaction.halfSigned.custodianTransactionId.should.equal('mmitx');
    });

    it(`should sign an avax mmi transaction with custodianTransactionId`, async function () {
      const coin = bitgo.coin('tavaxc');

      const account_1 = {
        address: '0xeeaf0F05f37891ab4a21208B105A0687d12c5aF7',
        owner_1: '4ee089aceabf3ddbf748db79b1066c33b7d3ea1ab3eb7e325121bba2bff2f5ca',
        owner_2: '5ca116d25aec5f765465432cc421ff25ef9ffdc330b10bb3d9ad61e3baad88d7',
        owner_3: '1fae946cc84af8bd74d610a88537e24e19c3349d478d86fc5bb59ba4c88fb9cc',
      };

      const account_2 = {
        address: '0x8Ce59c2d1702844F8EdED451AA103961bC37B4e8',
        owner_1: '4ee089aceabf3ddbf748db79b1066c33b7d3ea1ab3eb7e325121bba2bff2f5ca',
        owner_2: '5c7e4efff7304d4dfff6d5f1591844ec6f2adfa6a47e9fece6a3c1a4d755f1e3',
        owner_3: '4421ab25dd91e1a3180d03d57c323a7886dcc313d3b3a4b4256a5791572bf597',
      };

      const builder = getBuilder('tavaxc') as AvaxCAccountLib.TransactionBuilder;
      builder.fee({
        fee: '280000000000',
        gasLimit: '7000000',
      });
      builder.counter(1);
      builder.type(TransactionType.Send);
      builder.contract(account_1.address);
      builder.transfer().amount('1').to(account_2.address).expirationTime(10000).contractSequenceId(1);

      const unsignedTx = await builder.build();
      const unsignedTxForBroadcasting = unsignedTx.toBroadcastFormat();

      const halfSignedRawTx = await coin.signTransaction({
        custodianTransactionId: 'mmitx',
        txPrebuild: {
          txHex: unsignedTxForBroadcasting,
          eip1559: {
            maxFeePerGas: '7593123',
            maxPriorityFeePerGas: '150',
          },
        },
        prv: account_1.owner_2,
      });

      halfSignedRawTx.halfSigned.custodianTransactionId.should.equal('mmitx');
    });
  });
});
