// ============================================================
//  CONFIGURACIÓN — CAMPOS POR LLENAR
// ============================================================
// El número de WhatsApp se configura en config.js.

// Tallas disponibles. POR CONFIRMAR con Saju.
const TALLAS = ["S", "M", "L", "XL"];

// Para publicar una prenda: pon su nombre, precio (número, sin puntos) y la
// ruta de la foto, por ejemplo:
//   { nombre: "Pantalón rosa", precio: 65000, foto: "assets/pantalon-rosa.jpg" }
// Con foto: null se muestra el espacio "Muy pronto".
const PRODUCTOS = {
  pantalones: [
    { nombre: "Pantalón 01", precio: null, foto: null },
    { nombre: "Pantalón 02", precio: null, foto: null },
    { nombre: "Pantalón 03", precio: null, foto: null },
    { nombre: "Pantalón 04", precio: null, foto: null },
    { nombre: "Pantalón 05", precio: null, foto: null },
  ],
  camisas: [
    { nombre: "Camisa 01", precio: null, foto: null },
    { nombre: "Camisa 02", precio: null, foto: null },
    { nombre: "Camisa 03", precio: null, foto: null },
    { nombre: "Camisa 04", precio: null, foto: null },
    { nombre: "Camisa 05", precio: null, foto: null },
  ],
  togas: [
    { nombre: "Toga 01", precio: null, foto: null },
    { nombre: "Toga 02", precio: null, foto: null },
    { nombre: "Toga 03", precio: null, foto: null },
    { nombre: "Toga 04", precio: null, foto: null },
    { nombre: "Toga 05", precio: null, foto: null },
  ],
};

// Siluetas que ocupan el lugar de la foto mientras llega.
const SILUETAS = {
  pantalones: '<svg viewBox="0 0 60 90" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 6h36l5 78H35L30 30l-5 54H7z"/><path d="M12 14h36M30 14v16" stroke-dasharray="3 3"/></svg>',
  camisas: '<svg viewBox="0 0 80 80" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M28 8l12 10L52 8l22 12-8 16-8-4v40H22V32l-8 4-8-16z"/><path d="M40 18v54" stroke-dasharray="3 3"/></svg>',
  togas: '<svg viewBox="0 0 80 100" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M28 6l12 22L52 6l22 12-6 34-8-3 4 45H16l4-45-8 3-6-34z"/><path d="M40 28v66M21 52h38" stroke-dasharray="3 3"/></svg>',
};

const $ = (id) => document.getElementById(id);
const pesos = (n) => "$" + n.toLocaleString("es-CO");
const buscar = (id) => {
  const [cat, i] = id.split("-");
  const p = PRODUCTOS[cat] && PRODUCTOS[cat][Number(i)];
  return p ? { ...p, cat } : null;
};

// ============================================================
//  COLECCIÓN
// ============================================================
const track = $("productos");
const tabs = [...document.querySelectorAll(".tab")];

function pintarColeccion(cat) {
  track.innerHTML = PRODUCTOS[cat]
    .map((p, i) => {
      const foto = p.foto
        ? `<img src="${p.foto}" alt="${p.nombre}" loading="lazy">`
        : `${SILUETAS[cat]}<span class="card__chip">Muy pronto</span>`;
      const tallas = TALLAS.map((t) => `<button data-talla="${t}" aria-label="Agregar talla ${t}">${t}</button>`).join("");
      return `<li class="card" data-id="${cat}-${i}" style="animation-delay:${i * 60}ms">
        <div class="card__photo">${foto}
          <div class="card__sizes"><span>Elige tu talla</span><div>${tallas}</div></div>
        </div>
        <div class="card__info">
          <div><p class="card__name">${p.nombre}</p><p class="card__price">${p.precio == null ? "Precio por definir" : pesos(p.precio)}</p></div>
          <button class="btn card__add" aria-expanded="false">Agregar</button>
        </div>
      </li>`;
    })
    .join("");
  track.scrollLeft = 0;
}

tabs.forEach((tab) =>
  tab.addEventListener("click", () => {
    tabs.forEach((t) => t.setAttribute("aria-selected", String(t === tab)));
    pintarColeccion(tab.dataset.cat);
  })
);

