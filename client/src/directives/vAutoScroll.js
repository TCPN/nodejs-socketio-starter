const keepBottom = new Map();
const saveScrollTop = new Map();

function isReachBottom(el) {
  return el.scrollTop + el.offsetHeight + 50 >= el.scrollHeight
}

export default {
  mounted(el) {
    const savedScrollTop = saveScrollTop.get(el.dataset.scrollId);
    el.scrollTop = savedScrollTop ?? el.scrollHeight;
    saveScrollTop.delete(el.dataset.scrollId);

    keepBottom.set(el, true);

    el.addEventListener('scroll', () => {
      keepBottom.set(el, isReachBottom(el));
    });
  },
  beforeUnmount(el) {
    if (!isReachBottom(el)) {
      saveScrollTop.set(el.dataset.scrollId, el.scrollTop);
    }
  },
  unmounted(el) {
    keepBottom.delete(el);
  },
  updated(el) {
    if (keepBottom.get(el)) {
      el.scrollTo({
        top: el.scrollHeight,
        behavior: 'smooth',
      });
    }
  }
}
