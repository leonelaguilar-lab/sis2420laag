import fs from "fs";
import chalk from "chalk";
import readline from "readline";
//================== IN/OUTPUT ======================
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});
//=================== VARIABLES GLOBALES
let carrito = []; // variable global para el carrito
const INVENTARIO_PATH = "../../data/inventario.json"; //variable para llamar la ruta del inventario
// ================== INVENTARIO ==================
function cargarInventario() {
  const data = fs.readFileSync(INVENTARIO_PATH, "utf8");
  return JSON.parse(data);
}
function guardarInventario(data) {
  fs.writeFileSync(INVENTARIO_PATH, JSON.stringify(data, null, 2));
}
// ================== MENU PRINCIPAL ==================
function menu0() {
  console.clear();
  console.log(chalk.blue.bold("\n=== TIENDA DE PC COMPONENTES ===\n"));
  console.log(chalk.redBright("1. Catálogo de CPU"));
  console.log(chalk.redBright("2. Catálogo de GPU"));
  console.log(chalk.redBright("3. Catálogo de Almacenamiento"));
  console.log(chalk.redBright("4. Catálogo de RAM"));
  console.log(chalk.redBright("5. Catálogo de PSU"));
  console.log(chalk.redBright("6. Catálogo de Gabinetes"));
  console.log(chalk.redBright("7. Ver Carrito "));
  console.log(chalk.redBright("8. Ver todo "));
  console.log(chalk.cyanBright("0. Salir\n"));

  rl.question(chalk.yellow("Elige una opción: "), (opcion) => {
    switch (opcion) {
      case "1": verCat("cpu"); break;
      case "2": verCat("gpu"); break;
      case "3": verCat("almacenamiento"); break;
      case "4": verCat("ram"); break;
      case "5": verCat("psu"); break;
      case "6": verCat("case"); break;
      case "7": verCarrito(); break;
      case "8": verCat("all"); break;
      case "0": console.log(chalk.blue("\nSaliendo...")); rl.close(); break;
      default:
        console.log(chalk.red("\nOpción no valida!"));
        setTimeout(menu0, 1000);
    }
  });
}
// ================== FUNCION PARA VER CATÁLOGOS ==================
function verCat(categoria) {
  console.clear();
  const inventario = cargarInventario();
  console.log(chalk.blue.bold(`\n=== ${categoria.toUpperCase()} ===\n`));
  
  inventario[categoria].forEach((item) => {
    console.log(`${chalk.green(item.id)}. ${chalk.redBright(item.nombre)} - $${chalk.green(item.precio)} (Stock: ${chalk.gray(item.stock)})`);
  });

  console.log(chalk.cyan("\n0. Volver al menu"));
  rl.question(chalk.yellow("\nElige un ID para añadir al carrito: "), (id) => {
    if (id === "0") {
      return menu0();
    }

    const producto = inventario[categoria].find(p => p.id === parseInt(id));
    if (!producto) {
      console.log(chalk.red(" Producto no valido."));
      return setTimeout(() => verCat(categoria), 1000);
    }

    if (producto.stock == 0) {
      console.log(chalk.red(" Producto sin stock."));
      return setTimeout(() => verCat(categoria), 1000);
    }

    carrito.push({ ...producto, categoria }); // guardo tambien la categoria
    producto.stock -= 1;
    guardarInventario(inventario);

    console.log(chalk.green(` ${producto.nombre} añadido al carrito.`));
    setTimeout(menu0, 1000);
  });
}
// ================== CARRITO ==================
function verCarrito() {
  console.clear();
  console.log(chalk.blue.bold("\n=== CARRITO DE COMPRAS ===\n"));

  if (carrito.length === 0) {
    console.log(chalk.yellow("El carrito está vacio."));
    return rl.question(chalk.yellow("\nPresiona Enter para volver..."), () => menu0());
  }

  carrito.forEach((item, i) => {
    console.log(chalk.magenta.bold(`${i + 1}. ${item.nombre} - $${item.precio}`));
  });

  const total = carrito.reduce((sum, item) => sum + item.precio, 0);
  console.log(chalk.green.bold(`\nTotal: $${total}`));

  const cpu = carrito.find(i => i.categoria === "cpu");
  const gpu = carrito.find(i => i.categoria === "gpu");

  if (cpu && gpu) {
    const diff = Math.abs(cpu.rendimiento - gpu.rendimiento);
    const porcentaje = ((diff / Math.max(cpu.rendimiento, gpu.rendimiento)) * 100).toFixed(1);

    if (porcentaje < 20) {
      console.log(chalk.green(`\n Buena combinación (Cuello de botella: ${porcentaje}%)`));
    } else {
      console.log(chalk.yellow(`\n Posible cuello de botella: ${porcentaje}%`));
    }
  } else {
    console.log(chalk.red("\n Añade al menos una CPU y una GPU para medir el cuello de botella."));
  }

  console.log(chalk.cyan("\n0. Volver al menú"));
  console.log(chalk.red("E. Eliminar un producto"));
  console.log(chalk.green("F. Finalizar compra "));

  rl.question(chalk.yellow("\nElige una opción: "), (opcion) => {
    if (opcion === "0") return menu0();

    if (opcion.toUpperCase() === "E") {
      rl.question(chalk.yellow("Numero del producto a eliminar: "), (num) => {
        const index = parseInt(num) - 1;
        if (index >= 0 && index < carrito.length) {
          const eliminado = carrito.splice(index, 1)[0];

          const inventario = cargarInventario();
          const original = inventario[eliminado.categoria].find(p => p.id === eliminado.id);
          if (original) original.stock += 1;
          guardarInventario(inventario);  // devolver stock al inventario

          console.log(chalk.red(`${eliminado.nombre} eliminado del carrito.`));
        } else {
          console.log(chalk.red("Numero invalido."));
        }
        setTimeout(verCarrito, 1000);
      });
    } else if(opcion.toUpperCase() === "F")
            {
              console.log(chalk.greenBright("\nCompra finalizada. ¡Gracias por tu compra!"));
              carrito = [];
              setTimeout(menu0, 2000);
            }
      else {
      console.log(chalk.red("Opción invalida."));
      setTimeout(verCarrito, 1000);
    }
  });
}
menu0();
