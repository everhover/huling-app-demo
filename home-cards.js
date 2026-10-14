/* One horizontal gesture path for mouse, pen and touch; vertical page scrolling stays native. */
(() => {
  let gesture = null;
  const suppressed = new WeakMap();
  document.addEventListener('pointerdown', event => {
    const strip = event.target.closest('.home-entry-strip');
    if (!strip || !event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return;
    gesture = { strip, id: event.pointerId, x: event.clientX, y: event.clientY, left: strip.scrollLeft, horizontal: false };
  }, true);
  document.addEventListener('pointermove', event => {
    const g = gesture;
    if (!g || event.pointerId !== g.id) return;
    const dx = event.clientX - g.x, dy = event.clientY - g.y;
    if (!g.horizontal) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 6) return;
      if (Math.abs(dy) > Math.abs(dx)) { gesture = null; return; }
      g.horizontal = true;
      g.strip.setPointerCapture(event.pointerId);
    }
    event.preventDefault();
    g.strip.scrollLeft = g.left - dx;
    suppressed.set(g.strip, Date.now() + 500);
  }, { capture: true, passive: false });
  function end(event) {
    const g = gesture;
    if (!g || event.pointerId !== g.id) return;
    if (g.horizontal) {
      suppressed.set(g.strip, Date.now() + 500);
      if (g.strip.hasPointerCapture(event.pointerId)) g.strip.releasePointerCapture(event.pointerId);
    }
    gesture = null;
  }
  document.addEventListener('pointerup', end, true);
  document.addEventListener('pointercancel', end, true);
  document.addEventListener('click', event => {
    const strip = event.target.closest('.home-entry-strip');
    if (strip && Date.now() < (suppressed.get(strip) || 0)) {
      event.preventDefault();event.stopImmediatePropagation();
    }
  }, true);
  document.addEventListener('dragstart', event => {
    if (event.target.closest('.home-entry-strip')) event.preventDefault();
  });
})();
