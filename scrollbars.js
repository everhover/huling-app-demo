/* Shared by all demo pages, including nested lists, dialogs and text editors. */
(() => {
  const timers = new Map();
  function show(event) {
    const element = event.target === document ? document.scrollingElement : event.target;
    if (!(element instanceof Element)) return;
    element.setAttribute('data-scrollbar-active', '');
    clearTimeout(timers.get(element));
    timers.set(element, setTimeout(() => {
      element.removeAttribute('data-scrollbar-active');
      timers.delete(element);
    }, 700));
  }
  document.addEventListener('scroll', show, { capture: true, passive: true });
  window.addEventListener('pagehide', () => {
    timers.forEach((timer, element) => {
      clearTimeout(timer);
      element.removeAttribute('data-scrollbar-active');
    });
    timers.clear();
  });
})();
