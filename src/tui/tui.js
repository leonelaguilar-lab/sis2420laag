
import * as p from '@clack/prompts'
import chalk from 'chalk'
import { readFileSync, writeFileSync, existsSync } from 'fs'

const RUTA_INV = '../../data/invtui.json'

// Cargar inventario desde JSON
function cargarInventario() {
  if (!existsSync(RUTA_INV)) writeFileSync(RUTA_INV, '[]')
  return JSON.parse(readFileSync(RUTA_INV, 'utf8'))
}

// Guardar inventario en JSON
function guardarInventario(data) {
  writeFileSync(RUTA_INV, JSON.stringify(data, null, 2))
}

// Menú principal
async function main() {
  console.clear()
  p.intro(chalk.cyanBright(' TIENDA DE COMPONENTES DE PC'))

  while (true) {
    const opcion = await p.select({
      message: 'Selecciona una opción:',
      options: [
        { value: 'inv', label: ' Inventario' },
        { value: 'salir', label: ' Salir' }
      ]
    })

    if (p.isCancel(opcion) || opcion === 'salir') break
    if (opcion === 'inv') await menuInventario()
  }

  p.outro(chalk.green(' Hasta luego!'))
}

// Menú de inventario
async function menuInventario() {
  while (true) {
    console.clear()
    p.intro(chalk.yellow(' MÓDULO DE INVENTARIO'))

    const opcion = await p.select({
      message: 'Elige una acción:',
      options: [
        { value: 'ver', label: 'Ver productos' },
        { value: 'agregar', label: 'Agregar producto' },
        { value: 'eliminar', label: 'Eliminar producto' },
        { value: 'volver', label: 'Volver al menú principal' }
      ]
    })

    if (opcion === 'volver' || p.isCancel(opcion)) break

    switch (opcion) {
      case 'ver':
        mostrarProductos()
        await pausa()
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

// Mostrar productos
function mostrarProductos() {
  const inventario = cargarInventario()
  console.clear()
  p.intro(chalk.cyan(' LISTA DE PRODUCTOS'))
  if (inventario.length === 0) {
    console.log(chalk.gray('No hay productos registrados.'))
    return
  }

  inventario.forEach((p, i) => {
    console.log(`${chalk.green(i + 1)}. ${chalk.bold(p.nombre)} - ${p.categoria} - ${p.precio} Bs (${p.stock} uds)`)
  })
}

// Agregar producto
async function agregarProducto() {
  const nombre = await p.text({ message: 'Nombre del producto:' })
  if (p.isCancel(nombre)) return
  const categoria = await p.text({ message: 'Categoría:' })
  if (p.isCancel(categoria)) return
  const precio = await p.text({ message: 'Precio (en Bs):' })
  if (p.isCancel(precio)) return
  const stock = await p.text({ message: 'Cantidad en stock:' })
  if (p.isCancel(stock)) return

  const inventario = cargarInventario()
  inventario.push({
    nombre,
    categoria,
    precio: parseFloat(precio),
    stock: parseInt(stock)
  })
  guardarInventario(inventario)

  p.note(chalk.green('Producto agregado correctamente.'))
  await pausa()
}

// Eliminar producto
async function eliminarProducto() {
  const inventario = cargarInventario()
  if (inventario.length === 0) {
    p.note('No hay productos para eliminar.')
    await pausa()
    return
  }

  const opciones = inventario.map((p, i) => ({
    value: i,
    label: `${p.nombre} (${p.categoria})`
  }))

  const indice = await p.select({
    message: 'Selecciona el producto a eliminar:',
    options: opciones
  })
  if (p.isCancel(indice)) return

  const eliminado = inventario.splice(indice, 1)
  guardarInventario(inventario)
  p.note(chalk.red(`Producto eliminado: ${eliminado[0].nombre}`))
  await pausa()
}

// Pausa
async function pausa() {
  await p.confirm({ message: 'Presiona ENTER para continuar' })
}

main()
