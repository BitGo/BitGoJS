import { generateKeycard } from '@bitgo/key-card';
import { KeyCurve, coins } from '@bitgo/statics';
import { Keychain } from '@bitgo/sdk-core';
import { DklsDkg, DklsTypes } from '@bitgo/sdk-lib-mpc';
import * as sjcl from 'sjcl';

function downloadKeycardImage(coinFamily: string): Promise<HTMLImageElement> {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const baseURL = window.location.origin;
    const keyCardImage = new Image();
    keyCardImage.src = `${baseURL}/images/${coinFamily.toLowerCase()}.png`;

    keyCardImage.onload = () => {
      resolve(keyCardImage);
    };

    keyCardImage.onerror = () => {
      reject(new Error(`not a valid image for ${coinFamily}`));
    };
  });
}

export async function downloadKeycardForDKLsTSS() {
  const user = new DklsDkg.Dkg(2, 2, 0);
  const backup = new DklsDkg.Dkg(2, 2, 1);
  const userRound1Message = await user.initDkg();
  const backupRound1Message = await backup.initDkg();
  const userRound2Messages = user.handleIncomingMessages({
    p2pMessages: [],
    broadcastMessages: [backupRound1Message],
  });
  const backupRound2Messages = backup.handleIncomingMessages({
    p2pMessages: [],
    broadcastMessages: [userRound1Message],
  });
  const userRound3Messages = user.handleIncomingMessages({
    p2pMessages: backupRound2Messages.p2pMessages.filter((m) => m.to === 0),
    broadcastMessages: [],
  });
  const backupRound3Messages = backup.handleIncomingMessages({
    p2pMessages: userRound2Messages.p2pMessages.filter((m) => m.to === 1),
    broadcastMessages: [],
  });
  const userRound4Messages = user.handleIncomingMessages({
    p2pMessages: backupRound3Messages.p2pMessages.filter((m) => m.to === 0),
    broadcastMessages: [],
  });
  const backupRound4Messages = backup.handleIncomingMessages({
    p2pMessages: userRound3Messages.p2pMessages.filter((m) => m.to === 1),
    broadcastMessages: [],
  });
  user.handleIncomingMessages({
    p2pMessages: [],
    broadcastMessages: backupRound4Messages.broadcastMessages,
  });
  backup.handleIncomingMessages({
    p2pMessages: [],
    broadcastMessages: userRound4Messages.broadcastMessages,
  });
  const userKeyShare = user.getKeyShare();
  const commonKeychain = DklsTypes.getCommonKeychain(userKeyShare);
  const userCompressed = user.getReducedKeyShare();
  const backupCompressed = backup.getReducedKeyShare();
  const encryptedUser = sjcl.encrypt(
    't3stSicretly!',
    btoa(
      String.fromCharCode.apply(
        null,
        Array.from(new Uint8Array(userCompressed)),
      ),
    ),
  );
  const encryptedBackup = sjcl.encrypt(
    't3stSicretly!',
    btoa(
      String.fromCharCode.apply(
        null,
        Array.from(new Uint8Array(backupCompressed)),
      ),
    ),
  );
  const userKeychain: Keychain = {
    id: '63e107b5ef7bba0007145e41065b26a6',
    commonKeychain: commonKeychain,
    reducedEncryptedPrv: encryptedUser.toString(),
    prv: userCompressed.toString('base64'),
    type: 'tss',
  };
  const backupKeychain: Keychain = {
    id: '63e107b51af424000794ea5e39db15c6',
    commonKeychain: commonKeychain,
    type: 'tss',
    reducedEncryptedPrv: encryptedBackup.toString(),
    prv: backupCompressed.toString('base64'),
  };
  const bitgoKeychain: Keychain = {
    id: '63e107b5ca60390007008767278e5fc4',
    commonKeychain: commonKeychain,
    type: 'tss',
  };

  await generateKeycard({
    activationCode: '123456',
    backupKeychain,
    bitgoKeychain,
    coin: coins.get('hteth'),
    keyCardImage: await downloadKeycardImage('eth'),
    passcodeEncryptionCode: '654321',
    passphrase: 't3stSicretly!',
    userKeychain,
    walletLabel: 'Hot DKLS Wallet',
  });
}

export async function downloadKeycardForHotLtcWallet() {
  const userKeychain: Keychain = {
    id: '63e107b5ef7bba0007145e41065b26a6',
    pub: 'xpub661MyMwAqRbcFXFJ8wZhWjEiFg9wM89UamPyP3XsnEHg2VJ4m7wE7ALLszakPiEEy5cH9FCAvCrx1cL6rLE6jewaa1ubP8DjqsDtP4R7w5g',
    encryptedPrv:
      '{"iv":"pivw5c3fmgc0/1LP3SX7rA==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"XKtQHasaidc=","ct":"wXbSW115VD4e+r1pxX/wB1/2g332c4thdLkk91Fr+hrRzuoDzWyhYcaxndIP5Nzc5z0Q9HGc+cZ4Zb2Ij7O3cPoIyrsXv84NaHfVNN7rY2UopmxS4Xg05x1S936kxfZjDjlgNfj7lkrY9LzVh3wC8YGSxx960Vw="}',
    prv: 'xprv9s21ZrQH143K33Aq2v2h9bHyheKSwfRdDYUNaf8GDtkh9gxvDacyZN1s2gpDb4QLwAK4DzxoQpDAneJTNL7vgvnneTBAKptkKLYTVCNhya6',
    type: 'independent',
  };
  const backupKeychain: Keychain = {
    id: '63e107b51af424000794ea5e39db15c6',
    pub: 'xpub661MyMwAqRbcF7DseJgApbN9DtRXeUT3H41id4eSNCL9VDK7rDJ7kZNGS3Zz49a9XXH52qZ5KTQqQht9uciMZvaAJ7wy69a4hyKb94YMYqm',
    type: 'independent',
    prv: 'xprv9s21ZrQH143K2d9QYH9ATTRQfrb3F1jBuq67pgEporoAcQyyJfysCm3nanTyUvDhAhEQAHyooZsNaMFF6nYHd2sYb5nNRervxwsedLYfafh',
  };
  const bitgoKeychain: Keychain = {
    id: '63e107b5ca60390007008767278e5fc4',
    pub: 'xpub661MyMwAqRbcGWXcaHWYPH8Bz9qg6K3zSFac4hv8JZvKCorehqS8xVToEGXt7zJUfsT5aUaH1ZzjEYruXdgDRgFpAwfWxQyEuU9fpQzaPAE',
    type: 'independent',
  };

  await generateKeycard({
    activationCode: '123456',
    backupKeychain,
    bitgoKeychain,
    coin: coins.get('tltc'),
    keyCardImage: await downloadKeycardImage('ltc'),
    passcodeEncryptionCode: '654321',
    passphrase: 'test_wallet_passphrase',
    userKeychain,
    walletLabel: 'Hot LTC Wallet',
  });
}

