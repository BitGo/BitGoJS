import { InvalidAddressError } from '@bitgo/sdk-core';
import should from 'should';
import { Address } from '../../../src/lib/iface';
import XrpUtils from '../../../src/lib/utils';

describe('Utils', () => {
  describe('isValidTransactionId', () => {
    it('should return true for a valid transaction id', () => {
      const txId = '96E2F78D26CF76AAA38261D63CD042F744D6E73CB07D6886E53D544144819783';
      XrpUtils.isValidTransactionId(txId).should.be.true();
    });

    it('should return false for an invalid transaction id', () => {
      const txId = '3rsnutY9Eiv1CCgRmUUSJ3ZpoJWZBrypvSSSbMf4dhs9xmYTAuCNX4EzPvB6wJXEjRjEDmSz1xgTeySFaGHMUDjZ';
      XrpUtils.isValidTransactionId(txId).should.be.false();
    });
  });

  describe('isValidPrivateKey', () => {
    it('should return true for a valid private key', () => {
      const privateKeys = [
        '49187695ec4da97486feb904f532769c8792555e989a050f486a6d3172a137e7',
        'xprv9s21ZrQH143K36cPP1rLoWsp9JQp9JEJGo2LFdfaufqcYSp5qJk5S5zN94SnXLiBEnU4dH8RDWfsSSLzdKwdEdqBZrRvZ3LqX1VXYWXFcpD',
      ];
      for (const privateKey of privateKeys) {
        XrpUtils.isValidPrivateKey(privateKey).should.be.true();
      }
    });

    it('should return false for an invalid private key', () => {
      const privateKeys = ['invalid', '02d15efd7200d9da40e10d3f5a3149ed006c6db8f3b2d22912597f0b6b74785490'];
      for (const privateKey of privateKeys) {
        XrpUtils.isValidPrivateKey(privateKey).should.be.false();
      }
    });
  });

  describe('isValidSignature', () => {
    it('should return true for a valid signature', () => {
      const signature =
        '12000C22800000002402232F4A202300000002684000000000001D4C7321020CE46AA850561EB8391FC37C169CBAECF872FDA43AB72655B55A9D24EFDB31157446304402200BE53855F3757F14577D9FAE11E732E8FDB0EACB8C3BA053EEA48C9685FD894502207BF0AD2A2DC0CF0F0EA30A7356F30AD5179B075BDABB3C7FC93A441778E065CF81148D638995CB80B13D82EC5B9B2B9FF7E0575F9E8EF4EB130001811466245A6A3DF5BAD09E075144CEEF501609772FD5E1EB1300018114DCC7B213AB4A8962CE4F6DDDF1878CAD0FD9A8FFE1EB1300018114A3936C08697C0964DCE1C4B3DBD01D6A4998EA59E1F1';
      XrpUtils.isValidSignature(signature).should.be.true();
    });

    it('should return false for an invalid signature', () => {
      const signature = '3rsnutY9Eiv1CCgRmUUSJ3ZpoJWZBrypvSSSbMf4dhs9xmYTAuCNX4EzPvB6wJXEjRjEDmSz1xgTeySFaGHMUDjZ';
      XrpUtils.isValidSignature(signature).should.be.false();
    });
  });

  describe('isValidBlockId', () => {
    it('should return true for a valid transaction id', () => {
      const blockId = '56D6AD8E910D37A511652108ADD4D723BA01566DBC016C048917A3B63D0DF422';
      XrpUtils.isValidBlockId(blockId).should.be.true();
    });

    it('should return false for an invalid block id', () => {
      const blockId = '5xZGHtcwGyoiGPKKGuPQQqgeMjSG82ePCLRv6NK76XRm';
      XrpUtils.isValidBlockId(blockId).should.be.false();
    });
  });

  describe('isValidHex', () => {
    it('should return true for valid hex strings', () => {
      XrpUtils.isValidHex('123456ABCDF').should.be.true();
      XrpUtils.isValidHex('ABCDEF').should.be.true();
      XrpUtils.isValidHex('abcdef').should.be.true();
      XrpUtils.isValidHex('0123456789').should.be.true();
      XrpUtils.isValidHex('ffffffff').should.be.true();
    });

    it('should return false for invalid hex strings', () => {
      XrpUtils.isValidHex('12345Z').should.be.false();
      XrpUtils.isValidHex('GHIJKL').should.be.false();
      XrpUtils.isValidHex('ghijkl').should.be.false();
      XrpUtils.isValidHex('!@#$%^').should.be.false();
      XrpUtils.isValidHex(' ').should.be.false();
      XrpUtils.isValidHex('').should.be.false();
    });
  });

  describe('getAddressDetails', () => {
    it('hould return an address object for a valid address', () => {
      const address = 'rPVMhWBsfF9iMXYj3aAzJVkPDTFNSyWdKy';
      const addressDetails = XrpUtils.getAddressDetails(address);
      addressDetails.should.have.property('address', 'rPVMhWBsfF9iMXYj3aAzJVkPDTFNSyWdKy');
      addressDetails.should.have.property('destinationTag', undefined);
    });

    it('should return an address object for a valid address with destination tag', () => {
      const address = 'rPVMhWBsfF9iMXYj3aAzJVkPDTFNSyWdKy?dt=1234567890';
      const addressDetails = XrpUtils.getAddressDetails(address);
      addressDetails.should.have.property('address', 'rPVMhWBsfF9iMXYj3aAzJVkPDTFNSyWdKy');
      addressDetails.should.have.property('destinationTag', 1234567890);
    });

    it('should throw InvalidAddressError for an invalid address', () => {
      const invalidAddress = 'invalid';
      should(() => XrpUtils.getAddressDetails(invalidAddress)).throw(InvalidAddressError, {
        message: `destination address "${invalidAddress}" is not valid`,
      });
    });

    it('should throw InvalidAddressError for an address with no destination tag', () => {
      const address = 'rPVMhWBsfF9iMXYj3aAzJVkPDTFNSyWdKy?param=value';
      should(() => XrpUtils.getAddressDetails(address)).throw(InvalidAddressError, {
        message: 'destination tag missing',
      });
    });

    it('should throw InvalidAddressError for an address with multiple destination tags', () => {
      const address = 'rPVMhWBsfF9iMXYj3aAzJVkPDTFNSyWdKy?dt=123&dt=456';
      should(() => XrpUtils.getAddressDetails(address)).throw(InvalidAddressError, {
        message: 'destination tag can appear at most once, but 2 destination tags were found',
      });
    });

    it('should throw InvalidAddressError for an address with an invalid destination tag', () => {
      const address = 'rPVMhWBsfF9iMXYj3aAzJVkPDTFNSyWdKy?dt=invalid';
      should(() => XrpUtils.getAddressDetails(address)).throw(InvalidAddressError, {
        message: 'invalid destination tag',
      });
    });

    it('should throw InvalidAddressError for an address with a destination tag out of range', () => {
      const address = 'rPVMhWBsfF9iMXYj3aAzJVkPDTFNSyWdKy?dt=4294967296';
      should(() => XrpUtils.getAddressDetails(address)).throw(InvalidAddressError, {
        message: 'destination tag out of range',
      });
    });
  });

  describe('normalizeAddress', () => {
    it('should throw an InvalidAddressError for invalid address', () => {
      const addressDetails: Address = {
        // @ts-expect-error testing for invalid type
        address: 123,
        destinationTag: 456,
      };
      should(() => XrpUtils.normalizeAddress(addressDetails)).throw(InvalidAddressError);
    });

    it('should return the address with destination tag if destinationTag is an integer', () => {
      const addressDetails: Address = {
        address: 'rG1QQv2nh2gr7RCZ1P8YYcBUcCCN633jCn',
        destinationTag: 123456,
      };
      const normalizedAddress = XrpUtils.normalizeAddress(addressDetails);
      normalizedAddress.should.equal('rG1QQv2nh2gr7RCZ1P8YYcBUcCCN633jCn?dt=123456');
    });

    it('should throw an InvalidAddressError for invalid destinationTag details', () => {
      const addressDetails: Address = {
        address: 'r9xaKj4vHVm4oMh6Dnpd19JrMnGzRPWuoE',
        // @ts-expect-error testing for invalid type
        destinationTag: 'invalid', // not an integer
      };
      should(() => XrpUtils.normalizeAddress(addressDetails)).throw(InvalidAddressError);
    });

    it('should throw an InvalidAddressError for destinationTag out of range', () => {
      const addressDetails: Address = {
        address: 'r9xaKj4vHVm4oMh6Dnpd19JrMnGzRPWuoE',
        destinationTag: -33,
      };
      should(() => XrpUtils.normalizeAddress(addressDetails)).throw(InvalidAddressError);

      const addressDetails2: Address = {
        address: 'r9xaKj4vHVm4oMh6Dnpd19JrMnGzRPWuoE',
        destinationTag: 33333333333333333,
      };
      should(() => XrpUtils.normalizeAddress(addressDetails2)).throw(InvalidAddressError);
    });

    it('should return the address without destination tag if destinationTag is not defined', () => {
      const addressDetails: Address = {
        address: 'r9xaKj4vHVm4oMh6Dnpd19JrMnGzRPWuoE',
        destinationTag: undefined,
      };
      const normalizedAddress = XrpUtils.normalizeAddress(addressDetails);
      normalizedAddress.should.equal('r9xaKj4vHVm4oMh6Dnpd19JrMnGzRPWuoE');
    });
  });

  describe('isValidAddress', () => {
    it('should return true for valid addresses', () => {
      const addresses = ['rfUPHz8dWh6EGronyz1W8y3HrnDk6hqFS7', 'rDtbXp8cXxMx6EKLBRZucYkFtcmxoPKE6G?dt=100'];
      for (const address of addresses) {
        XrpUtils.isValidAddress(address).should.be.true();
      }
    });

    it('should return false for invalid addresses', () => {
      const addresses = [
        '21tGt7KXjXEMeXbmc8JbSCya54nwV7pUyjTtPAqa63mU',
        'r9xaKj4vHVm4oMh6Dnpd19JrMnGzRPWuoE?dt=asd',
        'invalid',
        'r9xaKj4vHVm4oMh6Dnpd19JrMnGzRPWuoE?memoId=12',
        'r9xaKj4vHVm4oMh6Dnpd19JrMnGzRPWuoE?dt=-1',
      ];
      for (const address of addresses) {
        XrpUtils.isValidAddress(address).should.be.false();
      }
    });

    describe('isValidPublicKey', () => {
      it('should return true for a valid public key', () => {
        const pubKeys = [
          'xpub661MyMwAqRbcFagrV3PMAepYhLFJYkx9e1ww425CU1NbRF9ENr4KytJqzLWZwWQ7b1CWLDhV3kthPRAyT33CApQ9QWZDvSq4bFHp2yL8Eob',
          '02d15efd7200d9da40e10d3f5a3149ed006c6db8f3b2d22912597f0b6b74785490',
        ];
        for (const key of pubKeys) {
          XrpUtils.isValidPublicKey(key).should.be.true();
        }
      });

      it('should return false for an invalid public key', () => {
        const pubKeys = [
          'invalid',
          '49187695ec4da97486feb904f532769c8792555e989a050f486a6d3172a137e7',
          'xprv9s21ZrQH143K36cPP1rLoWsp9JQp9JEJGo2LFdfaufqcYSp5qJk5S5zN94SnXLiBEnU4dH8RDWfsSSLzdKwdEdqBZrRvZ3LqX1VXYWXFcpD',
        ];
        for (const key of pubKeys) {
          XrpUtils.isValidPublicKey(key).should.be.false();
        }
      });
    });
  });

  describe('signString', () => {
    it('should sign a string and return a hex encoded signature', () => {
      const message = '68656c6c6f'; // 'hello' in hex
      const privateKey = '49187695ec4da97486feb904f532769c8792555e989a050f486a6d3172a137e7';
      const expectedSignature =
        '3045022100D4ED07E5827200A4EF5403F4410A5AE533716545412975B5AAC00554496FCA4102203A800AA39DA11CF2D04FA105268CED722652805E043D2D44EFB368F8AC8F4E0E';
      XrpUtils.signString(message, privateKey).should.equal(expectedSignature);
    });

    it('should fail to sign if the string is not hex encoded', () => {
      const message = 'hello';
      const privateKey = '49187695ec4da97486feb904f532769c8792555e989a050f486a6d3172a137e7';
      should(() => XrpUtils.signString(message, privateKey)).throw();
    });

    it('should fail to sign if the key is not valid', () => {
      const message = '68656c6c6f'; // 'hello' in hex
      const publicKey = '02d15efd7200d9da40e10d3f5a3149ed006c6db8f3b2d22912597f0b6b74785490';
      should(() => XrpUtils.signString(message, publicKey)).throw();
    });
  });

  describe('verifySignature', () => {
    it('should return true if the inputs are valid and the signature is valid', () => {
      const message = '68656c6c6f'; // 'hello' in hex
      const signature =
        '3045022100D4ED07E5827200A4EF5403F4410A5AE533716545412975B5AAC00554496FCA4102203A800AA39DA11CF2D04FA105268CED722652805E043D2D44EFB368F8AC8F4E0E';
      const publicKey = '02d15efd7200d9da40e10d3f5a3149ed006c6db8f3b2d22912597f0b6b74785490';
      XrpUtils.verifySignature(message, signature, publicKey).should.be.true();
    });

    it('should fail to verify if the message is not hex encoded', () => {
      const message = 'hello';
      const signature =
        '3045022100D4ED07E5827200A4EF5403F4410A5AE533716545412975B5AAC00554496FCA4102203A800AA39DA11CF2D04FA105268CED722652805E043D2D44EFB368F8AC8F4E0E';
      const publicKey = '02d15efd7200d9da40e10d3f5a3149ed006c6db8f3b2d22912597f0b6b74785490';
      should(() => XrpUtils.verifySignature(message, signature, publicKey)).throw();
    });

    it('should fail to verify if the signature is not hex encoded', () => {
      const message = '68656c6c6f'; // 'hello' in hex
      const signature = 'invalid';
      const publicKey = '02d15efd7200d9da40e10d3f5a3149ed006c6db8f3b2d22912597f0b6b74785490';
      should(() => XrpUtils.verifySignature(message, signature, publicKey)).throw();
    });

    it('should fail to verify if the public key is not valid', () => {
      const message = '68656c6c6f'; // 'hello' in hex
      const signature =
        '3045022100D4ED07E5827200A4EF5403F4410A5AE533716545412975B5AAC00554496FCA4102203A800AA39DA11CF2D04FA105268CED722652805E043D2D44EFB368F8AC8F4E0E';
      const publicKey = '49187695ec4da97486feb904f532769c8792555e989a050f486a6d3172a137e7';
      should(() => XrpUtils.verifySignature(message, signature, publicKey)).throw();
    });

    it('should return false if the message is not the same', () => {
      const message = '696e76616c6964'; // 'invalid' in hex
      const signature =
        '3045022100D4ED07E5827200A4EF5403F4410A5AE533716545412975B5AAC00554496FCA4102203A800AA39DA11CF2D04FA105268CED722652805E043D2D44EFB368F8AC8F4E0E';
      const publicKey = '02d15efd7200d9da40e10d3f5a3149ed006c6db8f3b2d22912597f0b6b74785490';
      XrpUtils.verifySignature(message, signature, publicKey).should.be.false();
    });

    it('should return false if the message is not the same', () => {
      const message = '696e76616c6964'; // 'invalid' in hex
      const signature =
        '3045022100D4ED07E5827200A4EF5403F4410A5AE533716545412975B5AAC00554496FCA4102203A800AA39DA11CF2D04FA105268CED722652805E043D2D44EFB368F8AC8F4E0E';
      const publicKey = '0281d5f6306a4416f9fe9e6ca4432b53c22d7fbcfd1ed098d56d6c27f5b5953c59';
      XrpUtils.verifySignature(message, signature, publicKey).should.be.false();
    });

    it('should return false if the signature is not valid', () => {
      const message = '696e76616c6964'; // 'invalid' in hex
      const signature =
        '3045022100A98B2F3BD6F602F08FAFAFAFE51A14785EDAD8F00CE3B3339B73702201C67EA3B43A7C2EFB8C2DC064F734897DE671D6D8A0402986A0E116F3A9FDAD9';
      const publicKey = '02d15efd7200d9da40e10d3f5a3149ed006c6db8f3b2d22912597f0b6b74785490';
      XrpUtils.verifySignature(message, signature, publicKey).should.be.false();
    });
  });
});
