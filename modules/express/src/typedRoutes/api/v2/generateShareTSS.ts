import * as t from 'io-ts';
import { Json } from 'io-ts-types';
import { httpRoute, httpRequest, optional } from '@api-ts/io-ts-http';
import { BitgoExpressError } from '../../schemas/error';

/**
 * Request parameters for TSS share generation (external signer mode)
 */
export const GenerateShareTSSParams = {
  /** The coin type (e.g., 'tbtc', 'gteth', etc.) */
  coin: t.string,
  /**
   * The type of share to generate. Valid values depend on the MPC algorithm:
   * - EDDSA: 'commitment', 'R', 'G'
   * - ECDSA: 'PaillierModulus', 'K', 'MuDelta', 'S'
   * - ECDSA MPCv2: 'MPCv2Round1', 'MPCv2Round2', 'MPCv2Round3'
   */
  sharetype: t.string,
} as const;

/**
 * Serialized Ntilde structure (ECDSA challenge parameters)
 * Based on: modules/sdk-lib-mpc/src/tss/ecdsa/types.ts:29-36
 */
const SerializedNtilde = t.type({
  /** Ntilde value (hex string) */
  ntilde: t.string,
  /** H1 value (hex string) */
  h1: t.string,
  /** H2 value (hex string) */
  h2: t.string,
});

/**
 * Serialized Paillier Challenge structure
 * Based on: modules/sdk-lib-mpc/src/tss/ecdsa/types.ts:120-129
 */
const SerializedPaillierChallenge = t.type({
  /** Paillier challenge array */
  p: t.array(t.string),
});

/**
 * Serialized ECDSA Challenges (Ntilde + Paillier)
 * Based on: modules/sdk-lib-mpc/src/tss/ecdsa/types.ts:54
 */
const SerializedEcdsaChallenges = t.intersection([SerializedNtilde, SerializedPaillierChallenge]);

/**
 * TxRequest Challenge Response (includes n field)
 * Based on: modules/sdk-core/src/bitgo/tss/types.ts:11-13
 */
const TxRequestChallengeResponse = t.intersection([
  SerializedEcdsaChallenges,
  t.type({
    /** N value for challenge */
    n: t.string,
  }),
]);

/**
 * Range Proof Share structure for ECDSA
 */
const RangeProofShare = t.type({
  z: t.string,
  u: t.string,
  w: t.string,
  s: t.string,
  s1: t.string,
  s2: t.string,
});

/**
 * Range Proof With Check Share structure for ECDSA
 */
const RangeProofWithCheckShare = t.type({
  z: t.string,
  zPrm: t.string,
  t: t.string,
  v: t.string,
  w: t.string,
  s: t.string,
  s1: t.string,
  s2: t.string,
  t1: t.string,
  t2: t.string,
  u: t.string,
  x: t.string,
});

/**
 * A Share from BitGo (for ECDSA MuDelta share generation)
 * Based on: modules/sdk-core/src/account-lib/mpc/tss/ecdsa/types.ts:151-163
 */
const AShare = t.intersection([
  t.type({
    /** Participant index */
    i: t.number,
    /** N value */
    n: t.string,
    /** K value */
    k: t.string,
    /** Alpha value */
    alpha: t.string,
    /** Mu value */
    mu: t.string,
    /** Ntilde value */
    ntilde: t.string,
    /** H1 value */
    h1: t.string,
    /** H2 value */
    h2: t.string,
  }),
  t.partial({
    /** Range proof (optional) */
    proof: RangeProofShare,
    /** Gamma proof (optional) */
    gammaProof: RangeProofWithCheckShare,
    /** W proof (optional) */
    wProof: RangeProofWithCheckShare,
  }),
]);

/**
 * D Share from BitGo (for ECDSA S share generation)
 * Based on: modules/sdk-core/src/account-lib/mpc/tss/ecdsa/types.ts:252-255
 */
const DShare = t.type({
  /** Participant index */
  i: t.number,
  /** Delta value */
  delta: t.string,
  /** Gamma value */
  Gamma: t.string,
});

/**
 * RShare structure for EDDSA (individual R share)
 * Based on: modules/sdk-core/src/account-lib/mpc/tss/eddsa/types.ts:57-65
 */
