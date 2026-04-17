import React, { useState } from 'react';
import { extractKeycardEntriesFromPDF, KeycardEntry } from '@bitgo/key-card';

const ParseKeycard: React.FC = () => {
  const [entries, setEntries] = useState<KeycardEntry[]>([]);
  const [lines, setLines] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setEntries([]);
    setLines([]);

    try {
      const result = await extractKeycardEntriesFromPDF(file);
      setEntries(result.entries);
      setLines(result.lines);
    } catch (err) {
      console.log('Error parsing PDF:', err);
      setError(err instanceof Error ? err.message : 'Failed to parse PDF');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '16px' }}>
      <h3>Parse Keycard PDF</h3>
      <p style={{ color: '#555', marginBottom: '12px' }}>
        Upload a BitGo KeyCard PDF to extract and display its structured
        sections.
      </p>
      <input type="file" accept=".pdf" onChange={handleFile} />
      {loading && <p style={{ marginTop: '12px' }}>Parsing PDF...</p>}
      {error && (
        <p style={{ color: 'red', marginTop: '12px' }}>
          <strong>Error:</strong> {error}
        </p>
      )}
      {entries.length > 0 && (
        <table
          style={{
            marginTop: '16px',
            borderCollapse: 'collapse',
            width: '100%',
            border: '1px solid #ccc',
          }}
        >
          <thead>
            <tr style={{ backgroundColor: '#f0f0f0' }}>
              <th style={{ textAlign: 'left', whiteSpace: 'nowrap' }}>Label</th>
              <th style={{ textAlign: 'left' }}>Value</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, i) => (
              <tr key={i}>
                <td style={{ whiteSpace: 'nowrap', verticalAlign: 'top' }}>
                  {entry.label}
                </td>
                <td
                  style={{
                    fontFamily: 'monospace',
                    wordBreak: 'break-all',
                    fontSize: '13px',
                  }}
                >
                  {entry.value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {entries.length === 0 && !loading && !error && lines.length > 0 && (
        <p style={{ color: '#888', marginTop: '12px' }}>
          No keycard sections (A/B/C/D) found in the PDF.
        </p>
      )}
      {lines.length > 0 && (
        <details style={{ marginTop: '16px' }}>
          <summary style={{ cursor: 'pointer' }}>
            Raw lines ({lines.length}) — for debugging
          </summary>
          <pre
            style={{
              fontSize: '11px',
              maxHeight: '300px',
              overflow: 'auto',
              backgroundColor: '#f8f8f8',
              padding: '8px',
              border: '1px solid #ddd',
              marginTop: '8px',
            }}
          >
            {lines.join('\n')}
          </pre>
        </details>
      )}
    </div>
  );
};

export default ParseKeycard;
