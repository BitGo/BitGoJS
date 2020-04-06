import should from 'should';
import BN from 'bn.js';
import {
  sign,
  getContractData,
  isValidAddress,
  isValidBlockHash,
  padToEven,
  isHexPrefixed,
  stripHexPrefix,
  stripZeros,
  isHexString,
  intToHex,
  intToBuffer,
  toBuffer,
  bufferToInt,
  getFieldValue,
} from '../../../../src/coin/eth/utils';


const STRING_HEX = '0xa43f0BDd451E39C7AF20426f43589DEFAd4335E6';
const STRING_NO_HEX = 'a43f0BDd451E39C7AF20426f43589DEFAd4335E6';
const STRING_ZEROS = '0x000f0BDd451E39C7AF20426f43589DEFAd4335E6'
const STRING_WITHOUT_ZEROS = 'f0BDd451E39C7AF20426f43589DEFAd4335E6'
const ARRAY = ['1', '2', '3'];
const FIELD = { allowZero: false, allowLess: true, length: 64, name: '' };
const BN_ = new BN('18446744073709551615'); 
const BUFFER = new Buffer(['04','00']);


describe('isValidAddress', function() {
  it('should return valid result', async () => {
    should.equal(isValidAddress('0xBa8eA9C3729686d7DB120efCfC81cD020C8DC1CB'), true);
    should.equal(isValidAddress('0xBa8eA9C3729686d7DB120efCfC81cD020C8DC1CP'), false);
    should.equal(isValidAddress('0xBA8EA9C3729686D7DB120EFCfC81CD020C8DC1CB'), true);
    should.equal(isValidAddress('A8EA9C3729686D7DB120EFCfC81CD020C8DC1CB'), false);
  });
});

describe('Correct string', function() {
  it('should return if the string begin with Ox', async () => {
    should.equal(isHexPrefixed(STRING_HEX), true);
    should.equal(isHexPrefixed(STRING_NO_HEX), false);
  });
  it('strip hex prefix', async () => {
    should.equal(stripHexPrefix(STRING_HEX), STRING_NO_HEX);
    should.equal(stripHexPrefix(STRING_NO_HEX), STRING_NO_HEX);
  });
  it('validate a hex string', async () => {
    should.equal(isHexString(STRING_HEX), true);
    should.equal(isHexString(STRING_NO_HEX), false);
  });
  it('should return an even length string', async () => {
    should.equal(padToEven('123'), '0123');
  });
  it('should strip zeros',async() =>{
    should.equal(stripZeros(STRING_ZEROS),STRING_WITHOUT_ZEROS);
});
});

describe('Correct buffer', function() {
  should.equal(Buffer.isBuffer(toBuffer(STRING_HEX)), true);
  should.equal(Buffer.isBuffer(toBuffer(STRING_NO_HEX)), true);
  should.equal(Buffer.isBuffer(toBuffer(1234)), true);
  should.equal(Buffer.isBuffer(toBuffer(BN_)), true);
  should.throws(() => toBuffer(ARRAY));
});

describe('Obtain field value', function() {
  should.equal(getFieldValue(0, FIELD).toString(), '');
});
describe('Correct conversion', function(){
  it('should convert to hex', async() => {
    should.equal(intToHex(1000),'0x3e8');
  });
  it('should convert int to buffer', async() => {
    should.equal(Buffer.isBuffer(intToBuffer(1234)), true);
  });
  it('should convert buffer to int', async() => {
    should.equal(bufferToInt(BUFFER),1024);
  });
  
 
});
