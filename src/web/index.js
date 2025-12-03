import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { inicializarBaseDeDatos } from '../../core/data/setup.js';
import { InventarioManager } from '../../core/managers/InventarioManager.js';
import { CarritoManager } from '../../core/managers/CarritoManager.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middlewares ---
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- Managers ---
const inventarioManager = new InventarioManager();
const carritoManager = new CarritoManager(inventarioManager);

// Ruta para la página principal (homepage)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Rutas para las nuevas páginas HTML
app.get('/categoria/:nombre', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'categoria.html'));
});

app.get('/producto/:id', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'producto.html'));
});

app.get('/carrito', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'carrito.html'));
});

app.get('/busqueda', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'busqueda.html'));
});


// --- Rutas de la API ---

app.get('/api', (req, res) => {
    res.json({
        message: 'Bienvenido a la API de la Tienda de Componentes',
        rutas: {
            inventario: 'GET /api/inventario',
            productos_destacados: 'GET /api/inventario/destacados',
            producto_por_id: 'GET /api/inventario/producto/:id',
            inventario_por_categoria: 'GET /api/inventario/categoria/:categoria',
            categorias: 'GET /api/categorias',
            carrito: 'GET /api/carrito',
            agregar_al_carrito: 'POST /api/carrito',
            eliminar_del_carrito: 'DELETE /api/carrito/:indice',
            finalizar_compra: 'POST /api/carrito/finalizar'
        }
    });
});

// --- Rutas de Inventario ---
app.get('/api/inventario', async (req, res) => {
    try {
        const productos = await inventarioManager.obtenerTodos();
        res.json(productos);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener el inventario.' });
    }
});

app.get('/api/inventario/destacados', async (req, res) => {
    try {
        const productos = await inventarioManager.obtenerDestacados();
        res.json(productos);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener productos destacados.' });
    }
});

app.get('/api/inventario/producto/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const producto = await inventarioManager.obtenerPorId(id);
        if (!producto) {
            return res.status(404).json({ message: `Producto con id '${id}' no encontrado.` });
        }
        res.json(producto);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener el producto.' });
    }
});

app.get('/api/inventario/producto/:id/recomendaciones', async (req, res) => {
    const { id } = req.params;
    try {
        // Primero, obtenemos el producto actual para saber su categoría
        const productoActual = await inventarioManager.obtenerPorId(id);
        if (!productoActual) {
            return res.status(404).json({ message: `Producto con id '${id}' no encontrado.` });
        }
        
        const recomendaciones = await inventarioManager.obtenerRecomendaciones(productoActual.categoria, id);
        res.json(recomendaciones);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener las recomendaciones.' });
    }
});

app.get('/api/inventario/categoria/:categoria', async (req, res) => {
    const { categoria } = req.params;
    try {
        const productos = await inventarioManager.obtenerPorCategoria(categoria);
        res.json(productos);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener productos por categoría.' });
    }
});

app.get('/api/categorias', async (req, res) => {
    try {
        const categorias = await inventarioManager.obtenerCategorias();
        res.json(categorias);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener las categorías.' });
    }
});

app.get('/api/busqueda', async (req, res) => {
    const { q } = req.query;
    if (!q) {
        return res.status(400).json({ error: 'El parámetro de búsqueda "q" es requerido.' });
    }
    try {
        const resultados = await inventarioManager.buscar(q);
        res.json(resultados);
    } catch (error) {
        res.status(500).json({ error: 'Error al realizar la búsqueda.' });
    }
});

// --- Rutas de Carrito ---
app.get('/api/carrito', (req, res) => {
    const items = carritoManager.obtenerItems();
    const total = carritoManager.calcularTotal();
    const analisis = carritoManager.calcularCuelloBotella();
    res.json({ items, total, analisis });
});

app.post('/api/carrito', async (req, res) => {
    const { id, cantidad } = req.body;
    if (!id || !cantidad) {
        return res.status(400).json({ error: 'Se requiere "id" y "cantidad" en el body.' });
    }

    try {
        const producto = await inventarioManager.obtenerPorId(id);
        if (!producto) {
            return res.status(404).json({ error: 'Producto no encontrado.' });
        }

        await carritoManager.agregarItem(producto, cantidad);
        res.status(201).json({ message: 'Producto agregado al carrito.', carrito: carritoManager.obtenerItems() });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.delete('/api/carrito/:indice', async (req, res) => {
    const indice = parseInt(req.params.indice, 10);
    if (isNaN(indice)) {
        return res.status(400).json({ error: 'El índice debe ser un número.' });
    }

    try {
        const itemEliminado = await carritoManager.eliminarItem(indice);
        res.json({ message: `'${itemEliminado.nombre}' eliminado del carrito, Stock devuelto` });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/api/carrito/finalizar', (req, res) => {
    try {
        if (carritoManager.obtenerItems().length === 0) {
            return res.status(400).json({ error: 'El carrito está vacío' });
        }
        carritoManager.finalizarCompra();
        res.json({ message: 'Compra finalizada con éxito.' });
    } catch (error) {
        res.status(500).json({ error: 'Ocurrió un error al finalizar la compra' });
    }
});

async function startServer() {
    try {
        await inicializarBaseDeDatos();

        app.listen(PORT, () => {
            console.log(`🚀 Servidor web escuchando en http://localhost:${PORT}`);
            console.log(`API disponible en http://localhost:${PORT}/api`);
        });

    } catch (error) {
        console.error(' Error fatal el servidor no pudo iniciar');
        process.exit(1);
    }
}

startServer();