const RShareStructure = t.type({
  /** Participant index i */
  i: t.number,
  /** Participant index j */
  j: t.number,
  /** U value (hex string) */
  u: t.string,
  /** V value (hex string) */
  v: t.string,
  /** r value (hex string) */
  r: t.string,
  /** R value (hex string) */
  R: t.string,
  /** Commitment value (hex string) */
  commitment: t.string,
});

/**
 * Request body for generating TSS shares in external signer mode
 *
 * This route is used when BitGo Express is configured with external signing.
 * The handler extracts walletId from either txRequest or tssParams.txRequest,
 * then retrieves and decrypts the private key from the filesystem.
 *
 * **Configuration Requirements:**
 * - `signerFileSystemPath`: Path to JSON file containing encrypted private keys
 * - Environment variable: `WALLET_{walletId}_PASSPHRASE` for each wallet
 *
 * **Request Body Structure:**
 * The body can have either:
 * - `txRequest` directly (TxRequest object)
 * - `tssParams` containing `txRequest` (for more structured approach)
 *
 * Additional fields may be required depending on the share type and MPC algorithm.
 *
 * Reference: modules/express/src/clientRoutes.ts:416-495 (handleV2GenerateShareTSS)
 */
export const GenerateShareTSSBody = {
  /** Transaction request object with unsigned transaction data and walletId (either this or tssParams required) */
  txRequest: optional(Json),

  /** TSS parameters containing transaction request and optional tracing/verification data */
  tssParams: optional(
    t.partial({
      /** Transaction request as string ID or TransactionRequest object */
      txRequest: t.union([t.string, Json]),
      /** Request tracer ID for tracking and logging (hex string format) */
      reqId: t.string,
      /** API version for the TSS operation */
      apiVersion: t.string,
      /** Transaction parameters for verifying prebuild matches intent (includes recipients, fees, memo, etc. - varies by coin) */
      txParams: Json,
    })
  ),

  // ============ EDDSA R Share Generation Fields ============
  /** Encrypted user-to-BitGo R share for EDDSA signing protocol */
  encryptedUserToBitgoRShare: optional(
    t.partial({
      /** Source participant identifier */
      from: t.string,
      /** Destination participant identifier */
      to: t.string,
      /** Encrypted share data */
      share: t.string,
      /** Share type identifier */
      type: t.string,
    })
  ),

  // ============ EDDSA G Share Generation Fields ============
  /** BitGo's R share sent to user for EDDSA G share generation */
  bitgoToUserRShare: optional(
    t.partial({
      /** Source participant identifier */
      from: t.string,
      /** Destination participant identifier */
      to: t.string,
      /** Share data */
      share: t.string,
    })
  ),
  /** User's R share sent to BitGo containing cryptographic commitments for EDDSA G share generation */
  userToBitgoRShare: optional(
    t.partial({
      /** Participant index in the signing protocol */
      i: t.number,
      /** Mapping of participant indices to their R share structures (commitment, u, v, r, R values) */
      rShares: t.record(t.string, RShareStructure),
    })
  ),
  /** BitGo's commitment share sent to user for EDDSA G share generation */
  bitgoToUserCommitment: optional(
    t.partial({
      /** Source participant identifier */
      from: t.string,
      /** Destination participant identifier */
      to: t.string,
      /** Commitment share data */
      share: t.string,
      /** Share type identifier */
      type: t.string,
    })
  ),
  /** BitGo's GPG public key for encrypted communication during EDDSA commitment generation */
  bitgoGpgPubKey: optional(t.string),

  // ============ ECDSA K Share Generation Fields ============
  /** Cryptographic challenges from enterprise and BitGo for ECDSA K share zero-knowledge proofs */
  challenges: optional(
    t.type({
      /** Enterprise's serialized ECDSA challenges (ntilde, h1, h2) */
      enterpriseChallenge: SerializedEcdsaChallenges,
      /** BitGo's challenge response with additional n field for verification */
      bitgoChallenge: TxRequestChallengeResponse,
    })
  ),
  /** Type of signing request - 'tx' for transaction or 'message' for arbitrary message */
  requestType: optional(t.string),

  // ============ ECDSA MuDelta Share Generation Fields ============
  /** A share from BitGo containing range proof and commitment data for ECDSA MuDelta generation */
  aShareFromBitgo: optional(AShare),
  /** BitGo's challenge response for MuDelta share verification with ntilde, h1, h2, and n fields */
  bitgoChallenge: optional(TxRequestChallengeResponse),
  /** Encrypted W share from previous round for ECDSA MuDelta computation */
  encryptedWShare: optional(t.string),

  // ============ ECDSA S Share Generation Fields ============
  /** D share from BitGo containing final signature components for ECDSA S share generation */
  dShareFromBitgo: optional(DShare),
  /** Encrypted O share from MuDelta round for final ECDSA signature generation */
  encryptedOShare: optional(t.string),

  // ============ ECDSA MPCv2 Round2 Fields ============
  /** BitGo's GPG public key for secure communication in MPCv2 Round2 */
  bitgoPublicGpgKey: optional(t.string),
  /** User's encrypted GPG private key from Round1 for decryption in Round2 and Round3 */
  encryptedUserGpgPrvKey: optional(t.string),
  /** Encrypted session state from MPCv2 Round1 for continuing to Round2 */
  encryptedRound1Session: optional(t.string),

  // ============ ECDSA MPCv2 Round3 Fields ============
  /** Encrypted session state from MPCv2 Round2 for final signature generation in Round3 */
  encryptedRound2Session: optional(t.string),

  // ============ Message Signing Fields ============
  /** Raw message string to be signed (used for arbitrary message signing) */
  messageRaw: optional(t.string),
  /** Hex-encoded message string ready for signing */
  messageEncoded: optional(t.string),
  /** Binary buffer to sign transmitted as {type: 'Buffer', data: number[]} for message signing operations */
  bufferToSign: optional(
    t.type({
      /** Literal type identifier for Buffer serialization */
      type: t.literal('Buffer'),
      /** Array of byte values representing the buffer contents */
      data: t.array(t.number),
    })
  ),

  // ============ Auto-populated fields (added by handler) ============
  // These fields are automatically added by the handler and should NOT be sent by the client:
  // - prv: string (decrypted private key from filesystem)
  // - walletPassphrase: string (from environment variable)
} as const;

