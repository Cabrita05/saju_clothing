// ============================================================
//  PÁGINA DE UNA PRENDA (producto.html?id=...)
//  El catálogo, el carrito y la tabla de tallas están en tienda.js.
// ============================================================
const idPrenda = new URLSearchParams(location.search).get("id") || "";
let tallaElegida = null;
let cantidad = 1;

function pintarPrenda(finalizado) {
  const p = buscar(idPrenda);

  // Mientras llega el catálogo en línea, una prenda real puede no estar aún.
  if (!p) {
    if (!finalizado) return;
    $("p-contenido").hidden = true;
    document.querySelector(".pdp__guide").hidden = true;
    document.querySelector(".pdp__more").hidden = true;
    $("p-no-existe").hidden = false;
    $("p-ruta-nombre").textContent = "No encontrada";
    document.title = "Prenda no encontrada · SAJU";
    return;
  }

  const categoria = NOMBRE_CATEGORIA[p.categoria];
  document.title = `${p.nombre} · SAJU`;
  $("p-ruta-nombre").textContent = p.nombre;
  $("p-categoria-enlace").textContent = categoria;
  $("p-categoria").textContent = categoria;
  $("p-nombre").textContent = p.nombre;
  $("p-precio").textContent = precioTexto(p);

  const foto = $("p-foto");
  foto.classList.toggle("pdp__photo--real", !!p.foto);
  foto.innerHTML = p.foto
    ? `<img src="${esc(p.foto)}" alt="${esc(p.nombre)}">`
    : `${SILUETAS[p.categoria]}<span class="pdp__soon">Foto por llegar</span>`;

  // Descripción: viene del panel de administrador; sin ella se muestra el aviso.
  $("p-descripcion").innerHTML = p.descripcion
    ? `<p>${esc(p.descripcion)}</p>`
    : `<p class="draft">Descripción de la prenda: tela, corte y detalles. Se escribe desde el panel de administrador.</p><span class="tag">Descripción por llenar</span>`;

  $("p-tallas").innerHTML = TALLAS.map(
    (t) => `<button type="button" class="pdp__size" data-talla="${esc(t)}" aria-pressed="${t === tallaElegida}">${esc(t)}</button>`
  ).join("");

  pintarPregunta();
  pintarRelacionadas(p);
}

function pintarPregunta() {
  const p = buscar(idPrenda);
  if (!p) return;
  const texto = `¡Hola Saju! Quiero preguntar por: ${p.nombre}${tallaElegida ? `, talla ${tallaElegida}` : ""}. ¿Está disponible?`;
  $("p-preguntar").href = enlaceWhatsApp(texto);
  $("p-preguntar").dataset.mensaje = texto;
}

function pintarRelacionadas(p) {
  const otras = catalogo.filter((x) => x.categoria === p.categoria && x.id !== p.id).slice(0, 4);
  $("p-relacionadas").innerHTML = otras
    .map((x) => {
      const foto = x.foto ? `<img src="${esc(x.foto)}" alt="" loading="lazy">` : SILUETAS[x.categoria];
      return `<li><a class="mini" href="${esc(enlacePrenda(x.id))}">
        <span class="mini__photo${x.foto ? " mini__photo--real" : ""}">${foto}</span>
        <span class="mini__name">${esc(x.nombre)}</span>
        <span class="mini__price">${precioTexto(x)}</span>
      </a></li>`;
    })
    .join("");
  document.querySelector(".pdp__more").hidden = otras.length === 0;
}

// Elegir talla
$("p-tallas").addEventListener("click", (e) => {
  const b = e.target.closest("[data-talla]");
  if (!b || !TALLAS.includes(b.dataset.talla)) return;
  tallaElegida = b.dataset.talla;
  $("p-tallas").querySelectorAll("[data-talla]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
  $("p-talla-error").hidden = true;
  pintarPregunta();
});

// Cantidad
function pintarCantidad() { $("p-cantidad").textContent = cantidad; }
$("p-menos").addEventListener("click", () => { cantidad = Math.max(1, cantidad - 1); pintarCantidad(); });
$("p-mas").addEventListener("click", () => { cantidad = Math.min(MAX_UNIDADES, cantidad + 1); pintarCantidad(); });

// Agregar al carrito
$("p-agregar").addEventListener("click", () => {
  if (!tallaElegida) {
    $("p-talla-error").hidden = false;
    $("p-tallas").querySelector("[data-talla]").focus();
    return;
  }
  agregar(idPrenda, tallaElegida, cantidad);
  cantidad = 1;
  pintarCantidad();
});

// Sin número configurado, la pregunta viaja en el portapapeles.
$("p-preguntar").addEventListener("click", (e) => {
  if (WHATSAPP_NUMERO || !navigator.clipboard) return;
  navigator.clipboard.writeText(e.currentTarget.dataset.mensaje || "").then(() => avisar("Mensaje copiado: pégalo en el chat"), () => {});
});

pintarPrenda(false);
iniciarTienda(() => pintarPrenda(true));
