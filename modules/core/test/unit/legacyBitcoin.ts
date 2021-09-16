import 'should';
import * as BitGoJS from '../../src';

describe('legacyBitcoin', function () {
  it('toBase58Check, fromBase58Check', function () {
    const hash = Buffer.alloc(20, 0);
    const version = 10;
    const addr = BitGoJS.bitcoin.address.toBase58Check(hash, version);
    addr.should.eql('52P2r5yt6odmBLPsFCLBrFisJ3aSBHTm7z');
    const parsed = BitGoJS.bitcoin.address.fromBase58Check(addr);
    parsed.hash.should.eql(hash);
    parsed.version.should.eql(version);
  });
});
