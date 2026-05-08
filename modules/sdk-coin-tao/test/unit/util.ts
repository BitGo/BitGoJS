import utils from '../../src/lib/utils';

describe('Tao utils', function () {
  describe('getTaoTokenBySubnetId', function () {
    it('should succeed for valid string subnetId', function () {
      const token = utils.getTaoTokenBySubnetId('1');
      token.name.should.equal('ttao:apex');
    });
    it('should succeed for valid number subnetId', function () {
      const token = utils.getTaoTokenBySubnetId(1);
      token.name.should.equal('ttao:apex');
    });
    it('should fail for invalid subnetId', function () {
      (() => utils.getTaoTokenBySubnetId('invalid')).should.throw('No Tao token found for subnetId: invalid');
    });
    it('should fail for non-existent subnetId', function () {
      (() => utils.getTaoTokenBySubnetId(999)).should.throw('No Tao token found for subnetId: 999');
    });
    it('should fail for undefined subnetId', function () {
      // @ts-expect-error testing failure case
      (() => utils.getTaoTokenBySubnetId(undefined)).should.throw('No Tao token found for subnetId: undefined');
    });
  });
});
