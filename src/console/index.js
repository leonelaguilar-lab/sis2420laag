import readline from 'readline';
import chalk from 'chalk';
import { InventarioRepositorioSqlite } from '../../core/data/InventarioRepositorioSqlite.js';
import { InventarioManager } from '../../core/managers/InventarioManager.js';
import { CarritoManager } from '../../core/managers/CarritoManager.js';
import { Producto } from '../../core/models/Producto.js'; // Necesario para crear productos

// =================================================================
// 1. VISTA (View)
// =================================================================
export class ConsoleView {
    constructor(logger = console.log, clear = () => console.clear()) {
        this.logger = logger;
        this.clear = clear;
        this.CATEGORIAS_VALIDAS = ['cpu', 'gpu', 'ram', 'psu', 'case', 'otros'];
    }

    mostrarMenuPrincipal() {
        this.clear();
        this.logger(chalk.blue.bold("\n=== CONSOLE-STORE (MVC) ===\n"));
        this.logger("1. 🛒 Comprar Componentes");
        this.logger("2. 🛍️ Ver Carrito y Finalizar Compra");
        this.logger("3. 📦 Ver Inventario Completo");
        this.logger("4. ⚙️ Administrar Inventario");
        this.logger("5. 🚪 Salir\n");
    }

    mostrarMenuComprarCategorias() {
        this.clear();
        this.logger(chalk.magenta.bold("\n--- COMPRAR COMPONENTES ---\n"));
        this.CATEGORIAS_VALIDAS.forEach((cat, i) => {
            this.logger(`${i + 1}. ${cat.toUpperCase()}`);
        });
        this.logger("0. ↩️ Volver al menú principal\n");
    }

    mostrarMenuAdmin() {
        this.clear();
        this.logger(chalk.cyan.bold("\n--- ADMINISTRAR INVENTARIO ---\n"));
        this.logger("1. ➕ Agregar Producto");
        this.logger("2. ➖ Eliminar Producto");
        this.logger("0. ↩️ Volver al menú principal\n");
    }

    mostrarInventario(productos, titulo = 'Inventario Completo') {
        this.clear();
        this.logger(chalk.yellow.bold(`--- ${titulo} ---\n`));
        if (productos.length === 0) {
            this.logger(chalk.gray("No hay productos para mostrar."));
        } else {
            productos.forEach(p => {
                const stockInfo = p.stock > 0 ? chalk.green(`${p.stock} uds`) : chalk.red('Agotado');
                const potenciaInfo = p.potencia > 0 ? ` (Potencia: ${p.potencia})` : '';
                this.logger(`${chalk.cyan(p.id)}: ${p.nombre} (${p.categoria}) - ${chalk.yellow(p.precio + ' Bs')} (${stockInfo})${potenciaInfo}`);
            });
        }
        this.logger(chalk.gray("\n---------------------------------"));
    }

    mostrarProductosParaSeleccion(productos, titulo = 'Selecciona un producto') {
        this.clear();
        this.logger(chalk.yellow.bold(`--- ${titulo} ---\n`));
        if (productos.length === 0) {
            this.logger(chalk.gray("No hay productos disponibles."));
        } else {
            productos.forEach((p, i) => {
                const stockInfo = p.stock > 0 ? chalk.green(`${p.stock} uds`) : chalk.red('Agotado');
                const potenciaInfo = p.potencia > 0 ? ` (Potencia: ${p.potencia})` : '';
                this.logger(`${i + 1}. ${p.nombre} (${p.categoria}) - ${chalk.yellow(p.precio + ' Bs')} (${stockInfo})${potenciaInfo}`);
            });
        }
        this.logger("0. ↩️ Volver al menú principal\n");
    }

    mostrarCarrito(items, total, analisisCuello) {
        this.clear();
        this.logger(chalk.green.bold("--- Carrito de Compras ---\n"));
        if (items.length === 0) {
            this.logger(chalk.gray("El carrito está vacío."));
        } else {
            items.forEach((item, i) => {
                this.logger(`${i + 1}. ${item.nombre} x${item.cantidad} - Subtotal: ${chalk.yellow(item.getSubtotal().toFixed(2) + ' Bs')}`);
            });
            this.logger(chalk.green.bold(`\nTotal: ${total.toFixed(2)} Bs`));
        }

        if (analisisCuello && analisisCuello.mensaje) {
            const color = analisisCuello.esCuello ? chalk.red : chalk.green;
            this.logger(color(`\nAnálisis: ${analisisCuello.mensaje}`));
        }

        this.logger(chalk.gray("\n---------------------------------"));
    }

    mostrarMensaje(mensaje, color = 'white') {
        this.logger(chalk[color](mensaje));
    }

    pedirTexto(pregunta) {
        return this.question(chalk.yellow(pregunta));
    }

    pedirNumero(pregunta) {
        return this.question(chalk.yellow(pregunta));
    }

    barraPorcentaje(puntuacion) {
        const llenas = Math.round(puntuacion / 5);
        const vacias = 20 - llenas;
        return `[${'█'.repeat(llenas)}${'-'.repeat(vacias)}] ${puntuacion.toFixed(0)}%`;
    }
}

