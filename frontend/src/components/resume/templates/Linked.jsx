// Renders an <a href> when `href` is set, else plain text — keeping the same
// className so the link looks identical to the surrounding text. Used for résumé
// contact/project links so they're clickable in the live preview AND the exported
// PDF (the PDF is the rendered template, so an <a> becomes a real PDF link).
export default function Linked({ href, className, children }) {
  if (!href) {
    return className ? <span className={className}>{children}</span> : <>{children}</>;
  }
  return (
    <a className={className} href={href} target="_blank" rel="noreferrer">{children}</a>
  );
}
