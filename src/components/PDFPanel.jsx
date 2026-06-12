import {
  useState,
  useEffect
} from "react";

import axios from "axios";

export default function PDFPanel() {

  const [file, setFile] =
    useState(null);

  const [pdfs, setPdfs] =
    useState([]);

  const [question,
    setQuestion] =
    useState("");

  const [answer,
    setAnswer] =
    useState("");

  const [selected,
    setSelected] =
    useState("");

  async function loadPDFs() {

    const response =
      await axios.get(
        "http://localhost:3001/pdf/list"
      );

    setPdfs(
      response.data
    );
  }

  async function uploadPDF() {

    const form =
      new FormData();

    form.append(
      "pdf",
      file
    );

    await axios.post(
      "http://localhost:3001/pdf/upload",
      form
    );

    loadPDFs();
  }

  async function askPDF() {

    const response =
      await axios.post(
        "http://localhost:3001/pdf/ask",
        {
          pdfName:
            selected,

          question
        }
      );

    setAnswer(
      response.data.answer
    );
  }

  useEffect(() => {

    loadPDFs();

  }, []);

  return (

    <div>

      <h2>
        PDFs
      </h2>

      <input
        type="file"

        onChange={e =>
          setFile(
            e.target.files[0]
          )
        }
      />

      <button
        onClick={uploadPDF}
      >
        Upload
      </button>

      <hr />

      <select
        value={selected}

        onChange={e =>
          setSelected(
            e.target.value
          )
        }
      >

        <option value="">
          Select PDF
        </option>

        {pdfs.map(pdf => (

          <option
            key={pdf}
            value={pdf}
          >
            {pdf}
          </option>

        ))}

      </select>

      <br /><br />

      <input
        value={question}

        onChange={e =>
          setQuestion(
            e.target.value
          )
        }

        placeholder=
          "Ask PDF..."
      />

      <button
        onClick={askPDF}
      >
        Ask
      </button>

      <hr />

      <p>
        {answer}
      </p>

    </div>
  );
}