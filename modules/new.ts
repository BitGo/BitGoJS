// process.env.BITGO_CUSTOM_ROOT_URI = 'http://localhost:3000';

import { BitGoAPI } from './sdk-api/src/bitgoAPI';
import { Tada } from './sdk-coin-ada/src/index';
import { Sol, KeyPair } from './sdk-coin-sol/src/index';
import crypto from 'crypto';
import { getKeyShares } from './util';
import { decode, encode } from "cbor-x";


const ENTERPRISE_ID = '5bd795f1bf7435a503a0a647ec5d3b3d';

function generatePublicId(id: string) {
    return id + crypto.createHmac('md5', '3QUhRk6U5FYjGHFweyKp9KvNjEqpJvyc').update(id).digest('hex').substring(0, 8);
}

const keys = {
    user: {
        id: '6909cd10e6c1605418c28675d4e0305b',
        source: 'user',
        type: 'tss',
        commonKeychain: 'd598b547cf5d71b69eb438e8f5e6624863b62e0343db7499bde24d1909e3281b3659824f86ec5f5f302ea39daf836419d5d75a5b6abb10563f0151c9069496f3',
        encryptedPrv: '{"iv":"ND+lWWB3+AfrBJNFzwxxUg==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"KGCSHlBrwlM=","ct":"r6Qe/IPlQS+HROr2DlvFOiJvyTX3j1pcRQu4T0AbZJf33O/cpMZmrHPhzQ0FUguYmRRJyZDOduTNptFX2xmLt+lvPpKGZTi5n/b+zccr7t9ZVmlqynBJ/QGJez9qfqJlL4qsB50wR/YZspVl/2dmCARwMTT7Obkq1jZKivkECNOIs09pyYd+C8ObKoXvoCUqYQ15SgTNhmpjUp/L2w1w2uq7ok6OnwH/yvkosj5tAgIM1HhxCnIDbpAiQfm3B/n02lHbyzaejWmRrWJp6pIrO/oXqxmjc2YvuW1vkpmBdTGkMu8UvOzmLt+TDrJASuMUr412ei4NsOabU3N2HsQLy1z2k6+uUb2+1mpxl6XRQFyyQn0YBBsLLTaV7YdvNUVRuwKrlQ4vUS6iRfgb5t7gR4iNeK90Q/u82KFl3XLYDRINYoUJmnwy7fu6CHGbkqLmXDXUkr219TZ0RnBtAO7W/j9tttP85BlgC27tBZS4vcKKRu5TkhjnPKNPZDoJNZv434cXnau7NDjud0Vfpv21euU1GqzcS0JjUyF2KfETi4F5necoixzcHZH2bLV0w0Y/SiDOfG8MhwaiApFO5aRV19lu1XbArSzdvzPjivRH6krTYZ1LwZSVeP35UfyuarGvgzNLu7sIIPTWoId1JL3O2SFZy7Jzh8IPubcK3+OQCDdcvZLCThLKBenUCq59Rq+LiyLa9BlMHns9SF9T/d1w9TMQHk71ypclPTQgnqGNik0mG3otBAPSbg=="}'
      },
      backup: {
        id: '6909cd12e6c1605418c28686cbd4c1a0',
        source: 'backup',
        type: 'tss',
        commonKeychain: 'd598b547cf5d71b69eb438e8f5e6624863b62e0343db7499bde24d1909e3281b3659824f86ec5f5f302ea39daf836419d5d75a5b6abb10563f0151c9069496f3',
        encryptedPrv: '{"iv":"pQMP1/u4UsCYYlR4nImmkw==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"zinZBCFIFYQ=","ct":"IsKelRPfkL4RGeL0bARYgpa9x/kdGFz4mTYGhTNsfxtoI3eUqLMJtMLq4O9egIL8CLLsPLJfRiAUWQZTv8tjtNUvJe5zVIF0bL8mtryaUXKbD+3O/5qM7Scc0Pomn5id4kQwU7YpUpqLRmm3zBwoUbfYmgdv181Xm4664T7u1RSdxFjCvvJicS5WZL/m7jGNXIMMMUZjQxwVKCc2FXRoV2V2DZxvlZ951kqVwdOKiJ6nRL0Wy+vOaDyyGJ7gWDJZ1NYZsHA1wj1afJvg2fRTCzHWAQEFpvMXnpQX2Lz4vXYve0oO2XdKV++K+2++MmBzw4PE4SalbslvRgXOu81qzmAJ+02MwGEaMHg6/CC6Qcz3/k/yWTFa3oD7laZ/C7aHFy7OGXTgwAsTZwi18MCnM4dBgGhtp2nA8uc4Gl1Heg8mauEerhhzEz7ANXLdMATc2BfKJCwMftJuqCMRp/uZhlQOrf1IamigX/KEnwDx6AL18L+8UUZePZzaaPZ2H9382cvhkazR9K9Qo35guuDRL+BcRe002NWl/BpKv22Bk420YxpPcOmrpWW3lioupRFsbxXsXmf+j7WxySllhfWOCww0BkfVtow0E+aSbxtZu0KqkBd+Hsk8IK3jFmUb7qur+JjVVKcnl1M4h/0QKwx1Pipk4Ml6V4sjys1BuEqtjxwDYMbx46r+WhkT1HOyWoxnRCVvLlyAFFZR/vA3POCcI61Eu6W3J8d+jSJ6FQCe2hl2oz4pGBLJvw=="}'
      },
    bitgo: {
        id: generatePublicId('6909cd9121f7d475d7528759'),
        source: 'bitgo',
        type: 'tss',
        commonKeychain: 'd598b547cf5d71b69eb438e8f5e6624863b62e0343db7499bde24d1909e3281b3659824f86ec5f5f302ea39daf836419d5d75a5b6abb10563f0151c9069496f3',
        encryptedPrv: '{"iv":"DSGfv60ZAtj2H5C+BPcVeQ==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"e9npeRmcf2Q=","ct":"2MvvKcUkPo0Ip2mug+c/s0W614BIDswGW6Mqkp3dI0Y1zv5mqPZI6XdywSG/Nq5wkhBAAeX0vNAZyN92XEI0n7ULunJF7v1HdvK5ZShVkyyJekIEV4Ip5NjT7DhGklujX+ineztf3jaSTABy2pvc4Ymp37chCYi//t+C9au9MEecGquDZnFl3FmerGDG72oGXEvLg89vY5CpM12fWA2cvhGPDwJHim6Klmjeap2ax6gyvnW/FPnTB32y14ixxa24AHBmj7PVaaPQ9Yo0wY/+y/dAm548VveLFfW/8FYY/vWf2K691Ywxcfrga5ouXNzo5JGtEZ/FmqsRFGJ9Uk12pfoOJM9uFiwCZ51erYfF8eUbpM5SzR+ap7S5hJstQhoWDW9/rFIg/dwF98wEaMjse8XWd68KnxTHW+wAN2DPjrOuQkjuxBoh+QNtzTL3xlD/at23ZzbTilqWTkcT4TPm0anvSi1DMi3dMVwHyMceZP0l5YOU0B8khGfsRWGTY91xi/g4Xh+VoV5YX28CX7FtNRBlSYGcg4ynDkPJH58g+9rACkEaIqcze+nsFA25dsU0LbTYfvOFdlK+r56pNVuiGTp/McBJSv4tr740hmPv6oTFqUQKF+CnAkHCsue/N01rSiuNRDB1kCpzvHGvx5SVEMup4lg25ARN3BllhcH5fuFLRuzVsR48aGnevr/UFbVYNlWGQnjJnrjZp9cVRMvpxkGplYl1OCOvm305dMFdB6pIALhZ9E14sQ=="}'
      },
  }

