// /core/data/InventarioRepositorioSqlite.js

import { IInventario } from '../interfaces/IInventario.js';
import { Producto } from '../models/Producto.js';
import { Database } from 'bun:sqlite';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// --- Solución Robusta para la Ruta de la Base de Datos ---
// Construye una ruta absoluta al archivo de la base de datos que está en el mismo directorio
// que este script. Esto evita problemas con la ruta relativa (cwd).
const __dirname = dirname(fileURLToPath(import.meta.url));
const RUTA_DB = join(__dirname, 'inventario.sqlite');

/**
 * Implementación concreta de IInventario que gestiona la persistencia
 * de los datos usando una base de datos SQLite con Bun.
 */
export class InventarioRepositorioSqlite extends IInventario {
    /**
     * @param {string} ruta - Ruta del archivo SQLite.
     */
    constructor(ruta = RUTA_DB) {
        super();
        this.db = new Database(ruta);
        this.inicializarTabla(); // Crea la tabla e inserta datos iniciales si es necesario
    }

    /**
     * Asegura que la tabla 'productos' exista y que contenga datos iniciales.
     */
    inicializarTabla() {
        const queryCreacion = `
            CREATE TABLE IF NOT EXISTS productos (
                id TEXT PRIMARY KEY,
                nombre TEXT NOT NULL,
                categoria TEXT NOT NULL,
                precio REAL NOT NULL,
                stock INTEGER NOT NULL,
                potencia REAL NOT NULL DEFAULT 0 
            );
        `;
        this.db.run(queryCreacion);
        
        this.insertarDatosInicialesSiVacia();
    }

    /**
     * Inserta un conjunto de productos de ejemplo si la tabla está vacía.
     */
    insertarDatosInicialesSiVacia() {
        // Verifica si la tabla tiene 0 filas
        const count = this.db.query("SELECT COUNT(*) as count FROM productos").get().count;

        if (count === 0) {
            console.log("[SQLite] Insertando datos de inventario de ejemplo (Seeding)...");

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

            const insert = this.db.prepare(
                "INSERT INTO productos (id, nombre, categoria, precio, stock, potencia) VALUES (?, ?, ?, ?, ?, ?)"
            );

            // Ejecuta la inserción dentro de una transacción para mayor velocidad y seguridad
            this.db.transaction(() => {
                for (const p of productosIniciales) {
                    insert.run(p.id, p.nombre, p.categoria, p.precio, p.stock, p.potencia);
                }
            })(); 

            console.log("[SQLite] Datos de ejemplo insertados correctamente.");
        }
    }

    /**
     * Carga todos los productos desde la tabla.
     * @returns {Producto[]} Lista de objetos Producto.
     */
    cargarTodos() {
        // Ejecuta la consulta y obtiene todos los resultados
        const statement = this.db.query("SELECT * FROM productos ORDER BY categoria, nombre");
        const productosData = statement.all();

        // Mapea los resultados planos de la DB a instancias del Modelo Producto
        return productosData.map(p => 
            new Producto(p.nombre, p.categoria, p.precio, p.stock, p.potencia)
        );
    }

    /**
     * Reemplaza todos los datos del inventario (ineficiente, usado solo para mantener el contrato simple).
     * @param {Producto[]} productos - Array de objetos Producto a guardar.
     */
    guardarTodos(productos) {
        // Usamos una transacción para DELETE e INSERT
        const runTransaction = this.db.transaction(() => {
            this.db.run("DELETE FROM productos"); 
            
            const insert = this.db.prepare(
                "INSERT INTO productos (id, nombre, categoria, precio, stock, potencia) VALUES (?, ?, ?, ?, ?, ?)"
            );
            
            for (const p of productos) {
                insert.run(p.id, p.nombre, p.categoria, p.precio, p.stock, p.potencia);
            }
        });
        
        runTransaction();
    }
    
    /**
     * Obtiene un producto por su ID único.
     * @param {string} id - El ID del producto.
     * @returns {Producto | null}
     */
    obtenerPorId(id) {
        const statement = this.db.query("SELECT * FROM productos WHERE id = ?");
        const p = statement.get(id);
        
        return p ? new Producto(p.nombre, p.categoria, p.precio, p.stock, p.potencia) : null;
    }

    /**
     * Actualiza el stock de un producto.
     * @param {string} id - El ID del producto.
     * @param {number} cantidadAfectada - Cantidad a sumar (positivo) o restar (negativo).
     */
    actualizarStock(id, cantidadAfectada) {
        // En una DB es mejor dejar que SQL haga la suma (stock = stock + cantidadAfectada)
        const update = this.db.prepare(
            "UPDATE productos SET stock = stock + ? WHERE id = ?"
        );
        update.run(cantidadAfectada, id);
        
        // Opcional: Podrías añadir una comprobación aquí para asegurar que el stock no sea negativo
    }
}