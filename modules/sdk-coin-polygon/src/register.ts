import { BitGoBase } from '@bitgo/sdk-core';
import { Polygon } from './polygon';
import { PolygonToken } from './polygonToken';
import { Tpolygon } from './tpolygon';

export const register = (sdk: BitGoBase): void => {
  sdk.register('polygon', Polygon.createInstance);
  sdk.register('tpolygon', Tpolygon.createInstance);
  PolygonToken.createTokenConstructors().forEach(({ name, coinConstructor }) => {
    sdk.register(name, coinConstructor);
  });
};
