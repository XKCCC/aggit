export default function Avatar({
  name,
  color,
  size = 28,
}: {
  name: string;
  color: string;
  size?: number;
}) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-[#0d1117]"
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        fontSize: Math.round(size * 0.45),
      }}
      aria-hidden
    >
      {name.trim().slice(0, 1).toUpperCase()}
    </span>
  );
}
