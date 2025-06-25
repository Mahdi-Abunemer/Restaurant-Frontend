const apiUrl = `${window.API_BASE_URL}/dish`;
let totalPages = 1;
const cart = {};
const tmpl = {
    dish: document.getElementById('dish-template'),
    qty: document.getElementById('quantity-template'),
    add: document.getElementById('add-cart-template'),
    modal: document.getElementById('rating-modal-template')
};

function initialize() {
    updateUIFromURL();
    injectRatingModal();
    fetchBasket();
    fetchDishes();
    updateAuthButton();
    const logoutBtn = document.getElementById('logout-button');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
}

document.addEventListener('DOMContentLoaded', initialize);

// ---------------------- BASKET & DISH FETCH ----------------------
async function fetchBasket() {
    const token = localStorage.getItem("authToken");
    if (!token) return;
    try {
        const response = await fetch(
            `${window.API_BASE_URL}/basket?cache=${Date.now()}`,
            {
                headers: { "Authorization": `Bearer ${token}` }
            }
        );

        if (!response.ok) throw new Error("Failed to fetch basket");
        const basketData = await response.json();
        const newCart = {};
        basketData.forEach(item => {
            newCart[item.id] = (newCart[item.id] || 0) + item.amount;
        });

        Object.keys(cart).forEach(key => delete cart[key]);
        Object.assign(cart, newCart);
        fetchDishes();
    } catch (error) {
        console.error("Basket fetch error:", error);
    }
}

async function fetchDishes() {
    const params = getCurrentParams();
    params.set('cache', Date.now());
    const url = `${apiUrl}?${params.toString()}`;
    try {
        const response = await fetch(url, { headers: { Accept: "application/json" } });
        if (!response.ok) throw new Error("Network response was not ok " + response.status);
        const data = await response.json();
        totalPages = data.pagination.count;
        displayDishes(data.dishes);
        updatePagination();
    } catch (error) {
        console.error("Error fetching dishes:", error);
    }
}

// ---------------------- URL & FILTERS ----------------------
function getCurrentParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const params = new URLSearchParams();
    const page = urlParams.get('page') || 1;
    params.set('page', page);
    if (urlParams.get('vegetarian') === 'true') {
        params.set('vegetarian', 'true');
    }
    const sorting = urlParams.get('sorting');
    if (sorting) params.set('sorting', sorting);
    urlParams.getAll('categories').forEach(cat => params.append('categories', cat));
    return params;
}

function updateUIFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const vegFilter = document.getElementById('vegetarian-filter');
    if (vegFilter) vegFilter.checked = (urlParams.get('vegetarian') === 'true');
    const sortMenu = document.getElementById('sort-menu');
    if (sortMenu) sortMenu.value = getSortOptionFromParam(urlParams.get('sorting'));
    document.querySelectorAll(".category-item input[type='checkbox']").forEach(cb => {
        cb.checked = urlParams.getAll('categories').includes(cb.value.trim());
    });
}

function getSortOptionFromParam(sortingParam) {
    const map = {
        'NameAsc': 'az',
        'NameDesc': 'za',
        'PriceAsc': 'low-price',
        'PriceDesc': 'high-price',
        'RatingAsc': 'RatingAsc',
        'RatingDesc': 'RatingDesc'
    };
    return sortingParam ? map[sortingParam] || 'none' : 'none';
}

function updateURL() {
    const params = new URLSearchParams();
    params.set('page', 1);
    const vegFilter = document.getElementById('vegetarian-filter');
    if (vegFilter && vegFilter.checked) params.set('vegetarian', 'true');
    const sortMenu = document.getElementById('sort-menu');
    if (sortMenu) {
        const sp = getSortingParamFromOption(sortMenu.value);
        if (sp) params.set('sorting', sp);
    }
    document.querySelectorAll(".category-item input[type='checkbox']").forEach(cb => {
        if (cb.checked) params.append('categories', cb.value.trim());
    });
    window.history.pushState({}, '', window.location.pathname + '?' + params);
    updateUIFromURL();
}

