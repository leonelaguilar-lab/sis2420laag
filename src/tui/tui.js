import * as p from '@clack/prompts';
import chalk from 'chalk';
import stripAnsi from 'strip-ansi';
import { inicializarBaseDeDatos, cerrarConexion } from '../../core/data/setup.js';
import { InventarioManager } from '../../core/managers/InventarioManager.js';
import { CarritoManager } from '../../core/managers/CarritoManager.js';

class TUIView {
    constructor() {
        this.COLOR = {
            ERROR: chalk.red,
            SUCCESS: chalk.green,
            WARNING: chalk.yellow,
            INFO: chalk.cyan,
            ACCENT: chalk.magenta,
            MAIN: chalk.white,
            CATEGORY: chalk.blue,
            BG_MAGENTA: chalk.bgMagenta.white,
        };
        this.CATEGORIAS_VALIDAS = ['cpu', 'gpu', 'ram', 'psu', 'case', 'otros'];
    }

    centerText(text, width = process.stdout.columns) {
        const strippedText = stripAnsi(text);
        const padding = Math.max(0, Math.floor((width - strippedText.length) / 2));
        return ' '.repeat(padding) + text;
    }

    async esperarContinuar(message = 'Presiona ENTER para continuar...') {
        await p.text({ message, placeholder: '...' });
    }

    barraPorcentaje(p) {
        const llenas = Math.round(p / 5);
        const vacias = 20 - llenas;
        return `[${'█'.repeat(llenas)}${'-'.repeat(vacias)}] ${p.toFixed(0)}%`;
    }

    mostrarIntro() {
        console.clear();
        p.intro(this.centerText(this.COLOR.BG_MAGENTA('--- GESTOR DE INVENTARIO Y VENTAS (TUI) ---')));
    }

    mostrarOutro() {
        p.outro(this.COLOR.SUCCESS('¡Gracias por usar el sistema! Conexión cerrada.'));
    }

    async mostrarMenuPrincipal() {
        return await p.select({
            message: this.COLOR.ACCENT('¿Qué deseas hacer?'),
            options: [
                { value: 'comprar', label: '🛒 Comprar Componentes' },
                { value: 'ver_carrito', label: '🛍️ Ver Carrito y Finalizar Compra' },
                { value: 'ver_inventario', label: '📦 Ver Inventario Completo' },
                { value: 'admin', label: '⚙️ Administrar Inventario' },
                { value: 'salir', label: '🚪 Salir' },
            ]
        });
    }

    async mostrarMenuAdmin() {
        return await p.select({
            message: this.COLOR.ACCENT('¿Qué deseas hacer?'),
            options: [
                { value: 'agregar', label: '➕ Agregar Producto' },
                { value: 'eliminar', label: '➖ Eliminar Producto' },
                { value: 'volver', label: '↩️ Volver' }
            ]
        });
    }

    async mostrarMenuCategorias() {
        const options = this.CATEGORIAS_VALIDAS.map(c => ({ value: c, label: c.toUpperCase() }));
        options.push({ value: 'volver', label: '↩️ Volver' });
        return await p.select({
            message: this.COLOR.ACCENT('Elige una categoría para comprar:'),
            options
        });
    }

    mostrarInventario(inventario) {
        console.clear();
        p.intro(this.centerText(this.COLOR.WARNING('--- INVENTARIO COMPLETO ---')));
        if (inventario.length === 0) {
            p.note('No hay productos registrados.');
        } else {
            inventario.forEach((prod, i) => {
                console.log(`${this.COLOR.INFO(i + 1)}. ${this.COLOR.MAIN(prod.nombre)} - ${this.COLOR.CATEGORY(prod.categoria.toUpperCase())} - ${this.COLOR.WARNING(prod.precio)} Bs (${this.COLOR.SUCCESS(prod.stock)} uds)`);
            });
        }
    }

    async seleccionarProducto(productos, categoria) {
        console.clear();
        p.intro(this.centerText(this.COLOR.SUCCESS(`--- COMPRAR ${categoria.toUpperCase()} ---`)));

        if (productos.length === 0) {
            p.note(this.COLOR.WARNING(`No hay stock de ${categoria.toUpperCase()} por el momento.`));
            return null;
        }

        const opciones = productos.map((p, i) => ({
            value: i,
            label: `${p.nombre} - ${p.precio} Bs (${p.stock} uds)`
        }));
        opciones.push({ value: 'volver', label: '↩️ Volver al menú anterior' });

        return await p.select({ message: 'Selecciona un producto:', options: opciones });
    }

    async pedirCantidad(producto) {
        return await p.text({
            message: `¿Cuántas unidades de ${producto.nombre} quieres? (Max: ${producto.stock})`,
            validate: (v) => {
                const num = parseInt(v);
                if (isNaN(num) || num <= 0) return 'Debe ser un número positivo.';
                if (num > producto.stock) return `Stock insuficiente. Máximo: ${producto.stock}`;
                return undefined;
            }
        });
    }

