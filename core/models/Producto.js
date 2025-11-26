
import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../data/database.js';

export class Producto extends Model {
    /**
     * Carga todos los productos de la base de datos
     * @returns {Promise<Producto[]>}
     */
    static async cargarTodos() {
        return await Producto.findAll({
            order: [['categoria', 'ASC'], ['nombre', 'ASC']],
        });
    }

    /**
     * Obtiene un producto por su ID 
     * @param {string} id
     * @returns {Promise<Producto|null>}
     */
    static async obtenerPorId(id) {
        return await Producto.findByPk(id);
    }

    /**
     * Incrementa o decrementa el stock de un producto 
     * @param {string} id
     * @param {number} cantidadAfectada 
     */
    static async actualizarStock(id, cantidadAfectada) {
        const producto = await Producto.findByPk(id);
        if (producto) {
            await producto.increment('stock', { by: cantidadAfectada });
        } else {
            throw new Error(`Producto con ID ${id} no encontrado para actualizar stock.`);
        }
    }

    /**
     * Puebla la base de datos con datos iniciales si está vacía.
     */
    static async inicializarDatos() {
        const count = await Producto.count();
        if (count === 0) {
            console.log("[Sequelize] Seeding: Insertando datos de inventario de ejemplo...");

            const productosIniciales = [
                // CPUs
                { id: 'intel-i5-13600k', nombre: 'Intel Core i5-13600K', categoria: 'cpu', precio: 320.0, stock: 15, potencia: 80 },
                { id: 'intel-i7-13700k', nombre: 'Intel Core i7-13700K', categoria: 'cpu', precio: 450.0, stock: 10, potencia: 90 },
                { id: 'amd-ryzen-5-7600x', nombre: 'AMD Ryzen 5 7600X', categoria: 'cpu', precio: 250.0, stock: 20, potencia: 75 },
                { id: 'amd-ryzen-7-7800x3d', nombre: 'AMD Ryzen 7 7800X3D', categoria: 'cpu', precio: 400.0, stock: 8, potencia: 92 },
                // GPUs
                { id: 'nvidia-rtx-4060', nombre: 'NVIDIA GeForce RTX 4060 8GB', categoria: 'gpu', precio: 350.0, stock: 12, potencia: 78 },
                { id: 'nvidia-rtx-4070-super', nombre: 'NVIDIA GeForce RTX 4070 Super 12GB', categoria: 'gpu', precio: 650.0, stock: 7, potencia: 93 },
                { id: 'amd-rx-7700-xt', nombre: 'AMD Radeon RX 7700 XT 12GB', categoria: 'gpu', precio: 480.0, stock: 10, potencia: 85 },
                { id: 'amd-rx-7900-xtx', nombre: 'AMD Radeon RX 7900 XTX 24GB', categoria: 'gpu', precio: 1000.0, stock: 5, potencia: 98 },
                // RAM
                { id: 'corsair-ddr5-32gb-6000', nombre: 'Corsair Vengeance 32GB DDR5 6000MHz', categoria: 'ram', precio: 110.0, stock: 25, potencia: 0 },
                { id: 'gskill-ddr5-32gb-6400', nombre: 'G.Skill Trident Z5 32GB DDR5 6400MHz', categoria: 'ram', precio: 130.0, stock: 18, potencia: 0 },
                // PSU
                { id: 'corsair-rm750e', nombre: 'Corsair RM750e 750W Gold', categoria: 'psu', precio: 100.0, stock: 30, potencia: 0 },
                { id: 'seasonic-focus-850w', nombre: 'Seasonic FOCUS Plus 850W Gold', categoria: 'psu', precio: 140.0, stock: 22, potencia: 0 },
                // Otros
                { id: 'samsung-980-pro-1tb', nombre: 'Samsung 980 Pro 1TB NVMe SSD', categoria: 'otros', precio: 90.0, stock: 40, potencia: 0 },
                { id: 'asus-rog-strix-b650e', nombre: 'ASUS ROG STRIX B650E-F Gaming WiFi', categoria: 'otros', precio: 280.0, stock: 15, potencia: 0 },
                { id: 'nzxt-h5-flow', nombre: 'NZXT H5 Flow', categoria: 'case', precio: 85.0, stock: 18, potencia: 0 },
            ];

            await Producto.bulkCreate(productosIniciales);
            console.log("[Sequelize] Datos de ejemplo insertados.");
        }
    }
}

/**
 * Define el esquema de la tabla y lo asocia a Sequelize
 */
Producto.init({
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
    },
    nombre: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: { msg: 'El nombre del producto es requerido.' }
        }
    },
    categoria: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            isIn: {
                args: [['cpu', 'gpu', 'ram', 'psu', 'case', 'otros']],
                msg: 'Categoría inválida.'
            }
        }
    },
    precio: {
        type: DataTypes.REAL,
        allowNull: false,
        validate: {
            isFloat: { msg: 'El precio debe ser un número.' },
            min: { args: [0.01], msg: 'El precio debe ser un número positivo.' }
        }
    },
    stock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            isInt: { msg: 'El stock debe ser un número entero.' },
            min: { args: [0], msg: 'El stock debe ser un número no negativo.' }
        }
    },
    potencia: {
        type: DataTypes.REAL,
        allowNull: false,
        defaultValue: 0,
        validate: {
            isFloat: { msg: 'La potencia debe ser un número.' },
            min: { args: [0], msg: 'La potencia debe ser un número no negativo.' }
        }
    }
}, {
    sequelize,
    modelName: 'Producto',
    tableName: 'productos',
    timestamps: false
});

/**
 * Representa un artículo en el carrito de compras.
 * Usa composición (contiene un Producto) en lugar de herencia para separar
 * el modelo de la base de datos de la lógica del carrito.
 */
export class ItemCarrito {
    /**
     * @param {Producto} producto 
     * @param {number} cantidad 
     */
    constructor(producto, cantidad) {
        if (!(producto instanceof Producto)) {
            throw new Error("El primer argumento debe ser una instancia de Producto.");
        }
        if (typeof cantidad !== 'number' || !Number.isInteger(cantidad) || cantidad <= 0) {
            throw new Error('La cantidad debe ser un número entero positivo.');
        }

        this.producto = producto;
        this.cantidad = cantidad;

        this.id = producto.id;
        this.nombre = producto.nombre;
        this.categoria = producto.categoria;
        this.precio = producto.precio;
        this.stock = producto.stock;
        this.potencia = producto.potencia;
    }

    getSubtotal() {
        return this.precio * this.cantidad;
    }
}