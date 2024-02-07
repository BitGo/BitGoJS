import { runAddressInitializationTests } from '@bitgo/abstract-eth';
import { TransactionBuilder } from '../../../src';
import * as testData from '../../resources';
import { getBuilder } from '../../getBuilder';

const txBuilder = getBuilder('tarbeth') as TransactionBuilder;

runAddressInitializationTests('tarbeth', txBuilder, testData);
