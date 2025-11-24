// index.js (TUI Refactorizado)
import * as p from '@clack/prompts';
import chalk from 'chalk';
import stripAnsi from 'strip-ansi';

// Importamos el Core (Modelos, Managers, Repositorios)
import { Producto } from '../../core/models/Producto.js';
import { InventarioRepositorioSqlite } from '../../core/data/InventarioRepositorioSqlite.js';
import { InventarioManager } from '../../core/managers/InventarioManager.js';
import { CarritoManager } from '../../core/managers/CarritoManager.js'

// Importamos las librerías necesarias para la VISTA (PDF, LOGs)
import { existsSync, mkdirSync, createWriteStream, appendFileSync } from 'fs'; // Solo se mantiene para la factura/logs
import PDFDocument from 'pdfkit';

// --- ARQUITECTURA Y GESTORES ---

// 1. Inicializar el Repositorio (Capa de Persistencia)
const inventarioRepo = new InventarioRepositorioSqlite();

// 2. Inicializar el Manager (Lógica de Negocio)
const gestorInventario = new InventarioManager(inventarioRepo);

// 3. Carrito de compras global (Lógica de Carrito aún en el TUI por simplicidad,
//    idealmente sería un CarritoManager, pero lo manejamos aquí por ahora)
const gestorCarrito = new CarritoManager();

const CATEGORIAS_VALIDAS = ['cpu', 'gpu', 'ram', 'psu', 'case', 'otros'];

// --- UTILIDADES ---
const COLOR = {
    ERROR: chalk.red,
    SUCCESS: chalk.green,
    WARNING: chalk.yellow,
    INFO: chalk.cyan,
    ACCENT: chalk.magenta,
    MAIN: chalk.white,
    CATEGORY: chalk.blue,
    BG_MAGENTA: chalk.bgMagenta.white,
};

function centerText(text, width = process.stdout.columns) {
    const strippedText = stripAnsi(text);
    const padding = Math.max(0, Math.floor((width - strippedText.length) / 2));
    return ' '.repeat(padding) + text;
}

async function esperarContinuar() {
    await p.text({ 
        message: 'Presiona ENTER para continuar...',
        placeholder: '...'
    });
}

function barraPorcentaje(p) {
    const llenas = Math.round(p / 5);
    const vacias = 20 - llenas;
    return `[${'█'.repeat(llenas)}${'-'.repeat(vacias)}] ${p.toFixed(0)}%`;
}


// --- Funciones de Gestión de Inventario ---
// Muestra la lista completa de productos
async function mostrarTodosProductos() {
    // 💡 Llama al Manager (Controlador) para obtener los datos
    const inventario = gestorInventario.obtenerTodos(); 
    
    console.clear();
    p.intro(centerText(COLOR.WARNING('--- INVENTARIO COMPLETO ---')));
    
    if (inventario.length === 0) {
        console.log(chalk.gray('No hay productos registrados en el inventario.'));
        await esperarContinuar();
        return;
    }

    // El resto es lógica de presentación (Vista)
    inventario.forEach((prod, i) => {
        console.log(`${COLOR.INFO(i + 1)}. ${COLOR.MAIN(prod.nombre)} - ${COLOR.CATEGORY(prod.categoria.toUpperCase())} - ${COLOR.WARNING(prod.precio)} Bs (${COLOR.SUCCESS(prod.stock)} uds)`);
    });
    await esperarContinuar();
}

// Agregar producto
async function agregarProducto() {
    console.clear();
    p.intro(centerText(COLOR.SUCCESS('--- AGREGAR NUEVO PRODUCTO ---')));

    // --- Lógica de Vista (Recolección de datos) ---
    const nombre = await p.text({
        message: COLOR.ACCENT('Nombre del producto:'), 
        validate: (v) => v.trim().length === 0 ? COLOR.ERROR('El nombre no puede estar vacío.') : undefined 
    });
    if (p.isCancel(nombre) || !nombre) return;

    const categoria = await p.select({
        message: COLOR.ACCENT('Categoría:'),
        options: CATEGORIAS_VALIDAS.map(c => ({ value: c, label: c.toUpperCase() }))
    });
    if (p.isCancel(categoria)) return;

    const precioRaw = await p.text({
        message: COLOR.ACCENT('Precio (en Bs):'),
        validate: (value) => {
            const num = parseFloat(value);
            // Usamos las validaciones definidas en el modelo/manager
            if (isNaN(num) || num <= 0) return COLOR.ERROR('Debe ser un número positivo.');
            return undefined;
        }
    });
    if (p.isCancel(precioRaw)) return;

    const stockRaw = await p.text({
        message: COLOR.ACCENT('Cantidad en stock:'),
        validate: (value) => {
            const num = parseInt(value);
            if (isNaN(num) || num < 0) return COLOR.ERROR('Debe ser un número entero no negativo.');
            return undefined;
        }
    });
    if (p.isCancel(stockRaw)) return;

    // --- Lógica de Controlador (Llamada al Manager) ---
    try {
        gestorInventario.agregarProducto(
            nombre.trim(),
            categoria,
            parseFloat(precioRaw),
            parseInt(stockRaw)
        );
        p.note(COLOR.SUCCESS(`Producto "${nombre}" agregado correctamente a SQLite.`));
    } catch (e) {
        p.note(COLOR.ERROR(`Error al guardar: ${e.message}`));
    }
}

