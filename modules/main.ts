process.env.BITGO_CUSTOM_ROOT_URI = 'http://localhost:3000';
import { BitGoAPI } from './sdk-api/src/bitgoAPI';
import { Tada } from './sdk-coin-ada/src/index';
import { Sol, KeyPair } from './sdk-coin-sol/src/index';
import crypto from 'crypto';
import { getKeyShares } from './util';
import { decode, encode } from "cbor-x";

const bitgo = new BitGoAPI({
    // env: 'local',
    env: 'staging',
    authVersion: 2,
});
  
bitgo.register('tada', Tada.createInstance);
bitgo.register('tsol', Sol.createInstance);

const WALLET_ID = generatePublicId('690062242cb7cc1327a4450a');

const ENTERPRISE_ID = '5bd795f1bf7435a503a0a647ec5d3b3d';
function generatePublicId(id: string) {
    return id + crypto.createHmac('md5', '3QUhRk6U5FYjGHFweyKp9KvNjEqpJvyc').update(id).digest('hex').substring(0, 8);
}
const walletKyes = [
  '69005b1d1f181a5d129885bf977ac987',
  '69005b1e1f181a5d129885d0b24aa05b',
  generatePublicId('69005b66f12955a1908b44d0')
]
const encryptionPassword = 'Ghghjkg!455544llll';

