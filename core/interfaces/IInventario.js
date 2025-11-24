// /core/interfaces/IInventario.js

/**
 * Interfaz abstracta para la gestión de la persistencia del inventario.
 * Define el contrato que toda clase de Repositorio (JSON, SQLite) debe cumplir.
 * Esto asegura que el InventarioManager no sepa (ni le importe) cómo se guardan los datos.
 */
export class IInventario {
    cargarTodos() {
        throw new Error("IInventario: Método 'cargarTodos' debe ser implementado por la clase concreta (JSON, SQLite).");
    }

    guardarTodos(productos) {
        throw new Error("IInventario: Método 'guardarTodos' debe ser implementado.");
    }

    // Métodos esenciales que el manager podría necesitar
    obtenerPorId(id) {
        throw new Error("IInventario: Método 'obtenerPorId' debe ser implementado.");
    }

    actualizarStock(id, nuevoStock) {
        throw new Error("IInventario: Método 'actualizarStock' debe ser implementado.");
    }
}