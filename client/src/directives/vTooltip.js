export default {
  mounted(el, binding) {
    const tooltipText = binding.value;
    if (!tooltipText) return;

    const tooltip = document.createElement('div');
    tooltip.innerText = tooltipText;
    Object.assign(tooltip.style, {
      position: 'absolute',
      background: 'black',
      color: 'white',
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '12px',
      whiteSpace: 'nowrap',
      pointerEvents: 'none',
      opacity: '0',
      transition: 'opacity 0.2s',
      zIndex: '1000',
    });

    document.body.appendChild(tooltip);
    el._tooltip = tooltip;

    const showTooltip = () => {
      const rect = el.getBoundingClientRect();
      tooltip.style.top = `${rect.top + window.scrollY - tooltip.offsetHeight - 8}px`;
      tooltip.style.left = `${rect.left + window.scrollX + rect.width / 2 - tooltip.offsetWidth / 2}px`;
      tooltip.style.opacity = '1';
    };

    const hideTooltip = () => {
      tooltip.style.opacity = '0';
    };

    const mouseEnter = (event) => {
      if (event.target === el) {
        showTooltip()
      }
    };
    const mouseLeave = () => hideTooltip();

    const touchToggle = (e) => {
      e.stopPropagation();
      if (tooltip.style.opacity === '1') {
        hideTooltip();
      } else {
        showTooltip();
      }
    };

    const globalTouchClose = () => {
      hideTooltip();
    };

    el.addEventListener('mouseenter', mouseEnter);
    el.addEventListener('mouseleave', mouseLeave);
    el.addEventListener('touchstart', touchToggle);
    document.addEventListener('touchstart', globalTouchClose);

    el._tooltipHandlers = { mouseEnter, mouseLeave, touchToggle, globalTouchClose };
  },

  updated(el, binding) {
    if (binding.value !== binding.oldValue && el._tooltip) {
      el._tooltip.textContent = binding.value;
    }
  },

  unmounted(el) {
    const { mouseEnter, mouseLeave, touchToggle, globalTouchClose } = el._tooltipHandlers || {};
    if (el._tooltip) {
      document.body.removeChild(el._tooltip);
    }
    el.removeEventListener('mouseenter', mouseEnter);
    el.removeEventListener('mouseleave', mouseLeave);
    el.removeEventListener('touchstart', touchToggle);
    document.removeEventListener('touchstart', globalTouchClose);
  },
};
