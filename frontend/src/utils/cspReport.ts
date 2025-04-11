// CSP raporlarını işleme fonksiyonu
export const handleCSPReport = (report: any) => {
  console.warn('CSP İhlali Raporu:', {
    'violated-directive': report['violated-directive'],
    'blocked-uri': report['blocked-uri'],
    'original-policy': report['original-policy'],
    'document-uri': report['document-uri'],
    'line-number': report['line-number'],
    'column-number': report['column-number'],
    'source-file': report['source-file']
  });
};

// CSP raporlarını dinleme
if (typeof window !== 'undefined') {
  window.addEventListener('securitypolicyviolation', (e) => {
    handleCSPReport({
      'violated-directive': e.violatedDirective,
      'blocked-uri': e.blockedURI,
      'original-policy': e.originalPolicy,
      'document-uri': e.documentURI,
      'line-number': e.lineNumber,
      'column-number': e.columnNumber,
      'source-file': e.sourceFile
    });
  });
} 