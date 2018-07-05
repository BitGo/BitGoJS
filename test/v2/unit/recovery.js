//
// Tests for Wallets
//

const should = require('should');
const Promise = require('bluebird');
const co = Promise.coroutine;
const nock = require('nock');
nock.enableNetConnect();

const TestV2BitGo = require('../../lib/test_bitgo');
const recoveryNocks = require('../lib/recovery-nocks');

describe('Recovery:', function() {
  let bitgo;

  before(function() {
    // TODO: replace dev with test
    bitgo = new TestV2BitGo({ env: 'test' });
    bitgo.initializeTestVars();

  });

  after(function() {
    nock.cleanAll();
  });

  describe('Recover Bitcoin', function() {
    it('should generate BTC recovery tx', co(function *() {
      recoveryNocks.nockBtcRecovery();

      const basecoin = bitgo.coin('tbtc');
      const recovery = yield basecoin.recover({
        userKey: '{"iv":"fTcRIg7nlCf9fPSR4ID8XQ==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"pkIS5jVDi0Y=","ct":"SJQgP+ZzfOMf2fWxyQ2jpoWYioq6Tqfcw1xiKS1WpWAxLvXfH059sZvPrrYMdijJEbqA8EEaYXWmdgYSkMXdwckRMyvM3uWl9H8iKw1ZJmHyy2eDSy5r/pCtWICkcO3oi2I492I/3Op2YLfIX6XqKWs2mztu/OY="}',
        backupKey: '{"iv":"0WkLaOsnO3M7qnV2DbSvWw==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"lGxBnvlGAoM=","ct":"cBalT6MGZ3TYIYHt4jys0WDTZEKK9qIubltKEqfW4zXtxYd1dYLz9qLve/yXPl7NF5Cb1lBNGBBGsfqzvpr0Q5824xiy5i9IKzRBI/69HIt3fC2RjJKDfB1EZUjoozi2O5FH4K7L6Ejq7qZhvi8iOd1ULVpBgnE="}',
        bitgoKey: 'xpub661MyMwAqRbcGsSbYgWmr9G1dFgPE8HEb1ASRShbw9S1Mmu1dTQ7QStNwpaYFESq3MeKivGidN8twMeJzqh1veuSP1t2XLENL3mwpatfTst',
        walletPassphrase: TestV2BitGo.V2.TEST_WALLET1_PASSCODE,
        recoveryDestination: '2NB5Ynem6iNvA6GBLZwRxwid3Kui33729Nw',
        scan: 5
      });

      recovery.transactionHex.should.equal('010000000174eda73749d65473a8197bac5c26660c66d60cc77a751298ef74931a478382e100000000fb0046304302202f51d7ad8d2feea3194ab0238297fae860e87fe02b789858ce92fb374629faf0021f48011d587171984e95524c3ecdfe9bae8ebe4c8a282881b416da8f713751e9014730440220673b1a059e2d851059dd7f1b0501af4bf6d205c81249f49828e7ae987f4a90c5022047f73ff3d4e17ce6ebfe9565351796851d2a4472223acecd7ee00e2729824f38014c69522102f5ca5d074093abf996278d1e82b64497333254c786e9a69d34909a785aa9af32210239125d1a21ba8ae375cd37a92e48700cbb3bc1b1268d3c3f7e1d95f42155e1a821031ab00568ea1522a55f277699110649f3b8d08022494af2cc475c09e8a43b3a3a53aeffffffff0178757b000000000017a914c39dcc27823a8bd42cd3318a1dac8c25789b7ac78700000000');
      recovery.tx.TxId.should.equal('a37acbc58d367b717909e69b25a95e06a4daf4e164825e555dd29797a92d7495');
      recovery.tx.Vin.length.should.equal(1);
      recovery.tx.Vout.length.should.equal(1);
      recovery.tx.Vin[0].TxId.should.equal('e18283471a9374ef9812757ac70cd6660c66265cac7b19a87354d64937a7ed74');
      recovery.tx.Vin[0].Sequence.should.equal('4294967295');
      recovery.tx.Vin[0].ScriptSig.Asm.should.equal('0 304302202f51d7ad8d2feea3194ab0238297fae860e87fe02b789858ce92fb374629faf0021f48011d587171984e95524c3ecdfe9bae8ebe4c8a282881b416da8f713751e9[ALL] 30440220673b1a059e2d851059dd7f1b0501af4bf6d205c81249f49828e7ae987f4a90c5022047f73ff3d4e17ce6ebfe9565351796851d2a4472223acecd7ee00e2729824f38[ALL] 522102f5ca5d074093abf996278d1e82b64497333254c786e9a69d34909a785aa9af32210239125d1a21ba8ae375cd37a92e48700cbb3bc1b1268d3c3f7e1d95f42155e1a821031ab00568ea1522a55f277699110649f3b8d08022494af2cc475c09e8a43b3a3a53ae');
      recovery.tx.Vin[0].ScriptSig.Hex.should.equal('0046304302202f51d7ad8d2feea3194ab0238297fae860e87fe02b789858ce92fb374629faf0021f48011d587171984e95524c3ecdfe9bae8ebe4c8a282881b416da8f713751e9014730440220673b1a059e2d851059dd7f1b0501af4bf6d205c81249f49828e7ae987f4a90c5022047f73ff3d4e17ce6ebfe9565351796851d2a4472223acecd7ee00e2729824f38014c69522102f5ca5d074093abf996278d1e82b64497333254c786e9a69d34909a785aa9af32210239125d1a21ba8ae375cd37a92e48700cbb3bc1b1268d3c3f7e1d95f42155e1a821031ab00568ea1522a55f277699110649f3b8d08022494af2cc475c09e8a43b3a3a53ae');
      recovery.tx.Vout[0].N.should.equal(0);
      recovery.tx.Vout[0].Value.should.equal(0.08091);
      recovery.tx.Vout[0].ScriptPubKey.Asm.should.equal('OP_HASH160 c39dcc27823a8bd42cd3318a1dac8c25789b7ac7 OP_EQUAL');
      recovery.tx.Vout[0].ScriptPubKey.Hex.should.equal('a914c39dcc27823a8bd42cd3318a1dac8c25789b7ac787');
      recovery.tx.Vout[0].ScriptPubKey.Type.should.equal('scripthash');
      recovery.tx.Vout[0].ScriptPubKey.ReqSigs.should.equal(1);
      recovery.tx.Vout[0].ScriptPubKey.Addresses.length.should.equal(1);
      recovery.tx.Vout[0].ScriptPubKey.Addresses[0].should.equal('2NB5Ynem6iNvA6GBLZwRxwid3Kui33729Nw');
    }));


  });

  describe('Recover Bitcoin Cash', function() {
    // Todo (kevin): fix test for other recovery source
    it('should generate BCH recovery tx', co(function *() {
      recoveryNocks.nockBchRecovery();

      const basecoin = bitgo.coin('tbch');
      const recovery = yield basecoin.recover({
        userKey: '{"iv":"A3HVSDow6/GjbU8ZUlq5GA==","v":1,"iter":10000,"ks":256,"ts":64,"mode"\n' +
        ':"ccm","adata":"","cipher":"aes","salt":"D1V4aD1HVto=","ct":"C5c0uFBH6BuB11\n' +
        'ikKnso9zaTpZbdk1I7c3GwVHdoOj2iEMl2jfKq30K0fL3pKueyQ5S412a+kbeDC0/IiZAE2sDIZ\n' +
        't4HQQ91ivGE6bRS/PJ9Pv4E2y44plH05YTNPdz9bZhf2NCvSve5+TPS4iZuptOeO2lXE1w="}',
        backupKey: '{"iv":"JG0lyUpjHs7k2UVN9ox31w==","v":1,"iter":10000,"ks":256,"ts":64,"mode"\n' +
        ':"ccm","adata":"","cipher":"aes","salt":"kEdza1Fy82E=","ct":"54fBDIs7EWVUp1\n' +
        '6slxuM6nQsLJCrwgxXB3lzS6GMbAptVtHSDPURUnZnbRYl0CN9LnNGZEqfl7w4GbCbDeCe2IvyZ\n' +
        'dgeFCVPRYiAL/0VZeC97/pAkP4tuybqho0XELLyrYOgwgGAtoqYs5gqmfexu8R/9wEp2iI="}\n',
        bitgoKey: 'xpub661MyMwAqRbcFwmW1HYESGP4x6tKWhYCgSK3J9T3y1eaLXkGszcbBSd4h4tM6Nt17JkcZV768RWHYrqjeEpyYabj2gv9XtdNJyww4LnJZVK',
        walletPassphrase: TestV2BitGo.V2.TEST_RECOVERY_PASSCODE,
        recoveryDestination: '2MztSo6jqjLWcvH4g6QoMChbrWkJ3HHzQua',
        scan: 5
      });

      should.exist(recovery);
      recovery.transactionHex.should.equal('02000000015a3319949e2a3741bbb062f63543f4327db3ce47d26eb3adb4bcdc31fbe8a6df00000000fc00473044022017489d9aca2e99b84815ccea2ee036c6265b7621d23887e9603d507295cf26f402207b9d33926af1e960ca585773af5d2b14ba523e348737442f2bd203304203f8cc414730440220468a892964d8a892702b156b1f986d9a837e96eadb0f8f43657c9758c300093b02207ac672794471b7eb99be421e7023bd8a0150ff52549cea0e58f44fc8e6d61811414c69522103b11db31fb294b8757cf6849631dc6b23e56db0ed4e55d14edf3a8cb8c0eebff42103129bdad9e9a954d2b8c4a375b020b012b634a3641c5f3a0404af4ce99fd23c9521023015ea25115d67e49424248552491cf6b5e47eddb387fad1d652811e02cd53f453aeffffffff0146f185470000000017a91453d2f642f1e40f888ba0ef57c359983ccfd40f908700000000');
      recovery.should.have.property('inputs');
      recovery.inputs.length.should.equal(1);
      recovery.inputs[0].should.have.property('chainPath');
      recovery.inputs[0].chainPath.should.equal('/0/0/1/1');
      recovery.inputs[0].should.have.property('redeemScript');
      recovery.inputs[0].redeemScript.should.equal('522103b11db31fb294b8757cf6849631dc6b23e56db0ed4e55d14edf3a8cb8c0eebff42103129bdad9e9a954d2b8c4a375b020b012b634a3641c5f3a0404af4ce99fd23c9521023015ea25115d67e49424248552491cf6b5e47eddb387fad1d652811e02cd53f453ae');
    }));
  });

  describe('Recover Ripple', function() {
    it('should generate XRP recovery tx', function() {

      recoveryNocks.nockXrpRecovery();

      const basecoin = bitgo.coin('txrp');
      return basecoin.recover({
        userKey: '{"iv":"rU++mEtIHtbp3d4jg5EulA==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"ip1rb59uYnM=","ct":"ssmP9abPoVyXkW4Io0SUy+AAS8lr+wgIerTMw+lDYnkUh0sjlI4A6Fpve0q1riQ3Dy/J0bNu7dgoZkO4xs/X6dzwEwlmPhk3pEQ7Yd4CXa1zA01y0Geu900FLe4LdaS8jt6fixui2tTd4Vi3JYglF1/HmCjG1Ug="}',
        backupKey: '{"iv":"uB/BTcn1rXmgYGfncXOowg==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"I3WrumxkuMQ=","ct":"sgyDNAzNsBruTRm0d04oBTBf8lheHNKS+dRgl8FeMEhodKsiyjtRVHG0CHPf5rV3g5ixVnZ+iwsSCv3PKyyeoy7RGnT0AG9YYpi0me+OvP8331iO+n5quzstrGbV1j8uEh5IMW78S+YUZKSx6zbbdZ0xNu8D5WM="}',
        rootAddress: 'raGZWRkRBUWdQJsKYEzwXJNbCZMTqX56aA',
        walletPassphrase: TestV2BitGo.V2.TEST_WALLET1_PASSCODE,
        recoveryDestination: 'rsv2kremJSSFbbaLqrf8fWxxN5QnsynNm2?dt=12345'
      })
      .then(function(recovery) {
        recovery.txHex.should.equal('120000228000000024000000042E00003039201B00060FB561400000024E06C0C068400000000000001E7300811439CA010E0E0198150F8DDD5768CCD2B095701D8C8314201276ADC469C4F10D1369E0F5C5A7DEF37B2267F3E0107321026C91974146427889C801BD26CE31CE0E10307A69DFE4139DE45E5E35933A6B03744630440220759D31959F364794A84F42E6E300D67C56A52EE253324020AC7ECD48E36BE1CA022001DC461FC0471BBF3E1D8F66679EAD173CDA74214D10462C0309D5E6A5C413E18114ABB5B7C843F3AA8D8EFACC3C5A7D9B0484C17442E1E010732102F4E376133012F5404990C7E1DF83A9F943B30D55F0D856632C8E8378FCEB70D2744730450221009E1FC6A174E68250A1104DEDA5D667BBFA431944FA67608FB11FD17CAE5AF09C0220453E6157411B70F01D799179B08EB7BD2135BCD8E6253F07CB681989547078778114ACEF9F0A2FCEC44A9A213444A9E6C57E2D02856AE1F1');
        recovery.id.should.equal('02D3CEEFC34AF91072F12ABF3588D610299FE51A8F478424616E28DE0B8041D4');
        recovery.outputAmount.should.equal('9899000000');
        recovery.outputs.length.should.equal(1);
        recovery.outputs[0].address.should.equal('rsv2kremJSSFbbaLqrf8fWxxN5QnsynNm2?dt=12345');
        recovery.outputs[0].amount.should.equal('9899000000');
        recovery.fee.fee.should.equal('30');
      });

    });
  });

  describe('Recover Litecoin', function() {
    // Todo (kevin): fix test for other recovery source
    it('should generate LTC recovery tx', co(function *() {
      recoveryNocks.nockLtcRecovery();

      const basecoin = bitgo.coin('tltc');
      const recovery = yield basecoin.recover({
        userKey: `{"iv":"Vvthj0ZaCPywdNWM+s5GmA==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"hxZMB31kp34=","ct":"xGpBHnS3k0G6lU/uv9pC1gsdFqksNV6nLBQ18qL9iuWV9sM5JLyZ67wqnMVVoZgNWaI1fq0kSTCPYwGq2FNAS2GmN/JWb/Pl0UPmfVvhraOnzav0vDv0KaJjOT3S1D/omjzx/W3pw5qSwxov+T65Yt6E19YGGjc="}`,
        backupKey: `{"iv":"/GM1AF21E0Ht6ZmgiWpd+g==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"rGsRxlm/pGE=","ct":"cUBV7ELfNEIs0UkDrBjHiRpXvRNCRHLE5dx4X7gprHoTSBKJOJ+5McxHnSLeBvM2vIexSQO9RBzjtC2G1m6hozTOEjWkR0BtTBoi0uw3cXDmmL69pjrABZhLjmCF8znmaF/DCQk/lKQcHEwbImcR/egpq8u9W1A="}`,
        bitgoKey: 'xpub661MyMwAqRbcFwmymyqkCoY6uaZ8PxbjXKWK2pLS8NUutytumJabLvJyGpXzDJRqXJAf4LoACStGgf1bYv6dkbT6D1MKEyhjYE7VHiw5bFP',
        walletPassphrase: TestV2BitGo.V2.TEST_RECOVERY_PASSCODE,
        recoveryDestination: 'Qhe8AWhZr1wBNV3iry2uVxnthbawRLhNcF',
        scan: 5
      });

      recovery.transactionHex.should.equal('0100000001ffe4ac6dd97fbe9d4526a122c039d9c93ac5d595b1b8d1e0cf23df1b3caecfbc00000000fc0047304402207c87fa565629d0d5bdf1cd4a34c54c90b3ff3a5c50c481ce41cad7709cc9d8d20220774791a635c79d344ccae60b448463ab10e88704405bae47f8c6ffe0eba6ffe80147304402205ebfc4377598dea11a3b50fe7b9e2b3bdb54869407cf651f8f119115738e4e7902201bf86eae5eb417d8355bdc5a5e3f3f306e569475660707e1380395366751600c014c6952210353bcad5447cbed8af7a7e4b010412b1fcc748e7efd225047729bfc452735c10c2103e6f65db8d3718b8a851f0ea64c9bf776cbc9e089f03b12210c7360cadb980031210246cdc4f2c735ccbf5952eded3734a2179104f136a5ed9ec8a1bea50fcaa45d4e53aeffffffff01b03ec9010000000017a914e6c2329cb2f901f30b9606cf839ee09cfce8414e8700000000');
      recovery.should.have.property('inputs');
      recovery.inputs.length.should.equal(1);
      recovery.inputs[0].should.have.property('chainPath');
      recovery.inputs[0].chainPath.should.equal('/0/0/0/0');
      recovery.inputs[0].should.have.property('redeemScript');
      recovery.inputs[0].redeemScript.should.equal('52210353bcad5447cbed8af7a7e4b010412b1fcc748e7efd225047729bfc452735c10c2103e6f65db8d3718b8a851f0ea64c9bf776cbc9e089f03b12210c7360cadb980031210246cdc4f2c735ccbf5952eded3734a2179104f136a5ed9ec8a1bea50fcaa45d4e53ae');
    }));
  });

  describe('Recover ZCash', function() {
    it('should generate ZEC recovery tx', co(function *() {
      recoveryNocks.nockZecRecovery();

      const basecoin = bitgo.coin('tzec');
      const recovery = yield basecoin.recover({
        userKey: `{"iv":"in/0+5mRgyBD/NQM+rsKOQ==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"2zBGPsw0Yc4=","ct":"IqS/KsWCc117zVIu4VID6BB1UBBAOW3zeWiMsL4rm+HXMffHetaOCVwFVeoO1JG/dbcV/ApcqvbHXxNMY7L8FXeeBr3SMnZdpqIkGzfrvcADa9EcjTg+iLDGLRT1FwdavQ7X06DXro0Mx3O+CDnCFaf2vkxIfZ0="}`,
        backupKey: `{"iv":"ZGWK9woJAu020cXwvdfmuQ==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"6iCPz4FhZ6g=","ct":"8IwFVj2l7L6o6emjMF/G7WIDXeOmjGFoyNgofQwrvnk+ZsckQrKUSVxDzDUeZdJZsZE6fj+ZCVNh1Zfgxxg0rk5rh0bYJJ+WVsizK7jUE4DNJnS5RwBZNNFi9qilHI2bPbzXp+VAyOieSF5nJs9AQSc+rTxda30="}`,
        bitgoKey: 'xpub661MyMwAqRbcFN1MHGSUPL5v1xREhgtbvoCY5Qkbt3dLXZTdV8Au2SsoQ4Kv5SCSSb6sN9Y3eZZBgvZjf7qGj9zaXmFtEcedfiFKLiBXUBq',
        walletPassphrase: TestV2BitGo.V2.TEST_RECOVERY_PASSCODE,
        recoveryDestination: 't2GnC5sFN5Km2UuYaYjHNBQRJBDAXVQqSfJ',
        scan: 5
      });

      recovery.transactionHex.should.equal('030000807082c403010f89e651a4d827d82dbe164cae6c09c21435b950a395e35afae813a1f775497500000000fdfe0000483045022100ba98d69c221e906bd987afa705528dd3f43b8a1b8edc098183b21775a03d79e50220560cd386ed115b7aa7d379ee8905100c1cea337f38eb935f8f9420215d3ebdb6014830450221009129e3a6445f5937e0cebdec52ce036e020549c4ffd43cabf97f61da215e33c302200be8ef21c43c0d0426a19bf0ee2353cea68863bf0fe3958f2e2ba918a370be87014c6952210222dba86781026f53d30be3bd2d07678c61926cb52c0de52b6ecef3d5c96e32fa2102b8a369ca2ef0d202b342fe3742585468813bebf821856fa4c2e90337bcee1d5e2102dcb29b842c2bb5e1efcab6483db61ab06bc08cb8c2667399bb1b5fb826a841a153aeffffffff01b03ec9010000000017a91470391ef30163f580806ee8a5f0aacc724e7f685587000000000000000000');
      recovery.should.have.property('inputs');
      recovery.inputs.length.should.equal(1);
      recovery.inputs[0].should.have.property('chainPath');
      recovery.inputs[0].chainPath.should.equal('/0/0/0/0');
      recovery.inputs[0].should.have.property('redeemScript');
      recovery.inputs[0].redeemScript.should.equal('52210222dba86781026f53d30be3bd2d07678c61926cb52c0de52b6ecef3d5c96e32fa2102b8a369ca2ef0d202b342fe3742585468813bebf821856fa4c2e90337bcee1d5e2102dcb29b842c2bb5e1efcab6483db61ab06bc08cb8c2667399bb1b5fb826a841a153ae');
    }));
  });

  describe('Recover ERC20', function() {
    it('should successfully construct a recovery transaction for tokens stuck in a wallet', co(function *() {
      const wallet = bitgo.nockEthWallet();

      // There should be 24 Potatokens stuck in our test wallet (based on nock)
      const tx = yield wallet.recoverToken({
        tokenContractAddress: TestV2BitGo.V2.TEST_ERC20_TOKEN_ADDRESS,
        recipient: TestV2BitGo.V2.TEST_ERC20_TOKEN_RECIPIENT,
        walletPassphrase: TestV2BitGo.V2.TEST_ETH_WALLET_PASSPHRASE
      });

      should.exist(tx);
      tx.should.have.property('halfSigned');

      const txInfo = tx.halfSigned;
      txInfo.should.have.property('contractSequenceId');
      txInfo.contractSequenceId.should.equal(101);
      txInfo.should.have.property('expireTime');
      txInfo.should.have.property('gasLimit');
      txInfo.gasLimit.should.equal(500000);
      txInfo.should.have.property('gasPrice');
      txInfo.gasPrice.should.equal(20000000000);
      txInfo.should.have.property('operationHash');
      txInfo.should.have.property('signature');
      txInfo.should.have.property('tokenContractAddress');
      txInfo.tokenContractAddress.should.equal(TestV2BitGo.V2.TEST_ERC20_TOKEN_ADDRESS);
      txInfo.should.have.property('walletId');
      txInfo.walletId.should.equal(TestV2BitGo.V2.TEST_ETH_WALLET_ID);
      txInfo.should.have.property('recipient');
      txInfo.recipient.should.have.property('address');
      txInfo.recipient.address.should.equal(TestV2BitGo.V2.TEST_ERC20_TOKEN_RECIPIENT);
      txInfo.recipient.should.have.property('amount');
      txInfo.recipient.amount.should.equal('2400');
    }));
  });

  describe('Wrong Chain Recoveries', function() {
    before(function() {
      recoveryNocks.nockWrongChainRecoveries();
    });

    it('should recover BTC sent to the wrong chain', co(function *() {
      const recovery = yield bitgo.coin('tbtc').recoverFromWrongChain({
        coin: bitgo.coin('tltc'),
        txid: '41f5974544068fe91ffa99275a5325ca503b87f11cc04ac74d2ec3390df51bc6',
        recoveryAddress: '2NF5hJyJxQyRsMjsK6STFagLaoAJNF9M4Zm',
        wallet: '5abacebe28d72fbd07e0b8cbba0ff39e',
        walletPassphrase: TestV2BitGo.V2.TEST_RECOVERY_PASSCODE
      });

      should.exist(recovery);
      recovery.recoveryAddress.should.equal('2NF5hJyJxQyRsMjsK6STFagLaoAJNF9M4Zm');
      recovery.recoveryAmount.should.equal(20972800);
      recovery.recoveryCoin.should.equal('tltc');
      recovery.sourceCoin.should.equal('tbtc');
      recovery.txHex.should.equal('0100000001c61bf50d39c32e4dc74ac01cf1873b50ca25535a2799fa1fe98f06444597f54100000000b600473044022072218955d9c218200b0ae502a94128118c5d30d20d5d5ec0b5fad8bc44543e8c02201352b553ca6163f1e99087bebe54425b15371d8f281da769bf5a0c7a2531aaf10100004c69522103b31347f19510acbc7f50822ac4093ca80554946c471b43eb937d0c9118d1122d2102cd3787d12af6eb87e7b9af00118a225e2ce663a5c94f555460ae131139a2afee2103bd558669de622fc57a8157f449c52254218dbc40dedf047891192bdd013cad8953aeffffffff01000540010000000017a914ef856a40c6dc109591b7d4fad170986d0bb404af8700000000');
      recovery.walletId.should.equal('5abacebe28d72fbd07e0b8cbba0ff39e');
      recovery.should.have.property('txInfo');
      recovery.txInfo.should.have.property('unspents');
      recovery.txInfo.should.have.property('inputs');
    }));

    it('should recover LTC sent to the wrong chain', co(function *() {
      const recovery = yield bitgo.coin('tltc').recoverFromWrongChain({
        coin: bitgo.coin('tbtc'),
        txid: 'fe22e43e7894e91ec4b371bfbce02f49b2903cc535e4a2345eeda5271c81db39',
        recoveryAddress: 'Qb3mLF6zy2frAAJmBcuVneJHUsmtk2Jo6V',
        wallet: '5abace103cddfbb607d8239d806671bf',
        walletPassphrase: TestV2BitGo.V2.TEST_RECOVERY_PASSCODE
      });

      should.exist(recovery);
      recovery.recoveryAddress.should.equal('Qb3mLF6zy2frAAJmBcuVneJHUsmtk2Jo6V');
      recovery.recoveryAmount.should.equal(39966000);
      recovery.recoveryCoin.should.equal('tbtc');
      recovery.sourceCoin.should.equal('tltc');
      recovery.txHex.should.equal('010000000139db811c27a5ed5e34a2e435c53c90b2492fe0bcbf71b3c41ee994783ee422fe01000000b700483045022100a26301277e837c9558dc7d7bdeb20531b86aded988e32ef44fdcd1eca8ff1d0002200bfe14f01cb9267e91c4116e2466669175b516d7187f476672c8a66fdb665a580100004c695221032afb7613787f1ab168ae5aea260891a93740a7bd41e66381d73aa07c02e053d321022d342407c7cbe25718d1983db4df95b0000762d9203a35877412d589beebae422103b366f06f3b9f25440d281c78e61aab3375ee8ea4ae72750ac7522c1bdc4e95b153aeffffffff0130d561020000000017a9149e71e9125ef730c576b027d2c10cbdbe1ee1a5528700000000');
      recovery.walletId.should.equal('5abace103cddfbb607d8239d806671bf');
      recovery.should.have.property('txInfo');
      recovery.txInfo.should.have.property('unspents');
      recovery.txInfo.should.have.property('inputs');
    }));

    it('should recover BCH sent to the wrong chain', co(function *() {
      const recovery = yield bitgo.coin('tbch').recoverFromWrongChain({
        coin: bitgo.coin('tbtc'),
        txid: '94143c674bd194ea215143457808440aefa4780a2a81396a1f642d6edaa1ea26',
        recoveryAddress: '2NGZbWp6bZto9pFKV1Y5EEGWTNHwgNfpVD2',
        wallet: '5abace103cddfbb607d8239d806671bf',
        walletPassphrase: TestV2BitGo.V2.TEST_RECOVERY_PASSCODE
      });

      should.exist(recovery);
      recovery.recoveryAddress.should.equal('2NGZbWp6bZto9pFKV1Y5EEGWTNHwgNfpVD2');
      recovery.recoveryAmount.should.equal(59993200);
      recovery.recoveryCoin.should.equal('tbtc');
      recovery.sourceCoin.should.equal('tbch');
      recovery.txHex.should.equal('020000000126eaa1da6e2d641f6a39812a0a78a4ef0a44087845435121ea94d14b673c149400000000b7004830450221009784391e9fab5bd8e3c3902477521ed1e8e8c1f6d584c3ca918cf40053450cdc022016597cf28a6b38fbe0f1eef5608af049912cadc6390b49277602d842c89704a24100004c695221032afb7613787f1ab168ae5aea260891a93740a7bd41e66381d73aa07c02e053d321022d342407c7cbe25718d1983db4df95b0000762d9203a35877412d589beebae422103b366f06f3b9f25440d281c78e61aab3375ee8ea4ae72750ac7522c1bdc4e95b153aeffffffff01706c93030000000017a914ffc45981f784d9bd9feb2d305061404f50bc1e058700000000');
      recovery.walletId.should.equal('5abace103cddfbb607d8239d806671bf');
      recovery.should.have.property('txInfo');
      recovery.txInfo.should.have.property('unspents');
      recovery.txInfo.should.have.property('inputs');
    }));

    it('should generate an unsigned recovery transaction', co(function *() {
      const recovery = yield bitgo.coin('tbtc').recoverFromWrongChain({
        coin: bitgo.coin('tltc'),
        txid: '41f5974544068fe91ffa99275a5325ca503b87f11cc04ac74d2ec3390df51bc6',
        recoveryAddress: '2NF5hJyJxQyRsMjsK6STFagLaoAJNF9M4Zm',
        wallet: '5abacebe28d72fbd07e0b8cbba0ff39e',
        signed: false
      });

      should.exist(recovery);
      recovery.txHex.should.equal('0100000001c61bf50d39c32e4dc74ac01cf1873b50ca25535a2799fa1fe98f06444597f5410000000000ffffffff01000540010000000017a914ef856a40c6dc109591b7d4fad170986d0bb404af8700000000');
      recovery.walletId.should.equal('5abacebe28d72fbd07e0b8cbba0ff39e');
      recovery.address.should.equal('2NF5hJyJxQyRsMjsK6STFagLaoAJNF9M4Zm');
      recovery.amount.should.equal(20972800);
      recovery.coin.should.equal('tbtc');
      recovery.should.have.property('txInfo');
      recovery.txInfo.should.have.property('unspents');
    }));
  });

  describe('Recover Ethereum', function() {
    before(function() {
      recoveryNocks.nockEthRecovery();
    });

    it('should construct a recovery transaction without BitGo', co(function *() {
      const basecoin = bitgo.coin('teth');
      const recovery = yield basecoin.recover({
        userKey: '{"iv":"+TkmT3GJ5msVWQjBrt3lsw==","v":1,"iter":10000,"ks":256,"ts":64,"mode"\n' +
        ':"ccm","adata":"","cipher":"aes","salt":"cCE20fGIobs=","ct":"NVIdYIh91J3aRI\n' +
        '8GG0JE3DhXW3AUmz2G5RqMejdz1+t4/vovIP7lleegI7VYyWiiLvlM0OCFf3EVvV/RyXr8+2vsn\n' +
        'Q0Vn8c2CV5FRZ80OjGYrW3A/6T/zpOz6E8CMvnD++iIpeO4r2eZJavejZxdzlxF0BRz7VI="}',
        backupKey: '{"iv":"asB356ofC7nZtg4NBvQkiQ==","v":1,"iter":10000,"ks":256,"ts":64,"mode"\n' +
        ':"ccm","adata":"","cipher":"aes","salt":"1hr2HhBbBIk=","ct":"8CZc6upt+XNOto\n' +
        'KDD38TUg3ZUjzW+DraZlkcku2bNp0JS2s1g/iC6YTGUGtPoxDxumDlXwlWQx+5WPjZu79M8DCrI\n' +
        't9aZaOvHkGH9aFtMbavFX419TcrwDmpUeQFN0hRkfrIHXyHNbTpGSVAjHvHMtzDMaw+ACg="}',
        walletContractAddress: '0x5df5a96b478bb1808140d87072143e60262e8670',
        walletPassphrase: TestV2BitGo.V2.TEST_RECOVERY_PASSCODE,
        recoveryDestination: '0xac05da78464520aa7c9d4c19bd7a440b111b3054'
      });

      // id and tx will always be different because of expireTime
      should.exist(recovery);
      recovery.should.have.property('id');
      recovery.should.have.property('tx');
    }));

    it('should error when the backup key is unfunded (cannot pay gas)', co(function *() {
      const basecoin = bitgo.coin('teth');
      const error = yield bitgo.getAsyncError(basecoin.recover({
        userKey: '{"iv":"VNvG6t3fHfxMcfvNuafYYA==","v":1,"iter":10000,"ks":256,"ts":64,"mode"\n' +
        ':"ccm","adata":"","cipher":"aes","salt":"mc9pCk3H43w=","ct":"Qe4Z1evaXcrOMC\n' +
        'cQ/XMVVBO9M/99D1QQ6LxkG8z3fQtwwOVXM3/6doNrriprUqs+adpFC93KRcAaDroL1E6o17J2k\n' +
        'mcpXRd2CuXRFORZmZ/6QBfjKfCJ3aq0kEkDVv37gZNVT3aNtGkNSQdCEWKQLwd1++r5AkA="}\n',
        backupKey: '{"iv":"EjD7x0OJX9kNM/C3yEDvyQ==","v":1,"iter":10000,"ks":256,"ts":64,"mode"\n' +
        ':"ccm","adata":"","cipher":"aes","salt":"Na9NvRRe3n8=","ct":"B/AtSLHolsdNLr\n' +
        '4Dlij4kQ0E6NyUUs6wo6T2HtPDAPO0hyhPPbh1OAYqIS7VlL9xmJRFC2zPxwRJvzf6OWC/m48HX\n' +
        'vgLoXYgahArhalzJVlRxcXUz4HOhozRWfv/eK3t5HJfm+25+WBOiW8YgSE7hVEYTbeBRD4="}',
        walletContractAddress: '0x22ff743216b58aeb3efc46985406b50112e9e176',
        walletPassphrase: TestV2BitGo.V2.TEST_RECOVERY_PASSCODE,
        recoveryDestination: '0xac05da78464520aa7c9d4c19bd7a440b111b3054'
      }));

      should.exist(error);
      error.message.should.equal('Backup key address 0xba6d9d82cf2920c544b834b72f4c6d11a3ef3de6 has balance 0. This address must have a balance of at least 0.01 ETH to perform recoveries');
    }));
  });
});
