const PHONE = "593961117591"; // WhatsApp Ecuador: código de país + número, sin + ni espacios.
let products = (window.getStoredProducts ? window.getStoredProducts() : (window.PRODUCTOS || []));
const cart = new Map();
const grid = document.getElementById("productGrid");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const resultCount = document.getElementById("resultCount");
const emptyState = document.getElementById("emptyState");
const cartPanel = document.getElementById("cartPanel");
const overlay = document.getElementById("overlay");
const toast = document.getElementById("toast");
let toastTimer;

document.getElementById("year").textContent = new Date().getFullYear();
const categories = [...new Set(products.map(p => p.category))].sort();
categories.forEach(category => {
  const option = document.createElement("option");
  option.value = category; option.textContent = category;
  categoryFilter.appendChild(option);
});

let currentList = [];
const cardObserver = "IntersectionObserver" in window ? new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); cardObserver.unobserve(e.target); } }), {threshold:.08, rootMargin:"0px 0px -30px 0px"}) : null;
function renderProducts() {
  products = (window.getStoredProducts ? window.getStoredProducts() : (window.PRODUCTOS || []));
  const term = searchInput.value.trim().toLocaleLowerCase("es");
  const category = categoryFilter.value;
  const filtered = products.filter(p =>
    (p.name + " " + p.description + " " + p.category).toLocaleLowerCase("es").includes(term) &&
    (category === "Todos" || p.category === category)
  );
  resultCount.textContent = `${filtered.length} ${filtered.length === 1 ? "producto" : "productos"}`;
  grid.innerHTML = "";
  emptyState.hidden = filtered.length > 0;
  filtered.forEach((p, i) => {
    const card = document.createElement("article");
    card.className = "product-card";
    card.style.transitionDelay = (i % 4) * 70 + "ms"; card.dataset.id = p.id;
    card.innerHTML = `
      <div class="product-image" data-open="${p.id}" tabindex="0" role="button" aria-label="Ver información de ${escapeHtml(p.name)}"><span class="view-hint">Ver información</span><span class="product-tag">${escapeHtml(p.category)}</span>
        <img loading="lazy" decoding="async" src="${p.image}" alt="${escapeHtml(p.name)}" onerror="this.style.display='none';this.parentElement.style.background='#e8eee3'">
      </div>
      <div class="product-info"><h3 data-open="${p.id}">${escapeHtml(p.name)}</h3>
        <p>${escapeHtml(p.description)}</p>
        <div class="product-bottom"><span class="product-price">Precio: consultar</span>
          <button class="add-button" data-add="${p.id}">+ Agregar</button></div>
      </div>`;
    grid.appendChild(card);
    cardObserver ? cardObserver.observe(card) : card.classList.add("in");
  });
  currentList = filtered;
}
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
function showToast(message) {
  toast.textContent = message; toast.classList.add("show");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove("show"), 2300);
}
function addToCart(id) {
  cart.set(id, (cart.get(id) || 0) + 1); renderCart(); showToast("Producto agregado a tu pedido 🌿");
  const badge = document.getElementById("cartCount");
  badge.classList.remove("bump"); void badge.offsetWidth; badge.classList.add("bump");
}
function renderCart() {
  const count = [...cart.values()].reduce((a,b) => a+b, 0);
  document.getElementById("cartCount").textContent = count;
  const box = document.getElementById("cartItems");
  if (!count) { box.innerHTML = '<div class="cart-empty">Tu pedido todavía está vacío.<br>Explora el catálogo y agrega tus productos favoritos.</div>'; return; }
  box.innerHTML = "";
  cart.forEach((qty, id) => {
    const p = products.find(item => item.id === id); if (!p) return;
    const row = document.createElement("div"); row.className = "cart-row";
    row.innerHTML = `<img src="${p.image}" alt="" onerror="this.style.visibility='hidden'">
      <div><h4>${escapeHtml(p.name)}</h4><small>Precio por confirmar</small>
      <div class="quantity"><button data-qty="-1" data-id="${id}" aria-label="Quitar uno">−</button><span>${qty}</span><button data-qty="1" data-id="${id}" aria-label="Agregar uno">+</button></div></div>
      <button class="remove-item" data-remove="${id}" aria-label="Eliminar producto">×</button>`;
    box.appendChild(row);
  });
}
function openCart() { cartPanel.classList.add("open"); overlay.classList.add("visible"); cartPanel.setAttribute("aria-hidden","false"); }
function closeCart() { cartPanel.classList.remove("open"); overlay.classList.remove("visible"); cartPanel.setAttribute("aria-hidden","true"); }
function whatsappUrl(message) {
  if (PHONE.includes("X")) {
    showToast("Configura tu número de WhatsApp en script.js");
    return null;
  }
  return `https://wa.me/${PHONE}?text=${encodeURIComponent(message)}`;
}
function sendOrder() {
  if (!cart.size) { showToast("Agrega al menos un producto a tu pedido"); return; }
  const lines = [...cart.entries()].map(([id, qty]) => {
    const p = products.find(item => item.id === id); return `• ${p.name} x${qty}`;
  });
  const url = whatsappUrl("¡Hola! Quisiera consultar disponibilidad y precios de estos productos:\n\n" + lines.join("\n") + "\n\n¿Me pueden ayudar, por favor?");
  if (url) window.open(url, "_blank", "noopener,noreferrer");
}
grid.addEventListener("click", e => {
  const op = e.target.closest("[data-open]"); if (op) { openModal(Number(op.dataset.open)); return; } const btn = e.target.closest("[data-add]"); if (btn) addToCart(Number(btn.dataset.add)); });
