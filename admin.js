// ============================================================
//  PANEL DE ADMINISTRADOR
//  La seguridad real está en Supabase (supabase/schema.sql): aunque alguien
//  altere este archivo, la base de datos rechaza cambios de quien no sea admin.
// ============================================================
const $ = (id) => document.getElementById(id);
const CATEGORIAS = { pantalones: "Pantalones", camisas: "Camisas", togas: "Togas" };
const TIPOS_FOTO = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const MAX_FOTO = 5 * 1024 * 1024;
const CLAVE_SESION = "saju-admin";
const pesos = (n) => "$" + n.toLocaleString("es-CO");

let sesion = null;
let productos = [];
let editando = null; // producto en edición, o null si es nuevo

// ---------- vistas ----------
function mostrar(vista) {
  for (const v of ["vista-config", "vista-login", "vista-panel"]) $(v).hidden = v !== vista;
  const dentro = vista === "vista-panel";
  $("salir").hidden = !dentro;
  $("quien").hidden = !dentro;
  $("quien").textContent = dentro && sesion ? sesion.email : "";
}

function error(id, texto) {
  $(id).textContent = texto || "";
  $(id).hidden = !texto;
}

let reloj;
function avisar(texto) {
  $("aviso").textContent = texto;
  $("aviso").classList.add("is-on");
  clearTimeout(reloj);
  reloj = setTimeout(() => $("aviso").classList.remove("is-on"), 2200);
}

// ---------- sesión ----------
// Se guarda solo mientras la pestaña esté abierta (sessionStorage).
function guardarSesion(d) {
  sesion = d && d.access_token && d.user
    ? { access_token: d.access_token, refresh_token: d.refresh_token, expira: Date.now() + (d.expires_in || 3600) * 1000, id: d.user.id, email: d.user.email || "" }
    : null;
  try {
    if (sesion) sessionStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
    else sessionStorage.removeItem(CLAVE_SESION);
  } catch (_) {}
}

async function token() {
  if (!sesion) throw Object.assign(new Error("Sin sesión"), { status: 401 });
  if (Date.now() > sesion.expira - 60000) {
    const d = await supa("/auth/v1/token?grant_type=refresh_token", { metodo: "POST", cuerpo: { refresh_token: sesion.refresh_token } });
    guardarSesion(d);
    if (!sesion) throw Object.assign(new Error("Sin sesión"), { status: 401 });
  }
  return sesion.access_token;
}

async function salir(mensaje) {
  const t = sesion && sesion.access_token;
  guardarSesion(null);
  productos = [];
  $("lista").innerHTML = "";
  mostrar("vista-login");
  error("login-error", mensaje || "");
  if (t) supa("/auth/v1/logout", { metodo: "POST", token: t }).catch(() => {});
}

// Cualquier fallo de permisos devuelve al inicio de sesión.
function manejar(e, dondeError) {
  if (e && (e.status === 401 || e.status === 403)) return salir("Tu sesión terminó o no tienes permiso. Entra de nuevo.");
  error(dondeError, "No se pudo completar: " + (e && e.message ? e.message : "error desconocido"));
}

$("login").addEventListener("submit", async (e) => {
  e.preventDefault();
  const correo = $("correo").value.trim();
  const clave = $("clave").value;
  if (!correo || !clave) return error("login-error", "Escribe tu correo y tu contraseña.");
  error("login-error", "");
  $("login-boton").disabled = true;
  try {
    const d = await supa("/auth/v1/token?grant_type=password", { metodo: "POST", cuerpo: { email: correo, password: clave } });
    guardarSesion(d);
    $("clave").value = "";
    await entrar();
  } catch (err) {
    guardarSesion(null);
    // Mensaje único a propósito: no revela si el correo existe.
    error("login-error", err.status === 429 ? "Demasiados intentos. Espera unos minutos." : "Correo o contraseña incorrectos.");
  } finally {
    $("login-boton").disabled = false;
  }
});

$("salir").addEventListener("click", () => salir());

async function entrar() {
  try {
    const t = await token();
    const fila = await supa(`/rest/v1/admins?select=user_id&user_id=eq.${encodeURIComponent(sesion.id)}`, { token: t });
    if (!Array.isArray(fila) || fila.length === 0) return salir("Esta cuenta no tiene permiso de administrador.");
    mostrar("vista-panel");
    await cargar();
  } catch (e) {
    salir(e.status === 401 || e.status === 403 ? "" : "No se pudo conectar con la base de datos.");
  }
}

