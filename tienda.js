// ============================================================
//  TIENDA (compartido entre index.html y producto.html)
//  Catálogo, carrito, guía de tallas y avisos.
// ============================================================

// Tallas disponibles. POR CONFIRMAR con Saju.
const TALLAS = ["S", "M", "L", "XL"];

// CAMPOS POR LLENAR: medidas del cuerpo en centímetros para cada talla.
// Escribe el número (por ejemplo 88) o un rango entre comillas ("86-90").
// Mientras haya alguna en null, la guía muestra "Medidas por llenar".
const GUIA_MEDIDAS = {
  S:  { busto: null, cintura: null, cadera: null, largo: null },
  M:  { busto: null, cintura: null, cadera: null, largo: null },
  L:  { busto: null, cintura: null, cadera: null, largo: null },
  XL: { busto: null, cintura: null, cadera: null, largo: null },
};

const CATEGORIAS = ["pantalones", "camisas", "togas"];
const NOMBRE_CATEGORIA = { pantalones: "Pantalones", camisas: "Camisas", togas: "Togas" };
const MAX_UNIDADES = 99; // tope por prenda, para que nadie arme pedidos absurdos

// ============================================================
//  CATÁLOGO
//  Con Supabase conectado (config.js), los productos se administran desde
//  admin.html y esta lista solo rellena las categorías que aún estén vacías.
//  Sin Supabase, la página muestra esta lista tal cual.
// ============================================================
const NOMBRES = { pantalones: "Pantalón", camisas: "Camisa", togas: "Toga" };
// Espacios "Muy pronto": cinco por categoría.
const PROVISIONALES = CATEGORIAS.flatMap((cat) =>
  [1, 2, 3, 4, 5].map((n) => ({ id: `${cat}-${n - 1}`, categoria: cat, nombre: `${NOMBRES[cat]} 0${n}`, precio: null, foto: null, descripcion: null }))
);

let catalogo = PROVISIONALES;

// Trae los productos publicados. Si algo falla, la tienda sigue con los provisionales.
async function cargarCatalogo() {
  if (!supabaseListo()) return;
  try {
    const filas = await Promise.race([
      supa("/rest/v1/productos?select=id,categoria,nombre,precio,foto_url,descripcion&publicado=is.true&order=orden.asc,creado.asc&limit=200"),
      new Promise((_, rechazar) => setTimeout(() => rechazar(new Error("tiempo agotado")), 7000)),
    ]);
    if (!Array.isArray(filas)) return;
    const reales = filas
      .filter((f) => f && typeof f.id === "string" && CATEGORIAS.includes(f.categoria) && typeof f.nombre === "string")
      .map((f) => ({
        id: f.id,
        categoria: f.categoria,
        nombre: f.nombre.slice(0, 80),
        precio: Number.isInteger(f.precio) && f.precio >= 0 ? f.precio : null,
        foto: fotoSegura(f.foto_url),
        descripcion: typeof f.descripcion === "string" && f.descripcion.trim() ? f.descripcion.slice(0, 600) : null,
      }));
    catalogo = CATEGORIAS.flatMap((cat) => {
      const deCat = reales.filter((p) => p.categoria === cat);
      return deCat.length ? deCat : PROVISIONALES.filter((p) => p.categoria === cat);
    });
  } catch (_) { /* se queda con los provisionales */ }
}

// Siluetas que ocupan el lugar de la foto mientras llega.
const SILUETAS = {
  pantalones: '<svg viewBox="0 0 60 90" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M12 6h36l5 78H35L30 30l-5 54H7z"/><path d="M12 14h36M30 14v16" stroke-dasharray="3 3"/></svg>',
  camisas: '<svg viewBox="0 0 80 80" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M28 8l12 10L52 8l22 12-8 16-8-4v40H22V32l-8 4-8-16z"/><path d="M40 18v54" stroke-dasharray="3 3"/></svg>',
  togas: '<svg viewBox="0 0 80 100" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M28 6l12 22L52 6l22 12-6 34-8-3 4 45H16l4-45-8 3-6-34z"/><path d="M40 28v66M21 52h38" stroke-dasharray="3 3"/></svg>',
};

