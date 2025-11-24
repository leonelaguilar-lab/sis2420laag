// /core/models/Producto.js

/**
 * Clase que representa un componente de PC en el inventario.
 */
export class Producto {
    /**
     * @param {string} nombre - Nombre del componente (ej. 'Ryzen 5 5600X').
     * @param {string} categoria - Categoría del componente (ej. 'cpu', 'gpu', 'ram').
     * @param {number} precio - Precio unitario del componente.
     * @param {number} stock - Cantidad disponible en inventario.
     * @param {number} [potencia=0] - Puntaje de rendimiento (0 si no aplica).
     */
    constructor(nombre, categoria, precio, stock, potencia = 0) {
        // Validación de datos básica al crear el objeto
        if (typeof nombre !== 'string' || nombre.trim() === '') {
            throw new Error('El nombre del producto es requerido.');
        }
        if (!['cpu', 'gpu', 'ram', 'psu', 'case', 'otros'].includes(categoria.toLowerCase())) {
            throw new Error(`Categoría inválida: ${categoria}.`);
        }
        if (typeof precio !== 'number' || precio <= 0) {
            throw new Error('El precio debe ser un número positivo.');
        }
        if (typeof stock !== 'number' || !Number.isInteger(stock) || stock < 0) {
            throw new Error('El stock debe ser un número entero no negativo.');
        }
        if (typeof potencia !== 'number' || potencia < 0) {
            throw new Error('La potencia debe ser un número no negativo.');
        }

        this.nombre = nombre.trim();
        this.categoria = categoria.toLowerCase();
        this.precio = precio;
        this.stock = stock;
        this.potencia = potencia;
        // Asignamos un ID simple basado en el nombre (puedes mejorarlo en la BD)
        this.id = nombre.toLowerCase().replace(/\s/g, '-'); 
    }
}

/**
 * Clase que representa un artículo en el carrito de compras.
 * Extiende de Producto para mantener sus propiedades, pero añade la cantidad.
 */
export class ItemCarrito extends Producto {
    /**
     * @param {Producto} producto - El objeto Producto base.
     * @param {number} cantidad - Cantidad deseada por el cliente.
     */
    constructor(producto, cantidad) {
        // Llama al constructor de Producto, incluyendo la potencia
        super(producto.nombre, producto.categoria, producto.precio, producto.stock, producto.potencia); 

        if (typeof cantidad !== 'number' || !Number.isInteger(cantidad) || cantidad <= 0) {
            throw new Error('La cantidad debe ser un número entero positivo.');
        }
        // Nota: En la lógica de negocio, se valida que cantidad <= producto.stock
        
        this.cantidad = cantidad;
    }

    getSubtotal() {
        return this.precio * this.cantidad;
    }
}