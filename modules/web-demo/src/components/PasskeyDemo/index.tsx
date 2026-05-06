import React, { useState, useCallback, useRef, useEffect } from 'react';
import { BitGoAPI } from '@bitgo/sdk-api';
import type { EnvironmentName } from '@bitgo/sdk-core';
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
  color: ${({ colour }) => (colour === '#c6f6d5' ? '#276749' : colour === '#fed7d7' ? '#9b2c2c' : '#4a5568')};
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

type LogEntry = { time: string; message: string };

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
 * Browser WebAuthn provider that wraps navigator.credentials for use with
 * @bitgo/passkey-crypto functions.
 */
const browserProvider = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  create: async (options: any) => {
    const cred = await navigator.credentials.create({ publicKey: options });
    return cred as any;
  },
  get: async ({
    publicKey,
    evalByCredential,
  }: {
    publicKey: any;
    evalByCredential?: Record<string, any>;
  }) => {
    const cred = (await navigator.credentials.get({
      publicKey: {
        ...publicKey,
        extensions: { prf: { evalByCredential } } as any,
      },
    })) as any;
    const ext = (cred as any).getClientExtensionResults() as {
      prf?: { results?: { first?: ArrayBuffer } };
    };
    return {
      prfResult: ext.prf?.results?.first,
      credentialId: cred.id,
      otpCode: '',
    };
  },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const PasskeyDemo = () => {
  // Config — env/enterpriseId/coin persisted to localStorage (not the token)
  const [accessToken, setAccessToken] = useState('');
  const [env, setEnv] = useState<EnvironmentName>(
    () => (localStorage.getItem('passkey-demo:env') as EnvironmentName) || 'test'
  );
  const [enterpriseId, setEnterpriseId] = useState(
    () => localStorage.getItem('passkey-demo:enterpriseId') || ''
  );
  const [coin, setCoin] = useState(
    () => localStorage.getItem('passkey-demo:coin') || 'tbtc'
  );

  // Persist config changes
  useEffect(() => { localStorage.setItem('passkey-demo:env', env); }, [env]);
  useEffect(() => { localStorage.setItem('passkey-demo:enterpriseId', enterpriseId); }, [enterpriseId]);
  useEffect(() => { localStorage.setItem('passkey-demo:coin', coin); }, [coin]);

  // Step state
  const [sdkReady, setSdkReady] = useState(false);
  const [passkeyRegistered, setPasskeyRegistered] = useState(false);
  const [walletCreated, setWalletCreated] = useState(false);
  const [passkeyAttached, setPasskeyAttached] = useState(false);
  const [prfDerived, setPrfDerived] = useState(false);
  const [fundsSent, setFundsSent] = useState(false);
  const [removedFromWallet, setRemovedFromWallet] = useState(false);
  const [removedFromAccount, setRemovedFromAccount] = useState(false);

  // Data
  const [lastDevice, setLastDevice] = useState<(WebAuthnOtpDevice & { prfSupported?: boolean }) | null>(null);
  const [walletId, setWalletId] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [lastPrfPassword, setLastPrfPassword] = useState('');

  // Step 1 inputs
  const [passkeyLabel, setPasskeyLabel] = useState('');

  // Step 2 inputs
  const [walletLabel, setWalletLabel] = useState('');
  const [walletPassphrase, setWalletPassphrase] = useState('');

  // Step 5 inputs
  const [recipientAddress, setRecipientAddress] = useState('');
  const [sendAmount, setSendAmount] = useState('');

  // UI
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Info panels
  const [registeredPasskeys, setRegisteredPasskeys] = useState<OtpDeviceInfo[]>([]);
  const [wallets, setWallets] = useState<WalletInfo[]>([]);
  const [loadingPasskeys, setLoadingPasskeys] = useState(false);
  const [loadingWallets, setLoadingWallets] = useState(false);

  const sdkRef = useRef<BitGoAPI | null>(null);
  const logAreaRef = useRef<HTMLPreElement | null>(null);

  const log = useCallback((message: string) => {
    setLogs((prev) => [...prev, { time: ts(), message }]);
  }, []);

  useEffect(() => {
    if (logAreaRef.current) {
      logAreaRef.current.scrollTop = logAreaRef.current.scrollHeight;
    }
  }, [logs]);

  const clearStatus = () => {
    setError(null);
    setSuccess(null);
  };

  // --- Fetch registered passkeys from /user/me ---
  const fetchPasskeys = useCallback(async () => {
    const sdk = sdkRef.current;
    if (!sdk) return;
    setLoadingPasskeys(true);
    try {
      const me = (await (sdk as any).me()) as any;
      const devices: OtpDeviceInfo[] = (me?.otpDevices ?? me?.user?.otpDevices ?? []).filter(
        (d: any) => d.isPasskey || d.extensions?.prf
      );
      setRegisteredPasskeys(devices);
    } catch (e: any) {
      log(`Failed to fetch passkeys: ${e.message || e}`);
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
      const resp = (await (sdk.coin(coin).wallets() as any).list({ limit: 25 })) as any;
      const list: WalletInfo[] = (resp?.wallets ?? []).map((w: any) => ({
        id: w.id,
        label: w.label,
        type: w.type,
        coin: w.coin,
        webauthnDevices: w.webauthnDevices ?? w.webAuthnDevices ?? [],
      }));
      setWallets(list);
    } catch (e: any) {
      log(`Failed to fetch wallets: ${e.message || e}`);
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

  // --- Config: Initialize SDK ---
  const handleInitSdk = useCallback(async () => {
    clearStatus();
    setBusy(true);
    try {
      log(`Creating BitGoAPI (env=${env})...`);
      const sdk = new BitGoAPI({ env, accessToken });
      // Register the selected coin so sdk.coin(coin) works
      await coinFactory.getCoin(coin, sdk);
      sdkRef.current = sdk;
      setSdkReady(true);
      log(`SDK initialized. Coin "${coin}" registered.`);
      setSuccess('SDK ready. Proceed to Step 1.');
    } catch (e: any) {
      setError(e.message || String(e));
      log(`Error: ${e.message || e}`);
    } finally {
      setBusy(false);
    }
  }, [env, accessToken, coin, log]);

  // --- Step 1: Register Passkey ---
  const handleRegisterPasskey = useCallback(async () => {
    clearStatus();
    setBusy(true);
    const sdk = sdkRef.current;
    if (!sdk) return;

    try {
      log('Step 1: Registering passkey...');
      const device = await registerPasskey({
        bitgo: sdk as any,
        provider: browserProvider as any,
        label: passkeyLabel || 'Demo Passkey',
      });
      setLastDevice(device);
      setPasskeyRegistered(true);
      log(`Passkey registered. Device ID: ${device.id}`);
      log(`Credential ID: ${device.credentialId}`);
      log(`PRF supported: ${device.prfSupported}`);
      if (device.prfSalt) log(`PRF salt: ${device.prfSalt}`);
      setSuccess('Passkey registered successfully.');
      await fetchPasskeys();
    } catch (e: any) {
      setError(e.message || String(e));
      log(`Error: ${e.message || e}`);
    } finally {
      setBusy(false);
    }
  }, [passkeyLabel, log, fetchPasskeys]);

  // --- Step 2: Create Wallet ---
  const handleCreateWallet = useCallback(async () => {
    clearStatus();
    setBusy(true);
    const sdk = sdkRef.current;
    if (!sdk) return;

    try {
      log(`Step 2: Creating ${coin} wallet "${walletLabel}"...`);
      const result = await sdk.coin(coin).wallets().generateWallet({
        label: walletLabel || 'Passkey Demo Wallet',
        passphrase: walletPassphrase,
        enterprise: enterpriseId,
        multisigType: 'tss',
        walletVersion: 5,
      });
      const wId = result.wallet.id();
      setWalletId(wId);
      setPassphrase(walletPassphrase);
      setWalletCreated(true);
      log(`Wallet created. ID: ${wId}`);
      setSuccess(`Wallet created: ${wId}`);
      await fetchWallets();
    } catch (e: any) {
      setError(e.message || String(e));
      log(`Error: ${e.message || e}`);
    } finally {
      setBusy(false);
    }
  }, [coin, walletLabel, walletPassphrase, enterpriseId, log, fetchWallets]);

  // --- Step 3: Attach Passkey to Wallet ---
  const handleAttachPasskey = useCallback(async () => {
    clearStatus();
    setBusy(true);
    const sdk = sdkRef.current;
    if (!sdk || !lastDevice) return;

    try {
      log('Step 3: Attaching passkey to wallet...');
      const keychain = await attachPasskeyToWallet({
        bitgo: sdk as any,
        coin,
        walletId,
        device: lastDevice,
        existingPassphrase: passphrase,
        provider: browserProvider as any,
      });
      setPasskeyAttached(true);
      log('Passkey attached to wallet successfully.');
      log(`Keychain ID: ${(keychain as any).id || 'N/A'}`);
      setSuccess('Passkey attached to wallet.');
      await fetchWallets();
    } catch (e: any) {
      setError(e.message || String(e));
      log(`Error: ${e.message || e}`);
    } finally {
      setBusy(false);
    }
  }, [coin, walletId, lastDevice, passphrase, log, fetchWallets]);

  // --- Step 4: Derive PRF Key ---
  const handleDerivePrfKey = useCallback(async () => {
    clearStatus();
    setBusy(true);
    const sdk = sdkRef.current;
    if (!sdk) return;

    try {
      log('Step 4: Deriving PRF key (wallet passphrase from passkey)...');
      const wallet = await sdk.coin(coin).wallets().get({ id: walletId });
      const prfPassword = await derivePasskeyPrfKey({
        bitgo: sdk as any,
        wallet,
        provider: browserProvider as any,
      });
      setLastPrfPassword(prfPassword);
      setPrfDerived(true);
      log(`PRF-derived password: ${prfPassword.slice(0, 16)}...`);
      setSuccess('PRF key derived. You can now sign transactions without a passphrase.');
    } catch (e: any) {
      setError(e.message || String(e));
      log(`Error: ${e.message || e}`);
    } finally {
      setBusy(false);
    }
  }, [coin, walletId, log]);

  // --- Step 5: Send Funds ---
  const handleSendFunds = useCallback(async () => {
    clearStatus();
    setBusy(true);
    const sdk = sdkRef.current;
    if (!sdk) return;

    try {
      log(`Step 5: Sending ${sendAmount} satoshis to ${recipientAddress}...`);
      const wallet = await sdk.coin(coin).wallets().get({ id: walletId });
      const result = await wallet.send({
        address: recipientAddress,
        amount: sendAmount,
        walletPassphrase: lastPrfPassword,
      });
      setFundsSent(true);
      const txId = (result as any).txid || (result as any).transfer?.txid || 'N/A';
      log(`Transaction sent. TxID: ${txId}`);
      log(`Result: ${JSON.stringify(result, null, 2).slice(0, 500)}`);
      setSuccess(`Funds sent. TxID: ${txId}`);
    } catch (e: any) {
      setError(e.message || String(e));
      log(`Error: ${e.message || e}`);
    } finally {
      setBusy(false);
    }
  }, [coin, walletId, recipientAddress, sendAmount, lastPrfPassword, log]);

  // --- Step 6: Remove Passkey from Wallet ---
  const handleRemoveFromWallet = useCallback(async () => {
    clearStatus();
    setBusy(true);
    const sdk = sdkRef.current;
    if (!sdk || !lastDevice) return;

    try {
      log('Step 6: Removing passkey from wallet...');
      await removePasskeyFromWallet({
        bitgo: sdk as any,
        coin,
        walletId,
        device: lastDevice,
        walletPassphrase: lastPrfPassword,
      });
      setRemovedFromWallet(true);
      log('Passkey removed from wallet.');
      setSuccess('Passkey removed from wallet.');
      await fetchWallets();
    } catch (e: any) {
      setError(e.message || String(e));
      log(`Error: ${e.message || e}`);
    } finally {
      setBusy(false);
    }
  }, [coin, walletId, lastDevice, lastPrfPassword, log, fetchWallets]);

  // --- Step 7: Remove Passkey from Account ---
  const handleRemoveFromAccount = useCallback(async () => {
    clearStatus();
    setBusy(true);
    const sdk = sdkRef.current;
    if (!sdk || !lastDevice) return;

    try {
      log('Step 7: Removing passkey from account...');
      await removePasskeyFromAccount({
        bitgo: sdk as any,
        device: lastDevice,
      });
      setRemovedFromAccount(true);
      log('Passkey removed from account.');
      setSuccess('Passkey removed from account. Full lifecycle complete.');
      await fetchPasskeys();
    } catch (e: any) {
      setError(e.message || String(e));
      log(`Error: ${e.message || e}`);
    } finally {
      setBusy(false);
    }
  }, [lastDevice, log, fetchPasskeys]);

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
        <SmallButton onClick={fetchPasskeys} disabled={!sdkReady || loadingPasskeys}>
          {loadingPasskeys ? 'Loading…' : '↻ Refresh'}
        </SmallButton>
      </RefreshRow>
      <p style={{ fontSize: 12, color: '#718096', margin: '0 0 8px 0' }}>
        WebAuthn devices currently registered on your account.
      </p>
      <PanelScroller>
        {registeredPasskeys.length === 0 ? (
          <EmptyState>{sdkReady ? 'No passkeys found.' : 'Initialize SDK to load.'}</EmptyState>
        ) : (
          registeredPasskeys.map((d) => (
            <PanelCard key={d.id}>
              <PanelCardTitle>{d.label || '(unlabelled)'}</PanelCardTitle>
              <PanelMeta>ID: {d.id}</PanelMeta>
              {d.credentialId && <PanelMeta>Credential ID: {d.credentialId}</PanelMeta>}
              {d.prfSalt && <PanelMeta>PRF Salt: {d.prfSalt}</PanelMeta>}
              <div style={{ marginTop: 4 }}>
                <PanelTag colour={d.extensions?.prf ? '#c6f6d5' : '#fed7d7'}>
                  PRF: {d.extensions?.prf ? 'supported' : 'not supported'}
                </PanelTag>
              </div>
              <QuickActions>
                <SmallButton
                  disabled={!walletCreated || busy}
                  title="Use this passkey for Step 3: Attach"
                  onClick={() => {
                    setLastDevice({
                      id: d.id,
                      credentialId: d.credentialId ?? '',
                      prfSalt: d.prfSalt,
                      isPasskey: d.isPasskey,
                      extensions: d.extensions,
                      prfSupported: !!d.extensions?.prf,
                    });
                    log(`Selected passkey for attach: ${d.id}`);
                  }}
                >
                  Use for Attach
                </SmallButton>
                <SmallButton
                  disabled={!prfDerived || busy}
                  title="Use this passkey for Step 6: Remove from wallet"
                  onClick={() => {
                    setLastDevice({
                      id: d.id,
                      credentialId: d.credentialId ?? '',
                      prfSalt: d.prfSalt,
                      isPasskey: d.isPasskey,
                      extensions: d.extensions,
                      prfSupported: !!d.extensions?.prf,
                    });
                    log(`Selected passkey for removal: ${d.id}`);
                  }}
                >
                  Use for Remove
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
          Associated Wallets{' '}
          <span style={{ fontSize: 11, color: '#718096', fontWeight: 400 }}>({coin})</span>
        </SectionTitle>
        <SmallButton onClick={fetchWallets} disabled={!sdkReady || loadingWallets}>
          {loadingWallets ? 'Loading…' : '↻ Refresh'}
        </SmallButton>
      </RefreshRow>
      <p style={{ fontSize: 12, color: '#718096', margin: '0 0 8px 0' }}>
        Wallets on your account for the current coin. Scroll to see more.
      </p>
      <PanelScroller>
        {wallets.length === 0 ? (
          <EmptyState>{sdkReady ? 'No wallets found.' : 'Initialize SDK to load.'}</EmptyState>
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
                    <PanelTag colour="#c6f6d5">Passkey attached ({attachedDevices.length})</PanelTag>
                    {attachedDevices.map((dev, i) => (
                      <PanelMeta key={i} style={{ marginTop: 2 }}>
                        OTP Device ID: {dev.otpDeviceId}
                        {dev.prfSalt && <><br />PRF Salt: {dev.prfSalt}</>}
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
                    disabled={!passkeyRegistered || busy}
                    title="Use this wallet for Step 3: Attach Passkey"
                    onClick={() => {
                      setWalletId(w.id);
                      setWalletCreated(true);
                      log(`Selected wallet for attach: ${w.id} (${w.label})`);
                    }}
                  >
                    Choose for Attach
                  </SmallButton>
                  <SmallButton
                    disabled={!prfDerived || busy}
                    title="Use this wallet for Step 6: Remove Passkey"
                    onClick={() => {
                      setWalletId(w.id);
                      log(`Selected wallet for removal: ${w.id} (${w.label})`);
                    }}
                  >
                    Choose for Remove
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
        End-to-end passkey lifecycle: register, attach to wallet, derive PRF key,
        send funds, and clean up. Requires HTTPS or localhost and a
        PRF-capable authenticator.
      </p>

      <TwoColumnLayout>
        <LeftColumn>
          {/* Config */}
          <Section>
            <SectionTitle>
              Config{' '}
              <StatusBadge active={sdkReady}>
                {sdkReady ? 'SDK Ready' : 'Not Initialized'}
              </StatusBadge>
            </SectionTitle>
            <FormGroup>
              <Label>Access Token</Label>
              <Input
                type="password"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder="v2x..."
              />
            </FormGroup>
            <FormGroup>
              <Label>Environment</Label>
              <select value={env} onChange={(e) => setEnv(e.target.value as EnvironmentName)} style={selectStyle}>
                <option value="test">test</option>
                <option value="staging">staging</option>
                <option value="prod">prod</option>
              </select>
            </FormGroup>
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
              <Input value={coin} onChange={(e) => setCoin(e.target.value)} placeholder="tbtc" />
            </FormGroup>
            <Button onClick={handleInitSdk} disabled={!accessToken}>
              Initialize SDK
            </Button>
          </Section>

          {/* Step 1: Register Passkey */}
          <Section>
            <SectionTitle>
              Step 1: Register Passkey{' '}
              <StatusBadge active={passkeyRegistered}>
                {passkeyRegistered ? 'Done' : 'Pending'}
              </StatusBadge>
            </SectionTitle>
            <FormGroup>
              <Label>Passkey Label</Label>
              <Input
                value={passkeyLabel}
                onChange={(e) => setPasskeyLabel(e.target.value)}
                placeholder="My Passkey"
                disabled={!sdkReady}
              />
            </FormGroup>
            <Button onClick={handleRegisterPasskey} disabled={!sdkReady || busy}>
              Register Passkey
            </Button>
          </Section>

          {/* Step 2: Create Wallet */}
          <Section>
            <SectionTitle>
              Step 2: Create Wallet{' '}
              <StatusBadge active={walletCreated}>
                {walletCreated ? 'Done' : 'Pending'}
              </StatusBadge>
            </SectionTitle>
            <FormGroup>
              <Label>Wallet Label</Label>
              <Input
                value={walletLabel}
                onChange={(e) => setWalletLabel(e.target.value)}
                placeholder="Passkey Demo Wallet"
                disabled={!passkeyRegistered}
              />
            </FormGroup>
            <FormGroup>
              <Label>Wallet Passphrase</Label>
              <Input
                type="password"
                value={walletPassphrase}
                onChange={(e) => setWalletPassphrase(e.target.value)}
                placeholder="Strong passphrase"
                disabled={!passkeyRegistered}
              />
            </FormGroup>
            <Button onClick={handleCreateWallet} disabled={!passkeyRegistered || !walletPassphrase || busy}>
              Create Wallet
            </Button>
          </Section>

          {/* Step 3: Attach Passkey to Wallet */}
          <Section>
            <SectionTitle>
              Step 3: Attach Passkey to Wallet{' '}
              <StatusBadge active={passkeyAttached}>
                {passkeyAttached ? 'Done' : 'Pending'}
              </StatusBadge>
            </SectionTitle>
            <p style={{ fontSize: 13, color: '#666', margin: '0 0 8px 0' }}>
              Passphrase auto-filled from Step 2. Or pick an existing wallet from the panel →
            </p>
            {walletId && (
              <p style={{ fontSize: 12, color: '#4a90e2', margin: '0 0 8px 0', wordBreak: 'break-all' }}>
                Wallet: {walletId}
              </p>
            )}
            <Button onClick={handleAttachPasskey} disabled={!walletCreated || busy}>
              Attach Passkey
            </Button>
          </Section>

          {/* Step 4: Derive PRF Key */}
          <Section>
            <SectionTitle>
              Step 4: Derive PRF Key{' '}
              <StatusBadge active={prfDerived}>
                {prfDerived ? 'Done' : 'Pending'}
              </StatusBadge>
            </SectionTitle>
            <p style={{ fontSize: 13, color: '#666', margin: '0 0 8px 0' }}>
              Derives a wallet passphrase from the passkey — no password needed.
            </p>
            <Button onClick={handleDerivePrfKey} disabled={!passkeyAttached || busy}>
              Derive PRF Key
            </Button>
          </Section>

          {/* Step 5: Send Funds */}
          <Section>
            <SectionTitle>
              Step 5: Send Funds{' '}
              <StatusBadge active={fundsSent}>
                {fundsSent ? 'Done' : 'Pending'}
              </StatusBadge>
            </SectionTitle>
            <FormGroup>
              <Label>Recipient Address</Label>
              <Input
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                placeholder="tb1q..."
                disabled={!prfDerived}
              />
            </FormGroup>
            <FormGroup>
              <Label>Amount (satoshis)</Label>
              <Input
                value={sendAmount}
                onChange={(e) => setSendAmount(e.target.value)}
                placeholder="10000"
                disabled={!prfDerived}
              />
            </FormGroup>
            <Button onClick={handleSendFunds} disabled={!prfDerived || !recipientAddress || !sendAmount || busy}>
              Send Funds
            </Button>
          </Section>

          {/* Step 6: Remove Passkey from Wallet */}
          <Section>
            <SectionTitle>
              Step 6: Remove from Wallet{' '}
              <StatusBadge active={removedFromWallet}>
                {removedFromWallet ? 'Done' : 'Pending'}
              </StatusBadge>
            </SectionTitle>
            {walletId && (
              <p style={{ fontSize: 12, color: '#4a90e2', margin: '0 0 8px 0', wordBreak: 'break-all' }}>
                Wallet: {walletId}
              </p>
            )}
            <Button onClick={handleRemoveFromWallet} disabled={!prfDerived || busy}>
              Remove Passkey from Wallet
            </Button>
          </Section>

          {/* Step 7: Remove Passkey from Account */}
          <Section>
            <SectionTitle>
              Step 7: Remove from Account{' '}
              <StatusBadge active={removedFromAccount}>
                {removedFromAccount ? 'Done' : 'Pending'}
              </StatusBadge>
            </SectionTitle>
            <p style={{ fontSize: 13, color: '#666', margin: '0 0 8px 0' }}>
              Must remove from all wallets first.
            </p>
            <Button onClick={handleRemoveFromAccount} disabled={!removedFromWallet || busy}>
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
                : logs.map((entry) => `[${entry.time}] ${entry.message}`).join('\n')}
            </LogArea>
          </Section>

          {/* Registered Passkeys panel */}
          {renderPasskeyPanel()}

          {/* Associated Wallets panel */}
          {renderWalletPanel()}
        </RightColumn>
      </TwoColumnLayout>
    </PageContainer>
  );
};

export default PasskeyDemo;
