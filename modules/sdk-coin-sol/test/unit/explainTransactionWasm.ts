/**
 * Tests for explainTransactionWasm (WASM-based Solana transaction explanation).
 */
import 'should';
import { explainSolTransaction } from '../../src/lib/explainTransactionWasm';

describe('explainTransactionWasm', function () {
  describe('deriveTransactionType', function () {
    it('should classify boilerplate-only transaction as CustomTx', function () {
      // Transaction with only NonceAdvance + Memo instructions (no Transfer or TokenTransfer).
      // Previously this would incorrectly fall through to 'Send'.
      const BOILERPLATE_ONLY_TX_BASE64 =
        'AgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADE3aDK9nmEccOmQJ4crZzPuTnRVa3woFSjKzE2hcsFbNkpvA8Lnj7CVeJ+/UfXwLI5g223D02m4+REUfPc50QCAgEEB8OpoX+Ybq/j8xi80DhFtj8AUVHPrjhK1E3DnT5Bmx346iUtYQKMMBolIAO6PmfJh3w7huFcYcGNOB8sgXN38Wg6ZrWANNJfb64q8B242qfRiT7dffb80H2OoXGQ0aq0lAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABUpTWpkpIQZNJOhxYNo4fHw1td28kruB5B+oQEEFRI0Gp9UXGMd0yShWY5hpHV62i164o5tLbVxzVVshAAAAAAan1RcZLFaO4IqEX3PSl4jPA1wxRbIas0TYBi6pQAAAEHPqtGYOjjqVfHgg1S32M4qMe2AQO/kDy1+CEYQwkisDAwMCBgEEBAAAAAQCAAUJSGVsbG8gQVBJBAAnQVBJIEludGVncmF0aW9uIHRlc3QgY3VzdG9tIHRyYW5zYWN0aW9u';

      const explained = explainSolTransaction({
        txBase64: BOILERPLATE_ONLY_TX_BASE64,
        feeInfo: { fee: '5000' },
        coinName: 'tsol',
      });

      explained.type.should.equal('CustomTx');
      explained.outputAmount.should.equal('0');
      explained.outputs.length.should.equal(0);
      (typeof explained.memo).should.equal('string');
    });

    it('should classify token enablement (ATA init + Token ACL permissionless thaw) as AssociatedTokenAccountInitialization', function () {
      // Token-2022 mint (TransferHook + DefaultAccountState frozen, sRFC-37 Token ACL gating with
      // permissionless thaw enabled). The enablement prebuild appends the Token ACL
      // ThawPermissionlessIdempotent instruction (program TACLkU6..., discriminator 9) after the
      // idempotent ATA-init. The wasm parser does not know the Token ACL program, so it parses as
      // Unknown — this previously misclassified the enablement as CustomTx and failed
      // verifyTxType ("Invalid transaction type on token enablement").
      const ATA_INIT_WITH_TOKEN_ACL_THAW_BASE64 =
        'AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAYJUhCF9LHo7KiG7HDDtCQbbIAJG2uinMlIg5Jby7LiGCUk9dBaCEmT0ePnPYh4E/3Lb7jS7cZGyoPKxxPGdAbPtQZ6KIKRB9he5+4YMC6z6SnI4p2UviExxtQ63M7yyNzKAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAoxrewX5VA2FlHpnxuxejiSESVZI1yzGOHB4uV5TmCPCTxZ+GHLPVbt3R+ul84ehxVAgqM3rmztfFLW8m/o/41jJclj04kifG7PRApFI4NgwtaE5na/xCEBI572Nvp+FkGs3+acPQG6jbTKfWUpRYFlg/y4TcXWy7aAGbKMjprzgbd9uHudY/eGEJdvORszdq2GvxNg7kNJ/69+SjYoYv8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACBgYAAgAFAwgBAQcGAAIFAAEEAQk=';

      const explained = explainSolTransaction({
        txBase64: ATA_INIT_WITH_TOKEN_ACL_THAW_BASE64,
        feeInfo: { fee: '5000' },
        coinName: 'tsol',
      });

      explained.type.should.equal('AssociatedTokenAccountInitialization');
      explained.tokenEnablements?.length.should.equal(1);
      explained.tokenEnablements?.[0].tokenName.should.equal('3VDBJWgzRUscjQzzAp52na1dDquExZmD1PkCvH9svGF6');
    });

    it('should classify a Token-2022 BurnChecked unknown instruction as CustomTx', function () {
      // BurnChecked is not decoded by the WASM parser, so it is emitted as Unknown with
      // base64-encoded data. This must not throw while checking for confidential transfers.
      const TOKEN_2022_BURN_CHECKED_BASE64 =
        'AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAIEd4VubrtXALIH766Ipu/Fvh26FyvOPjpBMkYBe3UO30SFN5lu5h+qbiflw3DnoJGsdJ035d0WtazcVkIoE5FhOgk/IBzpsSfv2fKcdhTIHFEQKNBi10zrLtUIacusFNtQBt324e51j94YQl285GzN2rYa/E2DuQ0n/r35KNihi/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEDAwECAAoKQEIPAAAAAAAG';

      const explained = explainSolTransaction({
        txBase64: TOKEN_2022_BURN_CHECKED_BASE64,
        feeInfo: { fee: '5000' },
        coinName: 'tsol',
      });

      explained.type.should.equal('CustomTx');
    });

    it('should classify token transfer with Token ACL permissionless thaw as Send', function () {
      // TokenTransfer (transferChecked, Token-2022) + Token ACL ThawPermissionlessIdempotent for
      // the destination ATA. The Unknown thaw instruction previously triggered the CustomTx
      // fallback before the Send check.
      const TRANSFER_WITH_TOKEN_ACL_THAW_BASE64 =
        'AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAQIUhCF9LHo7KiG7HDDtCQbbIAJG2uinMlIg5Jby7LiGCVlN8xCFuLWWqDUa7zdMscRzHJShFmQ4avYUk5r95qhqrMUSZcan5PQzSooMXH6hoZngse42Tou1uN7aFDVDLStBnoogpEH2F7n7hgwLrPpKcjinZS+ITHG1DrczvLI3MooxrewX5VA2FlHpnxuxejiSESVZI1yzGOHB4uV5TmCPCTxZ+GHLPVbt3R+ul84ehxVAgqM3rmztfFLW8m/o/41BrN/mnD0Buo20yn1lKUWBZYP8uE3F1su2gBmyjI6a84G3fbh7nWP3hhCXbzkbM3athr8TYO5DSf+vfko2KGL/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgcEAwUBAAoMAQAAAAAAAAAJBgYAAQUAAgQBCQ==';

      const explained = explainSolTransaction({
        txBase64: TRANSFER_WITH_TOKEN_ACL_THAW_BASE64,
        feeInfo: { fee: '5000' },
        coinName: 'tsol',
      });

      explained.type.should.equal('Send');
    });
  });
});
