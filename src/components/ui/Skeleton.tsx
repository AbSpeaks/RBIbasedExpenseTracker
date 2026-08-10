"use client";

export function Skeleton({ className = "", height = "16px" }: { className?: string; height?: string }) {
  return <div className={`skeleton ${className}`} style={{ height }} />;
}

export function CardSkeleton() {
  return (
    <div className="card">
      <Skeleton height="12px" className="w-24 mb-3" />
      <Skeleton height="32px" className="w-36 mb-4" />
      <Skeleton height="10px" className="w-20" />
    </div>
  );
}

export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton height="14px" className={i === 0 ? "w-32" : "w-16"} />
        </td>
      ))}
    </tr>
  );
}
