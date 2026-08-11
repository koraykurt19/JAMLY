export default function CollabLoading() {
  return (
    <section className="mx-auto min-h-[70vh] w-full max-w-[1440px] animate-pulse px-4 py-12 sm:px-6 lg:px-8">
      <div className="h-4 w-36 rounded bg-white/8" />
      <div className="mt-5 h-10 w-72 max-w-full rounded bg-white/8" />
      <div className="mt-10 flex gap-3 border-b border-white/10 pb-4">
        {[1, 2, 3].map((item) => <div key={item} className="h-10 w-32 rounded bg-white/6" />)}
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[1, 2, 3].map((item) => <div key={item} className="h-52 border border-white/8 bg-white/[0.025]" />)}
      </div>
    </section>
  );
}
