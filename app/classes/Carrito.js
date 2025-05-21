import Recetas from "./ClassRecetas"

class Carrito {
  constructor() {
    this.list = Recetas.getIngredients()
  }

  getIngredients() {
    return this.list
  }
}
return Carrito;
