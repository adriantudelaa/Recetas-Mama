import { db, auth } from "../../firebaseConfig.js"
import { collection, query, where, onSnapshot } from "firebase/firestore"

const fetchRecipes = (setRecipes, category) => {
  try {
    const userId = auth.currentUser?.uid
    if (!userId) {
      // Si no hay usuario autenticado, establecer recetas como array vacío y no crear listener
      setRecipes([])
      return () => {}
    }

    const recetasRef = collection(db, `users/${userId}/recetas`)
    let q = recetasRef

    if (category === "favorites") {
      q = query(recetasRef, where("fav", "==", true))
    } else if (category) {
      q = query(recetasRef, where("categoria", "array-contains", category))
    }

    // Suscribirse a cambios en Firestore en tiempo real
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const recipesData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        setRecipes(recipesData)
      },
      (error) => {
        // Solo mostrar el error si el usuario está autenticado
        if (auth.currentUser) {
          console.error("Error al obtener recetas:", error)
        }
      },
    )

    // Devolver la función de limpieza para cancelar la suscripción
    return unsubscribe
  } catch (error) {
    console.error("Error en fetchRecipes:", error)
    return () => {}
  }
}

export default fetchRecipes
