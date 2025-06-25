const API = window.API_BASE_URL;
const token = localStorage.getItem('authToken');

const itemTpl = document.getElementById('item-row-template').content;
const emptyTpl = document.getElementById('empty-basket-template').content;
const listDiv = document.getElementById('item-list');
const totalSpan = document.getElementById('total-price');
const confirmBtn = document.getElementById('confirm-order');

async function init() {
    if (!token) return window.location.href = '../../login/';
    await fetchUserProfile();
    try {
        const basket = await fetchBasket();
        renderCartItems(basket);
        updateTotal(basket);
    } catch (err) {
        console.error('Error loading basket:', err);
        renderCartItems([]);
        updateTotal([]);
    }
    confirmBtn.addEventListener('click', submitOrder);
}

async function fetchUserProfile() {
    const res = await fetch(`${API}/account/profile`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    document.getElementById('user-phone').textContent = data.phoneNumber || '';
    document.getElementById('user-email').textContent = data.email || '';
}

async function fetchBasket() {
    const res = await fetch(`${API}/basket`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error('Cannot load basket');
    return await res.json();
}

function renderCartItems(items) {
    listDiv.innerHTML = '';
    if (!items.length) {
        listDiv.appendChild(document.importNode(emptyTpl, true));
        return;
    }
    items.forEach(item => {
        const clone = document.importNode(itemTpl, true);
        clone.querySelector('img').src = item.image;
        clone.querySelector('img').alt = item.name;
        clone.querySelector('.item-name').textContent = item.name;
        clone.querySelector('.item-price').textContent = item.price.toFixed(2);
        clone.querySelector('.item-qty').textContent = item.amount;
        clone.querySelector('.item-total').textContent = (item.price * item.amount).toFixed(2);
        listDiv.appendChild(clone);
    });
}

function updateTotal(items) {
    const total = items.reduce((sum, i) => sum + i.price * i.amount, 0).toFixed(2);
    totalSpan.textContent = `${total} $`;
}

async function submitOrder() {
    const address = document.getElementById('delivery-address').value.trim();
    const timeVal = document.getElementById('delivery-time').value;
    if (!address || !timeVal) {
        return Swal.fire('Please fill in all delivery fields.');
    }
    const deliveryTime = new Date(timeVal).toISOString();
    try {
        const res = await fetch(`${API}/order`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ deliveryTime, address })
        });
        if (res.ok) {
            Swal.fire('Order placed successfully!');
            window.location.href = '/orders/index.html';
        } else {
            const err = await res.json();
            Swal.fire('Error placing order: ' + (err.message || JSON.stringify(err)));
        }
    } catch (e) {
        console.error('Submission error:', e);
        Swal.fire('Error placing order. Please try again.');
    }
}

document.addEventListener('DOMContentLoaded', init);