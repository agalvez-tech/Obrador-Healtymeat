:root {
  --hm-black: #171513;
  --hm-gold: #ddae3c;
  --hm-gold-dark: #a8811f;
  --hm-paper: #faf7f2;
  --hm-line: #e8e1d4;
  --hm-gray: #8a8478;
  --hm-green: #2f7a4d;
  --hm-blue: #1e5fbf;
  --hm-red: #b3412c;
  font-family: 'Montserrat', system-ui, sans-serif;
}

* {
  box-sizing: border-box;
}

html,
body,
#root {
  height: 100%;
  margin: 0;
}

body {
  background: var(--hm-paper);
  color: var(--hm-black);
  -webkit-tap-highlight-color: transparent;
}

button {
  font-family: inherit;
}

.mono {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
}

.app {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  overflow: hidden;
}

/* ---------- Header ---------- */
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--hm-black);
  color: var(--hm-paper);
  padding: 14px 18px;
  flex-shrink: 0;
}

.brand {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.brand-logo {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: block;
}

.brand-name {
  font-weight: 600;
  font-size: 16px;
}

.btn-ghost {
  background: transparent;
  border: 1px solid rgba(250, 247, 242, 0.35);
  color: var(--hm-paper);
  padding: 8px 14px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 500;
}

/* ---------- Upload screen ---------- */
.upload-screen {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  overflow-y: auto;
}

.upload-card {
  max-width: 420px;
  text-align: center;
}

.upload-logo {
  width: 88px;
  height: 88px;
  border-radius: 50%;
  margin-bottom: 14px;
}

.upload-card h1 {
  font-size: 22px;
  font-weight: 800;
  margin: 0 0 6px;
}

.upload-card > p {
  color: var(--hm-gray);
  font-size: 14px;
  margin: 0 0 20px;
}

.btn-primary {
  background: var(--hm-gold);
  color: var(--hm-black);
  border: none;
  font-weight: 700;
  font-size: 16px;
  padding: 16px 28px;
  border-radius: 12px;
  width: 100%;
  max-width: 280px;
}

.btn-primary:disabled {
  opacity: 0.6;
}

.upload-error {
  color: var(--hm-red);
  font-size: 13px;
  margin-top: 14px;
}

.upload-help {
  margin-top: 24px;
  text-align: left;
  font-size: 13px;
  color: var(--hm-gray);
}

.upload-help summary {
  cursor: pointer;
  color: var(--hm-black);
  font-weight: 600;
}

.upload-help p {
  margin-top: 8px;
  line-height: 1.5;
}

/* ---------- Route progress (signature element) ---------- */
.route-progress {
  flex-shrink: 0;
  background: var(--hm-black);
  padding: 10px 18px 14px;
}

.route-progress-bar {
  height: 4px;
  background: rgba(250, 247, 242, 0.15);
  border-radius: 4px;
  overflow: hidden;
}

.route-progress-fill {
  height: 100%;
  background: var(--hm-gold);
  transition: width 0.3s ease;
}

.route-progress-meta {
  display: flex;
  align-items: baseline;
  gap: 6px;
  color: var(--hm-paper);
  margin: 8px 0 8px;
}

.route-progress-meta .mono {
  font-size: 15px;
  font-weight: 700;
  color: var(--hm-gold);
}

.route-progress-label {
  font-size: 12px;
  color: rgba(250, 247, 242, 0.6);
}

.route-dots {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding-bottom: 2px;
  scrollbar-width: none;
}

.route-dots::-webkit-scrollbar {
  display: none;
}

.route-dot {
  flex-shrink: 0;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 1.5px solid rgba(250, 247, 242, 0.3);
  background: transparent;
  color: var(--hm-paper);
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  font-weight: 700;
}

.route-dot--done {
  background: var(--hm-gold);
  border-color: var(--hm-gold);
  color: var(--hm-black);
}

/* ---------- Map ---------- */
.map-view {
  height: 34vh;
  flex-shrink: 0;
  border-bottom: 1px solid var(--hm-line);
}

.stop-pin {
  width: 28px;
  height: 28px;
  border-radius: 50% 50% 50% 0;
  transform: rotate(45deg);
  background: var(--pin-color);
  border: 2px solid var(--hm-paper);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
}

.stop-pin {
  color: var(--hm-paper);
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  font-weight: 700;
}

.stop-pin > * {
  transform: rotate(-45deg);
}

.stop-pin--live {
  border-radius: 50%;
  transform: none;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(30, 95, 191, 0.5);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(30, 95, 191, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(30, 95, 191, 0);
  }
}

/* ---------- Toolbar ---------- */
.toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 18px;
  flex-shrink: 0;
  border-bottom: 1px solid var(--hm-line);
  overflow-x: auto;
}

