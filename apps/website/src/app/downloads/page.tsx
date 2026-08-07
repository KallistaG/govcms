import { Download, FileText } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export const revalidate = 60;

async function getDownloadableAssets() {
  try {
    const res = await fetch(`${API_URL}/media/assets`, { next: { revalidate: 60 } });
    if (res.ok) return await res.json();
  } catch {
    // fallback
  }
  return [
    {
      id: 'doc-1',
      filename: 'DICT-Annual-Report-2025.pdf',
      originalName: 'DICT Annual Accomplishment Report 2025',
      mimeType: 'application/pdf',
      size: 4850000,
      url: '/downloads/annual-report-2025.pdf',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'doc-2',
      filename: 'Cybersecurity-Advisory-2026-01.pdf',
      originalName: 'National CERT Threat Advisory 2026-01',
      mimeType: 'application/pdf',
      size: 1240000,
      url: '/downloads/threat-advisory-2026.pdf',
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    },
    {
      id: 'doc-3',
      filename: 'Freedom-of-Information-Manual-2026.pdf',
      originalName: 'Agency FOI Official Manual & Request Form',
      mimeType: 'application/pdf',
      size: 2150000,
      url: '/downloads/foi-manual.pdf',
      createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
    },
  ];
}

export default async function PublicDownloadsPage() {
  const docs = await getDownloadableAssets();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="border-b pb-6 space-y-2">
        <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-2">
          <Download className="h-7 w-7 text-primary" /> Freedom of Information & Public Downloads
        </h1>
        <p className="text-xs text-muted-foreground">
          Official public documents, annual accomplishment reports, cybersecurity advisories, and FOI manuals.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {docs.map((doc: any) => (
          <div
            key={doc.id}
            className="rounded-2xl border bg-card p-6 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20">
                <FileText className="h-6 w-6" />
              </div>
              <div className="space-y-1 min-w-0">
                <h2 className="font-bold text-sm text-foreground truncate" title={doc.originalName || doc.filename}>
                  {doc.originalName || doc.filename}
                </h2>
                <p className="text-[11px] font-mono text-muted-foreground">
                  {(doc.size / (1024 * 1024)).toFixed(2)} MB • {doc.mimeType || 'PDF Document'}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t flex items-center justify-between text-xs">
              <span className="font-mono text-[10px] text-muted-foreground">
                Uploaded {new Date(doc.createdAt).toLocaleDateString()}
              </span>
              <a
                href={doc.url}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition-colors flex items-center gap-1 shadow-2xs"
              >
                <Download className="h-3.5 w-3.5" /> Download PDF
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
