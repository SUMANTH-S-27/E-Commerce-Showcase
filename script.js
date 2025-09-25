/**
 * SC Store – Product Gallery, Cart, and Reviews
 * Maintainer notes:
 * - Keep product objects minimal; UI derives computed fields.
 * - Images use your final working links. Fallback -> SVG label to avoid blanks.
 * - Reviews persist in localStorage per-origin; code guards when storage is blocked.
 *
 * Types:
 * @typedef {Object} Product
 * @property {number} id
 * @property {string} name
 * @property {string} category
 * @property {number} price
 * @property {number} [originalPrice]
 * @property {string} [discount]
 * @property {string} image
 * @property {string} fallback
 * @property {string} description
 * @property {number} rating      // seed average rating
 * @property {number} reviews     // seed review count
 *
 * @typedef {Object} UserReview
 * @property {string} name
 * @property {number} rating
 * @property {string} text
 * @property {string} date        // ISO string
 */

/* =========================
   Config & Small Utilities
   ========================= */
const INR = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const on = (el, type, fn, opt) => el && el.addEventListener(type, fn, opt);
const debounce = (fn, ms = 200) => {
  let t;
  return (...a) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...a), ms);
  };
};
const svgText = (label, w = 500, h = 300) =>
  "data:image/svg+xml;base64," +
  btoa(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
      <rect width="${w}" height="${h}" fill="#f0f0f0"/>
      <text x="${w / 2}" y="${h / 2}" text-anchor="middle" font-family="Arial" font-size="18" fill="#999">${label}</text>
    </svg>`
  );
const stars = (r) => {
  const full = Math.round(r || 0);
  return "★★★★★☆☆☆☆☆".slice(5 - Math.min(full, 5), 10 - Math.min(full, 5));
};

/* ======================
   Product Data (final)
   ====================== */
// Use your finalized list exactly as in your last working build:
const products = [
  {
    id: 1,
    name: "Apple iPhone 15 Pro Max",
    category: "Mobiles",
    price: 159900,
    originalPrice: 169900,
    discount: "6%",
    image: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=312&h=312&fit=crop&crop=center",
    fallback: "https://via.placeholder.com/312x312/667eea/ffffff?text=iPhone+15+Pro+Max",
    description: "6.7-inch Super Retina XDR display, A17 Pro chip, 48MP camera system",
    rating: 4.8,
    reviews: 14583
  },
  {
    id: 2,
    name: "Samsung Galaxy S24 Ultra",
    category: "Mobiles",
    price: 124999,
    originalPrice: 129999,
    discount: "4%",
    image: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=312&h=312&fit=crop&crop=center",
    fallback: "https://via.placeholder.com/312x312/667eea/ffffff?text=Galaxy+S24+Ultra",
    description: "200MP camera, S Pen included, 6.8-inch Dynamic AMOLED display",
    rating: 4.7,
    reviews: 12061
  },
  {
    id: 9,
    name: "Google Pixel 8 Pro",
    category: "Mobiles",
    price: 89999,
    originalPrice: 99999,
    discount: "10%",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Google_Pixel_8_Pro.jpg",
    fallback: "https://via.placeholder.com/500x300/1a73e8/ffffff?text=Pixel+8+Pro",
    description: "Pro-grade camera, Tensor G3, smooth 120Hz display",
    rating: 4.6,
    reviews: 6750
  },
  {
  id: 3,
  name: "Apple MacBook Air M2",
  category: "Laptops",
  price: 119900,
  image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=312&h=312&fit=crop&crop=center",
  description: "13.6-inch Liquid Retina, M2 chip, lightweight and powerful",
  rating: 4.6,
  reviews: 8745
},
{
  id: 4,
  name: "HP Pavilion 15",
  category: "Laptops",
  price: 78999,
  image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=312&h=312&fit=crop&crop=center",
  description: "15.6-inch FHD, Intel Core i5, 16GB RAM, 512GB SSD. Popular for students",
  rating: 4.5,
  reviews: 6328
},
{
  id: 10,
  name: "Dell XPS 13",
  category: "Laptops",
  price: 129999,
  image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=312&h=312&fit=crop&crop=center",
  description: "13.4-inch FHD+ InfinityEdge, Intel i7, 16GB RAM, sleek design",
  rating: 4.7,
  reviews: 5032
},
  {
    id: 7,
    name: "Levi's Men Slim Jeans",
    category: "Fashion",
    price: 2799,
    originalPrice: 3999,
    discount: "30%",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Levi%27s_501_raw_jeans.jpg",
    fallback: "https://via.placeholder.com/500x300/1e3a8a/ffffff?text=Levi%27s+Jeans",
    description: "High-quality denim, ideal fit, stylish look. Flipkart's top-trending fashion",
    rating: 4.3,
    reviews: 3089
  },
  {
    id: 11,
    name: "Nike Air Max 270",
    category: "Fashion",
    price: 8999,
    originalPrice: 12999,
    discount: "30%",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=312&h=312&fit=crop&crop=center",
    fallback: "https://via.placeholder.com/312x312/667eea/ffffff?text=Nike+Air+Max+270",
    description: "Comfortable running shoes with iconic Air Max cushioning",
    rating: 4.4,
    reviews: 2398
  },
  {
    id: 6,
    name: "Prestige Electric Kettle 1.5L",
    category: "Home Kitchen",
    price: 1699,
    originalPrice: 2495,
    discount: "32%",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Electric_kettle.jpg",
    fallback: "https://via.placeholder.com/500x300/c41e3a/ffffff?text=Electric+Kettle",
    description: "Stainless steel, auto shut-off, easy pour",
    rating: 4.4,
    reviews: 5102
  },
  {
    id: 12,
    name: "Instant Pot Duo Evo Plus",
    category: "Home Kitchen",
    price: 12999,
    originalPrice: 15499,
    discount: "16%",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Instant_Pot_DUO60_pressure_cooker.jpg",
    fallback: "https://via.placeholder.com/500x300/8b0000/ffffff?text=Instant+Pot",
    description: "9-in-1 electric pressure cooker, perfect for quick meals",
    rating: 4.5,
    reviews: 3894
  },
  {
    id: 5,
    name: "Sony WH-1000XM5 Headphones",
    category: "Electronics",
    price: 29990,
    originalPrice: 34990,
    discount: "14%",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=312&h=312&fit=crop&crop=center",
    fallback: "https://via.placeholder.com/312x312/667eea/ffffff?text=Sony+Headphones",
    description: "Industry-leading noise cancellation, 30hr battery. Bestseller on Amazon",
    rating: 4.7,
    reviews: 9182
  },
  {
    id: 13,
    name: "Samsung Galaxy Watch 6",
    category: "Electronics",
    price: 24999,
    originalPrice: 27999,
    discount: "11%",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Samsung_Galaxy_Watch_6_Classic_01.jpg",
    fallback: "https://via.placeholder.com/500x300/1565c0/ffffff?text=Galaxy+Watch+6",
    description: "Smartwatch with health tracking, GPS, and AMOLED display",
    rating: 4.6,
    reviews: 5175
  },
  {
    id: 8,
    name: "Lakmé Absolute Perfect Radiance Serum",
    category: "Beauty",
    price: 599,
    originalPrice: 999,
    discount: "40%",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Lakm%C3%A9_logo.jpg",
    fallback: "https://via.placeholder.com/500x300/ff69b4/ffffff?text=Lakme+Serum",
    description: "Brightening formula, daily use, dermatologist-tested",
    rating: 4.5,
    reviews: 2348
  },
  {
    id: 14,
    name: "Philips Beard Trimmer Series 7000",
    category: "Beauty",
    price: 3499,
    originalPrice: 4499,
    discount: "22%",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Hair_Clipper_-_Wahl_(51013604297).jpg",
    fallback: "https://via.placeholder.com/500x300/0f4c75/ffffff?text=Beard+Trimmer",
    description: "Advanced trimmer with skin protection technology",
    rating: 4.3,
    reviews: 1570
  },{
  id: 15,
  name: "OnePlus Nord 2 5G",
  category: "Mobiles",
  price: 27999,
  originalPrice: 32999,
  discount: "15%",
  image: "https://commons.wikimedia.org/wiki/Special:FilePath/Oneplus_Nord_2.jpg",
  fallback: "https://via.placeholder.com/500x300/2563eb/ffffff?text=OnePlus+Nord+2",
  description: "Dimensity performance, 90Hz AMOLED, fast charging",
  rating: 4.4,
  reviews: 2103
},
{
  id: 16,
  name: "ASUS ROG Strix G15",
  category: "Laptops",
  price: 129990,
  originalPrice: 139990,
  discount: "7%",
  image: "https://commons.wikimedia.org/wiki/Special:FilePath/ASUS_ROG_Strix_G15_(G513QY-HQ012T)-top_keyboard_touchpad_PNr%C2%B00889.jpg",
  fallback: "https://via.placeholder.com/500x300/111827/ffffff?text=ROG+Strix+G15",
  description: "Ryzen CPU, dedicated GPU, RGB keyboard for gamers",
  rating: 4.6,
  reviews: 2137
},
{
  id: 17,
  name: "Canon EOS R50 Mirrorless",
  category: "Electronics",
  price: 61990,
  originalPrice: 67990,
  discount: "9%",
  image: "https://commons.wikimedia.org/wiki/Special:FilePath/Canon_EOS_R50_(52694437103).jpg",
  fallback: "https://via.placeholder.com/500x300/0ea5e9/ffffff?text=Canon+EOS+R50",
  description: "APS‑C mirrorless with 4K video and fast autofocus",
  rating: 4.7,
  reviews: 987
},
{
  id: 18,
  name: "Bose SoundLink Flex",
  category: "Electronics",
  price: 15990,
  originalPrice: 17990,
  discount: "11%",
  image: "https://commons.wikimedia.org/wiki/Special:FilePath/Bose_SoundLink_Flex_Bluetooth%C2%AE_Speaker_(white).jpeg",
  fallback: "https://via.placeholder.com/500x300/059669/ffffff?text=Bose+SoundLink+Flex",
  description: "Portable Bluetooth speaker with IP67 and rich bass",
  rating: 4.5,
  reviews: 4210
},
{
  id: 19,
  name: "Air Fryer 4.2L",
  category: "Home Kitchen",
  price: 7999,
  originalPrice: 10499,
  discount: "24%",
  image: "https://commons.wikimedia.org/wiki/Special:FilePath/Air_Fryer_5458.jpg",
  fallback: "https://via.placeholder.com/500x300/ea580c/ffffff?text=Air+Fryer+4.2L",
  description: "Crispy results with little to no oil, easy to clean",
  rating: 4.4,
  reviews: 1788
},
{
  id: 20,
  name: "Ray‑Ban Aviator Sunglasses",
  category: "Fashion",
  price: 6499,
  originalPrice: 7990,
  discount: "19%",
  image: "https://commons.wikimedia.org/wiki/Special:FilePath/RayBanAviator.jpg",
  fallback: "https://via.placeholder.com/500x300/1f2937/ffffff?text=Ray‑Ban+Aviator",
  description: "Iconic metal frame with UV‑protective lenses",
  rating: 4.6,
  reviews: 3650
}
];

/* ===========================
   App State & DOM References
   =========================== */
let cart = [];
let filteredProducts = products;
let selectedProduct = null;

const els = {
  grid: $("#productGrid"),
  search: $("#searchInput"),
  filterBtns: $$(".filter-btn"),
  modal: $("#productModal"),
  drawer: $("#cartDrawer"),
  cartBtn: $("#cartBtn"),
  closeModal: $("#closeModal"),
  addToCart: $("#addToCartBtn"),
  checkout: $("#checkoutBtn"),
  // Modal fields
  mImg: $("#modalImage"),
  mName: $("#modalName"),
  mPrice: $("#modalPrice"),
  mQty: $("#modalQty")
};

/* ======================
   Reviews (Persistence)
   ====================== */
const REVIEW_KEY = "sc_reviews_v1";
const safeGet = (k, fb = "{}") => {
  try { return localStorage.getItem(k) ?? fb; } catch { return fb; }
};
const safeSet = (k, v) => {
  try { localStorage.setItem(k, v); } catch {}
};
const dbRead = () => JSON.parse(safeGet(REVIEW_KEY, "{}"));
const dbWrite = (obj) => safeSet(REVIEW_KEY, JSON.stringify(obj));
const getReviews = (pid) => (dbRead()[pid] || []);
const addReview = (pid, rev) => {
  const db = dbRead();
  db[pid] = db[pid] || [];
  db[pid].push(rev);
  dbWrite(db);
};
const aggregate = (p) => {
  const seedAvg = Number(p.rating || 0), seedCount = Number(p.reviews || 0);
  const user = getReviews(p.id);
  const uCount = user.length;
  if (!seedCount && !uCount) return { avg: 0, count: 0 };
  const uAvg = uCount ? user.reduce((s, r) => s + Number(r.rating || 0), 0) / uCount : 0;
  const total = seedAvg * seedCount + uAvg * uCount;
  const denom = seedCount + uCount;
  return { avg: total / denom, count: denom };
};

/* =========================
   Rendering – Product Grid
   ========================= */
function imgWithFallback(p) {
  const img = new Image();
  img.alt = p.name;
  img.loading = "lazy";
  img.referrerPolicy = "no-referrer";
  img.src = p.image;
  img.onerror = function () {
    this.onerror = null;
    this.src = p.fallback || svgText(p.name);
  };
  return img;
}

function renderProducts(list = filteredProducts) {
  els.grid.innerHTML = "";
  if (!list.length) {
    els.grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;">
      <h3>No products found</h3>
      <p>Try adjusting your search or filter</p>
    </div>`;
    return;
  }
  list.forEach((p) => {
    const card = document.createElement("div");
    card.className = "product-card";

    const img = imgWithFallback(p);
    const cat = document.createElement("div");
    cat.className = "category";
    cat.textContent = p.category;

    const title = document.createElement("h3");
    title.textContent = p.name;

    const ratingRow = document.createElement("div");
    const agg = aggregate(p);
    ratingRow.className = "rating-row";
    ratingRow.textContent = `${stars(agg.avg)} (${agg.avg.toFixed(1)})`;

    const pricing = document.createElement("div");
    pricing.className = "product-pricing";
    const price = document.createElement("span");
    price.className = "price";
    price.textContent = INR.format(p.price);
    pricing.append(price);

    card.append(img, cat, title, ratingRow, pricing);
    on(card, "click", () => openModal(p));
    els.grid.append(card);
  });
}

