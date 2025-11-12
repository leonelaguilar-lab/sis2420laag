import * as p from '@clack/prompts'
import chalk from 'chalk'
import stripAnsi from 'strip-ansi'
import { readFileSync, writeFileSync, existsSync } from 'fs'

const RUTA_INV = '../../data/invtui.json'
const CATEGORIAS_VALIDAS = ['cpu', 'gpu', 'ram', 'psu', 'case', 'otros']

let carrito = [] // Carrito de compras global

// --- Estilos TUI---

const COLOR = {
  MAIN: chalk.hex('#8A2BE2').bold,
  ACCENT: chalk.hex('#1E90FF').bold,
  SUCCESS: chalk.green.bold,
  ERROR: chalk.red.bold,
  WARNING: chalk.hex('#FFD700').bold, 
  INFO: chalk.cyan,
  CATEGORY: chalk.hex('#FF6347'),
}

// Función para centrar texto
function centerText(text, width = process.stdout.columns) {
  const padding = Math.floor((width - stripAnsi(text).length) / 2)
  return ' '.repeat(Math.max(0, padding)) + text
}

// --- Funciones de Gestión de Inventario ---

// Cargar inventario desde JSON
function cargarInventario() {
  if (!existsSync(RUTA_INV)) writeFileSync(RUTA_INV, '[]')
  return JSON.parse(readFileSync(RUTA_INV, 'utf8'))
}

// Guardar inventario en JSON
function guardarInventario(data) {
  writeFileSync(RUTA_INV, JSON.stringify(data, null, 2))
}

// --- Pausa TUI ---
async function esperarContinuar() {
  await p.note(COLOR.INFO('Presiona Enter para continuar...'))
  await p.select({
    message: ' ',
    options: [{ value: 'continuar', label: 'Continuar' }],
    initialValue: 'continuar'
  })
}

// --- Menús Principales ---

// Menú principal
async function main() {
  console.clear()
  p.intro(centerText(COLOR.MAIN('========================================')))
  p.intro(centerText(COLOR.MAIN('  TIENDA DE COMPONENTES DE PC  ')))
  p.intro(centerText(COLOR.MAIN('========================================')))

  while (true) {
    const opcion = await p.select({
      message: COLOR.ACCENT(':: SELECCIONA UNA OPCIÓN ::'),
      options: [
        { value: 'tienda', label: '  TIENDA (Comprar y ver Carrito)' },
        { value: 'gestion', label: '  GESTIÓN DE TIENDA (Inventario)' },
        { value: 'salir', label: COLOR.ERROR('  SALIR') }
      ]
    })

    if (p.isCancel(opcion) || opcion === 'salir') break
    if (opcion === 'tienda') await menuTienda()
    if (opcion === 'gestion') await menuGestion()
  }

  p.outro(COLOR.SUCCESS('¡GRACIAS POR USAR LA APLICACIÓN!'))
}
// ----------------------------------------------------------------------------------

// Menú de Gestión de Tienda (Inventario)
async function menuGestion() {
  while (true) {
    console.clear()
    p.intro(centerText(COLOR.WARNING('=== MÓDULO DE GESTIÓN DE TIENDA ===')))

    const opcion = await p.select({
      message: COLOR.ACCENT(':: Elige una acción de inventario ::'),
      options: [
        { value: 'ver', label: ' Ver inventario completo' },
        { value: 'agregar', label: COLOR.SUCCESS(' Agregar producto') },
        { value: 'eliminar', label: COLOR.ERROR(' Eliminar producto') },
        { value: 'volver', label: COLOR.INFO(' Volver al menú principal') }
      ]
    })

    if (opcion === 'volver' || p.isCancel(opcion)) break

    switch (opcion) {
      case 'ver':
        await mostrarTodosProductos()
        break
      case 'agregar':
        await agregarProducto()
        break
      case 'eliminar':
        await eliminarProducto()
        break
    }
  }
}
// ----------------------------------------------------------------------------------

// Menú de Tienda
async function menuTienda() {
  while (true) {
    console.clear()
    p.intro(centerText(COLOR.MAIN('=== MÓDULO DE COMPRAS ===')))

    const categorias = CATEGORIAS_VALIDAS.map(c => ({
      value: c,
      label: COLOR.CATEGORY(`  Comprar ${c.toUpperCase()}`)
    }))

    const opcion = await p.select({
      message: COLOR.ACCENT(':: ¿Qué deseas hacer? ::'),
      options: [
        { value: 'carrito', label: COLOR.WARNING(' Ver y gestionar Carrito de Compras') },
        ...categorias,
        { value: 'volver', label: COLOR.INFO(' ↩ Volver al menú principal') }
      ]
    })

    if (opcion === 'volver' || p.isCancel(opcion)) break
    if (opcion === 'carrito') {
      await verCarrito()
    } else if (CATEGORIAS_VALIDAS.includes(opcion)) {
      await comprarPorCategoria(opcion)
    }
  }
}
// ----------------------------------------------------------------------------------

// --- Funciones de la Tienda ---

