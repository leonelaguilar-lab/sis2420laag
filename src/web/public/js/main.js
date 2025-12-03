document.addEventListener('DOMContentLoaded', async () => {
    console.log('Main script loaded');
    setInitialTheme();
    await loadComponents();
    initializeEventListeners();
    
    // Update cart count on initial load, ensuring header is present
    const observer = new MutationObserver((mutations, obs) => {
        const cartCountSpan = document.getElementById('cart-item-count');
        if (cartCountSpan) {
            updateCartCount(); // Initial update
            obs.disconnect();
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // Listen for custom event to update cart count from other scripts
    document.addEventListener('cart-updated', updateCartCount);
});

function setInitialTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
}

async function loadComponents() {
    const headerPlaceholder = document.querySelector('header.main-header');
    const footerPlaceholder = document.querySelector('footer.main-footer');

    try {
        const [headerRes, footerRes] = await Promise.all([
            fetch('/components/header.html'),
            fetch('/components/footer.html')
        ]);

        if (headerRes.ok && headerPlaceholder) {
            headerPlaceholder.innerHTML = await headerRes.text();
        }

        if (footerRes.ok && footerPlaceholder) {
            footerPlaceholder.innerHTML = await footerRes.text();
        }
    } catch (error) {
        console.error('Error loading components:', error);
    }
}

function initializeEventListeners() {
    // Event delegation for dynamically loaded header elements
    document.body.addEventListener('click', (e) => {
        if (e.target.matches('#search-btn')) {
            performSearch();
        }
        if (e.target.matches('#theme-toggle-btn')) {
            toggleTheme();
        }
    });

    document.body.addEventListener('keyup', (e) => {
        if (e.target.matches('#search-input') && e.key === 'Enter') {
            performSearch();
        }
    });
}

function performSearch() {
    const searchInput = document.getElementById('search-input');
    const query = searchInput.value.trim();
    if (query) {
        window.location.href = `/busqueda?q=${encodeURIComponent(query)}`;
    }
}

function toggleTheme() {
    const htmlEl = document.documentElement;
    const currentTheme = htmlEl.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    htmlEl.setAttribute('data-theme', newTheme);
localStorage.setItem('theme', newTheme);
}

async function updateCartCount() {
    try {
        const res = await fetch('/api/carrito');
        if (!res.ok) {
            console.error('Failed to fetch cart data for count update.');
            return;
        }
        const cart = await res.json();
        
        const cartCountSpan = document.getElementById('cart-item-count');
        if (cartCountSpan) {
            const itemCount = cart.items.reduce((sum, item) => sum + item.cantidad, 0);
            cartCountSpan.textContent = itemCount;
            // Add a class to make it pop briefly
            cartCountSpan.classList.add('updated');
            setTimeout(() => cartCountSpan.classList.remove('updated'), 500);
        }
    } catch (error) {
        console.error('Error updating cart count:', error);
    }
}
