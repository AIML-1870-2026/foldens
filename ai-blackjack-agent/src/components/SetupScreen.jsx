import { useEffect, useRef, useState } from 'react';

export default function SetupScreen({ onKeyLoaded }) {
  const inputRef = useRef(null);
  const [pastedKey, setPastedKey] = useState('');
  const [pasteError, setPasteError] = useState('');

  useEffect(() => {
    // Auto-load from Vite env
    const envKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (envKey && envKey.startsWith('sk-')) {
      console.log(`[Setup] API key loaded from .env (length: ${envKey.length})`);
      onKeyLoaded(envKey);
    }
  }, [onKeyLoaded]);

  function handlePaste() {
    const key = pastedKey.trim();
    if (!key.startsWith('sk-')) {
      setPasteError('Key must start with sk-');
      return;
    }
    console.log(`[Setup] API key loaded via paste (length: ${key.length})`);
    onKeyLoaded(key);
  }

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      for (const line of text.split('\n')) {
        const m = line.match(/^(?:VITE_)?OPENAI_API_KEY\s*=\s*(.+)/);
        if (m) {
          const key = m[1].trim().replace(/^["']|["']$/g, '');
          if (key.startsWith('sk-')) {
            console.log(`[Setup] API key loaded from file (length: ${key.length})`);
            onKeyLoaded(key);
            return;
          }
        }
      }
      alert('Could not find a valid OPENAI_API_KEY in that file.');
    };
    reader.readAsText(file);
  }

  return (
    <div className="setup-screen">
      <div className="setup-card">
        <h1 className="setup-title">AI Blackjack Agent</h1>
        <p className="setup-subtitle">Powered by GPT-4o mini</p>
        <div className="setup-divider" />
        <p className="setup-instructions">
          Upload your <code>.env</code> file containing your OpenAI API key to begin.
          Your key is used only for this session and never stored.
        </p>
        {/* Paste input */}
        <div className="setup-paste-row">
          <input
            type="password"
            className="setup-key-input"
            placeholder="Paste API key — sk-..."
            value={pastedKey}
            onChange={e => { setPastedKey(e.target.value); setPasteError(''); }}
            onKeyDown={e => e.key === 'Enter' && handlePaste()}
          />
          <button
            className="btn btn--deal"
            disabled={!pastedKey.trim()}
            onClick={handlePaste}
          >
            Use Key
          </button>
        </div>
        {pasteError && <p className="setup-error">{pasteError}</p>}

        <div className="setup-or">— or —</div>

        <label className="upload-btn" onClick={() => inputRef.current?.click()}>
          Upload .env File
        </label>
        <input
          ref={inputRef}
          type="file"
          accept=".env,text/plain"
          style={{ display: 'none' }}
          onChange={handleFile}
        />
        <p className="setup-hint">
          Expected format: <code>OPENAI_API_KEY=sk-...</code>
        </p>
      </div>
    </div>
  );
}