const $ = (id) => document.getElementById(id);
const pesos = (n) => "$" + n.toLocaleString("es-CO");
const precioTexto = (p) => (p.precio == null ? "Precio por definir" : pesos(p.precio));
const buscar = (id) => catalogo.find((p) => p.id === id) || null;
const enlacePrenda = (id) => "producto.html?id=" + encodeURIComponent(id);

// ============================================================
//  GUÍA DE TALLAS
// ============================================================
function tablaTallas() {
  const medida = (v) => (v == null || v === "" ? "—" : esc(v));
  const filas = TALLAS.map((t) => {
    const m = GUIA_MEDIDAS[t] || {};
    return `<tr><th scope="row">${esc(t)}</th><td>${medida(m.busto)}</td><td>${medida(m.cintura)}</td><td>${medida(m.cadera)}</td><td>${medida(m.largo)}</td></tr>`;
  }).join("");
  return `<table class="sizes__table">
    <thead><tr><th scope="col">Talla</th><th scope="col">Busto</th><th scope="col">Cintura</th><th scope="col">Cadera</th><th scope="col">Largo pantalón</th></tr></thead>
    <tbody>${filas}</tbody>
  </table>`;
}

const medidasCompletas = () => TALLAS.every((t) => GUIA_MEDIDAS[t] && Object.values(GUIA_MEDIDAS[t]).every((v) => v != null && v !== ""));

// Rellena todas las tablas de tallas de la página.
document.querySelectorAll("[data-tabla-tallas]").forEach((caja) => { caja.innerHTML = tablaTallas(); });
document.querySelectorAll("[data-tallas-pendientes]").forEach((tag) => { tag.hidden = medidasCompletas(); });

// La guía en ventana (si la página la tiene) se abre desde cualquier [data-abrir-tallas].
const guiaTallas = $("tallas");
if (guiaTallas) {
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-abrir-tallas]")) { e.preventDefault(); guiaTallas.showModal(); }
    else if (e.target.closest("[data-cerrar-tallas]") || e.target === guiaTallas) guiaTallas.close();
  });
}

// ============================================================
//  CARRITO (se guarda en este navegador)
// ============================================================
const CLAVE = "saju-carrito";
let carrito = [];

// Lo guardado en el navegador puede haber sido alterado: solo se aceptan
// prendas que existen, tallas válidas y cantidades enteras dentro del tope.
function restaurarCarrito() {
  try {
    const guardado = JSON.parse(localStorage.getItem(CLAVE) || "[]");
    if (!Array.isArray(guardado)) return;
    carrito = guardado
      .filter((l) => l && typeof l.id === "string" && buscar(l.id) && TALLAS.includes(l.talla) && Number.isInteger(l.cantidad) && l.cantidad > 0)
      .slice(0, 50)
      .map((l) => ({ id: l.id, talla: l.talla, cantidad: Math.min(l.cantidad, MAX_UNIDADES) }));
  } catch (_) {}
}

function guardar() {
  try { localStorage.setItem(CLAVE, JSON.stringify(carrito)); } catch (_) {}
  pintarCarrito();
}

function agregar(id, talla, cantidad = 1) {
  const n = Math.min(Math.max(Number.isInteger(cantidad) ? cantidad : 1, 1), MAX_UNIDADES);
  if (!buscar(id) || !TALLAS.includes(talla)) return;
  const linea = carrito.find((l) => l.id === id && l.talla === talla);
  if (linea) linea.cantidad = Math.min(linea.cantidad + n, MAX_UNIDADES);
  else carrito.push({ id, talla, cantidad: n });
  guardar();
  avisar(`${buscar(id).nombre} · talla ${talla} agregado`);
}

function mensajeWhatsApp() {
  const lineas = carrito.map((l) => {
    const p = buscar(l.id);
    const precio = p.precio == null ? "" : ` (${pesos(p.precio)} c/u)`;
    return `• ${l.cantidad} × ${p.nombre}, talla ${l.talla}${precio}`;
  });
  const total = totalCarrito();
  return [
    "¡Hola Saju! Quiero cotizar este pedido:",
    "",
    ...lineas,
    "",
    total == null ? null : `Total estimado: ${pesos(total)}`,
    "¿Me confirman disponibilidad y valor del envío?",
  ].filter((x) => x !== null).join("\n");
}

// Devuelve null si alguna prenda todavía no tiene precio.
function totalCarrito() {
  let total = 0;
  for (const l of carrito) {
    const p = buscar(l.id);
    if (p.precio == null) return null;
    total += p.precio * l.cantidad;
  }
  return total;
}

