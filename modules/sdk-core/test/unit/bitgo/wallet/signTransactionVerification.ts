import { BitGoAPI } from '@bitgo/sdk-api';
import { TestBitGo } from '@bitgo/sdk-test';
import * as assert from 'assert';
import 'should';
import { Wallet } from '../../../../src/bitgo/wallet/wallet';
import { WalletSignTransactionOptions } from '../../../../src/bitgo/wallet/iWallet';
import { BaseCoin, BitGoBase } from 'modules/sdk-core/src';
import { Tbtc } from '@bitgo/sdk-coin-btc';
import nock from 'nock';
import { common } from '@bitgo/sdk-core';

describe('Wallet signTransaction with verifyTxParams', function () {
  let realWallet: Wallet;

  beforeEach(function () {
    const bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
    bitgo.initializeTestVars();
    bitgo.safeRegister('tbtc', Tbtc.createInstance);
    const basecoin = bitgo.coin('tbtc');

    // Real wallet data from tbtc testnet
    const realWalletData = {
      id: '6840948b17e91662b782d55bbf988c4e',
      coin: 'tbtc',
      label: 'Test: User & Backup Signing',
      m: 2,
      n: 3,
      keys: [
        '6840947d037fdb798e0bf860e52cc4a8',
        '6840947e7c18efe3b0b77e9a75308aab',
        '68409480bdf143f4a1d32474acc09baa',
      ],
      multisigType: 'onchain',
      type: 'hot',
      balance: 329034,
      balanceString: '329034',
      confirmedBalance: 329034,
      confirmedBalanceString: '329034',
      spendableBalance: 329034,
      spendableBalanceString: '329034',
    };

    realWallet = new Wallet(bitgo as unknown as BitGoBase, basecoin as unknown as BaseCoin, realWalletData);
  });

  it('should fail verification when expected recipient does not match actual transaction recipient', async function () {
    // Real transaction hex that sends to tb1qvuyyput9dy5j8j8gwzwjw8jx0z2gq778p0xyna28tzyu0z0anjfs3pf2mp
    const realTxHex =
      '70736274ff0100890100000001e082ee5f3be60a260bd181d86cbc3ed1f2f53f6e33572138c3220a461d64e13d0100000000fdffffff021027000000000000220020670840f165692923c8e8709d271e467894807bc70bcc49f5475889c789fd9c9375d50400000000002251205ae846b2c844e131cefcf635e8566a683a3f96c97410c43413f919cc9247e182000000004f010488b21e000000000000000000940a6f6c2d84214ba69e48354858dd8e4df2b0f36d51b6721516172c4b56922402c8d26710504a5a7965c8fce430057418802bc5a06e1987ede6897fb40e0a66b5044b8de8914f010488b21e0000000000000000009c6426c55cb8e0b186f7f776b42cb4de8118be401cce288bcb1ef70457f4072c0397f25ebd3f03c85333b1ffc14e04d051b476a5e48e4e0a5e999c0cf163c3178704758af64b4f010488b21e000000000000000000ab9a6eea233e963b74fd79afd9c71d467fb1ce1d91fe1681e2b7332e203baae6033e70fb09c6eb45d08aff2f067060c6345143918961d5bee0e1d8037b77001925047b156bd00001012b8e02050000000000225120a385cb8dc799daaffb15a3e311e1465b3ce990017034ec4e1e2056575a3f609001030400000000211686f3450713d04e8ac343e576c1df80c5a1fca4e45aff6ee6447ceeb4d0d51d671500758af64b000000000000000029000000110000002116b7d96086e8b6763162b7deb2a0149d104d01a2ddad547f290822d304dd6bd14815004b8de89100000000000000002900000011000000011720cd77b37b43fe3ae9cdcb266faaf4b443766269f3182f6bb40f3a9db93f8384d7011820b558f0176c61865e960bbd14bff1e251b99cebb81fea61c0f931452dc029778648fc05424954474f01a385cb8dc799daaffb15a3e311e1465b3ce990017034ec4e1e2056575a3f6090cd77b37b43fe3ae9cdcb266faaf4b443766269f3182f6bb40f3a9db93f8384d7420286f3450713d04e8ac343e576c1df80c5a1fca4e45aff6ee6447ceeb4d0d51d6703b7d96086e8b6763162b7deb2a0149d104d01a2ddad547f290822d304dd6bd14800000105200fc5866bddca6f779664a6910eda9af586287893c805b717b90af777cb5b2a0501068e01c04420ac366be7d240d82968539bdab6fc81fdb016f0b73d720afd1bfdd50bc8b37317ad206c5e41b4813b4b0112e41738dea9b866d30c5f34832961120a5bfddaf9547245ac01c044206c5e41b4813b4b0112e41738dea9b866d30c5f34832961120a5bfddaf9547245ad2005e1bca7220c83cc2d6a2c596f8fe00b9bc084bee5667cab06fa3354f1565a91ac210705e1bca7220c83cc2d6a2c596f8fe00b9bc084bee5667cab06fa3354f1565a91350177065e65a3639ada742d46b3d282980784549337c12f015385b727711d98b4374b8de8910000000000000000290000001200000021076c5e41b4813b4b0112e41738dea9b866d30c5f34832961120a5bfddaf954724555020e7b30f7ec73ccbc76d8e08bc35c7b4837defce7f184f658c95b94bdec831a3277065e65a3639ada742d46b3d282980784549337c12f015385b727711d98b4374b156bd0000000000000000029000000120000002107ac366be7d240d82968539bdab6fc81fdb016f0b73d720afd1bfdd50bc8b3731735010e7b30f7ec73ccbc76d8e08bc35c7b4837defce7f184f658c95b94bdec831a32758af64b0000000000000000290000001200000000';

    const txPrebuild = {
      txHex: realTxHex,
      walletId: '6840948b17e91662b782d55bbf988c4e',
    };

    // Verification parameters with wrong expected recipient
    const verifyTxParams = {
      txParams: {
        recipients: [
          {
            address: '2Muux9UnVFCiGaYbX8D8FTsKaErkhLXRX5n', // Expected recipient
            amount: '10000', // Expected amount
          },
        ],
        type: 'send',
      },
    };
    const bgUrl = common.Environments['test'].uri;
    nock(bgUrl).get(`/api/v2/tbtc/key/${realWallet.keyIds()[0]}`).reply(200, {
      id: '6840947d037fdb798e0bf860e52cc4a8',
      pub: 'pub',
      encryptedPrv:
        'xprv9s21ZrQH143K3QTDL4LXw2F7HEK3wJUD2nW2nRk4stbPy6cq3jPPqjiChkVvvNKmPGJxWUtg6LnF5kejMRNNU3TGtRBeJgk33yuGBxrMPHi',
    });

    nock(bgUrl).get(`/api/v2/tbtc/key/${realWallet.keyIds()[1]}`).reply(200, {
      id: realWallet.keyIds()[1],
      pub: 'pub',
      encryptedPrv:
        'xprv9s21ZrQH143K3QTDL4LXw2F7HEK3wJUD2nW2nRk4stbPy6cq3jPPqjiChkVvvNKmPGJxWUtg6LnF5kejMRNNU3TGtRBeJgk33yuGBxrMPHi',
    });

    nock(bgUrl).get(`/api/v2/tbtc/key/${realWallet.keyIds()[2]}`).reply(200, {
      id: realWallet.keyIds()[2],
      pub: 'pub',
      encryptedPrv:
        'xprv9s21ZrQH143K3QTDL4LXw2F7HEK3wJUD2nW2nRk4stbPy6cq3jPPqjiChkVvvNKmPGJxWUtg6LnF5kejMRNNU3TGtRBeJgk33yuGBxrMPHi',
    });

    const signParams: WalletSignTransactionOptions = {
      txPrebuild,
      verifyTxParams,
      prv: 'test-private-key',
    };

    try {
      await realWallet.signTransaction(signParams);
      assert.fail('Should have thrown verification error');
    } catch (error) {
      assert.ok(
        error.message.includes('recipient address mismatch'),
        `Error message should contain 'recipient address mismatch', got: ${error.message}`
      );
      assert.ok(
        error.message.includes('2Muux9UnVFCiGaYbX8D8FTsKaErkhLXRX5n'),
        `Error message should contain '2Muux9UnVFCiGaYbX8D8FTsKaErkhLXRX5n', got: ${error.message}`
      );
      assert.ok(
        error.message.includes('tb1qvuyyput9dy5j8j8gwzwjw8jx0z2gq778p0xyna28tzyu0z0anjfs3pf2mp'),
        `Error message should contain 'tb1qvuyyput9dy5j8j8gwzwjw8jx0z2gq778p0xyna28tzyu0z0anjfs3pf2mp', got: ${error.message}`
      );
    }

    // Verify that verifyTransaction was called with correct parameters
    mockBaseCoinReal.verifyTransaction.should.have.been.calledOnce;
    const verifyCall = mockBaseCoinReal.verifyTransaction.getCall(0);
    const verifyCallArgs = verifyCall.args[0];

    verifyCallArgs.should.have.property('txPrebuild');
    verifyCallArgs.txPrebuild.should.have.property('txHex', realTxHex);
    verifyCallArgs.txPrebuild.should.have.property('walletId', '6840948b17e91662b782d55bbf988c4e');
    verifyCallArgs.should.have.property('txParams', verifyTxParams.txParams);
    verifyCallArgs.should.have.property('verification', verifyTxParams.verification);
    verifyCallArgs.should.have.property('wallet', realWallet);
    verifyCallArgs.should.have.property('walletType', 'onchain');

    // Verify that signTransaction was not called due to verification failure
    mockBaseCoinReal.signTransaction.should.not.have.been.called;
  });

  it('should pass verification when expected recipient matches actual transaction recipient', async function () {
    // Same real transaction hex
    const realTxHex =
      '70736274ff0100890100000001e082ee5f3be60a260bd181d86cbc3ed1f2f53f6e33572138c3220a461d64e13d0100000000fdffffff021027000000000000220020670840f165692923c8e8709d271e467894807bc70bcc49f5475889c789fd9c9375d50400000000002251205ae846b2c844e131cefcf635e8566a683a3f96c97410c43413f919cc9247e182000000004f010488b21e000000000000000000940a6f6c2d84214ba69e48354858dd8e4df2b0f36d51b6721516172c4b56922402c8d26710504a5a7965c8fce430057418802bc5a06e1987ede6897fb40e0a66b5044b8de8914f010488b21e0000000000000000009c6426c55cb8e0b186f7f776b42cb4de8118be401cce288bcb1ef70457f4072c0397f25ebd3f03c85333b1ffc14e04d051b476a5e48e4e0a5e999c0cf163c3178704758af64b4f010488b21e000000000000000000ab9a6eea233e963b74fd79afd9c71d467fb1ce1d91fe1681e2b7332e203baae6033e70fb09c6eb45d08aff2f067060c6345143918961d5bee0e1d8037b77001925047b156bd00001012b8e02050000000000225120a385cb8dc799daaffb15a3e311e1465b3ce990017034ec4e1e2056575a3f609001030400000000211686f3450713d04e8ac343e576c1df80c5a1fca4e45aff6ee6447ceeb4d0d51d671500758af64b000000000000000029000000110000002116b7d96086e8b6763162b7deb2a0149d104d01a2ddad547f290822d304dd6bd14815004b8de89100000000000000002900000011000000011720cd77b37b43fe3ae9cdcb266faaf4b443766269f3182f6bb40f3a9db93f8384d7011820b558f0176c61865e960bbd14bff1e251b99cebb81fea61c0f931452dc029778648fc05424954474f01a385cb8dc799daaffb15a3e311e1465b3ce990017034ec4e1e2056575a3f6090cd77b37b43fe3ae9cdcb266faaf4b443766269f3182f6bb40f3a9db93f8384d7420286f3450713d04e8ac343e576c1df80c5a1fca4e45aff6ee6447ceeb4d0d51d6703b7d96086e8b6763162b7deb2a0149d104d01a2ddad547f290822d304dd6bd14800000105200fc5866bddca6f779664a6910eda9af586287893c805b717b90af777cb5b2a0501068e01c04420ac366be7d240d82968539bdab6fc81fdb016f0b73d720afd1bfdd50bc8b37317ad206c5e41b4813b4b0112e41738dea9b866d30c5f34832961120a5bfddaf9547245ac01c044206c5e41b4813b4b0112e41738dea9b866d30c5f34832961120a5bfddaf9547245ad2005e1bca7220c83cc2d6a2c596f8fe00b9bc084bee5667cab06fa3354f1565a91ac210705e1bca7220c83cc2d6a2c596f8fe00b9bc084bee5667cab06fa3354f1565a91350177065e65a3639ada742d46b3d282980784549337c12f015385b727711d98b4374b8de8910000000000000000290000001200000021076c5e41b4813b4b0112e41738dea9b866d30c5f34832961120a5bfddaf954724555020e7b30f7ec73ccbc76d8e08bc35c7b4837defce7f184f658c95b94bdec831a3277065e65a3639ada742d46b3d282980784549337c12f015385b727711d98b4374b156bd0000000000000000029000000120000002107ac366be7d240d82968539bdab6fc81fdb016f0b73d720afd1bfdd50bc8b3731735010e7b30f7ec73ccbc76d8e08bc35c7b4837defce7f184f658c95b94bdec831a32758af64b0000000000000000290000001200000000';

    const txPrebuild = {
      txHex: realTxHex,
      walletId: '6840948b17e91662b782d55bbf988c4e',
    };

    // Verification parameters with correct expected recipient
    const verifyTxParams = {
      txParams: {
        recipients: [
          {
            address: 'tb1qvuyyput9dy5j8j8gwzwjw8jx0z2gq778p0xyna28tzyu0z0anjfs3pf2mp', // Correct recipient
            amount: '10000', // Expected amount
          },
        ],
        type: 'send',
      },
      verification: {
        disableNetworking: true,
      },
    };

    const signParams: WalletSignTransactionOptions = {
      txPrebuild,
      verifyTxParams,
      prv: 'test-private-key',
    };

    // Mock presignTransaction to return the same params
    mockBaseCoinReal.presignTransaction.resolves(signParams);

    // Mock verifyTransaction to succeed
    mockBaseCoinReal.verifyTransaction.resolves(true);

    // Mock signTransaction to return a signed transaction
    mockBaseCoinReal.signTransaction.resolves({
      txHex: realTxHex,
      halfSigned: {},
    });

    const result = await realWallet.signTransaction(signParams);

    // Verify that verifyTransaction was called
    mockBaseCoinReal.verifyTransaction.should.have.been.calledOnce;

    // Verify that signTransaction was called after successful verification
    mockBaseCoinReal.signTransaction.should.have.been.calledOnce;

    // Verify the result
    result.should.have.property('txHex', realTxHex);
  });

  it('should handle amount verification in addition to address verification', async function () {
    const realTxHex =
      '70736274ff0100890100000001e082ee5f3be60a260bd181d86cbc3ed1f2f53f6e33572138c3220a461d64e13d0100000000fdffffff021027000000000000220020670840f165692923c8e8709d271e467894807bc70bcc49f5475889c789fd9c9375d50400000000002251205ae846b2c844e131cefcf635e8566a683a3f96c97410c43413f919cc9247e182000000004f010488b21e000000000000000000940a6f6c2d84214ba69e48354858dd8e4df2b0f36d51b6721516172c4b56922402c8d26710504a5a7965c8fce430057418802bc5a06e1987ede6897fb40e0a66b5044b8de8914f010488b21e0000000000000000009c6426c55cb8e0b186f7f776b42cb4de8118be401cce288bcb1ef70457f4072c0397f25ebd3f03c85333b1ffc14e04d051b476a5e48e4e0a5e999c0cf163c3178704758af64b4f010488b21e000000000000000000ab9a6eea233e963b74fd79afd9c71d467fb1ce1d91fe1681e2b7332e203baae6033e70fb09c6eb45d08aff2f067060c6345143918961d5bee0e1d8037b77001925047b156bd00001012b8e02050000000000225120a385cb8dc799daaffb15a3e311e1465b3ce990017034ec4e1e2056575a3f609001030400000000211686f3450713d04e8ac343e576c1df80c5a1fca4e45aff6ee6447ceeb4d0d51d671500758af64b000000000000000029000000110000002116b7d96086e8b6763162b7deb2a0149d104d01a2ddad547f290822d304dd6bd14815004b8de89100000000000000002900000011000000011720cd77b37b43fe3ae9cdcb266faaf4b443766269f3182f6bb40f3a9db93f8384d7011820b558f0176c61865e960bbd14bff1e251b99cebb81fea61c0f931452dc029778648fc05424954474f01a385cb8dc799daaffb15a3e311e1465b3ce990017034ec4e1e2056575a3f6090cd77b37b43fe3ae9cdcb266faaf4b443766269f3182f6bb40f3a9db93f8384d7420286f3450713d04e8ac343e576c1df80c5a1fca4e45aff6ee6447ceeb4d0d51d6703b7d96086e8b6763162b7deb2a0149d104d01a2ddad547f290822d304dd6bd14800000105200fc5866bddca6f779664a6910eda9af586287893c805b717b90af777cb5b2a0501068e01c04420ac366be7d240d82968539bdab6fc81fdb016f0b73d720afd1bfdd50bc8b37317ad206c5e41b4813b4b0112e41738dea9b866d30c5f34832961120a5bfddaf9547245ac01c044206c5e41b4813b4b0112e41738dea9b866d30c5f34832961120a5bfddaf9547245ad2005e1bca7220c83cc2d6a2c596f8fe00b9bc084bee5667cab06fa3354f1565a91ac210705e1bca7220c83cc2d6a2c596f8fe00b9bc084bee5667cab06fa3354f1565a91350177065e65a3639ada742d46b3d282980784549337c12f015385b727711d98b4374b8de8910000000000000000290000001200000021076c5e41b4813b4b0112e41738dea9b866d30c5f34832961120a5bfddaf954724555020e7b30f7ec73ccbc76d8e08bc35c7b4837defce7f184f658c95b94bdec831a3277065e65a3639ada742d46b3d282980784549337c12f015385b727711d98b4374b156bd0000000000000000029000000120000002107ac366be7d240d82968539bdab6fc81fdb016f0b73d720afd1bfdd50bc8b3731735010e7b30f7ec73ccbc76d8e08bc35c7b4837defce7f184f658c95b94bdec831a32758af64b0000000000000000290000001200000000';

    const txPrebuild = {
      txHex: realTxHex,
      walletId: '6840948b17e91662b782d55bbf988c4e',
    };

    // Verification parameters with correct address but wrong amount
    const verifyTxParams = {
      txParams: {
        recipients: [
          {
            address: 'tb1qvuyyput9dy5j8j8gwzwjw8jx0z2gq778p0xyna28tzyu0z0anjfs3pf2mp', // Correct recipient
            amount: '50000', // Wrong amount (actual is 10000 satoshis)
          },
        ],
        type: 'send',
      },
      verification: {
        disableNetworking: true,
      },
    };

    const signParams: WalletSignTransactionOptions = {
      txPrebuild,
      verifyTxParams,
      prv: 'test-private-key',
    };

    // Mock presignTransaction to return the same params
    mockBaseCoinReal.presignTransaction.resolves(signParams);

    // Mock verifyTransaction to fail with amount mismatch error
    mockBaseCoinReal.verifyTransaction.rejects(
      new Error('Transaction verification failed: amount mismatch. Expected 50000 but transaction sends 10000')
    );

    try {
      await realWallet.signTransaction(signParams);
      assert.fail('Should have thrown verification error');
    } catch (error) {
      assert.ok(
        error.message.includes('amount mismatch'),
        `Error message should contain 'amount mismatch', got: ${error.message}`
      );
      assert.ok(
        error.message.includes('Expected 50000'),
        `Error message should contain 'Expected 50000', got: ${error.message}`
      );
      assert.ok(
        error.message.includes('sends 10000'),
        `Error message should contain 'sends 10000', got: ${error.message}`
      );
    }

    // Verify that verifyTransaction was called
    mockBaseCoinReal.verifyTransaction.should.have.been.calledOnce;

    // Verify that signTransaction was not called due to verification failure
    mockBaseCoinReal.signTransaction.should.not.have.been.called;
  });
});
