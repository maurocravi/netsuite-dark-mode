/**
 * NetSuite Theme Studio — Popup Script
 * Gestiona la UI de opciones y sincroniza con chrome.storage.sync
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

  const DARK_PRESET = {
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
    highContrast: false
  };

  function getBrowser() {
    return typeof browser !== 'undefined' && browser.storage ? browser : chrome;
  }

  function setStatus(msg, type = '') {
    const el = document.getElementById('status-msg');
    el.textContent = msg;
    el.className = type;
    if (type) {
      setTimeout(() => {
        el.textContent = 'Listo';
        el.className = '';
      }, 2000);
    }
  }

  function getThemeFromInputs() {
    return {
      enabled: document.getElementById('toggle-enabled').checked,
      bg: document.getElementById('color-bg').value,
      text: document.getElementById('color-text').value,
      textMuted: adjustMuted(document.getElementById('color-text').value),
      cardBg: document.getElementById('color-card').value,
      cardBorder: darken(document.getElementById('color-card').value, 8),
      inputBg: mix(document.getElementById('color-bg').value, '#2a2a30', 15),
      inputBorder: mix(document.getElementById('color-bg').value, '#525252', 25),
      accent: document.getElementById('color-accent').value,
      accentHover: lighten(document.getElementById('color-accent').value, 15),
      danger: '#ef4444',
      success: '#10b981',
      fontSize: parseInt(document.getElementById('range-fontsize').value, 10),
      sidebarSaturation: document.getElementById('toggle-sidebar-sat').checked ? 0.4 : 1,
      highContrast: document.getElementById('toggle-highcontrast').checked,
      profiles: {}, // se rellena al cargar
      autoDark: false,
      autoDarkStart: '18:00',
      autoDarkEnd: '06:00'
    };
  }

  function setInputsFromTheme(theme) {
    document.getElementById('toggle-enabled').checked = theme.enabled;
    document.getElementById('color-bg').value = theme.bg;
    document.getElementById('text-bg').value = theme.bg;
    document.getElementById('color-text').value = theme.text;
    document.getElementById('text-text').value = theme.text;
    document.getElementById('color-accent').value = theme.accent;
    document.getElementById('text-accent').value = theme.accent;
    document.getElementById('color-card').value = theme.cardBg;
    document.getElementById('text-card').value = theme.cardBg;
    document.getElementById('range-fontsize').value = theme.fontSize;
    document.getElementById('val-fontsize').textContent = theme.fontSize + 'px';
    document.getElementById('toggle-highcontrast').checked = theme.highContrast;
    document.getElementById('toggle-sidebar-sat').checked = theme.sidebarSaturation < 1;
  }

  function adjustMuted(hex) {
    // Devuelve un gris medio basado en luminosidad del texto, o usa el guardado
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return lum > 0.5 ? '#525252' : '#737373';
  }

  function lighten(hex, amount) {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, (num >> 16) + amount);
    const g = Math.min(255, ((num >> 8) & 0x00FF) + amount);
    const b = Math.min(255, (num & 0x00FF) + amount);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  function darken(hex, amount) {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.max(0, (num >> 16) - amount);
    const g = Math.max(0, ((num >> 8) & 0x00FF) - amount);
    const b = Math.max(0, (num & 0x00FF) - amount);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  function mix(hex, hex2, weight) {
    const c1 = parseInt(hex.replace('#', ''), 16);
    const c2 = parseInt(hex2.replace('#', ''), 16);
    const w = weight / 100;
    const r = Math.round(((c1 >> 16) * (1 - w)) + ((c2 >> 16) * w));
    const g = Math.round((((c1 >> 8) & 0x00FF) * (1 - w)) + (((c2 >> 8) & 0x00FF) * w));
    const b = Math.round(((c1 & 0x00FF) * (1 - w)) + ((c2 & 0x00FF) * w));
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  async function loadTheme() {
    const browserApi = getBrowser();
    return new Promise((resolve) => {
      browserApi.storage.sync.get(STORAGE_KEY, (result) => {
        let theme = result[STORAGE_KEY];
        if (!theme) {
          theme = { ...DEFAULT_THEME };
        } else {
          theme = { ...DEFAULT_THEME, ...theme };
        }
        resolve(theme);
      });
    });
  }

  async function saveTheme(theme) {
    const browserApi = getBrowser();
    return new Promise((resolve) => {
      browserApi.storage.sync.set({ [STORAGE_KEY]: theme }, () => {
        resolve();
      });
    });
  }

  function renderProfiles(theme) {
    const list = document.getElementById('profile-list');
    list.innerHTML = '';
    const profiles = theme.profiles || {};
    const keys = Object.keys(profiles);
    if (keys.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'profile-item';
      empty.style.justifyContent = 'center';
      empty.innerHTML = '<span class="profile-meta">Sin perfiles guardados</span>';
      list.appendChild(empty);
      return;
    }
    keys.forEach((name) => {
      const p = profiles[name];
      const item = document.createElement('div');
      item.className = 'profile-item';
      item.innerHTML = `
        <div class="profile-info">
          <span class="profile-name">${escapeHtml(name)}</span>
          <span class="profile-meta">${p.fontSize}px · ${p.accent}</span>
        </div>
        <div class="profile-actions">
          <button class="btn btn-ghost" data-action="load" data-name="${escapeHtml(name)}" title="Cargar">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </button>
          <button class="btn btn-ghost" data-action="delete" data-name="${escapeHtml(name)}" title="Eliminar">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        </div>
      `;
      list.appendChild(item);
    });

    list.querySelectorAll('[data-action="load"]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const name = btn.dataset.name;
        const theme = await loadTheme();
        const profile = theme.profiles?.[name];
        if (!profile) return;
        const merged = { ...theme, ...profile, profiles: theme.profiles };
        setInputsFromTheme(merged);
        await saveTheme(merged);
        setStatus(`Perfil "${name}" cargado`, 'success');
      });
    });

    list.querySelectorAll('[data-action="delete"]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const name = btn.dataset.name;
        const theme = await loadTheme();
        if (theme.profiles) {
          delete theme.profiles[name];
          await saveTheme(theme);
          renderProfiles(theme);
          setStatus(`Perfil "${name}" eliminado`, 'success');
        }
      });
    });
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function bindColorPair(colorId, textId) {
    const colorEl = document.getElementById(colorId);
    const textEl = document.getElementById(textId);
    colorEl.addEventListener('input', () => {
      textEl.value = colorEl.value;
      onChange();
    });
    textEl.addEventListener('change', () => {
      const val = textEl.value;
      if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
        colorEl.value = val;
        onChange();
      }
    });
  }

  async function onChange() {
    const theme = await loadTheme();
    const updated = getThemeFromInputs();
    updated.profiles = theme.profiles || {};
    updated.autoDark = theme.autoDark;
    updated.autoDarkStart = theme.autoDarkStart;
    updated.autoDarkEnd = theme.autoDarkEnd;
    await saveTheme(updated);
  }

  async function init() {
    const theme = await loadTheme();
    setInputsFromTheme(theme);
    renderProfiles(theme);

    // Bindings
    bindColorPair('color-bg', 'text-bg');
    bindColorPair('color-text', 'text-text');
    bindColorPair('color-accent', 'text-accent');
    bindColorPair('color-card', 'text-card');

    document.getElementById('toggle-enabled').addEventListener('change', onChange);
    document.getElementById('toggle-highcontrast').addEventListener('change', onChange);
    document.getElementById('toggle-sidebar-sat').addEventListener('change', onChange);

    document.getElementById('range-fontsize').addEventListener('input', (e) => {
      document.getElementById('val-fontsize').textContent = e.target.value + 'px';
      onChange();
    });

    // Botón tema oscuro predefinido
    document.getElementById('btn-dark-preset').addEventListener('click', async () => {
      const theme = await loadTheme();
      const updated = { ...theme, ...DARK_PRESET, enabled: true };
      setInputsFromTheme(updated);
      await saveTheme(updated);
      setStatus('Tema oscuro aplicado', 'success');
    });

    // Guardar perfil
    document.getElementById('btn-save-profile').addEventListener('click', async () => {
      const nameInput = document.getElementById('profile-name');
      const name = nameInput.value.trim();
      if (!name) {
        setStatus('Escribe un nombre para el perfil', 'error');
        return;
      }
      const theme = await loadTheme();
      const current = getThemeFromInputs();
      const profile = {
        enabled: current.enabled,
        bg: current.bg,
        text: current.text,
        textMuted: current.textMuted,
        cardBg: current.cardBg,
        cardBorder: current.cardBorder,
        inputBg: current.inputBg,
        inputBorder: current.inputBorder,
        accent: current.accent,
        accentHover: current.accentHover,
        danger: current.danger,
        success: current.success,
        fontSize: current.fontSize,
        sidebarSaturation: current.sidebarSaturation,
        highContrast: current.highContrast
      };
      theme.profiles = theme.profiles || {};
      theme.profiles[name] = profile;
      await saveTheme(theme);
      nameInput.value = '';
      renderProfiles(theme);
      setStatus(`Perfil "${name}" guardado`, 'success');
    });

    // Exportar
    document.getElementById('btn-export').addEventListener('click', async () => {
      const theme = await loadTheme();
      const blob = new Blob([JSON.stringify(theme, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'netsuite-theme.json';
      a.click();
      URL.revokeObjectURL(url);
      setStatus('Configuración exportada', 'success');
    });

    // Importar
    document.getElementById('btn-import').addEventListener('click', () => {
      document.getElementById('import-file').click();
    });
    document.getElementById('import-file').addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const imported = JSON.parse(text);
        if (typeof imported.bg !== 'string' || typeof imported.accent !== 'string') {
          throw new Error('Archivo inválido');
        }
        const merged = { ...DEFAULT_THEME, ...imported };
        await saveTheme(merged);
        setInputsFromTheme(merged);
        renderProfiles(merged);
        setStatus('Configuración importada', 'success');
      } catch (err) {
        setStatus('Error al importar: ' + err.message, 'error');
      }
      e.target.value = '';
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