export async function downloadKeycardForHotEthTSSWallet() {
  const userKeychain: Keychain = {
    id: '63e5024af9cdb4000744d7893d3d45dd',
    type: 'tss',
    commonKeychain:
      '0385a81092d74fc0f2997301387fb5245dd6da5a388755bc66ae9a3a7ca2b1a137bd6d8e87d0ccb5f3b050047d4ce6c3567de19017ddc76f15cdd0bac21c957129',
    encryptedPrv:
      '{"iv":"+e+YyKDiievkA8YFZqZAtQ==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"l4jdCKhp4hw=","ct":"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"}',
  };
  const backupKeychain: Keychain = {
    id: '63e5024a40199c0007f8520f12c8aa39',
    type: 'tss',
    commonKeychain:
      '0385a81092d74fc0f2997301387fb5245dd6da5a388755bc66ae9a3a7ca2b1a137bd6d8e87d0ccb5f3b050047d4ce6c3567de19017ddc76f15cdd0bac21c957129',
    encryptedPrv:
      '{"iv":"7DNgHnyySppgBZq6zBonuw==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"K2r+Hg68reY=","ct":"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"}',
    prv: '{"pShare":{"i":2,"t":2,"c":3,"l":"d5b3224fae54de4a8cdc529d3e811e8396ab99ef489521e67eaf4ef4c693d3d996ba07396e19fd6e30e86f8db9606d951ad8d6610ed9630448064cbf736d28be8764ac77f66e65fc7119715afc062efdaea79a6520d4d1a7022e1ea6a3bdcf4571aa8ddd90d712e252d5428b3782a2748618ef79f44e26b57e61366e791851704b32bad986fc5e8fa10c4935e8d670fab9389a1e46646d61e3032f064572a7af6d19cdd68620a593155323114e949150773f66f52684981255c1de8b018b7b3c737e1d5b2670299ecadf3549bea97dda2e8a469fe6f185277311a660fe738b605b4f3a90def5d457a4e4eabc0dc91977ff2a6535944a43e3eb72515ca083b2dfe2cfe6c099a4718113c811c77bcc5fb280485998964530632fb4db73e2407611a75a06a0661637e1b107afe66c9022d09dca3827b231a855f736cd17029d33001c74b65a2754dc02e705356b3ca7bc4cbe31c5e27e06265eb310d59b1775862e696e14dceef9a81a4938e4a0ae8319a7d7cd0114ddf9157beab11cbc77e79888","m":"3bad4f1847ff5976ed0957bedb9c997ca47467a5874e88933a873cbd4b797d66932166be16eca17a9fb0af3587964d4aaad93b4f327906932b9972ecc535ca4e8782f090c2f74ea9fd39ed6eb157e91271a27adc31b99abee9d3b1a4dca5b5754316440eebef7714ef5f4a8e66dd570aeae2287a7e9965e7e83ab83b375e631a8448bc701b23cbb7f2edb5362390b7c8f63c089a816d269471daab65465366d82aa4cbf372cc184539e0629e1c287e0f42c6103def4add0e46e6fba89907bf32761c6e8366b52d12dcf04048a0bc9f976a89c02e816e75280dad9a84a092a529b75c6e9b074427b88d508b63a9245a38736330681ca2c005d6de50e299e3051c53bba5d07ec45edfad566078b165ac3543cc5b1466c55c4fc21db7a513c4821f6bb1ca458d0af23526c215dfcdd10a39f0f90e4ad77a045e46a0251c68506f2867ae5cb55f36f2564e693011b77bf76106457531ffe0bb491837b82591634aba6dd07f62a456e19bd3140a4e911445438cbb22c3af1fb7d8f0d8d9c6f21203b0","n":"d5b3224fae54de4a8cdc529d3e811e8396ab99ef489521e67eaf4ef4c693d3d996ba07396e19fd6e30e86f8db9606d951ad8d6610ed9630448064cbf736d28be8764ac77f66e65fc7119715afc062efdaea79a6520d4d1a7022e1ea6a3bdcf4571aa8ddd90d712e252d5428b3782a2748618ef79f44e26b57e61366e791851704b32bad986fc5e8fa10c4935e8d670fab9389a1e46646d61e3032f064572a7af6d19cdd68620a593155323114e949150773f66f52684981255c1de8b018b7b3e705c50b1812e041ec6ee51c002f9d85da2612c6f104b9ec362cf4a68d01660063630a655652b3d9e4ddcb28a5baa30f581872f34ec8733113f2f2f3dccbb03ec3c7a20e0dc9a6bef35d54d2e15c35d3f8b9bcc6ccce14b5aadbd70dffd578ab918331fa27cac29eaef04042f5a26a8d5197d470f207e8deab3b12483e809570d3b3eb844931de58203e8168d981f3142e826ef0788b8230ddb604ebef9fa96ef2481b1efba95d9834c8be6965ade5aa8154f3f9c08fec0d4db4855ad07fd4a5f","y":"03855e89545e8c92ed55a80d5f454ab5f2c70c1d43544bd7edd234c251ce597dc0","u":"8de1e416a18fb29b7374d7d7512018f5720c51a394e8bb54507bbafeed15039c","uu":"93418004601984411664507166835565666827969389106548458525843918339743612862605","chaincode":"31851256d94930f976478522cc4cf39ba37be6841ce9ea48f8c0b578f1f4a1a0"},"bitgoNShare":{"i":2,"j":3,"y":"038920c71ee7fa763dc6980f411d4d48a52b7936ae1593f4e988bd935a5fb5646c","u":"72526d5cb5da5a874c0f321c2c5b1dc73d2a00bea208c5b56b6b26d2b8df1bb9","chaincode":"68cf817d3830609da399d9957fbd49dc6b7201587b97f137d9f4a2e7eca40d57","v":"0264c3587b90ff2e4cbdba6a6c5f7678d4731437b91a2a7ca21e758549e9bc810a"},"userNShare":{"i":2,"j":1,"n":"b6504f93d9a8a7c82d1040f8761c937d78c1be1d873c718a8bfadc5f90e1d746e1e15cd92b3741dd3291dbd78f47118a6dfd480e7ffb635dbd589218489172fca839ad82cb0a70bcf6da89933970ec665385fa8abda6fce658ae5a84956f6152d8ef16cf7c2e3797239bfea578e3ecdf67dd1975ed7362c43e99a62d844b05f7c4a23d57d21e1cb66f189768d5af4f71a1c82e250cdf8a660001ac8a72da4324924e20f40c24397ba0fc83f0adb7eb147a57598ece81f3e7515f72a269f6e44aef2de7c1d5c56bbdd5f7255f5f17a3bf2b20d12b2f11020962abbec00d477d0e5acf3a35c65d4f8611dfe9c708b36f8abad6f52e0bbcecbc91d21bfe6cf3dc3acfd953899d1e2c29928b9ba6fed33f461d62fe59ccc518a02123e2eddcfde21a56856306fd3ce7d5bd721f1f0fce66ac1849383ca5fafb18285627c09ea457fa86bd3e7ef89c1837112d36684b305c6239f07ce89e18ecb306ebee7ec543d13938ca3d9ec78d1f86c2129127bc3e1fed8f0ebdf7164201aa56854b60c46aff93","y":"021663689044d740407008aef89526e0a6bc60551fc70fcf348f5c37413378d32f","u":"ddacab9d02c2dc045c8543b569578c35cd245e968645dc150213f908ae12fc87","chaincode":"2318fab3bf53245c966ea5c500dc85de6ef3a83b45459394fb1b62613dfcc232","v":"02ff64af27f0726272afca16956874d45e52c6fe76f6e81ca0ceeff630005b378e"}}',
  };
  const bitgoKeychain: Keychain = {
    id: '63e5024afd92d50007ff9ddcd4f84183',
    type: 'tss',
    commonKeychain:
      '0385a81092d74fc0f2997301387fb5245dd6da5a388755bc66ae9a3a7ca2b1a137bd6d8e87d0ccb5f3b050047d4ce6c3567de19017ddc76f15cdd0bac21c957129',
    keyShares: [
      {
        from: 'user',
        to: 'bitgo',
        publicShare:
          '021663689044d740407008aef89526e0a6bc60551fc70fcf348f5c37413378d32f2318fab3bf53245c966ea5c500dc85de6ef3a83b45459394fb1b62613dfcc232',
        privateShare:
          '-----BEGIN PGP MESSAGE-----\n\nwX4DUQ8XhGVGcTISAgMEDC3phSbgrJQPWdlrzod94fV9J6KX1ne4lrbUEv24\nFsCqCT9SZw6Fll8gug5zZfUXM3/w7e03n3lZ4/1Ux09aqjDeQwDtuUoMN3Jr\n9hFmtMDdSCqn4FjlGgXuRux+uugA/YWrYzrFzCp28+yJA2x3y+LSoAFMS5YK\n81/nB6Rduy0Fn9E16uPslq2j7LduCl9RaPWz0cSf75DWjm84pcTSoxkwTPLc\nNSnuFKMCdWamfp6JRoa6hRbc+2H3qSiilmVvDUcgvYx4YvZ2siYaV+b1MWlE\nhJ9RNgsGaNFNdpAhVAMH55k9qZo1IrSLJD7YNT9kJh/CLBgu2Rvdi5qFmawu\nJp9owglZYzFiZ1eDY5KhJBSA3R4=\n=6jsX\n-----END PGP MESSAGE-----\n',
        n: 'b6504f93d9a8a7c82d1040f8761c937d78c1be1d873c718a8bfadc5f90e1d746e1e15cd92b3741dd3291dbd78f47118a6dfd480e7ffb635dbd589218489172fca839ad82cb0a70bcf6da89933970ec665385fa8abda6fce658ae5a84956f6152d8ef16cf7c2e3797239bfea578e3ecdf67dd1975ed7362c43e99a62d844b05f7c4a23d57d21e1cb66f189768d5af4f71a1c82e250cdf8a660001ac8a72da4324924e20f40c24397ba0fc83f0adb7eb147a57598ece81f3e7515f72a269f6e44aef2de7c1d5c56bbdd5f7255f5f17a3bf2b20d12b2f11020962abbec00d477d0e5acf3a35c65d4f8611dfe9c708b36f8abad6f52e0bbcecbc91d21bfe6cf3dc3acfd953899d1e2c29928b9ba6fed33f461d62fe59ccc518a02123e2eddcfde21a56856306fd3ce7d5bd721f1f0fce66ac1849383ca5fafb18285627c09ea457fa86bd3e7ef89c1837112d36684b305c6239f07ce89e18ecb306ebee7ec543d13938ca3d9ec78d1f86c2129127bc3e1fed8f0ebdf7164201aa56854b60c46aff93',
        vssProof:
          '02ff64af27f0726272afca16956874d45e52c6fe76f6e81ca0ceeff630005b378e',
        privateShareProof:
          '-----BEGIN PGP PUBLIC KEY BLOCK-----\n\nxk8EY+UCQBMFK4EEAAoCAwQ6HUYPEEHnI2ymRz+zwdHKrENvoPusHBx8HfPU\nUuty09Z/CIlj1y/zP/PrGcwJ8a3FZGaz3C08CArxKBw2sdZ7zVU2YzI3ZDgz\nOGYxNzY3ZDk1Y2NjNGJiOWUgPHVzZXItNmMyN2Q4MzhmMTc2N2Q5NWNjYzRi\nYjllQDZjMjdkODM4ZjE3NjdkOTVjY2M0YmI5ZS5jb20+wowEEBMIAB0FAmPl\nAkAECwkHCAMVCAoEFgACAQIZAQIbAwIeAQAhCRB3I77CRpLDFhYhBIcNV/yE\n7RDnrS87K3cjvsJGksMWyPwBAPTPdSFcnwYS/nncTwxhe7eVstJIFMZkzvRl\n2zLKPCmYAPsGekmjtd80j8dzc/tJHW1YaJDASompKxOl4mC5BvkxDs5TBGPl\nAkASBSuBBAAKAgMEm/W2uVIp0ZkXXka+pQI0fdrHZNnjmCAXGQ3emJ060PXd\nM9FR8+N42Wh8jL+RVqZKDks/EtD7etTDKuk0IXCMRAMBCAfCeAQYEwgACQUC\nY+UCQAIbDAAhCRB3I77CRpLDFhYhBIcNV/yE7RDnrS87K3cjvsJGksMWHicB\nAINk1q5QoHOAQoDg3KXktMClEIlYb4YMFIpWv1flbiwcAQC4KPvTRANT2MIi\nDdUpL+fTe5p2dcFQ+LrgvBIuTGZKyM5PBGPlAkMTBSuBBAAKAgMEDrNwqP6Z\nII3dxBgz2s4VQoqZz63AjH3ZQ6zpJ/+iegZm6kf4jklrq6Krb9y1es/QXqWz\njodOVOa5pux62UeatcJ4BBgTCAAJBQJj5QJDAhsgACEJEHcjvsJGksMWFiEE\nhw1X/ITtEOetLzsrdyO+wkaSwxZYwgD/arhFonir4mnu8X7WpNvSJzAjfUqH\nA7wFZVekxRbLJ84A/213lh42q/FVRUPJi4mSZHjs6Dkle0D/Xy5tzzw59Pdq\n=n2ks\n-----END PGP PUBLIC KEY BLOCK-----\n',
      },
      {
        from: 'backup',
        to: 'bitgo',
        publicShare:
          '03855e89545e8c92ed55a80d5f454ab5f2c70c1d43544bd7edd234c251ce597dc031851256d94930f976478522cc4cf39ba37be6841ce9ea48f8c0b578f1f4a1a0',
        privateShare:
          '-----BEGIN PGP MESSAGE-----\n\nwX4DUQ8XhGVGcTISAgMECJTqBl/6cwHr1Js9v+GhXzx1Hv2sCIVQcF1Uz//L\nTRl2iqWUsA+/hr8NJl1YUE2uBkMozaCWhy5WmiTMeNP9ojDDOzh+pssxKSab\nYHkAj3tnIQWooZSi7BY6Kk1csHi7QpTclx4BdKaWPT61mDg7W87SoAHGXwi/\ngx08BH44DccpH7DOIHijQuyEDCNNi0ZaLJHgJ8F9CwNVzWM54l7GeotlN3hd\nDpUeGaW+bHQVaNDPJqIVAwWNGEppnxhq7DgMbE6obyS864nlBzD0/GeekocR\nS24MhsP+gtZtD8YndO2IVWvU6QtrxjSWQCFE2pd8kkIy0fwXJwSa+KcCpd1W\ntqZrUVg7VzxLAtVmSHXpyh5bSZI=\n=eXLa\n-----END PGP MESSAGE-----\n',
        n: 'd5b3224fae54de4a8cdc529d3e811e8396ab99ef489521e67eaf4ef4c693d3d996ba07396e19fd6e30e86f8db9606d951ad8d6610ed9630448064cbf736d28be8764ac77f66e65fc7119715afc062efdaea79a6520d4d1a7022e1ea6a3bdcf4571aa8ddd90d712e252d5428b3782a2748618ef79f44e26b57e61366e791851704b32bad986fc5e8fa10c4935e8d670fab9389a1e46646d61e3032f064572a7af6d19cdd68620a593155323114e949150773f66f52684981255c1de8b018b7b3e705c50b1812e041ec6ee51c002f9d85da2612c6f104b9ec362cf4a68d01660063630a655652b3d9e4ddcb28a5baa30f581872f34ec8733113f2f2f3dccbb03ec3c7a20e0dc9a6bef35d54d2e15c35d3f8b9bcc6ccce14b5aadbd70dffd578ab918331fa27cac29eaef04042f5a26a8d5197d470f207e8deab3b12483e809570d3b3eb844931de58203e8168d981f3142e826ef0788b8230ddb604ebef9fa96ef2481b1efba95d9834c8be6965ade5aa8154f3f9c08fec0d4db4855ad07fd4a5f',
        vssProof:
          '03fef814aae45195ce6a3d50b20059db9ce2d20c799714c9a3bbe4f5d92eabece7',
        privateShareProof:
          '-----BEGIN PGP PUBLIC KEY BLOCK-----\n\nxk8EY+UCQxMFK4EEAAoCAwQHDmXRwBr5qxab9dQqUmIJj1Qa6hC6MH79Ym7M\nXZkxMrosD5MwikGpbxHx6cCf4zCDbAnoxIxzY6gfHPCIFHXxzVVkZWU0M2Yw\nNzg1ZmMwNzlmZTkwZDA4ODQgPHVzZXItZGVlNDNmMDc4NWZjMDc5ZmU5MGQw\nODg0QGRlZTQzZjA3ODVmYzA3OWZlOTBkMDg4NC5jb20+wowEEBMIAB0FAmPl\nAkMECwkHCAMVCAoEFgACAQIZAQIbAwIeAQAhCRAPv1cPaZQCzRYhBPL+9NkZ\nEOGzmvKZcw+/Vw9plALNrV4BAJL/tSYljkxZC3Eafs0BG9FPScxfHKa6IhVu\na1fhE3jiAP431KREnmLPaHx/1nmFFrUdN5nfEE3PWCtelys5do6g0c5TBGPl\nAkMSBSuBBAAKAgMESvcoGWyiVPOnxHz6rC/fg28IxflVezfvhyIvrWd+hzKM\nIziCrFtn8SXwkRs6FdC4VyahJbnYUba6tXbDFEYQsAMBCAfCeAQYEwgACQUC\nY+UCQwIbDAAhCRAPv1cPaZQCzRYhBPL+9NkZEOGzmvKZcw+/Vw9plALNdlsB\nAMsCSAor5XMo3jSS0cUM0HsE50ZZoEzX2/WypdmPLHFFAQCpDfdOuijt4t55\n46IgPCx9PwatSVLYMZuqr0qpqbrpK85PBGPlAkMTBSuBBAAKAgMEGm0GdSHl\nI6Ouxsn30OWp5ghDXY961pNec7H7HCskzdFkHQinl5SNU5CrxdMeNRo53Vuw\nU6koNEtrgdGqtezYJMJ4BBgTCAAJBQJj5QJDAhsgACEJEA+/Vw9plALNFiEE\n8v702RkQ4bOa8plzD79XD2mUAs1SiwEAvFegY67b3sr2pWnv+eyq15P5lnK3\nQFoZ7NUZ5IDGzvQA/2/I8cULL+iMxxzzqOLhncC2peTtjTGHq6zx0H8uPPP9\n=y4o0\n-----END PGP PUBLIC KEY BLOCK-----\n',
      },
      {
        from: 'bitgo',
        to: 'user',
        publicShare:
          '038920c71ee7fa763dc6980f411d4d48a52b7936ae1593f4e988bd935a5fb5646c68cf817d3830609da399d9957fbd49dc6b7201587b97f137d9f4a2e7eca40d57',
        privateShare:
          '-----BEGIN PGP MESSAGE-----\n\nwX4DA2odKYpPb9ESAgMEuzjndRkZjM0fYqSen1aCFwmrB4fCMqKtg3+GyWz0\n+3KYW+WHAobMkVo2frLe+MiWeeXYqUcS8OIfORjAVmD59zDa4Fc7DuIy5DBG\nusqpntdSNQ9EP8GEULXK//e7lDgzKrJGBWEIONf5LIhXv7zUKrDSsQHcfUAS\nDHhRgqFUVjtY0JTy8Vmumm9Pd+5N24oFK9xzYoekFLOfCCJzycjrl1J/Gtq5\nHPYhYrIH+gMXja3HD1eJfbbj09S2jaAVLnlX/OS4ehpUpGozPyGp/7NBaPFd\nl4icr+bkxtwa/bmNnlIr9obNfWL9LTUzi3nRlW4VNsHgZgNRs7w90fE0QS0s\nQqcLZXLsabiTphHP4FOFAX8QPMvpKswoobVqiPvVjB9DD9Iftw==\n=hBB4\n-----END PGP MESSAGE-----\n',
        vssProof:
          '0264c3587b90ff2e4cbdba6a6c5f7678d4731437b91a2a7ca21e758549e9bc810a',
      },
      {
        from: 'bitgo',
        to: 'backup',
        publicShare:
          '038920c71ee7fa763dc6980f411d4d48a52b7936ae1593f4e988bd935a5fb5646c68cf817d3830609da399d9957fbd49dc6b7201587b97f137d9f4a2e7eca40d57',
        privateShare:
          '-----BEGIN PGP MESSAGE-----\n\nwX4DodoFZ68X8YYSAgMExdXkja+6LjC8HJQbgum7HDG78U3GQtdqRqguwdyL\n+MlVyWnA/+ddnY9hvWhgO6t0Yl8Z1s+cvaZ6p0YMLtoRJTAcmrp4UkjIMgv7\narbRFzp+ME1djzpHcmE73up+jW+haBdizSkHUQWaBDmLyfvLxRTSsQHGcbKn\nUjwLsCkJJ9DuV7bzEJykeKJsBInMJJlfUWzjRxGrPU21Iua1lf78n+p9TGd9\nEqnZ1rO7GX7Uhqv9vfIHzj9o4rJGbmpzPsWICzUOB4dmx2x+HHXmIZogypsI\nLnqi3NebooNpHFZQWM/ul8eCJ2bjkfQ6wH3ffn0zU/5SWjhaUmrz36nyseU2\nffqrwmdDmHKc8U0H6Lq1zpqUXbqgCkLlga7Pwqor/Jld9hlgww==\n=n26L\n-----END PGP MESSAGE-----\n',
        vssProof:
          '0264c3587b90ff2e4cbdba6a6c5f7678d4731437b91a2a7ca21e758549e9bc810a',
      },
    ],
    walletHSMGPGPublicKeySigs:
      '-----BEGIN PGP PUBLIC KEY BLOCK-----\n\nxk8EY+UCQBMFK4EEAAoCAwQ6HUYPEEHnI2ymRz+zwdHKrENvoPusHBx8HfPU\nUuty09Z/CIlj1y/zP/PrGcwJ8a3FZGaz3C08CArxKBw2sdZ7zVU2YzI3ZDgz\nOGYxNzY3ZDk1Y2NjNGJiOWUgPHVzZXItNmMyN2Q4MzhmMTc2N2Q5NWNjYzRi\nYjllQDZjMjdkODM4ZjE3NjdkOTVjY2M0YmI5ZS5jb20+wowEEBMIAB0FAmPl\nAkAECwkHCAMVCAoEFgACAQIZAQIbAwIeAQAhCRB3I77CRpLDFhYhBIcNV/yE\n7RDnrS87K3cjvsJGksMWyPwBAPTPdSFcnwYS/nncTwxhe7eVstJIFMZkzvRl\n2zLKPCmYAPsGekmjtd80j8dzc/tJHW1YaJDASompKxOl4mC5BvkxDsLCDgQT\nEwgCgAUCY+UCRwILCQkQiTUbCAxrp3uZFIAAAAAADgCCY29tbW9uS2V5Y2hh\naW4wMzg1YTgxMDkyZDc0ZmMwZjI5OTczMDEzODdmYjUyNDVkZDZkYTVhMzg4\nNzU1YmM2NmFlOWEzYTdjYTJiMWExMzdiZDZkOGU4N2QwY2NiNWYzYjA1MDA0\nN2Q0Y2U2YzM1NjdkZTE5MDE3ZGRjNzZmMTVjZGQwYmFjMjFjOTU3MTI5PRSA\nAAAAAAwAKHVzZXJHcGdLZXlJZDg3MGQ1N2ZjODRlZDEwZTdhZDJmM2IyYjc3\nMjNiZWMyNDY5MmMzMTY/FIAAAAAADgAoYmFja3VwR3BnS2V5SWRmMmZlZjRk\nOTE5MTBlMWIzOWFmMjk5NzMwZmJmNTcwZjY5OTQwMmNklxSAAAAAAAwAgnVz\nZXJTaGFyZVB1YjAyNzQzZjg0ODkyNWI3ZWJmMGM4OGRjMjVhZGYyOGY5YzE3\nNGFjZjVmODYyOTFiMzdlZWI3YmZmZjM3MmY5YTAzYTY4Y2Y4MTdkMzgzMDYw\nOWRhMzk5ZDk5NTdmYmQ0OWRjNmI3MjAxNTg3Yjk3ZjEzN2Q5ZjRhMmU3ZWNh\nNDBkNTeZFIAAAAAADgCCYmFja3VwU2hhcmVQdWIwMmUyNzk3ZTU2Y2Y4NDgx\nZTNiMWU2MDRjNmI4YTYyZjI0OTZkN2I4YmVkYmE4MWIxYmZlMjUxNTJjNjM4\nODk4MDk2OGNmODE3ZDM4MzA2MDlkYTM5OWQ5OTU3ZmJkNDlkYzZiNzIwMTU4\nN2I5N2YxMzdkOWY0YTJlN2VjYTQwZDU3AhUIAhYAAhsDAh4BFiEEdEvkP/yd\nEzeilCdeiTUbCAxrp3sAAN0MAPwLKATLaNdcM50LRzWGo7e2djCpzV3xzHsZ\nkfA7PRgdRwD/ef3U6ERvPibCPkFQhVldg5rh+1hcG7Qs/L1tCxgU0kXOUwRj\n5QJAEgUrgQQACgIDBJv1trlSKdGZF15GvqUCNH3ax2TZ45ggFxkN3pidOtD1\n3TPRUfPjeNlofIy/kVamSg5LPxLQ+3rUwyrpNCFwjEQDAQgHwngEGBMIAAkF\nAmPlAkACGwwAIQkQdyO+wkaSwxYWIQSHDVf8hO0Q560vOyt3I77CRpLDFh4n\nAQCDZNauUKBzgEKA4Nyl5LTApRCJWG+GDBSKVr9X5W4sHAEAuCj700QDU9jC\nIg3VKS/n03uadnXBUPi64LwSLkxmSsjGTwRj5QJDEwUrgQQACgIDBAcOZdHA\nGvmrFpv11CpSYgmPVBrqELowfv1ibsxdmTEyuiwPkzCKQalvEfHpwJ/jMINs\nCejEjHNjqB8c8IgUdfHNVWRlZTQzZjA3ODVmYzA3OWZlOTBkMDg4NCA8dXNl\nci1kZWU0M2YwNzg1ZmMwNzlmZTkwZDA4ODRAZGVlNDNmMDc4NWZjMDc5ZmU5\nMGQwODg0LmNvbT7CjAQQEwgAHQUCY+UCQwQLCQcIAxUICgQWAAIBAhkBAhsD\nAh4BACEJEA+/Vw9plALNFiEE8v702RkQ4bOa8plzD79XD2mUAs2tXgEAkv+1\nJiWOTFkLcRp+zQEb0U9JzF8cproiFW5rV+ETeOIA/jfUpESeYs9ofH/WeYUW\ntR03md8QTc9YK16XKzl2jqDRwsIOBBMTCAKABQJj5QJIAgsJCRCJNRsIDGun\ne5kUgAAAAAAOAIJjb21tb25LZXljaGFpbjAzODVhODEwOTJkNzRmYzBmMjk5\nNzMwMTM4N2ZiNTI0NWRkNmRhNWEzODg3NTViYzY2YWU5YTNhN2NhMmIxYTEz\nN2JkNmQ4ZTg3ZDBjY2I1ZjNiMDUwMDQ3ZDRjZTZjMzU2N2RlMTkwMTdkZGM3\nNmYxNWNkZDBiYWMyMWM5NTcxMjk9FIAAAAAADAAodXNlckdwZ0tleUlkODcw\nZDU3ZmM4NGVkMTBlN2FkMmYzYjJiNzcyM2JlYzI0NjkyYzMxNj8UgAAAAAAO\nAChiYWNrdXBHcGdLZXlJZGYyZmVmNGQ5MTkxMGUxYjM5YWYyOTk3MzBmYmY1\nNzBmNjk5NDAyY2SXFIAAAAAADACCdXNlclNoYXJlUHViMDI3NDNmODQ4OTI1\nYjdlYmYwYzg4ZGMyNWFkZjI4ZjljMTc0YWNmNWY4NjI5MWIzN2VlYjdiZmZm\nMzcyZjlhMDNhNjhjZjgxN2QzODMwNjA5ZGEzOTlkOTk1N2ZiZDQ5ZGM2Yjcy\nMDE1ODdiOTdmMTM3ZDlmNGEyZTdlY2E0MGQ1N5kUgAAAAAAOAIJiYWNrdXBT\naGFyZVB1YjAyZTI3OTdlNTZjZjg0ODFlM2IxZTYwNGM2YjhhNjJmMjQ5NmQ3\nYjhiZWRiYTgxYjFiZmUyNTE1MmM2Mzg4OTgwOTY4Y2Y4MTdkMzgzMDYwOWRh\nMzk5ZDk5NTdmYmQ0OWRjNmI3MjAxNTg3Yjk3ZjEzN2Q5ZjRhMmU3ZWNhNDBk\nNTcCFQgCFgACGwMCHgEWIQR0S+Q//J0TN6KUJ16JNRsIDGunewAADX4A/0pJ\npf3S5A0ct9IylsOJoVPPN7WHfNOqh7We6mEtbSEVAP993sBZVNinqD/O+2kP\naVDC2h2ha3qQ/B/3FDCy/13z3s5TBGPlAkMSBSuBBAAKAgMESvcoGWyiVPOn\nxHz6rC/fg28IxflVezfvhyIvrWd+hzKMIziCrFtn8SXwkRs6FdC4VyahJbnY\nUba6tXbDFEYQsAMBCAfCeAQYEwgACQUCY+UCQwIbDAAhCRAPv1cPaZQCzRYh\nBPL+9NkZEOGzmvKZcw+/Vw9plALNdlsBAMsCSAor5XMo3jSS0cUM0HsE50ZZ\noEzX2/WypdmPLHFFAQCpDfdOuijt4t5546IgPCx9PwatSVLYMZuqr0qpqbrp\nKw==\n=gmnb\n-----END PGP PUBLIC KEY BLOCK-----\n',
  };

  await generateKeycard({
    activationCode: '123456',
    backupKeychain,
    bitgoKeychain,
    coin: coins.get('gteth'),
    keyCardImage: await downloadKeycardImage('eth'),
    passcodeEncryptionCode: '654321',
    passphrase: 'test_wallet_passphrase',
    userKeychain,
    walletLabel: 'Hot ETH TSS Wallet',
  });
}

