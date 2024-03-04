import { runAddressInitializationTests } from '@bitgo/abstract-eth';
import { TransactionBuilder } from '../../../src';
import * as testData from '../../resources';
import { getBuilder } from '../../getBuilder';

const txBuilder = getBuilder('topeth') as TransactionBuilder;

runAddressInitializationTests('topeth', txBuilder, testData);
