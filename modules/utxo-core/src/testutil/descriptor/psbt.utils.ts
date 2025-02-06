import * as utxolib from '@bitgo/utxo-lib';

import { matchPath, PathElement, toPlainObject } from '../../../src/testutil/toPlainObject.utils';

export function toPlainObjectFromPsbt(v: utxolib.Psbt): unknown {
  return toPlainObject(
    v,
    {
      propertyDescriptors: true,
      ignorePaths(path: PathElement[]) {
        return (
          matchPath(path, ['__CACHE']) ||
          matchPath(path, ['opts', 'network']) ||
          matchPath(path, ['data', 'globalMap', 'unsignedTx', 'tx', 'network']) ||
          matchPath(path, ['network'])
        );
      },
    },
    []
  );
}

export function toPlainObjectFromTx(v: utxolib.Transaction): unknown {
  return toPlainObject(v, {}, []);
}
