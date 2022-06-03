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
  tx: '11111GfzYL4PBuruWSqi657fTPhkzCCP886Csme2aLgnU2YMaV7NtiKSiGXM1VD4Esp6rxtsLnPf7YCTaxrqavBM4T4oV7Zm1BmM7udN5jBkn1DiibG5joHBXws9fZiGtRgSQZcqWqZ6zdcuBoHJsF5cgPrX9L1WKFfqdMDqStFcovcxsPoGQu7A2JmZxSQg9T1cG7GLNNuY2qV3L1MNPTP3zFMLoWTbW6WSF3g97bTGyxFpsNRA5PkKzGvMyaXY8CN2vn62ob6AJQRogB68NwLjJ7up43sNzJpdukvFQnc1VcgQp7CcRJQMH92P4wUzi3xBzPucBHgZfVykuUuwXdvEr6eK97SCLYfGnFRdPdXZGNopwpBtu3NsLnoff5FbXVtfh7WUgTdhMciUft1YcbqNin8mT1nhrvrwJD25CHbCtzDZJt1qpwedubVCf1FRxKDXrj2dCTGzgZsEFtEzasxqqgYwDZyJKhahyVdCAR6ewCdspKaozabAJgw912ePG218VU9cxbmJfX7AdnNDL3BP9hQaYHr2AkMNMUP6ASKcQR2VdZobKRcBaVakWZvpA2R4ZGsgDqqupXuFnGURVpQjt2tzPoD1oTxS5cxHp35HUwomKbeKZeKVK8Tm9QRDqQ2QjJe43gQyxQuHgChKWdQWjdeFkCP9DXBkhbLFxuH5AnGoAUeaigGf1Jsgwb5r1qtXdfdmYfYjjdE4e3m2VAXuXEY2NvL3NaueCFhu1NXUBf3FtB9TN2fdfSKC9oPJLkNUyoHTJhXikm7CJPRxguAvooD9QqTjTdbrjnqsjZzxscoGfDe9x4QQqYMhiiM4qsPYHcNx7F7d8PU94JrEzsYcopCbmnUAQeT4HpQ6wddGK7JcVcfMUANDPJeyVoko2H5LR6gcJhb7JC',
  signedTx:
    '111119UqDgCGgNfT62858TjZ3udX11RGwUiGABjZtxiXmFkmZzs7FzxynE1d87yYtyQpPiWW8jzMMkQGzfyeZBVNE85bYcyMNAaNZ6CYUKkJiuhLryA3oWZnktA86kBji55M5bQU88KshKqmQVgk41oPs1NPdjfq2mvkyVqGvW9oTuR3e5K9vcqCESLTJAuuQwGaH1Pyn2N737QFQumxsAG1Mx19JFUkJGvn3Vcdq62CnaHC7WyS8jxw43FcHXrQQD98tizimVZvMSFcpprr9pNp8avdk9L3QRFDeeTSpdZSSXJyg99nYcrZWwvYzqbVemvMLr4vBc7DKUGfoKvos7WDgbeR168FdTXqWksGp36YjdFULeHoxjP5MxmrjjfUmDoro61LNyD5QXnbWoYfnGLMNQ6QqLnd1Ph4guCQ5jRgTwnVEghNMXfPHyVw6mXhZ8yz7HSa88S4CX78MJijuNQYz6HPLkqSVFYohJPP77DWQZS215KtfAgT1ogZ8TEjeQxaEXfUvTe2NG9KHzJ6ffQkSY3W8USbeJfsmnv93cSpXAoQq7CXUCXcosBSmuAkk7Srzi4kr8vKtcwPMY4Hf9QFKLwEz55QwBkYFojmoazMLoRXSLYzBKzupEXKRo7xummhZgd7cWB3uCxUvsV9k7uCy33hFZd9v5F1UUt5XbDGdiYmd5sEPdCDPztR2yn68b1utjx3iUXrX1SVxzj5f8uyMDbgwC2yppUP9D73aQxvwJmJd6t9ArZe5jrBsoP6tSQV9vHYhQazDNhLrz5YLGdcTw9ZE1wq91NxQnZ53h3xYaqUir2Somx8RNkEDeQTvDZoEsRowbUDvNNQdHg481ec5gfvuspE4iKyZJerZakdPSVEUTsZ7BGbgGFxm5HvewpuSwGsZQxAJAGdbS41xKJFtiEL6LNB8QpRaCiNTzKtF23BmvyMJY3MmobBoqNboNNMsREu9eGvToVCLvvEPq3SzqhPmUKbvhzCeHVBzrRKkPWDi33rNCWUyxQAoJi2t88Vd8JQRngP8hSmfJutGU4WXBpoeH3Lc2or45CxEBgShvCsCDpUbsDN8weWBJ2fhGAqfJP5588hsQXFkx9yojEVB8x',
  privKey1: { prv: undefined },
  privKey2: { prv: undefined },
  outputs: [
    {
      outputID: 7,
      amount: '1000000000',
      txid: 'WEyBXMUH1vk9XvjnSo64WV6rWn39Q9BtDixF9ASn3fLu2KHJE',
      outputidx: '111AZw1it',
    },
    {
      outputID: 7,
      amount: '1000000000',
      txid: 'WZPN4NBv85sZA1aMUTQcaBhuoKp9nN8pbpthuzYtmCWgeWMde',
      outputidx: '111AZw1it',
    },
    {
      outputID: 7,
      amount: '994000000',
      txid: 'WEyBXMUH1vk9XvjnSo64WV6rWn39Q9BtDixF9ASn3fLu2KHJE',
      outputidx: '1111XiaYg',
    },
    {
      outputID: 7,
      amount: '420000000',
      txid: '2Yz9QFGrcUcuPSz72TrLZqUwd2HjUw5eovZn2QdctEd8MVbkw3',
      outputidx: '111AZw1it',
    },
    {
      outputID: 7,
      amount: '1000000',
      txid: '2Yz9QFGrcUcuPSz72TrLZqUwd2HjUw5eovZn2QdctEd8MVbkw3',
      outputidx: '1111XiaYg',
    },
    {
      outputID: 7,
      amount: '695969420',
      txid: '2Yz9QFGrcUcuPSz72TrLZqUwd2HjUw5eovZn2QdctEd8MVbkw3',
      outputidx: '111KgrGRw',
    },
    {
      outputID: 7,
      amount: '695969420',
      txid: 'mi8xMNrv8899JfHM2NwJRUSzZEHBtVtV27LdGYDkpwPdG6P5o',
      outputidx: '111KgrGRw',
    },
    {
      outputID: 7,
      amount: '420000000',
      txid: 'mi8xMNrv8899JfHM2NwJRUSzZEHBtVtV27LdGYDkpwPdG6P5o',
      outputidx: '111AZw1it',
    },
    {
      outputID: 7,
      amount: '1000000',
      txid: 'mi8xMNrv8899JfHM2NwJRUSzZEHBtVtV27LdGYDkpwPdG6P5o',
      outputidx: '1111XiaYg',
    },
    {
      outputID: 7,
      amount: '1000000',
      txid: 'UkP29BLXSNKasRxHotxrPdVcRRPtEhvJZNcB8qFi9zZvQ35vc',
      outputidx: '1111XiaYg',
    },
    {
      outputID: 7,
      amount: '695969420',
      txid: 'UkP29BLXSNKasRxHotxrPdVcRRPtEhvJZNcB8qFi9zZvQ35vc',
      outputidx: '111KgrGRw',
    },
    {
      outputID: 7,
      amount: '420000000',
      txid: 'UkP29BLXSNKasRxHotxrPdVcRRPtEhvJZNcB8qFi9zZvQ35vc',
      outputidx: '111AZw1it',
    },
    {
      outputID: 7,
      amount: '291891876',
      txid: '2dhgHu5if98zhtUHUH8stETvT7ronoJ8vDcufKwQKHCDttwT4a',
      outputidx: '1111XiaYg',
    },
    {
      outputID: 7,
      amount: '1000000000',
      txid: '25oowEVZvF6aKiQ3xYs2fK6z8pcZcRfWjjSxS7Yz1rNaSbPeL6',
      outputidx: '111AZw1it',
    },
    {
      outputID: 7,
      amount: '1000000000',
      txid: 'mc5v8FV1AqAhE5y61QZk4qCBhwBpi8b7dWpcP4G5HyLA94raJ',
      outputidx: '111AZw1it',
    },
    {
      outputID: 7,
      amount: '1000000000',
      txid: 'KqgcSjNLQuFJhyfsJaUc3usNUBGDXtpNHhCUpua1F4WY1Za6q',
      outputidx: '111AZw1it',
    },
    {
      outputID: 7,
      amount: '1000000000',
      txid: 'MrLMoZn4sadFx6xU4kH7XwGNhbsxuXN3MMypyrwPdyqXWFeQH',
      outputidx: '111AZw1it',
    },
    {
      outputID: 7,
      amount: '1000000000',
      txid: '2YCo468qnxQdoUG25wB9hqMrS2A1ReHhXH9mocWEWXatetmqVi',
      outputidx: '111AZw1it',
    },
    {
      outputID: 7,
      amount: '1509000000',
      txid: 'KqgcSjNLQuFJhyfsJaUc3usNUBGDXtpNHhCUpua1F4WY1Za6q',
      outputidx: '1111XiaYg',
    },
    {
      outputID: 7,
      amount: '1000000000',
      txid: '2LnjbFVAC1iX4WT2KwxcYR6ZHy5EAL4ehyaUiGY8qPJGwCB6DY',
      outputidx: '111AZw1it',
    },
    {
      outputID: 7,
      amount: '499000000',
      txid: '2LnjbFVAC1iX4WT2KwxcYR6ZHy5EAL4ehyaUiGY8qPJGwCB6DY',
      outputidx: '1111XiaYg',
    },
  ],
  memo: 'Manually add a delegator to the primary subnet with multisig',
  nodeID: 'NodeID-MU7UknPhH6F7kqK9brjGgg9RDNR9Y55Wg',
  startTime: '1655148889',
  endTime: '1657778889',
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
