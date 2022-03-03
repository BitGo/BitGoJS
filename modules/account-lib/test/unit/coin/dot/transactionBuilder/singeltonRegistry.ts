import should from 'should';
import { SingletonRegistry } from '../../../../../src/coin/dot';
import { TypeRegistry } from '@substrate/txwrapper-core/lib/types';
import * as material from '../../../../resources/dot/materialData.json';
import * as modifiedMaterial from '../../../../resources/dot/materialDataModified.json';
import { Material } from '../../../../../src/coin/dot/iface';

describe('SingletonRegistry', function () {
  let oldRegistry: TypeRegistry;
  let newRegistry: TypeRegistry;

  it('should get the same registry when material is the same', function () {
    oldRegistry = SingletonRegistry.getInstance(material as Material);
    should.notEqual(oldRegistry, null);
    newRegistry = SingletonRegistry.getInstance(material as Material);
    oldRegistry.should.equal(newRegistry);
  });

  it('should get a different registry when material is different', function () {
    oldRegistry = SingletonRegistry.getInstance(material as Material);
    should.notEqual(oldRegistry, null);
    newRegistry = SingletonRegistry.getInstance(modifiedMaterial as Material);
    oldRegistry.should.not.equal(newRegistry);
  });
});
