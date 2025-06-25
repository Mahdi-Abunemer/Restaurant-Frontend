const orderApiUrl = `${window.API_BASE_URL}/order`;

// Templates
const templates = {
    loading: document.getElementById('loading-template').content,
    loginPrompt: document.getElementById('login-prompt-template').content,
    noOrders: document.getElementById('no-orders-template').content,
    error: document.getElementById('error-orders-template').content
};

const container = document.getElementById('orders-container');

// Run on load
document.addEventListener('DOMContentLoaded', () => {
    fetchCartCount();
    showTemplate('loading');
    fetchOrders();
});

async function fetchCartCount() {
    const token = localStorage.getItem('authToken');
    if (!token) return;
    try {
        const res = await fetch(
            `${window.API_BASE_URL}/basket`,
            { headers: { "Authorization": `Bearer ${token}` } }
        );
        if (!res.ok) throw new Error();
        const items = await res.json();
        const count = items.reduce((sum, it) => sum + it.amount, 0);
        document.getElementById('cartItemCount').textContent = count;
    } catch {
        console.error('Could not fetch cart count');
    }
}

async function fetchOrders() {
    const token = localStorage.getItem('authToken');
    if (!token) {
        showTemplate('loginPrompt');
        return;
    }

    try {
        const res = await fetch(orderApiUrl, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch orders');
        const orders = await res.json();

        if (!orders.length) {
            showTemplate('noOrders');
            return;
        }

        renderOrdersTable(orders);
    } catch (err) {
        console.error(err);
        showTemplate('error');
    }
}

function showTemplate(name) {
    container.innerHTML = '';
    const clone = document.importNode(templates[name], true);
    container.appendChild(clone);
}

function renderOrdersTable(orders) {
    container.innerHTML = '';
    // Header row
    const headerRow = document.createElement('div');
    headerRow.className = 'order-row';
    ['Order ID', 'Date', 'Total, $', 'Status', 'Action'].forEach(text => {
        const cell = document.createElement('div');
        cell.className = 'order-cell header';
        cell.textContent = text;
        headerRow.appendChild(cell);
    });
    container.appendChild(headerRow);

    // Data rows
    orders.forEach(o => {
        const row = document.createElement('div');
        row.className = 'order-row';
        const orderTime = new Date(o.orderTime).toLocaleString();
        const deliveryTime = new Date(o.deliveryTime).toLocaleString();
        const dateContent = `Order: ${orderTime}<br>Delivery: ${deliveryTime}`;
        const total = o.price?.toFixed(2) ?? "--";
        const status = formatStatus(o.status ?? '–');

        [o.id, dateContent, total, status].forEach((val, index) => {
            const cell = document.createElement('div');
            cell.className = 'order-cell';

            if (index === 0) {
                const link = document.createElement('a');
                link.className = 'order-id-link';
                link.href = `../../order/?id=${o.id}`;
                link.textContent = val;
                cell.appendChild(link);
            } else if (index === 1) {
                cell.innerHTML = val;
            } else {
                cell.textContent = val;
            }

            row.appendChild(cell);
        });

        // Action cell
        const actionCell = document.createElement('div');
        actionCell.className = 'order-cell';
        if (o.status === 'InProcess') {
            const button = document.createElement('button');
            button.className = 'confirm-delivery-btn';
            button.textContent = 'Confirm Delivery';
            button.addEventListener('click', () => confirmDelivery(o.id));
            actionCell.appendChild(button);
        }
        row.appendChild(actionCell);
        container.appendChild(row);
    });
}

async function confirmDelivery(orderId) {
    const token = localStorage.getItem('authToken');
    if (!token) return;
    try {
        const res = await fetch(
            `${window.API_BASE_URL}/order/${orderId}/status`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: 'Delivered' })
            }
        );
        const text = await res.text();
        if (!res.ok) throw new Error(text || 'Delivery confirmation failed');
        fetchOrders();
    } catch (error) {
        console.error('Delivery error:', error);
        Swal.fire(`🚚 Delivery error: ${error.message || 'Please try again'}`);
    }
}

function formatStatus(status) {
    return status.replace(/([A-Z])/g, ' $1').trim();
}