/* ================
   Filters & Search
   ================ */
function applyFilters(category) {
  filteredProducts = category === "all" ? products : products.filter((p) => p.category === category);
  const q = (els.search.value || "").trim().toLowerCase();
  if (q) {
    filteredProducts = filteredProducts.filter(
      (p) => p.name.toLowerCase().includes(q) ||
             p.description.toLowerCase().includes(q) ||
             p.category.toLowerCase().includes(q)
    );
  }
  renderProducts();
}
function onSearch() {
  const active = $(".filter-btn.active")?.dataset.category || "all";
  const base = active === "all" ? products : products.filter((p) => p.category === active);
  const q = (els.search.value || "").trim().toLowerCase();
  filteredProducts = q
    ? base.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      )
    : base;
  renderProducts();
}

/* ============
   Modal + SEO
   ============ */
function ensureReviewsUI() {
  if ($("#reviewsBlock")) return;
  const host = $("#productModal .modal-content");
  const wrap = document.createElement("div");
  wrap.id = "reviewsBlock";
  wrap.innerHTML = `
    <div class="reviews-summary">
      <span id="avgRating">0.0</span> ★ • <span id="reviewCount">0</span> reviews
    </div>
    <h3 style="margin:8px 0;">Reviews</h3>
    <ul id="reviewsList" class="reviews-list"></ul>
    <form id="reviewForm" class="review-form" autocomplete="off">
      <div class="row">
        <input id="reviewName" name="name" type="text" placeholder="Name (optional)" />
        <select id="reviewRating" name="rating" aria-label="Rating">
          <option value="5" selected>★★★★★ (5)</option>
          <option value="4">★★★★☆ (4)</option>
          <option value="3">★★★☆☆ (3)</option>
          <option value="2">★★☆☆☆ (2)</option>
          <option value="1">★☆☆☆☆ (1)</option>
        </select>
      </div>
      <textarea id="reviewText" name="text" rows="3" placeholder="Share details of the experience..." required></textarea>
      <button type="submit" class="add-to-cart-btn">Submit Review</button>
    </form>
    <script type="application/ld+json" id="productJSONLD"></script>
  `;
  host.appendChild(wrap);

  // One-time CSS (kept minimal; move to stylesheet if preferred)
  if (!$("#reviewInlineCSS")) {
    const s = document.createElement("style");
    s.id = "reviewInlineCSS";
    s.textContent = `
      .rating-row{margin-top:6px;color:#f59e0b;font-weight:600}
      .reviews-summary{margin:8px 0 12px;color:#1f2937}
      .reviews-list{list-style:none;display:grid;gap:10px;max-height:220px;overflow:auto;padding:0}
      .review-item{background:#fafafa;border:1px solid #eee;border-radius:10px;padding:10px 12px}
      .review-head{color:#374151;margin-bottom:6px}
      .review-stars{color:#f59e0b;margin-left:6px}
      .review-form .row{display:flex;gap:10px;margin:8px 0}
      .review-form input,.review-form select,.review-form textarea{width:100%;padding:10px;border:1px solid #ddd;border-radius:10px;font-size:14px}
      .review-form button{margin-top:8px}
    `;
    document.head.appendChild(s);
  }
}