function getSortingParamFromOption(option) {
    const map = {
        'az': 'NameAsc',
        'za': 'NameDesc',
        'low-price': 'PriceAsc',
        'high-price': 'PriceDesc',
        'RatingAsc': 'RatingAsc',
        'RatingDesc': 'RatingDesc'
    };
    return map[option] || '';
}

// ---------------------- DISPLAY DISHES ----------------------
function displayDishes(dishes) {
    const cont = document.getElementById('dish-container'); cont.innerHTML = '';
    dishes.forEach(d => {
        const clone = document.importNode(tmpl.dish.content, true);
        clone.querySelector('.dish-image').src = d.image || 'https://via.placeholder.com/280';
        clone.querySelector('.dish-image').alt = d.name;
        clone.querySelector('.dish-image').onclick = () => location.href = `item/?id=${d.id}`;
        clone.querySelector('.dish-title').textContent = d.name;
        clone.querySelector('.dish-category').textContent = d.category;
        clone.querySelector('.dish-description').textContent = d.description;
        clone.querySelector('.dish-price').textContent = `$${d.price.toFixed(2)}`;
        const starsCt = clone.querySelector('.rating-stars');
        // Clear and append stars fragment
        starsCt.innerHTML = '';
        starsCt.appendChild(renderStars(d.rating));
        attachRatingEvents(starsCt, d.id);
        const ctrl = clone.querySelector('.cart-controls');
        ctrl.innerHTML = ''; // clear old controls
        if ((cart[d.id] || 0) > 0) { updateCartUI(ctrl, d.id, cart[d.id]); }
        else { const btn = document.importNode(tmpl.add.content, true).querySelector('button'); btn.dataset.id = d.id; ctrl.appendChild(btn); }
        if (d.vegetarian) { const b = document.createElement('div'); b.className = 'vegetarian-badge'; b.textContent = 'Vegetarian'; clone.querySelector('.dish-card').appendChild(b); }
        cont.appendChild(clone);
    });
    attachCartEventListeners();
    updatePagination();
}

function renderStars(rating) {
    const frag = document.createDocumentFragment();
    const num = Number(rating) || 0;
    const rounded = Math.round(num * 2) / 2;
    const full = Math.floor(rounded), half = rounded - full >= 0.5, empty = 10 - full - (half ? 1 : 0);
    for (let i = 1; i <= full; i++) { const s = document.createElement('i'); s.className = 'bx bxs-star star filled'; s.dataset.value = i; frag.appendChild(s); }
    if (half) {
        const s = document.createElement('i');
        s.className = 'bx bxs-star-half star';
        s.dataset.value = full + 1;
        frag.appendChild(s);
    }
    for (let i = 1; i <= empty; i++) {
        const s = document.createElement('i');
        s.className = 'bx bx-star star';
        s.dataset.value = full + (half ? 1 : 0) + i;
        frag.appendChild(s);
    }
    return frag;
}


function attachCartEventListeners() {
    document.querySelectorAll(".add-to-cart-btn").forEach(btn =>
        btn.addEventListener("click", e =>
            addToCart(e.target.getAttribute("data-id"), e.target)
        )
    );
    document.querySelectorAll(".quantity-btn").forEach(btn =>
        btn.addEventListener("click", e =>
            updateQuantity(e.target.getAttribute("data-id"), btn.classList.contains("increase"))
        )
    );
}

