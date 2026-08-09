type StatCardProps = {
  label: string;
  value: string;
  detail?: string;
};

export function StatCard({ label, value, detail }: StatCardProps) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.045] p-5">
      <p className="text-sm text-white/56">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-white">{value}</p>
      {detail ? <p className="mt-2 text-sm text-white/48">{detail}</p> : null}
    </div>
  );
}
