import { KeyPair } from '../../../src/coin/hbar/keyPair';

// ACCOUNT_1 has public and private keys with prefix
export const ACCOUNT_1 = {
  accountId: '0.0.81320',
  prvKeyWithPrefix: '302e020100300506032b65700422042062b0b669de0ab5e91b4328e1431859a5ca47e7426e701019272f5c2d52825b01',
  pubKeyWithPrefix: '302a300506032b65700321005a9111b5e6881ff20b9243a42ac1a9a67fa16cd4f01e58bab30c1fe611ea8cf9',
  privateKeyBytes: Uint8Array.from(
    Buffer.from('62b0b669de0ab5e91b4328e1431859a5ca47e7426e701019272f5c2d52825b01', 'hex'),
  ),
  publicKeyBytes: Uint8Array.from(
    Buffer.from('5a9111b5e6881ff20b9243a42ac1a9a67fa16cd4f01e58bab30c1fe611ea8cf9', 'hex'),
  ),
};

export const OPERATOR = {
  accountId: '0.0.75861',
  publicKey: '302a300506032b6570032100d32b7b1eb103c10a6c8f6ec575b8002816e9725d95485b3d5509aa8c89b4528b',
  privateKey: '302e020100300506032b65700422042088b5af9484cef4b0aab6e0ba1002313fdfdfacfdf23d6d0957dc5f2c24fc3b81',
};

// ACCOUNT_2 has public and private keys without prefix
export const ACCOUNT_2 = {
  accountId: '0.0.75861',
  privateKey: '5bb72603f237c0993f7973d37fdade32c71aa94aee686aa79d260acba1882d9a',
  publicKey: '592a4fbb7263c59d450e651df96620dc9208ee7c7d9d6f2fdcb91c53f8831261',
};

// ACCOUNT_3 has public and private keys without prefix
export const ACCOUNT_3 = {
  accountId: '0.0.78963',
  privateKey: '310a775bcc36016275d64cb8e4508e19437708852e42a3948a641b664be800a9',
  publicKey: 'fa344793601cef71348f994f30a168c2dd55f357426a180a5a724d7e03585e91',
};

export const ed25519PrivKeyPrefix = '302e020100300506032b657004220420';

export const ed25519PubKeyPrefix = '302a300506032b6570032100';

export const OWNER1 = ACCOUNT_1.pubKeyWithPrefix;

export const OWNER2 = ACCOUNT_2.publicKey;

export const OWNER3 = ACCOUNT_3.publicKey;

export const FEE = '1000000000';

export const VALID_ADDRESS = { address: '10.0.24141' };

export const INVALID_ADDRESS = { address: '1002.4141' };

export const WALLET_INITIALIZATION =
  '229f010a100a080888e1e0f8051000120418d5d00412021804188094ebdc03220208785a7d0a722a700802126c0a2212201c5b8332673e2bdd7d677970e549e05157ea6a94f41a5da5020903c1c391f8ef0a221220265f7cc91c0330ef27a626ff8688da761ab0543d33ba63c8315e2c91b6c595af0a22122003ad12643db2a6ba5cf8a1da14d4bd5ee46625f88886d01cc70d2d9c6ee2266610004a0508d0c8e103';

export const NON_SIGNED_TRANSFER_TRANSACTION =
  '223d0a140a0c089ded8af90510aac5d8b101120418a8fb04120318a912188094ebdc032202087872160a140a080a0418a8fb0410130a080a0418d5d0041014';

export const SIGNED_TRANSFER_TRANSACTION =
  '1a660a640a205a9111b5e6881ff20b9243a42ac1a9a67fa16cd4f01e58bab30c1fe611ea8cf91a4036d6e70692d0ea144de858fd8130ce27c0dd967f9df42c1706583026616121908ef02cabe05df1b52623b4803d2a17675e788df9e5fa8159391249b54d8a2507223d0a140a0c089ded8af90510aac5d8b101120418a8fb04120318a912188094ebdc032202087872160a140a080a0418a8fb0410130a080a0418d5d0041014';

export const THREE_TIMES_SIGNED_TRANSACTION =
  '1ab2020a640a205a9111b5e6881ff20b9243a42ac1a9a67fa16cd4f01e58bab30c1fe611ea8cf91a406bd655804a64e3c03b7a77216727a57dddbf485405eb0e9300fb83730ec1d2c1e7ea5d6566cccb6516ab982df5e6180b475c0eaa5d65f2cddb08a8125b5975010a640a20592a4fbb7263c59d450e651df96620dc9208ee7c7d9d6f2fdcb91c53f88312611a407e644d4262246b8fe6a89181a01b5462ea42c64b2523aa29f2dbe279165c333e303213255d2c2b36adaa71ffbc4779bbb94f5bb0ee0d49c903a1fdb83d9e7f050a640a20fa344793601cef71348f994f30a168c2dd55f357426a180a5a724d7e03585e911a406215401188ca0f40c22d21b3c9f2eec971eb4ab0f27ba4906837924e164b3836755ea621d2ef3a391b228aadeab3e87db7c016d22e33283090b1b65d34ff4a0e223c0a140a0c089ded8af90510aac5d8b101120418a8fb0412021804188094ebdc032202087872160a140a080a0418a8fb0410130a080a0418d5d0041014';

