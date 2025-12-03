
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
                { id: 'intel-i5-13600k', nombre: 'Intel Core i5-13600K', categoria: 'cpu', precio: 320.0, stock: 15, potencia: 80, imagenUrl: '/images/productos/intel-i5-13600k.svg', caracteristicas: { nucleos: 14, hilos: 20, boostClock: '5.1 GHz' }, esDestacado: true },
                { id: 'intel-i7-13700k', nombre: 'Intel Core i7-13700K', categoria: 'cpu', precio: 450.0, stock: 10, potencia: 90, imagenUrl: '/images/productos/intel-i7-13700k.svg', caracteristicas: { nucleos: 16, hilos: 24, boostClock: '5.4 GHz' }, esDestacado: false },
                { id: 'amd-ryzen-5-7600x', nombre: 'AMD Ryzen 5 7600X', categoria: 'cpu', precio: 250.0, stock: 20, potencia: 75, imagenUrl: '/images/productos/amd-ryzen-5-7600x.svg', caracteristicas: { nucleos: 6, hilos: 12, boostClock: '5.3 GHz' }, esDestacado: true },
                { id: 'amd-ryzen-7-7800x3d', nombre: 'AMD Ryzen 7 7800X3D', categoria: 'cpu', precio: 400.0, stock: 8, potencia: 92, imagenUrl: '/images/productos/amd-ryzen-7-7800x3d.svg', caracteristicas: { nucleos: 8, hilos: 16, boostClock: '5.0 GHz' }, esDestacado: false },
                // GPUs
                { id: 'nvidia-rtx-4060', nombre: 'NVIDIA GeForce RTX 4060 8GB', categoria: 'gpu', precio: 350.0, stock: 12, potencia: 78, imagenUrl: '/images/productos/nvidia-rtx-4060.svg', caracteristicas: { vram: '8GB GDDR6', interfaz: 'PCIe 4.0', nucleosCuda: 3072 }, esDestacado: false },
                { id: 'nvidia-rtx-4070-super', nombre: 'NVIDIA GeForce RTX 4070 Super 12GB', categoria: 'gpu', precio: 650.0, stock: 7, potencia: 93, imagenUrl: '/images/productos/nvidia-rtx-4070-super.svg', caracteristicas: { vram: '12GB GDDR6X', interfaz: 'PCIe 4.0', nucleosCuda: 7168 }, esDestacado: true },
                { id: 'amd-rx-7700-xt', nombre: 'AMD Radeon RX 7700 XT 12GB', categoria: 'gpu', precio: 480.0, stock: 10, potencia: 85, imagenUrl: '/images/productos/amd-rx-7700-xt.svg', caracteristicas: { vram: '12GB GDDR6', interfaz: 'PCIe 4.0', streamProcessors: 3456 }, esDestacado: false },
                { id: 'amd-rx-7900-xtx', nombre: 'AMD Radeon RX 7900 XTX 24GB', categoria: 'gpu', precio: 1000.0, stock: 5, potencia: 98, imagenUrl: '/images/productos/amd-rx-7900-xtx.svg', caracteristicas: { vram: '24GB GDDR6', interfaz: 'PCIe 4.0', streamProcessors: 6144 }, esDestacado: false },
                // RAM
                { id: 'corsair-ddr5-32gb-6000', nombre: 'Corsair Vengeance 32GB DDR5 6000MHz', categoria: 'ram', precio: 110.0, stock: 25, potencia: 0, imagenUrl: '/images/productos/corsair-ddr5-32gb-6000.svg', caracteristicas: { tipo: 'DDR5', capacidad: '32GB (2x16GB)', velocidad: '6000MHz' }, esDestacado: false },
                { id: 'gskill-ddr5-32gb-6400', nombre: 'G.Skill Trident Z5 32GB DDR5 6400MHz', categoria: 'ram', precio: 130.0, stock: 18, potencia: 0, imagenUrl: '/images/productos/gskill-ddr5-32gb-6400.svg', caracteristicas: { tipo: 'DDR5', capacidad: '32GB (2x16GB)', velocidad: '6400MHz' }, esDestacado: false },
                // PSU
                { id: 'corsair-rm750e', nombre: 'Corsair RM750e 750W Gold', categoria: 'psu', precio: 100.0, stock: 30, potencia: 0, imagenUrl: '/images/productos/corsair-rm750e.svg', caracteristicas: { wattage: '750W', certificacion: '80 Plus Gold', modular: 'Completamente' }, esDestacado: false },
                { id: 'seasonic-focus-850w', nombre: 'Seasonic FOCUS Plus 850W Gold', categoria: 'psu', precio: 140.0, stock: 22, potencia: 0, imagenUrl: '/images/productos/seasonic-focus-850w.svg', caracteristicas: { wattage: '850W', certificacion: '80 Plus Gold', modular: 'Semi' }, esDestacado: false },
                // Otros
                { id: 'samsung-980-pro-1tb', nombre: 'Samsung 980 Pro 1TB NVMe SSD', categoria: 'almacenamiento', precio: 90.0, stock: 40, potencia: 0, imagenUrl: '/images/productos/samsung-980-pro-1tb.svg', caracteristicas: { capacidad: '1TB', interfaz: 'NVMe PCIe 4.0', velocidadLectura: '7000 MB/s' }, esDestacado: false },
                { id: 'asus-rog-strix-b650e', nombre: 'ASUS ROG STRIX B650E-F Gaming WiFi', categoria: 'placa-base', precio: 280.0, stock: 15, potencia: 0, imagenUrl: '/images/productos/asus-rog-strix-b650e.svg', caracteristicas: { socket: 'AM5', chipset: 'B650E', wifi: 'Wi-Fi 6E' }, esDestacado: false },
                { id: 'nzxt-h5-flow', nombre: 'NZXT H5 Flow', categoria: 'case', precio: 85.0, stock: 18, potencia: 0, imagenUrl: '/images/productos/nzxt-h5-flow.svg', caracteristicas: { tipo: 'Mid-Tower', color: 'Negro', fansIncluidos: 2 }, esDestacado: false },
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
                args: [['cpu', 'gpu', 'ram', 'psu', 'case', 'almacenamiento', 'placa-base', 'otros']],
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
    },
    imagenUrl: {
        type: DataTypes.STRING,
        allowNull: true, // Puede ser nulo si no hay imagen
        defaultValue: 'https://i.imgur.com/placeholder.jpg' // Imagen por defecto
    },
    caracteristicas: {
        type: DataTypes.JSON, // O JSONB para PostgreSQL
        allowNull: true, // Puede ser nulo si no hay características detalladas
        defaultValue: {}
    },
    esDestacado: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    }
}, {
    sequelize,
    modelName: 'Producto',
    tableName: 'productos',
    timestamps: false
});

//Representa un artículo en el carrito de compras graciasal modelo de la base de datos de la lógica del carrito
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