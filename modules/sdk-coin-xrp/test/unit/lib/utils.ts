import { InvalidAddressError, UtilsError } from '@bitgo/sdk-core';
import { Address } from '../../../src/lib/iface';
import { VALID_ACCOUNT_SET_FLAGS } from '../../../src/lib/constants';
import { XrpAllowedTransactionTypes } from '../../../src/lib/enum';
import should from 'should';
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

  describe('validateAddress', () => {
    it('should not throw error for a valid address', () => {
      const address = 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh';
      should(XrpUtils.validateAddress(address)).should.not.throw();
    });

    it('should throw InvalidAddressError for an invalid address', () => {
      const addresses = [
        'invalid',
        'fHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh',
        'CBKA7dM5sWB81u1AvyhuDHd5QheuQHwjk2dDWBoeMGP2',
        'XVPcpSm47b1CZkf5AkKM9a84dQHe3mSAkGDjcgGKi92C7Q7',
      ];
      for (const address of addresses) {
        should(() => XrpUtils.validateAddress(address)).throw(InvalidAddressError, {
          message: `address ${address} is not valid`,
        });
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

  describe('validateRawTransaction', () => {
    it('should throw an error when given an undefined raw transaction', () => {
      const rawTransaction = undefined;
      should(() => {
        // @ts-expect-error testing for invalid type
        XrpUtils.validateRawTransaction(rawTransaction);
      }).throw('Invalid raw transaction: Undefined');
    });

    it('should throw an error when given a non-hex raw transaction', () => {
      const rawTransaction = 'not a hex string';
      should(() => {
        XrpUtils.validateRawTransaction(rawTransaction);
      }).throw('Invalid raw transaction: Hex string expected');
    });

    it('should throw an error when given an invalid raw transaction', () => {
      const rawTransaction =
        '228000000024000000072E00000000201B0018D07161400000000003DE296840000000B7C9D0AF67D113EBCE1F1';
      should(() => {
        XrpUtils.validateRawTransaction(rawTransaction);
      }).throw('Invalid raw transaction');
    });

    it('should not throw an error when given a valid raw transaction', () => {
      const rawTransaction =
        '120000228000000024000000072E00000000201B0018D07161400000000003DE2968400000000000002D73008114726D0D8A26568D5D9680AC80577C912236717191831449EE221CCACC4DD2BF8862B22B0960A84FC771D9F3E010732103AFBB6845826367D738B0D42EA0756C94547E70B064E8FE1260CF21354C898B0B74473045022100CA3A98AA6FC8CCA251C3A2754992E474EA469884EB8D489D2B180EB644AC7695022037EB886DCF57928E5844DB73C2E86DE553FB59DCFC9408F3FD5D802ADB69DFCC8114F0DBA9D34C77B6769F6142AB7C9D0AF67D113EBCE1F1';
      should(() => {
        XrpUtils.validateRawTransaction(rawTransaction);
      }).not.throw();
    });
  });

  describe('isValidRawTransaction', () => {
    it('should return false when given an invalid raw transaction', () => {
      const rawTransaction =
        '228000000024000000072E00000000201B0018D07161400000000003DE296840000000B7C9D0AF67D113EBCE1F1';
      XrpUtils.isValidRawTransaction(rawTransaction).should.be.false();
    });

    it('should return true when given a valid raw transaction', () => {
      const rawTransaction =
        '120000228000000024000000072E00000000201B0018D07161400000000003DE2968400000000000002D73008114726D0D8A26568D5D9680AC80577C912236717191831449EE221CCACC4DD2BF8862B22B0960A84FC771D9F3E010732103AFBB6845826367D738B0D42EA0756C94547E70B064E8FE1260CF21354C898B0B74473045022100CA3A98AA6FC8CCA251C3A2754992E474EA469884EB8D489D2B180EB644AC7695022037EB886DCF57928E5844DB73C2E86DE553FB59DCFC9408F3FD5D802ADB69DFCC8114F0DBA9D34C77B6769F6142AB7C9D0AF67D113EBCE1F1';
      XrpUtils.isValidRawTransaction(rawTransaction).should.be.true();
    });
  });

  describe('isValidTransactionType', () => {
    it('should return false when given an invalid type', () => {
      const invalidType = 'invalid';
      XrpUtils.isValidTransactionType(invalidType).should.be.false();
    });

    it('should return true when given a valid type', () => {
      const validTypes = Object.values(XrpAllowedTransactionTypes);
      for (const type of validTypes) {
        XrpUtils.isValidTransactionType(type).should.be.true();
      }
    });
  });

  describe('validateAmount', () => {
    it('should throw an error if amount is not a string', () => {
      const amount: any = 123; // This is not a string
      should(() => XrpUtils.validateAmount(amount)).throw(UtilsError, {
        message: `amount type ${typeof amount} must be a string`,
      });
    });

    it('should throw an error if amount is not a valid number', () => {
      const amount = 'invalid'; // This is not a valid number
      should(() => XrpUtils.validateAmount(amount)).throw(UtilsError, {
        message: `amount ${amount} is not valid`,
      });
    });

    it('should throw an error if amount is not a valid interger', () => {
      const amount = '123.23'; // This is not a valid interger
      should(() => XrpUtils.validateAmount(amount)).throw(UtilsError, {
        message: `amount ${amount} is not valid`,
      });
    });

    it('should throw an error if amount is negative number', () => {
      const amount = '-123';
      should(() => XrpUtils.validateAmount(amount)).throw(UtilsError, {
        message: `amount ${amount} is not valid`,
      });
    });

    it('should not throw an error if amount is a valid number string', () => {
      const amount = '123'; // This is a valid number string
      should(() => XrpUtils.validateAmount(amount)).not.throw();
    });
  });

  describe('isValidNumber', () => {
    it('should return true for valid numbers', () => {
      const validNumbers = [10, '10'];
      for (const validNumber of validNumbers) {
        XrpUtils.isValidNumber(validNumber).should.be.true();
      }
    });

    it('should return false for invalid numbers', () => {
      const invalidNumbers = ['10.1', '-10', 'abc', undefined, -10, 10.1];
      for (const invalidNumber of invalidNumbers) {
        // @ts-expect-error testing for invalid type
        XrpUtils.isValidNumber(invalidNumber).should.be.false();
      }
    });
  });

  describe('validateAccountSetFlag', () => {
    it('should throw an error if the flag is not a valid number', () => {
      const invalidFlag = 'invalid';
      should(() => {
        // @ts-expect-error testing for invalid type
        XrpUtils.validateAccountSetFlag(invalidFlag);
      }).throw(UtilsError, { message: `setFlag ${invalidFlag} is not valid` });
    });

    it('should throw an error if the flag is not a valid account set flag', () => {
      const invalidFlag = 55;
      should(() => {
        XrpUtils.validateAccountSetFlag(invalidFlag);
      }).throw(UtilsError, { message: `setFlag ${invalidFlag} is not a valid account set flag` });
    });

    it('should not throw an error if the flag is valid', () => {
      const validFlags = VALID_ACCOUNT_SET_FLAGS;
      for (const validFlag of validFlags) {
        should(() => {
          XrpUtils.validateAccountSetFlag(validFlag);
        }).not.throw();
      }
    });
  });

  describe('validateSequence', () => {
    it('should throw an error if sequence is not a number', () => {
      const invalidSequence = 'abc';

      should(() => {
        // @ts-expect-error testing for invalid type
        XrpUtils.validateSequence(invalidSequence);
      }).throw(UtilsError, { message: `sequence type string must be a number` });
    });

    it('should not throw an error if sequence is valid', () => {
      const validSequence = 1;

      should(() => {
        XrpUtils.validateSequence(validSequence);
      }).not.throw();
    });
  });

  describe('validateFee', () => {
    it('should throw an error when fee is not a string', () => {
      const fee = 123;
      // @ts-expect-error testing for invalid type
      should(() => XrpUtils.validateFee(fee)).throw(UtilsError, { message: `fee type ${typeof fee} must be a string` });
    });

    it('should throw an error when fee is not valid', () => {
      const fee = 'invalid';
      should(() => XrpUtils.validateFee(fee)).throw(UtilsError, { message: `fee ${fee} is not valid` });
    });

    it('should not throw an error when fee is valid', () => {
      const fee = '1000';
      should(() => XrpUtils.validateFee(fee)).not.throw();
    });
  });

  describe('validateFlags', () => {
    it('should throw an error if flags is not a number', () => {
      const flags = 'not a number';
      // @ts-expect-error testing for invalid type
      should(() => XrpUtils.validateFlags(flags)).throw(`flags type string must be a number`);
    });

    it('should throw an error if flags is not valid', () => {
      const flags = -11;
      should(() => XrpUtils.validateFlags(flags)).throw(`flags ${flags} is not valid`);
    });

    it('should not throw an error if flags is valid', () => {
      const flags = 333;
      should(() => XrpUtils.validateFlags(flags)).not.throw();
    });
  });

  describe('validateSignerQuorum', () => {
    it('should throw an error if the quorum type is not a number', () => {
      const invalidQuorum = '2';
      // @ts-expect-error testing for invalid type
      should(() => XrpUtils.validateSignerQuorum(invalidQuorum)).throw(UtilsError, {
        message: `quorum type string must be a number`,
      });
    });

    it('should throw an error if the quorum is not valid', () => {
      const invalidQuorum = -1;
      should(() => XrpUtils.validateSignerQuorum(invalidQuorum)).throw(UtilsError, {
        message: `quorum ${invalidQuorum} is not valid`,
      });
    });

    it('should throw an error if the quorum is 0', () => {
      const invalidQuorum = 0;
      should(() => XrpUtils.validateSignerQuorum(invalidQuorum)).throw(UtilsError, {
        message: `quorum ${invalidQuorum} must be 1 or greater`,
      });
    });

    it('should not throw an error if the quorum is valid', () => {
      const validQuorum = 2;
      should(() => XrpUtils.validateSignerQuorum(validQuorum)).not.throw();
    });
  });

  describe('validateSigner', () => {
    it('should throw an error if signer has no address', () => {
      const signer = {
        weight: 1,
      };
      // @ts-expect-error testing for invalid type
      should(() => XrpUtils.validateSigner(signer)).throw('signer must have an address');
    });

    it('should throw an error if signer address is invalid', () => {
      const signer = {
        address: 'invalid address',
      };
      // @ts-expect-error testing for invalid type
      should(() => XrpUtils.validateSigner(signer)).throw('signer address invalid address is invalid');
    });

    it('should throw an error if signer weight is not a valid number', () => {
      const signer = {
        address: 'r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8',
        weight: 'not a number',
      };
      // @ts-expect-error testing for invalid type
      should(() => XrpUtils.validateSigner(signer)).throw('signer weight not a number is not valid');
    });

    it('should not throw an error if signer is valid', () => {
      const signer = {
        address: 'r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8',
        weight: 1,
      };
      should(() => XrpUtils.validateSigner(signer)).not.throw();
    });
  });

  describe('isValidMessageKey', () => {
    it('should return true when messageKey is a string', () => {
      const messageKey = ['test', ''];
      for (const key of messageKey) {
        XrpUtils.isValidMessageKey(key).should.be.true();
      }
    });

    it('should return false when messageKey is not a string', () => {
      const messageKey = [123, undefined];
      for (const key of messageKey) {
        // @ts-expect-error testing for invalid type
        XrpUtils.isValidMessageKey(key).should.be.false();
      }
    });
  });
});
