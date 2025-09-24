import fs from "fs";
import chalk from "chalk";
import readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function cargarInventario() {
  const data = fs.readFileSync("inventario.json", "utf8");
  return JSON.parse(data);
}

function guardarInventario(inventario) {
  fs.writeFileSync("inventario.json", JSON.stringify(inventario, null, 2));
}

function menu0() {
  console.clear();
  console.log(chalk.cyan.bold("\n=== GESTOR DE INVENTARIO DE LA TIENDA ===\n"));
  console.log(chalk.green("1.") + " Agregar Producto");
  console.log(chalk.green("2.") + " Quitar Producto");
  console.log(chalk.red("0.") + " Salir\n");

  rl.question(chalk.yellow("Elige una opción: "), (opcion) => {
    switch (opcion) {
      case "1": menu1(); break;
      case "2": menu2(); break;
      case "0": console.log(chalk.blue("\nSaliendo...")); rl.close(); break;
      default:
        console.log(chalk.red("\nOpción no válida!"));
        setTimeout(mostrarMenuPrincipal, 1000);
    }
  });
}

function menu1(){
  console.clear();
  console.log(chalk.cyan.bold("\n=== CATEGORIAS DE PRODUCTOS ===\n"));
  console.log(chalk.green("1.") + " CPU");
  console.log(chalk.green("2.") + " GPU");
  console.log(chalk.green("3.") + " RAM");
  console.log(chalk.green("4.") + " Almacenamiento");
  console.log(chalk.green("5.") + " PSU");
  console.log(chalk.green("6.") + " Gabinetes");
  console.log(chalk.green("0.") + " Volver\n");

  rl.question(chalk.yellow("Elige la categoria del producto nuevo: "), (opcion) => {
    switch(opcion){
        case "1": agregarProducto("cpu"); break;
        case "2": agregarProducto("gpu"); break;
        case "3": agregarProducto("ram"); break;
        case "4": agregarProducto("almacenamiento"); break;
        case "5": agregarProducto("psu"); break;
        case "6": agregarProducto("case"); break;
        case "0": menu0(); break;
        
    }

  });

}

function agregarProducto(categoria) {
  const inventario = cargarInventario();

  rl.question("Nombre del producto: ", (nombre) => {
    rl.question("Precio: ", (precio) => {
      rl.question("Stock: ", (stock) => {
        rl.question("Rendimiento: ", (rendimiento) =>{
        const nuevo = {
          id: inventario[categoria].length + 1,
          nombre,
          precio: Number(precio),
          stock: Number(stock),
          rendimiento,
        };

        inventario[categoria].push(nuevo);
        guardarInventario(inventario);

        console.log(chalk.green("\nProducto agregado con éxito!"));
        setTimeout(menu1, 1500);
        });
      });
    });
  });
}

function menu2(){
  console.clear();
  console.log(chalk.cyan.bold("\n=== CATEGORIAS DE PRODUCTOS ===\n"));
  console.log(chalk.green("1.") + " CPU");
  console.log(chalk.green("2.") + " GPU");
  console.log(chalk.green("3.") + " RAM");
  console.log(chalk.green("4.") + " Almacenamiento");
  console.log(chalk.green("5.") + " PSU");
  console.log(chalk.green("6.") + " Gabinetes");
  console.log(chalk.green("0.") + " Volver\n");

  rl.question(chalk.yellow("Elige la categoria del producto a quitar: "), (opcion) => {
    switch(opcion){
        case "1": quitarProducto("cpu"); break;
        case "2": quitarProducto("gpu"); break;
        case "3": quitarProducto("ram"); break;
        case "4": quitarProducto("almacenamiento"); break;
        case "5": quitarProducto("psu"); break;
        case "6": quitarProducto("case"); break;
        case "0": menu0(); break;
        
    }

  });

}
function quitarProducto(categoria) {
  console.clear();
  const inventario = cargarInventario();

  console.log(chalk.red.bold(`\n=== ELIMINAR ${categoria.toUpperCase()} ===\n`));

  if (inventario[categoria].length === 0) {
    console.log(chalk.red("No hay productos en esta categoría."));
    rl.question(chalk.yellow("\nPresiona Enter para volver..."), () => {
      menu2();
    });
    return;
  }

  inventario[categoria].forEach((item) => {
    console.log(`${chalk.green(item.id)}. ${item.nombre} - $${item.precio} (Stock: ${item.stock})`);
  });

  rl.question(chalk.yellow("\nEscribe el ID del producto a eliminar: "), (id) => {
    const idNum = Number(id);
    const index = inventario[categoria].findIndex((item) => item.id === idNum);

    if (index === -1) {
      console.log(chalk.red("\n No existe un producto con ese ID."));
    } else {
      const eliminado = inventario[categoria].splice(index, 1)[0]; 
      guardarInventario(inventario);
      console.log(chalk.green(`\n Producto "${eliminado.nombre}" eliminado con éxito.`));
    }

    rl.question(chalk.yellow("\nPresiona Enter para volver..."), () => {
      menu2();
    });
  });
}
menu0();