// Muestra la lista completa de productos
async function mostrarTodosProductos() {
  const inventario = cargarInventario()
  console.clear()
  p.intro(centerText(COLOR.WARNING('--- INVENTARIO COMPLETO ---')))
  if (inventario.length === 0) {
    console.log(chalk.gray('No hay productos registrados en el inventario.'))
    await esperarContinuar()
    return
  }

  inventario.forEach((prod, i) => {
    console.log(`${COLOR.INFO(i + 1)}. ${COLOR.MAIN(prod.nombre)} - ${COLOR.CATEGORY(prod.categoria.toUpperCase())} - ${COLOR.WARNING(prod.precio)} Bs (${COLOR.SUCCESS(prod.stock)} uds)`)
  })
  await esperarContinuar()
}

// Función para ver y gestionar el carrito
async function verCarrito() {
  while (true) {
    console.clear()
    p.intro(centerText(COLOR.WARNING('---  CARRITO DE COMPRAS ---')))

    if (carrito.length === 0) {
      console.log(chalk.gray('El carrito está vacío.'))
      await esperarContinuar()
      return // Salir del loop para volver al menú de la tienda
    }

    let total = 0
    const opcionesCarrito = []

    carrito.forEach((item, i) => {
      const subtotal = item.precio * item.cantidad
      total += subtotal
      const label = `${COLOR.INFO(i + 1)}. ${COLOR.MAIN(item.nombre)} x${item.cantidad} (${item.precio} Bs/u) = ${COLOR.SUCCESS(subtotal.toFixed(2))} Bs`
      console.log(label)
      opcionesCarrito.push({ value: i.toString(), label: COLOR.ERROR(`  Eliminar ${item.nombre}`) })
    })

    console.log(COLOR.ACCENT('\n--- RESUMEN ---'))
    console.log(`${COLOR.ACCENT('TOTAL A PAGAR:')} ${COLOR.SUCCESS.bold(total.toFixed(2))} Bs`)
    console.log(COLOR.ACCENT('-----------------\n'))

    opcionesCarrito.push(
      { value: 'cuello', label: COLOR.INFO('  Calcular Cuello de Botella (CPU/GPU)') },
      { value: 'finalizar', label: COLOR.SUCCESS('  FINALIZAR COMPRA') },
      { value: 'volver', label: COLOR.WARNING(' ↩ Volver a la Tienda') }
    )

    const opcion = await p.select({
      message: COLOR.ACCENT(':: Opciones del Carrito ::'),
      options: opcionesCarrito
    })

    if (p.isCancel(opcion) || opcion === 'volver') return

    if (opcion === 'finalizar') {
      p.note(COLOR.SUCCESS.bgGreen(`¡COMPRA COMPLETADA con un total de ${total.toFixed(2)} Bs! Vuelve pronto.`))
      carrito = [] // Vaciar carrito
      await esperarContinuar()
      return
    }
    if (opcion === 'cuello') {
      await calcularCuelloBotella()
    } else if (!isNaN(parseInt(opcion))) {
      // Eliminar artículo
      const indice = parseInt(opcion)
      const eliminado = carrito.splice(indice, 1)
      p.note(COLOR.ERROR(`Artículo eliminado: ${eliminado[0].nombre}`))
    }
  }
}
// ----------------------------------------------------------------------------------

// Cálculo de cuello de botella
async function calcularCuelloBotella() {
  console.clear()
  p.intro(centerText(COLOR.INFO('---  CÁLCULO DE CUELLO DE BOTELLA ---')))

  const cpu = carrito.find(item => item.categoria === 'cpu')
  const gpu = carrito.find(item => item.categoria === 'gpu')

  if (!cpu || !gpu) {
    console.log(COLOR.WARNING('Necesitas tener una CPU y una GPU en el carrito para esta estimación.'))
    await esperarContinuar()
    return
  }

  const nivel_cpu = cpu.precio / 100
  const nivel_gpu = gpu.precio / 100

  const diferencia = Math.abs(nivel_cpu - nivel_gpu)
  let mensaje = ''

  if (diferencia < 5) {
    mensaje = COLOR.SUCCESS('¡Equilibrio excelente!') + ' La CPU y la GPU están bien emparejadas para una experiencia fluida.'
  } else if (nivel_cpu > nivel_gpu) {
    mensaje = COLOR.ERROR('Posible Cuello de Botella (GPU):') + ` El ${COLOR.MAIN(cpu.nombre)} (CPU) es más potente que el ${COLOR.MAIN(gpu.nombre)} (GPU). La GPU podría limitar el rendimiento.`
  } else {
    mensaje = COLOR.WARNING('Posible Cuello de Botella (CPU):') + ` El ${COLOR.MAIN(gpu.nombre)} (GPU) es más potente que el ${COLOR.MAIN(cpu.nombre)} (CPU). La CPU podría limitar el rendimiento.`
  }

  console.log(`CPU seleccionada: ${COLOR.ACCENT(cpu.nombre)}`)
  console.log(`GPU seleccionada: ${COLOR.ACCENT(gpu.nombre)}\n`)
  console.log(mensaje)
  await esperarContinuar()
}
// ----------------------------------------------------------------------------------