function pintarCarrito() {
  const unidades = carrito.reduce((n, l) => n + l.cantidad, 0);
  const cuenta = $("carrito-cuenta");
  cuenta.textContent = unidades;
  cuenta.hidden = unidades === 0;
  $("abrir-carrito").setAttribute("aria-label", `Abrir carrito (${unidades} prendas)`);

  $("carrito-vacio").hidden = unidades > 0;
  $("carrito-pie").hidden = unidades === 0;

  $("carrito-lista").innerHTML = carrito
    .map((l, i) => {
      const p = buscar(l.id);
      const mini = p.foto ? `<img src="${esc(p.foto)}" alt="">` : SILUETAS[p.categoria];
      return `<li class="line" data-i="${i}">
        <a class="line__photo" href="${esc(enlacePrenda(p.id))}" tabindex="-1" aria-hidden="true">${mini}</a>
        <div class="line__body">
          <a class="line__name" href="${esc(enlacePrenda(p.id))}">${esc(p.nombre)}</a>
          <p class="line__meta">Talla ${esc(l.talla)} · ${p.precio == null ? "Precio por cotizar" : pesos(p.precio)}</p>
          <div class="qty">
            <button data-op="-1" aria-label="Quitar una unidad">−</button>
            <span aria-label="Cantidad">${l.cantidad}</span>
            <button data-op="1" aria-label="Agregar una unidad">+</button>
          </div>
        </div>
        <button class="line__remove" data-op="x" aria-label="Eliminar ${esc(p.nombre)} talla ${esc(l.talla)}">✕</button>
      </li>`;
    })
    .join("");

  const total = totalCarrito();
  $("carrito-total").textContent = total == null ? "Por cotizar" : pesos(total);
  $("carrito-enviar").href = enlaceWhatsApp(mensajeWhatsApp());
  $("carrito-ayuda").textContent = WHATSAPP_NUMERO
    ? "Sin pagos en línea: te confirmamos disponibilidad, precio final y envío por WhatsApp."
    : "Al tocar el botón copiamos tu pedido: pégalo en el chat de WhatsApp y te confirmamos disponibilidad, precio y envío.";
}

// Sin número configurado, el pedido viaja en el portapapeles.
$("carrito-enviar").addEventListener("click", () => {
  if (WHATSAPP_NUMERO || !navigator.clipboard) return;
  navigator.clipboard.writeText(mensajeWhatsApp()).then(() => avisar("Pedido copiado: pégalo en el chat"), () => {});
});

$("carrito-lista").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-op]");
  if (!btn) return;
  const i = Number(btn.closest(".line").dataset.i);
  if (btn.dataset.op === "x") carrito.splice(i, 1);
  else {
    carrito[i].cantidad = Math.min(carrito[i].cantidad + Number(btn.dataset.op), MAX_UNIDADES);
    if (carrito[i].cantidad <= 0) carrito.splice(i, 1);
  }
  guardar();
});

const dialogoCarrito = $("carrito");
$("abrir-carrito").addEventListener("click", () => dialogoCarrito.showModal());
$("cerrar-carrito").addEventListener("click", () => dialogoCarrito.close());
$("carrito-ver").addEventListener("click", () => dialogoCarrito.close());
$("carrito-vaciar").addEventListener("click", () => { carrito = []; guardar(); });
// Clic fuera del panel (sobre el fondo oscuro) lo cierra, y también los enlaces marcados.
dialogoCarrito.addEventListener("click", (e) => {
  if (e.target === dialogoCarrito || e.target.closest("[data-cerrar-carrito]")) dialogoCarrito.close();
});

// ============================================================
//  AVISOS
// ============================================================
let relojAviso;
function avisar(texto) {
  const aviso = $("aviso");
  aviso.textContent = texto;
  aviso.classList.add("is-on");
  clearTimeout(relojAviso);
  relojAviso = setTimeout(() => aviso.classList.remove("is-on"), 2200);
}

// Arranque común: pinta el carrito vacío de inmediato y, cuando llega el
// catálogo, restaura lo guardado y avisa a la página para que se repinte.
function iniciarTienda(alCargar) {
  pintarCarrito();
  cargarCatalogo().then(() => {
    restaurarCarrito();
    pintarCarrito();
    if (alCargar) alCargar();
  });
}
