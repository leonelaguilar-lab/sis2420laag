document.addEventListener('DOMContentLoaded', () => {
    const inventoryList = document.getElementById('inventory-list');
    const cartItemsList = document.getElementById('cart-items');
    const cartTotalElem = document.getElementById('cart-total');
    const bottleneckAnalysisElem = document.getElementById('bottleneck-analysis');
    const finalizeBtn = document.getElementById('finalize-btn');

    const API_BASE_URL = '/api';


    const renderInventory = (products) => {
        inventoryList.innerHTML = '';
        if (products.length === 0) {
            inventoryList.innerHTML = '<li>No hay productos disponibles.</li>';
            return;
        }

        // Agrupar productos por categoría
        const groupedInventory = products.reduce((acc, product) => {
            const category = product.categoria;
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(product);
            return acc;
        }, {});

        // Ordenar las categorías para una vista consistente
        const sortedCategories = Object.keys(groupedInventory).sort();

        for (const category of sortedCategories) {
            const categoryTitle = document.createElement('h3');
            categoryTitle.textContent = category.toUpperCase();
            categoryTitle.style.color = 'var(--primary-color)';
            categoryTitle.style.paddingLeft = '1rem';
            categoryTitle.style.marginTop = '2rem';
            inventoryList.appendChild(categoryTitle);

            groupedInventory[category].forEach(product => {
                const item = document.createElement('li');
                item.className = 'product';
                item.innerHTML = `
                    <div class="product-info">
                        <div class="product-name">${product.nombre}</div>
                        <div class="product-details">Stock: ${product.stock}</div>
                    </div>
                    <div class="product-actions">
                        <span class="product-price">${product.precio.toFixed(2)} Bs</span>
                        <button class="add-to-cart-btn" data-id="${product.id}" ${product.stock === 0 ? 'disabled' : ''}>
                            Agregar
                        </button>
                    </div>
                `;
                inventoryList.appendChild(item);
            });
        }
    };

    const renderCart = (cartData) => {
        cartItemsList.innerHTML = '';
        if (!cartData || !cartData.items || cartData.items.length === 0) {
            cartItemsList.innerHTML = '<li>El carrito está vacío.</li>';
        } else {
            cartData.items.forEach((item, index) => {
                const cartItem = document.createElement('li');
                cartItem.className = 'cart-item';
                cartItem.innerHTML = `
                    <div class="cart-item-info">
                        <div class="cart-item-name">${item.nombre} (x${item.cantidad})</div>
                        <div class="cart-item-details">${item.precio.toFixed(2)} Bs c/u</div>
                    </div>
                    <div class="cart-item-actions">
                        <span class="cart-item-subtotal">${item.getSubtotal().toFixed(2)} Bs</span>
                        <button class="remove-btn" data-index="${index}">X</button>
                    </div>
                `;
                cartItemsList.appendChild(cartItem);
            });
        }

        cartTotalElem.textContent = `Total: ${cartData.total.toFixed(2)} Bs`;

        const { analisis } = cartData;
        if (analisis && analisis.mensaje) {
            bottleneckAnalysisElem.textContent = analisis.mensaje;
            bottleneckAnalysisElem.className = 'bottleneck-analysis';
            bottleneckAnalysisElem.classList.add(analisis.esCuello ? 'is-bottleneck' : 'is-balanced');
        } else {
            bottleneckAnalysisElem.textContent = 'Agrega una CPU y una GPU para analizar.';
            bottleneckAnalysisElem.className = 'bottleneck-analysis';
        }
    };

    // --- APIs ---
    const fetchAndRenderAll = async () => {
        try {
            const [invRes, cartRes] = await Promise.all([
                fetch(`${API_BASE_URL}/inventario`),
                fetch(`${API_BASE_URL}/carrito`)
            ]);
            if (!invRes.ok || !cartRes.ok) {
                throw new Error('Error en la respuesta de la API');
            }
            const inventory = await invRes.json();
            const cart = await cartRes.json();
            
            if (cart.items) {
                cart.items.forEach(item => {
                    item.getSubtotal = function() { return this.precio * this.cantidad; };
                });
            }

            renderInventory(inventory);
            renderCart(cart);
        } catch (error) {
            console.error("Error al cargar los datos:", error);
            inventoryList.innerHTML = '<li>Error al cargar inventario.</li>';
            cartItemsList.innerHTML = '<li>Error al cargar carrito.</li>';
        }
    };
    
    const addToCart = async (productId, quantity) => {
        try {
            const response = await fetch(`${API_BASE_URL}/carrito`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: productId, cantidad: quantity })
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Error al añadir al carrito');
            }
            await fetchAndRenderAll();
        } catch (error) {
            alert(error.message);
        }
    };
    
    const removeFromCart = async (index) => {
        try {
            const response = await fetch(`${API_BASE_URL}/carrito/${index}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Error al eliminar del carrito');
            await fetchAndRenderAll();
        } catch (error) {
            alert(error.message);
        }
    };

    const finalizePurchase = async () => {
        try {
            const cartResponse = await fetch(`${API_BASE_URL}/carrito`);
            const cart = await cartResponse.json();
            if (cart.items.length === 0) {
                alert("El carrito está vacío.");
                return;
            }
            
            const response = await fetch(`${API_BASE_URL}/carrito/finalizar`, {
                method: 'POST'
            });
             if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Error al finalizar la compra');
            }
            const result = await response.json();
            alert(result.message);
            await fetchAndRenderAll();
        } catch(error) {
            alert(error.message);
        }
    };



    inventoryList.addEventListener('click', (e) => {
        if (e.target && e.target.classList.contains('add-to-cart-btn')) {
            const productId = e.target.dataset.id;
            addToCart(productId, 1);
        }
    });

    cartItemsList.addEventListener('click', (e) => {
        if (e.target && e.target.classList.contains('remove-btn')) {
            const index = e.target.dataset.index;
            removeFromCart(index);
        }
    });
    
    finalizeBtn.addEventListener('click', finalizePurchase);


    fetchAndRenderAll();
});