const rootAddress = '6N176KthWkMK9QBzsRDYXrF5nK7dr8YQfqsxvmGST8Vu';
const keys = {
  user: {
    id: '69005b1d1f181a5d129885bf977ac987',
    source: 'user',
    type: 'tss',
    commonKeychain: '4060f0349be16939a7dfccd8140aca525c148036d04cc4710322b85c6ddd7b61224724323326f8674b48cd8ac516459456804ea835ec8058fda7291ff75cbaec',
    encryptedPrv: '{"iv":"boSbPMuIEkfmkbYtrypZKg==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"S6wpQ4sGyS4=","ct":"805IMV4wr9LmUyhwhoADJaukD1ug/Fv4fkxcQa2eYire/KEtEVjqhVIMMMS0b1QpqnRxKWiq2VVqNPuiAOtMIDEe03BDwvraF19E+uqOnih67bzCLPFCgBBGNgVDwIaejLFqPFyMqTlQqFQOitmk1/pYvco/HbVHhfqxByWcy4CyqjCuZkiByLUkA3VUSOgbqcIn3cA/sRfGtxy/8ugIV/IWeia/GoZC7om+HoFg+hHY3YvrpduymLWho2Zba+rUfXvWYz5h6DfV2IQfASOHvrYnI8vV+ur5WF0eifrGGQ82vKnCsBG18eHWk9QrYS1aWg5zU4j0awuBzk/NMd2EKFXj5rp7ENQ0LlQ5zp2MGId+6d2o4guE8Hnmhw4eThWAWUaUA6wO6xs04RAilnF7pUcabPIaceaxYAXHhoFjX9coklim1QhQT+xlUhySmFvIaeDlZVHmq0q9bto+JuJELPm9vgGSj7F2996ggnpiXiTDXHVU2ZxMTcd4ZkAgEccPUOochRji/HULY/PmdySfOvZuBQqe3tz1M5VkX7HjRER0Jj7WhxRTogRg5L8xfppCSOuX1JN26noNcmcqqo5aKepZ9Pbqbw2tFg1UTyEM5ve56HLZxa5lcmPkB+Ey6/KH7kJwgkCLfCl39adsCLrt3rALfQzcGlHx1Tc90rA8fwCUIQtSD9x5GPRy8bn76Ks7PwVMX8k4XCZBiZLpi2xYKQQ5mI0jVyAOhrod4Z3TeDKaO5goy1Fpgw=="}'
  },
  backup: {
    id: '69005b1e1f181a5d129885d0b24aa05b',
    source: 'backup',
    type: 'tss',
    commonKeychain: '4060f0349be16939a7dfccd8140aca525c148036d04cc4710322b85c6ddd7b61224724323326f8674b48cd8ac516459456804ea835ec8058fda7291ff75cbaec',
    encryptedPrv: '{"iv":"vUgaQUC6fD+hKMKMLVh/dA==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"9k35+UPboIM=","ct":"Ja5dx2BplHoztYV04lFR3aPThrDuP3ZAshHSN7sucjBCyHw6ABnX81kPOV4EvQZaQuZaZzQvuLT3k+rmru/gMKlqy1GiYGhsz0lBhhhgRK5NIF0oqRtJq9cvv3A/FOBRDbm0k39ZRvnkm32EmQeDZVbJW/0zs9H0WJHRElart488Y7NSjt048VOlWmM0p+ZhjxbQUJAVa2nSUzVyf6rHOty6cstk/dTmDpNTCcOPqqixl0Q6b54408NnpNlcBcm8aOiPbiGhmbliC/PRyajyHO3H6YqKYWb6gd2HjspNlZUlSylXiFTpGemleeF1YzrWNVbpBYIDR9As3YBVAJHimdL5sLtsZhQFci2/EFmqZxWTTt+j9hsPrWXBv+0d+RMZRjKqi87sBRzgmnZVIjMhVmBAe1qtgtIsmFrxm1eIuRu6+FPp6K37Q4qGx1/WchQuy03HLa0jExb1g1fokhsQ/aVjU7piBgQxwv2t4LTAPWJf3N2lWGwqFJHAfLLd4rk255N9pz/6GxlzRK2AthhkSE7f5uDcf2R6ELFu2gPmMV4Zeoo0cgTB3ghLUojFwoySeO98Ox4eWLagi2d3fyS4QFZyD2rNR8HMmdoVehRPEfFNvTwO4KaWjplLt1nt2POzF2Yf6Ji/impzcBh0LTlfpbBs7DU06kngUVSQHqP/zARWwjisyn2oYNY+ciJ+zhFWaCfsIke2PCJZm5cjqkUPjfoFdtiEHpL+25uSMpYCLQDZUomZrbu41Q=="}'
  },
  bitgo: {
    "id": generatePublicId('69005b66f12955a1908b44d0'),
    "source": "bitgo",
    "encryptedPrv": "{\"iv\":\"XHzyKtUTRdrRBcW5OB/lKQ==\",\"v\":1,\"iter\":10000,\"ks\":256,\"ts\":64,\"mode\":\"ccm\",\"adata\":\"\",\"cipher\":\"aes\",\"salt\":\"CmnArSFVdH8=\",\"ct\":\"pCxY+eGJUpdINe5Vy85UQhLXltjDddvbOeRKOaMZn5skCwcW8PGzRVCchwnOKJSe8JPa3r8CsqPae2soYWPBZqtChJgiSTOHgPt+krsBFdkLP4coEcu8RmOm9JRDedsTsTKuR61m79yl+M6fDcbaL6ZsENeYTgJmYHlN3+azJ+OBNm4tT/tuXEWbZiWI67Mw4atLaetc6KngzzYZZbnc8/HeVRs1YsmICxw6/y8GEl0J4mgJJoUd6TNZodU3bwPq9yUR9bbRdhpgzp5p4I8A3TlA6gIyvQKSpNIQX5PvolPMz1Xehw8nVE36TrG8VaLrA7NqejZPKtRtGT3+epKl+5s0bmNcD8uHKMllGvYKPlDsWtnjzaHS/3louvDCKJP5dmtSyYhS9p9zU+RcISXoYTJV9r/SqiGFtAxmn4pJTojOICd5FPmp+y7ZyQZCngagvI8OAcAIA9QDLJqd9/8D8EAcOokH/SA27119w4ltNjCYi8a4yYlqz/UI4QkR9WH/xdtlmBqgFmLkiMO+Bn95q+GYteDMdUJRpvibDUby8B1tbHDheLKMTRlNX71yLwMhmy54zGxWMwKBFtZf0z2SJY3hjhhM5vFsPMtHijpxhWyVtg2rjXjcYOXhsxzzs7tJT+mn8ZbQuAsR9k03n1wDa0YUhtlOBISEutZszxFs9pfJ827xTVVRXQjkDJKHhBbpv4I+JdcRHaqb3asBdbrQkcq0jIdnsdIk5ttdY9GRlUWZ/3DpZaxApkdlbwE=\"}",
    "commonKeychain": "4060f0349be16939a7dfccd8140aca525c148036d04cc4710322b85c6ddd7b61224724323326f8674b48cd8ac516459456804ea835ec8058fda7291ff75cbaec",
    "keyType": "tss"
  }
}

