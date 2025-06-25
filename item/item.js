(() => {
    const apiBaseUrl = `${window.API_BASE_URL}/dish`;
    const dishId = new URLSearchParams(window.location.search).get('id');
    const fullTpl = document.getElementById('star-full-template').content;
    const halfTpl = document.getElementById('star-half-template').content;
    const emptyTpl = document.getElementById('star-empty-template').content;

    document.addEventListener('DOMContentLoaded', () => {
        if (!dishId) return Swal.fire('Dish ID not found');
        injectRatingModal();        // from main.js
        fetchDishDetails();
    });

    async function fetchDishDetails() {
        try {
            const res = await fetch(`${apiBaseUrl}/${dishId}`, { headers: { Accept: 'application/json' } });
            if (!res.ok) throw new Error('Fetch failed');
            populateDishDetails(await res.json());
        } catch (err) {
            console.error(err);
            Swal.fire('Error loading dish');
        }
    }

    function populateDishDetails(d) {
        const img = document.getElementById('dish-image');
        img.src = d.image || 'https://via.placeholder.com/400';
        img.alt = d.name;
        document.getElementById('dish-name').textContent = d.name;
        document.getElementById('dish-category').textContent = d.category;
        document.getElementById('dish-description').textContent = d.description;
        document.getElementById('dish-price').textContent = `$${d.price.toFixed(2)}`;
        const rd = document.getElementById('rating-display');
        rd.innerHTML = '';
        const starsFrag = renderStars(d.rating);
        rd.appendChild(starsFrag);
        attachRatingEvents(rd, d.id);
    }
})();
