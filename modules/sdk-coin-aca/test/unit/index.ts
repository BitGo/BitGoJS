// import * as nock from 'nock';
// import 'should';
//
// import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
// import { BitGoAPI } from '@bitgo/sdk-api';
//
// import { Taca } from '../../src/index';
//
// nock.disableNetConnect();
//
// const bitgo: TestBitGoAPI = TestBitGo.decorate(BitGoAPI, { env: 'test' });
// bitgo.safeRegister('taca', Taca.createInstance);
//
// describe('Acala', function () {
//   let bitgo;
//   let basecoin;
//
//   before(function () {
//     bitgo.initializeTestVars();
//     basecoin = bitgo.coin('taca');
//   });
//
//   after(function () {
//     nock.pendingMocks().should.be.empty();
//   });
//
//   it('should instantiate the coin', function () {
//     const basecoin = bitgo.coin('taca');
//     basecoin.should.be.an.instanceof(Taca);
//   });
//
//   it('isValidAddress should be correct', function () {
//     // Add valid addresses for testing
//     basecoin.isValidAddress('').should.be.True();
//     basecoin.isValidAddress('').should.be.True();
//     basecoin.isValidAddress('').should.be.True();
//   });
// });
