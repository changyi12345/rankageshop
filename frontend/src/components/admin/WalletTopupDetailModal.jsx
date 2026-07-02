import { useState } from "react";
import CloseIcon from "@mui/icons-material/Close";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import ImageNotSupportedIcon from "@mui/icons-material/ImageNotSupported";
import { resolveUploadUrl } from "../../utils/mediaUrl";

const STATUS_COLORS = {
  pending: "border-slate-200 bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700",
  completed: "border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-800",
  rejected: "border-slate-300 bg-slate-200 text-slate-800",
};

export function getTopupStatusColor(status) {
  return STATUS_COLORS[status?.toLowerCase()] || "border-gray-200 bg-gray-100 text-gray-800";
}

function formatDateTime(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

export default function WalletTopupDetailModal({ topup, onClose, onVerify, onReject, acting }) {
  const [lightbox, setLightbox] = useState(false);

  if (!topup) return null;

  const proofUrl = resolveUploadUrl(topup.proofImageUrl);
  const isPending = topup.status === "PENDING";

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-blue-950/40 p-4 sm:items-center">
        <div
          role="dialog"
          aria-modal="true"
          className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-blue-200 bg-white shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-blue-100 bg-gradient-to-r from-white to-blue-50 px-5 py-4">
            <div>
              <h2 className="text-lg font-extrabold text-blue-900">Top-up #{topup.id}</h2>
              <span className={`mt-1 inline-flex rounded-xl border px-3 py-1 text-xs font-black ${getTopupStatusColor(topup.status)}`}>
                {topup.status}
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-blue-600 transition-colors hover:bg-blue-100"
              aria-label="Close"
            >
              <CloseIcon />
            </button>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            <DetailRow label="User" value={topup.user?.username ?? topup.username} />
            <DetailRow label="Email" value={topup.user?.email ?? topup.email} />
            <DetailRow label="Amount" value={`MMK ${(topup.amount ?? 0).toLocaleString()}`} highlight />
            <DetailRow label="Reference" value={topup.reference || "-"} />
            <DetailRow label="Description" value={topup.description || "-"} />
            <DetailRow label="Submitted" value={formatDateTime(topup.createdAt)} />

            <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-blue-500">Payment proof</p>
              {proofUrl ? (
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setLightbox(true)}
                    className="group relative block w-full overflow-hidden rounded-xl border border-blue-200 bg-white"
                  >
                    <img
                      src={proofUrl}
                      alt="Payment proof"
                      className="mx-auto max-h-64 w-full object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        e.currentTarget.nextElementSibling?.classList.remove("hidden");
                      }}
                    />
                    <div className="hidden flex-col items-center justify-center gap-2 py-12 text-blue-500">
                      <ImageNotSupportedIcon sx={{ fontSize: 40 }} />
                      <span className="text-sm">Image failed to load</span>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center bg-blue-950/0 transition-colors group-hover:bg-blue-950/20">
                      <span className="flex items-center gap-1 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-blue-700 opacity-0 shadow transition-opacity group-hover:opacity-100">
                        <ZoomInIcon sx={{ fontSize: 16 }} />
                        View full size
                      </span>
                    </div>
                  </button>
                  <a
                    href={proofUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-800"
                  >
                    <OpenInNewIcon sx={{ fontSize: 16 }} />
                    Open in new tab
                  </a>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-8 text-blue-400">
                  <ImageNotSupportedIcon sx={{ fontSize: 40 }} />
                  <p className="text-sm font-medium">No proof image uploaded</p>
                </div>
              )}
            </div>
          </div>

          {isPending ? (
            <div className="flex gap-2 border-t border-blue-100 bg-blue-50/50 p-4">
              <button
                type="button"
                disabled={acting}
                onClick={() => onVerify(topup.id)}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                <CheckCircleIcon sx={{ fontSize: 18 }} />
                Verify & credit wallet
              </button>
              <button
                type="button"
                disabled={acting}
                onClick={() => onReject(topup.id)}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-800 transition-colors hover:bg-slate-200 disabled:opacity-50"
              >
                <CancelIcon sx={{ fontSize: 18 }} />
                Reject
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {lightbox && proofUrl ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightbox(false)}
          role="presentation"
        >
          <button
            type="button"
            onClick={() => setLightbox(false)}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            aria-label="Close lightbox"
          >
            <CloseIcon />
          </button>
          <img
            src={proofUrl}
            alt="Payment proof full size"
            className="max-h-[90vh] max-w-full rounded-lg object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      ) : null}
    </>
  );
}

function DetailRow({ label, value, highlight }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-blue-500">{label}</span>
      <span className={`text-right font-medium ${highlight ? "text-lg font-extrabold text-blue-900" : "text-blue-900"}`}>
        {value ?? "-"}
      </span>
    </div>
  );
}