/** Signature share record with participant routing and optional proofs */
const SignatureShareRecord = t.type({
  /** Source participant identifier */
  from: t.string,
  /** Destination participant identifier */
  to: t.string,
  /** Encrypted share data */
  share: t.string,
  /** VSS (Verifiable Secret Sharing) proof */
  vssProof: optional(t.string),
  /** Private share proof for verification */
  privateShareProof: optional(t.string),
  /** Public share component */
  publicShare: optional(t.string),
});

/** Commitment share record for EDDSA signing protocol */
const CommitmentShareRecord = t.type({
  /** Source participant identifier */
  from: t.string,
  /** Destination participant identifier */
  to: t.string,
  /** Commitment or decommitment share data */
  share: t.string,
  /** Share type - 'commitment' or 'decommitment' */
  type: t.string,
});

/** Encrypted signer share record with participant routing */
const EncryptedSignerShareRecord = t.type({
  /** Source participant identifier */
  from: t.string,
  /** Destination participant identifier */
  to: t.string,
  /** Encrypted share data */
  share: t.string,
  /** Share type identifier */
  type: t.string,
});

/** EDDSA signing share containing R share commitments indexed by participant */
const SignShare = t.type({
  /** Participant index in signing protocol */
  i: t.number,
  /** Mapping of participant IDs to R share structures with cryptographic commitments */
  rShares: t.record(t.string, RShareStructure),
});

/** EDDSA G share containing signature components (participant index, public values, and R point) */
const GShare = t.type({
  /** Participant index */
  i: t.number,
  /** Public key y coordinate */
  y: t.string,
  /** Gamma value for signature */
  gamma: t.string,
  /** R point for signature */
  R: t.string,
});

/** ECDSA K share with Paillier encryption parameters and challenge responses */
const KShare = t.type({
  /** Paillier modulus */
  n: t.string,
  /** Encrypted k value */
  k: t.string,
  /** Alpha challenge response */
  alpha: t.string,
  /** Mu challenge response */
  mu: t.string,
  /** Encrypted w value */
  w: t.string,
});

