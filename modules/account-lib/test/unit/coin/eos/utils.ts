import should from 'should';
import { Eos } from '../../../../src';
import  Utils  from '../../../../src/coin/eos/utils';
import * as EosResources from '../../../resources/eos';


describe('Utils test cases', async () => {
    it('Should validate account name as Eos address', async () => {
        should.deepEqual(Utils.isValidAddress(EosResources.accounts.account1.name), true);;
    });

    it('Should throw not implemented for isvalid signature', async () => {
        should.throws(() => Utils.isValidSignature('abc'), 'isValidSignature not implemented');
    });

    it('Should throw not implemented for isvalid transaction ID', async () => {
        should.throws(() => Utils.isValidTransactionId('abc'),'isValidTransactionId not implemented');
    });

    it('Should throw not implemented for isvalid block ID', async () => {
        should.throws(() => Utils.isValidBlockId('abc'),'isValidBlockId not implemented');
    });

    it('Should throw missing required string rootAddress', async () => {
        should.throws(() => Utils.verifyAddress({address:'abc'}),'missing required string rootAddress');
    });

    it('Should throw ill formed address', async () => {
        should.throws(() => Utils.verifyAddress({address:'??:', rootAddress:'def'}),'The address ??: is not a well-formed eos address');
    });
   
    it('Should throw ill formed address', async () => {
        should.throws(() => Utils.verifyAddress({address:'eosaddr', rootAddress:'def'}),'The address eosaddr is not a well-formed eos address');
    });
});


