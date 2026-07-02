import { toast as notify } from "react-toastify";
import { sanitizeUserMessage } from "./userMessages";

export { sanitizeUserMessage } from "./userMessages";

const base = {
  hideProgressBar: true,
  closeButton: true,
};

function optionsFor(type, extra = {}) {
  const variantClass = `banana-toast banana-toast--${type}`;
  const { className: extraClass, ...rest } = extra;
  return {
    ...base,
    ...rest,
    className: extraClass ? `${variantClass} ${extraClass}`.trim() : variantClass,
  };
}

export const toast = {
  success: (message) =>
    notify.success(String(message), optionsFor("success")),

  error: (message) =>
    notify.error(message == null ? "" : String(message), {
      ...optionsFor("error", { autoClose: 5500 }),
    }),

  warning: (message) =>
    notify.warning(String(message), optionsFor("warning")),

  info: (message) =>
    notify.info(String(message), optionsFor("info")),

  dismiss: (id) => notify.dismiss(id),
};

/** Strip provider names / raw JSON wrappers from API errors shown to customers. */
export function getErrorMessage(err, fallback = "Something went wrong") {
  if (!err) return fallback;
  if (typeof err === "string") {
    return sanitizeUserMessage(err, { fallback }) || fallback;
  }
  return (
    sanitizeUserMessage(err.message, { fallback, code: err.code }) || fallback
  );
}
