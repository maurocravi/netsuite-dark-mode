/**
 * NetSuite Theme Studio — Content Script
 * Inyecta CSS dinámico en páginas de NetSuite basado en preferencias del usuario.
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'netsuiteTheme';

  const DEFAULT_THEME = {
    enabled: true,
    bg: '#0c0c0e',
    text: '#e5e5e5',
    textMuted: '#737373',
    cardBg: '#141416',
    cardBorder: '#1e1e22',
    inputBg: '#1a1a1e',
    inputBorder: '#2a2a30',
    accent: '#6366f1',
    accentHover: '#818cf8',
    danger: '#ef4444',
    success: '#10b981',
    fontSize: 14,
    sidebarSaturation: 1,
    highContrast: false,
    profiles: {},
    autoDark: false,
    autoDarkStart: '18:00',
    autoDarkEnd: '06:00'
  };

  const browserApi = typeof browser !== 'undefined' && browser.storage ? browser : chrome;

  function buildCSS(theme) {
    return `
      :root {
        --ns-bg: ${theme.bg};
        --ns-text: ${theme.text};
        --ns-text-muted: ${theme.textMuted};
        --ns-card-bg: ${theme.cardBg};
        --ns-card-border: ${theme.cardBorder};
        --ns-input-bg: ${theme.inputBg};
        --ns-input-border: ${theme.inputBorder};
        --ns-accent: ${theme.accent};
        --ns-accent-hover: ${theme.accentHover};
        --ns-danger: ${theme.danger};
        --ns-success: ${theme.success};
        --ns-font-size: ${theme.fontSize}px;
        --ns-sidebar-saturation: ${theme.sidebarSaturation};
        --ns-high-contrast: ${theme.highContrast ? 1 : 0};
        --ns-enabled: ${theme.enabled ? 1 : 0};
      }
    `;
  }

  function injectStyle(css) {
    let styleTag = document.getElementById('netsuite-theme-variables');
    if (styleTag) {
      styleTag.textContent = css;
      return;
    }
    styleTag = document.createElement('style');
    styleTag.id = 'netsuite-theme-variables';
    styleTag.textContent = css;
    if (document.head) {
      document.head.appendChild(styleTag);
    } else {
      // document_start: head puede no existir aún
      const observer = new MutationObserver(() => {
        if (document.head) {
          document.head.appendChild(styleTag);
          observer.disconnect();
        }
      });
      observer.observe(document.documentElement, { childList: true });
    }
  }

  function applyTheme(theme) {
    const html = document.documentElement;
    if (!html) return;

    const isEnabled = theme.enabled;
    const isHighContrast = theme.highContrast;

    html.setAttribute('data-netsuite-theme', isEnabled ? 'enabled' : 'disabled');
    html.setAttribute('data-netsuite-high-contrast', String(isHighContrast));

    injectStyle(buildCSS(theme));
  }

  function checkAutoDark(theme) {
    if (!theme.autoDark) return theme;
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const [startH, startM] = (theme.autoDarkStart || '18:00').split(':').map(Number);
    const [endH, endM] = (theme.autoDarkEnd || '06:00').split(':').map(Number);
    const startMinutes = startH * 60 + (startM || 0);
    const endMinutes = endH * 60 + (endM || 0);

    let inDarkWindow;
    if (startMinutes <= endMinutes) {
      inDarkWindow = currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    } else {
      inDarkWindow = currentMinutes >= startMinutes || currentMinutes <= endMinutes;
    }

    return { ...theme, enabled: inDarkWindow };
  }

  function init() {
    browserApi.storage.sync.get(STORAGE_KEY, (result) => {
      let theme = result[STORAGE_KEY];
      if (!theme) {
        theme = { ...DEFAULT_THEME };
        browserApi.storage.sync.set({ [STORAGE_KEY]: theme });
      } else {
        // Merge con defaults por si hay nuevas propiedades
        theme = { ...DEFAULT_THEME, ...theme };
      }

      theme = checkAutoDark(theme);
      applyTheme(theme);
    });
  }

  // Escuchar cambios en tiempo real desde el popup
  browserApi.storage.onChanged.addListener((changes, area) => {
    if (area !== 'sync') return;
    if (!changes[STORAGE_KEY]) return;
    let theme = changes[STORAGE_KEY].newValue;
    if (!theme) return;
    theme = { ...DEFAULT_THEME, ...theme };
    theme = checkAutoDark(theme);
    applyTheme(theme);
  });

  // Aplicar tan pronto como sea posible
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
