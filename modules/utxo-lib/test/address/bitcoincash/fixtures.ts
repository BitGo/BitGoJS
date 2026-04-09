import { Network, networks } from '../../../src';
import { toOutputScript } from '../../../src/address';
import { TestVector } from '../addressFormat';

export function getTestVectorsBitcoinCashAddressTranslations(
  network: Network,
  modify?: (v: TestVector) => TestVector
): TestVector[] {
  if (modify === undefined) {
    return [
      ...getTestVectorsBitcoinCashAddressTranslations(network, (v) => v),
      ...getTestVectorsBitcoinCashAddressTranslations(network, (v) => {
        // Unfortunately, the cashaddr format is not very well specified.
        // While the spec[0] states that every address must have a prefix, some sources say that it is
        // optional[1]. Our libraries will always create prefixed addresses.
        // 0: https://github.com/bitcoincashorg/bitcoincash.org/blob/master/spec/cashaddr.md
        // 1: https://www.bitcoinabc.org/cashaddr/
        v.input = v.input.split(':')[1];
        return v;
      }),
      ...getTestVectorsBitcoinCashAddressTranslations(network, (v) => {
        // https://github.com/bitcoincashorg/bitcoincash.org/blob/master/spec/cashaddr.md#uppercaselowercase
        // ``
        //   Lower case is preferred for cashaddr, but uppercase is accepted. A mixture of lower case and uppercase must be rejected.
        //    Allowing for uppercase ensures that the address can be encoded efficiently in QR codes using the alphanumeric mode[3].
        // ``
        v.input = v.input.toUpperCase();
        return v;
      }),
    ];
  }

  function fromBase58Ref(base58: string, input: string, network = networks.bitcoincash): TestVector {
    return {
      network,
      format: 'cashaddr',
      input,
      output: input,
      payload: toOutputScript(base58, network),
    };
  }

  function fromOutputScriptRef(
    { size, type }: { size: number; type: number },
    payloadHex: string,
    input: string,
    network = networks.bitcoincash
  ): TestVector {
    return {
      network,
      format: 'cashaddr',
      payload: Buffer.from(payloadHex, 'hex'),
      input,
      output: input,
    };
  }

  return [
    // https://github.com/bitcoincashorg/bitcoincash.org/blob/master/spec/cashaddr.md?plain=1#L142-L149
    fromBase58Ref('1BpEi6DfDAUFd7GtittLSdBeYJvcoaVggu', 'bitcoincash:qpm2qsznhks23z7629mms6s4cwef74vcwvy22gdx6a'),
    fromBase58Ref('1KXrWXciRDZUpQwQmuM1DbwsKDLYAYsVLR', 'bitcoincash:qr95sy3j9xwd2ap32xkykttr4cvcu7as4y0qverfuy'),
    fromBase58Ref('16w1D5WRVKJuZUsSRzdLp9w3YGcgoxDXb', 'bitcoincash:qqq3728yw0y47sqn6l2na30mcw6zm78dzqre909m2r'),
    fromBase58Ref('3CWFddi6m4ndiGyKqzYvsFYagqDLPVMTzC', 'bitcoincash:ppm2qsznhks23z7629mms6s4cwef74vcwvn0h829pq'),
    fromBase58Ref('3LDsS579y7sruadqu11beEJoTjdFiFCdX4', 'bitcoincash:pr95sy3j9xwd2ap32xkykttr4cvcu7as4yc93ky28e'),
    fromBase58Ref('31nwvkZwyPdgzjBJZXfDmSWsC4ZLKpYyUw', 'bitcoincash:pqq3728yw0y47sqn6l2na30mcw6zm78dzq5ucqzc37'),

    // https://github.com/bitcoincashorg/bitcoincash.org/blob/master/spec/cashaddr.md?plain=1#L158-L159
    fromOutputScriptRef(
      { size: 20, type: 0 },
      'F5BF48B397DAE70BE82B3CCA4793F8EB2B6CDAC9',
      'bitcoincash:qr6m7j9njldwwzlg9v7v53unlr4jkmx6eylep8ekg2'
    ),
    fromOutputScriptRef(
      { size: 20, type: 1 },
      'F5BF48B397DAE70BE82B3CCA4793F8EB2B6CDAC9',
      'bchtest:pr6m7j9njldwwzlg9v7v53unlr4jkmx6eyvwc0uz5t',
      networks.bitcoincashTestnet
    ),
  ]
    .filter((v) => v.network === network)
    .map(modify);
}
