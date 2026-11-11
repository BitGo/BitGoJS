import { createHash } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

import { logger } from '@bitgo/logger';
import { BitGoJsError, OFFLINE_SIGNING_SHARE_MAX_AGE_MS } from '@bitgo/sdk-core';

const CONSUMED_SHARES_MAX_AGE_MS = OFFLINE_SIGNING_SHARE_MAX_AGE_MS;

/**
 * True when two path spellings refer to the same file: resolves them and, when the
 * files exist, follows symlinks via realpath — so 'a/./b', 'a/../b' and symlinked
 * aliases of the key file are all caught.
 */
export function isSameFilePath(a: string, b: string): boolean {
  const canonical = (p: string): string => {
    const resolved = path.resolve(p);
    try {
      return fs.realpathSync(resolved);
    } catch {
      // file does not exist yet (e.g. the registry on first use)
      return resolved;
    }
  };
  return canonical(a) === canonical(b);
}

/**
 * Key excludes attacker-controlled fields (e.g. walletId) so a relabeled replay is still
 * rejected. The key covers the canonical decoded bytes that decryption actually consumes:
 * for v1 (CCM) the iv is truncated to the effective nonce length (trailing iv bytes are
 * ignored by decryption, so any iv longer than the nonce fails closed), and for v2 (GCM) the
 * full iv is authenticated. Re-serializing the envelope (key order, whitespace, base64
 * padding) still collides with the original key and is rejected.
 */
export function computeConsumedShareKey(shareType: string, adata: string): string {
  return createHash('sha256').update(`${shareType}:${adata}`).digest('hex');
}

/**
 * One-time consumption registry: marks wShare/oShare ciphertexts as used before the share runs;
 * a second attempt with the same ciphertext throws (fail-closed against replay).
 */
export class ConsumedShareRegistry {
  private readonly consumed = new Map<string, number>();
  private loaded = false;

  constructor(private readonly filePath: string) {}

  private load(): void {
    if (this.loaded) {
      return;
    }
    let raw: string;
    try {
      raw = fs.readFileSync(this.filePath, 'utf8');
    } catch (e) {
      if (typeof e === 'object' && e !== null && 'code' in e && e.code === 'ENOENT') {
        // No registry file yet (first run): nothing to load.
        this.loaded = true;
        return;
      }
      // An unreadable registry must not silently forget consumed shares: fail closed and
      // retry the load on the next call.
      const detail = e instanceof Error ? e.message : String(e);
      throw new BitGoJsError(`failed to read consumed share registry from ${this.filePath}: ${detail}`);
    }
    try {
      const parsed = JSON.parse(raw) as Record<string, number>;
      for (const [key, consumedAt] of Object.entries(parsed)) {
        if (typeof consumedAt === 'number') {
          this.consumed.set(key, consumedAt);
        }
      }
      this.loaded = true;
    } catch {
      // A corrupt registry must not silently forget consumed shares: fail closed and retry
      // the load on the next call.
      throw new BitGoJsError(`failed to parse consumed share registry from ${this.filePath}`);
    }
  }

  markConsumed(key: string): void {
    // Check-then-set is race-free only because the whole path is synchronous; do not add an
    // await between the check and the set.
    this.load();
    if (this.consumed.has(key)) {
      throw new BitGoJsError('encrypted share has already been consumed; restart the signing session');
    }
    this.consumed.set(key, Date.now());
    this.persist();
  }

  /** Drops expired entries so the in-memory map and the persisted file stay bounded. */
  private prune(): void {
    const now = Date.now();
    for (const [key, consumedAt] of this.consumed) {
      if (now - consumedAt >= CONSUMED_SHARES_MAX_AGE_MS) {
        this.consumed.delete(key);
      }
    }
  }

  private persist(): void {
    let tempPath = '';
    // Atomic write: a crash mid-write cannot truncate the live registry (a truncated file
    // would fail closed on load and lock out all signing).
    try {
      this.prune();
      tempPath = `${this.filePath}.${process.pid}.${Math.random().toString(36).slice(2)}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(Object.fromEntries(this.consumed)));
      fs.renameSync(tempPath, this.filePath);
    } catch (e) {
      try {
        fs.unlinkSync(tempPath);
      } catch {
        // nothing to clean up
      }
      // The signer process never assumes file write access (only the separate
      // fetchEncryptedPrivKeys provisioning step writes there). If the registry location
      // is not writable, degrade to in-memory-only protection: the share stays consumed
      // for this process, but persistence (and restart protection) is lost until the
      // operator relocates the registry via --signerRegistryFilePath.
      const detail = e instanceof Error ? e.message : String(e);
      logger.warn(
        `failed to persist consumed share registry (${detail}); ` +
          `replay protection is in-memory only until ${this.filePath} is writable ` +
          '(relocate via --signerRegistryFilePath if needed)'
      );
    }
  }
}

const registries = new Map<string, ConsumedShareRegistry>();

export function getConsumedShareRegistry(registryFilePath: string): ConsumedShareRegistry {
  let registry = registries.get(registryFilePath);
  if (!registry) {
    registry = new ConsumedShareRegistry(registryFilePath);
    registries.set(registryFilePath, registry);
  }
  return registry;
}

export function resetConsumedShareRegistriesForTesting(): void {
  registries.clear();
}
