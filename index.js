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

function menu0() {
  console.clear();
  console.log(chalk.blue.bold("\n=== TIENDA DE PC COMPONENTES ===\n"));
  console.log(chalk.magenta("1.") + " Catálogo de CPU");
  console.log(chalk.magenta("2.") + " Catálogo de GPU");
  console.log(chalk.magenta("3.") + " Catálogo de Almacenamiento");
  console.log(chalk.magenta("4.") + " Catálogo de RAM");
  console.log(chalk.magenta("5.") + " Catálogo de PSU");
  console.log(chalk.magenta("6.") + " Catálogo de Gabinetes");
  console.log(chalk.red("0.") + " Salir\n");

  rl.question(chalk.yellow("Elige una opción: "), (opcion) => {
    switch (opcion) {
      case "1": verCat("cpu"); 
                break;
      case "2": verCat("gpu"); 
                break;
      case "3": verCat("almacenamiento"); 
                break;
      case "4": verCat("ram"); 
                break;
      case "5": verCat("psu"); 
                break;
      case "6": verCat("case"); 
                break;
      case "0": console.log(chalk.blue("\nSaliendo...")); rl.close(); 
                break;
      default:
        console.log(chalk.red("\nOpción no válida!"));
        setTimeout(menu0, 1000);
    }
  });
}

function verCat(categoria) {
  console.clear();
  const inventario = cargarInventario();
  console.log(chalk.magenta.bold(`\n=== ${categoria.toUpperCase()} ===\n`));
  
  inventario[categoria].forEach((item) => {
  console.log(`${chalk.green(item.id)}. ${item.nombre} - $${item.precio} (Stock: ${item.stock})`);
    });

  rl.question(chalk.yellow("\nPresiona Enter para volver..."), () => {
    menu0();
  });
}


menu0();
