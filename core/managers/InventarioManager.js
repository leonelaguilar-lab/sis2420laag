// /core/managers/InventarioManager.js
import { IInventario } from '../interfaces/IInventario.js';
import { Producto } from '../models/Producto.js';

/**
 * Manager para la lógica de negocio relacionada con el Inventario.
 * Depende de una implementación de IInventario (Inyección de Dependencia).
 */
export class InventarioManager {
    /**
     * @param {IInventario} inventarioRepo - El repositorio concreto (JSON o SQLite)
     * que implementa IInventario.
     */
    constructor(inventarioRepo) {
        if (!(inventarioRepo instanceof IInventario)) {
            throw new Error('InventarioManager requiere una instancia de IInventario.');
        }
        this.repo = inventarioRepo;
    }

    /**
     * Obtiene todos los productos del repositorio.
     * @returns {Producto[]}
     */
    obtenerTodos() {
        // Aquí se pueden agregar filtros o transformaciones antes de devolver
        return this.repo.cargarTodos();
    }

    /**
     * Agrega un nuevo producto. Aquí se valida que el objeto sea correcto antes de guardar.
     * @param {string} nombre
     * @param {string} categoria
     * @param {number} precio
     * @param {number} stock
     */
    agregarProducto(nombre, categoria, precio, stock, potencia = 0) {
        // La creación del Producto se considera lógica de negocio/modelo
        const nuevoProducto = new Producto(nombre, categoria, precio, stock, potencia); 
        
        const inventario = this.obtenerTodos();
        inventario.push(nuevoProducto);
        this.repo.guardarTodos(inventario);

        return nuevoProducto;
    }
    
    // Aquí iría el resto de tu lógica de gestión (eliminarProducto, etc.)
    
    eliminarProducto(id) {
        const inventario = this.obtenerTodos();
        const indice = inventario.findIndex(p => p.id === id);

        if (indice === -1) {
            throw new Error(`Producto con ID ${id} no encontrado.`);
        }

        inventario.splice(indice, 1);
        this.repo.guardarTodos(inventario);
    }

    obtenerPorId(id) {
        return this.repo.obtenerPorId(id);
    }

    actualizarStock(id, cantidad) {
        const producto = this.repo.obtenerPorId(id);
        if (!producto) {
            throw new Error(`Producto con ID ${id} no encontrado.`);
        }
        this.repo.actualizarStock(id, cantidad);
    }
}