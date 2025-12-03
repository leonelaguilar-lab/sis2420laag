
import { Sequelize } from 'sequelize';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Usar la variable de entorno NODE_ENV para determinar la configuración de la DB
const isTestEnv = process.env.NODE_ENV === 'test';

const storage = isTestEnv
  ? ':memory:' // Usar DB en memoria para tests
  : join(__dirname, 'inventario.sqlite'); // Usar archivo para desarrollo/producción

export const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: storage,
  logging: false // Desactivar logging de SQL en ambos entornos
});
