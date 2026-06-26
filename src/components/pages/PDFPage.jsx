import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

function formatDate(iso) { return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }); }

export default function PDFPage() {
  const [uploading, setUploading] = useState(false);
  const [selectedPDF, setSelectedPDF] = useState(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loadingAnswer, setLoadingAnswer] = useState(false);
  const [pdfs, setPdfs] = useState([]);
  const [search, setSearch] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);

  const filtered = pdfs.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  const totalPages = pdfs.reduce((s, p) => s + (p.pages || 0), 0);

  useEffect(() => { loadPDFs(); }, []);

  async function loadPDFs() {
    try {
      const response = await axios.get('http://localhost:3001/pdf/list');
      const formatted = response.data.map((name, index) => ({
        id: index, name, size: '', pages: 0, uploadedAt: new Date().toISOString()
      }));
      setPdfs(formatted);
    } catch (err) { console.error('Failed to load PDFs', err); }
  }

  async function handleFiles(files) {
    setUploading(true);
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('pdf', file);
        await axios.post('http://localhost:3001/pdf/upload', formData);
      }
      await loadPDFs();
    } catch (err) { console.error('Upload failed:', err); }
    finally { setUploading(false); }
  }

  async function askPDFQuestion() {
    if (!selectedPDF || !question.trim()) return;
    setLoadingAnswer(true);
    try {
      const response = await axios.post('http://localhost:3001/pdf/ask', { pdfName: selectedPDF, question });
      setAnswer(response.data.answer);
    } catch (err) { console.error(err); setAnswer('Failed to get answer.'); }
    finally { setLoadingAnswer(false); }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title">PDFs</div>
        <div className="page-subtitle">{pdfs.length} documents</div>
      </div>
      <div className="page-body">
        <div className="stats-row">
          <div className="stat-card"><div className="stat-value">{pdfs.length}</div><div className="stat-label">Documents</div></div>
          <div className="stat-card"><div className="stat-value" style={{color:'var(--success)'}}>Indexed</div><div className="stat-label">Status</div></div>
        </div>

        <div className="upload-zone"
          style={{borderColor: dragOver ? 'var(--accent)' : undefined, background: dragOver ? 'rgba(59,130,246,0.05)' : undefined}}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
          onClick={() => fileRef.current?.click()}
        >
          <input ref={fileRef} type="file" accept=".pdf" multiple style={{display:'none'}} onChange={e => handleFiles(e.target.files)} />
          <div style={{fontSize:28,opacity:0.3}}>📄</div>
          <div style={{fontSize:14,color:'var(--text-muted)'}}>{uploading ? 'Uploading PDF...' : 'Drop PDFs here or click to upload'}</div>
          <button className="upload-btn" onClick={e => { e.stopPropagation(); fileRef.current?.click(); }}>Browse Files</button>
        </div>

        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search PDFs..." />
          {search && <button onClick={() => setSearch('')} style={{background:'none',border:'none',color:'var(--text-muted)',cursor:'pointer'}}>✕</button>}
        </div>

        {selectedPDF && (
          <div className="content-card" style={{marginBottom:20, borderColor: 'var(--accent)', borderWidth: 1}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
              <h3 style={{margin:0,fontSize:15}}>📄 {selectedPDF}</h3>
              <button className="card-btn" onClick={() => { setSelectedPDF(null); setAnswer(''); setQuestion(''); }}>✕ Close</button>
            </div>
            <div className="add-bar" style={{marginBottom:10}}>
              <input
                value={question}
                onChange={e => setQuestion(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && askPDFQuestion()}
                placeholder="Ask something about this PDF..."
              />
              <button className="add-btn" onClick={askPDFQuestion} disabled={loadingAnswer || !question.trim()}>
                {loadingAnswer ? 'Thinking...' : 'Ask'}
              </button>
            </div>
            {answer && (
              <div className="markdown-content" style={{marginTop:12,padding:16,background:'var(--bg-primary)',borderRadius:'var(--radius-md)',border:'1px solid var(--border-light)'}}>
                <ReactMarkdown>{answer}</ReactMarkdown>
              </div>
            )}
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📄</div>
            <div className="empty-title">No PDFs found</div>
            <div className="empty-desc">Upload PDFs to build your knowledge base</div>
          </div>
        ) : (
          <div className="pdf-grid">
            {filtered.map(pdf => (
              <motion.div key={pdf.id} className={`pdf-card ${selectedPDF === pdf.name ? 'selected' : ''}`}
                layout initial={{opacity:0}} animate={{opacity:1}} transition={{duration:0.15}}
                style={selectedPDF === pdf.name ? {borderColor:'var(--accent)'} : {}}
              >
                <div className="pdf-icon">📄</div>
                <div className="truncate" style={{fontWeight:500,fontSize:14,marginBottom:4}}>{pdf.name}</div>
                <div style={{display:'flex',gap:10,fontSize:12,color:'var(--text-muted)',marginBottom:12}}>
                  <span>{formatDate(pdf.uploadedAt)}</span>
                </div>
                <div style={{display:'flex',gap:6}}>
                  <button className="card-btn" style={{flex:1,textAlign:'center'}}
                    onClick={() => { setSelectedPDF(pdf.name); setQuestion(''); setAnswer(''); }}
                  >
                    {selectedPDF === pdf.name ? '● Selected' : 'Ask PDF'}
                  </button>
                  <button className="card-btn danger" onClick={async () => {
                    try {
                      await axios.delete(`http://localhost:3001/pdf/${encodeURIComponent(pdf.name)}`);
                      if (selectedPDF === pdf.name) { setSelectedPDF(null); setAnswer(''); }
                      await loadPDFs();
                    } catch (err) { console.error(err); }
                  }}>Delete</button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
