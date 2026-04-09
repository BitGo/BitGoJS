/* eslint-disable @typescript-eslint/ban-ts-comment */
import should from 'should';
import { Codes, CodesTypes } from '../src';

describe('chain codes', function () {
  const externalList = [Codes.external.p2sh, Codes.external.p2shP2wsh, Codes.external.p2wsh, Codes.external.p2tr];

  const internalList = [Codes.internal.p2sh, Codes.internal.p2shP2wsh, Codes.internal.p2wsh, Codes.internal.p2tr];

  const purposeByScriptTypeList = [Codes.p2sh, Codes.p2shP2wsh, Codes.p2wsh, Codes.p2tr];

  const supportedUnspentTypeList = [
    CodesTypes.UnspentType.p2sh,
    CodesTypes.UnspentType.p2shP2wsh,
    CodesTypes.UnspentType.p2wsh,
    CodesTypes.UnspentType.p2tr,
  ];

  const unsupportedUnspentTypeList = [CodesTypes.UnspentType.p2pkh, CodesTypes.UnspentType.p2wpkh];

  it(`is immutable`, function () {
    const p2sh = Codes.internal.p2sh;
    should.throws(() => {
      // @ts-ignore
      Codes.internal.p2sh = -1;
    }, TypeError);
    Codes.internal.p2sh.should.eql(p2sh);

    should.throws(() => {
      // @ts-ignore
      Codes.internal.values.push(-1);
    }, TypeError);

    should.throws(() => {
      // @ts-ignore
      Codes.internal.values = [];
    }, TypeError);
    Codes.internal.values.should.eql([1, 11, 21, 31]);

    should.throws(() => {
      // @ts-ignore
      Codes.all = [];
    });
    Codes.all.should.not.be.empty();
  });

  it('matches expected values', function () {
    externalList.should.eql([Codes.p2sh.external, Codes.p2shP2wsh.external, Codes.p2wsh.external, Codes.p2tr.external]);
    externalList.should.eql([0, 10, 20, 30]);
    externalList.should.eql([...Codes.external.values]);

    Codes.all.should.eql([...externalList, ...internalList]);
    internalList.should.eql([Codes.p2sh.internal, Codes.p2shP2wsh.internal, Codes.p2wsh.internal, Codes.p2tr.internal]);
    internalList.should.eql([1, 11, 21, 31]);
    internalList.should.eql([...Codes.internal.values]);
  });

  it('are grouped correctly', function () {
    internalList.should.matchEach(Codes.isInternal);
    externalList.should.matchEach(Codes.isExternal);

    // all are either internal or external, never none or both
    Codes.all.should.matchEach((code) => !!(Codes.isExternal(code) !== Codes.isInternal(code)));

    Codes.p2sh.values.should.matchEach(Codes.isP2sh);
    Codes.p2shP2wsh.values.should.matchEach(Codes.isP2shP2wsh);
    Codes.p2wsh.values.should.matchEach(Codes.isP2wsh);
    Codes.p2tr.values.should.matchEach(Codes.isP2tr);

    // every code has exactly one address type
    Codes.all.should.matchEach(
      (code) =>
        1 ===
        [Codes.isP2sh(code), Codes.isP2wsh(code), Codes.isP2shP2wsh(code), Codes.isP2tr(code)].reduce(
          (sum, v) => sum + Number(v),
          0
        )
    );

    Codes.all.should.matchEach(Codes.isValid);
  });

  const invalidInputs = [undefined, null, 'lol', -1, 42];

  it('throws correct error for invalid input', function () {
    [
      Codes.isInternal,
      Codes.isExternal,
      Codes.isP2sh,
      Codes.isP2shP2wsh,
      Codes.isP2wsh,
      Codes.isP2tr,
      Codes.typeForCode,
    ].forEach((func) =>
      // @ts-ignore
      invalidInputs.forEach((input) => should.throws(() => func(input), Codes.ErrorInvalidCode))
    );

    invalidInputs.should.matchEach((input) => !Codes.isValid(input));
  });

  it('map to unspent types', function () {
    [...externalList, ...internalList].forEach((code, index) =>
      Codes.typeForCode(code).should.equal([...supportedUnspentTypeList, ...supportedUnspentTypeList][index])
    );
  });

  it('map from unspent types', function () {
    supportedUnspentTypeList.forEach((type, index) => Codes.forType(type).should.eql(purposeByScriptTypeList[index]));

    unsupportedUnspentTypeList.forEach((type) => should.throws(() => Codes.forType(type)));
  });

  it(`has chain type`, function () {
    Codes.all.should.matchEach((code) => Codes.ChainCodeTcomb(code) === code && Codes.ChainCodeTcomb.is(code));
    invalidInputs.forEach((code: any) => should.throws(() => Codes.ChainCodeTcomb(code)));
  });
});
