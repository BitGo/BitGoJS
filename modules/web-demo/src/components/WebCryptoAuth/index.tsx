import React, { useState, useCallback, useRef, useEffect } from 'react';
import { BitGoAPI, BitGoAPIOptions } from '@bitgo/sdk-api';
import type { EnvironmentName } from '@bitgo/sdk-core';
import {
  WebCryptoHmacStrategy,
  IndexedDbTokenStore,
  // eslint-disable-next-line import/no-internal-modules
} from '@bitgo/sdk-hmac/browser';
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

type LogEntry = { time: string; message: string };

function ts(): string {
  return new Date().toLocaleTimeString('en-US', { hour12: false });
}

const DEFAULT_ENV = 'test';
const DEFAULT_AUTH_VERSION = 3 as 2 | 3;

const WebCryptoAuth = () => {
  const [env, setEnv] = useState<EnvironmentName>(DEFAULT_ENV);
  const [customUri, setCustomUri] = useState('');
  const [authVersion, setAuthVersion] = useState<2 | 3>(DEFAULT_AUTH_VERSION);

  const [strategyReady, setStrategyReady] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  const [tokenRestored, setTokenRestored] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [autoRestoring, setAutoRestoring] = useState(true);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const strategyRef = useRef<WebCryptoHmacStrategy | null>(null);
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

  const createSdk = useCallback(
    async (
      targetEnv: EnvironmentName,
      targetCustomUri: string,
      targetAuthVersion: 2 | 3,
      appendLog: (msg: string) => void,
    ): Promise<{
      sdk: BitGoAPI;
      strategy: WebCryptoHmacStrategy;
      restored: boolean;
    }> => {
      appendLog(
        `Creating WebCryptoHmacStrategy (auth v${targetAuthVersion}) with IndexedDbTokenStore...`,
      );
      const strategy = new WebCryptoHmacStrategy({
        tokenStore: new IndexedDbTokenStore(),
        authVersion: targetAuthVersion,
      });

      appendLog('Checking IndexedDB for existing CryptoSigning...');
      const restored = await strategy.restoreToken();
      if (restored) {
        appendLog(
          'CryptoSigning restored (CryptoKey + tokenHash). No raw token involved.',
        );
      } else {
        appendLog('No stored CryptoSigning found in IndexedDB.');
      }

      const options: BitGoAPIOptions = {
        hmacAuthStrategy: strategy,
        hmacVerification: true,
        authVersion: targetAuthVersion,
      };

      if (targetEnv === 'custom' && targetCustomUri) {
        options.env = 'custom';
        options.customRootURI = targetCustomUri;
      } else {
        options.env = targetEnv;
      }

      appendLog(`Creating BitGoAPI with env="${options.env as string}"...`);
      const sdk = new BitGoAPI(options);
      appendLog('BitGoAPI instance created with WebCryptoHmacStrategy.');

      return { sdk, strategy, restored };
    },
    [],
  );

  // Auto-restore on mount: probe IndexedDB, rebuild SDK, and call /user/me
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        log('Auto-restore: probing IndexedDB for existing session...');

        const { sdk, strategy, restored } = await createSdk(
          DEFAULT_ENV,
          '',
          authVersion,
          log,
        );

        if (cancelled) return;

        strategyRef.current = strategy;
        sdkRef.current = sdk;
        setStrategyReady(true);
        setSdkReady(true);
        setTokenRestored(restored);

        if (restored) {
          setLoggedIn(true);
          log('Auto-restore: session found. Testing with GET /user/me ...');

          try {
            const result = await sdk.get(sdk.url('/user/me', 2)).result();
            if (cancelled) return;
            log(`Auto-restore: /user/me succeeded.`);
            log(`Response: ${JSON.stringify(result, null, 2).slice(0, 500)}`);
            setSuccess(
              'Session restored from IndexedDB and verified via /user/me.',
            );
          } catch (e: any) {
            if (cancelled) return;
            log(`Auto-restore: /user/me failed — ${e.message || e}`);
            log('Session may be expired. Please log in again.');
            setLoggedIn(false);
            setTokenRestored(false);
            await strategy.clearToken();
            setError('Stored session expired or invalid. Please log in.');
          }
        } else {
          log('Auto-restore: no session found. Ready for manual setup.');
          setSuccess('SDK initialized. Use the form to authenticate.');
        }
      } catch (e: any) {
        if (cancelled) return;
        log(`Auto-restore error: ${e.message || e}`);
      } finally {
        if (!cancelled) setAutoRestoring(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleCreateSdk = useCallback(async () => {
    clearStatus();
    try {
      const { sdk, strategy, restored } = await createSdk(
        env,
        customUri,
        authVersion,
        log,
      );

      strategyRef.current = strategy;
      sdkRef.current = sdk;
      setStrategyReady(true);
      setSdkReady(true);
      setTokenRestored(restored);

      if (restored) {
        setLoggedIn(true);
        setSuccess(
          'SDK initialized with restored CryptoSigning from IndexedDB.',
        );
      } else {
        setSuccess(
          'SDK initialized. Use the login form below to authenticate.',
        );
      }
    } catch (e: any) {
      setError(e.message || String(e));
      log(`Error: ${e.message || e}`);
    }
  }, [env, customUri, authVersion, log, createSdk]);

  const handleLogin = useCallback(async () => {
    clearStatus();
    const sdk = sdkRef.current;
    const strategy = strategyRef.current;
    if (!sdk || !strategy) {
      setError('SDK not initialized. Create it first.');
      return;
    }

    try {
      log(`Authenticating as ${username}...`);
      const response = await sdk.authenticate({
        username,
        password,
        otp,
      });
      log('Authentication successful.');

      const token = response?.access_token;
      if (token) {
        log('Importing access_token into WebCrypto strategy...');
        await strategy.setToken(token);
        log('CryptoSigning saved to IndexedDB. Raw token not stored.');
        setLoggedIn(true);
        setSuccess(
          `Logged in as ${username}. Refresh the page to see auto-restore.`,
        );
      } else {
        log('Warning: No access_token in response body.');
        setSuccess('Authenticated, but no access_token returned.');
      }
    } catch (e) {
      const msg = e.message || String(e);
      setError(msg);
      log(`Login error: ${msg}`);
    }
  }, [username, password, otp, log]);

  const handleClearToken = useCallback(async () => {
    clearStatus();
    const strategy = strategyRef.current;
    if (!strategy) return;

    await strategy.clearToken();
    setLoggedIn(false);
    setTokenRestored(false);
    log('CryptoSigning cleared from memory and IndexedDB.');
    setSuccess(
      'Session cleared. Refresh the page to confirm auto-restore finds nothing.',
    );
  }, [log]);

  const handleTestRequest = useCallback(async () => {
    clearStatus();
    const sdk = sdkRef.current;
    if (!sdk) {
      setError('SDK not initialized.');
      return;
    }

    try {
      log('GET /api/v2/user/me ...');
      const result = await sdk.get(sdk.url('/user/me', 2)).result();
      log(`Response: ${JSON.stringify(result, null, 2).slice(0, 500)}`);
      setSuccess(
        'Authenticated request succeeded. HMAC verified by WebCrypto strategy.',
      );
    } catch (e: any) {
      const msg = e.message || String(e);
      setError(msg);
      log(`Request error: ${msg}`);
    }
  }, [log]);

  const handleTestFetch = useCallback(async () => {
    clearStatus();
    const strategy = strategyRef.current;
    const sdk = sdkRef.current;
    if (!strategy || !sdk) {
      setError('SDK/Strategy not initialized.');
      return;
    }

    try {
      const url = sdk.url('/ping', 2);
      log(`Standalone fetch: GET ${url} ...`);
      const headers = await strategy.getAuthHeaders({ url, method: 'GET' });
      log(`Auth headers: ${JSON.stringify(headers, null, 2)}`);

      const response = await fetch(url, { headers });
      log(`Response status: ${response.status}`);

      if (strategy.hasToken()) {
        const verification = await strategy.verifyFetchResponse({
          url,
          method: 'GET',
          response,
        });
        log(`HMAC valid: ${verification.isValid}`);
        log(`In validity window: ${verification.isInResponseValidityWindow}`);
      }

      setSuccess('Standalone fetch completed.');
    } catch (e: any) {
      const msg = e.message || String(e);
      setError(msg);
      log(`Fetch error: ${msg}`);
    }
  }, [log]);

  return (
    <PageContainer>
      <h3>WebCrypto HMAC Strategy Demo</h3>
      <p style={{ color: '#666', fontSize: 14, marginBottom: 20 }}>
        Demonstrates BitGoAPI with pluggable WebCrypto-based HMAC signing. All
        HMAC operations use <code>crypto.subtle</code>. Only the non-extractable
        CryptoKey and token hash are persisted in IndexedDB. On page load, the
        component auto-detects an existing session and verifies it with{' '}
        <code>GET /user/me</code>.
      </p>

      <TwoColumnLayout>
        <LeftColumn>
          {/* SDK Setup */}
          <Section>
            <SectionTitle>
              1. Initialize SDK{' '}
              <StatusBadge active={sdkReady}>
                {autoRestoring
                  ? 'Restoring...'
                  : sdkReady
                  ? 'Ready'
                  : 'Not Created'}
              </StatusBadge>
            </SectionTitle>
            <FormGroup>
              <Label>Environment</Label>
              <select
                value={env}
                onChange={(e) => setEnv(e.target.value as EnvironmentName)}
                style={{
                  padding: '8px',
                  borderRadius: 4,
                  border: '1px solid #ccc',
                  width: '100%',
                }}
              >
                <option value="test">test (test.bitgo.com)</option>
                <option value="prod">prod (app.bitgo.com)</option>
                <option value="custom">custom</option>
              </select>
            </FormGroup>
            <FormGroup>
              <Label>Auth Version</Label>
              <select
                value={authVersion}
                onChange={(e) =>
                  setAuthVersion(Number(e.target.value) as 2 | 3)
                }
                style={{
                  padding: '8px',
                  borderRadius: 4,
                  border: '1px solid #ccc',
                  width: '100%',
                }}
              >
                <option value={2}>v2</option>
                <option value={3}>v3</option>
              </select>
            </FormGroup>
            {env === 'custom' && (
              <FormGroup>
                <Label>Custom Root URI</Label>
                <Input
                  value={customUri}
                  onChange={(e) => setCustomUri(e.target.value)}
                  placeholder="https://your-bitgo-instance.com"
                />
              </FormGroup>
            )}
            <Button onClick={handleCreateSdk} disabled={autoRestoring}>
              {sdkReady
                ? 'Reinitialize SDK'
                : 'Create SDK with WebCrypto Strategy'}
            </Button>
            {tokenRestored && (
              <span style={{ marginLeft: 8, fontSize: 13, color: '#155724' }}>
                CryptoSigning restored from IndexedDB
              </span>
            )}
          </Section>

          {/* Login Form */}
          <Section>
            <SectionTitle>
              2. Authenticate{' '}
              <StatusBadge active={loggedIn}>
                {loggedIn ? 'Logged In' : 'Not Logged In'}
              </StatusBadge>
            </SectionTitle>
            <FormGroup>
              <Label>Email</Label>
              <Input
                type="email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="user@example.com"
                disabled={!sdkReady}
              />
            </FormGroup>
            <FormGroup>
              <Label>Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                disabled={!sdkReady}
              />
            </FormGroup>
            <FormGroup>
              <Label>OTP (optional)</Label>
              <Input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="000000"
                disabled={!sdkReady}
              />
            </FormGroup>
            <Button
              onClick={handleLogin}
              disabled={!sdkReady || !username || !password}
            >
              Login
            </Button>
            <Button
              variant="danger"
              onClick={handleClearToken}
              disabled={!strategyReady}
            >
              Clear Token
            </Button>
          </Section>

          {/* Test Requests */}
          <Section>
            <SectionTitle>3. Test Authenticated Requests</SectionTitle>
            <Button onClick={handleTestRequest} disabled={!loggedIn}>
              GET /user/me (via BitGoAPI)
            </Button>
            <Button
              variant="secondary"
              onClick={handleTestFetch}
              disabled={!strategyReady}
            >
              GET /ping (standalone fetch)
            </Button>
          </Section>

          {error && <ErrorText>{error}</ErrorText>}
          {success && <SuccessText>{success}</SuccessText>}
        </LeftColumn>

        <RightColumn>
          <Section style={{ marginBottom: 0 }}>
            <SectionTitle>Activity Log</SectionTitle>
            <LogArea ref={logAreaRef}>
              {logs.length === 0
                ? 'Checking IndexedDB for existing session...'
                : logs
                    .map((entry) => `[${entry.time}] ${entry.message}`)
                    .join('\n')}
            </LogArea>
          </Section>
        </RightColumn>
      </TwoColumnLayout>
    </PageContainer>
  );
};

export default WebCryptoAuth;
