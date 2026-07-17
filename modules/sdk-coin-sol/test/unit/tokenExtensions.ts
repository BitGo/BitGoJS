import 'should';
import { SolTokenExtensionType } from '@bitgo/statics';
import { assertExtensionCompatibility, mapModeledExtensions } from '../../src/lib/tokenExtensions';

describe('Sol Token-2022 mint extension parsing', function () {
  describe('mapModeledExtensions', function () {
    it('maps spl-token extension names to modeled BitGo types', function () {
      mapModeledExtensions(['TransferFeeConfig', 'PermanentDelegate']).should.eql([
        SolTokenExtensionType.TransferFee,
        SolTokenExtensionType.PermanentDelegate,
      ]);
    });

    it('ignores extensions BitGo does not model', function () {
      mapModeledExtensions(['ImmutableOwner', 'MetadataPointer', 'TransferHook']).should.eql([
        SolTokenExtensionType.TransferHook,
      ]);
    });

    it('deduplicates', function () {
      mapModeledExtensions(['TransferFeeConfig', 'TransferFeeConfig']).should.eql([SolTokenExtensionType.TransferFee]);
    });
  });

  describe('assertExtensionCompatibility', function () {
    it('throws when Transfer Hook and Confidential Transfer coexist', function () {
      (() => assertExtensionCompatibility(['TransferHook', 'ConfidentialTransferMint'])).should.throw(/cannot coexist/);
    });

    it('allows Transfer Hook without Confidential Transfer', function () {
      (() => assertExtensionCompatibility(['TransferHook', 'TransferFeeConfig'])).should.not.throw();
    });
  });
});
