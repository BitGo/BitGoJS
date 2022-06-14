import { BN } from 'avalanche';

export const SEED_ACCOUNT = {
  seed: '4b3b89f6ca897cb729d2146913877f71',
  privateKey: 'abaf3cd623f5353a143ab5e2ef47cebd94877460d3c6f5a273313de98f96dbbc',
  privateKeyAvax: 'PrivateKey-2JcT988hmMXBPCKcPCGKYRCTCXeXt1DTJwdTKqGDhxbWKL5Pg4',
  publicKey: '023be650e2c11f36d201c9173be37bc028af495cf78ca05f78fee192f5d339a9e2',
  publicKeyCb58: '5LsQkhrYPBEvBZ6i1cT56sdSc5A8EULKJb5a7eQiW2M2QY9iEN',
  xPrivateKey:
    'xprv9s21ZrQH143K2MJE1yvV8UhjfLQcaDPPipMYvfYjrPbHLptLsnt1FbbCrCT9E5LCmRrS593YZ1CKgf3rf3C2hYTynZN5au3VvBvLcWh8sV2',
  xPublicKey:
    'xpub661MyMwAqRbcEqNh81TVVceUDNF6yg7F63H9j3xMQj8GDdDVRLCFoPughSdgGs4X1n89iPXFKPMy3f45Y7E63kXGAZKuZ1fhLqsKtkoB3yZ',
  addressTestnet: 'P-fuji174eadjw8lenrwwd3k2st2ecur8c4x2w7dny7nv',
  addressTestnetWithoutPrefix: 'fuji174eadjw8lenrwwd3k2st2ecur8c4x2w7dny7nv',
  addressMainnet: 'P-avax174eadjw8lenrwwd3k2st2ecur8c4x2w7ppqpln',
  addressMainnetWithoutPrefix: 'avax174eadjw8lenrwwd3k2st2ecur8c4x2w7ppqpln',
};

export const ACCOUNT_1 = {
  privkey: '6053752a0a2cced24b4a7c3cd7b3be4c0442f63157d98a8762d856ec417e6b68',
  privkey_cb58: 'PrivateKey-jRX5R4K6Fow3UtNnnobDpvsjBJvtEN61EvKGepAqjmEpx77fD',
  pubkey: '03539d333227a6b2e9cf8d58c66be4d9596c8841829cabed9fb1278dddfa9193a9',
  addressTestnet: 'P-fuji1qa6yy88pazrqve84uzfku4dk7dk3kptw86lk7q',
  addressTestnetWithoutPrefix: 'fuji1qa6yy88pazrqve84uzfku4dk7dk3kptw86lk7q',
  addressMainnet: 'P-avax1qa6yy88pazrqve84uzfku4dk7dk3kptwtgmfjl',
  addressMainnetWithoutPrefix: 'avax1qa6yy88pazrqve84uzfku4dk7dk3kptwtgmfjl',
};

export const ACCOUNT_2 = {
  privkey: 'PrivateKey-jRX5R4K6Fow3UtNnnobDpvsjBJvtEN61EvKGepAqjmEpx77fD',
  pubkey: '03539d333227a6b2e9cf8d58c66be4d9596c8841829cabed9fb1278dddfa9193a9',
};

export const ACCOUNT_3 = {
  privkey: 'PrivateKey-e2PZP3FYBU3G3gkRXXZkYPtye2ZqFrbSA13uDiutLK5ercixX',
  pubkey: '7BTbkCREwhkwow9qB4ncVZDk674XjS3zAcFbbpYrFfAe9JtGhu',
  address: 'P-fuji103cmntssp6qnucejahddy42wcy4qty0uj42822',
};

export const ACCOUNT_4 = {
  privkey: 'PrivateKey-NvmH6ywEhRDocnFnGGQ8qs1PVaTBhRYy7M9Xu1MkvZVCk4paj',
  pubkey: '5jtw1Bs3E2vGYKQ4DSZ8CB4b15itTKGtR2GuRwW4EEnP5T9akE',
  address: 'P-fuji1yzpfsdalhfwkq2ceewgs9wv7k0uft40ydpuj59',
};

export const INVALID_NODE_ID_MISSING_NODE_ID = 'NodeI-NFBbbJ4qCmNaCzeW7sxErhvWqvEQMnYcN';

export const INVALID_NODE_ID_LENGTH = 'NodeID-NFBbbJ4qCmNaCzeW7sxErhvWqvEQMnYc';

export const INVALID_STAKE_AMOUNT = new BN(1999);

export const INVALID_DELEGATION_FEE = 0;

