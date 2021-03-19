import { Eos } from '../../../src';

export const defaultKeyPairFromPrv = new Eos.KeyPair({
    prv:
      'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
  });
  
export const defaultKeyPairFromPub = new Eos.KeyPair({
    pub:
      'xpub661MyMwAqRbcFhCvdhTAfpEEDV58oqDvv65YNHC686NNs4KbH8YZQJWVmrfbve7aAVHzxw8bKFxA7MLeDK6BbLfkE3bqkvHLPgaGHHtYGeY',
  });

  // First tx to test
// export const initializationTransaction = '9ee6506044a15328ecb10000000100408c7a02ea3055000000000085269d00020130020000000000ea305500409e9a2264b89a01403599e98cf9fb7600000000a8ed3232f601403599e98cf9fb7680a90a218440bb9a02000000030002969e79ce680080901c317857f6b6f462aac0609312f5c23dfed863b66169811901000002bc335bcf57656b09d6dc15a7cb18e15659a771f1a6d2870fdcef6c4c331da54b01000003df9964c052a08adaa1a4c877d95c5844cdbe7826455b49357afdd758c6d1348a0100000002000000030002969e79ce680080901c317857f6b6f462aac0609312f5c23dfed863b66169811901000002bc335bcf57656b09d6dc15a7cb18e15659a771f1a6d2870fdcef6c4c331da54b01000003df9964c052a08adaa1a4c877d95c5844cdbe7826455b49357afdd758c6d1348a010000000000000000ea305500b0cafe4873bd3e01403599e98cf9fb7600000000a8ed323214403599e98cf9fb7680a90a218440bb9a0010000000';

export const sendTransaction = 'c70849604fe6c43e5b790000000100408c7a02ea3055000000000085269d000201310100a6823403ea3055000000572d3ccdcd0120331938f34af1d000000000a8ed32322b20331938f34af1d0400e16e2d03985dd204e00000000000004454f53000000000a68656c6c6f776f726c6400'

// export const initializationTransaction = "{\"compression\":\"none\",\"packed_trx\":\"9ee6506044a15328ecb10000000100408c7a02ea3055000000000085269d00020130020000000000ea305500409e9a2264b89a01403599e98cf9fb7600000000a8ed3232f601403599e98cf9fb7680a90a218440bb9a02000000030002969e79ce680080901c317857f6b6f462aac0609312f5c23dfed863b66169811901000002bc335bcf57656b09d6dc15a7cb18e15659a771f1a6d2870fdcef6c4c331da54b01000003df9964c052a08adaa1a4c877d95c5844cdbe7826455b49357afdd758c6d1348a0100000002000000030002969e79ce680080901c317857f6b6f462aac0609312f5c23dfed863b66169811901000002bc335bcf57656b09d6dc15a7cb18e15659a771f1a6d2870fdcef6c4c331da54b01000003df9964c052a08adaa1a4c877d95c5844cdbe7826455b49357afdd758c6d1348a010000000000000000ea305500b0cafe4873bd3e01403599e98cf9fb7600000000a8ed323214403599e98cf9fb7680a90a218440bb9a0010000000\",\"signatures\":[\"SIG_K1_KdKfZWe25gsniG1iT6L9iZCSpyHHwRuCgwyPiJMnH75LgEeDMxYVcLwZFeTiS4iRAeV1BKzHefj3ZEt36abGuQy49Yzgdc\"]}"

// Second tx to test
export const initializationTransaction = "{\"compression\":\"none\",\"packed_trx\":\"03745160ecbb11c2a6550000000100408c7a02ea3055000000000085269d00020130020000000000ea305500409e9a2264b89a01403599e98cf9fb7600000000a8ed3232f601403599e98cf9fb76d0f4cd25a23d9c5f020000000300028ce3042f385ede470a5df16f106741adf450ef754a31a90be649276582a12a3201000002f6781a03cb38e37722c59bc1843ecee9f1571458fe1e3e2ea6a59b61f881c655010000036cf58df155ea97b9a67f7c8422348fffebb0cb571bc95dc6a1709c8c2dce7ebc01000000020000000300028ce3042f385ede470a5df16f106741adf450ef754a31a90be649276582a12a3201000002f6781a03cb38e37722c59bc1843ecee9f1571458fe1e3e2ea6a59b61f881c655010000036cf58df155ea97b9a67f7c8422348fffebb0cb571bc95dc6a1709c8c2dce7ebc010000000000000000ea305500b0cafe4873bd3e01403599e98cf9fb7600000000a8ed323214403599e98cf9fb76d0f4cd25a23d9c5f0010000000\",\"signatures\":[\"SIG_K1_K7amsKfr9MgErBnZEENrDqgwMzfytVxmhPv6GWWtLDjyP1CbU8DB3ua3mt9g2abH3YRyZZZDW88npoydecxDi8XiLtWLNC\"]}"

// source on jungle testnet 
// https://jungle3.bloks.io/transaction/f01abf7e0cc235fd048f4c5fbe935c060182b6f1e1d321c52a82a1b7209fed9f



// Third tx to test

export const initializationTransaction = "{\"compression\":\"none\",\"packed_trx\":\"1c0f526014f2cd68e5430000000100408c7a02ea3055000000000085269d000201340100a6823403ea3055000000572d3ccdcd01803d3af2788bd6c200000000a8ed323222803d3af2788bd6c2c0862baef2d883bba08601000000000004454f5300000000013200\",\"signatures\":[\"SIG_K1_KjsRqSoJye5rEzDHarX5mRBAm25AWDX1whvTZi1BpP4ZGJcWbeEcVmHhDuYiv9pgzvCkGZTnFmS8y4Jev82pzccKGfDnew\",\"SIG_K1_KBguN1SJt1oTL6an66WENRPQrBLmDXubLU9MtVT1SKHpEWUhvgXvoynB6AN4H3TYKbUg6ccTszph793UGUpNt1ndG6yRET\"]}"

// source on jungletestnet
// https://jungle3.bloks.io/transaction/32e90950e2647a0f28b617cba6af54db2a094dd0021b6bf5122b2336d569723e