.gps-error,
.geocoding-note {
  font-size: 12px;
  color: var(--hm-gray);
  white-space: nowrap;
}

.btn-secondary {
  background: var(--hm-paper);
  border: 1.5px solid var(--hm-gold);
  color: var(--hm-gold-dark);
  font-weight: 600;
  font-size: 13px;
  padding: 8px 14px;
  border-radius: 999px;
  white-space: nowrap;
  margin-left: auto;
}

.btn-secondary:disabled {
  opacity: 0.4;
  border-color: var(--hm-gray);
  color: var(--hm-gray);
}

/* ---------- Stop list ---------- */
.stop-list {
  flex: 1;
  overflow-y: auto;
  padding: 14px 18px 32px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.stop-card {
  display: flex;
  gap: 12px;
  background: #fff;
  border: 1px solid var(--hm-line);
  border-radius: 14px;
  padding: 14px;
  align-items: flex-start;
}

.stop-card--done {
  background: #f3f7f4;
  border-color: #cfe0d4;
}

.stop-card-index {
  flex-shrink: 0;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: var(--hm-black);
  color: var(--hm-gold);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
}

.stop-card--done .stop-card-index {
  background: var(--hm-green);
  color: #fff;
}

.stop-card-body {
  flex: 1;
  min-width: 0;
}

.stop-card-name {
  font-weight: 700;
  font-size: 15px;
  margin-bottom: 2px;
}

.stop-card-address {
  font-size: 13px;
  color: var(--hm-gray);
  margin-bottom: 6px;
}

.stop-card-maps-link {
  display: inline-block;
  margin-bottom: 6px;
  font-size: 12.5px;
}

.stop-card-items {
  font-size: 13.5px;
  margin-bottom: 4px;
}

.stop-card-phone {
  font-size: 13px;
  color: var(--hm-gray);
}

.stop-card-schedule {
  font-size: 12.5px;
  color: var(--hm-gold-dark);
  font-weight: 600;
  margin-top: 2px;
}

.stop-card-notes {
  font-size: 12.5px;
  color: var(--hm-gray);
  font-style: italic;
  margin-top: 4px;
}

.stop-card-warning {
  font-size: 12px;
  color: var(--hm-gold-dark);
  margin-top: 4px;
}

.stop-card-toggle {
  flex-shrink: 0;
  border: 1.5px solid var(--hm-gold);
  background: #fff;
  color: var(--hm-gold-dark);
  font-weight: 700;
  font-size: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  max-width: 110px;
}

.stop-card-toggle--done {
  background: var(--hm-green);
  border-color: var(--hm-green);
  color: #fff;
}

/* ---------- Modal ---------- */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(23, 21, 19, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  z-index: 1000;
}

.modal {
  background: #fff;
  border-radius: 16px;
  padding: 22px;
  max-width: 340px;
}

.modal h3 {
  margin: 0 0 8px;
  font-size: 17px;
}

.modal p {
  margin: 0 0 18px;
  font-size: 14px;
  color: var(--hm-gray);
  line-height: 1.5;
}

.modal-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.btn-danger {
  background: var(--hm-red);
  color: #fff;
  border: none;
  font-weight: 700;
  font-size: 13px;
  padding: 10px 16px;
  border-radius: 10px;
}

/* ---------- Responsive: slightly larger map/list balance on tablets ---------- */
@media (min-width: 700px) {
  .map-view {
    height: 42vh;
  }
}

/* ---------- Role selection screen ---------- */
.role-screen {
  height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 32px;
  gap: 12px;
  background: var(--hm-black);
  color: var(--hm-paper);
}

.role-logo {
  width: 88px;
  height: 88px;
  border-radius: 50%;
  margin-bottom: 8px;
}

.role-app-name {
  font-family: 'JetBrains Mono', monospace;
  font-weight: 700;
  color: var(--hm-gold);
  letter-spacing: 0.03em;
  font-size: 13px;
  text-transform: uppercase;
  margin: 0 0 4px;
}

.role-screen h1 {
  font-size: 19px;
  margin: 0 0 14px;
  max-width: 320px;
}

.role-screen .btn-primary {
  max-width: 320px;
  margin-bottom: 10px;
}

.btn-primary--alt {
  background: transparent;
  border: 1.5px solid var(--hm-gold);
  color: var(--hm-gold);
}

.role-hint {
  font-size: 12px;
  color: rgba(250, 247, 242, 0.55);
  max-width: 300px;
  margin-top: 6px;
}

/* ---------- Office view ---------- */
.office-view {
  background: var(--hm-paper);
}

.office-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 16px 18px 100px;
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.office-section h2 {
  font-size: 15px;
  font-weight: 700;
  margin: 0 0 8px;
}

.office-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
}

