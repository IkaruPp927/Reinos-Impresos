/* Reinos Impresos - prototipo local.
   Para producción: mover catálogo y administración a un backend con autenticación.
   No guardar secretos ni credenciales en este archivo. */
const STORAGE_KEY = "reinos-impresos-catalogo-v1";
const WHATSAPP_NUMBER = ""; // Reemplazar por el número comercial, solo dígitos con código de país. Ej: 5491123456789

const demoProducts = [
  { id: "demo-1", name: "Guerrero aventurero", category: "Miniaturas", price: 6500, image: "", description: "Miniatura de fantasía impresa a pedido. Consultá por tamaños y acabados." },
  { id: "demo-2", name: "Lobo de las sombras", category: "Monstruos", price: 5200, image: "", description: "Criatura para encuentros, campañas y escenografía de rol." },
  { id: "demo-3", name: "Dragón antiguo", category: "Monstruos", price: 14500, image: "", description: "Una pieza imponente para el jefe final de tu aventura." },
  { id: "demo-4", name: "Accesorio de campaña", category: "Accesorios", price: 7800, image: "", description: "Accesorio impreso en 3D. Consultá las opciones disponibles." }
];

const $ = (selector) => document.querySelector(selector);
const grid = $("#product-grid");
const filtersEl = $("#filters");
const dialog = $("#admin-dialog");
let activeCategory = "Todos";
let products = loadProducts();

