import { CommandModule } from 'yargs';
import { getNamedDescriptorsForRootWalletKeys } from '@bitgo/utxo-core/descriptor';

import { FormatTreeOrJson, formatTreeOrJson, getRootWalletKeys, keyOptions, KeyOptions } from '../../args';
import { formatObjAsTree } from '../../format';

type ArgsFixedScriptToDescriptor = KeyOptions & {
  format: FormatTreeOrJson;
};

export const cmdFromFixedScript: CommandModule<unknown, ArgsFixedScriptToDescriptor> = {
  command: 'fromFixedScript',
  describe: 'Convert BitGo FixedScript RootWalletKeys to output descriptors',
  builder(b) {
    return b.options(keyOptions).options({ format: formatTreeOrJson });
  },
  handler(argv): void {
    const rootWalletKeys = getRootWalletKeys(argv);
    const descriptorMap = getNamedDescriptorsForRootWalletKeys(rootWalletKeys);
    const obj = Object.fromEntries(
      [...descriptorMap].map(([name, descriptor]) => [name, descriptor?.toString() ?? null])
    );
    if (argv.format === 'tree') {
      console.log(formatObjAsTree('descriptors', obj));
    } else if (argv.format === 'json') {
      console.log(JSON.stringify(obj, null, 2));
    } else {
      throw new Error(`Invalid format: ${argv.format}. Expected 'tree' or 'json'.`);
    }
  },
};