.office-section-header h2 {
  margin: 0;
}

.office-section-actions {
  display: flex;
  gap: 8px;
}

.office-status {
  font-size: 14px;
  margin: 0;
}

.office-status-muted {
  color: var(--hm-gray);
  font-size: 13px;
}

.office-status .mono {
  color: var(--hm-gold-dark);
  font-weight: 700;
}

.depot-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border: 1px solid var(--hm-line);
  border-radius: 10px;
  padding: 12px 14px;
  font-size: 14px;
}

.depot-edit {
  display: flex;
  gap: 8px;
}

.depot-edit .field-input {
  flex: 1;
}

.btn-link {
  background: none;
  border: none;
  color: var(--hm-gold-dark);
  font-weight: 600;
  font-size: 13px;
  padding: 0;
}

.field-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--hm-gray);
  margin: 10px 0 4px;
  display: block;
}

.field-input {
  width: 100%;
  border: 1px solid var(--hm-line);
  border-radius: 10px;
  padding: 12px 14px;
  font-size: 14px;
  font-family: inherit;
  background: #fff;
  color: var(--hm-black);
  margin-bottom: 4px;
}

.field-input--compact {
  padding: 8px 12px;
  font-size: 13px;
  margin-top: 6px;
  margin-bottom: 0;
}

.client-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
}

.client-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: #fff;
  border: 1px solid var(--hm-line);
  border-radius: 12px;
  padding: 12px;
}

.client-row--selected {
  border-color: var(--hm-gold);
  background: #fffaf0;
}

.client-row-check {
  padding-top: 2px;
}

.client-row-check input {
  width: 20px;
  height: 20px;
}

.client-row-body {
  flex: 1;
  min-width: 0;
}