// Eliminar producto
async function eliminarProducto() {
    console.clear();
    p.intro(centerText(COLOR.ERROR('--- ELIMINAR PRODUCTO ---')));
    
    // 💡 Llama al Manager (Controlador) para obtener los datos
    const inventario = gestorInventario.obtenerTodos(); 
    
    if (inventario.length === 0) {
        p.note('No hay productos para eliminar.');
        return;
    }

    const opciones = inventario.map((p) => ({
        // Usamos el ID del Modelo Producto para identificar de forma única
        value: p.id, 
        label: `${p.nombre} (${p.categoria.toUpperCase()}) - ${p.stock} uds`
    }));

    const idSeleccionado = await p.select({
        message: COLOR.ACCENT('Selecciona el producto a eliminar:'),
        options: opciones
    });
    if (p.isCancel(idSeleccionado)) return;

    // --- Lógica de Controlador (Llamada al Manager) ---
    try {
        const nombreEliminado = inventario.find(p => p.id === idSeleccionado).nombre;
        gestorInventario.eliminarProducto(idSeleccionado);
        p.note(COLOR.ERROR(`Producto eliminado: ${nombreEliminado}`));
    } catch (e) {
        p.note(COLOR.ERROR(`Error al eliminar: ${e.message}`));
    }
}

// Función para seleccionar productos de una categoría y agregar al carrito
async function comprarPorCategoria(categoria) {
    console.clear();
    p.intro(centerText(COLOR.SUCCESS(`--- COMPRAR ${categoria.toUpperCase()} ---`)));

    const productos = gestorInventario.obtenerTodos();
    const productosFiltrados = productos.filter(p => p.categoria === categoria && p.stock > 0);

    if (productosFiltrados.length === 0) {
        p.note(COLOR.WARNING(`No hay stock de ${categoria.toUpperCase()} por el momento.`));
        await esperarContinuar();
        return;
    }

    const opciones = productosFiltrados.map((p, i) => ({
        value: i,
        label: `${p.nombre} - ${p.precio} Bs (${p.stock} uds)`
    }));
    
    opciones.push({ value: 'volver', label: '↩️ Volver al menú anterior' });

    const indiceSeleccionado = await p.select({
        message: 'Selecciona un producto:',
        options: opciones
    });

    if (p.isCancel(indiceSeleccionado) || indiceSeleccionado === 'volver') return;

    const productoSeleccionado = productosFiltrados[indiceSeleccionado];

    const cantidadRaw = await p.text({
        message: `¿Cuántas unidades de ${productoSeleccionado.nombre} quieres? (Max: ${productoSeleccionado.stock})`,
        validate: (v) => {
            const num = parseInt(v);
            if (isNaN(num) || num <= 0) return 'Debe ser un número positivo.';
            if (num > productoSeleccionado.stock) return `Stock insuficiente. Máximo: ${productoSeleccionado.stock}`;
            return undefined;
        }
    });

    if (p.isCancel(cantidadRaw)) return;

    const cantidad = parseInt(cantidadRaw);

    try {
        gestorCarrito.agregarItem(productoSeleccionado, cantidad);
        p.note(COLOR.SUCCESS(`${cantidad}x ${productoSeleccionado.nombre} añadido al carrito.`));
    } catch (e) {
        p.note(COLOR.ERROR(`No se pudo añadir al carrito: ${e.message}`));
    }
}

// Funcion para ver el carrito
async function verCarrito() {
    while (true) {
        console.clear();
        p.intro(centerText(COLOR.WARNING('---  CARRITO DE COMPRAS ---')));

        const items = gestorCarrito.obtenerItems();
        const total = gestorCarrito.calcularTotal();

        if (items.length === 0) {
            console.log(chalk.gray('El carrito está vacío.'));
            await esperarContinuar();
            return;
        }

        const opcionesCarrito = [];
        items.forEach((item, i) => {
            const subtotal = item.getSubtotal();
            const label = `${COLOR.INFO(i + 1)}. ${COLOR.MAIN(item.nombre)} x${item.cantidad} (${item.precio} Bs/u) = ${COLOR.SUCCESS(subtotal.toFixed(2))} Bs`;
            console.log(label);
            opcionesCarrito.push({ value: i.toString(), label: COLOR.ERROR(`  Eliminar ${item.nombre}`) });
        });
        
        console.log('---------------------------------');
        console.log(`TOTAL: ${COLOR.SUCCESS.bold(total.toFixed(2) + ' Bs')}`);
        console.log('---------------------------------');

        opcionesCarrito.push({ value: 'cuello', label: '🔬 Analizar Cuello de Botella' });
        opcionesCarrito.push({ value: 'finalizar', label: '✅ Finalizar Compra' });
        opcionesCarrito.push({ value: 'volver', label: '↩️ Volver al menú principal' });

        const opcion = await p.select({
            message: '¿Qué quieres hacer?',
            options: opcionesCarrito
        });


        if (p.isCancel(opcion) || opcion === 'volver') return;

        if (opcion === 'finalizar') {
            await finalizarCompra(items, total); 
            return;
        }
        if (opcion === 'cuello') {
            await calcularCuelloBotellaTUI();
        } else if (!isNaN(parseInt(opcion))) {
            const indice = parseInt(opcion);
            const eliminado = gestorCarrito.eliminarItem(indice);
            p.note(COLOR.ERROR(`Artículo eliminado: ${eliminado.nombre}`));
        }
    }
}