// =================================================================
// 2. CONTROLADOR (Controller)
// =================================================================
export class ConsoleController {
    constructor(inventarioManager, carritoManager, view, question) {
        this.inventarioManager = inventarioManager;
        this.carritoManager = carritoManager;
        this.view = view;
        this.question = question;
        this.CATEGORIAS_VALIDAS = ['cpu', 'gpu', 'ram', 'psu', 'case', 'otros'];
    }

    async run() {
        while (true) {
            this.view.mostrarMenuPrincipal();
            const opcion = await this.question(chalk.yellow("Elige una opción: "));

            switch (opcion) {
                case '1': await this.gestionarCompra(); break;
                case '2': await this.gestionarCarrito(); break;
                case '3': await this.verInventarioCompleto(); break;
                case '4': await this.gestionarAdmin(); break;
                case '5':
                    this.view.mostrarMensaje("¡Gracias por usar el sistema!", "blue");
                    return;
                default:
                    this.view.mostrarMensaje("Opción no válida. Intenta de nuevo.", "red");
                    await this.pausar();
            }
        }
    }

    async pausar() {
        await this.question(chalk.gray("\nPresiona ENTER para continuar..."));
    }

    async verInventarioCompleto() {
        const productos = this.inventarioManager.obtenerTodos();
        this.view.mostrarInventario(productos, 'Inventario Completo');
        await this.pausar();
    }

    async gestionarCompra() {
        while (true) {
            this.view.mostrarMenuComprarCategorias();
            const opcionRaw = await this.question(chalk.yellow("Elige una categoría (o '0' para volver): "));
            
            if (opcionRaw === '0') return;

            const opcion = parseInt(opcionRaw);
            if (isNaN(opcion) || opcion < 1 || opcion > this.CATEGORIAS_VALIDAS.length) {
                this.view.mostrarMensaje("Opción no válida.", "red");
                await this.pausar();
                continue;
            }

            const categoriaSeleccionada = this.CATEGORIAS_VALIDAS[opcion - 1];
            await this.gestionarCompraPorCategoria(categoriaSeleccionada);
            // Después de comprar por categoría, mostramos el carrito o volvemos al menú principal de compra
            // this.view.mostrarMensaje(`Volviendo a categorías de compra...`);
            // await this.pausar();
        }
    }

    async gestionarCompraPorCategoria(categoria) {
        const productos = this.inventarioManager.obtenerTodos().filter(p => p.categoria === categoria && p.stock > 0);
        this.view.mostrarProductosParaSeleccion(productos, `Comprar ${categoria.toUpperCase()}`);

        if (productos.length === 0) {
            this.view.mostrarMensaje(`No hay productos de ${categoria} disponibles o en stock.`, "red");
            await this.pausar();
            return;
        }
        
        const seleccionRaw = await this.question(chalk.yellow("Introduce el número del producto (o '0' para volver): "));
        if (seleccionRaw === '0') return;

        const indice = parseInt(seleccionRaw) - 1;
        if (isNaN(indice) || indice < 0 || indice >= productos.length) {
            this.view.mostrarMensaje("Selección de producto no válida.", "red");
            await this.pausar();
            return;
        }

        const productoSeleccionado = productos[indice];
        const cantidadRaw = await this.question(chalk.yellow(`¿Cuántas unidades de ${productoSeleccionado.nombre} quieres? (Max: ${productoSeleccionado.stock}): `));
        const cantidad = parseInt(cantidadRaw);

        if (isNaN(cantidad) || cantidad <= 0 || cantidad > productoSeleccionado.stock) {
            this.view.mostrarMensaje("Cantidad no válida o stock insuficiente.", "red");
            await this.pausar();
            return;
        }

        try {
            this.carritoManager.agregarItem(productoSeleccionado, cantidad);
            this.inventarioManager.actualizarStock(productoSeleccionado.id, -cantidad);
            this.view.mostrarMensaje(`${cantidad}x ${productoSeleccionado.nombre} añadido al carrito.`, "green");
        } catch (e) {
            this.view.mostrarMensaje(`Error al añadir al carrito: ${e.message}`, "red");
        }
        await this.pausar();
    }

    async gestionarCarrito() {
        while (true) {
            const items = this.carritoManager.obtenerItems();
            const total = this.carritoManager.calcularTotal();
            const analisis = this.carritoManager.calcularCuelloBotella();
            this.view.mostrarCarrito(items, total, analisis);

            this.view.logger("1. ✅ Finalizar Compra");
            this.view.logger("2. ➖ Eliminar Item del Carrito");
            this.view.logger("0. ↩️ Volver al menú principal\n");

            const opcion = await this.question(chalk.yellow("Elige una opción: "));

            if (opcion === '0') return;

            switch (opcion) {
                case '1':
                    await this.finalizarCompra();
                    if (this.carritoManager.obtenerItems().length === 0) return; // Si la compra fue exitosa, salir del carrito
                    break;
                case '2':
                    await this.eliminarItemDelCarrito();
                    break;
                default:
                    this.view.mostrarMensaje("Opción no válida.", "red");
                    await this.pausar();
            }
        }
    }