// ---------- listado ----------
async function cargar() {
  error("panel-error", "");
  try {
    const filas = await supa("/rest/v1/productos?select=*&order=categoria.asc,orden.asc,creado.asc&limit=500", { token: await token() });
    productos = Array.isArray(filas) ? filas : [];
    pintar();
  } catch (e) { manejar(e, "panel-error"); }
}

function pintar() {
  $("lista").innerHTML = Object.keys(CATEGORIAS)
    .map((cat) => {
      const deCat = productos.filter((p) => p.categoria === cat);
      const filas = deCat.length
        ? deCat.map((p) => {
            const foto = fotoSegura(p.foto_url);
            return `<li class="row${p.publicado ? "" : " row--off"}" data-id="${esc(p.id)}">
              <div class="row__photo">${foto ? `<img src="${esc(foto)}" alt="">` : "<span>Sin foto</span>"}</div>
              <div class="row__body">
                <p class="row__name">${esc(p.nombre)}</p>
                <p class="row__meta">${Number.isInteger(p.precio) ? pesos(p.precio) : "Sin precio"} · ${p.publicado ? "Visible" : "Oculta"}</p>
              </div>
              <div class="row__actions">
                <button class="btn btn--ghost" data-op="ver">${p.publicado ? "Ocultar" : "Mostrar"}</button>
                <button class="btn btn--ghost" data-op="editar">Editar</button>
                <button class="btn btn--ghost" data-op="borrar" aria-label="Eliminar ${esc(p.nombre)}">Eliminar</button>
              </div>
            </li>`;
          }).join("")
        : `<li class="row row--empty">Aún no hay ${CATEGORIAS[cat].toLowerCase()}. La tienda muestra los espacios "Muy pronto".</li>`;
      return `<section class="group"><h2>${CATEGORIAS[cat]} <span>${deCat.length}</span></h2><ul>${filas}</ul></section>`;
    })
    .join("");
}

$("lista").addEventListener("click", async (e) => {
  const btn = e.target.closest("[data-op]");
  if (!btn) return;
  const p = productos.find((x) => x.id === btn.closest(".row").dataset.id);
  if (!p) return;
  if (btn.dataset.op === "editar") return abrirHoja(p);
  if (btn.dataset.op === "borrar") return pedirBorrado(p);
  if (btn.dataset.op === "ver") {
    btn.disabled = true;
    try {
      await supa(`/rest/v1/productos?id=eq.${encodeURIComponent(p.id)}`, { metodo: "PATCH", cuerpo: { publicado: !p.publicado }, token: await token() });
      avisar(p.publicado ? "Prenda oculta" : "Prenda visible");
      await cargar();
    } catch (err) { btn.disabled = false; manejar(err, "panel-error"); }
  }
});

// ---------- crear y editar ----------
const hoja = $("hoja");
const form = $("prenda");
let urlVista = null;

function vistaPrevia(src) {
  if (urlVista) { URL.revokeObjectURL(urlVista); urlVista = null; }
  const caja = $("p-vista");
  caja.textContent = "";
  if (!src) { caja.textContent = "Sin foto"; return; }
  const img = document.createElement("img");
  img.alt = "";
  img.src = src;
  caja.appendChild(img);
}

function abrirHoja(p) {
  editando = p || null;
  form.reset();
  error("prenda-error", "");
  $("hoja-titulo").textContent = p ? "Editar prenda" : "Nueva prenda";
  if (p) {
    form.categoria.value = p.categoria;
    form.nombre.value = p.nombre;
    form.precio.value = Number.isInteger(p.precio) ? p.precio : "";
    form.orden.value = Number.isInteger(p.orden) ? p.orden : 0;
    form.publicado.checked = !!p.publicado;
  }
  vistaPrevia(p ? fotoSegura(p.foto_url) : null);
  hoja.showModal();
}

$("nuevo").addEventListener("click", () => abrirHoja(null));
$("prenda-cancelar").addEventListener("click", () => hoja.close());
hoja.addEventListener("click", (e) => { if (e.target === hoja) hoja.close(); });
hoja.addEventListener("close", () => vistaPrevia(null));

function revisarFoto(archivo) {
  if (!TIPOS_FOTO[archivo.type]) return "La foto debe ser JPG, PNG o WebP.";
  if (archivo.size > MAX_FOTO) return "La foto pesa más de 5 MB.";
  return "";
}

$("p-foto").addEventListener("change", () => {
  const archivo = $("p-foto").files[0];
  if (!archivo) return vistaPrevia(editando ? fotoSegura(editando.foto_url) : null);
  const problema = revisarFoto(archivo);
  error("prenda-error", problema);
  if (problema) { $("p-foto").value = ""; return; }
  vistaPrevia(null);
  urlVista = URL.createObjectURL(archivo);
  const img = document.createElement("img");
  img.alt = "";
  img.src = urlVista;
  $("p-vista").textContent = "";
  $("p-vista").appendChild(img);
});