async function createWallet() {
  console.log({msg: 'Calling create wallet'});
  const material = decode(Buffer.from(bitgo.decrypt({input: keys.bitgo.encryptedPrv, password: encryptionPassword}), 'base64'));
  const keyshare = { threshold: material.threshold,
    total_parties: material.total_parties,
    party_id: material.party_id,
    d_i: Buffer.from(material.d_i).toString('hex'),
    public_key: Buffer.from(material.public_key).toString('hex'),
    key_id: Buffer.from(material.key_id).toString('hex'),
    root_chain_code: Buffer.from(material.root_chain_code).toString('hex'),
    final_session_id: Buffer.from(material.final_session_id).toString('hex'),
  }
  // const rootAddress = public
  console.log({keyshare});
  // const keyPair = new KeyPair({ pub: keyshare.public_key });
  // const rootAddress = keyPair.getAddress();
  // const { wallet } = await bitgo.coin('tsol').wallets().add({
  //   label: 'test-wallet2',
  //   m: 2,
  //   n: 3,
  //   keys: walletKyes,
  //   type: 'hot',
  //   walletVersion: 5,
  //   multisigType: 'tss',
  //   enterprise: ENTERPRISE_ID,
  //   coinSpecific: {
  //       rootAddress: rootAddress,
  //   }
  // });

  // console.log({wallet, walletId: wallet._wallet});
}

// async function addKeyShares() {
//   const coin = bitgo.coin('tsol');
//   const {readable, shares} = getKeyShares();
//   const userPrvMaterial = Buffer.from(shares[0].toBytes());
//   const backupPrvMaterial = Buffer.from(shares[1].toBytes());
//   const bitgoPrvMaterial = Buffer.from(shares[2].toBytes());
//   const user = await coin.keychains().add({
//     source: 'user',
//     keyType: 'tss' ,
//     commonKeychain: readable[0].public_key + readable[0].root_chain_code,
//     encryptedPrv: bitgo.encrypt({input: userPrvMaterial.toString('base64'), password: encryptionPassword}),
//     originalPasscodeEncryptionCode: '000000',
//     isMPCv2: true,
//   });
//   const backup = await coin.keychains().add({
//     source: 'backup',
//     keyType: 'tss' ,
//     commonKeychain: readable[1].public_key + readable[1].root_chain_code,
//     encryptedPrv: bitgo.encrypt({input: backupPrvMaterial.toString('base64'), password: encryptionPassword}),
//     originalPasscodeEncryptionCode: '000000',
//     isMPCv2: true,
//   });

//   // const user2 = await coin.keychains().add({
//   //   source: 'bitgo',
//   //   keyType: 'tss' ,
//   //   commonKeychain: readable[2].public_key + readable[2].root_chain_code,
//   //     encryptedPrv: bitgo.encrypt({input: bitgoPrvMaterial.toString('base64'), password: encryptionPassword}),
//   //   originalPasscodeEncryptionCode: '000000',
//   //   isMPCv2: false,
//   // });
//   console.log({user, backup, bitgo: bitgo.encrypt({input: bitgoPrvMaterial.toString('base64'), password: encryptionPassword})});
// }
async function createAddress() {
  const coin = bitgo.coin('tsol');
  const wallet = await coin.wallets().get({id: WALLET_ID});
  const address = await wallet.createAddress({
    // chain: 0,
  });
  console.log(address);
}
async function main(){
    // await addKeyShares();
    // await createWallet();
    // await createAddress();
    // return;

    const coin = bitgo.coin('tsol');

    // const walletId = generatePublicId(WALLET_ID)
    const wallet = await coin.wallets().get({id: WALLET_ID});

    // const prebuiltTransaction = await wallet.prebuildTransaction({
    //     recipients: [{address: 'CcHKcwod5NVCQQLJpvtny5ccuS9iNZSmRrguV9Ve9mXc', amount: '100'}],
    //     type: 'transfer',
    // });
    // console.log(prebuiltTransaction);
    await bitgo.unlock({ otp: '000000', duration: 3600 });

    const signedTransaction = await wallet.prebuildAndSignTransaction({
      apiVersion: 'full',
      coin: 'tsol',
      recipients: [{address: "2mq9koFjHxjrYVqtTsj22RkKym75nZG5FtDZUmWX1esD", amount: '1'}],
      type: 'transfer',
      walletPassphrase: encryptionPassword,
      isTss: true,
      walletType: 'hot',
    });
    // await wallet.signTransaction({
    //   txPrebuild: {
    //     txRequestId: 'f539b0ef-94bf-4a81-b91b-1eeab43095e4'
    //   },
    //   walletPassphrase: encryptionPassword,
    //   apiVersion: 'full'
    // })
    // console.log(signedTransaction);
}


// bitgo.authenticate({
//   username: 'experience+test-admin+do-not-delete@bitgo.com',
//   password: 'Ghghjkg!455544llll',
//   otp: '000000',
// }).then((res) => {
//   console.log({msg: 'Auth Completed', token: (bitgo as any)._token});
// }).catch((e) => {
//   console.log({e});
// });

(bitgo as any)._token = 'v2x8f8a3e19c6da7e8249e296ce9fde7da60d782d7c53bca93c24cf28448380510d';
main().catch((e) => console.log(e));