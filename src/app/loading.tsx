export default function Loading() {
  return (
    <section className="mx-auto flex min-h-[62vh] w-full max-w-7xl items-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full space-y-8">
        <div className="max-w-2xl space-y-4">
          <div className="h-4 w-36 animate-pulse rounded-full bg-jam-blue/28" />
          <div className="h-12 w-4/5 animate-pulse rounded-lg bg-white/10" />
          <div className="h-5 w-full animate-pulse rounded-full bg-white/7" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="rounded-lg border border-white/10 bg-white/[0.045] p-4">
              <div className="aspect-[4/3] animate-pulse rounded-md bg-white/8" />
              <div className="mt-4 h-5 w-3/4 animate-pulse rounded-full bg-white/10" />
              <div className="mt-3 h-4 w-1/2 animate-pulse rounded-full bg-white/7" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
