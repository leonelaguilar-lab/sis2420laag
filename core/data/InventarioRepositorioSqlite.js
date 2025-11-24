// /core/data/InventarioRepositorioSqlite.js

import { IInventario } from '../interfaces/IInventario.js';
import { Producto } from '../models/Producto.js';
import { Database } from 'bun:sqlite';

const RUTA_DB = '../../data/inventario.sqlite'; // Ruta donde se guardará el archivo DB

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
                // Puntajes de potencia: CPU (1-100), GPU (1-100).
                // Un buen balance es CPU ~ GPU. Si |CPU - GPU| > 20, hay cuello de botella.
                { id: 'i9-extremo', nombre: 'i9 Extremo', categoria: 'cpu', precio: 600.0, stock: 5, potencia: 95 },
                { id: 'i5-medio', nombre: 'i5 Medio', categoria: 'cpu', precio: 250.0, stock: 10, potencia: 70 },
                { id: 'gtx-1650', nombre: 'GTX 1650', categoria: 'gpu', precio: 200.0, stock: 8, potencia: 40 },
                { id: 'rtx-4090', nombre: 'RTX 4090', categoria: 'gpu', precio: 1800.0, stock: 3, potencia: 100 },
                { id: 'ddr4-16gb', nombre: 'RAM DDR4 16GB', categoria: 'ram', precio: 50.0, stock: 30, potencia: 0 },
                { id: 'psu-650w', nombre: 'PSU 650W', categoria: 'psu', precio: 80.0, stock: 15, potencia: 0 },
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