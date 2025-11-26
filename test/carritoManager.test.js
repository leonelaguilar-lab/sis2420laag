import { CarritoManager } from '../core/managers/CarritoManager.js';
import { Producto } from '../core/models/Producto.js';
import { expect, test, describe, beforeEach } from 'bun:test';

describe('CarritoManager', () => {
    let manager;

    // --- Productos de Prueba con puntajes de 'potencia' ---
    // Potencia: 1-100. Un balance ideal es una diferencia < 20.
    // Usamos Producto.build() para crear instancias del modelo sin guardarlas en la DB.
    const cpuPotente = Producto.build({ id: 'cpu-fuerte', nombre: 'CPU Fuerte', categoria: 'cpu', precio: 600, stock: 10, potencia: 95 });
    const cpuMedia = Producto.build({ id: 'cpu-media', nombre: 'CPU Media', categoria: 'cpu', precio: 300, stock: 10, potencia: 70 });
    const gpuPotente = Producto.build({ id: 'gpu-fuerte', nombre: 'GPU Fuerte', categoria: 'gpu', precio: 1200, stock: 5, potencia: 100 });
    const gpuDebil = Producto.build({ id: 'gpu-debil', nombre: 'GPU Débil', categoria: 'gpu', precio: 200, stock: 5, potencia: 40 });
    const ram = Producto.build({ id: 'ram-16gb', nombre: 'RAM 16GB', categoria: 'ram', precio: 80, stock: 20, potencia: 0 }); // Potencia no aplica

    beforeEach(() => {
        manager = new CarritoManager();
    });

    // Pruebas básicas del carrito
    test('debería agregar items y calcular el total correctamente', () => {
        manager.agregarItem(cpuMedia, 2); // 300 * 2 = 600
        manager.agregarItem(gpuDebil, 1); // 200 * 1 = 200
        
        expect(manager.obtenerItems().length).toBe(2);
        expect(manager.calcularTotal()).toBe(800);
    });

    test('debería acumular la cantidad si el producto ya existe', () => {
        manager.agregarItem(cpuMedia, 1);
        manager.agregarItem(cpuMedia, 3);
        
        expect(manager.obtenerItems().length).toBe(1);
        expect(manager.obtenerItems()[0].cantidad).toBe(4);
    });
    
    test('debería eliminar un item por índice', () => {
        manager.agregarItem(cpuMedia, 1);
        manager.agregarItem(gpuDebil, 1);
        
        manager.eliminarItem(0); // Elimina la CPU
        
        expect(manager.obtenerItems().length).toBe(1);
        expect(manager.obtenerItems()[0].nombre).toBe('GPU Débil');
    });

    // --- Pruebas de la nueva lógica de 'calcularCuelloBotella' ---
    describe('Cálculo de Cuello de Botella con "Potencia"', () => {
        
        test('debería indicar un buen balance entre CPU y GPU', () => {
            manager.agregarItem(cpuMedia, 1);   // Potencia: 70
            manager.agregarItem(gpuDebil, 1);   // Potencia: 40 --> Diferencia > 20, es cuello
            manager.agregarItem(ram, 2);        // Item extra que no debe interferir

            const resultado = manager.calcularCuelloBotella();
            
            expect(resultado.esCuello).toBe(true);
            expect(resultado.mensaje).toContain('¡Cuello de botella detectado!');
        });

        test('debería identificar cuello de botella por GPU débil (CPU es más fuerte)', () => {
            manager.agregarItem(cpuPotente, 1); // Potencia: 95
            manager.agregarItem(gpuDebil, 1);   // Potencia: 40. Diferencia > 20
            
            const resultado = manager.calcularCuelloBotella();
            expect(resultado.esCuello).toBe(true);
            expect(resultado.mensaje).toContain(`La GPU (${gpuDebil.nombre}) es significativamente menos potente`);
            expect(resultado.cpu.nombre).toBe(cpuPotente.nombre);
            expect(resultado.gpu.nombre).toBe(gpuDebil.nombre);
        });

        test('debería identificar cuello de botella por CPU débil (GPU es más fuerte)', () => {
            manager.agregarItem(cpuMedia, 1);   // Potencia: 70
            manager.agregarItem(gpuPotente, 1); // Potencia: 100. Diferencia > 20
            
            const resultado = manager.calcularCuelloBotella();
            expect(resultado.esCuello).toBe(true);
            expect(resultado.mensaje).toContain(`La CPU (${cpuMedia.nombre}) es significativamente menos potente`);
        });

        test('debería reportar que faltan componentes si no hay CPU o GPU', () => {
            manager.agregarItem(gpuPotente, 1);
            manager.agregarItem(ram, 1);

            const resultado = manager.calcularCuelloBotella();
            expect(resultado.esCuello).toBe(false);
            expect(resultado.mensaje).toContain("Se requiere al menos una CPU y una GPU");
        });

        test('debería seleccionar la CPU y GPU más potentes si hay varias', () => {
            manager.agregarItem(cpuMedia, 1);   // Potencia: 70
            manager.agregarItem(cpuPotente, 1); // Potencia: 95 (debe elegir esta)
            manager.agregarItem(gpuDebil, 1);   // Potencia: 40 (debe elegir esta)

            const resultado = manager.calcularCuelloBotella();
            expect(resultado.cpu.nombre).toBe(cpuPotente.nombre);
            expect(resultado.gpu.nombre).toBe(gpuDebil.nombre);
            expect(resultado.esCuello).toBe(true); // 95 vs 40 es cuello de botella
        });
    });
});