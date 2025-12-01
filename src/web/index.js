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

// Ruta para la página principal (frontend)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- Rutas de la API ---

app.get('/api', (req, res) => {
    res.json({
        message: 'Bienvenido a la API de la Tienda de Componentes',
        rutas: {
            inventario: 'GET /api/inventario',
            inventario_por_categoria: 'GET /api/inventario/:categoria',
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

app.get('/api/inventario/:categoria', async (req, res) => {
    const { categoria } = req.params;
    try {
        const productos = await inventarioManager.obtenerPorCategoria(categoria);
        if (productos.length === 0) {
            return res.status(404).json({ message: `No se encontraron productos en la categoría '${categoria}' o no hay stock.` });
        }
        res.json(productos);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener productos por categoría.' });
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
