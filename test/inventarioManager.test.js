import { InventarioManager } from '../core/managers/InventarioManager.js';
import { Producto } from '../core/models/Producto.js';
import { sequelize } from '../core/data/database.js';
import { expect, test, describe, beforeAll, afterAll, beforeEach } from 'bun:test';

// Datos iniciales para cada test
const mockInventarioInicial = [
    { id: 'cpu-test', nombre: 'CPU Test', categoria: 'cpu', precio: 300, stock: 5, potencia: 75 },
    { id: 'gpu-test', nombre: 'GPU Test', categoria: 'gpu', precio: 500, stock: 10, potencia: 80 },
    { id: 'ram-test', nombre: 'RAM Test', categoria: 'ram', precio: 50, stock: 20, potencia: 0 },
];

describe('InventarioManager (Integración con Sequelize)', () => {
    let manager;

    // Conectar a la base de datos y sincronizar modelos una vez antes de todos los tests
    beforeAll(async () => {
        await sequelize.sync({ force: true });
        manager = new InventarioManager();
    });

    // Limpiar y poblar la base de datos antes de cada test
    beforeEach(async () => {
        await Producto.destroy({ truncate: true });
        await Producto.bulkCreate(mockInventarioInicial);
    });

    // Cerrar la conexión a la base de datos después de todos los tests
    afterAll(async () => {
        await sequelize.close();
    });

    test('debería cargar el inventario inicial', async () => {
        const productos = await manager.obtenerTodos();
        expect(productos.length).toBe(mockInventarioInicial.length);
        expect(productos[0].nombre).toBe('CPU Test');
    });

    test('debería agregar un nuevo producto', async () => {
        const nuevoProducto = {
            nombre: 'SSD Test', 
            categoria: 'otros', 
            precio: 100, 
            stock: 15, 
            potencia: 0
        };
        await manager.agregarProducto(
            nuevoProducto.nombre, 
            nuevoProducto.categoria, 
            nuevoProducto.precio, 
            nuevoProducto.stock, 
            nuevoProducto.potencia
        );
        
        const productos = await manager.obtenerTodos();
        const ssdTestProd = productos.find(p => p.nombre === 'SSD Test');
        
        expect(productos.length).toBe(mockInventarioInicial.length + 1);
        expect(ssdTestProd).toBeDefined();
        expect(ssdTestProd.categoria).toBe('otros');
    });
    
    test('debería eliminar un producto por ID', async () => {
        const idParaEliminar = 'gpu-test';
        await manager.eliminarProducto(idParaEliminar);
        const productos = await manager.obtenerTodos();
        expect(productos.length).toBe(mockInventarioInicial.length - 1);
        expect(productos.some(p => p.id === idParaEliminar)).toBe(false);
    });
    
    test('debería fallar al eliminar un producto que no existe', async () => {
        const idInexistente = 'id-no-existe';
        await expect(manager.eliminarProducto(idInexistente)).rejects.toThrow(`Producto con ID ${idInexistente} no encontrado.`);
    });

    test('debería obtener un producto por ID', async () => {
        const producto = await manager.obtenerPorId('cpu-test');
        expect(producto).toBeDefined();
        expect(producto.nombre).toBe('CPU Test');
    });

    test('debería actualizar el stock de un producto', async () => {
        const idProducto = 'cpu-test';
        const cantidadAfectada = -2; // Vender 2 unidades
        await manager.actualizarStock(idProducto, cantidadAfectada);

        const productoActualizado = await manager.obtenerPorId(idProducto);
        expect(productoActualizado.stock).toBe(mockInventarioInicial[0].stock + cantidadAfectada);
    });

    test('debería lanzar un error si se intenta actualizar stock de producto inexistente', async () => {
        const idInexistente = 'non-existent-id';
        await expect(manager.actualizarStock(idInexistente, -1)).rejects.toThrow(`Producto con ID ${idInexistente} no encontrado para actualizar stock.`);
    });
});

