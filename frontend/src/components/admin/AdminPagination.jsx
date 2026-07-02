const DEFAULT_PAGE_SIZES = [10, 20, 50, 100];

function pageRange(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages = new Set([1, total, current, current - 1, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const result = [];

  for (let i = 0; i < sorted.length; i += 1) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push("…");
    result.push(sorted[i]);
  }
  return result;
}

export default function AdminPagination({
  page,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = DEFAULT_PAGE_SIZES,
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end = Math.min(safePage * pageSize, totalItems);
  const pages = pageRange(safePage, totalPages);

  return (
    <div className="flex flex-col gap-4 border-t border-blue-100 bg-gradient-to-r from-white to-blue-50/50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-blue-600">
        Showing <span className="font-bold text-blue-900">{start}</span>–
        <span className="font-bold text-blue-900">{end}</span> of{" "}
        <span className="font-bold text-blue-900">{totalItems}</span>
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-blue-600">
          Per page
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="rounded-xl border border-blue-200 bg-white px-3 py-1.5 text-sm font-semibold text-blue-900 outline-none focus:border-blue-400"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => onPageChange(safePage - 1)}
            className="rounded-xl border border-blue-200 px-3 py-1.5 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Prev
          </button>

          {pages.map((p, idx) =>
            p === "…" ? (
              <span key={`gap-${idx}`} className="px-2 text-blue-400">
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                className={`min-w-[2.25rem] rounded-xl px-3 py-1.5 text-sm font-bold transition-colors ${
                  p === safePage
                    ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md shadow-blue-200"
                    : "border border-blue-200 text-blue-700 hover:bg-blue-50"
                }`}
              >
                {p}
              </button>
            ),
          )}

          <button
            type="button"
            disabled={safePage >= totalPages}
            onClick={() => onPageChange(safePage + 1)}
            className="rounded-xl border border-blue-200 px-3 py-1.5 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
