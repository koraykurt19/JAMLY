type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left"
}: SectionHeadingProps) {
  return (
    <div className={align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase text-jam-mint">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="mt-3 text-[clamp(1.8rem,3vw,2.35rem)] font-semibold leading-tight text-white">
        {title}
      </h2>
      {description ? (
        <p className="mt-4 text-base leading-7 text-white/62">{description}</p>
      ) : null}
    </div>
  );
}
