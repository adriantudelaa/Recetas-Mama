class Recetas {
  constructor(name, imageUri, ingredients, steps) {
    this.name = name
    this.imageUri = imageUri // Store the image URI instead of the raw image data
    this.ingredients = ingredients || [] // Initialize as an empty array if not provided
    this.steps = steps || [] // Initialize as an empty array if not provided
  }
}

export default Recetas
