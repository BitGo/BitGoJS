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

export const INVALID_DELEGATION_FEE = BigInt(0);

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
  tx: '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',
  outputs: [
    {
      outputID: 7,
      amount: '1000000000',
      txid: 'WEyBXMUH1vk9XvjnSo64WV6rWn39Q9BtDixF9ASn3fLu2KHJE',
      threshold: 2,
      addresses:
        'P-fuji1yzpfsdalhfwkq2ceewgs9wv7k0uft40ydpuj59, P-fuji103cmntssp6qnucejahddy42wcy4qty0uj42822, P-fuji1hdk7ntw0huhqmlhlheme9t7scsy9lhfhw3ywy4, ',
      outputidx: '111AZw1it',
      locktime: '0',
    },
    {
      outputID: 7,
      amount: '1000000000',
      txid: 'WZPN4NBv85sZA1aMUTQcaBhuoKp9nN8pbpthuzYtmCWgeWMde',
      threshold: 2,
      addresses:
        'P-fuji1yzpfsdalhfwkq2ceewgs9wv7k0uft40ydpuj59, P-fuji103cmntssp6qnucejahddy42wcy4qty0uj42822, P-fuji1hdk7ntw0huhqmlhlheme9t7scsy9lhfhw3ywy4, ',
      outputidx: '111AZw1it',
      locktime: '0',
    },
    {
      outputID: 7,
      amount: '994000000',
      txid: 'WEyBXMUH1vk9XvjnSo64WV6rWn39Q9BtDixF9ASn3fLu2KHJE',
      threshold: 2,
      addresses:
        'P-fuji1yzpfsdalhfwkq2ceewgs9wv7k0uft40ydpuj59, P-fuji103cmntssp6qnucejahddy42wcy4qty0uj42822, P-fuji1hdk7ntw0huhqmlhlheme9t7scsy9lhfhw3ywy4, ',
      outputidx: '1111XiaYg',
      locktime: '0',
    },
    {
      outputID: 7,
      amount: '1000000000',
      txid: '25oowEVZvF6aKiQ3xYs2fK6z8pcZcRfWjjSxS7Yz1rNaSbPeL6',
      threshold: 2,
      addresses: 'P-fuji103cmntssp6qnucejahddy42wcy4qty0uj42822, P-fuji1hdk7ntw0huhqmlhlheme9t7scsy9lhfhw3ywy4, ',
      outputidx: '111AZw1it',
      locktime: '0',
    },
    {
      outputID: 7,
      amount: '1000000000',
      txid: 'mc5v8FV1AqAhE5y61QZk4qCBhwBpi8b7dWpcP4G5HyLA94raJ',
      threshold: 1,
      addresses: 'P-fuji103cmntssp6qnucejahddy42wcy4qty0uj42822, ',
      outputidx: '111AZw1it',
      locktime: '0',
    },
    {
      outputID: 7,
      amount: '1000000000',
      txid: 'KqgcSjNLQuFJhyfsJaUc3usNUBGDXtpNHhCUpua1F4WY1Za6q',
      threshold: 2,
      addresses: 'P-fuji103cmntssp6qnucejahddy42wcy4qty0uj42822, P-fuji1hdk7ntw0huhqmlhlheme9t7scsy9lhfhw3ywy4, ',
      outputidx: '111AZw1it',
      locktime: '0',
    },
    {
      outputID: 7,
      amount: '1000000000',
      txid: 'MrLMoZn4sadFx6xU4kH7XwGNhbsxuXN3MMypyrwPdyqXWFeQH',
      threshold: 1,
      addresses: 'P-fuji103cmntssp6qnucejahddy42wcy4qty0uj42822, ',
      outputidx: '111AZw1it',
      locktime: '0',
    },
    {
      outputID: 7,
      amount: '1000000000',
      txid: '2YCo468qnxQdoUG25wB9hqMrS2A1ReHhXH9mocWEWXatetmqVi',
      threshold: 1,
      addresses: 'P-fuji103cmntssp6qnucejahddy42wcy4qty0uj42822, ',
      outputidx: '111AZw1it',
      locktime: '0',
    },
    {
      outputID: 7,
      amount: '420000000',
      txid: '2Yz9QFGrcUcuPSz72TrLZqUwd2HjUw5eovZn2QdctEd8MVbkw3',
      threshold: 2,
      addresses:
        'P-fuji1yzpfsdalhfwkq2ceewgs9wv7k0uft40ydpuj59, P-fuji103cmntssp6qnucejahddy42wcy4qty0uj42822, P-fuji1hdk7ntw0huhqmlhlheme9t7scsy9lhfhw3ywy4, ',
      outputidx: '111AZw1it',
      locktime: '0',
    },
    {
      outputID: 7,
      amount: '1000000',
      txid: '2Yz9QFGrcUcuPSz72TrLZqUwd2HjUw5eovZn2QdctEd8MVbkw3',
      threshold: 2,
      addresses:
        'P-fuji1yzpfsdalhfwkq2ceewgs9wv7k0uft40ydpuj59, P-fuji103cmntssp6qnucejahddy42wcy4qty0uj42822, P-fuji1hdk7ntw0huhqmlhlheme9t7scsy9lhfhw3ywy4, ',
      outputidx: '1111XiaYg',
      locktime: '0',
    },
    {
      outputID: 7,
      amount: '695969420',
      txid: '2Yz9QFGrcUcuPSz72TrLZqUwd2HjUw5eovZn2QdctEd8MVbkw3',
      threshold: 2,
      addresses:
        'P-fuji1yzpfsdalhfwkq2ceewgs9wv7k0uft40ydpuj59, P-fuji103cmntssp6qnucejahddy42wcy4qty0uj42822, P-fuji1hdk7ntw0huhqmlhlheme9t7scsy9lhfhw3ywy4, ',
      outputidx: '111KgrGRw',
      locktime: '0',
    },
    {
      outputID: 7,
      amount: '695969420',
      txid: 'mi8xMNrv8899JfHM2NwJRUSzZEHBtVtV27LdGYDkpwPdG6P5o',
      threshold: 2,
      addresses:
        'P-fuji1yzpfsdalhfwkq2ceewgs9wv7k0uft40ydpuj59, P-fuji103cmntssp6qnucejahddy42wcy4qty0uj42822, P-fuji1hdk7ntw0huhqmlhlheme9t7scsy9lhfhw3ywy4, ',
      outputidx: '111KgrGRw',
      locktime: '0',
    },
    {
      outputID: 7,
      amount: '420000000',
      txid: 'mi8xMNrv8899JfHM2NwJRUSzZEHBtVtV27LdGYDkpwPdG6P5o',
      threshold: 2,
      addresses:
        'P-fuji1yzpfsdalhfwkq2ceewgs9wv7k0uft40ydpuj59, P-fuji103cmntssp6qnucejahddy42wcy4qty0uj42822, P-fuji1hdk7ntw0huhqmlhlheme9t7scsy9lhfhw3ywy4, ',
      outputidx: '111AZw1it',
      locktime: '0',
    },
    {
      outputID: 7,
      amount: '1000000',
      txid: 'mi8xMNrv8899JfHM2NwJRUSzZEHBtVtV27LdGYDkpwPdG6P5o',
      threshold: 2,
      addresses:
        'P-fuji1yzpfsdalhfwkq2ceewgs9wv7k0uft40ydpuj59, P-fuji103cmntssp6qnucejahddy42wcy4qty0uj42822, P-fuji1hdk7ntw0huhqmlhlheme9t7scsy9lhfhw3ywy4, ',
      outputidx: '1111XiaYg',
      locktime: '0',
    },
    {
      outputID: 7,
      amount: '1000000',
      txid: 'UkP29BLXSNKasRxHotxrPdVcRRPtEhvJZNcB8qFi9zZvQ35vc',
      threshold: 2,
      addresses:
        'P-fuji1yzpfsdalhfwkq2ceewgs9wv7k0uft40ydpuj59, P-fuji103cmntssp6qnucejahddy42wcy4qty0uj42822, P-fuji1hdk7ntw0huhqmlhlheme9t7scsy9lhfhw3ywy4, ',
      outputidx: '1111XiaYg',
      locktime: '0',
    },
    {
      outputID: 7,
      amount: '695969420',
      txid: 'UkP29BLXSNKasRxHotxrPdVcRRPtEhvJZNcB8qFi9zZvQ35vc',
      threshold: 2,
      addresses:
        'P-fuji1yzpfsdalhfwkq2ceewgs9wv7k0uft40ydpuj59, P-fuji103cmntssp6qnucejahddy42wcy4qty0uj42822, P-fuji1hdk7ntw0huhqmlhlheme9t7scsy9lhfhw3ywy4, ',
      outputidx: '111KgrGRw',
      locktime: '0',
    },
    {
      outputID: 7,
      amount: '420000000',
      txid: 'UkP29BLXSNKasRxHotxrPdVcRRPtEhvJZNcB8qFi9zZvQ35vc',
      threshold: 2,
      addresses:
        'P-fuji1yzpfsdalhfwkq2ceewgs9wv7k0uft40ydpuj59, P-fuji103cmntssp6qnucejahddy42wcy4qty0uj42822, P-fuji1hdk7ntw0huhqmlhlheme9t7scsy9lhfhw3ywy4, ',
      outputidx: '111AZw1it',
      locktime: '0',
    },
    {
      outputID: 7,
      amount: '291891876',
      txid: '2dhgHu5if98zhtUHUH8stETvT7ronoJ8vDcufKwQKHCDttwT4a',
      threshold: 2,
      addresses:
        'P-fuji1yzpfsdalhfwkq2ceewgs9wv7k0uft40ydpuj59, P-fuji103cmntssp6qnucejahddy42wcy4qty0uj42822, P-fuji1hdk7ntw0huhqmlhlheme9t7scsy9lhfhw3ywy4, ',
      outputidx: '1111XiaYg',
      locktime: '0',
    },
    {
      outputID: 7,
      amount: '1509000000',
      txid: 'KqgcSjNLQuFJhyfsJaUc3usNUBGDXtpNHhCUpua1F4WY1Za6q',
      threshold: 2,
      addresses: 'P-fuji103cmntssp6qnucejahddy42wcy4qty0uj42822, P-fuji1hdk7ntw0huhqmlhlheme9t7scsy9lhfhw3ywy4, ',
      outputidx: '1111XiaYg',
      locktime: '0',
    },
  ],
  memo: 'Manually add a validator to the primary subnet with multisig',
  nodeID: 'NodeID-6z161fCLZDJjvLNSPXCK1bAxkK6gjiDXc',
  startTime: '1654788616',
  endTime: '1681088616',
  minValidatorStake: '1000000000',
  pAddresses: ['P-fuji103cmntssp6qnucejahddy42wcy4qty0uj42822'],
  delegationFee: BigInt(10),
  threshold: 1,
  locktime: 0,
};