// Funcion para calcular el cuello de botella
async function calcularCuelloBotellaTUI() {
    console.clear();
    p.intro(centerText(COLOR.INFO('---  CÁLCULO DE CUELLO DE BOTELLA ---')));

    const resultado = gestorCarrito.calcularCuelloBotella();

    if (!resultado.cpu || !resultado.gpu) {
        console.log(COLOR.WARNING('Necesitas tener una CPU y una GPU en el carrito para esta estimación.'));
        await esperarContinuar();
        return;
    }

    console.log(COLOR.ACCENT('\n:: Rendimiento estimado ::'));
    console.log('CPU:', barraPorcentaje(resultado.cpu.potencia));
    console.log('GPU:', barraPorcentaje(resultado.gpu.potencia) + '\n');

    console.log(`CPU seleccionada: ${COLOR.ACCENT(resultado.cpu.nombre)}`);
    console.log(`GPU seleccionada: ${COLOR.ACCENT(resultado.gpu.nombre)}\n`);
    console.log(resultado.esCuello ? COLOR.ERROR.bold(resultado.mensaje) : COLOR.SUCCESS.bold(resultado.mensaje));
    await esperarContinuar();
}
// Funcion para finalizar la compra
async function finalizarCompra(items, total) {
    try {
        // --- 1. Lógica de negocio: Actualizar Stock en SQLite ---
        for (const item of items) {
            gestorInventario.repo.actualizarStock(item.id, -item.cantidad);
        }

        // --- 2. Lógica de Vista/Reporte: Generar Factura ---
        // await generarFacturaPDF(items, total); // Comentado para simplificar

        // --- 3. Lógica de negocio: Vaciar Carrito ---
        gestorCarrito.vaciarCarrito();

        p.note(COLOR.SUCCESS.bgGreen(`¡COMPRA COMPLETADA con un total de ${total.toFixed(2)} Bs! Se actualizó el stock.`));
        await esperarContinuar();
        
    } catch (error) {
        p.note(COLOR.ERROR(`ERROR en la finalización de la compra. Stock no actualizado: ${error.message}`));
        await esperarContinuar();
    }
}

// --- Flujo Principal de la Aplicación (TUI) ---
async function mainMenu() {
    console.clear();
    p.intro(centerText(COLOR.BG_MAGENTA('--- GESTOR DE INVENTARIO Y VENTAS ---')));

    while (true) {
        const opcion = await p.select({
            message: COLOR.ACCENT('¿Qué deseas hacer?'),
            options: [
                { value: 'comprar', label: '🛒 Comprar Componentes' },
                { value: 'ver_carrito', label: '🛍️ Ver Carrito y Finalizar Compra' },
                { value: 'ver_inventario', label: '📦 Ver Inventario Completo' },
                { value: 'admin', label: '⚙️ Administrar Inventario' },
                { value: 'salir', label: '🚪 Salir' },
            ]
        });

        if (p.isCancel(opcion) || opcion === 'salir') {
            p.outro(COLOR.SUCCESS('¡Gracias por usar el sistema!'));
            process.exit(0);
        }

        switch (opcion) {
            case 'comprar':
                await menuComprar();
                break;
            case 'ver_carrito':
                await verCarrito();
                break;
            case 'ver_inventario':
                await mostrarTodosProductos();
                break;
            case 'admin':
                await menuAdmin();
                break;
        }
    }
}

async function menuComprar() {
    const categoria = await p.select({
        message: COLOR.ACCENT('Elige una categoría para comprar:'),
        options: CATEGORIAS_VALIDAS.map(c => ({ value: c, label: c.toUpperCase() }))
    });

    if (p.isCancel(categoria)) return;
    await comprarPorCategoria(categoria);
}

async function menuAdmin() {
    const opcion = await p.select({
        message: COLOR.ACCENT('¿Qué deseas hacer?'),
        options: [
            { value: 'agregar', label: '➕ Agregar Producto' },
            { value: 'eliminar', label: '➖ Eliminar Producto' },
        ]
    });

    if (p.isCancel(opcion)) return;

    if (opcion === 'agregar') {
        await agregarProducto();
    } else if (opcion === 'eliminar') {
        await eliminarProducto();
    }
}

// --- INICIO DE LA APP ---
mainMenu();