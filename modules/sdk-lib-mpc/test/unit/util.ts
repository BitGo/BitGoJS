import assert from 'assert';
import { Buffer } from 'buffer';
import 'should';

import {
  bigIntFromBufferBE,
  randomBigInt,
  randomPositiveCoPrimeLessThan,
  randomPositiveCoPrimeTo,
  getDerivationPath,
} from '../../src';
import { gcd } from 'bigint-mod-arith';

describe('mpc utils', () => {
  describe('bigIntFromBufferBE', () => {
    it('should convert buffer to bigInt', () => {
      const tests = [
        {
          input: Buffer.from('abcdef123', 'hex'),
          output: '2882400018',
        },
        {
          input: Buffer.from(
            'f1e4e82273030db23fe0e5e235caf0341b3e2c10e1e38b24901315f70e1b9d1efa44c53ce95e7328dd09924b1ab35b395cbbd32310e01d5fb166aafd03bd283885cb8be02e99c3de1c29137c3eb1394afa80e207fab8b7a80b176795469622d4f92650b3e4ad5d26119c514ebac5fba6a54251f32847faa6c23b53dfa079b6e0796b2b6bdb9af430c8346919756b5735500eb9621605f3e5712608e01b0a180231e8f912c6a0ed910e13e0df4e12f92d67faea8642f01b0c5aa7e5678016465bef75608e4b956be686a108e5d36b1d053c02932a5be26680e5f4db9e9a84491a32ea14c49d3dd7604fd0e4ced918399702969bc59481ec4a235b5181a2fe0b3031f791d495a0136e91e0288775645ec8cb05f2ac103b8dbe9a6febbdb43ccd16b14bc9705e8bd67591b7d6089155c9c20b90240d9cc082f26a721f77dacc458963352ee2b088652295197e16dce90a0dee9ca1a2e8b8244f53c64e69f04bbd104f06a3976b20a1fd64bc39459216463ee121f80176402c7ee11cc3708d0f2199',
            'hex'
          ),
          output:
            '5489491419472742346112564468977647819102865546263017300049295567595588910097657730427191253754619498497095527027456451885166736754354435148970672278783358895519157101158190350429037354635419315239982102583595385534070818917453998896687677929109472734680008765277303609419358369617967761863979069030359784505375145357723284549560732404082164358335625940377353683134996240144205562787280773077712059753078560133977155121080937433535950257474512850822863718684618118053028075212095124618983255185855074456542685200773498326256551736121736141025963025526136238800543616180353687512018515523176443669467677056011034279197367095199052671815739312195564065721886091256331542662625533749735436754723575401172949187033592481157282696206349338251929615644187109985027970610735004428625733022579855691003009436090968263693037199109796512804141409447305080682527956457360149484587193876816903195924906511594354042860011908951611479630233',
        },
      ];
      tests.forEach(({ input, output }) => {
        bigIntFromBufferBE(input).toString().should.equal(output);
      });
    });

    it('should throw an error for empty input', () => {
      (() => {
        bigIntFromBufferBE(Buffer.from('', 'hex'));
      }).should.throw('Cannot convert 0x to a BigInt');
    });
  });

  describe('randomPositiveCoPrimeLessThan', function () {
    it('should throw an error if x <= 2', async function () {
      const testCases = [BigInt(2), BigInt(1), BigInt(0), BigInt(-1)];
      for (const testCase of testCases) {
        try {
          await randomPositiveCoPrimeLessThan(testCase);
          assert.fail('should throw');
        } catch (e) {
          assert.strictEqual(e.message, 'x must be larger than 2');
        }
      }
    });

    it('should find valid coprime less than x', async function () {
      const testCases = [BigInt(3), BigInt(5)];
      const expectedValues = [[BigInt(2)], [BigInt(2), BigInt(3), BigInt(4)]];
      for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i];
        const validResults = expectedValues[i];
        const res = await randomPositiveCoPrimeLessThan(testCase);
        assert.strictEqual(validResults.includes(res), true);
      }
    });
  });

  describe('randomPositiveCoPrimeTo', function () {
    it('should find a valid positive coprime', async function () {
      const testCases = await Promise.all([
        randomBigInt(256),
        randomBigInt(256),
        randomBigInt(128),
        randomBigInt(3072),
      ]);
      for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i];
        const res = await randomPositiveCoPrimeTo(testCase);
        assert.strictEqual(res > 0, true);
        assert.strictEqual(gcd(res, testCase), BigInt(1));
      }
    });
  });

  describe('getDerivationPath', function () {
    it('should get derivation path from a provided seed', function () {
      const seed = '1';
      const derivationPath = getDerivationPath(seed);
      assert.strictEqual(derivationPath, 'm/999999/163767512/266960264');
    });

    it('should get derivation path from a provided seed when it is not master', function () {
      const seed = '1';
      const isMaster = false;
      const derivationPath = getDerivationPath(seed, isMaster);
      assert.strictEqual(derivationPath, '999999/163767512/266960264');
    });

    it('should get derivation path from an empty string seed', function () {
      const seed = '';
      const derivationPath = getDerivationPath(seed);
      assert.strictEqual(derivationPath, 'm/999999/98528782/41292633');
    });

    it('should get derivation path from a long string seed', function () {
      const seed = 'thisisareallylongseedtoseeifitworksandconsistentlyworks';
      const derivationPath = getDerivationPath(seed);
      assert.strictEqual(derivationPath, 'm/999999/201872612/82248621');
    });
  });
});
