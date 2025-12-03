document.addEventListener('DOMContentLoaded', () => {
    console.log('Busqueda script loaded');
    loadSearchResults();
});

async function loadSearchResults() {
    const titleElem = document.getElementById('search-results-title');
    const resultsGrid = document.getElementById('search-results-container');

    try {
        const query = getSearchQueryFromURL();
        if (!query) {
            titleElem.textContent = 'Realiza una búsqueda';
            resultsGrid.innerHTML = '<p>Usa la barra de búsqueda para encontrar productos.</p>';
            return;
        }

        titleElem.textContent = `Resultados para: "${decodeURIComponent(query)}"`;
        
        const response = await fetch(`/api/busqueda?q=${query}`);
        if (!response.ok) {
            throw new Error('Error al conectar con el servidor de búsqueda.');
        }

        const products = await response.json();
        renderProductGrid(products, resultsGrid);

    } catch (error) {
        console.error('Error:', error);
        resultsGrid.innerHTML = `<p>Ocurrió un error al realizar la búsqueda. Por favor, intente más tarde.</p>`;
    }
}

function getSearchQueryFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('q');
}

function renderProductGrid(products, container) {
    if (!container) return;

    if (products.length === 0) {
        container.innerHTML = '<p>No se encontraron productos que coincidan con tu búsqueda.</p>';
        return;
    }

    container.innerHTML = products.map(product => `
        <a href="/producto/${product.id}" class="product-card">
            <div class="product-card-image-container">
                <img src="${product.imagenUrl}" alt="${product.nombre}" class="product-card-image">
            </div>
            <div class="product-card-info">
                <h4 class="product-card-name">${product.nombre}</h4>
                <p class="product-card-price">${product.precio.toFixed(2)} Bs</p>
            </div>
        </a>
    `).join('');
}
