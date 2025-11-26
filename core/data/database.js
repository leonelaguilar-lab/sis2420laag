
import { Sequelize } from 'sequelize';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_FILE_NAME = process.env.TEST_DB_FILE || 'inventario.sqlite';
const RUTA_DB = join(__dirname, DB_FILE_NAME);

export const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: RUTA_DB, 
  logging: false, 
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});
