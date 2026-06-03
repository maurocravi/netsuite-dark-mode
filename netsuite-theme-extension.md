# NetSuite Theme Extension — Guía de desarrollo

## Estructura de archivos

```
netsuite-theme/
├── manifest.json          # Configuración de la extensión
├── content.js             # Inyecta CSS en NetSuite
├── popup/
│   ├── popup.html         # UI de opciones
│   ├── popup.js
│   └── popup.css
├── themes/
│   ├── dark.css           # Tema oscuro base
│   └── variables.css      # Variables CSS personalizables
└── icons/
    └── icon-*.png
```

---

## Cómo funciona técnicamente

### manifest.json
Declara permisos y el content script. Compatible con Manifest V3 (Chrome y Firefox modernos).

```json
{
  "manifest_version": 3,
  "name": "NetSuite Theme Studio",
  "permissions": ["storage", "activeTab"],
  "content_scripts": [{
    "matches": ["*://*.netsuite.com/*"],
    "js": ["content.js"],
    "run_at": "document_start"
  }],
  "action": { "default_popup": "popup/popup.html" }
}
```

### content.js
Lee las preferencias guardadas e inyecta CSS dinámicamente al cargar la página.

```js
chrome.storage.sync.get('theme', ({ theme }) => {
  if (!theme) return;
  const style = document.createElement('style');
  style.textContent = buildCSS(theme); // genera variables CSS con las preferencias
  document.head.appendChild(style);
});
```

### Compatibilidad Chrome / Firefox
El código base es prácticamente el mismo. La única diferencia es que Firefox usa `browser.*` en lugar de `chrome.*`. Para manejar ambos sin duplicar código, se puede usar el polyfill oficial:
[webextension-polyfill](https://github.com/mozilla/webextension-polyfill)

---

## Funcionalidades

### Esenciales
- 🌙 **Tema oscuro predefinido** — listo para usar sin configurar nada, activable con un clic
- 🎨 **Color de fondo personalizable** — el ajuste más visible e impactante
- 🔤 **Color de texto principal** — debe ajustarse junto al fondo para mantener legibilidad
- 🎯 **Color de acento** — afecta botones, links y pestañas activas
- 📏 **Tamaño de fuente** — NetSuite usa texto pequeño por defecto; poder agrandarlo mejora mucho la experiencia

### Muy útiles
- 💾 **Perfiles guardados** — guardar varias combinaciones de colores (ej: "trabajo", "oscuro suave", "alto contraste") y cambiar entre ellas
- 🔀 **Toggle rápido** — activar/desactivar el tema con un clic sin perder la configuración
- 📊 **Reducir saturación de la sidebar** — la barra lateral de NetSuite es visualmente pesada; poder suavizarla reduce la fatiga visual
- 👁️ **Modo alto contraste** — útil para accesibilidad o ambientes con mucha luz

### Nice to have
- ⏰ **Tema automático por horario** — cambiar a oscuro después de cierta hora (ej: 6pm) de forma automática
- 📤 **Exportar / importar configuración** — para compartir el tema con colegas del equipo
- 🔄 **Sync entre dispositivos** — usar `chrome.storage.sync` en lugar de `local` hace que las preferencias se sincronicen automáticamente entre equipos con la misma cuenta de Chrome

---

## Notas adicionales

- La extensión no requiere publicarse en la Chrome Web Store para uso personal o de equipo; se puede cargar directamente en modo desarrollador.
- NetSuite actualiza su UI periódicamente, por lo que los selectores CSS pueden necesitar mantenimiento ocasional.
- Es recomendable usar variables CSS (`--ns-bg`, `--ns-text`, etc.) como capa de abstracción, para que cambiar un color actualice toda la UI de forma consistente.
