import { useEffect, useRef, useState } from 'react';
import './css/PdfView.css';

// base64 (no data: prefix) → Uint8Array for pdf.js. pdf.js may transfer the
// buffer, so we hand it a fresh array each render.
function base64ToBytes(b64) {
  const bin = atob(b64);
  const len = bin.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i += 1) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

// Renders an actual PDF (the user's original upload) as crisp page canvases,
// stacked and scaled to the container width — so the preview IS their résumé,
// not the extracted text re-rendered in a template. Uses the same lazily-loaded
// pdf.js as the text-extraction fallback in resumeFile.js.
export default function PdfView({ dataUri }) {
  const pagesRef = useRef(null);
  const [status, setStatus] = useState('loading'); // loading · ready · error

  useEffect(() => {
    const host = pagesRef.current;
    if (!host || !dataUri) return undefined;
    let cancelled = false;
    setStatus('loading');
    host.replaceChildren();

    (async () => {
      try {
        const pdfjs = await import('pdfjs-dist');
        const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
        pdfjs.GlobalWorkerOptions.workerSrc = worker.default;

        const comma = dataUri.indexOf(',');
        const b64 = comma >= 0 ? dataUri.slice(comma + 1) : dataUri;
        const doc = await pdfjs.getDocument({ data: base64ToBytes(b64) }).promise;
        if (cancelled) return;

        const cssWidth = host.clientWidth || 600;
        const dpr = Math.min(window.devicePixelRatio || 1, 2); // cap to keep canvases reasonable
        for (let i = 1; i <= doc.numPages; i += 1) {
          const page = await doc.getPage(i);
          if (cancelled) return;
          const base = page.getViewport({ scale: 1 });
          const viewport = page.getViewport({ scale: (cssWidth / base.width) * dpr });
          const canvas = document.createElement('canvas');
          canvas.className = 'pdfv-page';
          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);
          const ctx = canvas.getContext('2d');
          host.appendChild(canvas);
          await page.render({ canvasContext: ctx, viewport }).promise;
          if (cancelled) return;
        }
        setStatus('ready');
      } catch {
        if (!cancelled) setStatus('error');
      }
    })();

    return () => { cancelled = true; };
  }, [dataUri]);

  return (
    <div className="pdfv">
      <div className="pdfv-pages" ref={pagesRef} />
      {status === 'loading' && <div className="pdfv-msg">Loading your résumé…</div>}
      {status === 'error' && <div className="pdfv-msg">Couldn’t display this PDF.</div>}
    </div>
  );
}
