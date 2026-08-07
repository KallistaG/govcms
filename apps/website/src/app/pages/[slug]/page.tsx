import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export const revalidate = 60;

async function getPageBlocks(slug: string) {
  try {
    const res = await fetch(`${API_URL}/page-builder/pages/public/${slug}`, { next: { revalidate: 60 } });
    if (res.ok) return await res.json();
  } catch {
    // fallback
  }

  if (slug === 'about-agency' || slug === 'mandate') {
    return {
      title: 'Mandate, Vision, and Mission',
      slug,
      blocks: [
        { id: 'b1', type: 'hero', config: { headline: 'Mandate & Agency Vision', subtext: 'Department of Information and Communications Technology' } },
        { id: 'b2', type: 'heading', config: { level: 2, text: 'Official Agency Mandate' } },
        { id: 'b3', type: 'paragraph', config: { text: 'The Department of Information and Communications Technology (DICT) is the primary policy, planning, coordinating, implementing, and administrative entity of the Executive Branch of the government that plans, develops, and promotes the national ICT development agenda.' } },
        { id: 'b4', type: 'quote', config: { text: 'An innovative, safe and thriving digital nation.', author: 'DICT Vision Statement' } },
        { id: 'b5', type: 'button', config: { label: 'View Executive Officials', url: '/pages/officials', variant: 'primary' } },
      ],
    };
  }

  return null;
}

export default async function DynamicBlockPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const page = await getPageBlocks(resolvedParams.slug);

  if (!page) {
    notFound();
  }

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Home
      </Link>

      <div className="border-b pb-6 space-y-2">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
          {page.title}
        </h1>
      </div>

      <div className="space-y-6">
        {page.blocks &&
          page.blocks.map((block: Record<string, unknown>) => (
            <div key={String(block.id)}>{renderPublicBlock(block)}</div>
          ))}
      </div>
    </article>
  );
}

function renderPublicBlock(block: Record<string, unknown>) {
  const c = (block.config as Record<string, unknown>) || {};
  switch (block.type) {
    case 'hero':
      return (
        <div className="rounded-2xl bg-gradient-to-r from-primary to-slate-900 text-white p-8 space-y-2 shadow-md">
          <h2 className="text-2xl font-black">{String(c.headline || 'Agency Feature')}</h2>
          <p className="text-xs text-slate-200">{String(c.subtext || '')}</p>
        </div>
      );

    case 'heading':
      if (c.level === 1) return <h1 className="text-2xl font-black text-foreground pt-2">{String(c.text || '')}</h1>;
      if (c.level === 3) return <h3 className="text-base font-bold text-foreground pt-2">{String(c.text || '')}</h3>;
      return <h2 className="text-xl font-bold text-foreground pt-2 border-b pb-1">{String(c.text || '')}</h2>;

    case 'paragraph':
      return <p className="text-sm leading-relaxed text-slate-700">{String(c.text || '')}</p>;

    case 'quote':
      return (
        <blockquote className="border-l-4 border-primary pl-4 py-2 italic text-sm text-slate-600 bg-muted/20 rounded-r-lg">
          &ldquo;{String(c.text || '')}&rdquo;
          {c.author ? <span className="block text-xs font-bold not-italic text-slate-900 mt-1">— {String(c.author)}</span> : null}
        </blockquote>
      );

    case 'image':
      return (
        <figure className="space-y-2">
          {c.src ? (
            <img src={String(c.src)} alt={String(c.alt || 'Image')} className="rounded-xl border w-full object-cover max-h-96" />
          ) : (
            <div className="h-48 rounded-xl border bg-muted flex items-center justify-center text-xs text-muted-foreground">
              [Image Asset: {String(c.alt || 'Placeholder')}]
            </div>
          )}
          {c.caption ? <figcaption className="text-center text-xs text-muted-foreground italic">{String(c.caption)}</figcaption> : null}
        </figure>
      );

    case 'divider':
      return <hr className="my-6 border-slate-200" />;

    case 'button':
      return (
        <div className="pt-2">
          <Link
            href={String(c.url || '#')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition-all shadow-2xs"
          >
            {String(c.label || 'Learn More')} →
          </Link>
        </div>
      );

    case 'accordion':
      return (
        <div className="space-y-2 border rounded-xl p-4 bg-card">
          {((c.items as Record<string, unknown>[]) || []).map((item, idx) => (
            <details key={idx} className="border-b last:border-b-0 pb-2 pt-2 cursor-pointer">
              <summary className="font-bold text-xs text-foreground">{String(item.title || '')}</summary>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{String(item.content || '')}</p>
            </details>
          ))}
        </div>
      );

    case 'table':
      return (
        <div className="border rounded-xl overflow-hidden shadow-2xs">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/50 font-bold border-b">
              <tr>
                {((c.headers as string[]) || []).map((h, idx) => (
                  <th key={idx} className="p-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {((c.rows as string[][]) || []).map((row, rIdx) => (
                <tr key={rIdx} className="border-b last:border-b-0">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="p-3">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    default:
      return null;
  }
}