    async mostrarCarrito(items, total) {
        console.clear();
        p.intro(this.centerText(this.COLOR.WARNING('---  CARRITO DE COMPRAS ---')));

        if (items.length === 0) {
            p.note('El carrito está vacío.');
            return null;
        }

        items.forEach((item, i) => {
            console.log(`${this.COLOR.INFO(i + 1)}. ${this.COLOR.MAIN(item.nombre)} x${item.cantidad} = ${this.COLOR.SUCCESS(item.getSubtotal().toFixed(2))} Bs`);
        });
        console.log(`\nTOTAL: ${this.COLOR.SUCCESS.bold(total.toFixed(2) + ' Bs')}`);
        
        const options = items.map((item, i) => ({ value: i.toString(), label: `❌ Eliminar ${item.nombre}` }));
        options.push({ value: 'cuello', label: '🔬 Analizar Cuello de Botella' });
        options.push({ value: 'finalizar', label: '✅ Finalizar Compra' });
        options.push({ value: 'volver', label: '↩️ Volver' });

        return await p.select({ message: '¿Qué quieres hacer?', options });
    }
    
    mostrarAnalisisCuello(resultado) {
        console.clear();
        p.intro(this.centerText(this.COLOR.INFO('--- CÁLCULO DE CUELLO DE BOTELLA ---')));
        if (!resultado.cpu || !resultado.gpu) {
            p.note(this.COLOR.WARNING(resultado.mensaje));
            return;
        }
        console.log(`\nCPU: ${this.barraPorcentaje(resultado.cpu.potencia)} (${resultado.cpu.nombre})`);
        console.log(`GPU: ${this.barraPorcentaje(resultado.gpu.potencia)} (${resultado.gpu.nombre})\n`);
        const color = resultado.esCuello ? this.COLOR.ERROR.bold : this.COLOR.SUCCESS.bold;
        console.log(color(resultado.mensaje));
    }
    
    async pedirDatosProducto() {
        return await p.group({
            nombre: () => p.text({ message: 'Nombre del producto:', validate: v => !v && 'El nombre es requerido.' }),
            categoria: () => p.select({ message: 'Categoría:', options: this.CATEGORIAS_VALIDAS.map(c => ({value: c, label: c.toUpperCase()})) }),
            precio: () => p.text({ message: 'Precio:', validate: v => (isNaN(parseFloat(v)) || parseFloat(v) <= 0) && 'Debe ser un número positivo.' }),
            stock: () => p.text({ message: 'Stock:', validate: v => (isNaN(parseInt(v)) || parseInt(v) < 0) && 'Debe ser un entero no negativo.' }),
            potencia: ({results}) => (results.categoria === 'cpu' || results.categoria === 'gpu') ? p.text({message: 'Potencia (0-100):', initialValue: '0', validate: v => (isNaN(parseInt(v)) || parseInt(v) < 0) && 'Debe ser un número no negativo.'}) : undefined
        });
    }

    async pedirConfirmacion(message) {
        return await p.confirm({ message });
    }

    mostrarMensaje(nota, tipo = 'info') {
        const color = this.COLOR[tipo.toUpperCase()] || this.COLOR.INFO;
        p.note(color(nota));
    }
    
    iniciarSpinner(msg) { const s = p.spinner(); s.start(msg); return s; }
    detenerSpinner(s, msg, tipo = 'SUCCESS') { s.stop(this.COLOR[tipo](msg)); }
}

class TUIController {
    constructor(inventarioManager, carritoManager, view) {
        this.inventarioManager = inventarioManager;
        this.carritoManager = carritoManager;
        this.view = view;
    }

    async run() {
        this.view.mostrarIntro();
        while (true) {
            const opcion = await this.view.mostrarMenuPrincipal();
            if (p.isCancel(opcion) || opcion === 'salir') return this.view.mostrarOutro();

            switch (opcion) {
                case 'comprar': await this.gestionarCompra(); break;
                case 'ver_carrito': await this.gestionarCarrito(); break;
                case 'ver_inventario': await this.verInventarioCompleto(); break;
                case 'admin': await this.gestionarAdmin(); break;
            }
        }
    }