function loadProducts() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [...demoProducts];
  } catch {
    return [...demoProducts];
  }
}
function saveProducts() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
}
function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, (ch) => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
  })[ch]);
}
function money(value) {
  return new Intl.NumberFormat("es-AR", { style:"currency", currency:"ARS", maximumFractionDigits:0 }).format(Number(value) || 0);
}
function productImage(product) {
  if (product.image && /^https?:\/\//i.test(product.image)) {
    return `<img src="${escapeHTML(product.image)}" alt="${escapeHTML(product.name)}" loading="lazy" onerror="this.parentElement.innerHTML='<span class=&quot;image-placeholder&quot;>✦</span>'">`;
  }
  return `<span class="image-placeholder" aria-hidden="true">✦</span>`;
}
function categories() {
  return ["Todos", ...new Set(products.map(p => p.category).filter(Boolean))];
}
function renderFilters() {
  const list = categories();
  if (!list.includes(activeCategory)) activeCategory = "Todos";
  filtersEl.innerHTML = list.map(cat => `<button class="filter-chip ${cat === activeCategory ? "active" : ""}" type="button" data-category="${escapeHTML(cat)}">${escapeHTML(cat)}</button>`).join("");
}
function renderProducts() {
  const term = $("#search").value.trim().toLocaleLowerCase("es-AR");
  const filtered = products.filter(p =>
    (activeCategory === "Todos" || p.category === activeCategory) &&
    `${p.name} ${p.description} ${p.category}`.toLocaleLowerCase("es-AR").includes(term)
  );
  grid.innerHTML = filtered.map(p => `
    <article class="product-card">
      <div class="product-image">${productImage(p)}</div>
      <div class="product-info">
        <span class="product-category">${escapeHTML(p.category)}</span>
        <h3>${escapeHTML(p.name)}</h3>
        <p class="product-description">${escapeHTML(p.description || "Impresión a pedido. Consultanos por detalles.")}</p>
        <div class="product-bottom"><span class="price">${money(p.price)}</span><button class="button button-gold order-button" type="button" data-id="${escapeHTML(p.id)}">Consultar pedido</button></div>
      </div>
    </article>`).join("");
  $("#empty-state").classList.toggle("hidden", filtered.length > 0);
}
function renderAll() { renderFilters(); renderProducts(); renderAdminList(); }
function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 2500);
}
function orderProduct(id) {
  const p = products.find(item => item.id === id);
  if (!p) return;
  const message = `Hola, quiero consultar por este producto de Reinos Impresos:\n${p.name}\nPrecio publicado: ${money(p.price)}\nCategoría: ${p.category}\n¿Me indican plazo de impresión y opciones de entrega?`;
  if (!WHATSAPP_NUMBER) {
    showToast("Configurá WHATSAPP_NUMBER en app.js para activar los pedidos.");
    window.prompt("Copiá este mensaje y envialo por WhatsApp:", message);
    return;
  }
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}
function renderAdminList() {
  $("#admin-product-list").innerHTML = products.length ? products.map(p => `
    <div class="admin-row">
      <div><strong>${escapeHTML(p.name)}</strong><small>${escapeHTML(p.category)} · ${money(p.price)}</small></div>
      <div class="admin-actions"><button type="button" data-edit="${escapeHTML(p.id)}">Editar</button><button type="button" class="delete" data-delete="${escapeHTML(p.id)}">Borrar</button></div>
    </div>`).join("") : `<p class="product-description">Todavía no hay productos cargados.</p>`;
}
function clearForm() {
  $("#product-form").reset();
  $("#product-id").value = "";
  $("#save-product").textContent = "Agregar producto";
  $("#cancel-edit").classList.add("hidden");
}
function editProduct(id) {
  const p = products.find(item => item.id === id);
  if (!p) return;
  $("#product-id").value = p.id;
  $("#product-name").value = p.name;
  $("#product-category").value = p.category;
  $("#product-price").value = p.price;
  $("#product-image").value = p.image || "";
  $("#product-description").value = p.description || "";
  $("#save-product").textContent = "Guardar cambios";
  $("#cancel-edit").classList.remove("hidden");
  $("#product-name").focus();
}
filtersEl.addEventListener("click", event => {
  const button = event.target.closest("[data-category]");
  if (!button) return;
  activeCategory = button.dataset.category;
  renderAll();
});
grid.addEventListener("click", event => {
  const button = event.target.closest("[data-id]");
  if (button) orderProduct(button.dataset.id);
});
$("#search").addEventListener("input", renderProducts);
$("#admin-open").addEventListener("click", () => { renderAdminList(); dialog.showModal(); });
$("#admin-close").addEventListener("click", () => dialog.close());
$("#cancel-edit").addEventListener("click", clearForm);
$("#product-form").addEventListener("submit", event => {
  event.preventDefault();
  const id = $("#product-id").value || `p-${Date.now()}-${Math.random().toString(16).slice(2,7)}`;
  const product = {
    id,
    name: $("#product-name").value.trim(),
    category: $("#product-category").value,
    price: Number($("#product-price").value),
    image: $("#product-image").value.trim(),
    description: $("#product-description").value.trim()
  };
  if (!product.name || !Number.isFinite(product.price) || product.price < 0) {
    showToast("Revisá el nombre y el precio.");
    return;
  }
  const index = products.findIndex(p => p.id === id);
  if (index >= 0) products[index] = product;
  else products.unshift(product);
  saveProducts();
  clearForm();
  renderAll();
  showToast(index >= 0 ? "Cambios guardados en este navegador." : "Producto agregado en este navegador.");
});
$("#admin-product-list").addEventListener("click", event => {
  const edit = event.target.closest("[data-edit]");
  const remove = event.target.closest("[data-delete]");
  if (edit) editProduct(edit.dataset.edit);
  if (remove) {
    const p = products.find(item => item.id === remove.dataset.delete);
    if (p && window.confirm(`¿Borrar "${p.name}" de este navegador?`)) {
      products = products.filter(item => item.id !== p.id);
      saveProducts();
      renderAll();
      showToast("Producto borrado de este navegador.");
    }
  }
});
$("#reset-demo").addEventListener("click", () => {
  if (!window.confirm("Esto reemplazará tu catálogo local por los cuatro productos de ejemplo. ¿Continuar?")) return;
  products = [...demoProducts];
  saveProducts();
  clearForm();
  renderAll();
  showToast("Catálogo de ejemplo restaurado.");
});
$("#year").textContent = new Date().getFullYear();
renderAll();