document.getElementById("cartItems").addEventListener("click", e => {
  const qtyBtn = e.target.closest("[data-qty]");
  const removeBtn = e.target.closest("[data-remove]");
  if (qtyBtn) {
    const id = Number(qtyBtn.dataset.id), next = (cart.get(id) || 0) + Number(qtyBtn.dataset.qty);
    if (next <= 0) cart.delete(id); else cart.set(id, next);
    renderCart();
  }
  if (removeBtn) { cart.delete(Number(removeBtn.dataset.remove)); renderCart(); }
});
document.getElementById("openCart").addEventListener("click", openCart);
document.getElementById("closeCart").addEventListener("click", closeCart);
overlay.addEventListener("click", closeCart);
document.getElementById("checkout").addEventListener("click", sendOrder);
document.getElementById("contactWhatsApp").addEventListener("click", () => {
  const url = whatsappUrl("¡Hola! Quisiera información sobre sus productos naturales.");
  if (url) window.open(url, "_blank", "noopener,noreferrer");
});
document.getElementById("clearCart").addEventListener("click", () => { cart.clear(); renderCart(); showToast("Pedido vaciado"); });
searchInput.addEventListener("input", renderProducts);
categoryFilter.addEventListener("change", renderProducts);
document.getElementById("menuToggle").addEventListener("click", () => document.getElementById("nav").classList.toggle("open"));
document.querySelectorAll("#nav a").forEach(a => a.addEventListener("click", () => document.getElementById("nav").classList.remove("open")));
renderProducts(); renderCart();
grid.addEventListener("keydown", e => { if ((e.key === "Enter" || e.key === " ") && e.target.matches(".product-image")) { e.preventDefault(); openModal(Number(e.target.dataset.open)); } });

