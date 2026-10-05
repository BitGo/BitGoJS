import 'should';
import { validateSiwsMessage } from '../../../../src';

describe('SIWS message validation', () => {
  const SIWS_ADDRESS = '8knfAmJm9BmaX9mZWjAdHBcYPYp3LmuykRQnGwkWQCyj';
  const siwsHeader = (domain: string): string => `${domain} wants you to sign in with your Solana account:`;

  const buildSiws = (overrides: Record<string, unknown> = {}): string => {
    const domain = (overrides.domain as string) ?? 'hastra.io';
    const lines = [
      `${domain} wants you to sign in with your Solana account:`,
      (overrides.address as string) ?? SIWS_ADDRESS,
      '',
    ];
    if (overrides.statement !== undefined && overrides.statement !== null) {
      lines.push(overrides.statement as string, '');
    }
    const fields = [
      `URI: https://${domain}`,
      `Version: ${overrides.version ?? '1'}`,
      `Chain ID: ${overrides.chainId ?? 'mainnet'}`,
      `Nonce: ${overrides.nonce ?? '31a6bab5'}`,
      `Issued At: ${overrides.issuedAt ?? '2026-09-21T10:00:00Z'}`,
    ];
    if (overrides.expirationTime) {
      fields.push(`Expiration Time: ${overrides.expirationTime}`);
    }
    if (overrides.notBefore) {
      fields.push(`Not Before: ${overrides.notBefore}`);
    }
    if (overrides.requestId) {
      fields.push(`Request ID: ${overrides.requestId}`);
    }
    if (overrides.resources) {
      fields.push('Resources:', ...(overrides.resources as string[]).map((r) => `- ${r}`));
    }
    if (overrides.omit) {
      const omit = overrides.omit as string[];
      for (const o of omit) {
        const i = fields.findIndex((f) => f.startsWith(o));
        if (i >= 0) {
          fields.splice(i, 1);
        }
      }
    }
    lines.push(...fields, ...((overrides.extraLines as string[]) ?? []));
    return lines.join('\n') + (overrides.trailingNewlines ? '\n' : '');
  };

  describe('valid messages', () => {
    it('accepts a SIWS message with statement and resources', () => {
      (() =>
        validateSiwsMessage(
          buildSiws({ statement: `You are proving you own ${SIWS_ADDRESS}.`, resources: ['https://privy.io'] })
        )).should.not.throw();
    });

    it('accepts a SIWS message without statement', () => {
      (() => validateSiwsMessage(buildSiws({ domain: 'example.com' }))).should.not.throw();
    });

    it('accepts a SIWS message with all optional fields', () => {
      (() =>
        validateSiwsMessage(
          buildSiws({
            domain: 'example.com',
            statement: 'I am the wallet owner.',
            expirationTime: '2026-09-28T10:00:00Z',
            notBefore: '2026-09-21T09:00:00Z',
            requestId: '31a6bab5-1',
            resources: ['https://a.example.com', 'https://b.example.com'],
          })
        )).should.not.throw();
    });

    it('accepts a multibyte utf-8 statement, solana: chain id and fractional seconds', () => {
      (() =>
        validateSiwsMessage(
          buildSiws({
            domain: 'example.com',
            statement: 'こんにちは、Тестовое сообщение',
            chainId: 'solana:mainnet',
            issuedAt: '2026-09-21T10:00:00.500Z',
          })
        )).should.not.throw();
    });

    it('accepts trailing newlines and a +05:30 offset', () => {
      (() =>
        validateSiwsMessage(
          buildSiws({
            domain: 'example.com',
            chainId: 'testnet',
            issuedAt: '2026-09-21T10:00:00+05:30',
            trailingNewlines: true,
          })
        )).should.not.throw();
    });

    it('accepts the minimal template (header and address only)', () => {
      (() => validateSiwsMessage([siwsHeader('example.com'), SIWS_ADDRESS].join('\n'))).should.not.throw();
      (() => validateSiwsMessage([siwsHeader('example.com'), SIWS_ADDRESS].join('\n') + '\n')).should.not.throw();
    });

    it('accepts a statement with no fields', () => {
      (() =>
        validateSiwsMessage(
          [siwsHeader('example.com'), SIWS_ADDRESS, '', 'I am the wallet owner.'].join('\n')
        )).should.not.throw();
    });

    it('accepts a statement with a lone Nonce field (partner shape)', () => {
      (() =>
        validateSiwsMessage(
          [
            siwsHeader('app.decibel.trade'),
            SIWS_ADDRESS,
            '',
            'Please confirm you explicitly initiated this request from app.decibel.trade.',
            '',
            'Nonce: 0x50ead22afd6ffd976',
          ].join('\n')
        )).should.not.throw();
    });

    it('accepts any subset of advanced fields in canonical order', () => {
      (() => validateSiwsMessage(buildSiws({ omit: ['Version:'] }))).should.not.throw();
      (() => validateSiwsMessage(buildSiws({ omit: ['Chain ID:'] }))).should.not.throw();
      (() => validateSiwsMessage(buildSiws({ omit: ['Nonce:'] }))).should.not.throw();
      (() => validateSiwsMessage(buildSiws({ omit: ['Issued At:'] }))).should.not.throw();
      (() =>
        validateSiwsMessage(buildSiws({ omit: ['URI:', 'Version:', 'Chain ID:', 'Issued At:'] }))).should.not.throw();
    });
  });

  describe('rejections', () => {
    const rejects = (message: string) => (() => validateSiwsMessage(message)).should.throw(/not a valid SIWS message/);

    it('rejects an empty message', () => {
      rejects('');
    });

    it('rejects plain text', () => {
      rejects('Hello from dapp');
    });

    it('rejects JSON', () => {
      rejects('{"action":"login"}');
    });

    it('rejects a wrong skeleton', () => {
      rejects(
        'example.com login:\n' +
          SIWS_ADDRESS +
          '\n\nVersion: 1\nChain ID: mainnet\nNonce: 31a6bab5\nIssued At: 2026-09-21T10:00:00Z'
      );
    });

    it('rejects invalid field values', () => {
      rejects(buildSiws({ version: '2' }));
      rejects(buildSiws({ chainId: 'polygon' }));
      rejects(buildSiws({ nonce: 'abc' }));
      rejects(buildSiws({ nonce: '31a6 bab5!' }));
      rejects(buildSiws({ issuedAt: '2026-09-21 10:00:00Z' }));
      rejects(buildSiws({ issuedAt: '2026-09-21T10:00:61Z' }));
      rejects(buildSiws({ issuedAt: '2026-09-21T24:00:00Z' }));
      rejects(buildSiws({ issuedAt: '2026-09-21T10:00:00+24:00' }));
    });

    it('rejects out-of-order fields', () => {
      const message = [
        'hastra.io wants you to sign in with your Solana account:',
        SIWS_ADDRESS,
        '',
        'Nonce: 31a6bab5',
        'Version: 1',
        'Chain ID: mainnet',
        'Issued At: 2026-09-21T10:00:00Z',
      ].join('\n');
      rejects(message);
    });

    it('rejects a stray line after the fields section', () => {
      rejects(buildSiws({ extraLines: ['stray line'] }));
    });

    it('rejects an unknown field label after the fields section starts', () => {
      rejects(buildSiws({ extraLines: ['Unknown Field: value'] }));
      rejects(buildSiws({ extraLines: ['Version2: 1'] }));
      rejects(
        [
          'hastra.io wants you to sign in with your Solana account:',
          SIWS_ADDRESS,
          '',
          'Version: 1',
          'Unknown: x',
          'Chain ID: mainnet',
        ].join('\n')
      );
    });

    it('rejects an unknown field label after the blank line that opens the fields section', () => {
      rejects(
        [
          'hastra.io wants you to sign in with your Solana account:',
          SIWS_ADDRESS,
          '',
          'I am the wallet owner.',
          '',
          'Unknown: x',
        ].join('\n')
      );
    });

    it('rejects a field label that appears twice', () => {
      rejects(
        [
          'hastra.io wants you to sign in with your Solana account:',
          SIWS_ADDRESS,
          '',
          'Nonce: 31a6bab5',
          'Nonce: 31a6bab5',
        ].join('\n')
      );
    });

    it('rejects an invalid address line', () => {
      rejects(buildSiws({ address: 'short' }));
      rejects(buildSiws({ address: '0OIl-invalid-base58-characters-000000000000000000' }));
    });

    it('rejects a valued Resources line', () => {
      rejects(buildSiws({ resources: [] }).replace('Resources:', 'Resources: https://x.example.com'));
    });

    it('rejects a blank line inside the fields section', () => {
      const message = [
        'hastra.io wants you to sign in with your Solana account:',
        SIWS_ADDRESS,
        '',
        'Version: 1',
        '',
        'Chain ID: mainnet',
        'Nonce: 31a6bab5',
        'Issued At: 2026-09-21T10:00:00Z',
      ].join('\n');
      rejects(message);
    });
  });

  describe('utf-8 strictness', () => {
    it('rejects lone surrogates that Buffer.from would mangle to U+FFFD', () => {
      (() => validateSiwsMessage(buildSiws({ statement: 'bad \uD800 statement' }))).should.throw(
        /message is not valid UTF-8/
      );
    });
  });
});
