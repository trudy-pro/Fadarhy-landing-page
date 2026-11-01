export type ThemeChoice = "light" | "dark" | "system";
export const THEME_KEY = "fadarhy-theme";

export function getChoice(): ThemeChoice {
  try {
    const v = localStorage.getItem(THEME_KEY);
    if (v === "light" || v === "dark" || v === "system") return v;
  } catch {
    /* storage unavailable */
  }
  return "system";
}

function systemDark(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function applyChoice(choice: ThemeChoice) {
  const dark = choice === "dark" || (choice === "system" && systemDark());
  document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
}

export function setChoice(choice: ThemeChoice) {
  try {
    localStorage.setItem(THEME_KEY, choice);
  } catch {
    /* storage unavailable */
  }
  applyChoice(choice);
  window.dispatchEvent(new CustomEvent("fadarhy-theme-change", { detail: choice }));
}

/** Runs before first paint. Kept as a string so it can be inlined in <head>. */
export const themeInitScript = `(function(){try{var c=null;try{c=localStorage.getItem("${THEME_KEY}")}catch(e){}var d=c==="dark"||((c!=="light")&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.setAttribute("data-theme",d?"dark":"light")}catch(e){}})();`;
