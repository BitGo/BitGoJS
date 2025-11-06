import {
    KeygenSession,
    Keyshare,
    generateEncryptionKeypair,
} from "@silencelaboratories/eddsa-wasm-ll-node";
import { decode, encode } from "cbor-x";
  

type DkgMaterial = {
    secrets: Uint8Array[];
    publicKeys: Uint8Array;
};

type DkgResult = DkgMaterial & { shares: Keyshare[] };

function generateEncryptionMaterial(participants: number): DkgMaterial {
    const secrets: Uint8Array[] = [];
    const publicKeys: Uint8Array[] = [];

    for (let i = 0; i < participants; i++) {
        const pair = generateEncryptionKeypair();
        secrets.push(pair.secretKey);    // random 32 bytes
        publicKeys.push(pair.publicKey); // ed25519 public key
        pair.free();
    }

    return { secrets, publicKeys: concatBytes(publicKeys) };
}

function createKeygenSession(
    participants: number,
    threshold: number,
    partyId: number,
    secretKey: Uint8Array,
    aggregatedPublicKeys: Uint8Array,
    ): KeygenSession {
    const flattened = aggregatedPublicKeys.slice();
    return new KeygenSession(participants, threshold, partyId, secretKey, flattened);
}

function concatBytes(chunks: Uint8Array[]): Uint8Array {
    const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const result = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
    }
    return result;
}

export function getKeyShares(): {readable: iShareReadable[], shares: Keyshare[]}{
    const participants = 3;
    const threshold = 2;
    
    // Generate the per-party key material used by the protocol.
    const { secrets, publicKeys } = generateEncryptionMaterial(participants);
    
    // Spin up a session per participant.
    const sessions = secrets.map((secret, party_id) =>
      createKeygenSession(participants, threshold, party_id, secret, publicKeys),
    );
    
    // Generate first message.
    const msg1 = sessions.map((session) => session.createFirstMessage());
    
    // Round 1
    const msg2 = sessions.flatMap((session) =>
      session.handleMessages(msg1.map((m) => m.clone())),
    );
    
    // Round 2
    sessions.forEach((session, partyId) => {
      session.handleMessages(msg2.map((m) => m.clone()));
    });
    
    // and capture the resulting key shares.
    const shares = sessions.map((session) => session.keyshare());
    return {readable: fetchMaterial(shares), shares};
}


export interface iShareReadable {
    threshold: number,
    total_parties: number,
    party_id: number,
    d_i: string,
    public_key: string,
    key_id: string,
    root_chain_code: string,
    final_session_id: string;
  };
  
  
export function fetchMaterial(shares: Keyshare[]): iShareReadable[]  {
      return shares.map((share) => {
          const material = decode(Buffer.from(share.toBytes())) as unknown as iShareReadable;
          return {
              threshold: material.threshold,
              total_parties: material.total_parties,
              party_id: material.party_id,
              d_i: Buffer.from(material.d_i).toString('hex'),
              public_key: Buffer.from(material.public_key).toString('hex'),
              key_id: Buffer.from(material.key_id).toString('hex'),
              root_chain_code: Buffer.from(material.root_chain_code).toString('hex'),
              final_session_id: Buffer.from(material.final_session_id).toString('hex'),
          }
      });
  }

// console.log(getKeyShares());