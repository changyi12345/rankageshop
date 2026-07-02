import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import InventoryIcon from "@mui/icons-material/Inventory";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import { adminApi } from "../../api/admin";
import { toast } from "react-toastify";
import AdminPagination from "../../components/admin/AdminPagination";

const PAGE_SIZE_KEY = "admin-products-page-size";

function productKey(product) {
  if (product.id) return `id-${product.id}`;
  if (product.g2bulkGameCode) return `game-${product.g2bulkGameCode}`;
  if (product.g2bulkProductId != null) return `voucher-${product.g2bulkProductId}`;
  return `name-${product.name}`;
}

function togglePayload(product) {
  if (product.id) return { id: product.id };
  if (product.g2bulkGameCode) return { g2bulkGameCode: product.g2bulkGameCode };
  if (product.g2bulkProductId != null) return { g2bulkProductId: product.g2bulkProductId };
  return null;
}

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(() => {
    const saved = Number(localStorage.getItem(PAGE_SIZE_KEY));
    return saved > 0 ? saved : 20;
  });

  const fetchProducts = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await adminApi.getAllProducts();
      setProducts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch products:", err);
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const stats = useMemo(() => {
    const active = products.filter((p) => p.isActive).length;
    const games = products.filter((p) => p.type === "direct_topup").length;
    return {
      total: products.length,
      active,
      inactive: products.length - active,
      games,
      vouchers: products.length - games,
    };
  }, [products]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((product) => {
      if (statusFilter === "active" && !product.isActive) return false;
      if (statusFilter === "inactive" && product.isActive) return false;
      if (typeFilter !== "all" && product.type !== typeFilter) return false;
      if (!q) return true;
      const haystack = [
        product.name,
        product.g2bulkGameCode,
        product.categoryTitle,
        product.typeLabel,
        product.id,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [products, search, statusFilter, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, typeFilter, pageSize]);

  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [page, safePage]);

  const handlePageChange = (next) => {
    setPage(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePageSizeChange = (size) => {
    setPageSize(size);
    localStorage.setItem(PAGE_SIZE_KEY, String(size));
    setPage(1);
  };

  const toggleProduct = async (product) => {
    const body = togglePayload(product);
    if (!body) {
      toast.error("Cannot toggle this product");
      return;
    }
    try {
      await adminApi.toggleProductActive(body);
      toast.success(product.isActive ? "Product hidden" : "Product activated");
      fetchProducts(true);
    } catch {
      toast.error("Failed to update product");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-3xl font-extrabold text-transparent">
            Products
          </h1>
          <p className="mt-2 text-blue-600">Manage game catalog and voucher products</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => fetchProducts(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-50 disabled:opacity-60"
          >
            <RefreshIcon sx={{ fontSize: 18 }} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
          <Link
            to="/admin/g2bulk"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-200 transition-opacity hover:opacity-90"
          >
            G2Bulk sync
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={InventoryIcon} label="Total" value={stats.total} color="blue" />
        <StatCard icon={CheckCircleIcon} label="Active" value={stats.active} color="green" />
        <StatCard icon={CancelIcon} label="Inactive" value={stats.inactive} color="gray" />
        <StatCard icon={SportsEsportsIcon} label="Games / Vouchers" value={`${stats.games} / ${stats.vouchers}`} color="cyan" />
      </div>

      <div className="overflow-hidden rounded-3xl border border-blue-200/70 bg-white/90 shadow-xl shadow-blue-200/60 backdrop-blur-xl">
        <div className="flex flex-col gap-4 border-b border-blue-100 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative min-w-0 flex-1 lg:max-w-md">
            <SearchIcon
              sx={{ fontSize: 20 }}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-blue-400"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, game code, category…"
              className="w-full rounded-xl border border-blue-200 bg-white py-2.5 pl-10 pr-4 text-sm text-blue-900 outline-none transition-colors focus:border-blue-400"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-900 outline-none focus:border-blue-400"
            >
              <option value="all">All status</option>
              <option value="active">Active only</option>
              <option value="inactive">Inactive only</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-900 outline-none focus:border-blue-400"
            >
              <option value="all">All types</option>
              <option value="direct_topup">Direct top-up</option>
              <option value="voucher">Voucher</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="sticky top-0 z-10 bg-gradient-to-r from-white to-blue-50">
              <tr>
                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-blue-700">Product</th>
                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-blue-700">Game / Category</th>
                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-blue-700">Type</th>
                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-blue-700">Price</th>
                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-blue-700">Stock</th>
                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-blue-700">Status</th>
                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-blue-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-100">
              {pageItems.map((product) => (
                <tr
                  key={productKey(product)}
                  className="transition-colors hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100/30"
                >
                  <td className="px-5 py-4">
                    <div className="flex min-w-[12rem] items-center gap-3">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt=""
                          className="h-10 w-10 shrink-0 rounded-xl border border-blue-100 object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-blue-100 text-xs font-bold text-blue-600">
                          {(product.name || "?").charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-blue-900">{product.name || "-"}</p>
                        {product.id ? (
                          <p className="text-xs text-blue-500">ID #{product.id}</p>
                        ) : (
                          <p className="text-xs text-slate-600">Not synced to DB</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-sm text-blue-900">
                    {product.g2bulkGameCode || product.categoryTitle || "-"}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4">
                    <span className="rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                      {product.typeLabel || product.type || "-"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 font-extrabold text-blue-900">
                    MMK {product.unitPrice?.toLocaleString() || 0}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-sm text-blue-700">
                    {product.stock ?? 0}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4">
                    <span
                      className={`rounded-xl border px-3 py-1.5 text-xs font-black ${
                        product.isActive
                          ? "border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-800"
                          : "border-gray-200 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800"
                      }`}
                    >
                      {product.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4">
                    <button
                      type="button"
                      onClick={() => toggleProduct(product)}
                      className={`rounded-xl px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 ${
                        product.isActive
                          ? "bg-gradient-to-r from-gray-500 to-gray-600"
                          : "bg-gradient-to-r from-blue-600 to-blue-500"
                      }`}
                    >
                      {product.isActive ? "Hide" : "Show"}
                    </button>
                  </td>
                </tr>
              ))}
              {pageItems.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-blue-600">
                    {products.length === 0 ? "No products found" : "No products match your filters"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <AdminPagination
          page={safePage}
          pageSize={pageSize}
          totalItems={filtered.length}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  const colors = {
    blue: "from-blue-500 to-blue-600",
    green: "from-blue-500 to-blue-700",
    gray: "from-gray-500 to-gray-600",
    cyan: "from-blue-400 to-blue-600",
  };

  return (
    <div className="rounded-2xl border border-blue-200/70 bg-white/90 p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${colors[color]} text-white`}>
          <Icon sx={{ fontSize: 20 }} />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-blue-500">{label}</p>
          <p className="text-xl font-extrabold text-blue-900">{value}</p>
        </div>
      </div>
    </div>
  );
}
