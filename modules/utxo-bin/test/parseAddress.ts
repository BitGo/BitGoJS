import * as assert from 'assert';
import * as yargs from 'yargs';
import * as utxolib from '@bitgo/utxo-lib';

import { cmdParseAddress, getAddressParser } from '../src/commands';
import { formatTreeNoColor, getFixtureString } from './fixtures';
import { getKeyTriple, KeyTriple } from './bip32.util';

const scriptTypesSingleSig = ['p2pkh', 'p2wkh'] as const;
const scriptTypes = [...utxolib.bitgo.outputScripts.scriptTypes2Of3, ...scriptTypesSingleSig] as const;
type ScriptType = (typeof scriptTypes)[number];

export function isSupportedDepositType(network: utxolib.Network, scriptType: ScriptType): boolean {
  if (scriptType === 'p2pkh') {
    return true;
  }

  if (scriptType === 'p2wkh') {
    return utxolib.supportsSegwit(network);
  }

  return utxolib.bitgo.outputScripts.isSupportedScriptType(network, scriptType);
}

/**
 *
 * @param keys - Pubkeys to use for generating the address.
 *               If scriptType is single-sig, the first key will be used.
 * @param scriptType
 * @param network
 * @return {Buffer} scriptPubKey
 */
function createScriptPubKey(keys: KeyTriple, scriptType: ScriptType, network: utxolib.Network): Buffer {
  const pubkeys = keys.map((k) => k.publicKey);

  switch (scriptType) {
    case 'p2sh':
    case 'p2shP2wsh':
    case 'p2wsh':
    case 'p2tr':
    case 'p2trMusig2':
      return utxolib.bitgo.outputScripts.createOutputScript2of3(pubkeys, scriptType).scriptPubKey;
    case 'p2pkh':
      return utxolib.payments.p2pkh({ pubkey: keys[0].publicKey }).output as Buffer;
    case 'p2wkh':
      return utxolib.payments.p2wpkh({ pubkey: keys[0].publicKey }).output as Buffer;
    default:
      throw new Error(`unsupported output type ${scriptType}`);
  }
}

function getAddresses(n: utxolib.Network): [type: string, format: string, address: string][] {
  const keys = getKeyTriple('parseAddress');
  return scriptTypes
    .filter((t) => isSupportedDepositType(n, t))
    .flatMap((t) =>
      utxolib.addressFormat.addressFormats
        .filter((format) => utxolib.addressFormat.isSupportedAddressFormat(format, n))
        .map((format): [string, string, string] => [
          t,
          format,
          utxolib.addressFormat.fromOutputScriptWithFormat(createScriptPubKey(keys, t, n), format, n),
        ])
    );
}

function parse(address: string, args: string[]) {
  return getAddressParser(yargs.command(cmdParseAddress).parseSync(args)).parse(address);
}

function testParseAddress(
  network: utxolib.Network,
  type: string,
  addressFormat: string,
  address: string,
  args: string[],
  suffix: string
) {
  describe(`parse address ${address} with arguments ${args.join(' ')}`, function () {
    it(`formats address`, async function () {
      const formatted = formatTreeNoColor(parse(address, args), { showAll: true });
      const addrNoColon = address.replace(':', '_');
      const filename = [utxolib.getNetworkName(network), type, addressFormat, addrNoColon + suffix].join('_');
      console.log(filename);
      assert.strictEqual(await getFixtureString(`test/fixtures/formatAddress/${filename}.txt`, formatted), formatted);
    });
  });
}

utxolib.getNetworkList().forEach((n) => {
  getAddresses(n).forEach(([type, addressFormat, address], i) => {
    testParseAddress(n, type, addressFormat, address, [], '');
    if ([utxolib.networks.bitcoin, utxolib.networks.bitcoincash, utxolib.networks.ecash].includes(n) && i === 0) {
      testParseAddress(n, type, addressFormat, address, ['--all'], '.all');
    }
  });
});
