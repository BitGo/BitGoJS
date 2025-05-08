import 'should';
import { auditKey } from '../../src/audit';
import {
  solBackupKey,
  ethTssBackupKey,
  btcBackupKey,
  algoBackupKey,
  hbarBackupKey,
  xlmBackupKey,
  ethMultiSigBackupKey,
} from './mocks/audit';
import { generateRandomPassword } from '@bitgo/sdk-core';
import { encrypt } from '@bitgo/sdk-api';

describe('auditKey', () => {
  describe('Eddsa TSS', () => {
    const { key: keyString, commonKeychain } = solBackupKey;
    const key = keyString.replace(/\s/g, '');
    const walletPassphrase = 'kAm[EFQ6o=SxlcLFDw%,';
    const coinName = 'sol';
    const multiSigType = 'tss';

    it('should return { isValid: true } for valid inputs', async () => {
      const result = await auditKey({
        coinName,
        encryptedPrv: key,
        publicKey: commonKeychain,
        walletPassphrase,
        multiSigType,
      });
      result.should.deepEqual({ isValid: true });
    });

    it('should return { isValid: false } if the commonKeychain is invalid', async () => {
      const alteredCommonKeychain = generateRandomPassword(10);
      const result = await auditKey({
        coinName,
        encryptedPrv: key,
        publicKey: alteredCommonKeychain,
        walletPassphrase,
        multiSigType,
      });
      result.should.deepEqual({ isValid: false, message: 'Incorrect TSS common keychain' });
    });

    it('should return { isValid: false } if the walletPassphrase is incorrect', async () => {
      const incorrectPassphrase = 'foo';
      const result = await auditKey({
        coinName,
        encryptedPrv: key,
        publicKey: commonKeychain,
        walletPassphrase: incorrectPassphrase,
        multiSigType,
      });
      result.should.deepEqual({ isValid: false, message: "ccm: tag doesn't match" });
    });

    it('should return { isValid: false } if the key is altered', async () => {
      const alteredKey = key.replace(/[0-9]/g, '0');
      const result = await auditKey({
        coinName,
        encryptedPrv: alteredKey,
        publicKey: commonKeychain,
        walletPassphrase,
        multiSigType,
      });
      result.isValid.should.equal(false);
    });
  });

  describe('ECDSA TSS', () => {
    const { key: keyString, commonKeychain } = ethTssBackupKey;
    const key = keyString.replace(/\s/g, '');
    const walletPassphrase = 'kAm[EFQ6o=SxlcLFDw%,';
    const coinName = 'eth';
    const multiSigType = 'tss';

    it('should return { isValid: true } for valid inputs', async () => {
      const result = await auditKey({
        coinName,
        encryptedPrv: key,
        publicKey: commonKeychain,
        walletPassphrase,
        multiSigType,
      });
      result.should.deepEqual({ isValid: true });
    });

    it('should return { isValid: false } if the commonKeychain is altered', async () => {
      const alteredCommonKeychain = generateRandomPassword(10);
      const result = await auditKey({
        coinName,
        encryptedPrv: key,
        publicKey: alteredCommonKeychain,
        walletPassphrase,
        multiSigType,
      });
      result.should.deepEqual({ isValid: false, message: 'Incorrect TSS common keychain' });
    });

    it('should return { isValid: false } if the walletPassphrase is incorrect', async () => {
      const incorrectPassphrase = 'foo';
      const result = await auditKey({
        coinName,
        encryptedPrv: key,
        publicKey: commonKeychain,
        walletPassphrase: incorrectPassphrase,
        multiSigType,
      });
      result.should.deepEqual({ isValid: false, message: "ccm: tag doesn't match" });
    });

    it('should return { isValid: false } if the key is altered', async () => {
      const alteredKey = key.replace(/[0-9]/g, '0');
      const result = await auditKey({
        coinName,
        encryptedPrv: alteredKey,
        publicKey: commonKeychain,
        walletPassphrase,
        multiSigType,
      });
      result.isValid.should.equal(false);
    });
  });

  describe('MultiSig UTXO', () => {
    const { key } = btcBackupKey;
    it('should return { isValid: true } for valid inputs', async () => {
      const result = await auditKey({
        coinName: 'btc',
        encryptedPrv: key,
        walletPassphrase: 'kAm[EFQ6o=SxlcLFDw%,',
      });
      result.should.deepEqual({ isValid: true });
    });

    it('should return { isValid: false } if the walletPassphrase is incorrect', async () => {
      const result = await auditKey({
        coinName: 'btc',
        encryptedPrv: key,
        walletPassphrase: 'foo',
      });
      result.should.deepEqual({ isValid: false, message: "ccm: tag doesn't match" });
    });

    it('should return { isValid: false } if the key is altered', async () => {
      const alteredKey = key.replace(/[0-9]/g, '0');
      const result = await auditKey({
        coinName: 'btc',
        encryptedPrv: alteredKey,
        walletPassphrase: 'kAm[EFQ6o=SxlcLFDw%,',
      });
      result.isValid.should.equal(false);
    });
  });

  describe('MultiSig Algo', () => {
    const { key } = algoBackupKey;
    const walletPassphrase = 'ZQ8MhxT84m4P';

    it('should return { isValid: true) } for valid inputs', async () => {
      const result = await auditKey({
        coinName: 'algo',
        encryptedPrv: key,
        walletPassphrase,
      });
      result.should.deepEqual({ isValid: true });
    });

    it('should return { isValid: false } if the walletPassphrase is incorrect', async () => {
      const result = await auditKey({
        coinName: 'algo',
        encryptedPrv: key,
        walletPassphrase: 'foo',
      });
      result.should.deepEqual({ isValid: false, message: "ccm: tag doesn't match" });
    });
    it('should return { isValid: false } if the key is altered', async () => {
      const alteredKey = key.replace(/[0-9]/g, '0');
      const result = await auditKey({
        coinName: 'algo',
        encryptedPrv: alteredKey,
        walletPassphrase,
      });
      result.isValid.should.equal(false);
    });

    it('should return { isValid: false } if the key is not a valid key', async () => {
      const invalidKey = '#@)$#($*@)#($*';
      const encryptedPrv = encrypt(walletPassphrase, invalidKey);
      const result = await auditKey({
        coinName: 'algo',
        encryptedPrv,
        walletPassphrase,
      });
      result.should.deepEqual({ isValid: false, message: 'Invalid private key' });
    });
  });

  describe('MultiSig XLM', () => {
    const { key } = xlmBackupKey;
    const walletPassphrase = 'kAm[EFQ6o=SxlcLFDw%,';

    it('should return { isValid: true) } for valid inputs', async () => {
      const result = await auditKey({
        coinName: 'xlm',
        encryptedPrv: key,
        walletPassphrase,
      });
      result.should.deepEqual({ isValid: true });
    });

    it('should return { isValid: false } if the walletPassphrase is incorrect', async () => {
      const result = await auditKey({
        coinName: 'xlm',
        encryptedPrv: key,
        walletPassphrase: 'foo',
      });
      result.should.deepEqual({ isValid: false, message: "ccm: tag doesn't match" });
    });

    it('should return { isValid: false } if the key is altered', async () => {
      const alteredKey = key.replace(/[0-9]/g, '0');
      const result = await auditKey({
        coinName: 'xlm',
        encryptedPrv: alteredKey,
        walletPassphrase,
      });
      result.isValid.should.equal(false);
    });

    it('should return { isValid: false } if the key is not a valid key', async () => {
      const invalidKey = '#@)$#($*@)#($*';
      const encryptedPrv = encrypt(walletPassphrase, invalidKey);
      const result = await auditKey({
        coinName: 'xlm',
        encryptedPrv,
        walletPassphrase,
      });
      result.should.deepEqual({ isValid: false, message: 'Invalid private key' });
    });
  });

  describe('MultiSig HBAR', () => {
    const { key } = hbarBackupKey;
    const walletPassphrase = 'kAm[EFQ6o=SxlcLFDw%,';

    it('should return { isValid: true) } for valid inputs', async () => {
      const result = await auditKey({
        coinName: 'hbar',
        encryptedPrv: key,
        walletPassphrase,
      });

      result.should.deepEqual({ isValid: true });
    });

    it('should return { isValid: false } if the walletPassphrase is incorrect', async () => {
      const result = await auditKey({
        coinName: 'hbar',
        encryptedPrv: key,
        walletPassphrase: 'foo',
      });
      result.should.deepEqual({ isValid: false, message: "ccm: tag doesn't match" });
    });

    it('should return { isValid: false } if the key is altered', async () => {
      const alteredKey = key.replace(/[0-9]/g, '0');
      const result = await auditKey({
        coinName: 'hbar',
        encryptedPrv: alteredKey,
        walletPassphrase,
      });

      result.isValid.should.equal(false);
    });

    it('should return { isValid: false } if the key is not a valid key', async () => {
      const invalidKey = '#@)$#($*@)#($*';
      const encryptedPrv = encrypt(walletPassphrase, invalidKey);
      const result = await auditKey({
        coinName: 'hbar',
        encryptedPrv,
        walletPassphrase,
      });
      result.should.deepEqual({ isValid: false, message: 'Invalid private key' });
    });
  });

  describe('MultiSig ECDSA', () => {
    it('should return { isValid: true } for valid inputs', async () => {
      const { key } = ethMultiSigBackupKey;
      const walletPassphrase = 'ZQ8MhxT84m4P';
      const result = await auditKey({
        coinName: 'eth',
        encryptedPrv: key,
        walletPassphrase,
      });
      result.should.deepEqual({ isValid: true });
    });

    it('should return { isValid: false } if the walletPassphrase is incorrect', async () => {
      const { key } = ethMultiSigBackupKey;
      const result = await auditKey({
        coinName: 'eth',
        encryptedPrv: key,
        walletPassphrase: 'foo',
      });
      result.should.deepEqual({ isValid: false, message: "ccm: tag doesn't match" });
    });

    it('should return { isValid: false } if the key is altered', async () => {
      const { key } = ethMultiSigBackupKey;
      const alteredKey = key.replace(/[0-9]/g, '0');
      const walletPassphrase = 'ZQ8MhxT84m4P';
      const result = await auditKey({
        coinName: 'eth',
        encryptedPrv: alteredKey,
        walletPassphrase,
      });
      result.isValid.should.equal(false);
    });

    it('should return { isValid: false } if the key is not a valid key', async () => {
      const invalidKey = '#@)$#($*@)#($*';
      const walletPassphrase = 'ZQ8MhxT84m4P';
      const encryptedPrv = encrypt(walletPassphrase, invalidKey);
      const result = await auditKey({
        coinName: 'eth',
        encryptedPrv,
        walletPassphrase,
      });
      result.should.deepEqual({ isValid: false, message: 'Invalid private key' });
    });
  });
});
