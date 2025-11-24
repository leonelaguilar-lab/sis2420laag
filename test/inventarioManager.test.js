import { InventarioManager } from '../core/managers/InventarioManager.js';
import { Producto } from '../core/models/Producto.js';
import { IInventario } from '../core/interfaces/IInventario.js';
import { expect, test, describe, beforeEach } from 'bun:test';

// Clase Mock que simula la base de datos y cumple con la interfaz IInventario
class MockInventarioRepo extends IInventario {
    constructor(inventarioInicial) {
        super(); // Esencial al heredar
        // Copiamos para no modificar el array original entre tests
        this.inventarioActual = inventarioInicial.map(p => new Producto(p.nombre, p.categoria, p.precio, p.stock, p.potencia));
    }
    
    cargarTodos() {
        return this.inventarioActual;
    }
    
    guardarTodos(data) {
        this.inventarioActual = data;
    }
    
    obtenerPorId(id) {
        return this.inventarioActual.find(p => p.id === id);
    }
}

// Datos iniciales para el mock, ahora con 'potencia'
const mockInventarioInicial = [
    new Producto('CPU Test', 'cpu', 300, 5, 75), // id se autogenera a 'cpu-test'
    new Producto('GPU Test', 'gpu', 500, 10, 80), // id se autogenera a 'gpu-test'
];

describe('InventarioManager (Con Mock de DB)', () => {
    let manager;

    beforeEach(() => {
        // Antes de cada test, creamos un repo y un manager nuevos.
        const mockRepo = new MockInventarioRepo(mockInventarioInicial);
        manager = new InventarioManager(mockRepo);
    });

    test('debería cargar el inventario inicial', () => {
        const productos = manager.obtenerTodos();
        expect(productos.length).toBe(2);
        expect(productos[0].nombre).toBe('CPU Test');
    });

    test('debería agregar un nuevo producto', () => {
        // La firma de agregarProducto en el manager podría necesitar ajuste si también
        // debe tomar 'potencia'. Asumiendo que es `(nombre, cat, precio, stock, potencia)`
        manager.agregarProducto('RAM Test', 'ram', 50, 20, 0);
        const productos = manager.obtenerTodos();
        
        const ramTestProd = productos.find(p => p.nombre === 'RAM Test');
        
        expect(productos.length).toBe(3);
        expect(ramTestProd).toBeDefined();
        expect(ramTestProd.categoria).toBe('ram');
    });
    
    test('debería eliminar un producto por ID', () => {
        const idParaEliminar = 'gpu-test'; // ID autogenerado
        manager.eliminarProducto(idParaEliminar);
        const productos = manager.obtenerTodos();
        expect(productos.length).toBe(1);
        expect(productos.some(p => p.id === idParaEliminar)).toBe(false);
    });
    
    test('debería fallar al eliminar un producto que no existe', () => {
        const idInexistente = 'id-no-existe';
        expect(() => manager.eliminarProducto(idInexistente)).toThrow(`Producto con ID ${idInexistente} no encontrado.`);
    });
});
