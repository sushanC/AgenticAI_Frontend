import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MOCK_PDFS = [
  { id: 1, name: 'AI Research Paper.pdf', size: '2.4 MB', pages: 42, uploadedAt: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: 2, name: 'Machine Learning Handbook.pdf', size: '5.8 MB', pages: 180, uploadedAt: new Date(Date.now() - 86400000 * 5).toISOString() },
  { id: 3, name: 'Project Documentation.pdf', size: '0.9 MB', pages: 24, uploadedAt: new Date(Date.now() - 86400000).toISOString() },
];

function formatDate(iso) { return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }); }

export default function PDFPage() {
  const [pdfs, setPdfs] = useState(MOCK_PDFS);
  const [search, setSearch] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);

  const filtered = pdfs.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  const totalPages = pdfs.reduce((s, p) => s + (p.pages || 0), 0);

  function handleFiles(files) {
    const next = Array.from(files).filter(f => f.type === 'application/pdf').map(f => ({
      id: Date.now() + Math.random(), name: f.name,
      size: (f.size / 1024 / 1024).toFixed(1) + ' MB', pages: 0,
      uploadedAt: new Date().toISOString(),
    }));
    setPdfs(prev => [...next, ...prev]);
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title">PDFs</div>
        <div className="page-subtitle">{pdfs.length} documents · {totalPages} pages</div>
      </div>
      <div className="page-body">
        <div className="stats-row">
          <div className="stat-card"><div className="stat-value">{pdfs.length}</div><div className="stat-label">Documents</div></div>
          <div className="stat-card"><div className="stat-value">{totalPages}</div><div className="stat-label">Pages</div></div>
          <div className="stat-card"><div className="stat-value" style={{color:'var(--success)'}}>Indexed</div><div className="stat-label">Status</div></div>
        </div>

        <div className="upload-zone"
          style={{borderColor: dragOver ? 'var(--text-muted)' : undefined, background: dragOver ? 'rgba(255,255,255,0.03)' : undefined}}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
          onClick={() => fileRef.current?.click()}
        >
          <input ref={fileRef} type="file" accept=".pdf" multiple style={{display:'none'}} onChange={e => handleFiles(e.target.files)} />
          <div style={{fontSize:28,opacity:0.3}}>📄</div>
          <div style={{fontSize:14,color:'var(--text-secondary)'}}>Drop PDFs here or click to upload</div>
          <button className="upload-btn" onClick={e => e.stopPropagation()}>Browse Files</button>
        </div>

        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search PDFs..." />
          {search && <button onClick={() => setSearch('')} style={{background:'none',border:'none',color:'var(--text-muted)',cursor:'pointer'}}>✕</button>}
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📄</div>
            <div className="empty-title">No PDFs found</div>
            <div className="empty-desc">Upload PDFs to build your knowledge base</div>
          </div>
        ) : (
          <div className="pdf-grid">
            {filtered.map(pdf => (
              <motion.div key={pdf.id} className="pdf-card" layout initial={{opacity:0}} animate={{opacity:1}} transition={{duration:0.15}}>
                <div className="pdf-icon">📄</div>
                <div className="truncate" style={{fontWeight:500,fontSize:14,marginBottom:4}}>{pdf.name}</div>
                <div style={{display:'flex',gap:10,fontSize:12,color:'var(--text-muted)',marginBottom:12}}>
                  <span>{pdf.size}</span>{pdf.pages > 0 && <span>{pdf.pages} pg</span>}<span>{formatDate(pdf.uploadedAt)}</span>
                </div>
                <div style={{display:'flex',gap:6}}>
                  <button className="card-btn" style={{flex:1,textAlign:'center'}}>Search</button>
                  <button className="card-btn danger" onClick={() => setPdfs(p => p.filter(x => x.id !== pdf.id))}>Delete</button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
