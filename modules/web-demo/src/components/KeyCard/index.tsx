import React, { useRef, useState } from 'react';
import { GlobalWorkerOptions } from 'pdfjs-dist';
import { extractKeycardEntriesFromPDF, KeycardEntry } from '@bitgo/key-card';
import {
  downloadKeycardForHotEthTSSWallet,
  downloadKeycardForHotLtcWallet,
  downloadKeycardForSelfManagedHotAdvancedPolygonWallet,
  downloadKeycardForSelfManagedColdEddsaKey,
  downloadKeycardForSelfManagedColdEddsaKeyWithDerivedKeys,
  downloadKeycardForDKLsTSS,
} from '@components/KeyCard/fixtures';

// Configure pdfjs worker for webpack (must be set before calling extractKeycardEntriesFromPDF)
GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

const KeyCard = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [entries, setEntries] = useState<KeycardEntry[] | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);
    setEntries(null);

    try {
      const result = await extractKeycardEntriesFromPDF(file);
      setEntries(result.entries);
      if (result.entries.length === 0) {
        setError('No keycard sections (A–D) found in this PDF.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
      // Reset so the same file can be re-uploaded
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <React.Fragment>
      <h3>Key Card</h3>
      <br />
      <button onClick={() => downloadKeycardForHotLtcWallet('Hot LTC Wallet')}>
        Download for Hot LTC Wallet (With Label)
      </button>
      <button onClick={() => downloadKeycardForHotLtcWallet('')}>
        Download for Hot LTC Wallet (Without Label)
      </button>
      <button onClick={downloadKeycardForDKLsTSS}>
        Download for Hot DKLS Wallet
      </button>
      <button onClick={downloadKeycardForHotEthTSSWallet}>
        Download for Hot ETH TSS Wallet
      </button>
      <button onClick={downloadKeycardForSelfManagedHotAdvancedPolygonWallet}>
        Download for Self Managed Hot Advanced Polygon Wallet
      </button>
      <button onClick={downloadKeycardForSelfManagedColdEddsaKey}>
        Download for Self Managed Cold Eddsa Key
      </button>
      <button
        onClick={downloadKeycardForSelfManagedColdEddsaKeyWithDerivedKeys}
      >
        Download for Self Managed Cold Eddsa Key with Derived Keys
      </button>

      <hr />
      <h3>Parse Keycard from PDF</h3>
      <p>
        Upload a BitGo keycard PDF to extract and inspect its sections (A–D).
      </p>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        onChange={handleFileChange}
        disabled={isLoading}
      />
      {isLoading && <p>Parsing PDF…</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      {entries && entries.length > 0 && (
        <table
          style={{
            marginTop: '1em',
            borderCollapse: 'collapse',
            width: '100%',
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  textAlign: 'left',
                  padding: '4px 8px',
                  borderBottom: '1px solid #ccc',
                }}
              >
                Section
              </th>
              <th
                style={{
                  textAlign: 'left',
                  padding: '4px 8px',
                  borderBottom: '1px solid #ccc',
                }}
              >
                Value
              </th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.label}>
                <td
                  style={{
                    padding: '4px 8px',
                    verticalAlign: 'top',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <strong>{entry.label}</strong>
                </td>
                <td
                  style={{
                    padding: '4px 8px',
                    fontFamily: 'monospace',
                    wordBreak: 'break-all',
                  }}
                >
                  {entry.value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </React.Fragment>
  );
};

export default KeyCard;