// Función para seleccionar productos de una categoría y agregar al carrito
async function comprarPorCategoria(categoria) {
  console.clear()
  p.intro(centerText(COLOR.CATEGORY(`--- COMPRAR ${categoria.toUpperCase()} ---`)))

  const inventario = cargarInventario()
  const productosFiltrados = inventario.filter(p => p.categoria.toLowerCase() === categoria && p.stock > 0)

  if (productosFiltrados.length === 0) {
    console.log(chalk.gray(`No hay productos de la categoría ${categoria.toUpperCase()} en stock.`))
    await esperarContinuar()
    return
  }

  const opciones = productosFiltrados.map((p, i) => ({
    value: i,
    label: `${p.nombre} - ${COLOR.WARNING(p.precio)} Bs (${COLOR.SUCCESS(p.stock)} uds en stock)`
  }))

  opciones.push({ value: 'regresar', label: COLOR.INFO(' ↩️ Regresar al menú de la Tienda') })

  const indiceSeleccionado = await p.select({
    message: COLOR.ACCENT(`:: Selecciona un ${categoria} ::`),
    options: opciones
  })

  if (p.isCancel(indiceSeleccionado) || indiceSeleccionado === 'regresar') return

  const productoSeleccionado = productosFiltrados[indiceSeleccionado]

  const cantidadRaw = await p.text({
    message: COLOR.ACCENT(`¿Cuántas unidades de ${productoSeleccionado.nombre} quieres? (Max: ${productoSeleccionado.stock})`),
    validate: (value) => {
      const num = parseInt(value)
      if (isNaN(num) || num <= 0) return COLOR.ERROR('Debe ser un número mayor a 0.')
      if (num > productoSeleccionado.stock) return COLOR.ERROR(`Máximo disponible: ${productoSeleccionado.stock}.`)
      return undefined
    }
  })

  if (p.isCancel(cantidadRaw)) return

  const cantidad = parseInt(cantidadRaw)

  // Agregar al carrito
  const indiceCarrito = carrito.findIndex(item => item.nombre === productoSeleccionado.nombre)
  if (indiceCarrito !== -1) {
    carrito[indiceCarrito].cantidad += cantidad
  } else {
    carrito.push({
      nombre: productoSeleccionado.nombre,
      categoria: productoSeleccionado.categoria.toLowerCase(),
      precio: productoSeleccionado.precio,
      cantidad: cantidad
    })
  }

  p.note(COLOR.SUCCESS(`${cantidad}x ${productoSeleccionado.nombre} añadido al carrito.`))
}
// ----------------------------------------------------------------------------------

// Agregar producto
async function agregarProducto() {
  console.clear()
  p.intro(centerText(COLOR.SUCCESS('--- AGREGAR NUEVO PRODUCTO ---')))

  const nombre = await p.text({ message: COLOR.ACCENT('Nombre del producto:') })
  if (p.isCancel(nombre) || !nombre) return

  const categoria = await p.select({
    message: COLOR.ACCENT('Categoría:'),
    options: CATEGORIAS_VALIDAS.map(c => ({ value: c, label: c.toUpperCase() }))
  })
  if (p.isCancel(categoria)) return

  const precioRaw = await p.text({
    message: COLOR.ACCENT('Precio (en Bs):'),
    validate: (value) => {
      const num = parseFloat(value)
      if (isNaN(num) || num <= 0) return COLOR.ERROR('Debe ser un número positivo.')
      return undefined
    }
  })
  if (p.isCancel(precioRaw)) return

  const stockRaw = await p.text({
    message: COLOR.ACCENT('Cantidad en stock:'),
    validate: (value) => {
      const num = parseInt(value)
      if (isNaN(num) || num < 0) return COLOR.ERROR('Debe ser un número entero no negativo.')
      return undefined
    }
  })
  if (p.isCancel(stockRaw)) return

  const inventario = cargarInventario()
  inventario.push({
    nombre: nombre,
    categoria: categoria,
    precio: parseFloat(precioRaw),
    stock: parseInt(stockRaw)
  })
  guardarInventario(inventario)

  p.note(COLOR.SUCCESS('Producto agregado correctamente.'))
}

// Eliminar producto
async function eliminarProducto() {
  console.clear()
  p.intro(centerText(COLOR.ERROR('--- ELIMINAR PRODUCTO ---')))
  const inventario = cargarInventario()
  if (inventario.length === 0) {
    p.note('No hay productos para eliminar.')
    return
  }

  const opciones = inventario.map((p, i) => ({
    value: i,
    label: `${p.nombre} (${p.categoria.toUpperCase()}) - ${p.stock} uds`
  }))

  const indice = await p.select({
    message: COLOR.ACCENT('Selecciona el producto a eliminar:'),
    options: opciones
  })
  if (p.isCancel(indice)) return

  const eliminado = inventario.splice(indice, 1)
  guardarInventario(inventario)
  p.note(COLOR.ERROR(`Producto eliminado: ${eliminado[0].nombre}`))
}


main()