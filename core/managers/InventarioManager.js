
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

    /**
     * Obtiene todos los productos marcados como destacados
     * @returns {Promise<Producto[]>}
     */
    async obtenerDestacados() {
        return await Producto.findAll({
            where: {
                esDestacado: true,
                stock: { [Op.gt]: 0 }
            }
        });
    }

    /**
     * Obtiene una lista de todas las categorías únicas de productos
     * @returns {Promise<string[]>}
     */
    async obtenerCategorias() {
        const categorias = await Producto.findAll({
            attributes: ['categoria'],
            group: ['categoria'],
            order: [['categoria', 'ASC']]
        });
        // Extrae solo el string de cada objeto
        return categorias.map(item => item.categoria);
    }

    /**
     * Busca productos por un término de búsqueda en el nombre
     * @param {string} termino
     * @returns {Promise<Producto[]>}
     */
    async buscar(termino) {
        return await Producto.findAll({
            where: {
                nombre: {
                    [Op.like]: `%${termino}%`
                }
            }
        });
    }

    /**
     * Obtiene productos recomendados de la misma categoría, excluyendo el actual.
     * @param {string} categoria La categoría de la que obtener recomendaciones.
     * @param {string} excluirId El ID del producto a excluir.
     * @returns {Promise<Producto[]>}
     */
    async obtenerRecomendaciones(categoria, excluirId) {
        return await Producto.findAll({
            where: {
                categoria: categoria,
                id: {
                    [Op.ne]: excluirId // Excluir el producto actual
                }
            },
            order: sequelize.random(), // Ordenar aleatoriamente (puede variar según el dialecto de DB)
            limit: 4 // Limitar a 4 recomendaciones
        });
    }
}