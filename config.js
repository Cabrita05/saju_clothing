// ============================================================
//  CONFIGURACIÓN COMPARTIDA (la usan index.html y contacto.html)
// ============================================================
// POR LLENAR: número de WhatsApp del negocio, con indicativo del país y sin +
// ni espacios (ejemplo: "573001234567"). Con el número puesto, los botones
// abren el chat con el mensaje ya escrito. Mientras esté vacío, abren el link
// general y copian el mensaje para que el cliente lo pegue en el chat.
const WHATSAPP_NUMERO = "";
const WHATSAPP_LINK = "https://wa.link/e0p7is";

// Si otra web intenta mostrar esta página dentro de un marco (técnica usada
// para engañar con clics), se sale del marco.
if (window.top !== window.self) {
  try { window.top.location = window.self.location.href; } catch (_) { document.documentElement.hidden = true; }
}

// Devuelve el enlace de WhatsApp para un mensaje dado.
function enlaceWhatsApp(mensaje) {
  return WHATSAPP_NUMERO
    ? `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(mensaje)}`
    : WHATSAPP_LINK;
}
