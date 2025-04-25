import { useState } from 'react';

import * as AbstractUtxo from '@bitgo/abstract-utxo';

const defaultDescriptor =
  'wpkh(xpub661MyMwAqRbcFQpwd6c6aaioiXWuygdeknqE8v6PSNusNjwZypj1uXTVNysfsFPEDL6X3yS1kL6JeWyy9bAiR97Gz8KD9Z1W54uBw9U9j2t/*)';

export default function () {
  const [descriptorString] = useState(defaultDescriptor);

  const descriptor = AbstractUtxo.descriptor.Descriptor.fromString(
    descriptorString,
    'derivable',
  );
  return (
    <div>
      <pre>{descriptor.toString()}</pre>
      <pre>
        {Buffer.from(descriptor.atDerivationIndex(0).scriptPubkey()).toString(
          'hex',
        )}
      </pre>
    </div>
  );
}
