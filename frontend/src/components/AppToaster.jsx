import { ToastContainer } from "react-toastify";
import { useIsMobileSite } from "../hooks/useMediaQuery";

/**
 * Always top-aligned: mobile = full-width below header, desktop = top-right.
 */
export default function AppToaster() {
  const isMobile = useIsMobileSite();

  return (
    <ToastContainer
      theme="dark"
      position={isMobile ? "top-center" : "top-right"}
      autoClose={4200}
      newestOnTop
      limit={isMobile ? 3 : 4}
      closeButton
      hideProgressBar
      pauseOnHover
      draggable={!isMobile}
      pauseOnFocusLoss={false}
      className="banana-toast-container"
      toastClassName="banana-toast"
      style={{ zIndex: 10000 }}
    />
  );
}
