import { BN } from 'avalanche';

export const SEED_ACCOUNT = {
  seed: '4b3b89f6ca897cb729d2146913877f71',
  privateKey: 'abaf3cd623f5353a143ab5e2ef47cebd94877460d3c6f5a273313de98f96dbbc',
  publicKey: '023be650e2c11f36d201c9173be37bc028af495cf78ca05f78fee192f5d339a9e2',
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
  unsignedTxHex: '11111NEFqdcSQCQFZRreJdadT3jSrKaPDRszuG5G5rXqaPrta6dT3AU4RJatUdV7msNogBGTq7htTdFf2e6AcL4DFGiW9zTSoaLkEVRLyGkk4H9d8smX3YAaKkg5PY3CDhaXrbc3KLFdhDY2GHJqoJN5nRp2wtudqsrmQYMSqzB4qLYmiDDaoto6zWGoiVRx2Axtv13HJY1zPozBLMACytH2DPgVXN6yetEKnaF64c7YM39Qb5Dve5vxFk3iUEUt3d4TggsCkAJU1ryKoUPBuaujNJhPVB9992deLDvCfxzxDgubnxdTbM85vwUDNWWivUMyYbxxhbw8EJ9chu4yeQ59P6TVvDa3mNoQ2KG8C77rFuH61nnyqDastUTzaM3b2NediE8WHPd3PTZ2BqfawENzhJSGZe1Zf1vEtbp8YE8XQ9saG25goCvk7AFW9Sz1vDH3R8uFCvPdpS5FWXsx6yLHJA3qk7Nbd7Bjjqx4z5mL53d47vsQ48dTntKXbuvjgetkpSWKQrYqBTCRKtZpRiQy6EdC8mpReR3DBANKBELNaKe22mwPkwTrZx2hpzPPAE5qPsN38K9NBbKFL9kxV2LrN9c1S3HS7cDwE3frruzbKJMRkAnyuAF2HynN8sM5NKpNrreXLP3beqQqZrNGBaLxB2zFg3bFvwcBaBdTku8GEiGgpEfYAsCdTbhfauvTh7EWSjiDkzVX6seh1VCTqrXkkxHB1qnSTvYoNVKoS6icfxGtWwsdU4mRuKtDLatJWTkXyd3f7hXy4genqACTZqNi4EknfvdrTFBy7Gijp8gJdwskWbWQyEWmJ7YmanJQr9Q7mqJ2GmADU354VeyoEuCWKhzQyLEQqGrgSnXDzno3eieWaduFBwUNtrWkhcwfFHv',
  halfsigntxHex: '111117G6tLeUpoJghj8ejXXYLNyA2NNJJQWVgXndvHTFGHPToDQHhUb8cHjN6iBQBz1hrA9jfLHMLrnnqVFfzGxeXTPhcN9WjYiC62NYwuT5FZcFjAasQ7yUD2ghJJQpw6FVtKarMsEBZdgToTxWmCbzZ7Hi9TX1HTaYYURy3iAoSoQKTZoiUau1gjD3uKRQn6M5gwWj8D7Ds1tGj7fKjMp9V6LBBeze8vfi1dLt5qLykJTw29cExEYoBVswR6EyEgdQweYsabJVxRS31LnqXgkGxAfBjNFmBPaGU66C1WqUwKK43qAFM4ouWyST6ZmnXDpCqZqfGcwqE2ZxjVVipPmrwbAGf1fvQkdzFz57XGecqx8K8xZk96rJx6v4azrhf9FM34oucZYy17eWY9jjH3NhWRS5frVaf8gxZzyPGsqBeRgRo1yfRe8hYghxqjhZhNoi3ogJASzFw5AomZihtduu31ZcA8zMh4JUtbBrGypq1SXvwcKQLTAfchgfecPYymq1Sep9XHDSZq8Qqrz3SXKhfemAmDxdp5DKJ3dbdoZTQJA7kjRqv3ZSofEQB8FfZZEqP34fmq1pvUMRFhmP2ZsQBWDbiVCq6YWSz5S7rFZEpWPMcsgSWCqtVMXtu7gqN4Bjuz4sGhDSwZvx7huMuaGtQ6Jmc5tJrpUfuoAHZvt5FYKT58xa5p3385Eki1SKVHUJ9TNPyxMNxAk3cX4cyMKcrTAoZ8TGKdBqatH2B93bS2zcvoQNAkfJBmrqVfMh2Cx2ZMD1YS5XQJ8ci7PTJCbeRXfQfdqD14ySRpHuw7LR25Jp5xTnopMVTrw3CFzfZzV1WaxxXc1fRioYF6wtkBwtSFvJxwkzE8TsscKUxViMYyVN4dFMavXhB3wvPiAyzjHQ1QpoSzU2dJf5hjfXaMLWLhKaHf8UHrTRPVaKnRuVAaayj771iqmzGwbbyjCNAJTq3E2WVyX4esLu2rbpud4gxnPeWV8APsp54vvWUSCV6fQeHxmRt31T7UGSfsxZaM2XJ3h4oRaz4djx1mpbkUgEKASZEbsLkYDw8SFSudJfazXCYSAtCEE9E3S3E9pidDG9ABuGpQYNbaJYgqVEkH1MhSEoPKL3f1sXkh',
  fullsigntxHex: '11111x5z3sNALXbymfrJTJEUUYes4ob68VmeRWN5eUN7Rpabve6AqE7kjKbN8f8rw4Lrrw3KsbAJAgd7pUsujC3MDLxpjMgJTibM7R8PUHmoZiVUtwSJTAnrKJ8wvuAc1NZ4zW5DHi9QXhbm8AoYJM7yut2aoaEQvp6jJTnf6dbqPmRDAfSQpSkRZsKJwetMYsXAtTWnWZxaS1Epep4QNNq9pWD3Ua9tM2zSTYu7hVULEFsAT8kk8KJJxiGG4j55pqMWpd5jWWCbUjkKX3ZD26SQqQ3ncY5udV7TxDiT2K3ya8niNwmg8TL46oQj5KTrcSgZroxaZTbXLNjhDaxYyVE2cXTx613981D6ofgT6C7Re6L2KsvqpFk38eqsT9jHF8An1NWexTdW582stjfKg1GmWic1yhhTS3kTa1h64rKnBJi6r1jaeNbg2cFkMoe2fJ4gQFiK6TxYU2xBFR7joy2gvEw2Yjm63XEJ3dB7G9HHfuacLCux3nxuEXtcu3feV8QC4yoqMFhvtVHRb4cCCHq4ru5Tvj3m4fNrniMNSDEnihebUnvS1pz64x5gbE8eSMhx8qCoCZggTpbVCSFAmuZ3ekQDW8u5JAksBaFBuxUt7WXyhnVYUefdRgycecxEwLfJsPR1S8e3g8QF1S9cLYjJM1Xnq8oXXpU8nbW2DJY1EZaBdzUwiwomXZPHmXWvDcm2AFS1QnvjToQ9DakaGv4LR9HNvKxSW6DQWnohjppLLCmHDdWxH7DdeGyE5jdzrprvR6steJ6PusTtEZTuE4Mcbo7puTHypmVaYbn73QSEG3bfDDdteeQtr8mWuzvY8EHrpoL3weNR99AvWv82eKQyzQBpoyj57GjHyeNg6y3q3XeFrbZsiMwQiVkpanG9kM7FjA4FB69mKU4aaJF1xE4SZPCX5pP65tddxJy8yTHfcYJagEEfgtTXEw28pbWmhAyeDxpUZQxkwmThUp7NaXiJeh6tAAqKgBienaNFzeo4jGUKpepax57dfaMMd1rtgwXfdhaRKh8usuZpMJVdCsgwAJ2uVVyuLxWezaXBoHHbxdnWUi5qmbC6VYRuzygjJEDsiFB354hSTGtknuRhgviQP8wH8VP2xFrcb8YgkRx9NKN8xBfr8GPT4DEWXPVpXALa3ACo2zPcAmBdDLXsvL67mhgW1h6uKuSBaXf8VXmGpjmkNhFUQCETEuiKtNTcZxuJt5FaZWcWF698ZuArNvf2ZDr8phAdr2v75wQQN5YuuErPy2UMTK7jYaVk8JNv9nRYVKZ5P5erkfhYnXJsdTd',
  privKey: {
    prv1: 'e2PZP3FYBU3G3gkRXXZkYPtye2ZqFrbSA13uDiutLK5ercixX',
    prv2: 'NvmH6ywEhRDocnFnGGQ8qs1PVaTBhRYy7M9Xu1MkvZVCk4paj'
  },
  outputs: [
    {
      outputID: 7,
      amount: '1000000000',
      txid: 'WEyBXMUH1vk9XvjnSo64WV6rWn39Q9BtDixF9ASn3fLu2KHJE',
      outputidx: '111AZw1it'
    },
    {
      outputID: 7,
      amount: '1000000000',
      txid: 'WZPN4NBv85sZA1aMUTQcaBhuoKp9nN8pbpthuzYtmCWgeWMde',
      outputidx: '111AZw1it'
    },
    {
      outputID: 7,
      amount: '994000000',
      txid: 'WEyBXMUH1vk9XvjnSo64WV6rWn39Q9BtDixF9ASn3fLu2KHJE',
      outputidx: '1111XiaYg'
    },
    {
      outputID: 7,
      amount: '695969420',
      txid: '2Yz9QFGrcUcuPSz72TrLZqUwd2HjUw5eovZn2QdctEd8MVbkw3',
      outputidx: '111KgrGRw'
    },
    {
      outputID: 7,
      amount: '420000000',
      txid: '2Yz9QFGrcUcuPSz72TrLZqUwd2HjUw5eovZn2QdctEd8MVbkw3',
      outputidx: '111AZw1it'
    },
    {
      outputID: 7,
      amount: '1000000',
      txid: '2Yz9QFGrcUcuPSz72TrLZqUwd2HjUw5eovZn2QdctEd8MVbkw3',
      outputidx: '1111XiaYg'
    },
    {
      outputID: 7,
      amount: '420000000',
      txid: 'mi8xMNrv8899JfHM2NwJRUSzZEHBtVtV27LdGYDkpwPdG6P5o',
      outputidx: '111AZw1it'
    },
    {
      outputID: 7,
      amount: '1000000',
      txid: 'mi8xMNrv8899JfHM2NwJRUSzZEHBtVtV27LdGYDkpwPdG6P5o',
      outputidx: '1111XiaYg'
    },
    {
      outputID: 7,
      amount: '695969420',
      txid: 'mi8xMNrv8899JfHM2NwJRUSzZEHBtVtV27LdGYDkpwPdG6P5o',
      outputidx: '111KgrGRw'
    },
    {
      outputID: 7,
      amount: '695969420',
      txid: 'UkP29BLXSNKasRxHotxrPdVcRRPtEhvJZNcB8qFi9zZvQ35vc',
      outputidx: '111KgrGRw'
    },
    {
      outputID: 7,
      amount: '420000000',
      txid: 'UkP29BLXSNKasRxHotxrPdVcRRPtEhvJZNcB8qFi9zZvQ35vc',
      outputidx: '111AZw1it'
    },
    {
      outputID: 7,
      amount: '1000000',
      txid: 'UkP29BLXSNKasRxHotxrPdVcRRPtEhvJZNcB8qFi9zZvQ35vc',
      outputidx: '1111XiaYg'
    },
    {
      outputID: 7,
      amount: '291891876',
      txid: '2dhgHu5if98zhtUHUH8stETvT7ronoJ8vDcufKwQKHCDttwT4a',
      outputidx: '1111XiaYg'
    },
    {
      outputID: 7,
      amount: '1000000000',
      txid: '25oowEVZvF6aKiQ3xYs2fK6z8pcZcRfWjjSxS7Yz1rNaSbPeL6',
      outputidx: '111AZw1it'
    },
    {
      outputID: 7,
      amount: '1000000000',
      txid: 'mc5v8FV1AqAhE5y61QZk4qCBhwBpi8b7dWpcP4G5HyLA94raJ',
      outputidx: '111AZw1it'
    },
    {
      outputID: 7,
      amount: '1000000000',
      txid: 'KqgcSjNLQuFJhyfsJaUc3usNUBGDXtpNHhCUpua1F4WY1Za6q',
      outputidx: '111AZw1it'
    },
    {
      outputID: 7,
      amount: '1000000000',
      txid: 'MrLMoZn4sadFx6xU4kH7XwGNhbsxuXN3MMypyrwPdyqXWFeQH',
      outputidx: '111AZw1it'
    },
    {
      outputID: 7,
      amount: '1000000000',
      txid: '2YCo468qnxQdoUG25wB9hqMrS2A1ReHhXH9mocWEWXatetmqVi',
      outputidx: '111AZw1it'
    },
    {
      outputID: 7,
      amount: '1509000000',
      txid: 'KqgcSjNLQuFJhyfsJaUc3usNUBGDXtpNHhCUpua1F4WY1Za6q',
      outputidx: '1111XiaYg'
    },
    {
      outputID: 7,
      amount: '1000000000',
      txid: '2LnjbFVAC1iX4WT2KwxcYR6ZHy5EAL4ehyaUiGY8qPJGwCB6DY',
      outputidx: '111AZw1it'
    },
    {
      outputID: 7,
      amount: '499000000',
      txid: '2LnjbFVAC1iX4WT2KwxcYR6ZHy5EAL4ehyaUiGY8qPJGwCB6DY',
      outputidx: '1111XiaYg'
    }
  ],
  memo: 'Manually add a delegator to the primary subnet with multisig',
  nodeID: 'NodeID-MU7UknPhH6F7kqK9brjGgg9RDNR9Y55Wg',
  startTime: '1655220372',
  endTime: '1657850372',
  minValidatorStake: '1000000000',
  pAddresses: [
    'P-fuji103cmntssp6qnucejahddy42wcy4qty0uj42822',
    'P-fuji1hdk7ntw0huhqmlhlheme9t7scsy9lhfhw3ywy4',
    'P-fuji1yzpfsdalhfwkq2ceewgs9wv7k0uft40ydpuj59'
  ],
  delegationFee: 10,
  threshold: 2,
  locktime: 0
}