export async function downloadKeycardForSelfManagedHotAdvancedPolygonWallet() {
  const userKeychain: Keychain = {
    id: '63e50a158312c00007bd35c89cc5fb1a',
    type: 'tss',
    commonKeychain:
      '021150550261463d753e96647bd5debb05d9ef325f4368cc160bf03365e4dadc756416f1230ccc4a1f24eb4924395bced22400f63d4837d511a28da015728ca049',
    encryptedPrv:
      '{"iv":"P2c4huC/QSPoWSO9T3Ecbw==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"oeZ8oYVw774=","ct":"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"}',
  };
  const backupKeychain: Keychain = {
    id: '63e50a15f9cdb4000746eb377628ea41',
    type: 'tss',
    provider: 'BitGoTrustAsKrs',
    commonKeychain:
      '021150550261463d753e96647bd5debb05d9ef325f4368cc160bf03365e4dadc756416f1230ccc4a1f24eb4924395bced22400f63d4837d511a28da015728ca049',
    keyShares: [
      {
        from: 'backup',
        to: 'user',
        privateShare:
          '-----BEGIN PGP MESSAGE-----\n\nwX4D0mT7O+BWppUSAgME8Uv+ItfUdDcVzW7d9JWKw9jPQaZiyuAala1KHmP4\n/jTu7mW201tMypdPIX8L4o7I+BgDSj1cebYbu8cKRqWNDTD7tXuTOktSUPf2\nMsUcSxSjxaW9OCrO+KFHr8/4l6ZtSRQTjAk5sou5CMqc1E9uJYbSsQGM954Q\n7mRnSXanznADTXYUd1OjaknLEQX5pgPsydHEKJP0Mti8sWSTeLynrRqTud9+\njXb7MkmDK7HQ76EhFbj4rfnwWvSuujlpLZo2Q4+30WBAAXh1ujHiGhon6kCK\nIyTQKIoM/W+cRwqn64tUKBErDvTq4PIN7M6+COmhwmWDlF5wJUpJ8quM9PZw\nwwZaAiRtSksoKV1arXKMSa3Hb2UbUiqZgEbo2Pb+KrFU9w02Ew==\n=yiR7\n-----END PGP MESSAGE-----\n',
        publicShare:
          '033e6dbe251b633e05e9001cf6e036067cad188a9604571ba5af6edc5d4372e2c81b75f47548480e9ed2f1fb6d21ac7833ad1ac5905c3016d5bfd697fdb9d11ce1',
        privateShareProof:
          '-----BEGIN PGP PUBLIC KEY BLOCK-----\n\nxk8EY+FTlBMFK4EEAAoCAwTbxTk4EmUKQE3y/mkZnDitLhh8tiWCp0GwdyMi\nh1VTQUp2W+H4JKheLOw2/tFIwF5/2CVQBOLTLTkQl/BnMylqzV5iYWNrdXAt\nNDUxYzZlMDY2OWQyZDM5YTQzZTE3M2UxIDxiYWNrdXAtNDUxYzZlMDY2OWQy\nZDM5YTQzZTE3M2UxQDQ1MWM2ZTA2NjlkMmQzOWE0M2UxNzNlMS5jb20+wowE\nEBMIAB0FAmPhU5QECwkHCAMVCAoEFgACAQIZAQIbAwIeAQAhCRDOw1Jx/O+o\niBYhBLMXk+RFg569EB/iWs7DUnH876iIEWQBAIFNrXGse2ZqAv6y28b6Gp2g\nuXI3ElSDYFGgkmfsVvPxAQDNXHKKxN7xQ/vEc68qHz2TZcUklMvJAGzW1U6b\nG+cj4s5TBGPhU5QSBSuBBAAKAgMEOaf88sNeNa/zHccIWicSKmthO1dSsSPd\nRusxb6gROpSsHILlRLfro8R5IRxnax0ZT7Rkes0u467dBR4T2yRxhgMBCAfC\neAQYEwgACQUCY+FTlAIbDAAhCRDOw1Jx/O+oiBYhBLMXk+RFg569EB/iWs7D\nUnH876iI3EQA/RyvYaos0O/ns5MNrzYACVedCXnF+TuFD2yArDRTqufhAP9v\nQiL/nXQahqLNK1TENGJH2f3iz03/mw8pdiSDnWPF5s5PBGPhU5QTBSuBBAAK\nAgMEkzmqasASN4MjD5qkkSSanf13Z3F8uRFpSuhbwZfwuH7EvpvGLqJplO/B\nJztuPtl7woetYpQYzAxJBsK1+yGX8cJ4BBgTCAAJBQJj4VOUAhsgACEJEM7D\nUnH876iIFiEEsxeT5EWDnr0QH+JazsNScfzvqIjKlAD/QHn9P3B2DzDS/PD7\nSST5611GecQSCzb4BT6LyGOgXw8BAMMUUWxoezB/1XqBjgo0JKfbg3SwDC1F\nVQwk7ajeOqgD\n=Hf7k\n-----END PGP PUBLIC KEY BLOCK-----\n',
        vssProof:
          '02fedf3cf6215bea893753bcacda3c3cbf305bad98c8d440199e6f7a467ef6f014',
      },
      {
        from: 'backup',
        to: 'bitgo',
        privateShare:
          '-----BEGIN PGP MESSAGE-----\n\nwX4DUQ8XhGVGcTISAgMEzIylhWZ4TcCYriu3I1PbVB/IobzOtG1wcf1sguDK\nKv/MmHuMigg0ByN9s2YoWtQ3CuSZTENHDdh90gtl+NTVJzCPrPhsb5wqP5QR\nX90t72duJd7c8SwPzWFjnvg5Zz4aEHSrI9k4QoV0xr/hLqvBrIjSoAEqZRkM\n3zCjOWKzVBHX1fNlV4yHZ0F4yu22VAdKNBI57hsJArBVft79VsVYuwxWaSFU\n0X9zDUAp5c4aoT9S+wqHu8S5IQc/QKqlZTzOqwXfX/2nJ5fap3zkbSwizNem\nQRREG6044DydeJUvAfEnR7dBq9xbViOEu/SHse9CoXVNcgMT82e8cbLv3/hS\n7xq8SbmnOZVarZiTDUwS2QiDz0k=\n=LUUM\n-----END PGP MESSAGE-----\n',
        publicShare:
          '033e6dbe251b633e05e9001cf6e036067cad188a9604571ba5af6edc5d4372e2c81b75f47548480e9ed2f1fb6d21ac7833ad1ac5905c3016d5bfd697fdb9d11ce1',
        privateShareProof:
          '-----BEGIN PGP PUBLIC KEY BLOCK-----\n\nxk8EY+FTlBMFK4EEAAoCAwTbxTk4EmUKQE3y/mkZnDitLhh8tiWCp0GwdyMi\nh1VTQUp2W+H4JKheLOw2/tFIwF5/2CVQBOLTLTkQl/BnMylqzV5iYWNrdXAt\nNDUxYzZlMDY2OWQyZDM5YTQzZTE3M2UxIDxiYWNrdXAtNDUxYzZlMDY2OWQy\nZDM5YTQzZTE3M2UxQDQ1MWM2ZTA2NjlkMmQzOWE0M2UxNzNlMS5jb20+wowE\nEBMIAB0FAmPhU5QECwkHCAMVCAoEFgACAQIZAQIbAwIeAQAhCRDOw1Jx/O+o\niBYhBLMXk+RFg569EB/iWs7DUnH876iIEWQBAIFNrXGse2ZqAv6y28b6Gp2g\nuXI3ElSDYFGgkmfsVvPxAQDNXHKKxN7xQ/vEc68qHz2TZcUklMvJAGzW1U6b\nG+cj4s5TBGPhU5QSBSuBBAAKAgMEOaf88sNeNa/zHccIWicSKmthO1dSsSPd\nRusxb6gROpSsHILlRLfro8R5IRxnax0ZT7Rkes0u467dBR4T2yRxhgMBCAfC\neAQYEwgACQUCY+FTlAIbDAAhCRDOw1Jx/O+oiBYhBLMXk+RFg569EB/iWs7D\nUnH876iI3EQA/RyvYaos0O/ns5MNrzYACVedCXnF+TuFD2yArDRTqufhAP9v\nQiL/nXQahqLNK1TENGJH2f3iz03/mw8pdiSDnWPF5s5PBGPhU5QTBSuBBAAK\nAgMEQDObru0Y5Wcvwnl0yZoMfS+ATUZnTS+sMRUIypJp6ox0SUBJj2pmVRdM\ngStpu7uUUmr/oflBZAvZmSS+7a+/osJ4BBgTCAAJBQJj4VOUAhsgACEJEM7D\nUnH876iIFiEEsxeT5EWDnr0QH+JazsNScfzvqIgkhgD7BoUrUv04vXczfLfx\nst11whqqJvdGdRMAZ0V56JIoZgkA+gPuycxIGAI2kGZ4zeAZIy/1hCmkgq2/\nlMsqPfK/Y1Ea\n=UTSW\n-----END PGP PUBLIC KEY BLOCK-----\n',
        vssProof:
          '02fedf3cf6215bea893753bcacda3c3cbf305bad98c8d440199e6f7a467ef6f014',
      },
      {
        from: 'user',
        to: 'backup',
        privateShare:
          '-----BEGIN PGP MESSAGE-----\n\nwX4De8EvgCqn1UESAgMEJIhqNo8ILaItBThEUDrgWqkjPrBLhvU7wiz2/ctr\nPpVJt52/2Zyyz64xJdgvYBZuWbF9xSS/eTw5mH71hLoCmDASz6UU47GseGRg\nb5pX+sGW2RMnGMoBF4o4T5p9FdAjgYJWvrKm9BLmZg1bwQ3b/dnSoAFlYfVD\nQwZN/yKVdCJA0Yx2lVqbzerAjtU7G4dpnXvIN3vbXq55owcePvDe6ruY8qWP\nfPTxNmtdTl2VurZkmILz6+V4zgW8FBo50Ac2ptzZAoofe98ofORopUz+q6uh\nsd1+8pdSun/Z43XhB2O7547aeSXBB6UiBYZEa/iyZQ7OAWOmZRiHLOgfShx3\n0D2UOvgUVnXh0vQnuCtbHLDxXfA=\n=0hPI\n-----END PGP MESSAGE-----\n',
        publicShare:
          '02374657bac088787df5d33fb16fb34028f9b1a66f6f1ebe2a2054b1377d2273e1c4583d477309a56b5fba49b7dc759dcd912a87da98766d5354a5b7e1e8d28965',
        privateShareProof:
          '-----BEGIN PGP PUBLIC KEY BLOCK-----\n\nxk8EY+UKExMFK4EEAAoCAwQ9vUvsCBCBuun8gqXJAhNrU26z1gku5PAQ4/78\n6kL3HkA1DohtdfgXn2jYRSwD+fC+JAJF2zLSsyQwJQCcNtH8zVVhZDRhOGQy\nYzgxZDE3NWYxYzkzYjFiM2IgPHVzZXItYWQ0YThkMmM4MWQxNzVmMWM5M2Ix\nYjNiQGFkNGE4ZDJjODFkMTc1ZjFjOTNiMWIzYi5jb20+wowEEBMIAB0FAmPl\nChMECwkHCAMVCAoEFgACAQIZAQIbAwIeAQAhCRDWTboBXi20+hYhBIVgZ9EL\nsBZF7o2M3tZNugFeLbT6IxIA/j6PAqfcf9Xs4ZLeETDgu688JEeSVCw4sONJ\nEP/Dhnm9AP0bdwXjz3tWraBNEvC3FreVtktiWR4/+C5choX5C7Dslc5TBGPl\nChMSBSuBBAAKAgMEzUv73JUaXgCM2G1acO2x2mDEuA4Kt5ah9NtLXjISK1lg\ncwcj6Ad2+5mUQJY0GBhe5/Lle0whJ2uRLdNfuExJpQMBCAfCeAQYEwgACQUC\nY+UKEwIbDAAhCRDWTboBXi20+hYhBIVgZ9ELsBZF7o2M3tZNugFeLbT6TnUB\nALEvSU4fh8heE4oWL1/KtSYp+W+Q/mig4bz/gkg7d6lgAQCBJHbtrE4612Rl\nhK50Mi3t68aaFyRr0VslAdNc8p5sTs5PBGPlChQTBSuBBAAKAgME3Fd0hQ4Y\ndKWKXZ3E9LA8AZ7uH4Uvug4GofDODdkZzzdunARbO7s2cNqIdQUOQlFPnDCr\nt6UqvZBhUY2NEQ/MSsJ4BBgTCAAJBQJj5QoUAhsgACEJENZNugFeLbT6FiEE\nhWBn0QuwFkXujYze1k26AV4ttPoFfAD/TB85WgH0TtpPQDERdFJYfqoTh/Ez\ng3dTsvzhPcLZzw0BAO8bdb0ci3YLC0oMs73hEn/lkQSz/PwKd6XypKz+M4nb\n=HtTk\n-----END PGP PUBLIC KEY BLOCK-----\n',
        vssProof:
          '03f94fe152a22ebbb3347c45974b1c5b47c86bd1bb6ef882857b90578fbece9a27',
      },
      {
        from: 'bitgo',
        to: 'backup',
        privateShare:
          '-----BEGIN PGP MESSAGE-----\n\nwX4De8EvgCqn1UESAgMEb6J+DsgrD6P/Z7ZYj3VcKYj6UVzCejjr/rdPbz1L\n50T2MNxK//FRH9bO4d77pZjOzy4Wl8BEp6fcjAV+WcAcUDC8HujPSvX5a8WN\nXKBk9Zkd7YEF2beBIfkB6CmV7ruqnJBsJOuBfltNWMbmrYTt97rSsQGAw9vR\nBaryffAxGbLveknGu69q7T9nB4DpDS3ECZCExm7EuiAdYWKvlYvmoJBUKYAF\neHUUxpwr3jf0D+vyO3GBNN5hL/HuGJtJKZlxEocQwSJyYlUrKcxBDHsEKOmV\netvbPeTfBDdmyUWUWCjDnSyPEs1PHWo6cmrYEUp6u721H5WtdH2GDP6a0T7O\nV/K31GRa7nnAqM97ClbYT/VD25vou6Hu0mkzML6aSjSZBPwnpw==\n=MPp0\n-----END PGP MESSAGE-----\n',
        publicShare:
          '02a34344aea7a9d0495229a2da44f6bca37cb6433e16ed77e3c251b22188bd3a908448bf66517a9614f23f03ff3b39b8d0e5bba8d2539150e88e115035cfe8fa03',
        vssProof:
          '036ec5665573a78dcc66fcbfd799f0042a969dc261440b6a6a830f323651ba1167',
      },
    ],
  };
  const bitgoKeychain: Keychain = {
    id: '63e50a14bc6fbd000784789e118b4ceb',
    type: 'tss',
    commonKeychain:
      '021150550261463d753e96647bd5debb05d9ef325f4368cc160bf03365e4dadc756416f1230ccc4a1f24eb4924395bced22400f63d4837d511a28da015728ca049',
    keyShares: [
      {
        from: 'user',
        to: 'bitgo',
        publicShare:
          '02374657bac088787df5d33fb16fb34028f9b1a66f6f1ebe2a2054b1377d2273e1c4583d477309a56b5fba49b7dc759dcd912a87da98766d5354a5b7e1e8d28965',
        privateShare:
          '-----BEGIN PGP MESSAGE-----\n\nwX4DUQ8XhGVGcTISAgMEdaGdR5yKT+wBVu+AvBTKtlINKoN8Jjztc+XO4rEr\n3rcLKS9WYzghX1LzW2psO5LxWN9Xe8Lpk5FHttgWELbwzzAbmlzcBRXanEUE\nI4IZKzhJSnX1ZEg2Fdf+KJjhEGaTQNcgZlKkXfo7jAWXtFLhtKzSoAEi/WlY\naewWCqOod22WurS4H1XrPMJHIWJe+aRU02I7pKfbtkx0D8gIXBUfrEESoula\nN/oowKespLSmzjNqXQH/cgFi/V124hQpjVZPxasNkMlLUt8FxdU8ZZxGd3hy\nuuquXZtUec7usa6L/N0VfYikFMhuZzlShz09/pDOIP1TiMef8kOzFxwabqN8\nmLnTuQn/vJEtFdK9F9VIsU2MNHk=\n=0Enu\n-----END PGP MESSAGE-----\n',
        n: '9baa8fce3100008986886f53c020da0432645b36902f4ca455cf1621a5c993aae9aa498f50cb5f3a815a45293406caf036f3bab755af9c5af40ff59f91ad5a16fd7d8becdc8e48c3308b2cbaed924d9851fcaa9dcde285290af286cbe3c6d915eb3901c7cbe121dcf6bcdb678feff7f03a22bfc266c754180123f7800c48a9651f89b85891719865a2fb3837818163fcb92f76027ab74bf918ef5352d521dac9db9c4033214952cc1aa128c0586cd7644df3b135eb7a9ff1c6bf5937833028c917aa18b1b9741a096621157b506007c08af2fe377d2554b4813bec0457b69f98a5004698340be78853a2928b30b40e3330cf778ed88fef34484f91fd1b162b4ac2eb466c64df46cb91ca0b039c7d67309ecc40ee32829a6a652c8ed0d0c5804a1be57806deeb67798972e9f9f47c128ef0c0cfce7e63150f95f1fce0a9dd6dee8381fcccc2378a6769c4df1217c31a85ed0a690cb6cb8a48b97a42f4d65481630bc5277595ea1f37579f3ab864a43ed25c1e4564d0e5fb91ae4af2d35d24142b',
        vssProof:
          '03f94fe152a22ebbb3347c45974b1c5b47c86bd1bb6ef882857b90578fbece9a27',
        privateShareProof:
          '-----BEGIN PGP PUBLIC KEY BLOCK-----\n\nxk8EY+UKExMFK4EEAAoCAwQ9vUvsCBCBuun8gqXJAhNrU26z1gku5PAQ4/78\n6kL3HkA1DohtdfgXn2jYRSwD+fC+JAJF2zLSsyQwJQCcNtH8zVVhZDRhOGQy\nYzgxZDE3NWYxYzkzYjFiM2IgPHVzZXItYWQ0YThkMmM4MWQxNzVmMWM5M2Ix\nYjNiQGFkNGE4ZDJjODFkMTc1ZjFjOTNiMWIzYi5jb20+wowEEBMIAB0FAmPl\nChMECwkHCAMVCAoEFgACAQIZAQIbAwIeAQAhCRDWTboBXi20+hYhBIVgZ9EL\nsBZF7o2M3tZNugFeLbT6IxIA/j6PAqfcf9Xs4ZLeETDgu688JEeSVCw4sONJ\nEP/Dhnm9AP0bdwXjz3tWraBNEvC3FreVtktiWR4/+C5choX5C7Dslc5TBGPl\nChMSBSuBBAAKAgMEzUv73JUaXgCM2G1acO2x2mDEuA4Kt5ah9NtLXjISK1lg\ncwcj6Ad2+5mUQJY0GBhe5/Lle0whJ2uRLdNfuExJpQMBCAfCeAQYEwgACQUC\nY+UKEwIbDAAhCRDWTboBXi20+hYhBIVgZ9ELsBZF7o2M3tZNugFeLbT6TnUB\nALEvSU4fh8heE4oWL1/KtSYp+W+Q/mig4bz/gkg7d6lgAQCBJHbtrE4612Rl\nhK50Mi3t68aaFyRr0VslAdNc8p5sTs5PBGPlChQTBSuBBAAKAgMEHF5WRJ7/\n3BYeTCWBfl5YGExnuyG6Pzbpf1amQbPWyEP6WYBaBEntZmSl2PJfLqnlKX8D\n5pIpOrTu1Yu5VHHJO8J4BBgTCAAJBQJj5QoUAhsgACEJENZNugFeLbT6FiEE\nhWBn0QuwFkXujYze1k26AV4ttPpO0gEAwb+A+cRqqefbOcUDk5+2bSHCpMnx\nQqCgAhPEVRjmtzIA/RdgsVaNsdaub4Q0E22oMLpuy9Gd3f1ldwuU2ounxUP0\n=gBiu\n-----END PGP PUBLIC KEY BLOCK-----\n',
      },
      {
        from: 'backup',
        to: 'bitgo',
        publicShare:
          '033e6dbe251b633e05e9001cf6e036067cad188a9604571ba5af6edc5d4372e2c81b75f47548480e9ed2f1fb6d21ac7833ad1ac5905c3016d5bfd697fdb9d11ce1',
        privateShare:
          '-----BEGIN PGP MESSAGE-----\n\nwX4DUQ8XhGVGcTISAgMEzIylhWZ4TcCYriu3I1PbVB/IobzOtG1wcf1sguDK\nKv/MmHuMigg0ByN9s2YoWtQ3CuSZTENHDdh90gtl+NTVJzCPrPhsb5wqP5QR\nX90t72duJd7c8SwPzWFjnvg5Zz4aEHSrI9k4QoV0xr/hLqvBrIjSoAEqZRkM\n3zCjOWKzVBHX1fNlV4yHZ0F4yu22VAdKNBI57hsJArBVft79VsVYuwxWaSFU\n0X9zDUAp5c4aoT9S+wqHu8S5IQc/QKqlZTzOqwXfX/2nJ5fap3zkbSwizNem\nQRREG6044DydeJUvAfEnR7dBq9xbViOEu/SHse9CoXVNcgMT82e8cbLv3/hS\n7xq8SbmnOZVarZiTDUwS2QiDz0k=\n=LUUM\n-----END PGP MESSAGE-----\n',
        n: '',
        vssProof:
          '02fedf3cf6215bea893753bcacda3c3cbf305bad98c8d440199e6f7a467ef6f014',
        privateShareProof:
          '-----BEGIN PGP PUBLIC KEY BLOCK-----\n\nxk8EY+FTlBMFK4EEAAoCAwTbxTk4EmUKQE3y/mkZnDitLhh8tiWCp0GwdyMi\nh1VTQUp2W+H4JKheLOw2/tFIwF5/2CVQBOLTLTkQl/BnMylqzV5iYWNrdXAt\nNDUxYzZlMDY2OWQyZDM5YTQzZTE3M2UxIDxiYWNrdXAtNDUxYzZlMDY2OWQy\nZDM5YTQzZTE3M2UxQDQ1MWM2ZTA2NjlkMmQzOWE0M2UxNzNlMS5jb20+wowE\nEBMIAB0FAmPhU5QECwkHCAMVCAoEFgACAQIZAQIbAwIeAQAhCRDOw1Jx/O+o\niBYhBLMXk+RFg569EB/iWs7DUnH876iIEWQBAIFNrXGse2ZqAv6y28b6Gp2g\nuXI3ElSDYFGgkmfsVvPxAQDNXHKKxN7xQ/vEc68qHz2TZcUklMvJAGzW1U6b\nG+cj4s5TBGPhU5QSBSuBBAAKAgMEOaf88sNeNa/zHccIWicSKmthO1dSsSPd\nRusxb6gROpSsHILlRLfro8R5IRxnax0ZT7Rkes0u467dBR4T2yRxhgMBCAfC\neAQYEwgACQUCY+FTlAIbDAAhCRDOw1Jx/O+oiBYhBLMXk+RFg569EB/iWs7D\nUnH876iI3EQA/RyvYaos0O/ns5MNrzYACVedCXnF+TuFD2yArDRTqufhAP9v\nQiL/nXQahqLNK1TENGJH2f3iz03/mw8pdiSDnWPF5s5PBGPhU5QTBSuBBAAK\nAgMEQDObru0Y5Wcvwnl0yZoMfS+ATUZnTS+sMRUIypJp6ox0SUBJj2pmVRdM\ngStpu7uUUmr/oflBZAvZmSS+7a+/osJ4BBgTCAAJBQJj4VOUAhsgACEJEM7D\nUnH876iIFiEEsxeT5EWDnr0QH+JazsNScfzvqIgkhgD7BoUrUv04vXczfLfx\nst11whqqJvdGdRMAZ0V56JIoZgkA+gPuycxIGAI2kGZ4zeAZIy/1hCmkgq2/\nlMsqPfK/Y1Ea\n=UTSW\n-----END PGP PUBLIC KEY BLOCK-----\n',
      },
      {
        from: 'bitgo',
        to: 'user',
        publicShare:
          '02a34344aea7a9d0495229a2da44f6bca37cb6433e16ed77e3c251b22188bd3a908448bf66517a9614f23f03ff3b39b8d0e5bba8d2539150e88e115035cfe8fa03',
        privateShare:
          '-----BEGIN PGP MESSAGE-----\n\nwX4D0mT7O+BWppUSAgMEvZWEGAXanyMGaAzYq+nDPSkCT2reOftvBcXbQPw2\nPta4f16CPrN3hLJBoGiwBjB0sOMzdh/WQua4YG3ZY4UT9zDHV4IiMq5Hr5RG\nxk0/gU15hAnFo85BbrY2jWfndR9h79Cv7hAQisR4IUdwhVfW+nTSsQF7XDP8\nJCLn7NzILcPs/DL3ALNrRA0XcOqBj+59GP84ttHB+s6xtfgDe0DAia1thAnD\nluuK2klHRKHbZMHJrNuXd1B/lWmDFKXEnd+DKNuj8nzOMwHFbTOI27SJIjw7\nd41cva4XGKL7K3jbCQ81n77wpeTV0zWIxRrPauyv/0/AVGfgIVK/aALC0omr\nrTgoI8cY/lobt+tnNMAt/UVL58IvHZcGyPG0GfRHtKPX4mCjWw==\n=GMQK\n-----END PGP MESSAGE-----\n',
        vssProof:
          '036ec5665573a78dcc66fcbfd799f0042a969dc261440b6a6a830f323651ba1167',
      },
      {
        from: 'bitgo',
        to: 'backup',
        publicShare:
          '02a34344aea7a9d0495229a2da44f6bca37cb6433e16ed77e3c251b22188bd3a908448bf66517a9614f23f03ff3b39b8d0e5bba8d2539150e88e115035cfe8fa03',
        privateShare:
          '-----BEGIN PGP MESSAGE-----\n\nwX4De8EvgCqn1UESAgMEb6J+DsgrD6P/Z7ZYj3VcKYj6UVzCejjr/rdPbz1L\n50T2MNxK//FRH9bO4d77pZjOzy4Wl8BEp6fcjAV+WcAcUDC8HujPSvX5a8WN\nXKBk9Zkd7YEF2beBIfkB6CmV7ruqnJBsJOuBfltNWMbmrYTt97rSsQGAw9vR\nBaryffAxGbLveknGu69q7T9nB4DpDS3ECZCExm7EuiAdYWKvlYvmoJBUKYAF\neHUUxpwr3jf0D+vyO3GBNN5hL/HuGJtJKZlxEocQwSJyYlUrKcxBDHsEKOmV\netvbPeTfBDdmyUWUWCjDnSyPEs1PHWo6cmrYEUp6u721H5WtdH2GDP6a0T7O\nV/K31GRa7nnAqM97ClbYT/VD25vou6Hu0mkzML6aSjSZBPwnpw==\n=MPp0\n-----END PGP MESSAGE-----\n',
        vssProof:
          '036ec5665573a78dcc66fcbfd799f0042a969dc261440b6a6a830f323651ba1167',
      },
    ],
    walletHSMGPGPublicKeySigs:
      '-----BEGIN PGP PUBLIC KEY BLOCK-----\n\nxk8EY+UKExMFK4EEAAoCAwQ9vUvsCBCBuun8gqXJAhNrU26z1gku5PAQ4/78\n6kL3HkA1DohtdfgXn2jYRSwD+fC+JAJF2zLSsyQwJQCcNtH8zVVhZDRhOGQy\nYzgxZDE3NWYxYzkzYjFiM2IgPHVzZXItYWQ0YThkMmM4MWQxNzVmMWM5M2Ix\nYjNiQGFkNGE4ZDJjODFkMTc1ZjFjOTNiMWIzYi5jb20+wowEEBMIAB0FAmPl\nChMECwkHCAMVCAoEFgACAQIZAQIbAwIeAQAhCRDWTboBXi20+hYhBIVgZ9EL\nsBZF7o2M3tZNugFeLbT6IxIA/j6PAqfcf9Xs4ZLeETDgu688JEeSVCw4sONJ\nEP/Dhnm9AP0bdwXjz3tWraBNEvC3FreVtktiWR4/+C5choX5C7DslcLCDgQT\nEwgCgAUCY+UKFAILCQkQiTUbCAxrp3uZFIAAAAAADgCCY29tbW9uS2V5Y2hh\naW4wMjExNTA1NTAyNjE0NjNkNzUzZTk2NjQ3YmQ1ZGViYjA1ZDllZjMyNWY0\nMzY4Y2MxNjBiZjAzMzY1ZTRkYWRjNzU2NDE2ZjEyMzBjY2M0YTFmMjRlYjQ5\nMjQzOTViY2VkMjI0MDBmNjNkNDgzN2Q1MTFhMjhkYTAxNTcyOGNhMDQ5PRSA\nAAAAAAwAKHVzZXJHcGdLZXlJZDg1NjA2N2QxMGJiMDE2NDVlZThkOGNkZWQ2\nNGRiYTAxNWUyZGI0ZmE/FIAAAAAADgAoYmFja3VwR3BnS2V5SWRiMzE3OTNl\nNDQ1ODM5ZWJkMTAxZmUyNWFjZWMzNTI3MWZjZWZhODg4lxSAAAAAAAwAgnVz\nZXJTaGFyZVB1YjAzNDA0MDc1ZTgwOTRiNTNkY2RlZTY0YjYzMzkxODNkZWZl\nNjEyNzFiYTdkYjMwODA2MGJjZDY3Y2FkNjBjMDU3MDg0NDhiZjY2NTE3YTk2\nMTRmMjNmMDNmZjNiMzliOGQwZTViYmE4ZDI1MzkxNTBlODhlMTE1MDM1Y2Zl\nOGZhMDOZFIAAAAAADgCCYmFja3VwU2hhcmVQdWIwM2JlOWJjZmM4MWM4N2U3\nMjcxNTQ1ZDU5YTIyZjkxZjc1YjllNDZlZTQyOGNiMzBmMmUyZjAwM2Y3NDI0\nZmFmNGQ4NDQ4YmY2NjUxN2E5NjE0ZjIzZjAzZmYzYjM5YjhkMGU1YmJhOGQy\nNTM5MTUwZTg4ZTExNTAzNWNmZThmYTAzAhUIAhYAAhsDAh4BFiEEdEvkP/yd\nEzeilCdeiTUbCAxrp3sAAFLEAP94p1/J/V2W+zrWSF9YUVRSj1/rs/ws5INi\nkc9P9HTaYwD/Y+6Wol1EnO6uxkbPjY2Xvymsce8fu839FVVIpkazj43OUwRj\n5QoTEgUrgQQACgIDBM1L+9yVGl4AjNhtWnDtsdpgxLgOCreWofTbS14yEitZ\nYHMHI+gHdvuZlECWNBgYXufy5XtMISdrkS3TX7hMSaUDAQgHwngEGBMIAAkF\nAmPlChMCGwwAIQkQ1k26AV4ttPoWIQSFYGfRC7AWRe6NjN7WTboBXi20+k51\nAQCxL0lOH4fIXhOKFi9fyrUmKflvkP5ooOG8/4JIO3epYAEAgSR27axOOtdk\nZYSudDIt7evGmhcka9FbJQHTXPKebE7GTwRj4VOUEwUrgQQACgIDBNvFOTgS\nZQpATfL+aRmcOK0uGHy2JYKnQbB3IyKHVVNBSnZb4fgkqF4s7Db+0UjAXn/Y\nJVAE4tMtORCX8GczKWrNXmJhY2t1cC00NTFjNmUwNjY5ZDJkMzlhNDNlMTcz\nZTEgPGJhY2t1cC00NTFjNmUwNjY5ZDJkMzlhNDNlMTczZTFANDUxYzZlMDY2\nOWQyZDM5YTQzZTE3M2UxLmNvbT7CjAQQEwgAHQUCY+FTlAQLCQcIAxUICgQW\nAAIBAhkBAhsDAh4BACEJEM7DUnH876iIFiEEsxeT5EWDnr0QH+JazsNScfzv\nqIgRZAEAgU2tcax7ZmoC/rLbxvoanaC5cjcSVINgUaCSZ+xW8/EBAM1ccorE\n3vFD+8RzryofPZNlxSSUy8kAbNbVTpsb5yPiwsIOBBMTCAKABQJj5QoUAgsJ\nCRCJNRsIDGune5kUgAAAAAAOAIJjb21tb25LZXljaGFpbjAyMTE1MDU1MDI2\nMTQ2M2Q3NTNlOTY2NDdiZDVkZWJiMDVkOWVmMzI1ZjQzNjhjYzE2MGJmMDMz\nNjVlNGRhZGM3NTY0MTZmMTIzMGNjYzRhMWYyNGViNDkyNDM5NWJjZWQyMjQw\nMGY2M2Q0ODM3ZDUxMWEyOGRhMDE1NzI4Y2EwNDk9FIAAAAAADAAodXNlckdw\nZ0tleUlkODU2MDY3ZDEwYmIwMTY0NWVlOGQ4Y2RlZDY0ZGJhMDE1ZTJkYjRm\nYT8UgAAAAAAOAChiYWNrdXBHcGdLZXlJZGIzMTc5M2U0NDU4MzllYmQxMDFm\nZTI1YWNlYzM1MjcxZmNlZmE4ODiXFIAAAAAADACCdXNlclNoYXJlUHViMDM0\nMDQwNzVlODA5NGI1M2RjZGVlNjRiNjMzOTE4M2RlZmU2MTI3MWJhN2RiMzA4\nMDYwYmNkNjdjYWQ2MGMwNTcwODQ0OGJmNjY1MTdhOTYxNGYyM2YwM2ZmM2Iz\nOWI4ZDBlNWJiYThkMjUzOTE1MGU4OGUxMTUwMzVjZmU4ZmEwM5kUgAAAAAAO\nAIJiYWNrdXBTaGFyZVB1YjAzYmU5YmNmYzgxYzg3ZTcyNzE1NDVkNTlhMjJm\nOTFmNzViOWU0NmVlNDI4Y2IzMGYyZTJmMDAzZjc0MjRmYWY0ZDg0NDhiZjY2\nNTE3YTk2MTRmMjNmMDNmZjNiMzliOGQwZTViYmE4ZDI1MzkxNTBlODhlMTE1\nMDM1Y2ZlOGZhMDMCFQgCFgACGwMCHgEWIQR0S+Q//J0TN6KUJ16JNRsIDGun\newAAk28A/1RACJeOcE/ykoN1XxlqK4qmhi8aRtV6+/oDzQFREbQJAP994zW7\nf2inqDPG6FEoo4v8khGqTdH+pePAKTji5LZHi85TBGPhU5QSBSuBBAAKAgME\nOaf88sNeNa/zHccIWicSKmthO1dSsSPdRusxb6gROpSsHILlRLfro8R5IRxn\nax0ZT7Rkes0u467dBR4T2yRxhgMBCAfCeAQYEwgACQUCY+FTlAIbDAAhCRDO\nw1Jx/O+oiBYhBLMXk+RFg569EB/iWs7DUnH876iI3EQA/RyvYaos0O/ns5MN\nrzYACVedCXnF+TuFD2yArDRTqufhAP9vQiL/nXQahqLNK1TENGJH2f3iz03/\nmw8pdiSDnWPF5g==\n=9PO1\n-----END PGP PUBLIC KEY BLOCK-----\n',
  };

  await generateKeycard({
    activationCode: '123456',
    backupKeychain,
    backupKeyProvider: 'BitGo Trust',
    bitgoKeychain,
    coin: coins.get('tpolygon'),
    keyCardImage: await downloadKeycardImage('polygon'),
    passcodeEncryptionCode: '654321',
    passphrase: 'test_wallet_passphrase',
    userKeychain,
    walletLabel: 'SMHA Polygon Wallet',
  });
}