/** ECDSA W share containing intermediate signing values and challenge responses */
const WShare = t.type({
  /** Participant index */
  i: t.number,
  /** Lambda value */
  l: t.string,
  /** Mu value */
  m: t.string,
  /** Paillier modulus */
  n: t.string,
  /** Public key y coordinate */
  y: t.string,
  /** Encrypted k value */
  k: t.string,
  /** Encrypted w value */
  w: t.string,
  /** Gamma value */
  gamma: t.string,
});

/** ECDSA MuDelta share with u and v components for multiplicative-to-additive share conversion */
const MuDShare = t.type({
  /** Participant index */
  i: t.number,
  /** U component */
  u: t.string,
  /** V component */
  v: t.string,
});

/** ECDSA O share (Omicron) containing signature intermediate values */
const OShare = t.type({
  /** Participant index */
  i: t.number,
  /** Gamma value (lowercase) */
  gamma: t.string,
  /** Delta value */
  delta: t.string,
  /** Gamma point (uppercase) */
  Gamma: t.string,
  /** Encrypted k value */
  k: t.string,
  /** Encrypted w value */
  w: t.string,
  /** Omicron value */
  omicron: t.string,
});

/** ECDSA S share containing final signature components (R point, s value, public key) */
const SShare = t.type({
  /** Participant index */
  i: t.number,
  /** R point of signature */
  R: t.string,
  /** S component of signature */
  s: t.string,
  /** Public key y coordinate */
  y: t.string,
});

/** EDDSA Commitment share generation response with user commitment and encrypted shares */
export const EddsaCommitmentShareResponse = t.type({
  /** User's commitment share sent to BitGo */
  userToBitgoCommitment: CommitmentShareRecord,
  /** Encrypted user's signer share for storage */
  encryptedSignerShare: EncryptedSignerShareRecord,
  /** Encrypted R share for next round */
  encryptedUserToBitgoRShare: EncryptedSignerShareRecord,
});

/** EDDSA R share generation response containing R shares for signature */
export const EddsaRShareResponse = t.type({
  /** R share containing participant index and share commitments */
  rShare: SignShare,
});

/** EDDSA G share generation response with final signature share components */
export const EddsaGShareResponse = GShare;

/** ECDSA Paillier modulus response for encryption setup */
export const EcdsaPaillierModulusResponse = t.type({
  /** User's Paillier modulus for homomorphic encryption */
  userPaillierModulus: t.string,
});

/** ECDSA K share generation response (Step 1) with encryption keys and challenge responses */
export const EcdsaKShareResponse = t.type({
  /** PGP-formatted private share proof for verification */
  privateShareProof: t.string,
  /** Verifiable Secret Sharing proof */
  vssProof: optional(t.string),
  /** User's GPG public key for secure communication */
  userPublicGpgKey: t.string,
  /** Public component of the K share */
  publicShare: t.string,
  /** Encrypted offset share for signer */
  encryptedSignerOffsetShare: t.string,
  /** K share with Paillier encryption parameters */
  kShare: KShare,
  /** W share as encrypted string or object with intermediate values */
  wShare: t.union([t.string, WShare]),
});

/** ECDSA MuDelta share generation response (Step 2) with multiplicative-to-additive conversion */
export const EcdsaMuDeltaShareResponse = t.type({
  /** MuDelta share with u and v components */
  muDShare: MuDShare,
  /** O share (Omicron) as encrypted string or object with signature intermediates */
  oShare: t.union([t.string, OShare]),
});

/** ECDSA S share generation response (Step 3) with final signature components */
export const EcdsaSShareResponse = SShare;

/** ECDSA MPCv2 Round 1 response with initial signature share and encrypted session state */
export const EcdsaMPCv2Round1Response = t.type({
  /** First round signature share for MPCv2 protocol */
  signatureShareRound1: SignatureShareRecord,
  /** User's GPG public key for Round 2 communication */
  userGpgPubKey: t.string,
  /** Encrypted session state to continue to Round 2 */
  encryptedRound1Session: t.string,
  /** Encrypted user GPG private key for Round 2 and 3 */
  encryptedUserGpgPrvKey: t.string,
});

