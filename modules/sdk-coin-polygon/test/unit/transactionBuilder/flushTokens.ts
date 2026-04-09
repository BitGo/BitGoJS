// eslint-disable-next-line import/no-internal-modules
import { runFlushNftTests } from '@bitgo/abstract-eth/test/unit/transactionBuilder';
import { getBuilder } from '../../getBuilder';

describe('Polygon Flush NFT Tests', () => {
  runFlushNftTests('tpolygon', getBuilder);
});
