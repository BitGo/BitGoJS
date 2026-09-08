import 'should';
import { SolTokenExtensionType } from '@bitgo/statics';
import { ExtensionType, type Mint } from '@solana/spl-token';
import { PublicKey } from '@solana/web3.js';
import { mapModeledExtensions, parseMintExtensions } from '../../src/lib/tokenExtensions';

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

  describe('parseMintExtensions', function () {
    function tlvEntry(type: ExtensionType, value: Buffer): Buffer {
      const head = Buffer.alloc(4);
      head.writeUInt16LE(type, 0);
      head.writeUInt16LE(value.length, 2);
      return Buffer.concat([head, value]);
    }

    function fakeMint(tlvData: Buffer): Mint {
      return {
        address: PublicKey.default,
        mintAuthority: null,
        supply: BigInt(0),
        decimals: 6,
        isInitialized: true,
        freezeAuthority: null,
        tlvData,
      };
    }

    it('parses a mint declaring both Transfer Hook and Confidential Transfer', function () {
      // Legal on-chain: token-2022's check_for_invalid_mint_extension_combinations
      // does not forbid this pair. Regression test — an SDK-level assert used to
      // reject it and block onboarding of real mints.
      const tlvData = Buffer.concat([
        tlvEntry(ExtensionType.ConfidentialTransferMint, Buffer.alloc(0)),
        tlvEntry(ExtensionType.TransferHook, Buffer.alloc(64)), // authority (32) + programId (32)
      ]);
      const result = parseMintExtensions(fakeMint(tlvData));
      result.detectedTypeNames.should.eql(['ConfidentialTransferMint', 'TransferHook']);
      result.extensions.detected.should.eql([SolTokenExtensionType.TransferHook]);
      result.extensions.transferHookProgramId?.should.equal('11111111111111111111111111111111');
    });
  });
});