    async gestionarCompra() {
        while(true) {
            const categoria = await this.view.mostrarMenuCategorias();
            if (p.isCancel(categoria) || categoria === 'volver') return;
            
            const s = this.view.iniciarSpinner('Cargando productos...');
            const productos = await this.inventarioManager.obtenerPorCategoria(categoria);
            this.view.detenerSpinner(s, 'Productos cargados.');

            const indice = await this.view.seleccionarProducto(productos, categoria);
            if (indice === null || p.isCancel(indice) || indice === 'volver') {
                if(indice === null) await this.view.esperarContinuar();
                continue;
            };

            const producto = productos[indice];
            const cantidadRaw = await this.view.pedirCantidad(producto);
            if (p.isCancel(cantidadRaw)) continue;

            const cantidad = parseInt(cantidadRaw);
            try {
                await this.carritoManager.agregarItem(producto, cantidad);
                this.view.mostrarMensaje(`${cantidad}x ${producto.nombre} añadido al carrito.`, 'success');
            } catch (e) {
                this.view.mostrarMensaje(`Error: ${e.message}`, 'error');
            }
        }
    }

    async gestionarCarrito() {
        while (true) {
            const items = this.carritoManager.obtenerItems();
            const total = this.carritoManager.calcularTotal();
            const opcion = await this.view.mostrarCarrito(items, total);

            if (opcion === null) { await this.view.esperarContinuar(); return; }
            if (p.isCancel(opcion) || opcion === 'volver') return;

            if (opcion === 'finalizar') {
                await this.finalizarCompra();
                return; // Salir del bucle del carrito
            } else if (opcion === 'cuello') {
                const resultado = this.carritoManager.calcularCuelloBotella();
                this.view.mostrarAnalisisCuello(resultado);
                await this.view.esperarContinuar();
            } else { // Eliminar item
                const indice = parseInt(opcion);
                if(await this.view.pedirConfirmacion(`¿Seguro que quieres eliminar "${items[indice].nombre}"?`)) {
                    await this.carritoManager.eliminarItem(indice);
                    this.view.mostrarMensaje('Item eliminado y stock devuelto.', 'warning');
                }
            }
        }
    }
    
    async finalizarCompra() {
        const total = this.carritoManager.calcularTotal();
        if(await this.view.pedirConfirmacion(`¿Confirmas la compra por un total de ${total.toFixed(2)} Bs?`)){
            this.carritoManager.finalizarCompra();
            this.view.mostrarMensaje('¡Compra completada con éxito!', 'success');
        } else {
            this.view.mostrarMensaje('Compra cancelada.', 'info');
        }
        await this.view.esperarContinuar();
    }
    
    async verInventarioCompleto() {
        const s = this.view.iniciarSpinner('Cargando inventario...');
        const inventario = await this.inventarioManager.obtenerTodos();
        this.view.detenerSpinner(s, 'Inventario cargado.');
        this.view.mostrarInventario(inventario);
        await this.view.esperarContinuar();
    }
    
    async gestionarAdmin() {
        while(true) {
            const opcion = await this.view.mostrarMenuAdmin();
            if(p.isCancel(opcion) || opcion === 'volver') return;
            if(opcion === 'agregar') await this.agregarProducto();
            if(opcion === 'eliminar') await this.eliminarProducto();
        }
    }

    async agregarProducto() {
        const datos = await this.view.pedirDatosProducto();
        if(p.isCancel(datos)) return;
        try {
            await this.inventarioManager.agregarProducto(datos.nombre, datos.categoria, parseFloat(datos.precio), parseInt(datos.stock), parseInt(datos.potencia || 0));
            this.view.mostrarMensaje(`Producto "${datos.nombre}" agregado.`, 'success');
        } catch(e) {
            this.view.mostrarMensaje(`Error al agregar: ${e.message}`, 'error');
        }
    }

    async eliminarProducto() {
        const s = this.view.iniciarSpinner('Cargando inventario...');
        const inventario = await this.inventarioManager.obtenerTodos();
        this.view.detenerSpinner(s, 'Inventario cargado.');
        if (inventario.length === 0) {
            p.note('No hay productos para eliminar.');
            return;
        }

        const opciones = inventario.map((p) => ({ value: p.id, label: `${p.nombre} (${p.stock} uds)`}));
        const id = await p.select({ message: 'Selecciona producto a eliminar:', options: opciones});
        if(p.isCancel(id)) return;
        
        if(await this.view.pedirConfirmacion('¿Seguro que quieres eliminar este producto?')) {
            try {
                await this.inventarioManager.eliminarProducto(id);
                this.view.mostrarMensaje('Producto eliminado.', 'warning');
            } catch(e) {
                this.view.mostrarMensaje(`Error al eliminar: ${e.message}`, 'error');
            }
        }
    }
}

async function startApp() {
    const view = new TUIView();
    try {
        await inicializarBaseDeDatos();

        const inventarioManager = new InventarioManager();
        const carritoManager = new CarritoManager(inventarioManager);
        const controller = new TUIController(inventarioManager, carritoManager, view);

        await controller.run();

    } catch (error) {
        p.cancel(view.COLOR.ERROR('La aplicación no pudo iniciar.'));
    } finally {
        await cerrarConexion();
    }
}

startApp();