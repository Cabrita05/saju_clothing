// ============================================================
//  PRODUCTOS — CAMPOS POR LLENAR
//  Para publicar una prenda: pon su nombre, precio y la ruta de la foto
//  (por ejemplo foto: "assets/pantalon-rosa.jpg"). Con foto: null se
//  muestra el espacio "Muy pronto".
// ============================================================
const WHATSAPP = "https://wa.link/e0p7is";

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

const track = document.getElementById("productos");
const tabs = [...document.querySelectorAll(".tab")];

function precio(p) {
  return p == null ? "Precio por definir" : "$" + p.toLocaleString("es-CO");
}

function pintar(cat) {
  track.innerHTML = PRODUCTOS[cat]
    .map((p, i) => {
      const foto = p.foto
        ? `<img src="${p.foto}" alt="${p.nombre}" loading="lazy">`
        : `${SILUETAS[cat]}<span class="card__chip">Muy pronto</span>`;
      return `<li class="card" style="animation-delay:${i * 60}ms">
        <div class="card__photo">${foto}</div>
        <div class="card__info">
          <div><p class="card__name">${p.nombre}</p><p class="card__price">${precio(p.precio)}</p></div>
          <a class="btn" href="${WHATSAPP}" target="_blank" rel="noopener">Pedir</a>
        </div>
      </li>`;
    })
    .join("");
  track.scrollLeft = 0;
}

tabs.forEach((tab) =>
  tab.addEventListener("click", () => {
    tabs.forEach((t) => t.setAttribute("aria-selected", String(t === tab)));
    pintar(tab.dataset.cat);
  })
);

document.querySelectorAll(".carousel__btn").forEach((btn) =>
  btn.addEventListener("click", () => {
    const card = track.querySelector(".card");
    const paso = card ? card.offsetWidth + 24 : 240;
    track.scrollBy({ left: paso * Number(btn.dataset.dir), behavior: "smooth" });
  })
);

pintar("pantalones");

// Aparición suave de las secciones al hacer scroll.
const revelar = document.querySelectorAll(".collection__head, .carousel, .story__text, .story__collage, .steps h2, .steps__list li, .footer h2");
if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver(
    (entradas) => entradas.forEach((e) => e.isIntersecting && (e.target.classList.add("is-in"), io.unobserve(e.target))),
    { threshold: 0.15 }
  );
  revelar.forEach((el) => (el.classList.add("reveal"), io.observe(el)));
}
