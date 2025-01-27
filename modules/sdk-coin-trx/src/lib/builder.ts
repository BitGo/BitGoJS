import { BaseBuilder } from '@bitgo/sdk-core';
import { coins } from '@bitgo/statics';
import { WrappedBuilder } from './wrappedBuilder';
import 'ses';

lockdown({ stackFiltering: 'verbose' });

/*
Orginal function: 

export const getBuilder = (coinName: string): BaseBuilder => {
  return new WrappedBuilder(coins.get(coinName));
};

*/

const c = new Compartment({
  coins: harden(coins),
  WrappedBuilder: harden(WrappedBuilder),
});

export const getBuilder = (coinName: string): BaseBuilder => {
  return c.evaluate(`new WrappedBuilder(coins.get('${coinName}'))`);
};
