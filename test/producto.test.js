// /tests/producto.test.js

import { Producto, ItemCarrito } from '../core/models/Producto.js';
import { expect, test, describe } from 'bun:test';

describe('Modelo Producto', () => {
    test('debería crear un producto válido', () => {
        const prod = new Producto('RTX 4090', 'GPU', 1500, 5);
        expect(prod.nombre).toBe('RTX 4090');
        expect(prod.categoria).toBe('gpu'); // Comprueba la conversión a minúsculas
        expect(prod.precio).toBe(1500);
        expect(prod.id).toBe('rtx-4090'); // Comprueba la generación de ID
    });

    test('debería lanzar un error por datos inválidos', () => {
        // Prueba: Precio negativo
        expect(() => new Producto('Monitor', 'otros', -10, 5)).toThrow();
        // Prueba: Categoría inválida
        expect(() => new Producto('Mouse', 'periférico', 50, 10)).toThrow();
        // Prueba: Stock no entero
        expect(() => new Producto('SSD', 'otros', 100, 4.5)).toThrow();
    });
});

describe('Modelo ItemCarrito', () => {
    const mockProd = new Producto('i9 14900K', 'cpu', 500, 10);

    test('debería calcular el subtotal correctamente', () => {
        const item = new ItemCarrito(mockProd, 3);
        expect(item.getSubtotal()).toBe(1500); // 500 * 3
    });

    test('debería heredar las propiedades del producto', () => {
        const item = new ItemCarrito(mockProd, 1);
        expect(item.nombre).toBe('i9 14900K');
        expect(item.precio).toBe(500);
        expect(item.cantidad).toBe(1);
    });
});