// ===== Ventana de información del producto =====
const modal = document.getElementById("modal"), lightbox = document.getElementById("lightbox");
let modalId = null;
const $ = id => document.getElementById(id);
function openModal(id) {
  const p = products.find(x => x.id === id); if (!p) return;
  modalId = id;
  $("mImg").src = p.image; $("mImg").alt = p.name;
  $("mCat").textContent = p.category; $("mTitle").textContent = p.name;
  const showB = p.brand && p.brand.toLowerCase() !== p.name.toLowerCase(); $("mBrand").textContent = showB ? p.brand : ""; $("mBrand").hidden = !showB;
  $("mUses").textContent = p.uses || p.description || "Consulta con nosotros la información de este producto.";
  $("mBenefits").innerHTML = (p.benefits || []).map(b => `<li>${escapeHtml(b)}</li>`).join("");
  $("mBenefits").hidden = !(p.benefits && p.benefits.length);
  $("mIng").innerHTML = (p.ingredients || []).map(b => `<span>${escapeHtml(b)}</span>`).join("");
  $("mIngBox").hidden = !(p.ingredients && p.ingredients.length);
  $("mPres").textContent = p.presentation || "Consulta disponibilidad";
  $("mFicha").hidden = !p.ficha;
  const body = modal.querySelector(".modal-body"); body.scrollTop = 0;
  modal.classList.add("open"); modal.setAttribute("aria-hidden", "false"); document.body.classList.add("lock");
  const card = modal.querySelector(".modal-card"); card.classList.remove("swap"); void card.offsetWidth; card.classList.add("swap");
}
function closeModal() { modal.classList.remove("open"); modal.setAttribute("aria-hidden", "true"); lightbox.classList.remove("open"); document.body.classList.remove("lock"); }
function stepModal(d) {
  if (!currentList.length) return; const i = currentList.findIndex(x => x.id === modalId);
  openModal(currentList[(i + d + currentList.length) % currentList.length].id);
}
modal.addEventListener("click", e => { if (e.target.closest("[data-close]")) closeModal(); });
$("mPrev").addEventListener("click", () => stepModal(-1)); $("mNext").addEventListener("click", () => stepModal(1));
$("mAdd").addEventListener("click", () => { if (modalId != null) addToCart(modalId); });
$("mAsk").addEventListener("click", () => {
  const p = products.find(x => x.id === modalId); if (!p) return;
  const url = whatsappUrl(`¡Hola! Quisiera información y precio de: ${p.name}`); if (url) window.open(url, "_blank", "noopener,noreferrer");
});
$("mFicha").addEventListener("click", () => { const p = products.find(x => x.id === modalId); if (p && p.ficha) { $("lbImg").src = p.ficha; lightbox.classList.add("open"); } });
lightbox.addEventListener("click", () => lightbox.classList.remove("open"));
document.addEventListener("keydown", e => {
  if (!modal.classList.contains("open")) return;
  if (e.key === "Escape") { lightbox.classList.contains("open") ? lightbox.classList.remove("open") : closeModal(); }
  if (e.key === "ArrowRight") stepModal(1); if (e.key === "ArrowLeft") stepModal(-1);
});

// ===== Animaciones extra: pantalla de carga y barra de progreso =====
window.addEventListener("load", () => setTimeout(() => { const l = $("loader"); l.classList.add("hide"); setTimeout(() => l.remove(), 700); }, 900));
const prog = $("progress");
window.addEventListener("scroll", () => { const h = document.documentElement; prog.style.transform = `scaleX(${h.scrollTop / (h.scrollHeight - h.clientHeight || 1)})`; }, {passive:true});

// Animaciones: sombra del encabezado y aparición de secciones al hacer scroll
const header = document.querySelector(".header");
const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 10);
window.addEventListener("scroll", onScroll, {passive:true}); onScroll();
const revealEls = document.querySelectorAll(".benefits > div, .section-heading, .story-copy, .story-side, .contact > *");
revealEls.forEach(el => el.classList.add("reveal"));
if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver(entries => entries.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
  }), {threshold:.15});
  revealEls.forEach(el => io.observe(el));
} else revealEls.forEach(el => el.classList.add("in"));

// ===== Modo claro / oscuro =====
const themeBtn = document.getElementById("themeToggle");
function setTheme(dark, save) {
  document.documentElement.toggleAttribute("data-theme", false);
  if (dark) document.documentElement.setAttribute("data-theme", "dark"); else document.documentElement.removeAttribute("data-theme");
  themeBtn.setAttribute("aria-label", dark ? "Cambiar a modo claro" : "Cambiar a modo oscuro");
  if (save) { try { localStorage.setItem("raizTheme", dark ? "dark" : "light"); } catch (e) {} }
}
setTheme(document.documentElement.getAttribute("data-theme") === "dark", false);
themeBtn.addEventListener("click", () => {
  themeBtn.classList.remove("spin"); void themeBtn.offsetWidth; themeBtn.classList.add("spin");
  setTheme(document.documentElement.getAttribute("data-theme") !== "dark", true);
});
