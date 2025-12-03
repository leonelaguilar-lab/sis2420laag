document.addEventListener('DOMContentLoaded', () => {
    console.log('Index script loaded');
    loadHomepageContent();
});

async function loadHomepageContent() {
    try {
        const [destacadosRes, categoriasRes] = await Promise.all([
            fetch('/api/inventario/destacados'),
            fetch('/api/categorias')
        ]);

        if (!destacadosRes.ok || !categoriasRes.ok) {
            throw new Error('No se pudo cargar el contenido de la página principal.');
        }

        const destacados = await destacadosRes.json();
        const categorias = await categoriasRes.json();

        renderCarousel(destacados);
        initializeCarousel(); // Initialize the carousel logic
        renderCategories(categorias);

    } catch (error) {
        console.error('Error:', error);
        // Aquí podríamos mostrar un mensaje de error en la UI
    }
}

function renderCarousel(productos) {
    const slidesContainer = document.getElementById('carousel-slides-container');
    if (!slidesContainer) return;

    if (productos.length === 0) {
        document.getElementById('hero-carousel').innerHTML = '<p>No hay productos destacados en este momento.</p>';
        return;
    }

    slidesContainer.innerHTML = productos.map((producto, index) => `
        <div class="carousel-slide ${index === 0 ? 'active' : ''}">
            <a href="/producto/${producto.id}" class="hero-card">
                <img src="${producto.imagenUrl}" alt="${producto.nombre}" class="hero-image">
                <div class="hero-info">
                    <h3>${producto.nombre}</h3>
                    <p>Ver detalles &rarr;</p>
                </div>
            </a>
        </div>
    `).join('');
}

function initializeCarousel() {
    const slidesContainer = document.getElementById('carousel-slides-container');
    if (!slidesContainer || slidesContainer.children.length <= 1) {
        // Don't initialize if no slides or only one slide
        document.getElementById('carousel-btn-prev').style.display = 'none';
        document.getElementById('carousel-btn-next').style.display = 'none';
        return;
    }

    const slides = document.querySelectorAll('.carousel-slide');
    const prevBtn = document.getElementById('carousel-btn-prev');
    const nextBtn = document.getElementById('carousel-btn-next');
    let currentIndex = 0;
    let autoScrollInterval;

    function showSlide(index) {
        slides.forEach((slide, i) => {
            slide.classList.remove('active');
            if (i === index) {
                slide.classList.add('active');
            }
        });
    }

    function nextSlide() {
        currentIndex = (currentIndex + 1) % slides.length;
        showSlide(currentIndex);
    }

    function prevSlide() {
        currentIndex = (currentIndex - 1 + slides.length) % slides.length;
        showSlide(currentIndex);
    }

    function startAutoScroll() {
        autoScrollInterval = setInterval(nextSlide, 5000); // Change slide every 5 seconds
    }

    function resetAutoScroll() {
        clearInterval(autoScrollInterval);
        startAutoScroll();
    }

    nextBtn.addEventListener('click', () => {
        nextSlide();
        resetAutoScroll();
    });

    prevBtn.addEventListener('click', () => {
        prevSlide();
        resetAutoScroll();
    });

    startAutoScroll();
}

function renderCategories(categorias) {
    const categoriesGrid = document.getElementById('categories-grid');
    if (!categoriesGrid) return;

    if (categorias.length === 0) {
        categoriesGrid.innerHTML = '<p>No hay categorías disponibles.</p>';
        return;
    }
    
    categoriesGrid.innerHTML = categorias.map(categoria => {
        const categoryImageUrl = `/images/categorias/${categoria}.svg`;
        return `
            <a href="/categoria/${categoria}" class="product-card">
                <div class="product-card-image-container">
                    <img src="${categoryImageUrl}" alt="${categoria}" class="product-card-image">
                </div>
                <div class="product-card-info">
                    <h4 class="product-card-name">${categoria.charAt(0).toUpperCase() + categoria.slice(1)}</h4>
                </div>
            </a>
        `;
    }).join('');

    // Forzar estilos de grid con JS para evitar problemas de caché
    categoriesGrid.style.display = 'grid';
    categoriesGrid.style.gridTemplateColumns = 'repeat(3, 1fr)';
    categoriesGrid.style.gap = '2rem';
}
