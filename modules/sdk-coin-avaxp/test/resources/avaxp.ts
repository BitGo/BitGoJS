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
  privkeyHex: '5411413624d3f73603758c1931f41bafac4431da835d897a426d127a827d4e93',
  pubkey: '7BTbkCREwhkwow9qB4ncVZDk674XjS3zAcFbbpYrFfAe9JtGhu',
  pubkeyHex: '032dec92a0329f10731b06d05dfd439b3c0147e4be3c63501e8bc26486ef404d63',
  address: 'P-fuji103cmntssp6qnucejahddy42wcy4qty0uj42822',
};

export const ACCOUNT_4 = {
  privkey: 'PrivateKey-NvmH6ywEhRDocnFnGGQ8qs1PVaTBhRYy7M9Xu1MkvZVCk4paj',
  privkeyHex: '31c9af84056952693e2db5ca1ddbdad62f0e40d5cac51b29a7e2fba52ae72677',
  pubkey: '5jtw1Bs3E2vGYKQ4DSZ8CB4b15itTKGtR2GuRwW4EEnP5T9akE',
  pubkeyHex: '02702efd41be3bcff312c813750306e1d2b1cdaa49b1dd5323a319161c6374d828',
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

export const INVALID_ADDRESS = 'INVALID-ADDRESS';

export const VALID_ADDRESS = 'avax14hhmsl9um7e9xjwqgvkf9rswq0y0zk9te8plfv';

export const VALID_BLOCK_ID = '0xe593ee0c4b2a53a770f98720ebcb676d8e55102826c4e4ecc5112da9cf737d57';

export const INVALID_BLOCK_ID = 'b78aad20239b2f9de8efa1a6ee1f44cd50ca67bd3e431e43e5f359937d25c3e3';

export const INVALID_BLOCK_ID_LENGTH = '0xb78aad20239b2f9de8efa1a6ee1f44cd50ca67bd3e431e43e5f359937d25c3e';

// From https://github.com/BitGo/coins-sandbox/blob/fb9e7b9290f55628b663d160e49cf22231bce06a/avax/p/addDelegatorTx.ts#L316-L327
export const ADDVALIDATOR_SAMPLES = {
  unsignedTxHex:
    '00000000000c000000050000000000000000000000000000000000000000000000000000000000000000000000013d9bdac0ed1d761330cf680efdeb1a42159eb387d6d2950c96f7d28f61bbe2aa000000070000000023484fb10000000000000000000000020000000320829837bfba5d602b19cb9102b99eb3f895d5e47c71b9ae100e813e6332eddad2554ec12a0591fcbb6de9adcfbf2e0dfeffbe7792afd0c4085fdd37000000024f194d8e066b11dfe92f593cfa5c2fa1ae450927ecd5b093952e61834f4d8aa4000000013d9bdac0ed1d761330cf680efdeb1a42159eb387d6d2950c96f7d28f61bbe2aa00000005000000003b9aca00000000020000000000000001f46bffcdbda996c402119927fb9b752690effb161412f1de8685d1225acfc8ff000000003d9bdac0ed1d761330cf680efdeb1a42159eb387d6d2950c96f7d28f61bbe2aa0000000500000000235791f10000000200000000000000010000003e003c4d616e75616c6c792061646420612064656c656761746f7220746f20746865207072696d617279207375626e65742077697468206d756c746973696794a8b8179f0b6e7e7ce55b4d6ec5ad56dae1de9f0000000062bb03e60000000062e32556000000003b9aca00000000013d9bdac0ed1d761330cf680efdeb1a42159eb387d6d2950c96f7d28f61bbe2aa00000007000000003b9aca000000000000000000000000020000000320829837bfba5d602b19cb9102b99eb3f895d5e47c71b9ae100e813e6332eddad2554ec12a0591fcbb6de9adcfbf2e0dfeffbe7792afd0c4085fdd370000000b0000000000000000000000020000000320829837bfba5d602b19cb9102b99eb3f895d5e47c71b9ae100e813e6332eddad2554ec12a0591fcbb6de9adcfbf2e0dfeffbe7792afd0c4085fdd37000186a000000002000000090000000200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000007c71b9ae100e813e6332eddad2554ec12a0591fc000000090000000200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000007c71b9ae100e813e6332eddad2554ec12a0591fcc1af91c0',
  halfsigntxHex:
    '00000000000c000000050000000000000000000000000000000000000000000000000000000000000000000000013d9bdac0ed1d761330cf680efdeb1a42159eb387d6d2950c96f7d28f61bbe2aa000000070000000023484fb10000000000000000000000020000000320829837bfba5d602b19cb9102b99eb3f895d5e47c71b9ae100e813e6332eddad2554ec12a0591fcbb6de9adcfbf2e0dfeffbe7792afd0c4085fdd37000000024f194d8e066b11dfe92f593cfa5c2fa1ae450927ecd5b093952e61834f4d8aa4000000013d9bdac0ed1d761330cf680efdeb1a42159eb387d6d2950c96f7d28f61bbe2aa00000005000000003b9aca00000000020000000000000001f46bffcdbda996c402119927fb9b752690effb161412f1de8685d1225acfc8ff000000003d9bdac0ed1d761330cf680efdeb1a42159eb387d6d2950c96f7d28f61bbe2aa0000000500000000235791f10000000200000000000000010000003e003c4d616e75616c6c792061646420612064656c656761746f7220746f20746865207072696d617279207375626e65742077697468206d756c746973696794a8b8179f0b6e7e7ce55b4d6ec5ad56dae1de9f0000000062bb03e60000000062e32556000000003b9aca00000000013d9bdac0ed1d761330cf680efdeb1a42159eb387d6d2950c96f7d28f61bbe2aa00000007000000003b9aca000000000000000000000000020000000320829837bfba5d602b19cb9102b99eb3f895d5e47c71b9ae100e813e6332eddad2554ec12a0591fcbb6de9adcfbf2e0dfeffbe7792afd0c4085fdd370000000b0000000000000000000000020000000320829837bfba5d602b19cb9102b99eb3f895d5e47c71b9ae100e813e6332eddad2554ec12a0591fcbb6de9adcfbf2e0dfeffbe7792afd0c4085fdd37000186a00000000200000009000000020000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000db92a6052d7022bb916bc71ae15c89febff4efb5353bece4cae70ba0f507a8b71a19cd9916e133c93102084971dce25e3bda5414b227fd579c04eed8ff7aecba0100000009000000020000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000db92a6052d7022bb916bc71ae15c89febff4efb5353bece4cae70ba0f507a8b71a19cd9916e133c93102084971dce25e3bda5414b227fd579c04eed8ff7aecba01ecc8a474',
  fullsigntxHex:
    '00000000000c000000050000000000000000000000000000000000000000000000000000000000000000000000013d9bdac0ed1d761330cf680efdeb1a42159eb387d6d2950c96f7d28f61bbe2aa000000070000000023484fb10000000000000000000000020000000320829837bfba5d602b19cb9102b99eb3f895d5e47c71b9ae100e813e6332eddad2554ec12a0591fcbb6de9adcfbf2e0dfeffbe7792afd0c4085fdd37000000024f194d8e066b11dfe92f593cfa5c2fa1ae450927ecd5b093952e61834f4d8aa4000000013d9bdac0ed1d761330cf680efdeb1a42159eb387d6d2950c96f7d28f61bbe2aa00000005000000003b9aca00000000020000000000000001f46bffcdbda996c402119927fb9b752690effb161412f1de8685d1225acfc8ff000000003d9bdac0ed1d761330cf680efdeb1a42159eb387d6d2950c96f7d28f61bbe2aa0000000500000000235791f10000000200000000000000010000003e003c4d616e75616c6c792061646420612064656c656761746f7220746f20746865207072696d617279207375626e65742077697468206d756c746973696794a8b8179f0b6e7e7ce55b4d6ec5ad56dae1de9f0000000062bb03e60000000062e32556000000003b9aca00000000013d9bdac0ed1d761330cf680efdeb1a42159eb387d6d2950c96f7d28f61bbe2aa00000007000000003b9aca000000000000000000000000020000000320829837bfba5d602b19cb9102b99eb3f895d5e47c71b9ae100e813e6332eddad2554ec12a0591fcbb6de9adcfbf2e0dfeffbe7792afd0c4085fdd370000000b0000000000000000000000020000000320829837bfba5d602b19cb9102b99eb3f895d5e47c71b9ae100e813e6332eddad2554ec12a0591fcbb6de9adcfbf2e0dfeffbe7792afd0c4085fdd37000186a000000002000000090000000231b0afe6a959b3b0bb481c7d8c24a0ec88d709771b9d49a1f7425777a914c4ad14a6526e508077787eb8eedf790cbdcb1df09c620dec80e71a7a64b0a2905a9401db92a6052d7022bb916bc71ae15c89febff4efb5353bece4cae70ba0f507a8b71a19cd9916e133c93102084971dce25e3bda5414b227fd579c04eed8ff7aecba01000000090000000231b0afe6a959b3b0bb481c7d8c24a0ec88d709771b9d49a1f7425777a914c4ad14a6526e508077787eb8eedf790cbdcb1df09c620dec80e71a7a64b0a2905a9401db92a6052d7022bb916bc71ae15c89febff4efb5353bece4cae70ba0f507a8b71a19cd9916e133c93102084971dce25e3bda5414b227fd579c04eed8ff7aecba01946b4a8f',
  recoveryUnsignedTxHex:
    '00000000000c000000050000000000000000000000000000000000000000000000000000000000000000000000013d9bdac0ed1d761330cf680efdeb1a42159eb387d6d2950c96f7d28f61bbe2aa000000070000000023484fb10000000000000000000000020000000320829837bfba5d602b19cb9102b99eb3f895d5e47c71b9ae100e813e6332eddad2554ec12a0591fcbb6de9adcfbf2e0dfeffbe7792afd0c4085fdd37000000024f194d8e066b11dfe92f593cfa5c2fa1ae450927ecd5b093952e61834f4d8aa4000000013d9bdac0ed1d761330cf680efdeb1a42159eb387d6d2950c96f7d28f61bbe2aa00000005000000003b9aca00000000020000000000000002f46bffcdbda996c402119927fb9b752690effb161412f1de8685d1225acfc8ff000000003d9bdac0ed1d761330cf680efdeb1a42159eb387d6d2950c96f7d28f61bbe2aa0000000500000000235791f10000000200000000000000020000003e003c4d616e75616c6c792061646420612064656c656761746f7220746f20746865207072696d617279207375626e65742077697468206d756c746973696794a8b8179f0b6e7e7ce55b4d6ec5ad56dae1de9f0000000062bb03e60000000062e32556000000003b9aca00000000013d9bdac0ed1d761330cf680efdeb1a42159eb387d6d2950c96f7d28f61bbe2aa00000007000000003b9aca000000000000000000000000020000000320829837bfba5d602b19cb9102b99eb3f895d5e47c71b9ae100e813e6332eddad2554ec12a0591fcbb6de9adcfbf2e0dfeffbe7792afd0c4085fdd370000000b0000000000000000000000020000000320829837bfba5d602b19cb9102b99eb3f895d5e47c71b9ae100e813e6332eddad2554ec12a0591fcbb6de9adcfbf2e0dfeffbe7792afd0c4085fdd37000186a00000000200000009000000020000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000bb6de9adcfbf2e0dfeffbe7792afd0c4085fdd3700000009000000020000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000bb6de9adcfbf2e0dfeffbe7792afd0c4085fdd37def83b96',
  recoveryHalfsigntxHex:
    '00000000000c000000050000000000000000000000000000000000000000000000000000000000000000000000013d9bdac0ed1d761330cf680efdeb1a42159eb387d6d2950c96f7d28f61bbe2aa000000070000000023484fb10000000000000000000000020000000320829837bfba5d602b19cb9102b99eb3f895d5e47c71b9ae100e813e6332eddad2554ec12a0591fcbb6de9adcfbf2e0dfeffbe7792afd0c4085fdd37000000024f194d8e066b11dfe92f593cfa5c2fa1ae450927ecd5b093952e61834f4d8aa4000000013d9bdac0ed1d761330cf680efdeb1a42159eb387d6d2950c96f7d28f61bbe2aa00000005000000003b9aca00000000020000000000000002f46bffcdbda996c402119927fb9b752690effb161412f1de8685d1225acfc8ff000000003d9bdac0ed1d761330cf680efdeb1a42159eb387d6d2950c96f7d28f61bbe2aa0000000500000000235791f10000000200000000000000020000003e003c4d616e75616c6c792061646420612064656c656761746f7220746f20746865207072696d617279207375626e65742077697468206d756c746973696794a8b8179f0b6e7e7ce55b4d6ec5ad56dae1de9f0000000062bb03e60000000062e32556000000003b9aca00000000013d9bdac0ed1d761330cf680efdeb1a42159eb387d6d2950c96f7d28f61bbe2aa00000007000000003b9aca000000000000000000000000020000000320829837bfba5d602b19cb9102b99eb3f895d5e47c71b9ae100e813e6332eddad2554ec12a0591fcbb6de9adcfbf2e0dfeffbe7792afd0c4085fdd370000000b0000000000000000000000020000000320829837bfba5d602b19cb9102b99eb3f895d5e47c71b9ae100e813e6332eddad2554ec12a0591fcbb6de9adcfbf2e0dfeffbe7792afd0c4085fdd37000186a0000000020000000900000002000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000092f4436cad8cbee4094ba2a171476cba2e68e2365b54b22d6a1d7cfe4c81f03916616e316aaaf7ad2ff9e730e1098f69947d5cb4e7f147479f37f6b036185c32000000000900000002000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000092f4436cad8cbee4094ba2a171476cba2e68e2365b54b22d6a1d7cfe4c81f03916616e316aaaf7ad2ff9e730e1098f69947d5cb4e7f147479f37f6b036185c3200c91440e3',
  recoveryFullsigntxHex:
    '00000000000c000000050000000000000000000000000000000000000000000000000000000000000000000000013d9bdac0ed1d761330cf680efdeb1a42159eb387d6d2950c96f7d28f61bbe2aa000000070000000023484fb10000000000000000000000020000000320829837bfba5d602b19cb9102b99eb3f895d5e47c71b9ae100e813e6332eddad2554ec12a0591fcbb6de9adcfbf2e0dfeffbe7792afd0c4085fdd37000000024f194d8e066b11dfe92f593cfa5c2fa1ae450927ecd5b093952e61834f4d8aa4000000013d9bdac0ed1d761330cf680efdeb1a42159eb387d6d2950c96f7d28f61bbe2aa00000005000000003b9aca00000000020000000000000002f46bffcdbda996c402119927fb9b752690effb161412f1de8685d1225acfc8ff000000003d9bdac0ed1d761330cf680efdeb1a42159eb387d6d2950c96f7d28f61bbe2aa0000000500000000235791f10000000200000000000000020000003e003c4d616e75616c6c792061646420612064656c656761746f7220746f20746865207072696d617279207375626e65742077697468206d756c746973696794a8b8179f0b6e7e7ce55b4d6ec5ad56dae1de9f0000000062bb03e60000000062e32556000000003b9aca00000000013d9bdac0ed1d761330cf680efdeb1a42159eb387d6d2950c96f7d28f61bbe2aa00000007000000003b9aca000000000000000000000000020000000320829837bfba5d602b19cb9102b99eb3f895d5e47c71b9ae100e813e6332eddad2554ec12a0591fcbb6de9adcfbf2e0dfeffbe7792afd0c4085fdd370000000b0000000000000000000000020000000320829837bfba5d602b19cb9102b99eb3f895d5e47c71b9ae100e813e6332eddad2554ec12a0591fcbb6de9adcfbf2e0dfeffbe7792afd0c4085fdd37000186a0000000020000000900000002c96d434f8fde90d968e3a2b957b9e0cd169079959f7114cc2809c7b240b667f951e3190b66f35f1ff7a381b82a0bab34abfab35da4f6f41f51b9224f5860a9600092f4436cad8cbee4094ba2a171476cba2e68e2365b54b22d6a1d7cfe4c81f03916616e316aaaf7ad2ff9e730e1098f69947d5cb4e7f147479f37f6b036185c32000000000900000002c96d434f8fde90d968e3a2b957b9e0cd169079959f7114cc2809c7b240b667f951e3190b66f35f1ff7a381b82a0bab34abfab35da4f6f41f51b9224f5860a9600092f4436cad8cbee4094ba2a171476cba2e68e2365b54b22d6a1d7cfe4c81f03916616e316aaaf7ad2ff9e730e1098f69947d5cb4e7f147479f37f6b036185c3200402d0b2e',
  privKey: {
    prv1: 'PrivateKey-e2PZP3FYBU3G3gkRXXZkYPtye2ZqFrbSA13uDiutLK5ercixX',
    prv2: 'PrivateKey-2exwJAqDHyo35bRBpXL5Sy4yrcm9JES68tdTDC2wi3CeArDpja',
    prv3: 'PrivateKey-NvmH6ywEhRDocnFnGGQ8qs1PVaTBhRYy7M9Xu1MkvZVCk4paj',
  },
  outputs: [
    {
      outputID: 7,
      amount: '1000000000',
      txid: 'bqUUWvo1X26pBx6wHTcmEAYivCM593RK5zgFT125XzrqZVb33',
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
      amount: '592941553',
      txid: '2reRs3xLpo6jhy6d5F9uiHQ1uHyZQmh5G7phSdwCPD5LBNoHdU',
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
  nodeID: 'NodeID-EZ38CcWHoSyoEfAkDN9zaieJ5Yq64YePY',
  startTime: '1656423398',
  endTime: '1659053398',
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

export const ADD_VALIDATOR_ID_SAMPLE = {
  fullsigntxHex:
    '00000000000c000000050000000000000000000000000000000000000000000000000000000000000000000000013d9bdac0ed1d761330cf680efdeb1a42159eb387d6d2950c96f7d28f61bbe2aa00000007000000002a8d6abd0000000000000000000000020000000320829837bfba5d602b19cb9102b99eb3f895d5e47c71b9ae100e813e6332eddad2554ec12a0591fcbb6de9adcfbf2e0dfeffbe7792afd0c4085fdd37000000021da3c01318791619e5350977b2f7fb407ba3b83ff16a5bda3048d76e3f57b389000000003d9bdac0ed1d761330cf680efdeb1a42159eb387d6d2950c96f7d28f61bbe2aa00000005000000001ff23e8c000000020000000000000001c37d4d2dd4de61e2e2b91ff905b40725537be14e461aa8f9d43fe627099919b0000000053d9bdac0ed1d761330cf680efdeb1a42159eb387d6d2950c96f7d28f61bbe2aa0000000500000000464538710000000200000000000000010000003e003c4d616e75616c6c792061646420612064656c656761746f7220746f20746865207072696d617279207375626e65742077697468206d756c7469736967479f66c8be895830547e70b4b298cafd433dba6e0000000062b4ad990000000062dccf09000000003b9aca00000000013d9bdac0ed1d761330cf680efdeb1a42159eb387d6d2950c96f7d28f61bbe2aa00000007000000003b9aca000000000000000000000000020000000320829837bfba5d602b19cb9102b99eb3f895d5e47c71b9ae100e813e6332eddad2554ec12a0591fcbb6de9adcfbf2e0dfeffbe7792afd0c4085fdd370000000b0000000000000000000000020000000320829837bfba5d602b19cb9102b99eb3f895d5e47c71b9ae100e813e6332eddad2554ec12a0591fcbb6de9adcfbf2e0dfeffbe7792afd0c4085fdd37000186a0000000020000000900000002c34c35601ac5c7f91e22a95769d1bef6fc902ac3ceefba0d9b21fed1964088fa02bf974d310b54ff81957d8d70de6ed7cc87a84acad08cf14fc30338959199e100dedba0b7987f23b645a1c3ec7eb8fdace1b21d0bf3de62bcc57528fff7ee2b895bc2845dc23e20baf708f892b53f5a20cce4a4daec82c3f8fb9b9614e90af918000000000900000002c34c35601ac5c7f91e22a95769d1bef6fc902ac3ceefba0d9b21fed1964088fa02bf974d310b54ff81957d8d70de6ed7cc87a84acad08cf14fc30338959199e100dedba0b7987f23b645a1c3ec7eb8fdace1b21d0bf3de62bcc57528fff7ee2b895bc2845dc23e20baf708f892b53f5a20cce4a4daec82c3f8fb9b9614e90af9180052e16963',
  txid: 'YXx3w1o5JvijNCiodjsjExrc9cvbMCd2mw79kbe1bFnBGMaXY',
};
