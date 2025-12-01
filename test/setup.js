// test/setup.js
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { unlink, access } from 'fs/promises';
import { constants } from 'fs';
import { beforeAll, afterAll } from 'bun:test'; // Import from bun:test for hooks

// This ensures that all tests use a separate database file
process.env.TEST_DB_FILE = 'test_inventario.sqlite';

// Set the full path to the test DB for cleanup
const __dirname = dirname(fileURLToPath(import.meta.url));
const TEST_DB_FULL_PATH = join(__dirname, '../core/data', process.env.TEST_DB_FILE);

// Export this path so it can be used in test files for cleanup checks if needed,
// though `afterAll` in this file is enough.
process.env.TEST_DB_FULL_PATH_FOR_CLEANUP = TEST_DB_FULL_PATH;

// Optional: Clean up test DB before ALL tests run (in case previous run failed)
// This is less critical as `sequelize.sync({ force: true })` in inventarioManager.test.js
// usually handles it, but good for robustness.
beforeAll(async () => {
    try {
        await access(TEST_DB_FULL_PATH, constants.F_OK);
        await unlink(TEST_DB_FULL_PATH);
        console.log(`[Test Setup] Pre-cleaned existing test database: ${TEST_DB_FULL_PATH}`);
    } catch (e) {
        // File did not exist or other access error, which is fine
    }
});

// Clean up test DB after all tests are done
afterAll(async () => {
    // Ensure sequelize connection is closed before attempting to delete the file
    // This assumes that other test files (like inventarioManager.test.js) will close
    // their connections in their own afterAll hooks.
    // However, it's safer to ensure the main sequelize instance for tests is closed here too
    // if it was opened globally.
    // For now, rely on individual test files to close their connections properly.

    try {
        await access(TEST_DB_FULL_PATH, constants.F_OK);
        await unlink(TEST_DB_FULL_PATH);
        console.log(`[Test Cleanup] Deleted test database: ${TEST_DB_FULL_PATH}`);
    } catch (e) {
        console.warn(`[Test Cleanup] Test database not found or could not be deleted: ${TEST_DB_FULL_PATH} (${e.message})`);
    }
});
