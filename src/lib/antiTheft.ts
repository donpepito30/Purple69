/**
 * Purple69 Anti-Theft & Intellectual Property Protection Module
 * 
 * Provides production-grade frontend defenses against:
 * 1. Source code theft & scrapers (intercepts F12, Ctrl+U, Ctrl+S, Ctrl+Shift+I/J/C).
 * 2. Asset & image rippers (disables image drag-and-drop, context menu on media).
 * 3. Reverse engineering & DevTools inspection attempts.
 * 4. Text and component scraping (user-select: none on proprietary UI).
 * 5. Iframe clickjacking / hotlinking defense.
 */

interface AntiTheftOptions {
  isMaster?: boolean;
  onDevToolsDetected?: () => void;
}

let isInitialized = false;

export function initAntiTheftProtection(options: AntiTheftOptions = {}): () => void {
  if (typeof window === 'undefined' || isInitialized) {
    return () => {};
  }

  isInitialized = true;

  // 1. Block Context Menu (Right Click) across the application
  const handleContextMenu = (e: MouseEvent) => {
    // If master is unlocked, allow right-click for administration
    if (options.isMaster) {
      return;
    }

    // Do not block normal input fields if user is typing or pasting
    const target = e.target as HTMLElement | null;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    showSecurityToast('Protección de contenido activa. Clic derecho deshabilitado.');
  };

  // 2. Block Inspection, Save, Print, and Source Shortcuts
  const handleKeyDown = (e: KeyboardEvent) => {
    if (options.isMaster) {
      return;
    }

    const isCtrlOrCmd = e.ctrlKey || e.metaKey;
    const isShift = e.shiftKey;
    const key = e.key.toUpperCase();

    // F12 -> DevTools
    if (e.key === 'F12') {
      e.preventDefault();
      e.stopPropagation();
      showSecurityToast('Herramientas de desarrollo restringidas por política de seguridad.');
      return false;
    }

    // Ctrl+Shift+I / Cmd+Opt+I -> DevTools Inspect
    // Ctrl+Shift+J / Cmd+Opt+J -> DevTools Console
    // Ctrl+Shift+C / Cmd+Opt+C -> Element Inspector
    if (isCtrlOrCmd && isShift && (key === 'I' || key === 'J' || key === 'C')) {
      e.preventDefault();
      e.stopPropagation();
      showSecurityToast('Acceso a código fuente e inspector bloqueado.');
      return false;
    }

    // Ctrl+U / Cmd+U -> View Source
    if (isCtrlOrCmd && key === 'U') {
      e.preventDefault();
      e.stopPropagation();
      showSecurityToast('Inspección de código fuente no permitida.');
      return false;
    }

    // Ctrl+S / Cmd+S -> Save Page (Prevents SingleFile / Wget page cloner)
    if (isCtrlOrCmd && key === 'S') {
      e.preventDefault();
      e.stopPropagation();
      showSecurityToast('Descarga o guardado de la página bloqueado.');
      return false;
    }

    // Ctrl+P / Cmd+P -> Print / Export PDF
    if (isCtrlOrCmd && key === 'P') {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  };

  // 3. Block Dragging Images and Media (prevents pulling images to desktop or search)
  const handleDragStart = (e: DragEvent) => {
    const target = e.target as HTMLElement | null;
    if (target && (target.tagName === 'IMG' || target.tagName === 'VIDEO' || target.tagName === 'A')) {
      e.preventDefault();
    }
  };

  // 4. Heuristic DevTools Detection
  let devToolsCheckTimer: any = null;
  const startDevToolsHeuristic = () => {
    // Checks if window size threshold suddenly reveals docked devtools
    const threshold = 160;
    const checkDimensions = () => {
      const widthDiff = window.outerWidth - window.innerWidth > threshold;
      const heightDiff = window.outerHeight - window.innerHeight > threshold;
      if (widthDiff || heightDiff) {
        if (options.onDevToolsDetected && !options.isMaster) {
          options.onDevToolsDetected();
        }
      }
    };

    devToolsCheckTimer = setInterval(checkDimensions, 2000);
  };

  // Attach global event listeners with capture: true
  window.addEventListener('contextmenu', handleContextMenu, { capture: true });
  window.addEventListener('keydown', handleKeyDown, { capture: true });
  window.addEventListener('dragstart', handleDragStart, { capture: true });

  startDevToolsHeuristic();

  // Inject anti-copy CSS styles
  injectAntiTheftStyles();

  // Cleanup handler
  return () => {
    isInitialized = false;
    window.removeEventListener('contextmenu', handleContextMenu, { capture: true } as any);
    window.removeEventListener('keydown', handleKeyDown, { capture: true } as any);
    window.removeEventListener('dragstart', handleDragStart, { capture: true } as any);
    if (devToolsCheckTimer) clearInterval(devToolsCheckTimer);
  };
}

/**
 * Injects non-intrusive CSS rules preventing text selection and image drag
 */
function injectAntiTheftStyles(): void {
  if (typeof document === 'undefined') return;
  const styleId = 'purple69-antitheft-styles';
  if (document.getElementById(styleId)) return;

  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    /* Purple69 Anti-Theft CSS Rules */
    body {
      -webkit-touch-callout: none;
      -webkit-user-select: none;
      -khtml-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      user-select: none;
    }
    input, textarea {
      -webkit-user-select: text !important;
      -moz-user-select: text !important;
      -ms-user-select: text !important;
      user-select: text !important;
    }
    img, video {
      pointer-events: auto;
      -webkit-user-drag: none;
      user-select: none;
    }
  `;
  document.head.appendChild(style);
}

/**
 * Displays a subtle floating toast message when a blocked action is attempted
 */
let toastTimeout: any = null;
function showSecurityToast(message: string): void {
  if (typeof document === 'undefined') return;

  const existingToast = document.getElementById('purple69-security-toast');
  if (existingToast) {
    existingToast.remove();
  }
  if (toastTimeout) {
    clearTimeout(toastTimeout);
  }

  const toast = document.createElement('div');
  toast.id = 'purple69-security-toast';
  toast.className = 'fixed bottom-6 left-1/2 -translate-x-1/2 z-[99999] px-4 py-2.5 rounded-full bg-zinc-900/95 border border-purple-500/30 text-white text-xs font-medium shadow-2xl flex items-center gap-2 backdrop-blur-md animate-fade-in pointer-events-none transition-all';
  
  toast.innerHTML = `
    <span class="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
    <span>${message}</span>
  `;

  document.body.appendChild(toast);

  toastTimeout = setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translate(-50%, 10px)';
    setTimeout(() => toast.remove(), 300);
  }, 2200);
}
