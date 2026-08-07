export default function WebsiteLoadingPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 animate-pulse">
      <div className="h-8 w-64 bg-muted/60 rounded-lg" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div key={idx} className="h-48 rounded-2xl border bg-card p-6 space-y-3">
            <div className="h-4 w-20 bg-muted/60 rounded" />
            <div className="h-5 w-3/4 bg-muted/60 rounded" />
            <div className="h-4 w-full bg-muted/60 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
