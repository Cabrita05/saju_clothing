// ============================================================
//  CONFIGURACIÓN COMPARTIDA (la usan todas las páginas)
// ============================================================
// POR LLENAR: número de WhatsApp del negocio, con indicativo del país y sin +
// ni espacios (ejemplo: "573001234567"). Con el número puesto, los botones
// abren el chat con el mensaje ya escrito. Mientras esté vacío, abren el link
// general y copian el mensaje para que el cliente lo pegue en el chat.
const WHATSAPP_NUMERO = "";
const WHATSAPP_LINK = "https://wa.link/e0p7is";

// POR LLENAR: conexión con Supabase (catálogo en línea y panel de administrador).
// Están en Supabase → Project Settings → API. La clave que va aquí es la
// PÚBLICA ("anon" o "publishable"): está pensada para verse en la página.
// NUNCA pegues aquí la clave "service_role" ni una "secret".
const SUPABASE_URL = "";
const SUPABASE_KEY = "";

const supabaseListo = () =>
  /^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(SUPABASE_URL) && SUPABASE_KEY.length > 20 && !/service_role|sb_secret/.test(SUPABASE_KEY);

// Petición a Supabase. `token` es la sesión del administrador (si hay).
async function supa(ruta, { metodo = "GET", cuerpo, token, cabeceras = {} } = {}) {
  const h = { apikey: SUPABASE_KEY, ...cabeceras };
  if (token) h.Authorization = "Bearer " + token;
  let body = cuerpo;
  if (cuerpo !== undefined && !(cuerpo instanceof Blob)) {
    h["Content-Type"] = "application/json";
    body = JSON.stringify(cuerpo);
  }
  const r = await fetch(SUPABASE_URL + ruta, { method: metodo, headers: h, body });
  const texto = await r.text();
  let datos = null;
  try { datos = texto ? JSON.parse(texto) : null; } catch (_) {}
  if (!r.ok) {
    const e = new Error((datos && (datos.msg || datos.message || datos.error_description)) || "Error " + r.status);
    e.status = r.status;
    throw e;
  }
  return datos;
}

const RUTA_FOTOS = "/storage/v1/object/public/fotos/";
// Solo se muestran fotos del propio sitio o de la carpeta de fotos de Supabase.
function fotoSegura(u) {
  if (typeof u !== "string" || u.length > 500) return null;
  if (/^assets\/[\w\-./]+$/.test(u) && !u.includes("..")) return u;
  if (supabaseListo() && u.startsWith(SUPABASE_URL + RUTA_FOTOS) && !u.includes("..")) return u;
  return null;
}

// Convierte un texto en HTML seguro antes de insertarlo en la página.
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

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

// Menú desplegable en celular.
(() => {
  const boton = document.querySelector(".nav__toggle");
  const enlaces = document.querySelector(".nav__links");
  if (!boton || !enlaces) return;
  const cerrar = () => { enlaces.classList.remove("is-open"); boton.setAttribute("aria-expanded", "false"); };
  boton.addEventListener("click", () => {
    boton.setAttribute("aria-expanded", String(enlaces.classList.toggle("is-open")));
  });
  enlaces.addEventListener("click", (e) => e.target.closest("a") && cerrar());
  document.addEventListener("keydown", (e) => e.key === "Escape" && cerrar());
})();
