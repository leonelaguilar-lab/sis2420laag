// test/setup.js
import { sequelize } from '../core/data/database.js';
import { afterAll } from 'bun:test';

// After all tests in all files are done, close the connection
afterAll(async () => {
    try {
        await sequelize.close();
        console.log('[Test Cleanup] Database connection closed.');
    } catch (error) {
        console.error('[Test Cleanup] Failed to close database connection:', error);
    }
});
