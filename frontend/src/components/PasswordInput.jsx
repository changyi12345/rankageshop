import { useState } from "react";
import { IconEye, IconEyeOff } from "./auth/AuthIcons";

export default function PasswordInput({ className = "", ...inputProps }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="password-input">
      <input
        type={visible ? "text" : "password"}
        className={`password-input__field ${className}`.trim()}
        {...inputProps}
      />
      <button
        type="button"
        className="password-input__toggle"
        onClick={() => setVisible((value) => !value)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
      >
        {visible ? (
          <IconEyeOff className="h-[18px] w-[18px]" />
        ) : (
          <IconEye className="h-[18px] w-[18px]" />
        )}
      </button>
    </div>
  );
}
