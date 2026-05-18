import { useState, useRef } from 'react';
import { Upload, X, FileText, Image, File } from 'lucide-react';

const fileIcons = {
  pdf: FileText,
  doc: FileText,
  docx: FileText,
  txt: FileText,
  jpg: Image,
  jpeg: Image,
  png: Image,
  default: File,
};

export default function FileUploader({ onFileSelect, maxSize = 250, acceptTypes }) {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const maxBytes = maxSize * 1024 * 1024;

  const handleFile = (file) => {
    setError('');
    if (file.size > maxBytes) {
      setError(`File too large. Max size is ${maxSize}MB.`);
      return;
    }
    setSelectedFile(file);
    if (onFileSelect) onFileSelect(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleChange = (e) => {
    const file = e.target.files[0];
    if (file) handleFile(file);
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (inputRef.current) inputRef.current.value = '';
    if (onFileSelect) onFileSelect(null);
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const ext = selectedFile?.name?.split('.').pop().toLowerCase() || 'default';
  const FileIcon = fileIcons[ext] || fileIcons.default;

  return (
    <div>
      {!selectedFile ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          style={{
            ...styles.dropzone,
            borderColor: dragOver ? 'var(--accent-gold)' : 'var(--border-medium)',
            background: dragOver ? 'rgba(255, 215, 0, 0.05)' : 'var(--bg-glass)',
          }}
        >
          <Upload size={36} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
          <p style={{ fontWeight: 600, marginBottom: '6px' }}>
            Drag & drop your file here
          </p>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            or <span style={{ color: 'var(--accent-gold)', fontWeight: 600 }}>click to browse</span>
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '10px' }}>
            PDF, DOC, XLSX, PPTX, JPG, TXT — Max {maxSize}MB
          </p>
          <input
            ref={inputRef}
            type="file"
            onChange={handleChange}
            accept={acceptTypes || '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.txt'}
            style={{ display: 'none' }}
          />
        </div>
      ) : (
        <div style={styles.fileCard}>
          <div style={styles.fileInfo}>
            <FileIcon size={28} style={{ color: 'var(--accent-blue)' }} />
            <div>
              <p style={{ fontWeight: 600, fontSize: '0.9rem', margin: 0 }}>{selectedFile.name}</p>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                {formatSize(selectedFile.size)}
              </p>
            </div>
          </div>
          <button onClick={removeFile} style={styles.removeBtn}>
            <X size={18} />
          </button>
        </div>
      )}
      {error && (
        <p style={{ color: 'var(--accent-red)', fontSize: '0.82rem', marginTop: '8px' }}>
          {error}
        </p>
      )}
    </div>
  );
}

const styles = {
  dropzone: {
    border: '2px dashed var(--border-medium)',
    borderRadius: 'var(--radius-lg)',
    padding: '48px 24px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.25s',
    color: 'var(--text-secondary)',
  },
  fileCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px',
    background: 'rgba(99, 140, 255, 0.06)',
    border: '1px solid rgba(99, 140, 255, 0.2)',
    borderRadius: 'var(--radius-md)',
  },
  fileInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  removeBtn: {
    background: 'rgba(248, 113, 113, 0.1)',
    border: 'none',
    color: 'var(--accent-red)',
    borderRadius: '50%',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
};