export const ENCODED_TRANSACTION = 'not defined';

export const errorMessageInvalidPrivateKey = 'Invalid private key';

export const errorMessageInvalidPublicKey = 'Invalid public key:';

export const errorMessageMissingPrivateKey = 'Missing private key';

export const errorMessageNotPossibleToDeriveAddress = 'Address derivation is not supported in Hedera';

export const errorMessageFailedToParse = 'Failed to parse correct key';

export const INVALID_KEYPAIR_PRV = new KeyPair({
  prv: '8CAA00AE63638B0542A304823D66D96FF317A576F692663DB2F85E60FAB2590C',
});

export const KEYPAIR_PRV = new KeyPair({
  prv: '302e020100300506032b65700422042062b0b669de0ab5e91b4328e1431859a5ca47e7426e701019272f5c2d52825b01',
});

export const WALLET_TXDATA = Uint8Array.from(
  Buffer.from(
    '22a3010a140a0c0883aa91f9051080feab9b01120418d5d00412021804188094ebdc03220208785a7d0a722a700802126c0a2212205a9111b5e6881ff20b9243a42ac1a9a67fa16cd4f01e58bab30c1fe611ea8cf90a221220592a4fbb7263c59d450e651df96620dc9208ee7c7d9d6f2fdcb91c53f88312610a221220fa344793601cef71348f994f30a168c2dd55f357426a180a5a724d7e03585e9110004a0508d0c8e103',
    'hex',
  ),
);

export const WALLET_SIGNED_TRANSACTION =
  '1a660a640a205a9111b5e6881ff20b9243a42ac1a9a67fa16cd4f01e58bab30c1fe611ea8cf91a40ff00c43d4da6d33abf90b2de7d36db8cea62248a6b8ef35be7741c43e762f1208fe5224ac79cd53e59df48913418e976320f789a091cf67a23278a12781b490d22a3010a140a0c0883aa91f9051080feab9b01120418d5d00412021804188094ebdc03220208785a7d0a722a700802126c0a2212205a9111b5e6881ff20b9243a42ac1a9a67fa16cd4f01e58bab30c1fe611ea8cf90a221220592a4fbb7263c59d450e651df96620dc9208ee7c7d9d6f2fdcb91c53f88312610a221220fa344793601cef71348f994f30a168c2dd55f357426a180a5a724d7e03585e9110004a0508d0c8e103';

export const WALLET_BUILDER_SIGNED_TRANSACTION =
  '1a660a640a20d32b7b1eb103c10a6c8f6ec575b8002816e9725d95485b3d5509aa8c89b4528b1a4093fc2d333fd3382d063037f171d47c2141ec4d57bcda3d41f9c8c7f28d6588dcf214fa0c454206202e054f76352788c9751ffb9a48370c67a9b620bcb140100822b6010a140a0c089ded8af90510aac5d8b101120418d5d00412021804188094ebdc03220208785a8f010a722a700802126c0a2212205a9111b5e6881ff20b9243a42ac1a9a67fa16cd4f01e58bab30c1fe611ea8cf90a221220592a4fbb7263c59d450e651df96620dc9208ee7c7d9d6f2fdcb91c53f88312610a221220fa344793601cef71348f994f30a168c2dd55f357426a180a5a724d7e03585e9130ffffffffffffffff7f38ffffffffffffffff7f4a0508d0c8e103';

export const WALLET_BUILDER_SIGNED_TWICE_TRANSACTION =
  '1acc010a640a20d32b7b1eb103c10a6c8f6ec575b8002816e9725d95485b3d5509aa8c89b4528b1a4093fc2d333fd3382d063037f171d47c2141ec4d57bcda3d41f9c8c7f28d6588dcf214fa0c454206202e054f76352788c9751ffb9a48370c67a9b620bcb14010080a640a205a9111b5e6881ff20b9243a42ac1a9a67fa16cd4f01e58bab30c1fe611ea8cf91a40e9b65b38bfc0042f8407c9e4b03fc211112c6656d491a08dda2f419e9694ead7331f70275adb44ec6f854b95b3f0d0e1ae546db7980b9df662b3b4c58e8c1d0b22b6010a140a0c089ded8af90510aac5d8b101120418d5d00412021804188094ebdc03220208785a8f010a722a700802126c0a2212205a9111b5e6881ff20b9243a42ac1a9a67fa16cd4f01e58bab30c1fe611ea8cf90a221220592a4fbb7263c59d450e651df96620dc9208ee7c7d9d6f2fdcb91c53f88312610a221220fa344793601cef71348f994f30a168c2dd55f357426a180a5a724d7e03585e9130ffffffffffffffff7f38ffffffffffffffff7f4a0508d0c8e103';

