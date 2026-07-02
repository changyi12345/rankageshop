import * as RadixSelect from "@radix-ui/react-select";

function ChevronIcon({ className = "" }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
    >
      <path
        d="M4 6l4 4 4-4"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path
        d="M2.5 7.5L5.5 10.5L11.5 3.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SelectItems({ options, groups }) {
  if (groups?.length) {
    return groups.map((group) => (
      <RadixSelect.Group key={group.label || "default"}>
        {group.label ? (
          <RadixSelect.Label className="ui-select-label">{group.label}</RadixSelect.Label>
        ) : null}
        {group.options.map((opt) => (
          <SelectItem key={opt.value} option={opt} />
        ))}
      </RadixSelect.Group>
    ));
  }

  return options.map((opt) => <SelectItem key={opt.value} option={opt} />);
}

function SelectItem({ option }) {
  return (
    <RadixSelect.Item
      value={option.value}
      disabled={option.disabled}
      className="ui-select-item"
    >
      <span className="ui-select-item__text">
        <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
      </span>
      <RadixSelect.ItemIndicator className="ui-select-item__check">
        <CheckIcon />
      </RadixSelect.ItemIndicator>
    </RadixSelect.Item>
  );
}

/**
 * Styled select (Radix UI) — matches site input-field look.
 *
 * @param {object} props
 * @param {string} [props.value]
 * @param {(value: string) => void} props.onValueChange
 * @param {{ value: string, label: string, disabled?: boolean }[]} [props.options]
 * @param {{ label?: string, options: { value: string, label: string, disabled?: boolean }[] }[]} [props.groups]
 * @param {string} [props.placeholder]
 * @param {boolean} [props.disabled]
 * @param {boolean} [props.invalid]
 * @param {'default'|'compact'} [props.size]
 * @param {string} [props.className] — wrapper
 * @param {string} [props.id]
 * @param {string} [props['aria-label']]
 */
export default function Select({
  value,
  onValueChange,
  options = [],
  groups,
  placeholder = "Select…",
  disabled = false,
  invalid = false,
  size = "default",
  className = "",
  id,
  "aria-label": ariaLabel,
}) {
  const resolvedValue = value === "" || value == null ? undefined : value;

  return (
    <RadixSelect.Root
      value={resolvedValue}
      onValueChange={onValueChange}
      disabled={disabled}
    >
      <RadixSelect.Trigger
        id={id}
        className={[
          "ui-select-trigger",
          size === "compact" ? "ui-select-trigger--compact" : "",
          invalid ? "ui-select-trigger--invalid" : "",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        aria-label={ariaLabel}
      >
        <RadixSelect.Value placeholder={placeholder} />
        <RadixSelect.Icon className="ui-select-trigger__icon">
          <ChevronIcon />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>

      <RadixSelect.Portal>
        <RadixSelect.Content
          className="ui-select-content"
          position="popper"
          sideOffset={6}
          align="start"
          collisionPadding={12}
        >
          <RadixSelect.ScrollUpButton className="ui-select-scroll">
            <ChevronIcon className="rotate-180" />
          </RadixSelect.ScrollUpButton>
          <RadixSelect.Viewport className="ui-select-viewport">
            <SelectItems options={options} groups={groups} />
          </RadixSelect.Viewport>
          <RadixSelect.ScrollDownButton className="ui-select-scroll">
            <ChevronIcon />
          </RadixSelect.ScrollDownButton>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );
}
