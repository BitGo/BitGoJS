import { Stacks } from '../../../src/';
import { KeyPair } from '../../../src/coin/stacks/keyPair';

/*
 * keys and addresses are from:
 *
 * import * as st from '@stacks/transactions';
 *
 * const secretKey1 = st.privateKeyToString(st.makeRandomPrivKey());
 * const publicKey1 = st.publicKeyToString(st.pubKeyfromPrivKey(secretKey1.data);
 * const address1 = st.getAddressFromPrivateKey(secretKey1);
 * etc.
 */

export const secretKey1 = '66c88648116b721bb2f394e0007f9d348ea08017b6e604de51a3a7d957d58524';
export const pubKey1 =
  '04a68c2d6fdb3706b39f32d6f4225275ce062561908fd7ca540a44c92eb8594ea6db9fcfe0b390c0ead3f45c36afd682eab62eb124a63b460945fe1f7c7f8a09e2';
export const address1 = 'SP10FDHQQ4F2F0KHMN6Z24RMAMGX5933SQJCWKAAR';

export const secretKey2 = '35794adf0dd2a313c18bc118b422740bb94f85114134be34703ff706658087e4';
export const pubKey2 =
  '0421d6f42c99f7d23ec2c0dc21208a9c5edfce4e5bc7b63972e68e86e3cea6f41a94a9a7c24a1ccd83792173f475fdb590cc82f94ff615df39142766e759ce6387';
export const pubKey2Compressed = '0321d6f42c99f7d23ec2c0dc21208a9c5edfce4e5bc7b63972e68e86e3cea6f41a';
export const address2 = 'SPS4HSXAD1WSD3943WZ52MPSY9WPK56SDG54HTAR';

export const ACCOUNT_1 = {
  prv: secretKey1,
  pub: pubKey1,
  address: address1
}

export const ACCOUNT_2 = {
  prv: secretKey2,
  pub: pubKey2,
  address: address2
}

export const SENDER_1 = {
  prv: "edf9aee84d9b7abc145504dde6726c64f369d37ee34ded868fabd876c26570bc01"
}

export const RECIPIENT_1 = {
  address: "SP3FGQ8Z7JY9BWYZ5WM53E0M9NK7WHJF0691NZ159"
}

export const defaultKeyPairFromPrv = new Stacks.KeyPair({
  prv: secretKey1,
});

export const defaultKeyPairFromPub = new Stacks.KeyPair({
  pub: pubKey2,
});

// seed is Buffer.alloc(64) -- all zero bytes
export const defaultSeedAddress = 'SP21X8PMH8T4MVX8Z75JZPYEVA6Q8FDR7PJ13MV4Q';
export const defaultSeedSecretKey = 'eafd15702fca3f80beb565e66f19e20bbad0a34b46bb12075cbf1c5d94bb27d2';
export const defaultSeedPubKey = '03669261fe20452fe6a03e625944c6a0523e6350b3ea8cbd37c9ca1ff97e3ac8bf';

export const INVALID_KEYPAIR_PRV = new KeyPair({
  prv: '8CAA00AE63638B0542A304823D66D96FF317A576F692663DB2F85E60FAB2590C',
});

export const TX_SENDER = {
  prv: 'cb3df38053d132895220b9ce471f6b676db5b9bf0b4adefb55f2118ece2478df01',
  pub: '03797dd653040d344fd048c1ad05d4cbcb2178b30c6a0c4276994795f3e833da41',
  address: 'STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6'
}

export const TX_RECIEVER = {
  address: 'STDE7Y8HV3RX8VBM2TZVWJTS7ZA1XB0SSC3NEVH0'
}

export const RAW_TX_UNSIGNED =
  '0x80800000000400164247d6f2b425ac5771423ae6c80c754f7172b0000000000000000000000000000000b400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000003020000000000051a1ae3f911d8f1d46d7416bfbe4b593fd41eac19cb00000000000003e800000000000000000000000000000000000000000000000000000000000000000000'

export const SIGNED_TRANSACTION =
  '0x80800000000400164247d6f2b425ac5771423ae6c80c754f7172b0000000000000000000000000000000b400011ae06c14c967f999184ea8a7913125f09ab64004446fca89940f092509124b9e773aef483e925476c78ec58166dcecab3875b8fab8e9aa4213179d164463962803020000000000051a1ae3f911d8f1d46d7416bfbe4b593fd41eac19cb00000000000003e800000000000000000000000000000000000000000000000000000000000000000000';
