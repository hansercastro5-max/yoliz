const DEMO_USER = "admin";
const DEMO_PASSWORD = "Raiz2026!"; // Solo demostración: no es seguridad adecuada para publicar en internet.
const loginView = document.getElementById("loginView");
const adminView = document.getElementById("adminView");
const form = document.getElementById("productForm");
const fileInput = document.getElementById("productImage");
const imageUrl = document.getElementById("productImageUrl");
const preview = document.getElementById("imagePreview");
let products = window.getStoredProducts();
let uploadedData = "";

document.getElementById("loginForm").addEventListener("submit", e => {
  e.preventDefault();
  const user = document.getElementById("username").value.trim();
  const pass = document.getElementById("password").value;
  if (user === DEMO_USER && pass === DEMO_PASSWORD) {
    loginView.hidden = true; adminView.hidden = false; renderAdmin();
  } else alert("Usuario o contraseña incorrectos.");
});
document.getElementById("logout").addEventListener("click", () => {
  adminView.hidden = true; loginView.hidden = false;
  document.getElementById("password").value = "";
});
function esc(s) { return String(s ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
function persist() { window.saveStoredProducts(products); }
function renderAdmin() {
  document.getElementById("totalProducts").textContent = products.length;
  const q = document.getElementById("adminSearch").value.trim().toLowerCase();
  const filtered = products.filter(p => (p.name+" "+p.category).toLowerCase().includes(q));
  const list = document.getElementById("adminProducts");
  if (!filtered.length) { list.innerHTML = '<div class="empty">No hay productos que coincidan.</div>'; return; }
  list.innerHTML = filtered.map(p => `<article class="admin-product"><img src="${esc(p.image)}" alt="" onerror="this.style.visibility='hidden'"><div><h3>${esc(p.name)}</h3><p>${esc(p.category)} · ${p.price ? esc(p.price) : "Precio por consultar"}</p></div><div class="item-actions"><button data-edit="${p.id}">Editar</button><button class="delete" data-delete="${p.id}">Eliminar</button></div></article>`).join("");
}
function resetForm() {
  form.reset(); document.getElementById("productId").value = ""; document.getElementById("formTitle").textContent = "Agregar producto";
  document.getElementById("saveProduct").textContent = "Guardar producto"; document.getElementById("cancelEdit").hidden = true;
  uploadedData = ""; preview.innerHTML = "<span>Vista previa de imagen</span>";
}
form.addEventListener("submit", e => {
  e.preventDefault();
  const idVal = document.getElementById("productId").value;
  const old = products.find(p => p.id === Number(idVal));
  const name = document.getElementById("productName").value.trim();
  const category = document.getElementById("productCategory").value.trim();
  const price = document.getElementById("productPrice").value.trim() || null;
  const description = document.getElementById("productDescription").value.trim() || "Consulta la presentación y disponibilidad";
  const image = uploadedData || imageUrl.value.trim() || (old && old.image) || "";
  const product = {...(old || {}), id: old ? old.id : Date.now(), name, category, description, image, price};
  if (old) products = products.map(p => p.id === old.id ? product : p);
  else products.unshift(product);
  try {
    persist();
  } catch (err) {
    alert("No se pudo guardar. Prueba con una imagen más pequeña.");
    return;
  }
  resetForm(); renderAdmin(); alert("Producto guardado. Actualiza la página de la tienda para ver los cambios.");
});
document.getElementById("cancelEdit").addEventListener("click", resetForm);
document.getElementById("adminSearch").addEventListener("input", renderAdmin);
document.getElementById("adminProducts").addEventListener("click", e => {
  const edit = e.target.closest("[data-edit]");
  const del = e.target.closest("[data-delete]");
  if (edit) {
    const p = products.find(x => x.id === Number(edit.dataset.edit)); if (!p) return;
    document.getElementById("productId").value = p.id;
    document.getElementById("productName").value = p.name;
    document.getElementById("productCategory").value = p.category;
    document.getElementById("productPrice").value = p.price || "";
    document.getElementById("productDescription").value = p.description || "";
    document.getElementById("productImageUrl").value = p.image && !p.image.startsWith("data:") ? p.image : "";
    uploadedData = p.image && p.image.startsWith("data:") ? p.image : "";
    preview.innerHTML = p.image ? `<img src="${esc(p.image)}" alt="Vista previa">` : "<span>Vista previa de imagen</span>";
    document.getElementById("formTitle").textContent = "Editar producto";
    document.getElementById("saveProduct").textContent = "Guardar cambios";
    document.getElementById("cancelEdit").hidden = false;
    window.scrollTo({top:0,behavior:"smooth"});
  }
  if (del) {
    const p = products.find(x => x.id === Number(del.dataset.delete)); if (!p) return;
    if (confirm(`¿Eliminar "${p.name}" del catálogo?`)) {
      products = products.filter(x => x.id !== p.id); persist(); renderAdmin();
    }
  }
});
fileInput.addEventListener("change", () => {
  const file = fileInput.files && fileInput.files[0]; if (!file) return;
  if (!file.type.startsWith("image/")) { alert("Selecciona un archivo de imagen."); return; }
  if (file.size > 1200000) { alert("La imagen pesa más de 1.2 MB. Reduce su tamaño antes de subirla."); fileInput.value = ""; return; }
  const reader = new FileReader();
  reader.onload = () => { uploadedData = reader.result; imageUrl.value = ""; preview.innerHTML = `<img src="${uploadedData}" alt="Vista previa">`; };
  reader.readAsDataURL(file);
});
imageUrl.addEventListener("input", () => {
  if (!imageUrl.value.trim()) return;
  uploadedData = "";
  preview.innerHTML = `<img src="${esc(imageUrl.value.trim())}" alt="Vista previa" onerror="this.parentElement.innerHTML='<span>No se pudo cargar la imagen</span>'">`;
});