// Ruta dentro de la carpeta de fotos a partir de la URL pública.
const rutaDeFoto = (url) => (fotoSegura(url) && url.startsWith(SUPABASE_URL + RUTA_FOTOS) ? url.slice((SUPABASE_URL + RUTA_FOTOS).length) : null);

async function borrarFoto(url, t) {
  const ruta = rutaDeFoto(url);
  if (ruta) await supa("/storage/v1/object/fotos/" + ruta, { metodo: "DELETE", token: t }).catch(() => {});
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const nombre = form.nombre.value.replace(/\s+/g, " ").trim().slice(0, 80);
  const precioTxt = form.precio.value.trim();
  const precio = precioTxt === "" ? null : Number(precioTxt);
  const orden = Number(form.orden.value || 0);
  const archivo = $("p-foto").files[0];

  if (!nombre) return error("prenda-error", "Escribe el nombre de la prenda.");
  if (!CATEGORIAS[form.categoria.value]) return error("prenda-error", "Elige una categoría.");
  if (precio !== null && !(Number.isInteger(precio) && precio >= 0 && precio <= 100000000)) return error("prenda-error", "El precio debe ser un número entero, sin puntos ni comas.");
  if (!(Number.isInteger(orden) && orden >= 0 && orden <= 9999)) return error("prenda-error", "La posición debe ser un número entre 0 y 9999.");
  if (archivo) { const problema = revisarFoto(archivo); if (problema) return error("prenda-error", problema); }

  error("prenda-error", "");
  $("prenda-guardar").disabled = true;
  try {
    const t = await token();
    const datos = { categoria: form.categoria.value, nombre, precio, orden, publicado: form.publicado.checked };
    const fotoAnterior = editando ? editando.foto_url : null;

    if (archivo) {
      // Nombre aleatorio: no depende del nombre original del archivo.
      const ruta = `${crypto.randomUUID()}.${TIPOS_FOTO[archivo.type]}`;
      await supa("/storage/v1/object/fotos/" + ruta, { metodo: "POST", cuerpo: archivo, token: t, cabeceras: { "Content-Type": archivo.type, "Cache-Control": "max-age=31536000" } });
      datos.foto_url = SUPABASE_URL + RUTA_FOTOS + ruta;
    }

    if (editando) await supa(`/rest/v1/productos?id=eq.${encodeURIComponent(editando.id)}`, { metodo: "PATCH", cuerpo: datos, token: t });
    else await supa("/rest/v1/productos", { metodo: "POST", cuerpo: datos, token: t });

    if (archivo && fotoAnterior) await borrarFoto(fotoAnterior, t);
    hoja.close();
    avisar(editando ? "Prenda actualizada" : "Prenda agregada");
    await cargar();
  } catch (err) {
    if (err.status === 401 || err.status === 403) { hoja.close(); manejar(err, "panel-error"); }
    else error("prenda-error", "No se pudo guardar: " + err.message);
  } finally {
    $("prenda-guardar").disabled = false;
  }
});

// ---------- eliminar ----------
const confirmar = $("confirmar");
let porBorrar = null;

function pedirBorrado(p) {
  porBorrar = p;
  $("confirmar-texto").textContent = `"${p.nombre}" se quitará de la tienda y no se puede recuperar.`;
  confirmar.showModal();
}
$("confirmar-no").addEventListener("click", () => confirmar.close());
confirmar.addEventListener("click", (e) => { if (e.target === confirmar) confirmar.close(); });
$("confirmar-si").addEventListener("click", async () => {
  const p = porBorrar;
  confirmar.close();
  if (!p) return;
  try {
    const t = await token();
    await supa(`/rest/v1/productos?id=eq.${encodeURIComponent(p.id)}`, { metodo: "DELETE", token: t });
    await borrarFoto(p.foto_url, t);
    avisar("Prenda eliminada");
    await cargar();
  } catch (err) { manejar(err, "panel-error"); }
});

// ---------- arranque ----------
(async () => {
  if (!supabaseListo()) return mostrar("vista-config");
  try {
    const guardada = JSON.parse(sessionStorage.getItem(CLAVE_SESION) || "null");
    if (guardada && typeof guardada.access_token === "string" && typeof guardada.refresh_token === "string" && typeof guardada.id === "string") sesion = guardada;
  } catch (_) {}
  if (sesion) await entrar();
  else mostrar("vista-login");
})();
