const GRADIENTS = [
  "from-blue-600 to-slate-900",
  "from-blue-500 to-blue-900",
  "from-sky-600 to-blue-950",
  "from-blue-700 to-black",
  "from-slate-700 to-blue-900",
  "from-blue-800 to-slate-950",
];

export function gradientForCode(code = "") {
  let hash = 0;
  for (let i = 0; i < code.length; i += 1) {
    hash = (hash + code.charCodeAt(i) * (i + 1)) % GRADIENTS.length;
  }
  return GRADIENTS[hash];
}
