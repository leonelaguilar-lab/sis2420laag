
import { ItemCarrito } from '../models/Producto.js';

//Manager para la lógica de negocio del Carrito de Compras

export class CarritoManager {
    constructor() {
        this.carrito = []; // Almacena instancias de ItemCarrito
    }

    obtenerItems() {
        return this.carrito;
    }

    agregarItem(producto, cantidad) {
        // Validación del stock 
        if (cantidad > producto.stock) {
            throw new Error(`Stock insuficiente. Máximo disponible: ${producto.stock}.`);
        }

        const indice = this.carrito.findIndex(item => item.id === producto.id);

        if (indice !== -1) {
            // Si el producto ya existe, actualiza la cantidad
            this.carrito[indice].cantidad += cantidad;
        } else {
            // Si es nuevo, añade un ItemCarrito
            const item = new ItemCarrito(producto, cantidad);
            this.carrito.push(item);
        }
    }

    eliminarItem(indice) {
        if (indice < 0 || indice >= this.carrito.length) {
            throw new Error("Índice de carrito inválido.");
        }
        const itemEliminado = this.carrito.splice(indice, 1);
        return itemEliminado[0];
    }

    vaciarCarrito() {
        this.carrito = [];
    }

    calcularTotal() {
        return this.carrito.reduce((total, item) => total + item.getSubtotal(), 0);
    }

    /**
     * Lógica de Negocio: Estima el cuello de botella entre CPU y GPU.
     * @returns {{pCPU: number, pGPU: number, mensaje: string, esCuello: boolean}}
     */
    calcularCuelloBotella() {
        
        const cpuMasPotente = this.carrito
            .filter(item => item.categoria === 'cpu')
            .sort((a, b) => b.potencia - a.potencia)[0];

        const gpuMasPotente = this.carrito
            .filter(item => item.categoria === 'gpu')
            .sort((a, b) => b.potencia - a.potencia)[0];

        if (!cpuMasPotente || !gpuMasPotente) {
            return {
                cpu: null,
                gpu: null,
                esCuello: false,
                mensaje: "Se requiere al menos una CPU y una GPU en el carrito para calcular el balance."
            };
        }

        const pCPU = cpuMasPotente.potencia;
        const pGPU = gpuMasPotente.potencia;
        const diferencia = Math.abs(pCPU - pGPU);
        const UMBRAL_CUELLO_BOTELLA = 20; // Si la diferencia es > 20 hay desbalance

        let esCuello = diferencia > UMBRAL_CUELLO_BOTELLA;
        let mensaje = "";

        if (esCuello) {
            if (pCPU > pGPU) {
                mensaje = `¡Cuello de botella detectado! La GPU (${gpuMasPotente.nombre}) es significativamente menos potente y podría limitar el rendimiento de la CPU (${cpuMasPotente.nombre}).`;
            } else {
                mensaje = `¡Cuello de botella detectado! La CPU (${cpuMasPotente.nombre}) es significativamente menos potente y podría limitar el rendimiento de la GPU (${gpuMasPotente.nombre}).`;
            }
        } else {
            mensaje = "El balance entre la CPU y la GPU es bueno. ¡Componentes bien equilibrados!";
        }

        return {
            cpu: cpuMasPotente,
            gpu: gpuMasPotente,
            esCuello,
            mensaje
        };
    }
}