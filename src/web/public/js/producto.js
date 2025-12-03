document.addEventListener('DOMContentLoaded', () => {
    console.log('Producto script loaded');
    loadProductPageContent();
});

async function loadProductPageContent() {
    const productId = getProductIdFromURL();
    if (!productId) {
        document.getElementById('product-detail-container').innerHTML = '<p>Producto no encontrado.</p>';
        return;
    }

    try {
        const [productRes, recommendationsRes] = await Promise.all([
            fetch(`/api/inventario/producto/${productId}`),
            fetch(`/api/inventario/producto/${productId}/recomendaciones`)
        ]);

        if (!productRes.ok) {
            throw new Error('Producto no encontrado');
        }

        const product = await productRes.json();
        const recommendations = recommendationsRes.ok ? await recommendationsRes.json() : [];

        renderProductDetails(product);
        renderRecommendations(recommendations);
        
        // Adjuntar el evento después de renderizar el botón
        attachAddToCartEvent(product);

    } catch (error) {
        console.error('Error:', error);
        document.getElementById('product-detail-container').innerHTML = `<p>${error.message}.</p>`;
    }
}

function getProductIdFromURL() {
    const path = window.location.pathname;
    const parts = path.split('/');
    return parts.pop() || parts.pop();
}

function renderProductDetails(product) {
    const container = document.getElementById('product-detail-container');
    document.title = `${product.nombre} - Tienda de Componentes`;

    // Formatear características
    let caracteristicasHTML = '<ul>';
    for (const [key, value] of Object.entries(product.caracteristicas)) {
        caracteristicasHTML += `<li><strong>${key.charAt(0).toUpperCase() + key.slice(1)}:</strong> ${value}</li>`;
    }
    caracteristicasHTML += '</ul>';

    container.innerHTML = `
        <div class="product-detail-layout">
            <div class="product-image-section">
                <img src="${product.imagenUrl}" alt="${product.nombre}">
            </div>
            <div class="product-info-section">
                <h1>${product.nombre}</h1>
                <div class="product-specs">
                    <h3>Características:</h3>
                    ${caracteristicasHTML}
                </div>
            </div>
            <div class="product-purchase-section">
                <div class="price-box">
                    <span class="price">${product.precio.toFixed(2)} Bs</span>
                    <span class="stock">Stock: ${product.stock}</span>
                </div>
                <button id="add-to-cart-btn" class="btn-primary" ${product.stock === 0 ? 'disabled' : ''}>
                    ${product.stock > 0 ? 'Añadir al Carrito' : 'Sin Stock'}
                </button>
            </div>
        </div>
    `;
}

function renderRecommendations(products) {
    const container = document.getElementById('recommendations-grid');
    if (!container) return;

    if (products.length === 0) {
        document.querySelector('.recommendations-container').style.display = 'none';
        return;
    }
    
    // Reutilizamos la función de renderizado de la página de categoría si es posible,
    // o una similar. Aquí una versión simplificada:
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

function attachAddToCartEvent(product) {
    const btn = document.getElementById('add-to-cart-btn');
    if (!btn) return;

    btn.addEventListener('click', async () => {
        try {
            const response = await fetch('/api/carrito', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: product.id, cantidad: 1 })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Error al añadir al carrito');
            }
            
            // Dispara el evento para que el header se actualice
            document.dispatchEvent(new CustomEvent('cart-updated'));

            // Opcional: mostrar una notificación de éxito
            alert('¡Producto añadido al carrito!');
            
        } catch (error) {
            alert(error.message);
        }
    });
}
