import {
  MPCv2KeyGenStateEnum,
  RedpallasMPCv2KeyGenRound1Request,
  RedpallasMPCv2KeyGenRound1Response,
  RedpallasMPCv2KeyGenRound2Request,
  RedpallasMPCv2KeyGenRound2Response,
} from '@bitgo/public-types';
import { IBaseCoin } from '../../../baseCoin';
import { BitGoBase } from '../../../bitgoBase';
import { IWallet } from '../../../wallet';
import BaseTssUtils from '../baseTSSUtils';
import {
  GenerateRedpallasMPCv2KeyRequestBody,
  GenerateRedpallasMPCv2KeyRequestResponse,
  RedpallasKeyGenSenderForEnterprise,
  RedpallasMPCv2KeyGenSendFn,
} from './redpallasMPCv2KeyGenSender';

/**
 * DKG-only MPCv2 utils for the Zcash Orchard shielded pool (RedPallas / "Ironwood").
 *
 * This currently only exposes the BitGo-platform round1/round2 dispatch used by the custodial
 * SMC/OVC ceremony (see `RedpallasMPCv2SMCUtils` in `./SMC/utils.ts`) - there is no self-custody
 * (direct, non-OVC) key-generation entrypoint here, since nothing in this SDK constructs one
 * today. There is also no signing (DSG) support - transaction signing for Zcash shielded
 * addresses is out of scope for this SDK.
 *
 * RedPallas MPS DKG completes in the same 2-round shape as EdDSA MPS DKG (round0 local, round1 +
 * round2 online). The resulting `commonPublicKeychain` is the raw 32-byte RedPallas group public
 * key (64 hex chars) - there is no BIP32-style chain code, unlike EdDSA/ECDSA commonKeychains.
 */
export class RedpallasMPCv2Utils extends BaseTssUtils<unknown> {
  constructor(bitgo: BitGoBase, baseCoin: IBaseCoin, wallet?: IWallet) {
    super(bitgo, baseCoin, wallet);
    this.setBitgoGpgPubKey(bitgo);
  }

  // #region platform round1/round2 dispatch

  async sendKeyGenerationRound1(
    enterprise: string,
    payload: RedpallasMPCv2KeyGenRound1Request,
    safeId?: string
  ): Promise<RedpallasMPCv2KeyGenRound1Response> {
    return this.sendKeyGenerationRound1BySender(
      RedpallasKeyGenSenderForEnterprise(this.bitgo, enterprise, safeId),
      payload
    );
  }

  async sendKeyGenerationRound1BySender(
    senderFn: RedpallasMPCv2KeyGenSendFn<GenerateRedpallasMPCv2KeyRequestResponse>,
    payload: RedpallasMPCv2KeyGenRound1Request
  ): Promise<RedpallasMPCv2KeyGenRound1Response> {
    return senderFn(
      MPCv2KeyGenStateEnum['MPCv2-R1'],
      payload as GenerateRedpallasMPCv2KeyRequestBody
    ) as Promise<RedpallasMPCv2KeyGenRound1Response>;
  }

  async sendKeyGenerationRound2(
    enterprise: string,
    payload: RedpallasMPCv2KeyGenRound2Request
  ): Promise<RedpallasMPCv2KeyGenRound2Response> {
    return this.sendKeyGenerationRound2BySender(RedpallasKeyGenSenderForEnterprise(this.bitgo, enterprise), payload);
  }

  async sendKeyGenerationRound2BySender(
    senderFn: RedpallasMPCv2KeyGenSendFn<GenerateRedpallasMPCv2KeyRequestResponse>,
    payload: RedpallasMPCv2KeyGenRound2Request
  ): Promise<RedpallasMPCv2KeyGenRound2Response> {
    return senderFn(
      MPCv2KeyGenStateEnum['MPCv2-R2'],
      payload as GenerateRedpallasMPCv2KeyRequestBody
    ) as Promise<RedpallasMPCv2KeyGenRound2Response>;
  }

  // #endregion
}