const walletKyes = [
    keys.user.id,
    keys.backup.id,
    keys.bitgo.id
]
  const encryptionPassword = 'Ghghjkg!455544llll';
  async function createWallet() {
    console.log({msg: 'Calling create wallet'});
    [keys.user, keys.backup, keys.bitgo].map(async (value) => {
      const material = decode(Buffer.from(bitgo.decrypt({input: value.encryptedPrv, password: encryptionPassword}), 'base64'));
      const keyshare = { threshold: material.threshold,
        total_parties: material.total_parties,
        party_id: material.party_id,
        d_i: Buffer.from(material.d_i).toString('hex'),
        public_key: Buffer.from(material.public_key).toString('hex'),
        key_id: Buffer.from(material.key_id).toString('hex'),
        root_chain_code: Buffer.from(material.root_chain_code).toString('hex'),
        final_session_id: Buffer.from(material.final_session_id).toString('hex'),
      }
      console.log({keyshare});
    })
    // const material = decode(Buffer.from(bitgo.decrypt({input: keys.bitgo.encryptedPrv, password: encryptionPassword}), 'base64'));
    // const keyshare = { threshold: material.threshold,
    //   total_parties: material.total_parties,
    //   party_id: material.party_id,
    //   d_i: Buffer.from(material.d_i).toString('hex'),
    //   public_key: Buffer.from(material.public_key).toString('hex'),
    //   key_id: Buffer.from(material.key_id).toString('hex'),
    //   root_chain_code: Buffer.from(material.root_chain_code).toString('hex'),
    //   final_session_id: Buffer.from(material.final_session_id).toString('hex'),
    // }
    // const rootAddress = public
    // console.log({keyshare});
    return;
    const keyPair = new KeyPair({ pub: keyshare.public_key });
    const rootAddress = keyPair.getAddress();
    const { wallet } = await bitgo.coin('tsol').wallets().add({
      label: 'test-wallet3',
      m: 2,
      n: 3,
      keys: walletKyes,
      type: 'hot',
      walletVersion: 5,
      multisigType: 'tss',
      enterprise: ENTERPRISE_ID,
      coinSpecific: {
          rootAddress: rootAddress,
      }
    });
  
    console.log({wallet, walletId: wallet._wallet});
  }
  

const bitgo = new BitGoAPI({
    // env: 'local',
    env: 'staging',
    authVersion: 2,
});
  
bitgo.register('tada', Tada.createInstance);
bitgo.register('tsol', Sol.createInstance);
const WALLET_ID = '6909cf3f1575ce6744344adc9bb6ef48';

async function addKeyShares() {
  const coin = bitgo.coin('tsol');
  const {readable, shares} = getKeyShares();
  readable.map(console.log);
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

//   const user2 = await coin.keychains().add({
//     source: 'bitgo',
//     keyType: 'tss' ,
//     commonKeychain: readable[2].public_key + readable[2].root_chain_code,
//       encryptedPrv: bitgo.encrypt({input: bitgoPrvMaterial.toString('base64'), password: encryptionPassword}),
//     originalPasscodeEncryptionCode: '000000',
//     isMPCv2: false,
//   });
//   console.log({user, backup, bitgo: bitgo.encrypt({input: bitgoPrvMaterial.toString('base64'), password: encryptionPassword})});
}
async function createTransaction() {
    const coin = bitgo.coin('tsol');
    const wallet = await coin.wallets().get({id: WALLET_ID});
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
    console.log(signedTransaction);
}

(bitgo as any)._token = 'v2x8f8a3e19c6da7e8249e296ce9fde7da60d782d7c53bca93c24cf28448380510d';
// addKeyShares().catch((e) => console.log(e));
// createWallet().catch((e) => console.log(e));
createTransaction().catch((e) => console.log(e));
