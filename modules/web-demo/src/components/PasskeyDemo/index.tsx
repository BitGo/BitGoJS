import React, { useState, useCallback, useRef, useEffect } from 'react';
import { BitGoAPI, BitGoAPIOptions } from '@bitgo/sdk-api';
import type { EnvironmentName } from '@bitgo/sdk-core';
import {
  WebCryptoHmacStrategy,
  IndexedDbTokenStore,
  // eslint-disable-next-line import/no-internal-modules
} from '@bitgo/sdk-hmac/browser';
import coinFactory from '@components/Coins/coinFactory';
import {
  registerPasskey,
  attachPasskeyToWallet,
  derivePasskeyPrfKey,
  removePasskeyFromWallet,
  removePasskeyFromAccount,
  type WebAuthnOtpDevice,
} from '@bitgo/passkey-crypto';
import {
  PageContainer,
  TwoColumnLayout,
  LeftColumn,
  RightColumn,
  Section,
  SectionTitle,
  FormGroup,
  Label,
  Input,
  Button,
  StatusBadge,
  LogArea,
  ErrorText,
  SuccessText,
} from './styles';
import styled from 'styled-components';

// ---------------------------------------------------------------------------
// Extra styled components for the info panels
// ---------------------------------------------------------------------------

const PanelScroller = styled.div`
  max-height: 260px;
  overflow-y: auto;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: #f8fafc;
`;

const PanelCard = styled.div`
  padding: 10px 12px;
  border-bottom: 1px solid #e2e8f0;
  font-size: 13px;
  line-height: 1.6;

  &:last-child {
    border-bottom: none;
  }
`;

const PanelCardTitle = styled.div`
  font-weight: 600;
  color: #1a202c;
  margin-bottom: 2px;
`;

const PanelMeta = styled.div`
  color: #4a5568;
  word-break: break-all;
`;

const PanelTag = styled.span<{ colour?: string }>`
  display: inline-block;
  padding: 1px 6px;
  border-radius: 3px;
  font-size: 11px;
  font-weight: 600;
  background: ${({ colour }) => colour || '#e2e8f0'};
  color: ${({ colour }) =>
    colour === '#c6f6d5'
      ? '#276749'
      : colour === '#fed7d7'
      ? '#9b2c2c'
      : '#4a5568'};
  margin-right: 4px;
`;

const QuickActions = styled.div`
  margin-top: 6px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
`;

const SmallButton = styled.button`
  padding: 2px 8px;
  font-size: 11px;
  border: 1px solid #4a90e2;
  border-radius: 3px;
  background: white;
  color: #4a90e2;
  cursor: pointer;
  &:hover {
    background: #ebf4ff;
  }
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const RefreshRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
`;

const EmptyState = styled.div`
  padding: 16px;
  text-align: center;
  color: #a0aec0;
  font-size: 13px;
`;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type LogLevel = 'info' | 'success' | 'error';
type LogEntry = { time: string; message: string; level: LogLevel };

interface OtpDeviceInfo {
  id: string;
  credentialId?: string;
  label?: string;
  prfSalt?: string;
  extensions?: Record<string, boolean>;
  isPasskey?: boolean;
}

