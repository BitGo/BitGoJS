import { BaseBuilder } from '@bitgo/sdk-core';
import { coins } from '@bitgo/statics';
import { WrappedBuilder } from './wrappedBuilder';
import 'ses';

lockdown({ stackFiltering: 'verbose' });

// export const getBuilder = (coinName: string): BaseBuilder => {
//   return new WrappedBuilder(coins.get(coinName));
// };

const unboxedGetBuilder = (coinName: string): BaseBuilder => {
  return new WrappedBuilder(coins.get(coinName));
};

const c = new Compartment({
  getBuilder: harden(unboxedGetBuilder),
});

export const getBuilder = (coinName: string): BaseBuilder => {
  return c.evaluate(`getBuilder('${coinName}')`);
};
