document.addEventListener('DOMContentLoaded', () => {
    console.log('Categoria script loaded');
    loadCategoryContent();
});

async function loadCategoryContent() {
    const categoryTitleElem = document.getElementById('category-title');
    const productGrid = document.getElementById('product-grid-container');

    try {
        const categoryName = getCategoryNameFromURL();
        if (!categoryName) {
            throw new Error('No se pudo determinar la categoría.');
        }

        categoryTitleElem.textContent = `Categoría: ${decodeURIComponent(categoryName)}`;
        
        const response = await fetch(`/api/inventario/categoria/${categoryName}`);
        if (!response.ok) {
            productGrid.innerHTML = `<p>No se encontraron productos para esta categoría o la categoría no existe.</p>`;
            return;
        }

        const products = await response.json();
        renderProductGrid(products, productGrid);

    } catch (error) {
        console.error('Error:', error);
        productGrid.innerHTML = `<p>Ocurrió un error al cargar los productos. Por favor, intente más tarde.</p>`;
    }
}

function getCategoryNameFromURL() {
    // Extrae el nombre de la categoría de la ruta, ej: /categoria/cpu -> cpu
    const path = window.location.pathname;
    const parts = path.split('/');
    return parts.pop() || parts.pop(); // Maneja si hay una barra al final
}

function renderProductGrid(products, container) {
    if (!container) return;

    if (products.length === 0) {
        container.innerHTML = '<p>No hay productos disponibles en esta categoría.</p>';
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
