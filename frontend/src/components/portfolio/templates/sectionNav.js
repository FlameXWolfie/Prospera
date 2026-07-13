// In-page section links (href="#id") must scroll *within this template instance*.
// Fullscreen Preview keeps the editor document mounted underneath, so both share
// the same section ids — a bare browser hash jump hits the first match (the
// hidden editor) and the visible preview never moves. Scope the lookup to the
// template root and scroll the correct scroller.
//
// Landing position: slightly above vertical center of the viewport (not flush
// to the top), while still clearing any sticky top chrome.

const BREATHING = 16;
// 0 = top edge, 0.5 = true middle. A bit above center reads better for section heads.
const VIEW_ANCHOR = 0.34;

function nearestScrollParent(el) {
  let n = el.parentElement;
  while (n && n !== document.body) {
    const { overflowY } = getComputedStyle(n);
    if (
      (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay')
      && n.scrollHeight > n.clientHeight + 1
    ) {
      return n;
    }
    n = n.parentElement;
  }
  return document.scrollingElement || document.documentElement;
}

// Sticky / fixed bars at the top of the template (e.g. Aurora topbar) cover
// section titles if the target sits too high.
function topChromeOffset(root) {
  let max = 0;
  for (const el of root.querySelectorAll('*')) {
    const s = getComputedStyle(el);
    if (s.position !== 'sticky' && s.position !== 'fixed') continue;
    const top = parseFloat(s.top);
    if (Number.isNaN(top) || top > 4) continue;
    // Prefer full-width top bars over side rails (Horizon's sticky column).
    if (el.offsetWidth < root.clientWidth * 0.55) continue;
    max = Math.max(max, el.getBoundingClientRect().height);
  }
  return max;
}

function scrollToSection(root, target) {
  const scroller = nearestScrollParent(target);
  const chrome = topChromeOffset(root) + BREATHING;
  const scrollerIsDoc = scroller === document.documentElement
    || scroller === document.body
    || scroller === document.scrollingElement;

  const viewportH = scrollerIsDoc ? window.innerHeight : scroller.clientHeight;
  // Prefer upper-middle; never land under sticky chrome.
  const inset = Math.max(chrome, viewportH * VIEW_ANCHOR);

  if (scrollerIsDoc) {
    const top = target.getBoundingClientRect().top + window.scrollY - inset;
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    return;
  }

  const sRect = scroller.getBoundingClientRect();
  const tRect = target.getBoundingClientRect();
  const top = scroller.scrollTop + (tRect.top - sRect.top) - inset;
  scroller.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
}

export function onSectionNavClick(e) {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const href = a.getAttribute('href') || '';
  if (href.length < 2) return;
  const root = e.currentTarget;
  if (!root || !root.contains(a)) return;

  const id = href.slice(1);
  let target;
  try {
    target = root.querySelector(`#${CSS.escape(id)}`);
  } catch {
    return;
  }
  if (!target) return;

  e.preventDefault();
  scrollToSection(root, target);
}
