import { sequelize } from './database.js';
import { Producto } from '../models/Producto.js';

export async function inicializarBaseDeDatos() {
    try {
        await sequelize.sync({ alter: true });
        await Producto.inicializarDatos();
        console.log('✅ Base de datos inicializada y sincronizada correctamente');
    } catch (error) {
        console.error('❌ Error al inicializar la base de datos:', error);
        throw error;
    }
}

export async function cerrarConexion() {
    try {
        await sequelize.close();
        console.log('🔌 Conexión a la base de datos cerrada.');
    } catch (error) {
        console.error('❌ Error al cerrar la conexion de la base de datos:', error);
    }
}
