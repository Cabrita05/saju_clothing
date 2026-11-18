// ============================================================
//  PORTADA: colección con pestañas y carrusel.
//  El catálogo, el carrito y la guía de tallas están en tienda.js.
// ============================================================
const track = $("productos");
const tabs = [...document.querySelectorAll(".tab")];
let categoriaActual = "pantalones";

function pintarColeccion(cat) {
  categoriaActual = cat;
  track.innerHTML = catalogo
    .filter((p) => p.categoria === cat)
    .map((p) => {
      const url = esc(enlacePrenda(p.id));
      const foto = p.foto
        ? `<img src="${esc(p.foto)}" alt="" loading="lazy">`
        : `${SILUETAS[cat]}<span class="card__chip">Muy pronto</span>`;
      const tallas = TALLAS.map((t) => `<button data-talla="${esc(t)}" aria-label="Agregar talla ${esc(t)}">${esc(t)}</button>`).join("");
      return `<li class="card${p.foto ? " card--foto" : ""}" data-id="${esc(p.id)}">
        <div class="card__photo">
          <a class="card__link" href="${url}" tabindex="-1" aria-hidden="true">${foto}</a>
          <div class="card__sizes"><span>Elige tu talla</span><div>${tallas}</div><button class="card__guide" data-abrir-tallas>Guía de tallas</button></div>
        </div>
        <div class="card__info">
          <div><a class="card__name" href="${url}">${esc(p.nombre)}</a><p class="card__price">${precioTexto(p)}</p></div>
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

// Arranque: se pinta de inmediato con lo provisional y se actualiza al llegar
// el catálogo en línea.
pintarColeccion(categoriaActual);
iniciarTienda(() => pintarColeccion(categoriaActual));

// ============================================================
//  Aparición suave de las secciones al hacer scroll
// ============================================================
const revelar = document.querySelectorAll(".collection__head, .carousel, .story__text, .story__collage, .steps h2, .steps__list li, .wholesale, .footer h2");
if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver(
    (entradas) => entradas.forEach((e) => e.isIntersecting && (e.target.classList.add("is-in"), io.unobserve(e.target))),
    { threshold: 0.15 }
  );
  revelar.forEach((el) => (el.classList.add("reveal"), io.observe(el)));
}
