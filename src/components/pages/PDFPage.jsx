import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from "react";
import axios from "axios";


function formatDate(iso) { return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }); }

export default function PDFPage() {

  const [uploading, setUploading] =
  useState(false);

  const [selectedPDF, setSelectedPDF] =
  useState(null);

const [question, setQuestion] =
  useState("");

const [answer, setAnswer] =
  useState("");

const [loadingAnswer, setLoadingAnswer] =
  useState(false);
  const [pdfs, setPdfs] =
  useState([]);
  const [search, setSearch] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);

  const filtered = pdfs.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  const totalPages = pdfs.reduce((s, p) => s + (p.pages || 0), 0);

  async function handleFiles(files) {

  setUploading(true);

  try {

    for (const file of files) {

      const formData =
        new FormData();

      formData.append(
        "pdf",
        file
      );

      await axios.post(
        "http://localhost:3001/pdf/upload",
        formData
      );
    }

    await loadPDFs();

  } catch (err) {

    console.error(
      "Upload failed:",
      err
    );

  } finally {

    setUploading(false);
  }
}
async function askPDFQuestion() {

  if (
    !selectedPDF ||
    !question.trim()
  ) return;

  setLoadingAnswer(
    true
  );

  try {

    const response =
      await axios.post(
        "http://localhost:3001/pdf/ask",
        {
          pdfName:
            selectedPDF,
          question
        }
      );

    setAnswer(
      response.data.answer
    );

  } catch (err) {

    console.error(err);

    setAnswer(
      "Failed to get answer."
    );

  } finally {

    setLoadingAnswer(
      false
    );
  }
}
  useEffect(() => {

  loadPDFs();

}, []);

async function loadPDFs() {

  try {

    const response =
      await axios.get(
        "http://localhost:3001/pdf/list"
      );

    const formatted =
      response.data.map(
        (
          name,
          index
        ) => ({
          id: index,
          name,
          size: "",
          pages: 0,
          uploadedAt:
            new Date().toISOString()
        })
      );

    setPdfs(
      formatted
    );

  } catch (err) {

    console.error(
      "Failed to load PDFs",
      err
    );
  }
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
          <div
  style={{
    fontSize:14
  }}
>
  {
    uploading
      ? "Uploading PDF..."
      : "Drop PDFs here or click to upload"
  }
</div>
<button
  className="upload-btn"
  onClick={(e) => {

    e.stopPropagation();

    fileRef.current?.click();
  }}
>
  Browse Files
</button>
        </div>

        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search PDFs..." />
          {search && <button onClick={() => setSearch('')} style={{background:'none',border:'none',color:'var(--text-muted)',cursor:'pointer'}}>✕</button>}
        </div>

        {selectedPDF && (

  <div
    className="content-card"
    style={{
      marginBottom: 20
    }}
  >

<h3
  style={{
    marginBottom: 12
  }}
>
  📄 {selectedPDF}
</h3>

    <textarea
      value={question}
      onChange={e =>
        setQuestion(
          e.target.value
        )
      }
      placeholder="Ask something about this PDF..."
      rows={3}
      style={{
        width: "100%",
        marginTop: 10
      }}
    />

    <button
      className="add-btn"
      onClick={
        askPDFQuestion
      }
      disabled={
        loadingAnswer
      }
      style={{
        marginTop: 10
      }}
    >
      {
        loadingAnswer
          ? "Thinking..."
          : "Ask"
      }
    </button>

    {answer && (

      <div
        style={{
          marginTop: 20,
          whiteSpace:
            "pre-wrap"
        }}
      >
        <strong>
          Answer:
        </strong>

        <br />

        {answer}
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
              <motion.div key={pdf.id} className="pdf-card" layout initial={{opacity:0}} animate={{opacity:1}} transition={{duration:0.15}}>
                <div className="pdf-icon">📄</div>
                <div className="truncate" style={{fontWeight:500,fontSize:14,marginBottom:4}}>{pdf.name}</div>
                <div style={{display:'flex',gap:10,fontSize:12,color:'var(--text-muted)',marginBottom:12}}>
                  <span>{pdf.size}</span>{pdf.pages > 0 && <span>{pdf.pages} pg</span>}<span>{formatDate(pdf.uploadedAt)}</span>
                </div>
                <div style={{display:'flex',gap:6}}>
<button
  className="card-btn"
  style={{
    flex:1,
    textAlign:"center"
  }}
onClick={() => {
  setSelectedPDF(pdf.name);
  setQuestion("");
  setAnswer("");
}}
>
  Ask PDF
</button>                  <button className="card-btn danger" onClick={async () => {

  try {

    await axios.delete(
      `http://localhost:3001/pdf/${encodeURIComponent(pdf.name)}`
    );

    await loadPDFs();

  } catch (err) {

    console.error(err);
  }
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
