import 'should';
import { TestBitGo, TestBitGoAPI } from '@bitgo-beta/sdk-test';
import { BitGoAPI } from '@bitgo-beta/sdk-api';
import { Iota } from '../../src';
import assert from 'assert';
import { coins, GasTankAccountCoin } from '@bitgo-beta/statics';

describe('IOTA:', function () {
  let bitgo: TestBitGoAPI;
  let basecoin;

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    bitgo.safeRegister('iota', Iota.createInstance);
    bitgo.safeRegister('tiota', Iota.createInstance);
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('tiota');
  });

  it('should return the right info', function () {
    const iota = bitgo.coin('iota');
    const tiota = bitgo.coin('tiota');
    const iotaStatics = coins.get('iota') as GasTankAccountCoin;
    const tiotaStatics = coins.get('tiota') as GasTankAccountCoin;

    iota.getChain().should.equal('iota');
    iota.getFamily().should.equal('iota');
    iota.getFullName().should.equal('Iota');
    iota.getBaseFactor().should.equal(1e9);

    tiota.getChain().should.equal('tiota');
    tiota.getFamily().should.equal('iota');
    tiota.getFullName().should.equal('Testnet Iota');
    tiota.getBaseFactor().should.equal(1e9);

    iotaStatics.gasTankLowBalanceAlertFactor.should.equal(80);
    tiotaStatics.gasTankLowBalanceAlertFactor.should.equal(80);
    iotaStatics.gasTankMinBalanceRecommendationFactor.should.equal(200);
    tiotaStatics.gasTankMinBalanceRecommendationFactor.should.equal(200);
  });

  it('is valid pub', function () {
    // with 0x prefix
    basecoin.isValidPub('0x9b4e96086d111500259f9b38680b0509a405c1904da18976455a20c691d3bb07').should.equal(false);
    // without 0x prefix
    basecoin.isValidPub('9b4e96086d111500259f9b38680b0509a405c1904da18976455a20c691d3bb07').should.equal(true);
  });

  describe('Address Validation', () => {
    let keychains;
    let commonKeychain;

    before(function () {
      commonKeychain =
        '19bdfe2a4b498a05511381235a8892d54267807c4a3f654e310b938b8b424ff4adedbe92f4c146de641c67508a961324c8504cdf8e0c0acbb68d6104ccccd781';
      keychains = [
        {
          id: '6424c353eaf78d000766e95949868468',
          source: 'user',
          type: 'tss',
          commonKeychain:
            '19bdfe2a4b498a05511381235a8892d54267807c4a3f654e310b938b8b424ff4adedbe92f4c146de641c67508a961324c8504cdf8e0c0acbb68d6104ccccd781',
          encryptedPrv:
            '{"iv":"cZd5i7L4RxtwrALW2rK7UA==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"5zgoH1Bd3Fw=","ct":"9vVlnXFRtrM9FVEo+d2chbGHlM9lFZemueBuAs3BIkPo33Fo7jzwwNK/kIWkEyg+NmEBd5IaqAS157nvvvwzzsmMWlQdUz9qbmXNv3pg987cXFR08exS+4uhwP1YNOjJTRvRNcO9ZqHb46d4fmyJ/yC9/susCge7r/EsbaN5C3afv1dzybuq912FwaQElZLYYp5BICudFOMZ9k0UDMfKM/PMDkH7WexoGHr9GKq/bgCH2B39TZZyHKU6Uy47lXep2s6h0DrMwHOrnmiL3DZjOj88Ynvphlzxuo4eOlD2UHia2+nvIaISYs29Pr0DAvREutchvcBpExj1kWWPv7hQYrv8F0NAdatsbWl3w+xKyfiMKo1USlrwyJviypGtQtXOJyw0XPN0rv2+L5lW8BbjpzHfYYN13fJTedlGTFhhkzVtbbPAKE02kx7zCJcjYaiexdSTsrDLScYNT9/Jhdt27KpsooehwVohLfSKz4vbFfRu2MPZw3/+c/hfiJNgtz6esWbnxGrcE8U2IwPYCaK+Ghk4DcqWNIni59RI5B5kAsQOToII40qPN510uTgxBSPO7q7MHgkxdd4CqBq+ojr9j0P7oao8E5Y+CBDJrojDoCh1oCCDW9vo2dXlVcD8SIbw7U/9AfvEbA4xyE/5md1M7CIwLnWs2Ynv0YtaKoqhdS9x6FmHlMDhN/DKHinrwmowtrTT82fOkpO5g9saSmgU7Qy3gLt8t+VwdEyeFeQUKRSyci8qgqXQaZIg4+aXgaSOnlCFMtmB8ekYxEhTY5uzRfrNgS4s1QeqFBpNtUF+Ydi297pbVXnJoXAN+SVWd80GCx+yI2dpVC89k3rOWK9WeyqlnzuLJWp2RIOB9cdW8GFv/fN+QAJpYeVxOE4+nZDsKnsj8nKcg9t4Dlx1G6gLM1/Vq9YxNLbuzuRC0asUYvdMnoMvszmpm++TxndYisgNYscpZSoz7wvcazJNEPfhPVjEkd6tUUuN4GM35H0DmKCUQNT+a6B6hmHlTZvjxiyGAg5bY59hdjvJ+22QduazlEEC6LI3HrA7uK0TpplWzS1tCIFvTMUhj65DEZmNJ2+ZY9bQ4vsMf+DRR3OOG4t+DMlNfjOd3zNv3QoY95BjfWpryFwPzDq7bCP67JDsoj7j2TY5FRSrRkD77H0Ewlux2cWfjRTwcMHcdQxxuV0OP0aNjGDjybFN"}',
        },
        {
          id: '6424c353eaf78d000766e96137d4404b',
          source: 'backup',
          type: 'tss',
          commonKeychain:
            '19bdfe2a4b498a05511381235a8892d54267807c4a3f654e310b938b8b424ff4adedbe92f4c146de641c67508a961324c8504cdf8e0c0acbb68d6104ccccd781',
          encryptedPrv:
            '{"iv":"vi0dPef/Rx7kG/pRySQi6Q==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"9efhQsiEvVs=","ct":"Gw6atvf6gxKzsjtl3xseipO3rAxp1mAz7Yu1ihFsi5/lf2vMZegApgZx+pyILFS9KKLHbNF3U6WgSYdrr2t4vzdLsXkH1WIxfHS+cd2C5N59yADZDnPJBT6pv/IRvaYelP0Ck3nIYQ2hSMm8op+VOWC/SzHeh7slYDqwEHTGan0Wigfvk1yRd7CCJTaEAomnc/4eFi2NY3X3gt/3opy9IAgknnwUFohn96EWpEQ0F6pbzH/Z8VF6gF+DUcrrByAxExUPnHQZiFk3YHU/vVV4FxBU/mVAE8xBsBn5ul5e5SUMPfc7TBuJWv4BByTNg9xDShF/91Yx2nbfUm5d9QmM8lpKgzzQvcK8POAPk87gRCuKnsGh5vNS0UppkHc+ocfzRQlGA6jze7QyyQO0rMj5Ly8kWjwk2vISvKYHYS1NR7VU549UIXo7NXjatunKSc3+IreoRUHIshiaLg6hl+pxCCuc0qQ43V0mdIfCjTN8gkGWLNk8R7tAGPz9jyapQPcPEGHgEz0ATIi6yMNWCsibS2eLiE1uVEJONoM4lk6FPl3Q2CHbW2MeEbqjY8hbaw18mNb2xSBH/Fwpiial+Tvi2imqgnCO4ZpO9bllKftZPcQy0stN+eGBlb5ufyflKkDSiChHYroGjEpmiFicdde48cJszF52uKNnf1q67fA9/S2FAHQab3EXojxH2Gbk+kkV2h/TYKFFZSWC3vi4e8mO+vjMUcR0AdsgPFyEIz0SCGuba3CnTLNdEuZwsauAeHkx2vUTnRgJPVgNeeuXmsVG76Sy2ggJHuals0Hj8U2Xda0qO1RuFfoCWfss9wn6HGRwPPkhSB/8oNguAqmRVGKkd8Zwt3IvrTd9fk0/rFFDJKGz7WyNHkYgUmNiGcItD12v0jx7FZ52EJzl3Av1RyJUQK18+8EYPh3SGiU9dt7VX0aF0uo6JouKhOeldUvMP+AugQz8fUclwTQsbboVg27Yxo0DyATVwThW5a56R6Qf5ZiQJluFuzs5y98rq0S5q046lE6o3vVmJpEdwjeSCJoET5CL4nTgkXyWvhm4eB8u/e66l3o0qbaSx8q9YYmT9EpRcl5TP4ThLBKETYdzVvg4exjQfektMatk5EyUpEIhZPXh5vXpJZesdfO9LJ8zTaHBsBjDPU7cdNgQMbebpataRi8A0el2/IJXl+E+olgAz5zC4i2O1Q=="}',
        },
        {
          id: '6424c353eaf78d000766e9510b125fba',
          source: 'bitgo',
          type: 'tss',
          commonKeychain:
            '19bdfe2a4b498a05511381235a8892d54267807c4a3f654e310b938b8b424ff4adedbe92f4c146de641c67508a961324c8504cdf8e0c0acbb68d6104ccccd781',
          verifiedVssProof: true,
          isBitGo: true,
        },
      ];
    });

    it('should return true when validating a well formatted address prefixed with 0x', async function () {
      const address = '0xf941ae3cbe5645dccc15da8346b533f7f91f202089a5521653c062b2ff10b304';
      basecoin.isValidAddress(address).should.equal(true);
    });

    it('should return false when validating an old address', async function () {
      const address = '0x2959bfc3fdb7dc23fed8deba2fafb70f3e606a59';
      basecoin.isValidAddress(address).should.equal(false);
    });

    it('should return false when validating an incorrectly formatted', async function () {
      const address = 'wrongaddress';
      basecoin.isValidAddress(address).should.equal(false);
    });

    it('should return true for isWalletAddress with valid address for index 4', async function () {
      const newAddress = '0x3f4b2a95d9b696989814f02f899cee491b4d600b1b918e979caec307af4b8dfc';
      const index = 4;

      const params = { commonKeychain, address: newAddress, index, keychains };
      (await basecoin.isWalletAddress(params)).should.equal(true);
    });

    it('should throw error for isWalletAddress when keychains is missing', async function () {
      const address = '0x2959bfc3fdb7dc23fed8deba2fafb70f3e606a59';
      const index = 0;

      const params = { commonKeychain, address, index };
      await assert.rejects(async () => basecoin.isWalletAddress(params));
    });

    it('should throw error for isWalletAddress when new address is invalid', async function () {
      const wrongAddress = 'badAddress';
      const index = 0;

      const params = { commonKeychain, address: wrongAddress, index };
      await assert.rejects(async () => basecoin.isWalletAddress(params), {
        message: `invalid address: ${wrongAddress}`,
      });
    });
  });
});
