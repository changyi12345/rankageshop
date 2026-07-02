import { useCallback, useEffect, useState } from "react";
import RefreshIcon from "@mui/icons-material/Refresh";
import { adminApi } from "../../api/admin";
import AdminPageLoader from "../../components/admin/AdminPageLoader";
import { toast } from "react-toastify";

function defaultRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

export default function ReportsPage() {
  const [range, setRange] = useState(defaultRange);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await adminApi.getSalesReport(range.from, range.to);
      setReport(res.data);
    } catch {
      toast.error("Failed to load report");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [range.from, range.to]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && !report) return <AdminPageLoader />;

  const avgOrder =
    report?.totalOrders > 0 ? Math.round(Number(report.totalSales) / report.totalOrders) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-3xl font-extrabold text-transparent">
            Sales Reports
          </h1>
          <p className="mt-2 text-blue-600">Revenue and order breakdown</p>
        </div>
        <button
          type="button"
          onClick={() => load(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 self-start rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-60"
        >
          <RefreshIcon sx={{ fontSize: 18 }} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-blue-200 bg-white/90 p-5">
        <label className="text-sm">
          <span className="mb-1 block font-semibold text-blue-700">From</span>
          <input
            type="date"
            value={range.from}
            onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))}
            className="rounded-xl border border-blue-200 px-3 py-2"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-semibold text-blue-700">To</span>
          <input
            type="date"
            value={range.to}
            onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))}
            className="rounded-xl border border-blue-200 px-3 py-2"
          />
        </label>
        <button
          type="button"
          onClick={() => load()}
          className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-400 px-5 py-2.5 text-sm font-bold text-white"
        >
          Apply
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { label: "Total sales", value: `MMK ${Number(report?.totalSales ?? 0).toLocaleString()}` },
          { label: "Completed orders", value: report?.totalOrders ?? 0 },
          { label: "Avg. order", value: `MMK ${avgOrder.toLocaleString()}` },
        ].map((card) => (
          <div key={card.label} className="rounded-2xl border border-blue-200 bg-white/90 p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-blue-500">{card.label}</p>
            <p className="mt-2 text-2xl font-black text-blue-900">{card.value}</p>
          </div>
        ))}
      </div>

      {report?.topProducts?.length > 0 ? (
        <div className="overflow-hidden rounded-3xl border border-blue-200/70 bg-white/90 shadow-xl">
          <div className="border-b border-blue-100 px-5 py-4">
            <h2 className="text-lg font-extrabold text-blue-900">Top products</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-white to-blue-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-bold uppercase text-blue-700">Product</th>
                  <th className="px-5 py-3 text-left text-xs font-bold uppercase text-blue-700">Orders</th>
                  <th className="px-5 py-3 text-left text-xs font-bold uppercase text-blue-700">Sales</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-100">
                {report.topProducts.map((row) => (
                  <tr key={row.name} className="hover:bg-blue-50/50">
                    <td className="px-5 py-3 font-semibold text-blue-900">{row.name}</td>
                    <td className="px-5 py-3 text-blue-800">{row.count}</td>
                    <td className="px-5 py-3 font-bold text-blue-900">MMK {Number(row.sales).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {report?.monthlyReport?.length > 0 ? (
        <div className="overflow-hidden rounded-3xl border border-blue-200/70 bg-white/90 shadow-xl">
          <div className="border-b border-blue-100 px-5 py-4">
            <h2 className="text-lg font-extrabold text-blue-900">Monthly breakdown</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-white to-blue-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-bold uppercase text-blue-700">Month</th>
                  <th className="px-5 py-3 text-left text-xs font-bold uppercase text-blue-700">Orders</th>
                  <th className="px-5 py-3 text-left text-xs font-bold uppercase text-blue-700">Sales</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-100">
                {report.monthlyReport.map((row) => (
                  <tr key={row.month} className="hover:bg-blue-50/50">
                    <td className="px-5 py-3 font-semibold text-blue-900">{row.month}</td>
                    <td className="px-5 py-3 text-blue-800">{row.orders}</td>
                    <td className="px-5 py-3 font-bold text-blue-900">MMK {Number(row.sales).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
