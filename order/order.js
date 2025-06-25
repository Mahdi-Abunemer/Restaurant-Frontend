const itemTpl = document.getElementById('order-item-template').content;
const noItemsTpl = document.getElementById('no-items-template').content;
const errorTpl = document.getElementById('order-error-template').content;
const itemsList = document.getElementById('itemsList');
const detailsMain = document.querySelector('.order-details');

// On load
document.addEventListener("DOMContentLoaded", () => {
    const orderId = new URLSearchParams(window.location.search).get('id');
    if (!orderId) {
        showError("Order ID not found");
        return;
    }

    fetchCartCount();
    loadOrderDetails(orderId);
});

async function loadOrderDetails(orderId) {
    try {
        const token = localStorage.getItem("authToken");
        if (!token) return window.location.href = "../login/";

        const res = await fetch(
            `${window.API_BASE_URL}/order/${orderId}`,
            { headers: { "Authorization": `Bearer ${token}` } }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const order = await res.json();

        renderOrderDetails(order);
        addDeliveryButton(order);
    } catch (err) {
        console.error("Error loading order details:", err);
        showError("Failed to load order details. Please try again.");
    }
}

function renderOrderDetails(order) {
    document.getElementById('orderId').textContent = order.id || "N/A";

    // status
    const statusEl = document.getElementById('orderStatus');
    statusEl.textContent = order.status ? formatStatus(order.status) : "Unknown";
    statusEl.style.backgroundColor = getStatusColor(order.status);

    // times & meta
    document.getElementById('orderTime').textContent = order.orderTime ? new Date(order.orderTime).toLocaleString() : "N/A";
    document.getElementById('deliveryTime').textContent = order.deliveryTime ? new Date(order.deliveryTime).toLocaleString() : "N/A";
    document.getElementById('deliveryAddress').textContent = order.address || "No address provided";
    document.getElementById('orderTotal').textContent = order.price ? `$${order.price.toFixed(2)}` : "$0.00";

    // items
    itemsList.innerHTML = '';
    if (order.dishes && order.dishes.length > 0) {
        order.dishes.forEach(d => {
            const clone = document.importNode(itemTpl, true);
            clone.querySelector('img').src = d.image || '../Images/placeholder.jpg';
            clone.querySelector('img').alt = d.name || 'Item';
            clone.querySelector('.item-name').textContent = d.name || 'Unnamed Item';
            clone.querySelector('.item-qty').textContent = d.amount || 0;
            clone.querySelector('.item-price').textContent = d.price != null ? d.price.toFixed(2) : '0.00';
            clone.querySelector('.item-total').textContent = d.totalPrice != null ? d.totalPrice.toFixed(2) : '0.00';
            itemsList.appendChild(clone);
        });
    } else {
        const empty = document.importNode(noItemsTpl, true);
        itemsList.appendChild(empty);
    }
}

function addDeliveryButton(order) {
    const container = document.querySelector('.order-header');
    const existing = container.querySelector('.delivery-button-container');
    if (existing) existing.remove();

    if (order.status === 'InProcess') {
        const btnWrap = document.createElement('div');
        btnWrap.className = 'delivery-button-container';
        const btn = document.createElement('button');
        btn.className = 'confirm-delivery-btn';
        btn.textContent = 'Confirm Delivery';
        btn.addEventListener('click', () => confirmDelivery(order.id));
        btnWrap.appendChild(btn);
        container.appendChild(btnWrap);
    }
}

async function confirmDelivery(orderId) {
    const token = localStorage.getItem("authToken");
    if (!token) return;
    try {
        const res = await fetch(
            `${window.API_BASE_URL}/order/${orderId}/status`,
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ status: "Delivered" })
            }
        );
        if (!res.ok) throw new Error();
        window.location.reload();
    } catch (err) {
        console.error("Delivery confirmation failed:", err);
        Swal.fire("Failed to confirm delivery. Please try again.");
    }
}

function showError(message) {
    detailsMain.innerHTML = '';
    const clone = document.importNode(errorTpl, true);
    clone.querySelector('.error-text').textContent = message;
    detailsMain.appendChild(clone);
}


/**
 * Formats status strings like 'InProcess' => 'In Process'
 */
function formatStatus(status) {
    return status ? status.replace(/([A-Z])/g, ' $1').trim() : 'Unknown Status';
}

/**
 * Maps order status to a background color
 */
function getStatusColor(status) {
    const statusColors = {
        'InProcess': '#FF6B00',
        'Delivered': '#28a745',
        'Cancelled': '#dc3545',
        'Pending': '#ffc107'
    };
    return statusColors[status] || '#6c757d';
}

/**
 * Fetches current cart count and updates the UI badge
 */
async function fetchCartCount() {
    try {
        const token = localStorage.getItem("authToken");
        if (!token) return;
        const res = await fetch(
            `${window.API_BASE_URL}/basket`,
            { headers: { "Authorization": `Bearer ${token}` } }
        );
        if (!res.ok) throw new Error();
        const basket = await res.json();
        const count = basket.reduce((sum, item) => sum + (item.amount || 0), 0);
        document.getElementById('cartItemCount').textContent = count;
    } catch (err) {
        console.error("Failed to fetch cart count:", err);
    }
}