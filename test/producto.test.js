import { Producto, ItemCarrito } from '../core/models/Producto.js';
import { expect, test, describe } from 'bun:test';

describe('Modelo ItemCarrito', () => {
    // Crear una instancia de Producto usando build para simular un producto existente
    // sin necesidad de guardarlo en la base de datos ni inicializar sequelize.
    const mockProd = Producto.build({ id: 'i9-14900k', nombre: 'i9 14900K', categoria: 'cpu', precio: 500, stock: 10, potencia: 0 });

    test('debería calcular el subtotal correctamente', () => {
        const item = new ItemCarrito(mockProd, 3);
        expect(item.getSubtotal()).toBe(1500); // 500 * 3
    });

    test('debería exponer las propiedades del producto a través de la composición', () => {
        const item = new ItemCarrito(mockProd, 1);
        expect(item.nombre).toBe('i9 14900K');
        expect(item.id).toBe('i9-14900k');
        expect(item.precio).toBe(500);
    });

    test('debería lanzar un error si la cantidad es inválida', () => {
        expect(() => new ItemCarrito(mockProd, 0)).toThrow('La cantidad debe ser un número entero positivo.');
        expect(() => new ItemCarrito(mockProd, -1)).toThrow('La cantidad debe ser un número entero positivo.');
        expect(() => new ItemCarrito(mockProd, 'a')).toThrow('La cantidad debe ser un número entero positivo.');
    });

    test('debería lanzar un error si el producto no es una instancia de Producto', () => {
        const plainObject = { id: 'test', nombre: 'test', categoria: 'test', precio: 10, stock: 10, potencia: 0 };
        expect(() => new ItemCarrito(plainObject, 1)).toThrow('El primer argumento debe ser una instancia de Producto.');
    });
});