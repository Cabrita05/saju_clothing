// Formulario de pedidos al por mayor y personalizados.
// No envía datos a ningún servidor: arma un mensaje para WhatsApp.
const $ = (id) => document.getElementById(id);
const form = $("solicitud");
const resultado = $("resultado");

function marcar(campo, idError, hayError) {
  $(idError).hidden = !hayError;
  if (campo) campo.setAttribute("aria-invalid", String(hayError));
  return hayError;
}

// Los límites del HTML se pueden saltar, así que se repiten aquí.
const recortar = (campo, max) => campo.value.replace(/\s+/g, " ").trim().slice(0, max);
function cantidadValida() {
  const n = Number(form.cantidad.value);
  return Number.isInteger(n) && n >= 1 && n <= 100000;
}

function validar() {
  const prendas = form.querySelectorAll('[name="prendas"]:checked').length;
  const errores = [
    marcar(form.nombre, "nombre-error", !form.nombre.value.trim()) && form.nombre,
    marcar(form.ciudad, "ciudad-error", !form.ciudad.value.trim()) && form.ciudad,
    marcar(form.cantidad, "cantidad-error", !cantidadValida()) && form.cantidad,
    marcar(null, "prendas-error", prendas === 0) && form.querySelector('[name="prendas"]'),
  ].filter(Boolean);
  if (errores.length) errores[0].focus();
  return errores.length === 0;
}

function mensaje() {
  const prendas = [...form.querySelectorAll('[name="prendas"]:checked')].map((c) => c.value).join(", ");
  const negocio = recortar(form.negocio, 80);
  const detalles = recortar(form.detalles, 600);
  return [
    "¡Hola Saju! Quiero cotizar un pedido especial:",
    "",
    `• Tipo: ${form.tipo.value}`,
    `• Nombre: ${recortar(form.nombre, 80)}`,
    negocio ? `• Negocio: ${negocio}` : null,
    `• Ciudad de entrega: ${recortar(form.ciudad, 60)}`,
    `• Prendas: ${prendas}`,
    `• Cantidad aproximada: ${Number(form.cantidad.value)}`,
    detalles ? `• Detalles: ${detalles}` : null,
    "",
    "¿Me cuentan precios, mínimos y tiempos de entrega?",
  ].filter((x) => x !== null).join("\n");
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!validar()) return;
  const texto = mensaje();
  $("resultado-texto").textContent = texto;
  $("resultado-enviar").href = enlaceWhatsApp(texto);
  $("resultado-ayuda").textContent = WHATSAPP_NUMERO
    ? "Se abrirá WhatsApp con este mensaje ya escrito; solo tienes que enviarlo."
    : "Al tocar el botón copiamos este mensaje: pégalo en el chat de WhatsApp que se abre.";
  form.hidden = true;
  resultado.hidden = false;
  resultado.focus();
});

// Quita el aviso de error apenas la persona corrige el campo.
form.addEventListener("input", (e) => {
  if (e.target.name === "prendas") marcar(null, "prendas-error", false);
  else if ($(e.target.id + "-error")) marcar(e.target, e.target.id + "-error", false);
});

function copiar(aviso) {
  if (!navigator.clipboard) return;
  navigator.clipboard.writeText($("resultado-texto").textContent).then(() => avisar(aviso), () => {});
}
$("resultado-copiar").addEventListener("click", () => copiar("Texto copiado"));
$("resultado-enviar").addEventListener("click", () => { if (!WHATSAPP_NUMERO) copiar("Mensaje copiado: pégalo en el chat"); });
$("resultado-editar").addEventListener("click", () => {
  resultado.hidden = true;
  form.hidden = false;
  form.nombre.focus();
});

let reloj;
function avisar(texto) {
  const aviso = $("aviso");
  aviso.textContent = texto;
  aviso.classList.add("is-on");
  clearTimeout(reloj);
  reloj = setTimeout(() => aviso.classList.remove("is-on"), 2200);
}