export const WALLET_INIT_2_OWNERS =
  '227f0a140a0c089ded8af90510aac5d8b101120418d5d00412021804188094ebdc03220208785a590a4e2a4c080212480a2212205a9111b5e6881ff20b9243a42ac1a9a67fa16cd4f01e58bab30c1fe611ea8cf90a221220592a4fbb7263c59d450e651df96620dc9208ee7c7d9d6f2fdcb91c53f883126110004a0508d0c8e103';

export const TRANSFER_TRANSACTION_WITH_MEMO =
  '22500a140a0c089ded8af90510aac5d8b101120418a8fb0412021804188094ebdc032202087832125468697320697320616e206578616d706c6572160a140a080a0418a8fb0410130a080a0418d5d0041014';

export const SINGLE_SIG_TRANSFER_DATA = {
  sigmap: {
    sigpairList: [
      {
        pubkeyprefix: 'WpERteaIH/ILkkOkKsGppn+hbNTwHli6swwf5hHqjPk=',
        contract: '',
        ed25519: 'NtbnBpLQ6hRN6Fj9gTDOJ8Ddln+d9CwXBlgwJmFhIZCO8Cyr4F3xtSYjtIA9KhdnXniN+eX6gVk5Ekm1TYolBw==',
        rsa3072: '',
        ecdsa384: '',
      },
    ],
  },
  body: {
    transactionid: {
      transactionvalidstart: { seconds: 1596110493, nanos: 372646570 },
      accountid: { shardnum: 0, realmnum: 0, accountnum: 81320 },
    },
    nodeaccountid: { shardnum: 0, realmnum: 0, accountnum: 2345 },
    transactionfee: '1000000000',
    transactionvalidduration: { seconds: 120 },
    generaterecord: false,
    memo: '',
    cryptotransfer: {
      transfers: {
        accountamountsList: [
          { accountid: { shardnum: 0, realmnum: 0, accountnum: 81320 }, amount: '-10' },
          { accountid: { shardnum: 0, realmnum: 0, accountnum: 75861 }, amount: '10' },
        ],
      },
    },
  },
  bodybytes: 'ChQKDAid7Yr5BRCqxdixARIEGKj7BBIDGKkSGICU69wDIgIIeHIWChQKCAoEGKj7BBATCggKBBjV0AQQFA==',
  hash: '8ee195bcbd6a8bcd9fc39c7ccaec54a2c8620f0059ea571c0f842d203afc424dd72c3ecd64396a1fe9dcda60d3b17092',
};

export const THREE_TIMES_SIG_TRANSFER_DATA = {
  sigmap: {
    sigpairList: [
      {
        pubkeyprefix: 'WpERteaIH/ILkkOkKsGppn+hbNTwHli6swwf5hHqjPk=',
        contract: '',
        ed25519: 'a9ZVgEpk48A7enchZyelfd2/SFQF6w6TAPuDcw7B0sHn6l1lZszLZRarmC315hgLR1wOql1l8s3bCKgSW1l1AQ==',
        rsa3072: '',
        ecdsa384: '',
      },
      {
        pubkeyprefix: 'WSpPu3JjxZ1FDmUd+WYg3JII7nx9nW8v3LkcU/iDEmE=',
        contract: '',
        ed25519: 'fmRNQmIka4/mqJGBoBtUYupCxkslI6op8tvieRZcMz4wMhMlXSwrNq2qcf+8R3m7uU9bsO4NSckDof24PZ5/BQ==',
        rsa3072: '',
        ecdsa384: '',
      },
      {
        pubkeyprefix: '+jRHk2Ac73E0j5lPMKFowt1V81dCahgKWnJNfgNYXpE=',
        contract: '',
        ed25519: 'YhVAEYjKD0DCLSGzyfLuyXHrSrDye6SQaDeSThZLODZ1XqYh0u86ORsiiq3qs+h9t8AW0i4zKDCQsbZdNP9KDg==',
        rsa3072: '',
        ecdsa384: '',
      },
    ],
  },
  body: {
    transactionid: {
      transactionvalidstart: { seconds: 1596110493, nanos: 372646570 },
      accountid: { shardnum: 0, realmnum: 0, accountnum: 81320 },
    },
    nodeaccountid: { shardnum: 0, realmnum: 0, accountnum: 4 },
    transactionfee: '1000000000',
    transactionvalidduration: { seconds: 120 },
    generaterecord: false,
    memo: '',
    cryptotransfer: {
      transfers: {
        accountamountsList: [
          { accountid: { shardnum: 0, realmnum: 0, accountnum: 81320 }, amount: '-10' },
          { accountid: { shardnum: 0, realmnum: 0, accountnum: 75861 }, amount: '10' },
        ],
      },
    },
  },
  bodybytes: 'ChQKDAid7Yr5BRCqxdixARIEGKj7BBICGAQYgJTr3AMiAgh4chYKFAoICgQYqPsEEBMKCAoEGNXQBBAU',
  hash: '56ba44a112c7ac70cd5ddbb41c9acc7442dab3a214f696ded81e2f72c7ec0e3cab35fe6e193148b890d3c885005102ba',
};

