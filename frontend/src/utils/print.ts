// Runs window.print() for a document, optionally scoped by a body class (see the
// `printing-*` rules in index.css). The class is removed again after the dialog closes.
export function printDocument(bodyClass?: string) {
  if (bodyClass) {
    document.body.classList.add(bodyClass);
    const cleanup = () => {
      document.body.classList.remove(bodyClass);
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
  }
  window.print();
}
