export function ScoreBar({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <div className="flex gap-1" aria-label={`Score ${value} out of ${max}`}>
      {Array.from({ length: max }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 flex-1 ${i < value ? "bg-ink" : "bg-hairline"}`}
        />
      ))}
    </div>
  );
}