function renderReviewSummary(p) {
  const { avg, count } = aggregate(p);
  const avgEl = $("#avgRating");
  const cntEl = $("#reviewCount");
  if (avgEl) avgEl.textContent = count ? avg.toFixed(1) : "0.0";
  if (cntEl) cntEl.textContent = String(count);
}
function renderReviews(p) {
  const ul = $("#reviewsList");
  if (!ul) return;
  const list = getReviews(p.id);
  ul.innerHTML = "";
  if (!list.length) {
    ul.innerHTML = `<li class="review-item"><em>Be the first to review this product.</em></li>`;
    return;
  }
  list.slice().reverse().forEach((r) => {
    const li = document.createElement("li");
    li.className = "review-item";
    const date = new Date(r.date).toLocaleDateString();
    li.innerHTML = `
      <div class="review-head"><strong>${r.name || "Guest"}</strong>
        <span class="review-stars">${stars(r.rating)}</span> • <small>${date}</small>
      </div>
      <p class="review-text">${(r.text || "").replace(/[<>&]/g, s => ({'<':'&lt;','>':'&gt;','&':'&amp;'}[s]))}</p>
    `;
    ul.appendChild(li);
  });
}
function bindReviewForm(p) {
  const form = $("#reviewForm");
  if (!form) return;
  form.dataset.pid = String(p.id);
  form.onsubmit = (e) => {
    e.preventDefault();
    const name = ($("#reviewName").value || "Guest").trim().slice(0, 50);
    const rating = Math.min(5, Math.max(1, Number($("#reviewRating").value || 5)));
    const text = ($("#reviewText").value || "").trim().slice(0, 800);
    if (!text) { toast("Please enter a review message.", "error"); return; }
    addReview(p.id, { name, rating, text, date: new Date().toISOString() });
    renderReviewSummary(p);
    renderReviews(p);
    updateJSONLD(p);
    toast("Thanks for the review!", "success");
    form.reset();
    $("#reviewRating").value = "5";
  };
}
function updateJSONLD(p) {
  const el = $("#productJSONLD");
  if (!el) return;
  const user = getReviews(p.id);
  const agg = aggregate(p);
  const json = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": p.name,
    "description": p.description || "",
    "image": p.image,
    "offers": { "@type": "Offer", "price": String(p.price), "priceCurrency": "INR", "availability": "https://schema.org/InStock" },
    "aggregateRating": { "@type": "AggregateRating", "ratingValue": agg.count ? agg.avg.toFixed(1) : "0", "reviewCount": String(agg.count) },
    "review": user.slice(-10).map(rv => ({
      "@type": "Review",
      "author": rv.name || "Anonymous",
      "reviewBody": rv.text || "",
      "reviewRating": { "@type": "Rating", "ratingValue": String(rv.rating), "bestRating": "5", "worstRating": "1" },
      "datePublished": rv.date
    }))
  };
  el.textContent = JSON.stringify(json);
}

