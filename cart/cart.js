(function () {
    const itemTpl = document.getElementById('cart-item-template').content;
    const emptyTpl = document.getElementById('empty-cart-template').content;
    const container = document.getElementById('cartItemsContainer');

    document.addEventListener('DOMContentLoaded', async () => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            window.location.href = '../../login/';
            return;
        }

        await loadCart();
        setupCartEventDelegation();

        document.getElementById('checkoutBtn')
            .addEventListener('click', () => {
                window.location.href = '/purchase';
            });
    });

    async function loadCart() {
        try {
            const res = await fetch(
                `${window.API_BASE_URL}/basket?cache=${Date.now()}`,
                { headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` } }
            );
            if (!res.ok) throw new Error('Failed to load cart');
            const basket = await res.json();

            renderCartItems(basket);
            updateCartTotal(basket);
            updateCartCount(basket);
        } catch (err) {
            console.error('Cart load error:', err);
            Swal.fire('Failed to load cart');
        }
    }

    function renderCartItems(basket) {
        container.innerHTML = '';

        if (basket.length === 0) {
            const emptyClone = document.importNode(emptyTpl, true);
            container.appendChild(emptyClone);
            return;
        }

        basket.forEach(item => {
            const clone = document.importNode(itemTpl, true);

            clone.querySelector('.cart-item-image').src = item.image;
            clone.querySelector('.cart-item-image').alt = item.name;
            clone.querySelector('.cart-item-title').textContent = item.name;
            clone.querySelector('.cart-item-price').textContent = `${item.price.toFixed(2)} $`;

            clone.querySelector('.remove-item-btn').dataset.id = item.id;
            clone.querySelector('.quantity-controls').dataset.id = item.id;
            clone.querySelector('.quantity-btn.decrease').dataset.id = item.id;
            clone.querySelector('.quantity-btn.increase').dataset.id = item.id;
            clone.querySelector('.quantity').textContent = item.amount;

            container.appendChild(clone);
        });
    }

    function setupCartEventDelegation() {
        container.addEventListener('click', async e => {
            const btn = e.target;
            const id = btn.dataset.id;
            if (!id) return;

            if (btn.classList.contains('quantity-btn')) {
                await updateCartItem(id, btn.classList.contains('increase'));
            }
            else if (btn.classList.contains('remove-item-btn')) {
                await removeCartItem(id);
            }
        });
    }

    async function updateCartItem(dishId, isIncrease) {
        const token = localStorage.getItem('authToken');
        if (!token) {
            Swal.fire('You must be logged in to update the cart.');
            return;
        }

        try {
            const endpoint = `${window.API_BASE_URL}/basket/dish/${dishId}`;
            const method = isIncrease ? 'POST' : 'DELETE';

            const url = isIncrease
                ? endpoint
                : `${endpoint}?increase=${!isIncrease}`;

            const res = await fetch(url, {
                method,
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Quantity update failed');

            await loadCart();
            updateMainCartCount();
        } catch (err) {
            console.error(err);
            Swal.fire(`Failed to ${isIncrease ? 'increase' : 'decrease'} quantity`);
        }
    }

    async function removeCartItem(dishId) {
        const token = localStorage.getItem('authToken');
        try {
            const res = await fetch(
                `${window.API_BASE_URL}/basket/dish/${dishId}`,
                { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } }
            );
            if (!res.ok) throw new Error('Remove item failed');

            await loadCart();
            updateMainCartCount();
        } catch (err) {
            console.error(err);
            Swal.fire('Failed to remove item from cart');
        }
    }

    function updateCartTotal(basket) {
        const total = basket.reduce((sum, i) => sum + i.price * i.amount, 0);
        document.getElementById('cartTotalPrice').textContent = `${total.toFixed(2)} $`;
    }

    function updateCartCount(basket) {
        const count = basket.reduce((s, i) => s + i.amount, 0);
        document.querySelectorAll('#cartItemCount').forEach(el => {
            el.textContent = count;
        });
    }

    function updateMainCartCount() {
        window.parent?.postMessage({ type: 'cartUpdate' }, '*');
    }

    window.addEventListener('message', e => {
        if (e.data.type === 'cartUpdate') loadCart();
    });
})();
