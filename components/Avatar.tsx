export default function Avatar({
  name,
  color,
  size = 28,
  avatarUrl,
}: {
  name: string;
  color: string;
  size?: number;
  avatarUrl?: string | null;
}) {
  if (avatarUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={avatarUrl}
        alt={name}
        className="shrink-0 rounded-full border border-[#30363d] object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
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
