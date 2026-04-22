import * as assert from 'assert';
import { DklsUtils } from '@bitgo/sdk-lib-mpc';
import { BitGo } from 'bitgo';
import { EcdsaMPCv2Utils } from 'modules/sdk-core/src';

describe('ECDSA MPC v2', () => {
  it('should sign a message hash using ECDSA MPC v2 offline rounds', async () => {
    const [userShare, backupShare, bitgoShare] = await DklsUtils.generateDKGKeyShares();

    assert.ok(userShare);
    assert.ok(backupShare);
    assert.ok(bitgoShare);

    const bg = new BitGo({ env: 'test' });
    const coin = bg.coin('hteth');
    const ecdsaMPCv2Utils = new EcdsaMPCv2Utils(bg, coin);

    const walletID = '62fe536a6b4cf70007acb48c0e7bb0b0';
    const tMessage = 'testMessage';
    const derivationPath = 'm/0';
    const walletPassphrase = 'testPass';

    const reqMPCv2SigningRound1 = {
      txRequest: {
        txRequestId: '123456',
        apiVersion: 'full',
        walletId: walletID,
        transactions: [
          {
            unsignedTx: {
              derivationPath,
              signableHex: tMessage,
            },
            signatureShares: [],
          },
        ],
      },
      prv: userShare.getKeyShare().toString('base64'),
      walletPassphrase,
    };

    const resMPCv2SigningRound1 = await ecdsaMPCv2Utils.createOfflineRound1Share(reqMPCv2SigningRound1);
    assert.ok(resMPCv2SigningRound1.signatureShareRound1);
  });
});
