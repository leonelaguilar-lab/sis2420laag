
import { Producto } from '../models/Producto.js';
import { Op } from 'sequelize';

export class InventarioManager {
    constructor() {}

    /**
     * Obtiene todos los productos usando el modelo
     * @returns {Promise<Producto[]>}
     */
    async obtenerTodos() {
        return await Producto.cargarTodos();
    }

    /**
     * Agrega un nuevo producto a la base de datos
     * @param {string} nombre
     * @param {string} categoria
     * @param {number} precio
     * @param {number} stock
     * @param {number} potencia
     * @returns {Promise<Producto>}
     */
    async agregarProducto(nombre, categoria, precio, stock, potencia = 0) {
        const id = nombre.toLowerCase().replace(/\s/g, '-');
        
        const nuevoProducto = await Producto.create({
            id,
            nombre,
            categoria,
            precio,
            stock,
            potencia
        });

        return nuevoProducto;
    }
    
    /**
     * Elimina un producto de la base de datos por su id
     * @param {string} id 
     */
    async eliminarProducto(id) {
        const resultado = await Producto.destroy({
            where: { id: id }
        });

        if (resultado === 0) {
            throw new Error(`Producto con ID ${id} no encontrado.`);
        }
    }

    /**
     * Obtiene un producto por su id
     * @param {string} id
     * @returns {Promise<Producto|null>}
     */
    async obtenerPorId(id) {
        return await Producto.obtenerPorId(id);
    }

    /**
     * Obtiene productos por categoría que tengan stock disponible
     * @param {string} categoria 
     * @returns {Promise<Producto[]>}
     */
    async obtenerPorCategoria(categoria) {
        return await Producto.findAll({
            where: {
                categoria: categoria,
                stock: {
                    [Op.gt]: 0
                }
            },
            order: [['nombre', 'ASC']]
        });
    }

    /**
     * Actualiza el stock de un producto
     * @param {string} id
     * @param {number} cantidad
     */
    async actualizarStock(id, cantidad) {
        await Producto.actualizarStock(id, cantidad);
    }
}