    async eliminarItemDelCarrito() {
        const items = this.carritoManager.obtenerItems();
        if (items.length === 0) {
            this.view.mostrarMensaje("El carrito está vacío, no hay items para eliminar.", "red");
            await this.pausar();
            return;
        }
        items.forEach((item, i) => {
            this.view.logger(`${i + 1}. ${item.nombre} x${item.cantidad}`);
        });
        const opcionRaw = await this.question(chalk.yellow("Introduce el Nº de item a eliminar (o '0' para volver): "));
        if (opcionRaw === '0') return;

        const indice = parseInt(opcionRaw) - 1;
        if (isNaN(indice) || indice < 0 || indice >= items.length) {
            this.view.mostrarMensaje("Número de item no válido.", "red");
            await this.pausar();
            return;
        }

        try {
            const eliminado = this.carritoManager.eliminarItem(indice);
            this.inventarioManager.actualizarStock(eliminado.id, eliminado.cantidad);
            this.view.mostrarMensaje(`${eliminado.nombre} (${eliminado.cantidad} uds) eliminado del carrito. Stock devuelto.`, "yellow");
        } catch (e) {
            this.view.mostrarMensaje(`Error al eliminar: ${e.message}`, "red");
        }
        await this.pausar();
    }

    async finalizarCompra() {
        const items = this.carritoManager.obtenerItems();
        if (items.length === 0) {
            this.view.mostrarMensaje("El carrito está vacío. No hay nada que comprar.", "red");
            await this.pausar();
            return;
        }
        const total = this.carritoManager.calcularTotal();
        this.view.mostrarMensaje(`Finalizando compra por un total de ${total.toFixed(2)} Bs...`, "green");
        
        try {
            // El stock ya se actualizó al añadir, aquí solo vaciamos el carrito
            this.carritoManager.vaciarCarrito();
            this.view.mostrarMensaje("¡Compra completada con éxito!", "green");
        } catch (e) {
            this.view.mostrarMensaje(`Error al finalizar la compra: ${e.message}`, "red");
        }
        await this.pausar();
    }

    async gestionarAdmin() {
        while (true) {
            this.view.mostrarMenuAdmin();
            const opcion = await this.question(chalk.yellow("Elige una opción (o '0' para volver): "));

            if (opcion === '0') return;

            switch (opcion) {
                case '1': await this.agregarProductoAdmin(); break;
                case '2': await this.eliminarProductoAdmin(); break;
                default:
                    this.view.mostrarMensaje("Opción no válida.", "red");
                    await this.pausar();
            }
        }
    }

    async agregarProductoAdmin() {
        this.view.clear();
        this.view.logger(chalk.green.bold("--- AGREGAR NUEVO PRODUCTO ---"));

        const nombre = await this.question("Nombre del producto: ");
        const categoriaRaw = await this.question(`Categoría (${this.CATEGORIAS_VALIDAS.join(', ')}): `);
        const categoria = categoriaRaw.toLowerCase();
        
        if (!this.CATEGORIAS_VALIDAS.includes(categoria)) {
            this.view.mostrarMensaje("Categoría no válida.", "red");
            await this.pausar();
            return;
        }

        const precio = parseFloat(await this.question("Precio: "));
        const stock = parseInt(await this.question("Stock: "));
        const potencia = (categoria === 'cpu' || categoria === 'gpu') ? parseInt(await this.question("Potencia (0 si no aplica): ")) : 0;

        try {
            this.inventarioManager.agregarProducto(nombre, categoria, precio, stock, potencia);
            this.view.mostrarMensaje(`Producto '${nombre}' agregado con éxito.`, "green");
        } catch (e) {
            this.view.mostrarMensaje(`Error al agregar producto: ${e.message}`, "red");
        }
        await this.pausar();
    }

    async eliminarProductoAdmin() {
        const productos = this.inventarioManager.obtenerTodos();
        this.view.mostrarInventario(productos, 'Eliminar Producto');

        if (productos.length === 0) {
            this.view.mostrarMensaje("No hay productos en el inventario para eliminar.", "red");
            await this.pausar();
            return;
        }

        const id = await this.question(chalk.yellow("Introduce el ID del producto a eliminar (o '0' para volver): "));
        if (id === '0') return;

        try {
            this.inventarioManager.eliminarProducto(id);
            this.view.mostrarMensaje(`Producto con ID '${id}' eliminado con éxito.`, "yellow");
        } catch (e) {
            this.view.mostrarMensaje(`Error al eliminar producto: ${e.message}`, "red");
        }
        await this.pausar();
    }
}

// =================================================================
// 3. PUNTO DE ENTRADA
// =================================================================
function main() {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const question = (query) => new Promise(resolve => rl.question(query, resolve));

    const repo = new InventarioRepositorioSqlite();
    const inventarioManager = new InventarioManager(repo);
    const carritoManager = new CarritoManager();
    
    const view = new ConsoleView(console.log, () => console.clear());
    const controller = new ConsoleController(inventarioManager, carritoManager, view, question);

    controller.run().then(() => {
        rl.close();
    });
}

if (import.meta.main) {
    main();
}