.client-row-name {
  font-weight: 700;
  font-size: 14.5px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.client-row-badge {
  font-size: 11px;
  font-weight: 700;
  color: var(--hm-green);
}

.client-row-address {
  font-size: 13px;
  color: var(--hm-gray);
}

.client-row-schedule {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 12px;
  color: var(--hm-gold-dark);
  margin-top: 3px;
  flex-wrap: wrap;
}

.client-row-days {
  font-family: 'JetBrains Mono', monospace;
  font-weight: 700;
  background: #f4ead0;
  padding: 1px 6px;
  border-radius: 6px;
}

.client-row-actions {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.btn-icon {
  background: none;
  border: none;
  font-size: 15px;
  padding: 4px;
  color: var(--hm-gray);
}

.office-build-bar {
  position: sticky;
  bottom: 0;
  background: var(--hm-paper);
  border-top: 1px solid var(--hm-line);
  padding: 14px 18px calc(14px + env(safe-area-inset-bottom));
  margin: -22px -18px 0;
}

.office-build-bar .btn-primary {
  width: 100%;
  max-width: none;
}

/* ---------- Client form modal ---------- */
.client-form {
  width: 100%;
  max-width: 380px;
  text-align: left;
}

.client-form h3 {
  margin: 0 0 4px;
  font-size: 17px;
}

/* ---------- Main tab navigation (Office shell) ---------- */
.main-tabs {
  display: flex;
  background: var(--hm-black);
  padding: 0 12px;
  flex-shrink: 0;
  overflow-x: auto;
}

.main-tab {
  background: none;
  border: none;
  color: rgba(250, 247, 242, 0.55);
  font-weight: 600;
  font-size: 13.5px;
  padding: 12px 14px;
  border-bottom: 2px solid transparent;
  white-space: nowrap;
}

.main-tab--active {
  color: var(--hm-gold);
  border-bottom-color: var(--hm-gold);
}

.tab-view {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.tab-view-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}

.tab-view-header h2 {
  font-size: 17px;
  font-weight: 700;
  margin: 0;
}

.field-input--date {
  width: auto;
  margin-bottom: 0;
}

/* ---------- Pill tabs (status filters) ---------- */
.pill-tabs {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding-bottom: 2px;
}

.pill-tabs--compact {
  margin-bottom: 8px;
}

.pill-tab {
  background: #fff;
  border: 1px solid var(--hm-line);
  color: var(--hm-gray);
  font-weight: 600;
  font-size: 12.5px;
  padding: 8px 12px;
  border-radius: 999px;
  white-space: nowrap;
}

.pill-tab--active {
  background: var(--hm-black);
  border-color: var(--hm-black);
  color: var(--hm-gold);
}

/* ---------- Badges ---------- */
.badge {
  font-size: 10.5px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 999px;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.badge--propio {
  background: #eaf3ec;
  color: var(--hm-green);
}

.badge--agencia {
  background: #eef1fb;
  color: #3b4fb0;
}

.estado-badge {
  font-size: 10.5px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 999px;
  white-space: nowrap;
}

.estado-badge--muted {
  background: #ececec;
  color: var(--hm-gray);
}

.estado-badge--info {
  background: #eef1fb;
  color: #3b4fb0;
}

.estado-badge--warn {
  background: #f7ecd2;
  color: var(--hm-gold-dark);
}

.estado-badge--ok {
  background: #e4f1e8;
  color: #2f7a4d;
}

.estado-badge--done {
  background: #e4f1e8;
  color: #2f7a4d;
  font-weight: 800;
}

/* ---------- Pedidos ---------- */
.pedido-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.pedido-card {
  background: #fff;
  border: 1px solid var(--hm-line);
  border-radius: 12px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.pedido-card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.pedido-card-top--clickable {
  cursor: pointer;
  width: 100%;
  text-align: left;
  background: none;
  border: none;
  padding: 0;
}

.chevron {
  display: inline-block;
  margin-right: 6px;
  color: var(--hm-gold-dark);
  transition: transform 0.15s ease;
}

.chevron--open {
  transform: rotate(90deg);
}

.pedido-card-resumen {
  font-size: 12.5px;
  color: var(--hm-gray);
  margin-top: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 260px;
}

.pedido-resumen-firmado {
  color: var(--hm-green);
  font-weight: 700;
}

.pedido-card-cliente {
  font-weight: 700;
  font-size: 15px;
}

.pedido-card-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 3px;
}

.pedido-origen-texto {
  background: var(--hm-paper);
  border: 1px solid var(--hm-line);
  border-radius: 8px;
  padding: 10px;
  font-size: 13px;
  white-space: pre-wrap;
  max-height: 120px;
  overflow-y: auto;
}

.pedido-origen-imagen-link {
  display: block;
}

.pedido-origen-imagen {
  max-height: 140px;
  border-radius: 8px;
  border: 1px solid var(--hm-line);
}

.pedido-card-fields {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.pedido-card-fields .field-input--compact {
  flex: 1;
  min-width: 100px;
  margin: 0;
}

.pedido-cantidad-row {
  display: flex;
  gap: 6px;
  flex: 1;
  min-width: 140px;
}

.field-select {
  border: 1px solid var(--hm-line);
  border-radius: 10px;
  padding: 8px 10px;
  font-size: 13px;
  background: #fff;
  font-family: inherit;
}

.pedido-card-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.albaran-row {
  margin-top: 2px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.numero-albaran-input {
  max-width: 220px;
  margin: 0;
}

.albaran-status {
  background: var(--hm-paper);
  border: 1px solid var(--hm-line);
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 13px;
}

.albaran-status--firmado {
  background: #eaf3ec;
  border-color: #cfe0d4;
  color: var(--hm-green);
  font-weight: 600;
}

.albaran-status--pendiente {
  color: var(--hm-gold-dark);
}

.albaran-upload-inline {
  background: #fdf6e8;
  border: 1px dashed var(--hm-gold);
  border-radius: 10px;
  padding: 10px;
}

.albaran-upload-inline-or {
  font-size: 12px;
  color: var(--hm-gray);
  margin-top: 8px;
}

.albaran-status-links {
  display: flex;
  gap: 12px;
  margin-top: 4px;
}

.lineas-pedido {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.linea-pedido {
  background: var(--hm-paper);
  border: 1px solid var(--hm-line);
  border-radius: 10px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.linea-producto {
  margin: 0;
}

.linea-pedido-top {
  display: flex;
  align-items: center;
  gap: 6px;
}

.linea-pedido-top .linea-producto {
  flex: 1;
}

.linea-reorder {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.linea-reorder .btn-icon {
  font-size: 11px;
  padding: 2px 6px;
  line-height: 1;
}

.linea-reorder .btn-icon:disabled {
  opacity: 0.25;
}

.drag-reorder-item {
  position: relative;
}

.drag-reorder-item--dragging {
  z-index: 20;
  opacity: 0.95;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.18);
}

.drag-handle {
  cursor: grab;
  touch-action: none;
  padding: 4px 8px;
  font-size: 18px;
  color: var(--hm-gray);
  user-select: none;
  flex-shrink: 0;
}

.drag-reorder-item--dragging .drag-handle {
  cursor: grabbing;
  color: var(--hm-gold-dark);
}

.ruta-orden-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ruta-orden-row {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fff;
  border: 1px solid var(--hm-line);
  border-radius: 10px;
  padding: 8px 10px;
}

.ruta-orden-row--done {
  background: #f3f7f4;
  border-color: #cfe0d4;
}

.ruta-orden-num {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--hm-black);
  color: var(--hm-gold);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
}

.ruta-orden-nombre {
  font-size: 14px;
  font-weight: 600;
}

.linea-original {
  font-size: 11.5px;
  color: var(--hm-gray);
  font-style: italic;
}

.linea-cantidad-row {
  display: flex;
  gap: 6px;
  align-items: center;
}

.linea-cantidad-row .field-input--compact {
  margin: 0;
  flex: 1;
  min-width: 0;
}

/* ---------- Producción ---------- */
.production-form {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.field-row--3 {
  grid-template-columns: 1fr 1fr 1fr;
}

.production-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 10px;
}

.production-row {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #fff;
  border: 1px solid var(--hm-line);
  border-radius: 10px;
  padding: 10px 12px;
}

.production-row-date {
  font-size: 12px;
  color: var(--hm-gold-dark);
  flex-shrink: 0;
}

.production-row-body {
  flex: 1;
}

.production-row-name {
  font-weight: 700;
  font-size: 14px;
}

.product-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 12px 0;
  max-height: 240px;
  overflow-y: auto;
}

.product-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--hm-paper);
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 13.5px;
}

/* ---------- Week navigator (Driver view) ---------- */
.week-nav {
  display: flex;
  align-items: center;
  gap: 4px;
  background: var(--hm-black);
  padding: 8px 10px;
  flex-shrink: 0;
  border-bottom: 1px solid rgba(250, 247, 242, 0.1);
}

.week-nav-days {
  display: flex;
  gap: 4px;
  flex: 1;
  overflow-x: auto;
}

.week-day {
  flex: 1;
  min-width: 40px;
  background: transparent;
  border: 1px solid rgba(250, 247, 242, 0.15);
  border-radius: 10px;
  padding: 6px 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  color: var(--hm-paper);
}

.week-day-label {
  font-size: 10px;
  color: rgba(250, 247, 242, 0.55);
  text-transform: uppercase;
}

.week-day-num {
  font-size: 13px;
  font-weight: 700;
}

.week-day-count {
  font-size: 9.5px;
  color: var(--hm-gold);
}

.week-day--active {
  background: var(--hm-gold);
  border-color: var(--hm-gold);
}

.week-day--active .week-day-label,
.week-day--active .week-day-num {
  color: var(--hm-black);
}

.week-day--active .week-day-count {
  color: var(--hm-black);
}

.week-day--done:not(.week-day--active) {
  border-color: var(--hm-green);
}

.week-day--done:not(.week-day--active) .week-day-count {
  color: var(--hm-green);
}

.week-nav .btn-icon {
  color: var(--hm-paper);
  font-size: 20px;
  padding: 4px 6px;
}

.week-today-btn {
  color: var(--hm-gold);
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}
/* ---------- Weekly client status ---------- */
.weekly-status {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.weekly-status-nav {
  display: flex;
  align-items: center;
  gap: 10px;
}

.weekly-status-range {
  font-weight: 700;
  font-size: 14px;
  flex: 1;
  text-align: center;
}

.weekly-status-legend {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  font-size: 12px;
  color: var(--hm-gray);
}

.weekly-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 2px;
}

.weekly-dot--rojo { background: #c0392b; }
.weekly-dot--naranja { background: #e08a1e; }
.weekly-dot--verde { background: #2f7a4d; }
.weekly-dot--gris { background: #aaa; }

.weekly-status-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.weekly-status-row {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #fff;
  border: 1px solid var(--hm-line);
  border-radius: 10px;
  padding: 10px 12px;
}

.weekly-status-row-body {
  flex: 1;
}

.weekly-status-row-name {
  font-weight: 700;
  font-size: 14px;
}

/* ---------- Signature pad ---------- */
.signature-modal {
  width: 100%;
  max-width: 420px;
}

.signature-hint {
  font-size: 13px;
  color: var(--hm-gray);
  margin: 0 0 10px;
}

.signature-canvas-wrap {
  position: relative;
  border: 1.5px dashed var(--hm-line);
  border-radius: 10px;
  overflow: hidden;
  background: #fff;
}

.signature-canvas {
  width: 100%;
  height: 220px;
  touch-action: none;
  display: block;
}

.signature-placeholder {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: var(--hm-line);
  font-size: 14px;
  pointer-events: none;
}

.modal-actions--spread {
  justify-content: space-between;
  margin-top: 12px;
}

.field-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.field-row .field-input {
  margin-bottom: 4px;
}

.btn-ghost--dark {
  border-color: var(--hm-line);
  color: var(--hm-black);
}

.btn-primary--small {
  padding: 10px 18px;
  font-size: 14px;
  width: auto;
}
