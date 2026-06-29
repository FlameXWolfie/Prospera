import { useEffect, useState } from 'react';
import PdfView from '../resume/PdfView';
import ResumeDocument from './ResumeDocument';
import { getResumeFile } from '../../lib/resume/resumesApi';
import { getCachedPdfDataUri, cachePdfDataUri } from '../../lib/resume/pdfCache';

// Smart preview: shows the user's ORIGINAL uploaded PDF when one is on file, and
// falls back to the template render (ResumeDocument) for built resumes or non-PDF
// uploads. The PDF comes from the in-memory cache (instant right after upload) or
// is lazily fetched via GET /resumes/:id/file. `matchedSet` highlighting only
// applies to the template render — a rendered PDF is the user's file verbatim.
export default function ResumePreview({ resume, matchedSet }) {
  const id = resume?.id;
  const isPdf = (resume?.fileType || '').includes('pdf');
  const cached = getCachedPdfDataUri(id);
  const wantsPdf = Boolean(resume?.hasFile && isPdf) || Boolean(cached);
  // Only the async fetch lives in state; the cache hit is derived in render so we
  // never setState synchronously inside the effect.
  const [fetched, setFetched] = useState(null);

  useEffect(() => {
    if (cached || !(resume?.hasFile && isPdf)) return undefined;
    let live = true;
    getResumeFile(id)
      .then((f) => {
        if (!live) return;
        const uri = `data:${f.fileType || 'application/pdf'};base64,${f.fileData}`;
        cachePdfDataUri(id, uri);
        setFetched({ id, uri });
      })
      .catch(() => {});
    return () => { live = false; };
  }, [id, isPdf, resume?.hasFile, cached]);

  const dataUri = cached || (fetched && fetched.id === id ? fetched.uri : null);

  if (wantsPdf) {
    if (dataUri) return <PdfView dataUri={dataUri} />;
    return <div className="pdfv-msg" style={{ padding: 24 }}>Loading your resume…</div>;
  }
  return <ResumeDocument resume={resume} matchedSet={matchedSet} />;
}
