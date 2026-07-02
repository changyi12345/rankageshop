import { IconBolt, IconShield, IconUser, IconWallet } from "./AuthIcons";

const PERKS = [
  {
    icon: IconBolt,
    title: "Fast top-up",
    text: "Diamonds, UC, and credits delivered right after payment clears.",
  },
  {
    icon: IconWallet,
    title: "Wallet balance",
    text: "Load once, checkout faster on every game without re-entering details.",
  },
  {
    icon: IconUser,
    title: "Wide catalog",
    text: "MLBB, PUBG, Free Fire, and more — one account for every order.",
  },
  {
    icon: IconShield,
    title: "Secure checkout",
    text: "Encrypted sign-in and wallet checkout you can trust.",
  },
];

export default function AuthPerks() {
  return (
    <ul className="auth-perks">
      {PERKS.map(({ icon: Icon, title, text }, i) => (
        <li
          key={title}
          className="auth-perks__item opacity-0 animate-slide-up"
          style={{ animationDelay: `${120 + i * 80}ms`, animationFillMode: "forwards" }}
        >
          <span className="auth-perks__icon" aria-hidden>
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <p className="auth-perks__title">{title}</p>
            <p className="auth-perks__text">{text}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