// ---------------------- RATING LOGIC ----------------------
let modalDishId = null;
function injectRatingModal() {
    const node = document.importNode(tmpl.modal.content, true);
    document.body.appendChild(node);
    const overlay = document.getElementById('rating-modal-overlay');
    const starsC = overlay.querySelector('.modal-stars');
    starsC.innerHTML = ''; // clear existing
    for (let i = 1; i <= 10; i++) {
        const s = document.createElement('i');
        s.className = 'bx bx-star star';
        s.dataset.value = i;
        starsC.appendChild(s);
    }
    overlay.querySelector('.close-btn').addEventListener('click', closeRatingModal);
    overlay.querySelector('.submit-rating-btn').addEventListener('click', async () => {
        if (!modalDishId || modalSelectedRating < 1) return Swal.fire('Select rating');
        await submitRating(modalDishId, modalSelectedRating); closeRatingModal();
    });
    starsC.addEventListener('mouseover', e => {
        if (e.target.classList.contains('star'))
            starsC.querySelectorAll('.star').
                forEach(s => s.classList.toggle('hovered', parseInt(s.dataset.value)
                    <= parseInt(e.target.dataset.value)));
    });
    starsC.addEventListener('mouseout', () => starsC.querySelectorAll('.star').forEach(s => s.classList.remove('hovered')));
    starsC.addEventListener('click', e => {
        if (e.target.classList.contains('star')) {
            modalSelectedRating = parseInt(e.target.dataset.value);
            starsC.querySelectorAll('.star').
                forEach(s => s.classList.toggle('filled', parseInt(s.dataset.value) <= modalSelectedRating));
        }
    });
}
function openRatingModal(dishId, currentRating = 0) {
    modalDishId = dishId;
    modalSelectedRating = currentRating;
    const overlay = document.getElementById('rating-modal-overlay');
    overlay.querySelectorAll('.star').forEach(s =>
        s.classList.toggle('filled', parseInt(s.dataset.value) <= modalSelectedRating)
    );
    overlay.classList.add('active');
}

function closeRatingModal() {
    document.getElementById('rating-modal-overlay').classList.remove('active');
    modalDishId = null;
    modalSelectedRating = 0;
}

function attachRatingEvents(ratingContainer, dishId) {
    ratingContainer.querySelectorAll(".star").forEach(star => {
        star.style.cursor = 'pointer';
        star.addEventListener('mouseover', () => {
            if (!localStorage.getItem("authToken")) return Swal.fire("Please log in to rate this dish.");
            const val = parseInt(star.dataset.value);
            ratingContainer.querySelectorAll('.star').forEach(s =>
                s.classList.toggle('hovered', parseInt(s.dataset.value) <= val)
            );
        });
        star.addEventListener('mouseout', () =>
            ratingContainer.querySelectorAll('.star').forEach(s => s.classList.remove('hovered'))
        );
        star.addEventListener('click', async () => {
            if (!localStorage.getItem("authToken")) return Swal.fire("Please log in to rate this dish.");
            const canRate = await checkCanRate(dishId);
            if (!canRate) {
                return Swal.fire({
                    icon: 'error',
                    title: 'Cannot rate yet',
                    text: '🚫 You can rate this dish only after delivery and refreshing the page',
                    confirmButtonText: 'OK'
                });
            }
            const current = Array.from(ratingContainer.querySelectorAll('.star.filled')).length;
            openRatingModal(dishId, current);
        });
    });
}