export const NON_SIGNED_TRANSFER_DATA = {
  body: {
    transactionid: {
      transactionvalidstart: { seconds: 1596110493, nanos: 372646570 },
      accountid: { shardnum: 0, realmnum: 0, accountnum: 81320 },
    },
    nodeaccountid: { shardnum: 0, realmnum: 0, accountnum: 2345 },
    transactionfee: '1000000000',
    transactionvalidduration: { seconds: 120 },
    generaterecord: false,
    memo: '',
    cryptotransfer: {
      transfers: {
        accountamountsList: [
          { accountid: { shardnum: 0, realmnum: 0, accountnum: 81320 }, amount: '-10' },
          { accountid: { shardnum: 0, realmnum: 0, accountnum: 75861 }, amount: '10' },
        ],
      },
    },
  },
  bodybytes: 'ChQKDAid7Yr5BRCqxdixARIEGKj7BBIDGKkSGICU69wDIgIIeHIWChQKCAoEGKj7BBATCggKBBjV0AQQFA==',
};

export const WALLET_INIT_TRANSACTION_DATA = {
  sigmap: {
    sigpairList: [
      {
        pubkeyprefix: '0yt7HrEDwQpsj27FdbgAKBbpcl2VSFs9VQmqjIm0Uos=',
        contract: '',
        ed25519: 'k/wtMz/TOC0GMDfxcdR8IUHsTVe82j1B+cjH8o1liNzyFPoMRUIGIC4FT3Y1J4jJdR/7mkg3DGeptiC8sUAQCA==',
        rsa3072: '',
        ecdsa384: '',
      },
    ],
  },
  body: {
    transactionid: {
      transactionvalidstart: { seconds: 1596110493, nanos: 372646570 },
      accountid: { shardnum: 0, realmnum: 0, accountnum: 75861 },
    },
    nodeaccountid: { shardnum: 0, realmnum: 0, accountnum: 4 },
    transactionfee: '1000000000',
    transactionvalidduration: { seconds: 120 },
    generaterecord: false,
    memo: '',
    cryptocreateaccount: {
      key: {
        ed25519: '',
        rsa3072: '',
        ecdsa384: '',
        thresholdkey: {
          threshold: 2,
          keys: {
            keysList: [
              { ed25519: 'WpERteaIH/ILkkOkKsGppn+hbNTwHli6swwf5hHqjPk=', rsa3072: '', ecdsa384: '' },
              { ed25519: 'WSpPu3JjxZ1FDmUd+WYg3JII7nx9nW8v3LkcU/iDEmE=', rsa3072: '', ecdsa384: '' },
              { ed25519: '+jRHk2Ac73E0j5lPMKFowt1V81dCahgKWnJNfgNYXpE=', rsa3072: '', ecdsa384: '' },
            ],
          },
        },
      },
      initialbalance: '0',
      sendrecordthreshold: '9223372036854775807',
      receiverecordthreshold: '9223372036854775807',
      receiversigrequired: false,
      autorenewperiod: { seconds: 7890000 },
    },
  },
  bodybytes:
    'ChQKDAid7Yr5BRCqxdixARIEGNXQBBICGAQYgJTr3AMiAgh4Wo8BCnIqcAgCEmwKIhIgWpERteaIH/ILkkOkKsGppn+hbNTwHli6swwf5hHqjPkKIhIgWSpPu3JjxZ1FDmUd+WYg3JII7nx9nW8v3LkcU/iDEmEKIhIg+jRHk2Ac73E0j5lPMKFowt1V81dCahgKWnJNfgNYXpEw//////////9/OP//////////f0oFCNDI4QM=',
  hash: '9c973cf8cd54d57c169007ecaee3c8390557472aafe7ffd98956a880458a21ac483002f147abe02c5fd2935b9ed0bc0b',
};
