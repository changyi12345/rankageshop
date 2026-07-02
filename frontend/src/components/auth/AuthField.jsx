import { useState } from "react";
import { IconEye, IconEyeOff } from "./AuthIcons";

export default function AuthField({
  id,
  name,
  label,
  type = "text",
  icon,
  hint,
  labelExtra,
  className = "",
  inputClassName = "",
  ...inputProps
}) {
  const isPassword = type === "password";
  const [visible, setVisible] = useState(false);
  const inputType = isPassword ? (visible ? "text" : "password") : type;

  return (
    <div className={`auth-field ${className}`.trim()}>
      <div className="auth-field__head">
        <label htmlFor={id} className="auth-field__label">
          {label}
        </label>
        {labelExtra}
      </div>
      <div className="auth-field__control">
        {icon ? (
          <span className="auth-field__icon" aria-hidden>
            {icon}
          </span>
        ) : null}
        <input
          id={id}
          name={name}
          type={inputType}
          className={`auth-field__input${isPassword ? " auth-field__input--password" : ""} ${inputClassName}`.trim()}
          {...inputProps}
        />
        {isPassword ? (
          <button
            type="button"
            className="auth-field__toggle"
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
        ) : null}
      </div>
      {hint ? <p className="auth-field__hint">{hint}</p> : null}
    </div>
  );
}