interface WalletInfo {
  id: string;
  label: string;
  type: string;
  coin: string;
  webauthnDevices?: { otpDeviceId: string; prfSalt?: string }[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ts(): string {
  return new Date().toLocaleTimeString('en-US', { hour12: false });
}

/**
 * Converts any binary value (polyfilled Buffer, TypedArray, base64url string)
 * to a native ArrayBuffer so the browser WebAuthn API accepts it.
 */
function toArrayBuffer(val: any): ArrayBuffer {
  if (val instanceof ArrayBuffer) return val;
  if (ArrayBuffer.isView(val)) {
    return val.buffer.slice(
      val.byteOffset,
      val.byteOffset + val.byteLength,
    ) as ArrayBuffer;
  }
  if (typeof val === 'string') {
    const b64 = val.replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes.buffer;
  }
  return val;
}

/**
 * Normalises a PublicKeyCredentialCreationOptions object so all binary fields
 * are native ArrayBuffers (not polyfilled Buffers) and rp.id matches the
 * current hostname (required when running on localhost against staging).
 */
function normaliseCreateOptions(opts: any): any {
  const o = { ...opts };
  o.challenge = toArrayBuffer(o.challenge);
  o.user = { ...o.user, id: toArrayBuffer(o.user.id) };
  // Override rp.id to current hostname — server returns the production domain
  // which won't match localhost, causing the browser to silently reject the call.
  o.rp = { ...o.rp, id: window.location.hostname };
  // Drop server-issued excludeCredentials — they reference credentials registered
  // under the server's rpId, not localhost. Keeping them can cause Chrome to
  // silently block the prompt if a matching credential exists on the authenticator.
  o.excludeCredentials = [];
  // During registration (create), PRF extension should be { prf: {} } to check
  // support. The server may send prf.eval (with a salt) which is only valid during
  // assertion (get). Chrome rejects eval during create; Safari ignores it.
  if (o.extensions?.prf) {
    o.extensions = { ...o.extensions, prf: {} };
  }
  return o;
}

/**
 * Normalises a PublicKeyCredentialRequestOptions object so all binary fields
 * are native ArrayBuffers and evalByCredential salts are decoded correctly.
 */
function normaliseGetOptions(
  publicKey: any,
  evalByCredential?: Record<string, any>,
): any {
  const o = { ...publicKey };
  o.challenge = toArrayBuffer(o.challenge);
  if (o.allowCredentials) {
    o.allowCredentials = o.allowCredentials.map((c: any) => ({
      ...c,
      id: toArrayBuffer(c.id),
    }));
  }
  if (evalByCredential) {
    const normalisedEval: Record<string, { first: ArrayBuffer }> = {};
    for (const [credId, salt] of Object.entries(evalByCredential)) {
      normalisedEval[credId] = { first: toArrayBuffer(salt) };
    }
    o.extensions = { prf: { evalByCredential: normalisedEval } };
  }
  return o;
}

// browserProvider is created inside the component so it has access to `log`.

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const PasskeyDemo = () => {
  // Login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');

  // Config — env/enterpriseId/coin persisted to localStorage
  const [env, setEnv] = useState<EnvironmentName>(
    () =>
      (localStorage.getItem('passkey-demo:env') as EnvironmentName) || 'test',
  );
  const [enterpriseId, setEnterpriseId] = useState(
    () => localStorage.getItem('passkey-demo:enterpriseId') || '',
  );
  const [coin, setCoin] = useState(
    () => localStorage.getItem('passkey-demo:coin') || 'tbtc',
  );

  // Persist config changes
  useEffect(() => {
    localStorage.setItem('passkey-demo:env', env);
  }, [env]);
  useEffect(() => {
    localStorage.setItem('passkey-demo:enterpriseId', enterpriseId);
  }, [enterpriseId]);
  useEffect(() => {
    localStorage.setItem('passkey-demo:coin', coin);
  }, [coin]);

  // SDK state
  const [sdkReady, setSdkReady] = useState(false);

  // Data
  const [walletId, setWalletId] = useState('');

  // Operation inputs
  const [passkeyLabel, setPasskeyLabel] = useState('');
  const [walletLabel, setWalletLabel] = useState('');
  const [walletPassphrase, setWalletPassphrase] = useState('');
  const [attachDeviceId, setAttachDeviceId] = useState('');
  const [attachPassphrase, setAttachPassphrase] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [lastPrfPassword, setLastPrfPassword] = useState('');
  const [removeDeviceId, setRemoveDeviceId] = useState('');
  const [removeWalletPassphrase, setRemoveWalletPassphrase] = useState('');

  // UI
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Info panels
  const [registeredPasskeys, setRegisteredPasskeys] = useState<OtpDeviceInfo[]>(
    [],
  );
  const [wallets, setWallets] = useState<WalletInfo[]>([]);
  const [loadingPasskeys, setLoadingPasskeys] = useState(false);
  const [loadingWallets, setLoadingWallets] = useState(false);

  const strategyRef = useRef<WebCryptoHmacStrategy | null>(null);
  const sdkRef = useRef<BitGoAPI | null>(null);
  const logAreaRef = useRef<HTMLPreElement | null>(null);

  const log = useCallback((message: string, level: LogLevel = 'info') => {
    setLogs((prev) => [...prev, { time: ts(), message, level }]);
  }, []);

  // Browser WebAuthn provider — defined inside component to have access to `log`.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const browserProvider = React.useMemo(
    () => ({
      create: async (options: any) => {
        log('provider.create: normalising options…');
        const normalised = normaliseCreateOptions(options);

        log('provider.create: calling navigator.credentials.create…');
        let cred: any;
        try {
          cred = await navigator.credentials.create({ publicKey: normalised });
        } catch (domErr: any) {
          log(
            `provider.create ERROR: ${domErr?.name}: ${domErr?.message}`,
            'error',
          );
          throw domErr;
        }
        if (!cred) {
          log(
            'provider.create: navigator returned null (user cancelled or no authenticator)',
            'error',
          );
          throw new Error('navigator.credentials.create returned null');
        }
        log(`provider.create: credential created, id=${cred.id}`);
        return cred as any;
      },
      get: async ({
        publicKey,
        evalByCredential,
      }: {
        publicKey: any;
        evalByCredential?: Record<string, any>;
      }) => {
        log('provider.get: normalising options…');
        const normalisedGet = normaliseGetOptions(publicKey, evalByCredential);
        // Challenge is required by the browser; attachPasskeyToWallet doesn't provide one,
        // so we generate a random one when absent. The assertion result isn't sent to the
        // server in that flow, so replay protection is not required here.
        if (!normalisedGet.challenge) {
          normalisedGet.challenge = crypto.getRandomValues(
            new Uint8Array(32),
          ).buffer;
          log('provider.get: generated random challenge (none provided)');
        }
        // rpId must match current hostname when testing on localhost
        normalisedGet.rpId = window.location.hostname;
        log(
          `provider.get: rpId=${normalisedGet.rpId}, allowCredentials=${
            normalisedGet.allowCredentials?.length ?? 0
          }`,
        );
        log('provider.get: calling navigator.credentials.get…');
        let cred: any;
        try {
          cred = await navigator.credentials.get({
            publicKey: normalisedGet,
          });
        } catch (domErr: any) {
          log(
            `provider.get ERROR: ${domErr?.name}: ${domErr?.message}`,
            'error',
          );
          throw domErr;
        }
        if (!cred) {
          log('provider.get: navigator returned null', 'error');
          throw new Error('navigator.credentials.get returned null');
        }
        const ext = (cred as any).getClientExtensionResults() as {
          prf?: { results?: { first?: ArrayBuffer } };
        };
        // Encode assertion signature as base64url for otpCode — the manual test
        // does the same; some server flows may need it for verification.
        let otpCode = '';
        const sigBuf = cred.response?.signature;
        if (sigBuf) {
          const bytes = new Uint8Array(
            sigBuf instanceof ArrayBuffer ? sigBuf : sigBuf.buffer ?? sigBuf,
          );
          otpCode = btoa(String.fromCharCode(...bytes))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
        }
        return {
          prfResult: ext.prf?.results?.first,
          credentialId: cred.id,
          otpCode,
        };
      },
    }),
    [log],
  );

  useEffect(() => {
    if (logAreaRef.current) {
      logAreaRef.current.scrollTop = logAreaRef.current.scrollHeight;
    }
  }, [logs]);

  const clearStatus = () => {
    setError(null);
    setSuccess(null);
  };

  // --- Device lookup helper ---
  function findDeviceById(id: string): WebAuthnOtpDevice | null {
    const d = registeredPasskeys.find((p) => p.id === id);
    if (!d) return null;
    return {
      id: d.id,
      credentialId: d.credentialId ?? '',
      prfSalt: d.prfSalt,
      isPasskey: d.isPasskey,
      extensions: d.extensions,
    };
  }

  // --- Fetch registered passkeys via V2 endpoint ---
  const fetchPasskeys = useCallback(async () => {
    const sdk = sdkRef.current;
    if (!sdk) return;
    setLoadingPasskeys(true);
    try {
      const me = (await sdk.get(sdk.url('/user/me', 2)).result()) as any;
      const allDevices = me?.otpDevices ?? me?.user?.otpDevices ?? [];
      // Show WebAuthn devices (passkeys and those with PRF support)
      const devices: OtpDeviceInfo[] = allDevices.filter(
        (d: any) => d.type === 'webauthn' || d.isPasskey || d.extensions?.prf,
      );
      setRegisteredPasskeys(devices);
    } catch (e: any) {
      log(`Failed to fetch passkeys: ${e.message || e}`, 'error');
    } finally {
      setLoadingPasskeys(false);
    }
  }, [log]);

  // --- Fetch wallets for current coin ---
  const fetchWallets = useCallback(async () => {
    const sdk = sdkRef.current;
    if (!sdk) return;
    setLoadingWallets(true);
    try {
      await coinFactory.getCoin(coin, sdk);
      const resp = (await (sdk.coin(coin).wallets() as any).list({
        limit: 25,
      })) as any;
      const rawList = (resp?.wallets ?? []).map((w: any) => {
        const data = w._wallet ?? w;
        return {
          id: typeof w.id === 'function' ? w.id() : data.id,
          label: data.label ?? '',
          type: data.type ?? w.type?.() ?? 'hot',
          coin: data.coin ?? w.coin?.() ?? coin,
          keys: data.keys ?? [],
          webauthnDevices: [] as { otpDeviceId: string; prfSalt?: string }[],
        };
      });
      // webauthnDevices lives on the user keychain, not the wallet object.
      // Fetch keychains in parallel to get passkey attachment info.
      const list: WalletInfo[] = await Promise.all(
        rawList.map(async (w: any) => {
          const keychainId = w.keys?.[0];
          if (keychainId) {
            try {
              const keychain = (await sdk
                .get(sdk.url(`/${coin}/key/${keychainId}`, 2))
                .result()) as any;
              w.webauthnDevices =
                keychain?.webauthnDevices ?? keychain?.webAuthnDevices ?? [];
            } catch {
              // keychain fetch failed — leave empty
            }
          }
          return w as WalletInfo;
        }),
      );
      setWallets(list);
    } catch (e: any) {
      log(`Failed to fetch wallets: ${e.message || e}`, 'error');
    } finally {
      setLoadingWallets(false);
    }
  }, [coin, log]);

  // Auto-refresh panels whenever SDK becomes ready
  useEffect(() => {
    if (sdkReady) {
      fetchPasskeys();
      fetchWallets();
    }
  }, [sdkReady, fetchPasskeys, fetchWallets]);

  // --- Login ---
  const handleLogin = useCallback(async () => {
    clearStatus();
    setBusy(true);
    try {
      log(`Creating WebCryptoHmacStrategy with IndexedDbTokenStore...`);
      const strategy = new WebCryptoHmacStrategy({
        tokenStore: new IndexedDbTokenStore(),
        authVersion: 2,
      });

      const options: BitGoAPIOptions = {
        env,
        hmacAuthStrategy: strategy,
        hmacVerification: true,
        authVersion: 2,
      };

      log(`Creating BitGoAPI (env=${env})...`);
      const sdk = new BitGoAPI(options);

      log(`Authenticating as ${email}...`);
      const response = await sdk.authenticate({
        username: email,
        password,
        otp,
      });

      const token = response?.access_token;
      if (token) {
        log('Importing access_token into WebCrypto strategy...');
        await strategy.setToken(token);
        log('Auth token set. HMAC signing ready.');
      }

      log('Unlocking session...');
      await sdk.unlock({ otp });
      log('Session unlocked.', 'success');

      // Register the selected coin so sdk.coin(coin) works
      await coinFactory.getCoin(coin, sdk);

      strategyRef.current = strategy;
      sdkRef.current = sdk;
      setSdkReady(true);
      log(`Logged in. Coin "${coin}" registered.`, 'success');
      setSuccess('Logged in and SDK ready.');
    } catch (e: any) {
      setError(e.message || String(e));
      log(`Login error: ${e.message || e}`, 'error');
    } finally {
      setBusy(false);
    }
  }, [env, email, password, otp, coin, log]);

  // --- registerPasskey ---
  const handleRegisterPasskey = useCallback(async () => {
    clearStatus();
    setBusy(true);
    const sdk = sdkRef.current;
    if (!sdk) return;

    try {
      log('Registering passkey...');
      const device = await registerPasskey({
        bitgo: sdk as any,
        provider: browserProvider as any,
        label: passkeyLabel || 'Demo Passkey',
      });
      log(`Passkey registered. Device ID: ${device.id}`, 'success');
      log(`Credential ID: ${device.credentialId}`);
      log(`PRF supported: ${device.prfSupported}`);
      if (device.prfSalt) log(`PRF salt: ${device.prfSalt}`);
      setSuccess('Passkey registered successfully.');
      await fetchPasskeys();
    } catch (e: any) {
      setError(e.message || String(e));
      log(`Error: ${e.message || e}`, 'error');
    } finally {
      setBusy(false);
    }
  }, [passkeyLabel, log, fetchPasskeys, browserProvider]);

  // --- Create Wallet ---
  const handleCreateWallet = useCallback(async () => {
    clearStatus();
    setBusy(true);
    const sdk = sdkRef.current;
    if (!sdk) return;

    try {
      log(
        `Creating ${coin} wallet "${walletLabel || 'Passkey Demo Wallet'}"...`,
      );
      const result = await sdk
        .coin(coin)
        .wallets()
        .generateWallet({
          label: walletLabel || 'Passkey Demo Wallet',
          passphrase: walletPassphrase,
          enterprise: enterpriseId,
          multisigType: 'tss',
          walletVersion: 5,
        });
      const wId = result.wallet.id();
      setWalletId(wId);
      log(`Wallet created. ID: ${wId}`, 'success');
      setSuccess(`Wallet created: ${wId}`);
      await fetchWallets();
    } catch (e: any) {
      setError(e.message || String(e));
      log(`Error: ${e.message || e}`, 'error');
    } finally {
      setBusy(false);
    }
  }, [coin, walletLabel, walletPassphrase, enterpriseId, log, fetchWallets]);

  // --- attachPasskeyToWallet ---
  const handleAttachPasskey = useCallback(async () => {
    clearStatus();
    setBusy(true);
    const sdk = sdkRef.current;
    if (!sdk) return;

    const device = findDeviceById(attachDeviceId);
    if (!device) {
      setError(
        'No device found for the selected Device ID. Select a passkey from the panel.',
      );
      setBusy(false);
      return;
    }

    try {
      log(`Attaching passkey ${attachDeviceId} to wallet ${walletId}...`);
      const keychain = await attachPasskeyToWallet({
        bitgo: sdk as any,
        coin,
        walletId,
        device,
        existingPassphrase: attachPassphrase,
        provider: browserProvider as any,
      });
      log('Passkey attached to wallet successfully.', 'success');
      log(`Keychain ID: ${(keychain as any).id || 'N/A'}`);
      setSuccess('Passkey attached to wallet.');
      await fetchWallets();
    } catch (e: any) {
      setError(e.message || String(e));
      log(`Error: ${e.message || e}`, 'error');
    } finally {
      setBusy(false);
    }
  }, [
    coin,
    walletId,
    attachDeviceId,
    attachPassphrase,
    registeredPasskeys,
    log,
    fetchWallets,
    browserProvider,
  ]);

  // --- derivePasskeyPrfKey ---
  const handleDerivePrfKey = useCallback(async () => {
    clearStatus();
    setBusy(true);
    const sdk = sdkRef.current;
    if (!sdk) return;

    try {
      log(`Deriving PRF key for wallet ${walletId}...`);
      const wallet = await sdk.coin(coin).wallets().get({ id: walletId });
      const prfPassword = await derivePasskeyPrfKey({
        bitgo: sdk as any,
        wallet,
        provider: browserProvider as any,
      });
      setLastPrfPassword(prfPassword);
      log(`PRF-derived password: ${prfPassword.slice(0, 16)}...`, 'success');
      setSuccess(
        'PRF key derived. You can now sign transactions without a passphrase.',
      );
    } catch (e: any) {
      setError(e.message || String(e));
      log(`Error: ${e.message || e}`, 'error');
    } finally {
      setBusy(false);
    }
  }, [coin, walletId, log, browserProvider]);

  // --- Send Funds ---
  const handleSendFunds = useCallback(async () => {
    clearStatus();
    setBusy(true);
    const sdk = sdkRef.current;
    if (!sdk) return;

    try {
      log(`Sending ${sendAmount} satoshis to ${recipientAddress}...`);
      const wallet = await sdk.coin(coin).wallets().get({ id: walletId });
      const result = await wallet.send({
        address: recipientAddress,
        amount: sendAmount,
        walletPassphrase: lastPrfPassword,
      });
      const txId =
        (result as any).txid || (result as any).transfer?.txid || 'N/A';
      log(`Transaction sent. TxID: ${txId}`, 'success');
      log(`Result: ${JSON.stringify(result, null, 2).slice(0, 500)}`);
      setSuccess(`Funds sent. TxID: ${txId}`);
    } catch (e: any) {
      setError(e.message || String(e));
      log(`Error: ${e.message || e}`, 'error');
    } finally {
      setBusy(false);
    }
  }, [coin, walletId, recipientAddress, sendAmount, lastPrfPassword, log]);

  // --- removePasskeyFromWallet ---
  const handleRemoveFromWallet = useCallback(async () => {
    clearStatus();
    setBusy(true);
    const sdk = sdkRef.current;
    if (!sdk) return;

    const device = findDeviceById(removeDeviceId);
    if (!device) {
      setError(
        'No device found for the selected Device ID. Select a passkey from the panel.',
      );
      setBusy(false);
      return;
    }

    try {
      log(`Removing passkey ${removeDeviceId} from wallet ${walletId}...`);
      await removePasskeyFromWallet({
        bitgo: sdk as any,
        coin,
        walletId,
        device,
        walletPassphrase: removeWalletPassphrase,
      });
      log('Passkey removed from wallet.', 'success');
      setSuccess('Passkey removed from wallet.');
      await fetchWallets();
    } catch (e: any) {
      setError(e.message || String(e));
      log(`Error: ${e.message || e}`, 'error');
    } finally {
      setBusy(false);
    }
  }, [
    coin,
    walletId,
    removeDeviceId,
    removeWalletPassphrase,
    registeredPasskeys,
    log,
    fetchWallets,
  ]);

  // --- removePasskeyFromAccount ---
  const handleRemoveFromAccount = useCallback(async () => {
    clearStatus();
    setBusy(true);
    const sdk = sdkRef.current;
    if (!sdk) return;

    const device = findDeviceById(removeDeviceId);
    if (!device) {
      setError(
        'No device found for the selected Device ID. Select a passkey from the panel.',
      );
      setBusy(false);
      return;
    }

    try {
      log(`Removing passkey ${removeDeviceId} from account...`);
      await removePasskeyFromAccount({
        bitgo: sdk as any,
        device,
      });
      log('Passkey removed from account.', 'success');
      setSuccess('Passkey removed from account.');
      await fetchPasskeys();
    } catch (e: any) {
      setError(e.message || String(e));
      log(`Error: ${e.message || e}`, 'error');
    } finally {
      setBusy(false);
    }
  }, [removeDeviceId, registeredPasskeys, log, fetchPasskeys]);

  const selectStyle = {
    padding: '8px',
    borderRadius: 4,
    border: '1px solid #ccc',
    width: '100%',
  } as const;

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  const renderPasskeyPanel = () => (
    <Section>
      <RefreshRow>
        <SectionTitle style={{ margin: 0 }}>Registered Passkeys</SectionTitle>
        <SmallButton
          onClick={fetchPasskeys}
          disabled={!sdkReady || loadingPasskeys}
        >
          {loadingPasskeys ? 'Loading…' : '↻ Refresh'}
        </SmallButton>
      </RefreshRow>
      <p style={{ fontSize: 12, color: '#718096', margin: '0 0 8px 0' }}>
        WebAuthn devices currently registered on your account.
      </p>
      <PanelScroller>
        {registeredPasskeys.length === 0 ? (
          <EmptyState>
            {sdkReady ? 'No passkeys found.' : 'Initialize SDK to load.'}
          </EmptyState>
        ) : (
          registeredPasskeys.map((d) => (
            <PanelCard key={d.id}>
              <PanelCardTitle>{d.label || '(unlabelled)'}</PanelCardTitle>
              <PanelMeta>ID: {d.id}</PanelMeta>
              {d.credentialId && (
                <PanelMeta>Credential ID: {d.credentialId}</PanelMeta>
              )}
              {d.prfSalt && <PanelMeta>PRF Salt: {d.prfSalt}</PanelMeta>}
              <div style={{ marginTop: 4 }}>
                <PanelTag colour={d.extensions?.prf ? '#c6f6d5' : '#fed7d7'}>
                  PRF: {d.extensions?.prf ? 'supported' : 'not supported'}
                </PanelTag>
              </div>
              <QuickActions>
                <SmallButton
                  disabled={busy}
                  title="Set this passkey's Device ID in the attachPasskeyToWallet section"
                  onClick={() => {
                    setAttachDeviceId(d.id);
                    log(`Selected passkey for attach: ${d.id}`);
                  }}
                >
                  Select for Attach
                </SmallButton>
                <SmallButton
                  disabled={busy}
                  title="Set this passkey's Device ID in the remove sections"
                  onClick={() => {
                    setRemoveDeviceId(d.id);
                    log(`Selected passkey for remove: ${d.id}`);
                  }}
                >
                  Select for Remove
                </SmallButton>
              </QuickActions>
            </PanelCard>
          ))
        )}
      </PanelScroller>
    </Section>
  );

  const renderWalletPanel = () => (
    <Section style={{ marginBottom: 0 }}>
      <RefreshRow>
        <SectionTitle style={{ margin: 0 }}>
          Wallets &amp; Passkey Attachments{' '}
          <span style={{ fontSize: 11, color: '#718096', fontWeight: 400 }}>
            ({coin})
          </span>
        </SectionTitle>
        <SmallButton
          onClick={fetchWallets}
          disabled={!sdkReady || loadingWallets}
        >
          {loadingWallets ? 'Loading…' : '↻ Refresh'}
        </SmallButton>
      </RefreshRow>
      <p style={{ fontSize: 12, color: '#718096', margin: '0 0 8px 0' }}>
        Wallets on your account for the current coin. Scroll to see more.
      </p>
      <PanelScroller>
        {wallets.length === 0 ? (
          <EmptyState>
            {sdkReady ? 'No wallets found.' : 'Initialize SDK to load.'}
          </EmptyState>
        ) : (
          wallets.map((w) => {
            const attachedDevices = w.webauthnDevices ?? [];
            return (
              <PanelCard key={w.id}>
                <PanelCardTitle>{w.label || '(unlabelled)'}</PanelCardTitle>
                <PanelMeta>Wallet ID: {w.id}</PanelMeta>
                <div style={{ marginTop: 4 }}>
                  <PanelTag>{`Type: ${w.type}`}</PanelTag>
                  <PanelTag>{`Coin: ${w.coin}`}</PanelTag>
                </div>
                {attachedDevices.length > 0 ? (
                  <div style={{ marginTop: 6 }}>
                    <PanelTag colour="#c6f6d5">
                      Passkey attached ({attachedDevices.length})
                    </PanelTag>
                    {attachedDevices.map((dev, i) => (
                      <PanelMeta key={i} style={{ marginTop: 2 }}>
                        OTP Device ID: {dev.otpDeviceId}
                        {dev.prfSalt && (
                          <>
                            <br />
                            PRF Salt: {dev.prfSalt}
                          </>
                        )}
                      </PanelMeta>
                    ))}
                  </div>
                ) : (
                  <div style={{ marginTop: 4 }}>
                    <PanelTag colour="#fed7d7">No passkey attached</PanelTag>
                  </div>
                )}
                <QuickActions>
                  <SmallButton
                    disabled={busy}
                    title="Use this wallet for attach / derive / remove operations"
                    onClick={() => {
                      setWalletId(w.id);
                      log(`Selected wallet: ${w.id} (${w.label})`);
                    }}
                  >
                    Select
                  </SmallButton>
                </QuickActions>
              </PanelCard>
            );
          })
        )}
      </PanelScroller>
    </Section>
  );

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------

  return (
    <PageContainer>
      <h3>Passkey Demo</h3>
      <p style={{ color: '#666', fontSize: 14, marginBottom: 20 }}>
        End-to-end passkey lifecycle: register, attach to wallet, derive PRF
        key, and clean up. Requires HTTPS or localhost and a PRF-capable
        authenticator.
      </p>

      <TwoColumnLayout>
        <LeftColumn>
          {/* Login */}
          <Section>
            <SectionTitle>
              Login{' '}
              <StatusBadge active={sdkReady}>
                {sdkReady ? 'Logged In' : 'Not Logged In'}
              </StatusBadge>
            </SectionTitle>
            <FormGroup>
              <Label>Environment</Label>
              <select
                value={env}
                onChange={(e) => setEnv(e.target.value as EnvironmentName)}
                style={selectStyle}
                disabled={sdkReady}
              >
                <option value="test">test</option>
                <option value="staging">staging</option>
                <option value="prod">prod</option>
              </select>
            </FormGroup>
            <FormGroup>
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                disabled={sdkReady}
                autoComplete="email"
              />
            </FormGroup>
            <FormGroup>
              <Label>Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                disabled={sdkReady}
                autoComplete="current-password"
              />
            </FormGroup>
            <FormGroup>
              <Label>OTP</Label>
              <Input
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="000000"
                disabled={sdkReady}
                autoComplete="one-time-code"
              />
            </FormGroup>
            <Button
              onClick={handleLogin}
              disabled={!email || !password || !otp || sdkReady || busy}
            >
              {busy ? 'Logging in…' : 'Login'}
            </Button>
          </Section>

          {/* Config */}
          <Section>
            <SectionTitle>Config</SectionTitle>
            <FormGroup>
              <Label>Enterprise ID</Label>
              <Input
                value={enterpriseId}
                onChange={(e) => setEnterpriseId(e.target.value)}
                placeholder="Enterprise ID"
              />
            </FormGroup>
            <FormGroup>
              <Label>Coin</Label>
              <Input
                value={coin}
                onChange={(e) => setCoin(e.target.value)}
                placeholder="tbtc"
              />
            </FormGroup>
          </Section>

          {/* registerPasskey */}
          <Section>
            <SectionTitle>registerPasskey</SectionTitle>
            <FormGroup>
              <Label>Passkey Label</Label>
              <Input
                value={passkeyLabel}
                onChange={(e) => setPasskeyLabel(e.target.value)}
                placeholder="My Passkey"
                disabled={!sdkReady}
              />
            </FormGroup>
            <Button
              onClick={handleRegisterPasskey}
              disabled={!sdkReady || busy}
            >
              Register Passkey
            </Button>
          </Section>

          {/* Create Wallet */}
          <Section>
            <SectionTitle>Create Wallet</SectionTitle>
            <FormGroup>
              <Label>Wallet Label</Label>
              <Input
                value={walletLabel}
                onChange={(e) => setWalletLabel(e.target.value)}
                placeholder="Passkey Demo Wallet"
                disabled={!sdkReady}
              />
            </FormGroup>
            <FormGroup>
              <Label>Wallet Passphrase</Label>
              <Input
                type="password"
                value={walletPassphrase}
                onChange={(e) => setWalletPassphrase(e.target.value)}
                placeholder="Strong passphrase"
                disabled={!sdkReady}
              />
            </FormGroup>
            <Button
              onClick={handleCreateWallet}
              disabled={!sdkReady || !walletPassphrase || busy}
            >
              Create Wallet
            </Button>
          </Section>

          {/* attachPasskeyToWallet */}
          <Section>
            <SectionTitle>attachPasskeyToWallet</SectionTitle>
            {walletId && (
              <p
                style={{
                  fontSize: 12,
                  color: '#4a90e2',
                  margin: '0 0 8px 0',
                  wordBreak: 'break-all',
                }}
              >
                Wallet: {walletId}
              </p>
            )}
            <FormGroup>
              <Label>Device ID</Label>
              <Input
                value={attachDeviceId}
                readOnly
                placeholder="Select a passkey from the panel →"
                disabled={!sdkReady}
              />
            </FormGroup>
            <FormGroup>
              <Label>Existing Wallet Passphrase</Label>
              <Input
                type="password"
                value={attachPassphrase}
                onChange={(e) => setAttachPassphrase(e.target.value)}
                placeholder="Wallet passphrase"
                disabled={!sdkReady}
              />
            </FormGroup>
            <Button
              onClick={handleAttachPasskey}
              disabled={
                !sdkReady ||
                !attachDeviceId ||
                !walletId ||
                !attachPassphrase ||
                busy
              }
            >
              Attach Passkey
            </Button>
          </Section>

          {/* Send Funds */}
          <Section>
            <SectionTitle>Send Funds</SectionTitle>
            {walletId && (
              <p
                style={{
                  fontSize: 12,
                  color: '#4a90e2',
                  margin: '0 0 8px 0',
                  wordBreak: 'break-all',
                }}
              >
                Wallet: {walletId}
              </p>
            )}
            <FormGroup>
              <Label>Recipient Address</Label>
              <Input
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                placeholder="tb1q..."
                disabled={!sdkReady}
              />
            </FormGroup>
            <FormGroup>
              <Label>Amount (satoshis)</Label>
              <Input
                value={sendAmount}
                onChange={(e) => setSendAmount(e.target.value)}
                placeholder="10000"
                disabled={!sdkReady}
              />
            </FormGroup>
            <Button
              onClick={handleSendFunds}
              disabled={
                !sdkReady ||
                !recipientAddress ||
                !sendAmount ||
                !walletId ||
                busy
              }
            >
              Send Funds
            </Button>
          </Section>

          {/* derivePasskeyPrfKey */}
          <Section>
            <SectionTitle>derivePasskeyPrfKey</SectionTitle>
            {walletId && (
              <p
                style={{
                  fontSize: 12,
                  color: '#4a90e2',
                  margin: '0 0 8px 0',
                  wordBreak: 'break-all',
                }}
              >
                Wallet: {walletId}
              </p>
            )}
            <p style={{ fontSize: 13, color: '#666', margin: '0 0 8px 0' }}>
              Derives a wallet passphrase from the passkey — no password needed.
            </p>
            <Button
              onClick={handleDerivePrfKey}
              disabled={!sdkReady || !walletId || busy}
            >
              Derive PRF Key
            </Button>
          </Section>

          {/* removePasskeyFromWallet */}
          <Section>
            <SectionTitle>removePasskeyFromWallet</SectionTitle>
            {walletId && (
              <p
                style={{
                  fontSize: 12,
                  color: '#4a90e2',
                  margin: '0 0 8px 0',
                  wordBreak: 'break-all',
                }}
              >
                Wallet: {walletId}
              </p>
            )}
            <FormGroup>
              <Label>Device ID</Label>
              <Input
                value={removeDeviceId}
                readOnly
                placeholder="Select a passkey from the panel →"
                disabled={!sdkReady}
              />
            </FormGroup>
            <FormGroup>
              <Label>Wallet Passphrase</Label>
              <Input
                type="password"
                value={removeWalletPassphrase}
                onChange={(e) => setRemoveWalletPassphrase(e.target.value)}
                placeholder="Wallet passphrase"
                disabled={!sdkReady}
              />
            </FormGroup>
            <Button
              onClick={handleRemoveFromWallet}
              disabled={
                !sdkReady ||
                !removeDeviceId ||
                !walletId ||
                !removeWalletPassphrase ||
                busy
              }
            >
              Remove Passkey from Wallet
            </Button>
          </Section>

          {/* removePasskeyFromAccount */}
          <Section>
            <SectionTitle>removePasskeyFromAccount</SectionTitle>
            <FormGroup>
              <Label>Device ID</Label>
              <Input
                value={removeDeviceId}
                readOnly
                placeholder="Select a passkey from the panel →"
                disabled={!sdkReady}
              />
            </FormGroup>
            <Button
              onClick={handleRemoveFromAccount}
              disabled={!sdkReady || !removeDeviceId || busy}
            >
              Remove Passkey from Account
            </Button>
          </Section>

          {error && <ErrorText>{error}</ErrorText>}
          {success && <SuccessText>{success}</SuccessText>}
        </LeftColumn>

        <RightColumn>
          {/* Activity Log */}
          <Section>
            <SectionTitle>Activity Log</SectionTitle>
            <LogArea ref={logAreaRef}>
              {logs.length === 0
                ? 'Waiting for actions...'
                : logs.map((entry, i) => (
                    <div
                      key={i}
                      style={{
                        color:
                          entry.level === 'error'
                            ? '#e53e3e'
                            : entry.level === 'success'
                            ? '#276749'
                            : 'inherit',
                      }}
                    >
                      [{entry.time}] {entry.message}
                    </div>
                  ))}
            </LogArea>
          </Section>

          {/* Registered Passkeys panel */}
          {renderPasskeyPanel()}

          {/* Wallets & Passkey Attachments panel */}
          {renderWalletPanel()}
        </RightColumn>
      </TwoColumnLayout>
    </PageContainer>
  );
};

export default PasskeyDemo;
