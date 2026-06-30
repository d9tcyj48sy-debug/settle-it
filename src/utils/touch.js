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
