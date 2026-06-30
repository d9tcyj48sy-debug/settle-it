// Shared touch press feedback handlers.
// Scale for button/card-shaped elements, opacity for plain text links.
// Uses direct DOM style manipulation (not CSS :active) so state never lingers
// after a screen transition.

export function pressIn(e) {
  const el = e.currentTarget;
  el.style.transition = "";
  el.style.transform = "scale(0.97)";
}

export function pressOut(e) {
  const el = e.currentTarget;
  el.style.transition = "transform 120ms ease";
  el.style.transform = "";
  el.addEventListener("transitionend", function onEnd(ev) {
    if (ev.propertyName === "transform") {
      el.style.transition = "";
      el.removeEventListener("transitionend", onEnd);
    }
  });
}

export function textPressIn(e) {
  const el = e.currentTarget;
  el.style.transition = "";
  el.style.opacity = "0.6";
}

export function textPressOut(e) {
  const el = e.currentTarget;
  el.style.transition = "opacity 120ms ease";
  el.style.opacity = "";
  el.addEventListener("transitionend", function onEnd(ev) {
    if (ev.propertyName === "opacity") {
      el.style.transition = "";
      el.removeEventListener("transitionend", onEnd);
    }
  });
}

// For list rows inside a shared Card (e.g. SettingsScreen TappableRow,
// ThemePickerScreen rows) — fills solid instantly on press and clears instantly
// on release, same as the HistoryScreen entry background. No scale: these rows
// share one fixed-size Card with siblings, so shrinking just the row would pull
// its edges away from the Card's stationary boundary, leaving a gap.
export function rowPressIn(e) {
  const el = e.currentTarget;
  const isDark = document.documentElement.classList.contains("dark");
  el.style.backgroundColor = isDark ? "rgb(39 39 42)" : "rgb(244 244 245)";
}

export function rowPressOut(e) {
  e.currentTarget.style.backgroundColor = "";
}