export const START_TIME = new BN(0);
export const INVALID_START_TIME = new BN(1000000);
export const END_TIME = new BN(1209600);
export const INVALID_END_TIME = new BN(31556927);

export const INVALID_SHORT_KEYPAIR_KEY = '82A34E';

export const INVALID_PRIVATE_KEY_ERROR_MESSAGE = 'Unsupported private key';

export const INVALID_PUBLIC_KEY_ERROR_MESSAGE = 'Unsupported public key';

export const INVALID_LONG_KEYPAIR_PRV = SEED_ACCOUNT.privateKey + 'F1';

export const INVALID_RAW_TRANSACTION = 'This is an invalid raw transaction';

export const ADDVALIDATOR_SAMPLES = {
  unsignedTxHex:
    '11111Ca5RcAh2fwQDMPYfiCX6iTW642zBVYGvzsZbk5aDoRyv4KoMPymFfbfxbdyMDsecxwNtsduGgPaqRv3dEthm72PL7KwRUMWhvUTkAvsTTEHjCvpv46xRp5PHt9FsenZrBMhX6cDor6srVXExwxjshRNuHXr4b7S82tDQyeFa4nGJYH22cP7dGh7FGmB59BCaipMHhTpBv1u4YYntd3XuQf4K3XSgsuYuJJrZLHoxFPoXXZSb3VPSZ9W9f3hoKHyic51vfUvv5FpQjCGiaC7w9K62NnXAtHkkSjStZ9wJwv9inEhxJooncr7YyiknMG76YVpTPRrXiZ8Q7RHWU5TeQW1YPe3g31n99iNB7oPWQu38dTqeTYPkqkrrVifnaeL8fUvEhm2sATyzqLSTomw4upEw8PAdNAZDMNk6AkNZhqcNxSsm8RPt4aVCJaBzauMj7Ezq8yt2rRiDZUGNa2my546bYQXvRCLxHWUywpqs93jZj1B2tbxyj5AvPQhNunQLjgw6pwf5Zq8AudbqRY9fWVv6wcVWRAJXPTg86vTiY8tc2JU28GgTrUVe1vwk2YCmLW5ezFa6ZCpaTwaAWojqQr4vfYYftQaWi9E9dmKpc647funLaffHe9mErms78tem8SovJU7Y82QeT4gtYuXHVz8E6vGwYjz8KjPdJPisoHWGFnwmzTcKoR5DR8zX5f6h2q6iqYWg17mTJEv4WR8AZx8zdDYjeTUGgW3LnuYjNENcdJ6DnG9aZ8qDXdF4Zb6N2dCJQ9nZbx9J9qWvh6hDG2fpppCEDDkPYRN35qiHi4aKi7eRppwhD8kbY46y8p8yMJwd9B6LH1K2KmwGeaET9CDw1gdNTgntv2a5rQThErjcqN9a6y97GniFZ5U7XMGadFv5LsMT9SShB8DKoLaJ',
  halfsigntxHex:
    '111117G6tLeUpoJghj8ejXXYLNyA2NNJJQWVgXndvHTFGHPToDQHhUb8cHjN6iBQBz1hrA9jfLHMLrnnqVFfzGxeXTPhcN9WjYiC62NYwuT5FZcFjAaqTmHYev89drbHPnNR7U58vy3BRoepbC5rRi2ejoBkcbf6TJYrJb4e84GZRYxomvaUFtoZL1efjw212tq2B8DsvraT9R3bLf32judrWA6MXxJR1PCyc4DL4YHgWpPGuULxL49B1f4Jn6UTartdQ17q321ZdgEc8aSVeQX92VWepALTRxPhC6Un5WMkyiZzWydWhFUwK7K1oYH5bq6zfLGfQrw3yQthR8nUCBhNjCEBRHyZAQKWQMcbMCYDrPAWaNMywCgAQf28vWZFKp1ZrJ567JauNwXFXWFuE76HZrRjDeHm9S6PmxEgmhboAv893kUdPLgDFzYupLzswrHFCMxVpGQXnegJ3hVUxVoMSrgjgztdUssjksMXFc9usr2DxDG5zMKPjP6cPxMJ6KBq5YYYy2sJaHnewqLwsAe8UqHd1Xw1swqDHZytfNKfJZCTuSSTJaKqhNYzEkHrBbGRa4TzDBMDzfqLDW9TeKw1rskRsnKL9P3Vb4zEeUBaYniXudXynpfwcPqzipLudNeZczsJinSUiAnjmpHxiwkYNN7pxjSinycFAN6gbm2ceBrm6Mh89VHNrd7qxyw7278Ka7oxUw3k3Qw3ZVzBSy9dMQRx9MFqq9d55Y5fyUg6VMHefrLSK1mtAQXWFtG5Sdj7azSijHMHC1XLcVencpxfYnMRKzJry8FG2emvT6TPquwMUjfg58fU7SEQ3Gge99rS5CN6N4vQDvSkUqSwCPFqCnX3FGNpNmJmZNo9r15Qzw1mw9kdNMRadShu1SgtPzCzbLvfSVHF1F9MwHXtbBqai4oDKV9TCQwPS8bGmrf3Pho1FrJcWRtw8t9JG1ga2drrkmkdf74PDMswfYvZT7TLi6kc1S8qKsVst5cyA5kM7URLV81BgEXYooWYQofVrtiAsShnwGJ266UGGJJEaPVKwhViYPiBpb3aAW3NpLWpS7sTeG1hSqoUDyrKfqaYrrmHYNnE7esSb3aMrQfEx47XqaZfv8LaBtH9eA',
  fullsigntxHex:
    '11111x5z3sNALXbymfrJTJEUUYes4ob68VmeRWN5eUN7Rpabve6AqE7kjKbN8f8rw4Lrrw3KsbAJAgd7pUsujC3MDLxpjMgJTibM7R8PUHmoZiVUtwS1QXV6dDqC8ys41ZDZERkQ4uzP6FKc6BqqReoY8qmorg16gejgr2BH2aSjfwbAW9ZJ1tTjjx83cAvF8vP139ejMSXKmEpDtbJ6erzrro3NE5kjEqbcv2ZVwziTQdKqSMeDxKf8TYSLB11u9kn95d8q91cidAvFMw8T6HnzYWGnFAuUHxW6NmBqNCYy8tKj2y7JSXmNsAi9mMnVQKk88v1qaf9VfGSs98VM7MoemA1BPcT8j9iZQfSy9vWQZUKETn3rnNewPVsMBn3GQWhFTQVrgjrvEBhk7pVoksn3AgPP5s9JsgVuTLks3LiXgkH3jvF3JAWtmsRTv2c7h7LPxTERFYyqPGnW3VcfADsnLy4EHGBYEjqTf7KSGarZ39YEsBC1iEBwrWef7iC9qQAtfRCiKFkBDFqyyaRuN8P8NH1cQCwYWrwdZdMfttCYZRJ5PpWjdPuXUyCBX58YGRS2QsbnZ2Md13CR8hiTCfK6dPrVh8tcA885iuVF4vB8vLEh4bGJXWa5PV4bVFJAvv6TVAx77MjMrVdLAau7J13ryamXpqhfSu8bmdr9TrJc99w7iQ54SbLeq3EvGnBKsopmmzEMwT6Ydptwn4uotrWEJkQ3SUwrUx7ghRTTnni9JUQrDH8vF3NSv9veHmM9o3T3ZPeBxdNUGtvdue959dRpBxMTZiKE48bhFmgnjcFz6XLobWoXpPJn379fW4XWRrn2HWh8zAqXQ5R7nKXGNis23N7JK8nfARdyBATUvWNC8cnAZyPCwwWsbyi2GGYCYHTGCnHppaKJAmyJZSkbGLaMpsuweywWfTi9hVHQyRw7BMdGbFMubRvWQmbbMWDuEN74LJRHB4kKy1juwoNiPAdKJEoUgjTV5voN4rg6sC584ebCYszJWhrALs7VhWeZwdJXL5pWqELTqvcBU5h5Sq8zSA5AtWtcXmtEoyG7aRuaSjqe2CXHxLCfkHEZW5EP56m1pdXx6sLYp4Ms6WDdm6sGXmgvSfNtXxUeobXuxPKydC35nzB21o4jAdM9a3Dyn3utgCgQ5g3AVnJD2zRr3NaYWrAD5QuKTF9mSEmsEADGxJrQwT64DitURTaZUYqbkJwBTibJ9HWDoPzQK4DaPgn5UrcDfW4TAr6HL8VXWcaKSHZvoLkJjBupbPntTXioodG8AZgKvrihSTCw2Eb3v87',
  recoveryHalfsigntxHex:
    '111117G6tLeUpoJghj8ejXXYLNyA2NNJJQWVgXndvHTFGHPToDQHhUb8cHjN6iBQBz1hrA9jfLHMLrnnqVFfzGxeXTPhcN9WjYiC62NYwuT5FZcFjAaqTmHYev89drbHPnNR7U58vy3BRoepbC5rRi2ejoBkcbf6TJYrJb4e84GZRYxomvaUFtoZL1efjw212tq2B8DsvraT9R3bLf32judrWA6MXxJR1PCyc4DL4YHgWpPGuULxL49B1f4Jn6UTartdQ17q321ZdgEc8aSVeQX92VWepALTRxPhC6Un5WMkyiZzWydWhFUwK7K1oYH5bq6zfLGfQrw3yQthR8nUCBhNjCEBRJGHkJ34PBoNnLmLUBjtqeZGcnPbbjQ23v3AK4Ay9WiXXU66xAadUQUrpMcwzUuX7dAww7mripyHAodhqecFhSN5XXSwN3FX8Ky5dtNon4ctjmuCj2e9p4RqWrEuSCoRTHzQ8DWPvoMnqFoCQavs881qtKyqFWwrFQqfgTtTvSqAA3eaVX1kxnHccYdsuD9YHWX9H7ypxWKzyB2NfrRq1a8VwvF1SJGfMSKtCUSTAkdk3axF7J9ZduiAaarbm9auiKWKLTKhQXDN2XLxUdnegRpjG36bo7QUkK4UFusKiLzx54eiocbKs4xm4Ui9vpxuBwZeg6eeSf4g5DoxznMquM1YHXUTJqwmmdooUtreUBpAG1p24aSfaLwGSxQQMKj8pxNhBiSD5x3cRajhTtWvgo5KPUMMesbRxiLaVvAKGZWDZxkwpmfX9w4ntWUdYb9ho6aD6CfmmBR9QafshkWpXUkfAzDHAAiYKPp4gjWpaVmMwDAs18vg9PLCyPmGMrfVr8tapoLQhkq5UQ76ceZtyf7jEr9UmvnkxWm1BwyeheKboBzdHCUun8ceZEREt3uigcwPmhDUnQWJgcc8FUURV1MiWLKBdfs8mTKDcy8gxtngEAtjPyhcMjKzcQ2pcGBhYLEQpbqRjLY7qcK6mV7omeYkevkrcJEaWi9mMzxsDEMUYyBLmuN83B8vyiqvebUVjLYcrHpyy6PSyHkMUxmKQJB4Z37ffxZbiJVtXhs4qmanLZCcXvWDuGQHTzN8MVCyVcKvYSQkgG',
  recoveryFullsigntxHex:
    '11111x5z3sNALXbymfrJTJEUUYes4ob68VmeRWN5eUN7Rpabve6AqE7kjKbN8f8rw4Lrrw3KsbAJAgd7pUsujC3MDLxpjMgJTibM7R8PUHmoZiVUtwS1QXV6dDqC8ys41ZDZERkQ4uzP6FKc6BqqReoY8qmorg16gejgr2BH2aSjfwbAW9ZJ1tTjjx83cAvF8vP139ejMSXKmEpDtbJ6erzrro3NE5kjEqbcv2ZVwziTQdKqSMeDxKf8TYSLB11u9kn95d8q91cidAvFMw8T6HnzYWGnFAuUHxW6NmBqNCYy8tKj2y7JSXmNsAi9mMnVQKk88v1qaf9VfGSs98VM7MoemA1BPezP3Sh4QXZ5wXqknJNd7fbRCnnM9zx3Gxm6Qy5qDrFCwwD38ZahZGTBFEmbCR7tcCeUefLMSeMKZ3ScPGAuDPTUAV8rmx5LcAvCLXM6CVZsXewkmKeyZuwnPLoERqX1hgKpou8Q2STf6REmS6amnPEHgtu8ZoVRxBi8YbJpvgT4aq7gyEYgvBcuNbtCFXLcJamUa6dA1t8WGY9BFvFbAnfq23pADb7btXAZRGxTyQkBCk7W7i8hsPV86paBzCF12u7rY2hevd8LweBYtTugk42M5MWopCB9qZZKSQdSjiHhE76pWP6fKd5hhzbXGiJgJZcW4AxrTwChQgdhEwvazbDtr2bzU1cHNnscr7D67DYrcybUF7G89bv6jBz8zsBAt1rEg4DttwjnrDEDWgR8GNHWmjckwUUPC2X1MhopQt2ca8SNsdKbEjJPfizfXLSuGUgZjiKG2tS1wBMgG6Hg78mpHn5N6kxaK6XNFLV8jmmLPgfkSQKhL8W7PyhUJxSBQbccmHTrAogKy3jsZZ2V2gycXsanwUZN12KbFbr5ibeGx7dKzLeES6ELw5AxSqQkLx1vU7EukF46sqqmn9gGx3FY9yXFsnkdyijCQGugp27MjAaUbQvkWrznKMvU6jXqHtZeP5qUCVpTboXRhTwsMBFrKxsvXaFKFkhMjaD69K2rhA9cVJifcYtdkM9MUn6V7FYiyw8aaEGwoDoh212cTZXK8ETQ6LFbFrvCVeRUrWass6eKVLpZDyXHz2BXb1FsnbHeg2SxUfaBdVmE4FZMVZPh5kwpwkDESTZ4ZRci9HfXrkzeZoGRoTaZCQGt6Gsgm7iaC1dMz2BLku9DpPFJP4McM9wAW1a1j6RDkYKUKTuMK8SV2UtqdQVtrtZbqzX8BRbDQp9AGzfyk7KxfkJGSfBoYAp3rEA6zQVE4oiDhT5S7njiRVfibPQrXoT',
  privKey: {
    prv1: 'PrivateKey-e2PZP3FYBU3G3gkRXXZkYPtye2ZqFrbSA13uDiutLK5ercixX',
    prv2: 'PrivateKey-2exwJAqDHyo35bRBpXL5Sy4yrcm9JES68tdTDC2wi3CeArDpja',
    prv3: 'PrivateKey-NvmH6ywEhRDocnFnGGQ8qs1PVaTBhRYy7M9Xu1MkvZVCk4paj',
  },
  outputs: [
    {
      outputID: 7,
      amount: '535969420',
      txid: 'E476SzGZt46QaSRfygWhNnK6Td3ggEr5GxTbC3buZpaPXs7j5',
      outputidx: '1111XiaYg',
      addresses: [
        'P-fuji1yzpfsdalhfwkq2ceewgs9wv7k0uft40ydpuj59',
        'P-fuji103cmntssp6qnucejahddy42wcy4qty0uj42822',
        'P-fuji1hdk7ntw0huhqmlhlheme9t7scsy9lhfhw3ywy4',
      ],
      threshold: 2,
    },
    {
      outputID: 7,
      amount: '696969420',
      txid: '2V6WvL9qkdTK1HQfYWjkFUoe3jmsJxFoAxYjmXYMH4Dzwh9zqj',
      outputidx: '111KgrGRw',
      addresses: [
        'P-fuji1yzpfsdalhfwkq2ceewgs9wv7k0uft40ydpuj59',
        'P-fuji103cmntssp6qnucejahddy42wcy4qty0uj42822',
        'P-fuji1hdk7ntw0huhqmlhlheme9t7scsy9lhfhw3ywy4',
      ],
      threshold: 2,
    },
    {
      outputID: 7,
      amount: '1178941553',
      txid: '2V6WvL9qkdTK1HQfYWjkFUoe3jmsJxFoAxYjmXYMH4Dzwh9zqj',
      outputidx: '111bKZdzG',
      addresses: [
        'P-fuji1yzpfsdalhfwkq2ceewgs9wv7k0uft40ydpuj59',
        'P-fuji103cmntssp6qnucejahddy42wcy4qty0uj42822',
        'P-fuji1hdk7ntw0huhqmlhlheme9t7scsy9lhfhw3ywy4',
      ],
      threshold: 2,
    },
    {
      outputID: 7,
      amount: '880030580',
      txid: '2V6WvL9qkdTK1HQfYWjkFUoe3jmsJxFoAxYjmXYMH4Dzwh9zqj',
      outputidx: '111WrgF9g',
      addresses: [
        'P-fuji1yzpfsdalhfwkq2ceewgs9wv7k0uft40ydpuj59',
        'P-fuji103cmntssp6qnucejahddy42wcy4qty0uj42822',
        'P-fuji1hdk7ntw0huhqmlhlheme9t7scsy9lhfhw3ywy4',
      ],
      threshold: 2,
    },
    {
      outputID: 7,
      amount: '8879679705',
      txid: '28GmFCp3w9GhySTB29LMHqXksoJmyLnM46A31Qct9bvW2kGP5W',
      outputidx: '1111XiaYg',
      addresses: [
        'P-fuji1yzpfsdalhfwkq2ceewgs9wv7k0uft40ydpuj59',
        'P-fuji103cmntssp6qnucejahddy42wcy4qty0uj42822',
        'P-fuji1hdk7ntw0huhqmlhlheme9t7scsy9lhfhw3ywy4',
      ],
      threshold: 2,
    },
    {
      outputID: 7,
      amount: '696969420',
      txid: 'xpVMRi3cex8B6Y9V9A4KUtDFdEwq6gwmqi5u9nE5cPM7MBEnS',
      outputidx: '111KgrGRw',
      addresses: [
        'P-fuji1yzpfsdalhfwkq2ceewgs9wv7k0uft40ydpuj59',
        'P-fuji103cmntssp6qnucejahddy42wcy4qty0uj42822',
        'P-fuji1hdk7ntw0huhqmlhlheme9t7scsy9lhfhw3ywy4',
      ],
      threshold: 2,
    },
    {
      outputID: 7,
      amount: '420000000',
      txid: 'xpVMRi3cex8B6Y9V9A4KUtDFdEwq6gwmqi5u9nE5cPM7MBEnS',
      outputidx: '111AZw1it',
      addresses: [
        'P-fuji1yzpfsdalhfwkq2ceewgs9wv7k0uft40ydpuj59',
        'P-fuji103cmntssp6qnucejahddy42wcy4qty0uj42822',
        'P-fuji1hdk7ntw0huhqmlhlheme9t7scsy9lhfhw3ywy4',
      ],
      threshold: 2,
    },
    {
      outputID: 7,
      amount: '420000000',
      txid: 'xpVMRi3cex8B6Y9V9A4KUtDFdEwq6gwmqi5u9nE5cPM7MBEnS',
      outputidx: '1111XiaYg',
      addresses: [
        'P-fuji1yzpfsdalhfwkq2ceewgs9wv7k0uft40ydpuj59',
        'P-fuji103cmntssp6qnucejahddy42wcy4qty0uj42822',
        'P-fuji1hdk7ntw0huhqmlhlheme9t7scsy9lhfhw3ywy4',
      ],
      threshold: 2,
    },
    {
      outputID: 7,
      amount: '881030580',
      txid: 'xpVMRi3cex8B6Y9V9A4KUtDFdEwq6gwmqi5u9nE5cPM7MBEnS',
      outputidx: '111WrgF9g',
      addresses: [
        'P-fuji1yzpfsdalhfwkq2ceewgs9wv7k0uft40ydpuj59',
        'P-fuji103cmntssp6qnucejahddy42wcy4qty0uj42822',
        'P-fuji1hdk7ntw0huhqmlhlheme9t7scsy9lhfhw3ywy4',
      ],
      threshold: 2,
    },
    {
      outputID: 7,
      amount: '696969420',
      txid: 'xpVMRi3cex8B6Y9V9A4KUtDFdEwq6gwmqi5u9nE5cPM7MBEnS',
      outputidx: '111M2YGnW',
      addresses: [
        'P-fuji1yzpfsdalhfwkq2ceewgs9wv7k0uft40ydpuj59',
        'P-fuji103cmntssp6qnucejahddy42wcy4qty0uj42822',
        'P-fuji1hdk7ntw0huhqmlhlheme9t7scsy9lhfhw3ywy4',
      ],
      threshold: 2,
    },
    {
      outputID: 7,
      amount: '1000000000',
      txid: 'WEyBXMUH1vk9XvjnSo64WV6rWn39Q9BtDixF9ASn3fLu2KHJE',
      outputidx: '111AZw1it',
      addresses: [
        'P-fuji1yzpfsdalhfwkq2ceewgs9wv7k0uft40ydpuj59',
        'P-fuji103cmntssp6qnucejahddy42wcy4qty0uj42822',
        'P-fuji1hdk7ntw0huhqmlhlheme9t7scsy9lhfhw3ywy4',
      ],
      threshold: 2,
    },
    {
      outputID: 7,
      amount: '1000000000',
      txid: 'WZPN4NBv85sZA1aMUTQcaBhuoKp9nN8pbpthuzYtmCWgeWMde',
      outputidx: '111AZw1it',
      addresses: [
        'P-fuji1yzpfsdalhfwkq2ceewgs9wv7k0uft40ydpuj59',
        'P-fuji103cmntssp6qnucejahddy42wcy4qty0uj42822',
        'P-fuji1hdk7ntw0huhqmlhlheme9t7scsy9lhfhw3ywy4',
      ],
      threshold: 2,
    },
    {
      outputID: 7,
      amount: '994000000',
      txid: 'WEyBXMUH1vk9XvjnSo64WV6rWn39Q9BtDixF9ASn3fLu2KHJE',
      outputidx: '1111XiaYg',
      addresses: [
        'P-fuji1yzpfsdalhfwkq2ceewgs9wv7k0uft40ydpuj59',
        'P-fuji103cmntssp6qnucejahddy42wcy4qty0uj42822',
        'P-fuji1hdk7ntw0huhqmlhlheme9t7scsy9lhfhw3ywy4',
      ],
      threshold: 2,
    },
    {
      outputID: 7,
      amount: '695969420',
      txid: '2Yz9QFGrcUcuPSz72TrLZqUwd2HjUw5eovZn2QdctEd8MVbkw3',
      outputidx: '111KgrGRw',
      addresses: [
        'P-fuji1yzpfsdalhfwkq2ceewgs9wv7k0uft40ydpuj59',
        'P-fuji103cmntssp6qnucejahddy42wcy4qty0uj42822',
        'P-fuji1hdk7ntw0huhqmlhlheme9t7scsy9lhfhw3ywy4',
      ],
      threshold: 2,
    },
    {
      outputID: 7,
      amount: '420000000',
      txid: '2Yz9QFGrcUcuPSz72TrLZqUwd2HjUw5eovZn2QdctEd8MVbkw3',
      outputidx: '111AZw1it',
      addresses: [
        'P-fuji1yzpfsdalhfwkq2ceewgs9wv7k0uft40ydpuj59',
        'P-fuji103cmntssp6qnucejahddy42wcy4qty0uj42822',
        'P-fuji1hdk7ntw0huhqmlhlheme9t7scsy9lhfhw3ywy4',
      ],
      threshold: 2,
    },
    {
      outputID: 7,
      amount: '1000000',
      txid: '2Yz9QFGrcUcuPSz72TrLZqUwd2HjUw5eovZn2QdctEd8MVbkw3',
      outputidx: '1111XiaYg',
      addresses: [
        'P-fuji1yzpfsdalhfwkq2ceewgs9wv7k0uft40ydpuj59',
        'P-fuji103cmntssp6qnucejahddy42wcy4qty0uj42822',
        'P-fuji1hdk7ntw0huhqmlhlheme9t7scsy9lhfhw3ywy4',
      ],
      threshold: 2,
    },
    {
      outputID: 7,
      amount: '695969420',
      txid: 'mi8xMNrv8899JfHM2NwJRUSzZEHBtVtV27LdGYDkpwPdG6P5o',
      outputidx: '111KgrGRw',
      addresses: [
        'P-fuji1yzpfsdalhfwkq2ceewgs9wv7k0uft40ydpuj59',
        'P-fuji103cmntssp6qnucejahddy42wcy4qty0uj42822',
        'P-fuji1hdk7ntw0huhqmlhlheme9t7scsy9lhfhw3ywy4',
      ],
      threshold: 2,
    },
    {
      outputID: 7,
      amount: '420000000',
      txid: 'mi8xMNrv8899JfHM2NwJRUSzZEHBtVtV27LdGYDkpwPdG6P5o',
      outputidx: '111AZw1it',
      addresses: [
        'P-fuji1yzpfsdalhfwkq2ceewgs9wv7k0uft40ydpuj59',
        'P-fuji103cmntssp6qnucejahddy42wcy4qty0uj42822',
        'P-fuji1hdk7ntw0huhqmlhlheme9t7scsy9lhfhw3ywy4',
      ],
      threshold: 2,
    },
    {
      outputID: 7,
      amount: '1000000',
      txid: 'mi8xMNrv8899JfHM2NwJRUSzZEHBtVtV27LdGYDkpwPdG6P5o',
      outputidx: '1111XiaYg',
      addresses: [
        'P-fuji1yzpfsdalhfwkq2ceewgs9wv7k0uft40ydpuj59',
        'P-fuji103cmntssp6qnucejahddy42wcy4qty0uj42822',
        'P-fuji1hdk7ntw0huhqmlhlheme9t7scsy9lhfhw3ywy4',
      ],
      threshold: 2,
    },
    {
      outputID: 7,
      amount: '420000000',
      txid: 'UkP29BLXSNKasRxHotxrPdVcRRPtEhvJZNcB8qFi9zZvQ35vc',
      outputidx: '111AZw1it',
      addresses: [
        'P-fuji1yzpfsdalhfwkq2ceewgs9wv7k0uft40ydpuj59',
        'P-fuji103cmntssp6qnucejahddy42wcy4qty0uj42822',
        'P-fuji1hdk7ntw0huhqmlhlheme9t7scsy9lhfhw3ywy4',
      ],
      threshold: 2,
    },
    {
      outputID: 7,
      amount: '1000000',
      txid: 'UkP29BLXSNKasRxHotxrPdVcRRPtEhvJZNcB8qFi9zZvQ35vc',
      outputidx: '1111XiaYg',
      addresses: [
        'P-fuji1yzpfsdalhfwkq2ceewgs9wv7k0uft40ydpuj59',
        'P-fuji103cmntssp6qnucejahddy42wcy4qty0uj42822',
        'P-fuji1hdk7ntw0huhqmlhlheme9t7scsy9lhfhw3ywy4',
      ],
      threshold: 2,
    },
    {
      outputID: 7,
      amount: '695969420',
      txid: 'UkP29BLXSNKasRxHotxrPdVcRRPtEhvJZNcB8qFi9zZvQ35vc',
      outputidx: '111KgrGRw',
      addresses: [
        'P-fuji1yzpfsdalhfwkq2ceewgs9wv7k0uft40ydpuj59',
        'P-fuji103cmntssp6qnucejahddy42wcy4qty0uj42822',
        'P-fuji1hdk7ntw0huhqmlhlheme9t7scsy9lhfhw3ywy4',
      ],
      threshold: 2,
    },
    {
      outputID: 7,
      amount: '291891876',
      txid: '2dhgHu5if98zhtUHUH8stETvT7ronoJ8vDcufKwQKHCDttwT4a',
      outputidx: '1111XiaYg',
      addresses: [
        'P-fuji1yzpfsdalhfwkq2ceewgs9wv7k0uft40ydpuj59',
        'P-fuji103cmntssp6qnucejahddy42wcy4qty0uj42822',
        'P-fuji1hdk7ntw0huhqmlhlheme9t7scsy9lhfhw3ywy4',
      ],
      threshold: 2,
    },
    {
      outputID: 7,
      amount: '1000000000',
      txid: '25oowEVZvF6aKiQ3xYs2fK6z8pcZcRfWjjSxS7Yz1rNaSbPeL6',
      outputidx: '111AZw1it',
      addresses: ['P-fuji103cmntssp6qnucejahddy42wcy4qty0uj42822', 'P-fuji1hdk7ntw0huhqmlhlheme9t7scsy9lhfhw3ywy4'],
      threshold: 2,
    },
    {
      outputID: 7,
      amount: '1000000000',
      txid: 'KqgcSjNLQuFJhyfsJaUc3usNUBGDXtpNHhCUpua1F4WY1Za6q',
      outputidx: '111AZw1it',
      addresses: ['P-fuji103cmntssp6qnucejahddy42wcy4qty0uj42822', 'P-fuji1hdk7ntw0huhqmlhlheme9t7scsy9lhfhw3ywy4'],
      threshold: 2,
    },
    {
      outputID: 7,
      amount: '1509000000',
      txid: 'KqgcSjNLQuFJhyfsJaUc3usNUBGDXtpNHhCUpua1F4WY1Za6q',
      outputidx: '1111XiaYg',
      addresses: ['P-fuji103cmntssp6qnucejahddy42wcy4qty0uj42822', 'P-fuji1hdk7ntw0huhqmlhlheme9t7scsy9lhfhw3ywy4'],
      threshold: 2,
    },
    {
      outputID: 7,
      amount: '1000000000',
      txid: '2LnjbFVAC1iX4WT2KwxcYR6ZHy5EAL4ehyaUiGY8qPJGwCB6DY',
      outputidx: '111AZw1it',
      addresses: ['P-fuji1hdk7ntw0huhqmlhlheme9t7scsy9lhfhw3ywy4'],
      threshold: 1,
    },
    {
      outputID: 7,
      amount: '499000000',
      txid: '2LnjbFVAC1iX4WT2KwxcYR6ZHy5EAL4ehyaUiGY8qPJGwCB6DY',
      outputidx: '1111XiaYg',
      addresses: ['P-fuji1hdk7ntw0huhqmlhlheme9t7scsy9lhfhw3ywy4'],
      threshold: 1,
    },
  ],
  memo: 'Manually add a delegator to the primary subnet with multisig',
  nodeID: 'NodeID-MU7UknPhH6F7kqK9brjGgg9RDNR9Y55Wg',
  startTime: '1655390732',
  endTime: '1658020732',
  minValidatorStake: '1000000000',
  pAddresses: [
    'P-fuji103cmntssp6qnucejahddy42wcy4qty0uj42822',
    'P-fuji1hdk7ntw0huhqmlhlheme9t7scsy9lhfhw3ywy4',
    'P-fuji1yzpfsdalhfwkq2ceewgs9wv7k0uft40ydpuj59',
  ],
  delegationFee: 10,
  threshold: 2,
  locktime: 0,
};