/** ECDSA MPCv2 Round 2 response with second signature share and session state */
export const EcdsaMPCv2Round2Response = t.type({
  /** Second round signature share for MPCv2 protocol */
  signatureShareRound2: SignatureShareRecord,
  /** Encrypted session state to continue to Round 3 */
  encryptedRound2Session: t.string,
});

/** ECDSA MPCv2 Round 3 response with final signature share */
export const EcdsaMPCv2Round3Response = t.type({
  /** Signature share for round 3 (final signature) */
  signatureShareRound3: SignatureShareRecord,
});

/** Union of all TSS share responses - EDDSA (Commitment/R/G), ECDSA (PaillierModulus/K/MuDelta/S), or MPCv2 (Round1/2/3) */
export const GenerateShareTSSResponse = {
  /** Successfully generated TSS share (type depends on MPC algorithm and sharetype parameter) */
  200: t.union([
    EddsaCommitmentShareResponse, // EDDSA Commitment
    EddsaRShareResponse, // EDDSA R
    EddsaGShareResponse, // EDDSA G
    EcdsaPaillierModulusResponse, // ECDSA PaillierModulus
    EcdsaKShareResponse, // ECDSA K
    EcdsaMuDeltaShareResponse, // ECDSA MuDelta
    EcdsaSShareResponse, // ECDSA S
    EcdsaMPCv2Round1Response, // ECDSA MPCv2 Round 1
    EcdsaMPCv2Round2Response, // ECDSA MPCv2 Round 2
    EcdsaMPCv2Round3Response, // ECDSA MPCv2 Round 3
  ]),
  /** Invalid request parameters, missing configuration, or share generation validation failure */
  400: BitgoExpressError,
  /** Internal server error during cryptographic operations or filesystem access */
  500: BitgoExpressError,
};

/**
 * Generate TSS share for multi-party signing (external signer mode)
 *
 * This endpoint is used when BitGo Express is configured with external signing
 * (signerFileSystemPath config is set) for TSS (Threshold Signature Scheme) wallets.
 *
 * **Process Flow:**
 * 1. Extracts walletId from either txRequest or tssParams.txRequest
 * 2. Retrieves wallet passphrase from environment variable WALLET_{walletId}_PASSPHRASE
 * 3. Reads encrypted private key from filesystem (signerFileSystemPath)
 * 4. Decrypts the private key using the wallet passphrase
 * 5. Generates the appropriate TSS share based on:
 *    - Coin's MPC algorithm (EDDSA or ECDSA)
 *    - Share type parameter (commitment, R, G, K, MuDelta, S, etc.)
 *
 * **Configuration Requirements:**
 * - `signerFileSystemPath`: Path to JSON file containing encrypted private keys
 * - Environment variable: `WALLET_{walletId}_PASSPHRASE` for each wallet
 *
 * **Supported Share Types:**
 *
 * *EDDSA (EdDSA algorithm - e.g., Solana, Sui):*
 * - `commitment`: Generate commitment share (first step)
 * - `R`: Generate R share (second step)
 * - `G`: Generate G share (final step)
 *
 * *ECDSA (ECDSA algorithm - e.g., Bitcoin, Ethereum):*
 * - `PaillierModulus`: Retrieve Paillier modulus from user's key
 * - `K`: Generate K share (step 1)
 * - `MuDelta`: Generate MuDelta share (step 2)
 * - `S`: Generate S share (step 3, final signature)
 *
 * *ECDSA MPCv2 (Enhanced ECDSA with DKLS):*
 * - `MPCv2Round1`: Generate round 1 signature share
 * - `MPCv2Round2`: Generate round 2 signature share
 * - `MPCv2Round3`: Generate round 3 signature share (final)
 *
 * **Error Cases:**
 * - Missing walletId in request
 * - Missing signerFileSystemPath configuration
 * - Missing wallet passphrase in environment
 * - Invalid or corrupted encrypted private key
 * - Unsupported MPC algorithm or share type
 * - Cryptographic operation failures
 *
 * @tag express
 * @operationId express.v2.tssshare.generate
 */
export const PostGenerateShareTSS = httpRoute({
  path: '/api/v2/{coin}/tssshare/{sharetype}',
  method: 'POST',
  request: httpRequest({
    params: GenerateShareTSSParams,
    body: GenerateShareTSSBody,
  }),
  response: GenerateShareTSSResponse,
});
