import 'should';
import { notEmpty } from '../../../../src';
describe('notEmpty', () => {
  const notEmptyValues = [1, '123', { something: true }, {}];
  const emptyValues = [undefined, null];

  it('should return true', () => {
    notEmptyValues.forEach((vaue) => notEmpty(vaue).should.equal(true));
  });

  it('should return false', () => {
    emptyValues.forEach((vaue) => notEmpty(vaue).should.equal(false));
  });
});
