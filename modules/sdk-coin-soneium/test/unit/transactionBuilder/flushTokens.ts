// eslint-disable-next-line import/no-internal-modules
import { runFlushNftTests } from '@bitgo-beta/abstract-eth/test/unit/transactionBuilder';
import { getBuilder } from '../getBuilder';

describe('Soneium Flush NFT Tests', () => {
  runFlushNftTests('tsoneium', getBuilder);
});