document.querySelectorAll(".carousel__btn").forEach((btn) =>
  btn.addEventListener("click", () => {
    const card = track.querySelector(".card");
    const paso = card ? card.offsetWidth + 24 : 240;
    track.scrollBy({ left: paso * Number(btn.dataset.dir), behavior: "smooth" });
  })
);

// "Agregar" muestra las tallas sobre la foto; elegir una talla agrega al carrito.
track.addEventListener("click", (e) => {
  const card = e.target.closest(".card");
  if (!card) return;
  if (e.target.closest(".card__add")) {
    const abierta = card.classList.toggle("is-picking");
    track.querySelectorAll(".card.is-picking").forEach((c) => c !== card && c.classList.remove("is-picking"));
    card.querySelector(".card__add").setAttribute("aria-expanded", String(abierta));
    card.querySelector(".card__add").textContent = abierta ? "Cancelar" : "Agregar";
    return;
  }
  const talla = e.target.closest("[data-talla]");
  if (talla) {
    agregar(card.dataset.id, talla.dataset.talla);
    card.classList.remove("is-picking");
    card.querySelector(".card__add").textContent = "Agregar";
    card.querySelector(".card__add").setAttribute("aria-expanded", "false");
  }
});

// ============================================================
//  CARRITO (se guarda en este navegador)
// ============================================================
const CLAVE = "saju-carrito";
let carrito = [];
try {
  const guardado = JSON.parse(localStorage.getItem(CLAVE) || "[]");
  if (Array.isArray(guardado)) carrito = guardado.filter((l) => buscar(l.id) && TALLAS.includes(l.talla) && l.cantidad > 0);
} catch (_) {}

function guardar() {
  try { localStorage.setItem(CLAVE, JSON.stringify(carrito)); } catch (_) {}
  pintarCarrito();
}

function agregar(id, talla) {
  const linea = carrito.find((l) => l.id === id && l.talla === talla);
  if (linea) linea.cantidad++;
  else carrito.push({ id, talla, cantidad: 1 });
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
      const mini = p.foto ? `<img src="${p.foto}" alt="">` : SILUETAS[p.cat];
      return `<li class="line" data-i="${i}">
        <div class="line__photo">${mini}</div>
        <div class="line__body">
          <p class="line__name">${p.nombre}</p>
          <p class="line__meta">Talla ${l.talla} · ${p.precio == null ? "Precio por cotizar" : pesos(p.precio)}</p>
          <div class="qty">
            <button data-op="-1" aria-label="Quitar una unidad">−</button>
            <span aria-label="Cantidad">${l.cantidad}</span>
            <button data-op="1" aria-label="Agregar una unidad">+</button>
          </div>
        </div>
        <button class="line__remove" data-op="x" aria-label="Eliminar ${p.nombre} talla ${l.talla}">✕</button>
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
    carrito[i].cantidad += Number(btn.dataset.op);
    if (carrito[i].cantidad <= 0) carrito.splice(i, 1);
  }
  guardar();
});

const dialogo = $("carrito");
$("abrir-carrito").addEventListener("click", () => dialogo.showModal());
$("cerrar-carrito").addEventListener("click", () => dialogo.close());
$("carrito-ver").addEventListener("click", () => dialogo.close());
$("carrito-vaciar").addEventListener("click", () => { carrito = []; guardar(); });
// Clic fuera del panel (sobre el fondo oscuro) lo cierra.
dialogo.addEventListener("click", (e) => { if (e.target === dialogo) dialogo.close(); });

let relojAviso;
function avisar(texto) {
  const aviso = $("aviso");
  aviso.textContent = texto;
  aviso.classList.add("is-on");
  clearTimeout(relojAviso);
  relojAviso = setTimeout(() => aviso.classList.remove("is-on"), 2200);
}

pintarColeccion("pantalones");
pintarCarrito();

// ============================================================
//  Aparición suave de las secciones al hacer scroll
// ============================================================
const revelar = document.querySelectorAll(".collection__head, .carousel, .story__text, .story__collage, .steps h2, .steps__list li, .footer h2");
if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver(
    (entradas) => entradas.forEach((e) => e.isIntersecting && (e.target.classList.add("is-in"), io.unobserve(e.target))),
    { threshold: 0.15 }
  );
  revelar.forEach((el) => (el.classList.add("reveal"), io.observe(el)));
}