/* =========
   Modals
   ========= */
function openModal(p) {
  selectedProduct = p;
  ensureReviewsUI();

  els.mImg.src = p.image;
  els.mImg.onerror = function () {
    this.onerror = null;
    this.src = p.fallback || svgText(p.name, 250, 250);
  };
  els.mName.textContent = p.name;
  els.mPrice.textContent = INR.format(p.price);
  els.mQty.value = 1;

  renderReviewSummary(p);
  renderReviews(p);
  bindReviewForm(p);
  updateJSONLD(p);

  els.modal.classList.add("show");
  document.body.style.overflow = "hidden";
  els.modal.focus();
}
function closeModal() {
  els.modal.classList.remove("show");
  document.body.style.overflow = "auto";
}

/* ========
   Cart
   ======== */
function addToCart() {
  if (!selectedProduct) return;
  const qty = Math.max(1, parseInt(els.mQty.value, 10) || 1);
  const line = cart.find((i) => i.id === selectedProduct.id);
  if (line) line.qty += qty;
  else cart.push({ ...selectedProduct, qty });
  drawCart();
  closeModal();
  toast("Product added to cart!", "success");
}
function removeFromCart(i) {
  cart.splice(i, 1);
  drawCart();
  toast("Item removed from cart!", "error");
}
function drawCart() {
  const items = $("#cartItems");
  const totalEl = $("#cartTotal");
  const countEl = $("#cartCount");
  items.innerHTML = "";
  let total = 0;
  cart.forEach((it, idx) => {
    const line = it.price * it.qty;
    total += line;
    const row = document.createElement("div");
    row.className = "cart-item";
    row.innerHTML = `
      <div><strong>${it.name}</strong><br/><small>${INR.format(it.price)} × ${it.qty}</small></div>
      <div>
        <div>${INR.format(line)}</div>
        <button onclick="removeFromCart(${idx})" style="background:#ff6b6b;color:#fff;border:none;padding:5px 10px;border-radius:5px;margin-top:5px;cursor:pointer;">Remove</button>
      </div>`;
    items.appendChild(row);
  });
  totalEl.textContent = INR.format(total);
  countEl.textContent = String(cart.length);
}

