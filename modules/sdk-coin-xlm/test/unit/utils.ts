import * as Utils from '../../src/lib/utils';

describe('Stellar Utils', () => {
  const userKeychain = {
    pub: 'GA34NPQ4M54HHZBKSDZ5B3J3BZHTXKCZD4UFO2OYZERPOASK4DAATSIB',
    prv: 'SDADJSTZNIKF46NM7LE3ZHMX4TJ2VJBL7PTERNDLWHZ5U6KNO5S7XFJD',
  };
  const backupKeychain = {
    pub: 'GC3D3ZNNK7GHLMSWJA54DQO6QJUJJF7K6J5JGCEW45ZT6QMKZ6PMUHUM',
    prv: 'SA22TDBINLZMGYUDVXGUP2JMYIQ3DTJE53PNQUVCDK73XRS6TDVYU7WW',
  };
  // This key pair is the decoded version of the userKeychain above
  const rootKeychain = {
    pub: '37c6be1c677873e42a90f3d0ed3b0e4f3ba8591f285769d8c922f7024ae0c009',
    prv: 'c034ca796a145e79acfac9bc9d97e4d3aaa42bfbe648b46bb1f3da794d7765fb',
  };
  // This key pair is the decoded version of the backupKeychain above
  const backupRootKeychain = {
    pub: 'b63de5ad57cc75b256483bc1c1de82689497eaf27a930896e7733f418acf9eca',
    prv: '35a98c286af2c36283adcd47e92cc221b1cd24eeded852a21abfbbc65e98eb8a',
  };

  describe('key validation', () => {
    it('should validate a Stellar public key', () => {
      Utils.isValidStellarPub(userKeychain.pub).should.equal(true);
      Utils.isValidStellarPub(backupKeychain.pub).should.equal(true);
    });

    it('should validate a Stellar private key', () => {
      Utils.isValidStellarPrv(userKeychain.prv).should.equal(true);
      Utils.isValidStellarPrv(backupKeychain.prv).should.equal(true);
    });

    it('should validate a raw public key', () => {
      Utils.isValidPublicKey(rootKeychain.pub).should.equal(true);
      Utils.isValidPublicKey(backupRootKeychain.pub).should.equal(true);
    });

    it('should validate a raw private key', () => {
      Utils.isValidPrivateKey(rootKeychain.prv + rootKeychain.pub).should.equal(true);
      Utils.isValidPrivateKey(backupRootKeychain.prv + backupRootKeychain.pub).should.equal(true);
    });

    it('should fail to validate an invalid Stellar public key', () => {
      Utils.isValidStellarPub(rootKeychain.pub).should.equal(false);
      Utils.isValidStellarPub(backupRootKeychain.pub).should.equal(false);
    });

    it('should fail to validate an invalid Stellar private key', () => {
      Utils.isValidStellarPrv(rootKeychain.prv).should.equal(false);
      Utils.isValidStellarPrv(backupRootKeychain.prv).should.equal(false);
    });

    it('should fail to validate an invalid raw public key', () => {
      Utils.isValidPublicKey(userKeychain.pub).should.equal(false);
      Utils.isValidPublicKey(backupKeychain.pub).should.equal(false);
    });

    it('should fail to validate an invalid raw private key', () => {
      Utils.isValidPrivateKey(userKeychain.prv).should.equal(false);
      Utils.isValidPrivateKey(backupKeychain.prv).should.equal(false);
    });
  });

  describe('encode and decode keys', () => {
    it('should encode a raw public key to a Stellar public key', () => {
      const pub = Buffer.from(rootKeychain.pub, 'hex');
      Utils.encodePublicKey(pub).should.equal(userKeychain.pub);

      const backupPub = Buffer.from(backupRootKeychain.pub, 'hex');
      Utils.encodePublicKey(backupPub).should.equal(backupKeychain.pub);
    });

    it('should encode a raw private key to a Stellar private key', () => {
      const prv = Buffer.from(rootKeychain.prv, 'hex');
      Utils.encodePrivateKey(prv).should.equal(userKeychain.prv);

      const backupPrv = Buffer.from(backupRootKeychain.prv, 'hex');
      Utils.encodePrivateKey(backupPrv).should.equal(backupKeychain.prv);
    });

    it('should decode a Stellar public key to a raw public key', () => {
      const decodedPub = Utils.decodePublicKey(userKeychain.pub).toString('hex');
      const decodedBackupPub = Utils.decodePublicKey(backupKeychain.pub).toString('hex');

      decodedPub.should.equal(rootKeychain.pub);
      decodedBackupPub.should.equal(backupRootKeychain.pub);
    });

    it('should decode a Stellar private key to a raw private key', () => {
      const decodedPrv = Utils.decodePrivateKey(userKeychain.prv).toString('hex');
      const decodedBackupPrv = Utils.decodePrivateKey(backupKeychain.prv).toString('hex');

      decodedPrv.should.equal(rootKeychain.prv);
      decodedBackupPrv.should.equal(backupRootKeychain.prv);
    });
  });
});
