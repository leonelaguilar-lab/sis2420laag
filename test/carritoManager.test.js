import { CarritoManager } from '../core/managers/CarritoManager.js';
import { InventarioManager } from '../core/managers/InventarioManager.js';
import { Producto } from '../core/models/Producto.js';
import { sequelize } from '../core/data/database.js';
import { expect, test, describe, beforeEach } from 'bun:test';

describe('CarritoManager', () => {
    let manager;
    let inventarioManager;
    let cpuPotente, cpuMedia, gpuPotente, gpuDebil, ram;

    beforeEach(async () => {
        // Sincronizar la base de datos antes de cada test para asegurar un estado limpio
        await sequelize.sync({ force: true });

        inventarioManager = new InventarioManager();
        manager = new CarritoManager(inventarioManager);

        // Crear productos en la base de datos para que el inventario los conozca
        [cpuPotente, cpuMedia, gpuPotente, gpuDebil, ram] = await Promise.all([
            Producto.create({ id: 'cpu-fuerte', nombre: 'CPU Fuerte', categoria: 'cpu', precio: 600, stock: 10, potencia: 95 }),
            Producto.create({ id: 'cpu-media', nombre: 'CPU Media', categoria: 'cpu', precio: 300, stock: 10, potencia: 70 }),
            Producto.create({ id: 'gpu-fuerte', nombre: 'GPU Fuerte', categoria: 'gpu', precio: 1200, stock: 5, potencia: 100 }),
            Producto.create({ id: 'gpu-debil', nombre: 'GPU Débil', categoria: 'gpu', precio: 200, stock: 5, potencia: 40 }),
            Producto.create({ id: 'ram-16gb', nombre: 'RAM 16GB', categoria: 'ram', precio: 80, stock: 20, potencia: 0 })
        ]);
    });

    // Pruebas básicas del carrito
    test('debería agregar items y calcular el total correctamente', async () => {
        await manager.agregarItem(cpuMedia, 2); // 300 * 2 = 600
        await manager.agregarItem(gpuDebil, 1); // 200 * 1 = 200
        
        expect(manager.obtenerItems().length).toBe(2);
        expect(manager.calcularTotal()).toBe(800);
    });

    test('debería acumular la cantidad si el producto ya existe', async () => {
        await manager.agregarItem(cpuMedia, 1);
        await manager.agregarItem(cpuMedia, 3);
        
        expect(manager.obtenerItems().length).toBe(1);
        expect(manager.obtenerItems()[0].cantidad).toBe(4);
    });
    
    test('debería eliminar un item por índice', async () => {
        await manager.agregarItem(cpuMedia, 1);
        await manager.agregarItem(gpuDebil, 1);
        
        await manager.eliminarItem(0); // Elimina la CPU
        
        const items = manager.obtenerItems();
        expect(items.length).toBe(1);
        expect(items[0].producto.nombre).toBe('GPU Débil');
    });

    // --- Pruebas de la nueva lógica de 'calcularCuelloBotella' ---
    describe('Cálculo de Cuello de Botella con "Potencia"', () => {
        
        test('debería indicar un buen balance entre CPU y GPU', async () => {
            await manager.agregarItem(cpuMedia, 1);   // Potencia: 70
            await manager.agregarItem(gpuPotente, 1);   // Potencia: 100 --> Diferencia > 20, es cuello
            await manager.agregarItem(ram, 2);        // Item extra que no debe interferir

            const resultado = manager.calcularCuelloBotella();
            
            expect(resultado.esCuello).toBe(true);
            expect(resultado.mensaje).toContain('¡Cuello de botella detectado!');
        });

        test('debería identificar cuello de botella por GPU débil (CPU es más fuerte)', async () => {
            await manager.agregarItem(cpuPotente, 1); // Potencia: 95
            await manager.agregarItem(gpuDebil, 1);   // Potencia: 40. Diferencia > 20
            
            const resultado = manager.calcularCuelloBotella();
            expect(resultado.esCuello).toBe(true);
            expect(resultado.mensaje).toContain(`La GPU (${gpuDebil.nombre}) es significativamente menos potente`);
            expect(resultado.cpu.producto.nombre).toBe(cpuPotente.nombre);
            expect(resultado.gpu.producto.nombre).toBe(gpuDebil.nombre);
        });

        test('debería identificar cuello de botella por CPU débil (GPU es más fuerte)', async () => {
            await manager.agregarItem(cpuMedia, 1);   // Potencia: 70
            await manager.agregarItem(gpuPotente, 1); // Potencia: 100. Diferencia > 20
            
            const resultado = manager.calcularCuelloBotella();
            expect(resultado.esCuello).toBe(true);
            expect(resultado.mensaje).toContain(`La CPU (${cpuMedia.nombre}) es significativamente menos potente`);
        });

        test('debería reportar que faltan componentes si no hay CPU o GPU', async () => {
            await manager.agregarItem(gpuPotente, 1);
            await manager.agregarItem(ram, 1);

            const resultado = manager.calcularCuelloBotella();
            expect(resultado.esCuello).toBe(false);
            expect(resultado.mensaje).toContain("Se requiere al menos una CPU y una GPU");
        });

        test('debería seleccionar la CPU y GPU más potentes si hay varias', async () => {
            await manager.agregarItem(cpuMedia, 1);   // Potencia: 70
            await manager.agregarItem(cpuPotente, 1); // Potencia: 95 (debe elegir esta)
            await manager.agregarItem(gpuDebil, 1);   // Potencia: 40
            await manager.agregarItem(gpuPotente, 1); // Potencia: 100 (debe elegir esta)


            const resultado = manager.calcularCuelloBotella();
            expect(resultado.cpu.producto.nombre).toBe(cpuPotente.nombre);
            expect(resultado.gpu.producto.nombre).toBe(gpuPotente.nombre);
            expect(resultado.esCuello).toBe(false); // 95 vs 100 no es cuello de botella
        });
    });
});