export async function downloadKeycardForSelfManagedColdEddsaKey() {
  const bitgoKeychain: Keychain = {
    id: '63e50a158312c00007bd35c89cc5fb1a',
    type: 'tss',
    commonKeychain:
      '021150550261463d753e96647bd5debb05d9ef325f4368cc160bf03365e4dadc756416f1230ccc4a1f24eb4924395bced22400f63d4837d511a28da015728ca049',
  };

  await generateKeycard({
    bitgoKeychain,
    curve: KeyCurve.Ed25519,
    walletLabel: 'My EdDSA Key',
    keyCardImage: await downloadKeycardImage('bitgo'),
  });
}

export async function downloadKeycardForSelfManagedColdEddsaKeyWithDerivedKeys() {
  const backupKeychain: Keychain = {
    id: '63e50a158312c00007bd35c89cc5fb1a',
    type: 'tss',
    commonKeychain:
      '021150550261463d753e96647bd5debb05d9ef325f4368cc160bf03365e4dadc756416f1230ccc4a1f24eb4924395bced22400f63d4837d511a28da015728ca049',
  };

  const userKeychain: Keychain = {
    id: '63e50a158312c00007bd35c89cc5fb1a',
    type: 'tss',
    commonKeychain:
      '021150550261463d753e96647bd5debb05d9ef325f4368cc160bf03365e4dadc756416f1230ccc4a1f24eb4924395bced22400f63d4837d511a28da015728ca049',
  };

  const bitgoKeychain: Keychain = {
    id: '63e50a158312c00007bd35c89cc5fb1a',
    type: 'tss',
    commonKeychain:
      '021150550261463d753e96647bd5debb05d9ef325f4368cc160bf03365e4dadc756416f1230ccc4a1f24eb4924395bced22400f63d4837d511a28da015728ca049',
  };

  await generateKeycard({
    backupKeychain,
    userKeychain,
    bitgoKeychain,
    backupMasterPublicKey:
      'a9d32af48f14cd390c1fed68e46cd477a131f510ab32347433f6f7d22183129f6f47eb7b17e18546b19c482ee1543c2cd08916105e3c982f654398a844c562a5',
    backupMasterKey: '1',
    userMasterPublicKey:
      'a9d32af48f14cd390c1fed68e46cd477a131f510ab32347433f6f7d22183129f6f47eb7b17e18546b19c482ee1543c2cd08916105e3c982f654398a844c562a5',
    userMasterKey: '1',
    coin: coins.get('tsol'),
    walletLabel: 'My TSOL Key',
    keyCardImage: await downloadKeycardImage('bitgo'),
  });
}
