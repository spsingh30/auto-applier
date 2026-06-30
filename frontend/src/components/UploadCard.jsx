import { useRef, useState } from 'react';
import { uploadResume } from '../api/client';

// Resume upload — drag-drop or click. Once uploaded, it notifies the parent via onUploaded().
export default function UploadCard({ onUploaded }) {
  const inputRef = useRef(null);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  async function handleFile(file) {
    if (!file) return;
    setBusy(true);
    setMsg(null);
    try {
      const { parsedBy } = await uploadResume(file);
      setMsg({ ok: true, text: `Resume parsed (${parsedBy === 'llm' ? 'AI' : 'basic'} mode).` });
      onUploaded();
    } catch (e) {
      setMsg({ ok: false, text: e.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <h2>1 · Resume upload</h2>
      {msg && <div className={`toast ${msg.ok ? 'ok' : 'err'}`}>{msg.text}</div>}
      <div
        className={`dropzone ${drag ? 'drag' : ''}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          handleFile(e.dataTransfer.files[0]);
        }}
      >
        <p><strong>{busy ? 'Parsing…' : 'Drop your resume here or click to browse'}</strong></p>
        <span>PDF, DOCX or TXT · max 5 MB</span>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,.txt"
          hidden
          onChange={(e) => handleFile(e.target.files[0])}
        />
      </div>
    </div>
  );
}
