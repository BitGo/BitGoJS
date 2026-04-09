import * as t from 'io-ts';

export const BitgoExpressError = t.type({
  message: t.string,
  name: t.string,
  bitgoJsVersion: t.string,
  bitgoExpressVersion: t.string,
});
