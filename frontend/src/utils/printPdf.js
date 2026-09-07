import { Printer } from '@capgo/capacitor-printer';
import { Capacitor } from '@capacitor/core';

/**
 * Utilidad segura de exportación e impresión PDF para Web y APK Android (Capacitor).
 * En APK de Android utiliza @capgo/capacitor-printer que conecta directamente con
 * el PrintManager nativo del sistema operativo ("Guardar como PDF / Imprimir") sin
 * desviar el WebView ni bloquear la app.
 * En Web de escritorio abre una ventana de impresión limpia sin alterar la sesión del usuario.
 */

export const printHtmlContent = async (title, htmlBody) => {
  const fullHtml = `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title || 'MIVOR.ai - Documento Clínico'}</title>
    <style>
      @page { size: auto; margin: 15mm; }
      body { 
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; 
        color: #0f172a; 
        line-height: 1.5; 
        padding: 24px; 
        margin: 0;
        background: #ffffff;
      }
      .header { text-align: center; border-bottom: 2px solid #00a896; padding-bottom: 16px; margin-bottom: 24px; }
      .header h1 { color: #0b1a30; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
      .header .brand { color: #00a896; }
      .header p { color: #64748b; margin: 4px 0 0 0; font-size: 13px; font-weight: 500; }
      h2 { color: #0f172a; margin-top: 24px; font-size: 16px; font-weight: 700; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
      .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 20px; }
      .label { color: #64748b; font-size: 0.75em; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 2px; }
      .value { font-weight: 700; font-size: 14px; color: #0f172a; }
      .badge { display: inline-block; padding: 4px 10px; background-color: #f1f5f9; border-radius: 8px; font-size: 12px; margin-right: 6px; margin-bottom: 6px; font-weight: 600; }
      .alert-badge { background-color: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; }
      .med-badge { background-color: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; }
      .referral-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 14px; margin: 16px 0; }
      table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; }
      th, td { border: 1px solid #e2e8f0; padding: 8px 12px; text-align: left; }
      th { background: #f8fafc; font-weight: 700; color: #334155; }
      .footer { margin-top: 40px; text-align: center; font-size: 0.75em; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px; }
    </style>
  </head>
  <body>
    ${htmlBody}
  </body>
</html>`;

  // 1. En entornos nativos (Android / iOS):
  if (Capacitor.isNativePlatform()) {
    try {
      await Printer.printHtml({
        name: title || 'MIVOR Document',
        html: fullHtml,
      });
      return;
    } catch (err) {
      console.warn("Fallo Printer nativo de Capacitor:", err);
    }
  }

  // 2. En entorno Web de escritorio:
  // Abrir ventana emergente o nueva pestaña para imprimir de manera segura y limpia
  try {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(fullHtml);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        try {
          printWindow.print();
        } catch (e) {
          console.warn("Error ejecutando print() en nueva ventana:", e);
        }
      }, 300);
      return;
    }
  } catch (e) {
    console.warn("Fallo al abrir ventana de impresión web:", e);
  }

  // Fallback con iframe
  try {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(fullHtml);
    doc.close();
    iframe.contentWindow.focus();
    setTimeout(() => {
      try {
        iframe.contentWindow.print();
      } catch (e) {}
      setTimeout(() => {
        try {
          if (iframe && iframe.parentNode) document.body.removeChild(iframe);
        } catch (e) {}
      }, 2000);
    }, 300);
  } catch (e) {
    console.error("Error al exportar documento:", e);
  }
};