/* =============
   Toast Notify
   ============= */
function toast(msg, type = "success") {
  const old = $(".notification");
  if (old) old.remove();
  const n = document.createElement("div");
  n.className = "notification";
  n.style.cssText = `
    position:fixed;top:100px;right:20px;z-index:3000;
    background:${type === "error" ? "#ff6b6b" : "#4CAF50"};
    color:#fff;padding:15px 25px;border-radius:25px;
    box-shadow:0 4px 15px rgba(0,0,0,.2)`;
  n.textContent = msg;
  document.body.appendChild(n);
  setTimeout(() => n.remove(), 2800);
}

/* =========
   Wiring
   ========= */
els.filterBtns.forEach((btn) =>
  on(btn, "click", () => {
    els.filterBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    applyFilters(btn.dataset.category);
  })
);
on(els.search, "input", debounce(onSearch, 200));
on(els.cartBtn, "click", () => els.drawer.classList.toggle("show"));
on(els.closeModal, "click", closeModal);
on(els.addToCart, "click", addToCart);
on(els.checkout, "click", () => {
  if (!cart.length) return toast("Your cart is empty!", "error");
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const count = cart.reduce((s, i) => s + i.qty, 0);
  toast(`Order placed! ${count} items for ${INR.format(total)}`, "success");
  cart = [];
  drawCart();
  els.drawer.classList.remove("show");
});
on(els.modal, "click", (e) => { if (e.target === els.modal) closeModal(); });
on(document, "keydown", (e) => {
  if (e.key === "Escape") {
    if (els.modal.classList.contains("show")) closeModal();
    if (els.drawer.classList.contains("show")) els.drawer.classList.remove("show");
  }
});

// Boot
document.addEventListener("DOMContentLoaded", () => {
  renderProducts(products);
  drawCart();
});

// Expose for inline onclick in cart rows
window.removeFromCart = removeFromCart;
