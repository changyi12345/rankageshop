import { useCallback, useEffect, useMemo, useState } from "react";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import PeopleIcon from "@mui/icons-material/People";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import PersonIcon from "@mui/icons-material/Person";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import BlockIcon from "@mui/icons-material/Block";
import GppBadIcon from "@mui/icons-material/GppBad";
import { adminApi } from "../../api/admin";
import { toast } from "react-toastify";
import AdminPagination from "../../components/admin/AdminPagination";
import AdminConfirmModal from "../../components/admin/AdminConfirmModal";
import UserDetailModal, { getRoleColor } from "../../components/admin/UserDetailModal";
import UserEditModal from "../../components/admin/UserEditModal";
import WalletAdjustModal from "../../components/admin/WalletAdjustModal";
import BanUserModal from "../../components/admin/BanUserModal";

const PAGE_SIZE_KEY = "admin-users-page-size";

const ROLE_OPTIONS = [
  { value: "all", label: "All roles" },
  { value: "USER", label: "Users" },
  { value: "ADMIN", label: "Admins" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All status" },
  { value: "active", label: "Active" },
  { value: "banned", label: "Banned" },
];

const VERIFY_OPTIONS = [
  { value: "all", label: "All verification" },
  { value: "verified", label: "Email verified" },
  { value: "unverified", label: "Email not verified" },
];

function formatDateTime(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [verifyFilter, setVerifyFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [walletUser, setWalletUser] = useState(null);
  const [banUserTarget, setBanUserTarget] = useState(null);
  const [roleConfirm, setRoleConfirm] = useState(null);
  const [unbanConfirm, setUnbanConfirm] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [pageSize, setPageSize] = useState(() => {
    const saved = Number(localStorage.getItem(PAGE_SIZE_KEY));
    return saved > 0 ? saved : 20;
  });

  const fetchUsers = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await adminApi.getAllUsers();
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const stats = useMemo(() => {
    const admins = users.filter((u) => u.role === "ADMIN").length;
    const verified = users.filter((u) => u.emailVerified).length;
    const banned = users.filter((u) => u.isBanned).length;
    const totalWallet = users.reduce((sum, u) => sum + (u.walletBalance ?? 0), 0);
    return {
      total: users.length,
      admins,
      users: users.length - admins,
      verified,
      banned,
      totalWallet,
    };
  }, [users]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((user) => {
      if (roleFilter !== "all" && user.role !== roleFilter) return false;
      if (statusFilter === "active" && user.isBanned) return false;
      if (statusFilter === "banned" && !user.isBanned) return false;
      if (verifyFilter === "verified" && !user.emailVerified) return false;
      if (verifyFilter === "unverified" && user.emailVerified) return false;
      if (!q) return true;
      const haystack = [
        user.id,
        user.username,
        user.email,
        user.phone,
        user.referralCode,
        user.role,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [users, search, roleFilter, statusFilter, verifyFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [search, roleFilter, statusFilter, verifyFilter, pageSize]);

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

  const openRoleConfirm = (user) => {
    const nextRole = user.role === "ADMIN" ? "USER" : "ADMIN";
    setRoleConfirm({ user, nextRole });
  };

  const confirmRoleChange = async () => {
    if (!roleConfirm) return;
    setActionLoading(true);
    try {
      await adminApi.updateUserRole(roleConfirm.user.id, roleConfirm.nextRole);
      toast.success("User role updated");
      setRoleConfirm(null);
      setSelectedUser(null);
      fetchUsers(true);
    } catch {
      toast.error("Failed to update role");
    } finally {
      setActionLoading(false);
    }
  };

  const confirmUnban = async () => {
    if (!unbanConfirm) return;
    setActionLoading(true);
    try {
      await adminApi.unbanUser(unbanConfirm.id);
      toast.success(`${unbanConfirm.username} has been unbanned`);
      setUnbanConfirm(null);
      setSelectedUser(null);
      fetchUsers(true);
    } catch (err) {
      toast.error(err?.message || "Failed to unban user");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUserSaved = () => {
    fetchUsers(true);
    setEditingUser(null);
  };

  const handleWalletSaved = () => {
    fetchUsers(true);
    setWalletUser(null);
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
            Users
          </h1>
          <p className="mt-2 text-blue-600">Manage all registered users</p>
        </div>
        <button
          type="button"
          onClick={() => fetchUsers(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 self-start rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-50 disabled:opacity-60"
        >
          <RefreshIcon sx={{ fontSize: 18 }} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
        <StatCard icon={PeopleIcon} label="Total" value={stats.total} color="blue" />
        <StatCard icon={PersonIcon} label="Users" value={stats.users} color="cyan" />
        <StatCard icon={AdminPanelSettingsIcon} label="Admins" value={stats.admins} color="purple" />
        <StatCard icon={VerifiedUserIcon} label="Verified" value={stats.verified} color="green" />
        <StatCard icon={GppBadIcon} label="Banned" value={stats.banned} color="red" />
        <StatCard
          icon={AccountBalanceWalletIcon}
          label="Total wallet"
          value={`${(stats.totalWallet / 1000).toFixed(0)}K`}
          color="amber"
          title={`MMK ${stats.totalWallet.toLocaleString()}`}
        />
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
              placeholder="Search username, email, phone, referral…"
              className="w-full rounded-xl border border-blue-200 bg-white py-2.5 pl-10 pr-4 text-sm text-blue-900 outline-none transition-colors focus:border-blue-400"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-900 outline-none focus:border-blue-400"
            >
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-900 outline-none focus:border-blue-400"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <select
              value={verifyFilter}
              onChange={(e) => setVerifyFilter(e.target.value)}
              className="rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-900 outline-none focus:border-blue-400"
            >
              {VERIFY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="sticky top-0 z-10 bg-gradient-to-r from-white to-blue-50">
              <tr>
                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-blue-700">User</th>
                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-blue-700">Email</th>
                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-blue-700">Role</th>
                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-blue-700">Wallet</th>
                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-blue-700">Orders</th>
                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-blue-700">Joined</th>
                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-blue-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-100">
              {pageItems.map((user) => (
                <tr
                  key={user.id}
                  className="cursor-pointer transition-colors hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100/30"
                  onClick={() => setSelectedUser(user)}
                >
                  <td className="px-5 py-4">
                    <div className="flex min-w-[9rem] items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-400 text-sm font-bold text-white">
                        {user.username?.charAt(0)?.toUpperCase() || "U"}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-blue-900">{user.username || "-"}</p>
                        <p className="text-xs text-blue-500">ID #{user.id}</p>
                        {user.isBanned ? (
                          <span className="text-[10px] font-bold text-slate-700">Banned</span>
                        ) : null}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="min-w-[10rem]">
                      <p className="truncate text-sm text-blue-900">{user.email || "-"}</p>
                      {user.emailVerified ? (
                        <span className="text-[10px] font-bold text-blue-600">Verified</span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-600">Unverified</span>
                      )}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4">
                    <span className={`rounded-xl border px-3 py-1.5 text-xs font-black ${getRoleColor(user.role)}`}>
                      {user.role || "USER"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 font-bold text-blue-900">
                    MMK {(user.walletBalance ?? 0).toLocaleString()}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-sm text-blue-700">
                    {user.orderCount ?? 0}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-sm text-blue-600">
                    {formatDateTime(user.createdAt)}
                  </td>
                  <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                    <div className="grid w-[11.5rem] grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedUser(user)}
                        className="inline-flex w-full items-center justify-center gap-1 rounded-lg border border-blue-200 bg-white px-2 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-50"
                      >
                        <VisibilityIcon sx={{ fontSize: 14 }} />
                        View
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingUser(user)}
                        className="inline-flex w-full items-center justify-center gap-1 rounded-lg border border-blue-200 bg-white px-2 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-50"
                      >
                        <EditIcon sx={{ fontSize: 14 }} />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => openRoleConfirm(user)}
                        className="w-full rounded-lg bg-blue-100 px-2 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-200"
                      >
                        {user.role === "ADMIN" ? "Demote" : "Promote"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setWalletUser(user)}
                        className="inline-flex w-full items-center justify-center gap-1 rounded-lg bg-blue-100 px-2 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-200"
                      >
                        <AccountBalanceWalletIcon sx={{ fontSize: 14 }} />
                        Wallet
                      </button>
                      {user.isBanned ? (
                        <button
                          type="button"
                          onClick={() => setUnbanConfirm(user)}
                          className="col-span-2 w-full rounded-lg bg-slate-100 px-2 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200"
                        >
                          Unban
                        </button>
                      ) : user.role !== "ADMIN" ? (
                        <button
                          type="button"
                          onClick={() => setBanUserTarget(user)}
                          className="col-span-2 inline-flex w-full items-center justify-center gap-1 rounded-lg bg-slate-200 px-2 py-1.5 text-xs font-bold text-slate-800 hover:bg-slate-300"
                        >
                          <BlockIcon sx={{ fontSize: 14 }} />
                          Ban
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
              {pageItems.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-blue-600">
                    {users.length === 0 ? "No users found" : "No users match your filters"}
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

      {selectedUser ? (
        <UserDetailModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onUpdated={() => {
            fetchUsers(true);
            setSelectedUser(null);
          }}
          onEdit={() => {
            setEditingUser(selectedUser);
            setSelectedUser(null);
          }}
          onAdjustWallet={() => {
            setWalletUser(selectedUser);
            setSelectedUser(null);
          }}
          onRoleChange={() => openRoleConfirm(selectedUser)}
          onBan={() => {
            setBanUserTarget(selectedUser);
            setSelectedUser(null);
          }}
          onUnban={() => setUnbanConfirm(selectedUser)}
        />
      ) : null}

      {editingUser ? (
        <UserEditModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSaved={handleUserSaved}
        />
      ) : null}

      {walletUser ? (
        <WalletAdjustModal
          user={walletUser}
          onClose={() => setWalletUser(null)}
          onSaved={handleWalletSaved}
        />
      ) : null}

      {banUserTarget ? (
        <BanUserModal
          user={banUserTarget}
          onClose={() => setBanUserTarget(null)}
          onSaved={() => {
            fetchUsers(true);
            setBanUserTarget(null);
          }}
        />
      ) : null}

      {roleConfirm ? (
        <AdminConfirmModal
          title="Change user role"
          message={`Change ${roleConfirm.user.username} from ${roleConfirm.user.role} to ${roleConfirm.nextRole}?`}
          confirmLabel={`Set as ${roleConfirm.nextRole}`}
          variant="warning"
          loading={actionLoading}
          onConfirm={confirmRoleChange}
          onClose={() => setRoleConfirm(null)}
        />
      ) : null}

      {unbanConfirm ? (
        <AdminConfirmModal
          title="Unban user"
          message={`Restore access for ${unbanConfirm.username}? They will be able to log in again.`}
          confirmLabel="Unban user"
          variant="default"
          loading={actionLoading}
          onConfirm={confirmUnban}
          onClose={() => setUnbanConfirm(null)}
        />
      ) : null}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, title }) {
  const colors = {
    blue: "from-blue-500 to-blue-600",
    cyan: "from-blue-400 to-blue-600",
    purple: "from-blue-600 to-blue-900",
    green: "from-blue-500 to-blue-700",
    amber: "from-slate-600 to-slate-800",
    red: "from-slate-800 to-black",
  };

  return (
    <div className="rounded-2xl border border-blue-200/70 bg-white/90 p-4 shadow-sm" title={title}>
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
