
function updateAuthButton() {
    const token = localStorage.getItem('authToken');
    const loginLink = document.getElementById('login-link');
    const registerLink = document.getElementById('register-link');
    const profileLink = document.getElementById('profile-link');
    const cartLink = document.getElementById('cart-link');
    const ordersLink = document.getElementById('orders-link');
    const logoutButton = document.getElementById('logout-button');
    if (token) {
        if (loginLink) loginLink.style.display = 'none';
        if (registerLink) registerLink.style.display = 'none';
        if (profileLink) profileLink.style.display = 'inline-block';
        if (cartLink) cartLink.style.display = 'inline-block';
        if (ordersLink) ordersLink.style.display = 'inline-block';
        if (logoutButton) logoutButton.style.display = 'inline-block';
        fetchUserEmail(token).then(email => {
            if (email && document.getElementById('userEmail')) {
                document.getElementById('userEmail').textContent = email;
            }
        });
    } else {
        if (loginLink) loginLink.style.display = 'inline-block';
        if (registerLink) registerLink.style.display = 'inline-block';
        if (profileLink) profileLink.style.display = 'none';
        if (cartLink) cartLink.style.display = 'none';
        if (ordersLink) ordersLink.style.display = 'none';
        if (logoutButton) logoutButton.style.display = 'none';
    }
}

async function handleLogout() {
    const token = localStorage.getItem('authToken');
    try {
        const response = await fetch('https://food-delivery.int.kreosoft.space/api/account/logout', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) throw new Error('Logout failed');
        localStorage.removeItem('authToken');
        window.location.href = '/index.html';
    } catch (error) {
        console.error('Logout error:', error);
        Swal.fire('Logout failed. Please try again.');
    }
}

async function fetchUserEmail(token) {
    try {
        const response = await fetch('https://food-delivery.int.kreosoft.space/api/account/profile', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) throw new Error('Failed to fetch user data');
        const data = await response.json();
        return data.email;
    } catch (error) {
        console.error('Error fetching user email:', error);
        return null;
    }
}
function initializeNavbar() {
    updateAuthButton();
    document.getElementById("logout-button")?.addEventListener("click", handleLogout);
}
document.addEventListener('DOMContentLoaded', () => {

});