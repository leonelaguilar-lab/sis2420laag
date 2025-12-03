document.addEventListener('DOMContentLoaded', () => {
    console.log('Carrito script loaded');
    loadCartPageContent();
});

async function loadCartPageContent() {
    const cartItemsList = document.getElementById('cart-items-list');
    const cartTotalAmount = document.getElementById('cart-total-amount');
    const bottleneckAnalysisElem = document.getElementById('bottleneck-analysis');
    
    try {
        const response = await fetch('/api/carrito');
        if (!response.ok) {
            throw new Error('No se pudo cargar el contenido del carrito.');
        }

        const cart = await response.json();
        renderCartItems(cart.items, cartItemsList);
        
        cartTotalAmount.textContent = `${cart.total.toFixed(2)} Bs`;

        if (cart.analisis && cart.analisis.mensaje) {
            bottleneckAnalysisElem.textContent = cart.analisis.mensaje;
            // Aquí se podrían añadir clases para colorear el análisis
        } else {
            bottleneckAnalysisElem.textContent = 'Agrega una CPU y GPU para analizar.';
        }

    } catch (error) {
        console.error('Error:', error);
        cartItemsList.innerHTML = `<li>Ocurrió un error al cargar el carrito.</li>`;
    }
}

function renderCartItems(items, container) {
    if (!container) return;

    if (items.length === 0) {
        container.innerHTML = '<li><p>Tu carrito está vacío.</p></li>';
        return;
    }

    container.innerHTML = items.map((item, index) => `
        <li class="cart-page-item">
            <img src="${item.producto.imagenUrl}" alt="${item.nombre}" class="cart-item-image">
            <div class="cart-item-details">
                <a href="/producto/${item.id}" class="cart-item-name">${item.nombre}</a>
                <p class="cart-item-price">${item.precio.toFixed(2)} Bs c/u</p>
                <p class="cart-item-quantity">Cantidad: ${item.cantidad}</p>
            </div>
            <div class="cart-item-subtotal">
                Subtotal: ${(item.precio * item.cantidad).toFixed(2)} Bs
            </div>
            <button class="cart-item-remove-btn" data-index="${index}">&times;</button>
        </li>
    `).join('');

    // Añadir event listeners a los botones de eliminar
    attachRemoveEventListeners();
    attachFinalizeListener();
}

function attachRemoveEventListeners() {
    const removeButtons = document.querySelectorAll('.cart-item-remove-btn');
    removeButtons.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const index = e.target.dataset.index;
            try {
                const response = await fetch(`/api/carrito/${index}`, { method: 'DELETE' });
                if (!response.ok) throw new Error('No se pudo eliminar el producto.');
                loadCartPageContent();
                document.dispatchEvent(new CustomEvent('cart-updated')); // Actualizar contador en el header
            } catch (error) {
                alert(error.message);
            }
        });
    });
}

function attachFinalizeListener() {
    const finalizeBtn = document.getElementById('finalize-purchase-btn');
    if (!finalizeBtn) return;
    
    finalizeBtn.addEventListener('click', async () => {
        try {
            const cartRes = await fetch('/api/carrito');
            const cart = await cartRes.json();

            if (cart.items.length === 0) {
                alert('Tu carrito está vacío.');
                return;
            }

            const finalizeRes = await fetch('/api/carrito/finalizar', { method: 'POST' });
            if (!finalizeRes.ok) {
                throw new Error('No se pudo finalizar la compra.');
            }

            showInvoiceModal(cart);
            document.dispatchEvent(new CustomEvent('cart-updated')); // Actualizar contador en el header a 0

        } catch (error) {
            alert(error.message);
        }
    });
}

function showInvoiceModal(cart) {
    const modal = document.getElementById('invoice-modal');
    const itemsList = document.getElementById('invoice-items-list');
    const totalElem = document.getElementById('invoice-total');
    const closeBtn = document.getElementById('invoice-close-btn');
    const closeX = modal.querySelector('.modal-close-btn');

    // Populate modal
    itemsList.innerHTML = cart.items.map(item => 
        `<li>${item.nombre} (x${item.cantidad}) - <span>${(item.precio * item.cantidad).toFixed(2)} Bs</span></li>`
    ).join('');
    totalElem.innerHTML = `<strong>Total Pagado: ${cart.total.toFixed(2)} Bs</strong>`;

    // Show modal
    modal.style.display = 'block';

    // Add close listeners
    const closeModalAndRedirect = () => {
        modal.style.display = 'none';
        window.location.href = '/'; // Redirigir a la página principal
    };
    closeBtn.addEventListener('click', closeModalAndRedirect);
    closeX.addEventListener('click', closeModalAndRedirect);
}