async function checkCanRate(dishId) {
    const token = localStorage.getItem("authToken");
    if (!token) return false;
    try {
        const resp = await fetch(
            `${apiUrl}/${dishId}/rating/check`,
            {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` },
                cache: 'no-cache'
            }
        );
        if (!resp.ok) return false;
        const txt = await resp.text();
        const data = txt === "true" ? true : txt === "false" ? false : JSON.parse(txt);
        return typeof data === 'boolean' ? data : data?.canRate;
    } catch {
        return false;
    }
}

async function submitRating(dishId, ratingValue) {
    const token = localStorage.getItem("authToken");
    const response = await fetch(
        `${apiUrl}/${dishId}/rating`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ rating: ratingValue })
        }
    );
    const text = await response.text();
    if (!response.ok) throw new Error(text || "Failed to submit rating");
    Swal.fire("⭐ Thank you for your rating!");
    localStorage.removeItem("cachedDishes");
    await fetchDishes();
}

// ---------------------- CART OPERATIONS ----------------------
async function addToCart(itemId, button) {
    const token = localStorage.getItem("authToken");
    if (!token) {
        Swal.fire("You must be logged in to add items to the cart.");
        return;
    }
    try {
        const response = await fetch(
            `${window.API_BASE_URL}/basket/dish/${itemId}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        if (!response.ok) throw new Error("Failed to add item");
        await fetchBasket();
    } catch (error) {
        console.error("Add to cart failed:", error);
        Swal.fire("Failed to add item. Please try again.");
    }
}
//updateCartButton
function updateCartUI(container, itemId, qty) {
    container.innerHTML = '';
    const node = document.importNode(tmpl.qty.content, true);
    node.querySelector('.decrease').dataset.id = itemId;
    node.querySelector('.increase').dataset.id = itemId;
    const span = node.querySelector('.quantity-display');
    span.id = `qty-${itemId}`;
    span.textContent = qty;
    container.appendChild(node);
}

async function updateQuantity(itemId, isIncrease) {
    const token = localStorage.getItem("authToken");
    if (!token) return Swal.fire("Please login to modify cart");

    try {
        const endpoint = `${window.API_BASE_URL}/basket/dish/${itemId}`;
        const method = isIncrease ? "POST" : "DELETE";
        const url = isIncrease ? endpoint : `${endpoint}?increase=true`;

        const response = await fetch(url, {
            method,
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!response.ok) throw new Error("Operation failed");
        await fetchBasket();
    } catch (error) {
        console.error("Cart update failed:", error);
        Swal.fire("Failed to update. Please refresh the page.");
    }
}

// ---------------------- PAGINATION ----------------------
function updatePagination() {
    const urlParams = new URLSearchParams(window.location.search);
    const currentPage = parseInt(urlParams.get('page')) || 1;
    const prevBtn = document.getElementById("prev-page");
    if (prevBtn) {
        prevBtn.href = updateQueryParam("page", currentPage - 1);
        prevBtn.style.pointerEvents = currentPage <= 1 ? "none" : "auto";
    }
    const nextBtn = document.getElementById("next-page");
    if (nextBtn) {
        nextBtn.href = updateQueryParam("page", currentPage + 1);
        nextBtn.style.pointerEvents = currentPage >= totalPages ? "none" : "auto";
    }
    const pageNumbers = document.getElementById("page-numbers");
    if (pageNumbers) {
        pageNumbers.textContent = `Page ${currentPage} of ${totalPages}`;
    }
}

function updateQueryParam(key, value) {
    const params = new URLSearchParams(window.location.search);
    params.set(key, value);
    return window.location.pathname + "?" + params.toString();
}

const prevPageBtn = document.getElementById("prev-page");
if (prevPageBtn) {
    prevPageBtn.addEventListener("click", (e) => {
        e.preventDefault();
        const urlParams = new URLSearchParams(window.location.search);
        let page = parseInt(urlParams.get('page')) || 1;
        if (page > 1) updatePage(page - 1);
    });
}

const nextPageBtn = document.getElementById("next-page");
if (nextPageBtn) {
    nextPageBtn.addEventListener("click", (e) => {
        e.preventDefault();
        const urlParams = new URLSearchParams(window.location.search);
        let page = parseInt(urlParams.get('page')) || 1;
        if (page < totalPages) updatePage(page + 1);
    });
}

function updatePage(newPage) {
    const params = new URLSearchParams(window.location.search);
    params.set('page', newPage);
    window.history.pushState({}, '', window.location.pathname + "?" + params.toString());
    fetchDishes();
}

// ---------------------- FILTER BUTTONS ----------------------
const applyFiltersBtn = document.getElementById("apply-filters");
if (applyFiltersBtn) {
    applyFiltersBtn.addEventListener("click", () => {
        updateURL();
        fetchDishes();
    });
}

const clearFiltersBtn = document.getElementById("clear-filters");
if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener("click", () => {
        const vegFilter = document.getElementById('vegetarian-filter');
        if (vegFilter) vegFilter.checked = false;
        const sortMenu = document.getElementById('sort-menu');
        if (sortMenu) sortMenu.value = 'none';
        document.querySelectorAll(".category-item input[type='checkbox']").forEach(checkbox => checkbox.checked = false);
        const params = new URLSearchParams();
        params.set('page', 1);
        window.history.pushState({}, '', window.location.pathname + "?" + params.toString());
        fetchDishes();
    });
}

// ---------------------- BROWSER NAVIGATION ----------------------
window.addEventListener('popstate', () => {
    updateUIFromURL();
    fetchDishes();
});  