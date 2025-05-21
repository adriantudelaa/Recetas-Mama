"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  Alert,
} from "react-native"
import { StatusBar } from "expo-status-bar"
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons"
import { collection, query, where, getDocs, doc, deleteDoc, setDoc } from "firebase/firestore"
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage"
import * as DocumentPicker from "expo-document-picker"
import * as FileSystem from "expo-file-system"
import { db, auth } from "../../firebaseConfig.js"
import Header from "../component/header.js"
import SidebarLayout from "../component/SidebarLayout.js"
import useOrientation from "../hooks/useOrientation.js"
import { useTheme } from "../context/ThemeContext.js"
import { useFocusEffect } from "@react-navigation/native"

// Componente principal de Recetas
export default function Recepies({ route, navigation }) {
  // Parámetros y estado
  const { category } = route.params || {}
  const [recipes, setRecipes] = useState([])
  const [filteredRecipes, setFilteredRecipes] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [currentCategory, setCurrentCategory] = useState(category || "")
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false)
  const [recipeToDelete, setRecipeToDelete] = useState(null)

  // Hooks
  const { colors, isDark } = useTheme()
  const { isTablet, isLandscape, getGridColumns, getItemWidth, translateCategory } = useOrientation()

  // Categorías disponibles
  const categories = useMemo(
    () => [
      { id: "all", name: "Todas", icon: "apps" },
      { id: "favorites", name: "Favoritos", icon: "favorite" },
      { id: "breakfast", name: "Desayuno", icon: "free-breakfast" },
      { id: "lunch", name: "Comida", icon: "restaurant" },
      { id: "snack", name: "Merienda", icon: "local-cafe" },
      { id: "dinner", name: "Cena", icon: "dinner-dining" },
    ],
    [],
  )

  // Cargar recetas cuando la pantalla obtiene el foco
  useFocusEffect(
    useCallback(() => {
      fetchRecipes()
      return () => {}
    }, [currentCategory]),
  )

  // Filtrar recetas cuando cambia el término de búsqueda
  useEffect(() => {
    if (!recipes.length) return

    if (!searchTerm.trim()) {
      setFilteredRecipes(recipes)
      return
    }

    const searchTermLower = searchTerm.toLowerCase().trim()
    const filtered = recipes.filter((recipe) => {
      const nameMatch = recipe.nombre?.toLowerCase().includes(searchTermLower)
      const ingredientMatch = recipe.ingredientes?.some(
        (ingredient) => typeof ingredient === "string" && ingredient.toLowerCase().includes(searchTermLower),
      )
      return nameMatch || ingredientMatch
    })

    setFilteredRecipes(filtered)
  }, [searchTerm, recipes])

  // Función para obtener recetas de Firestore
  const fetchRecipes = async () => {
    try {
      setIsLoading(true)
      const userId = auth.currentUser?.uid

      if (!userId) {
        setRecipes([])
        setFilteredRecipes([])
        setIsLoading(false)
        return
      }

      const recetasRef = collection(db, `users/${userId}/recetas`)
      let q = recetasRef

      // Aplicar filtros según la categoría seleccionada
      if (currentCategory === "favorites") {
        q = query(recetasRef, where("fav", "==", true))
      } else if (currentCategory && currentCategory !== "all") {
        q = query(recetasRef, where("categoria", "array-contains", currentCategory))
      }

      const querySnapshot = await getDocs(q)
      const recipesData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))

      setRecipes(recipesData)
      setFilteredRecipes(recipesData)
    } catch (error) {
      console.error("Error al cargar recetas:", error)
      Alert.alert("Error", "No se pudieron cargar las recetas")
    } finally {
      setIsLoading(false)
    }
  }

  // Cambiar categoría seleccionada
  const handleCategoryChange = (categoryId) => {
    setSearchTerm("")
    const selected = categoryId === "all" ? "" : categoryId
    setCurrentCategory(selected)
  }

  // Marcar/desmarcar receta como favorita
  const handleToggleFavorite = async (recipeId, currentFavStatus) => {
    try {
      const userId = auth.currentUser?.uid
      if (!userId) return

      const recipeRef = doc(db, `users/${userId}/recetas`, recipeId)
      const newFavStatus = !currentFavStatus

      await setDoc(recipeRef, { fav: newFavStatus }, { merge: true })

      // Actualizar estado local
      setRecipes((prev) => prev.map((recipe) => (recipe.id === recipeId ? { ...recipe, fav: newFavStatus } : recipe)))
    } catch (error) {
      console.error("Error al actualizar favorito:", error)
      Alert.alert("Error", "No se pudo actualizar el estado de favorito")
    }
  }

  // Eliminar receta
  const handleDeleteRecipe = async (recipeId) => {
    try {
      const userId = auth.currentUser?.uid
      if (!userId) return

      const recipeRef = doc(db, `users/${userId}/recetas`, recipeId)
      await deleteDoc(recipeRef)

      // Actualizar estado local
      setRecipes((prev) => prev.filter((recipe) => recipe.id !== recipeId))
      setFilteredRecipes((prev) => prev.filter((recipe) => recipe.id !== recipeId))

      Alert.alert("Éxito", "Receta eliminada correctamente")
    } catch (error) {
      console.error("Error al eliminar receta:", error)
      Alert.alert("Error", "No se pudo eliminar la receta")
    }
  }

  // Importar recetas desde JSON
  const handleImportRecipes = async () => {
  try {
    setIsUploading(true);

    const result = await DocumentPicker.getDocumentAsync({
      type: "application/json",
    });

    if (result.canceled) {
      setIsUploading(false);
      return;
    }

    const fileUri = result.assets[0].uri;
    const fileContent = await FileSystem.readAsStringAsync(fileUri);
    const jsonData = JSON.parse(fileContent);

    if (!jsonData.recetas || !Array.isArray(jsonData.recetas) || jsonData.recetas.length === 0) {
      Alert.alert("Error", "El archivo JSON está vacío o mal formateado");
      setIsUploading(false);
      return;
    }

    const userId = auth.currentUser?.uid;
    if (!userId) {
      Alert.alert("Error", "No hay un usuario autenticado");
      setIsUploading(false);
      return;
    }

    const storage = getStorage();
    let successCount = 0;

    for (const recipeData of jsonData.recetas) {
      try {
        const { nombre, categoria, fav, ingredientes, instrucciones, imagen } = recipeData;

        if (!nombre || !ingredientes || !instrucciones) {
          console.warn(`Receta omitida por datos incompletos: ${JSON.stringify(recipeData)}`);
          continue;
        }

        // Subir imagen si está en base64
        let imageUrl = null;
        if (imagen && imagen.startsWith("data:image/")) {
          try {
            const response = await fetch(imagen);
            const blob = await response.blob();
            const ext = imagen.substring(imagen.indexOf("/") + 1, imagen.indexOf(";")); // ej: "jpeg", "png"
            const safeName = nombre.replace(/[^\w\s]/gi, "_"); // limpiar caracteres peligrosos
            const imageRef = ref(storage, `users/${userId}/recetas/${safeName}.${ext}`);
            await uploadBytes(imageRef, blob);
            imageUrl = await getDownloadURL(imageRef);
          } catch (imgError) {
            console.error(`Error al subir imagen para ${nombre}:`, imgError);
          }
        }

        // Guardar receta en Firestore
        await setDoc(doc(db, `users/${userId}/recetas`, nombre), {
          nombre,
          categoria: Array.isArray(categoria) ? categoria : [categoria],
          fav: Boolean(fav),
          ingredientes,
          instrucciones,
          imagen: imageUrl,
          createdAt: new Date(),
        });

        successCount++;
      } catch (recipeError) {
        console.error(`Error al guardar receta ${recipeData.nombre}:`, recipeError);
      }
    }

    Alert.alert("Éxito", `Se han importado ${successCount} recetas correctamente`);
    fetchRecipes();
  } catch (error) {
    console.error("Error en la importación:", error);
    Alert.alert("Error", "No se pudieron importar las recetas");
  } finally {
    setIsUploading(false);
  }
};


  // Obtener título según la categoría seleccionada
  const getCategoryTitle = () => {
    const category = categories.find((c) => c.id === currentCategory) || categories[0]
    return currentCategory === "favorites"
      ? "Recetas Favoritas"
      : currentCategory
        ? translateCategory(currentCategory)
        : "Todas las Recetas"
  }

  // Renderizar tarjeta de receta
  const renderRecipeCard = ({ item, index }) => {
    const numColumns = getGridColumns()
    const cardWidth = getItemWidth(10, 20)

    return (
      <View
        style={[
          styles.recipeCardContainer,
          {
            width: cardWidth,
            marginRight: (index + 1) % numColumns !== 0 ? 10 : 0,
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.recipeCard, { backgroundColor: colors.CARD }]}
          activeOpacity={0.8}
          onPress={() =>
            navigation.navigate("Recetas", {
              recipe: item,
              // No necesitamos pasar category ni fetchRecipes ya que hemos modificado Recetas.js para no depender de ellos
            })
          }
        >
          {/* Imagen de la receta */}
          <View style={styles.recipeImageContainer}>
            <Image
              source={{ uri: item.imagen || "https://via.placeholder.com/300" }}
              style={styles.recipeImage}
              resizeMode="cover"
            />

            {/* Botón de favorito */}
            <TouchableOpacity
              style={[styles.favoriteButton, { backgroundColor: colors.CARD }]}
              onPress={() => handleToggleFavorite(item.id, item.fav)}
            >
              <Ionicons
                name={item.fav ? "heart" : "heart-outline"}
                size={22}
                color={item.fav ? colors.RED : colors.TEXTSECONDARY}
              />
            </TouchableOpacity>
          </View>

          {/* Información de la receta */}
          <View style={styles.recipeInfo}>
            <Text style={[styles.recipeTitle, { color: colors.TEXT }]} numberOfLines={1}>
              {item.nombre}
            </Text>

            {/* Categorías */}
            {item.categoria && item.categoria.length > 0 && (
              <View style={styles.categoriesContainer}>
                {item.categoria.slice(0, 2).map((cat, idx) => (
                  <View key={idx} style={[styles.categoryBadge, { backgroundColor: colors.LIGHTGRAY }]}>
                    <Text style={[styles.categoryText, { color: colors.TEXTSECONDARY }]}>{translateCategory(cat)}</Text>
                  </View>
                ))}
                {item.categoria.length > 2 && (
                  <View style={[styles.categoryBadge, { backgroundColor: colors.LIGHTGRAY }]}>
                    <Text style={[styles.categoryText, { color: colors.TEXTSECONDARY }]}>
                      +{item.categoria.length - 2}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Botones de acción */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.PRIMARYCOLOR }]}
                onPress={() => navigation.navigate("Edit", { recipeId: item.id })}
              >
                <MaterialIcons name="edit" size={16} color="white" />
                <Text style={styles.actionButtonText}>Editar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.RED }]}
                onPress={() => {
                  setRecipeToDelete(item.id)
                  setConfirmDeleteVisible(true)
                }}
              >
                <MaterialIcons name="delete" size={16} color="white" />
                <Text style={styles.actionButtonText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    )
  }

  // Renderizar mensaje de lista vacía
  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="food-off" size={80} color={colors.TEXTSECONDARY} />
      <Text style={[styles.emptyTitle, { color: colors.TEXT }]}>No se encontraron recetas</Text>
      <Text style={[styles.emptySubtitle, { color: colors.TEXTSECONDARY }]}>
        {searchTerm ? "Intenta con otra búsqueda o categoría" : "Añade tu primera receta con el botón '+'"}
      </Text>
    </View>
  )

  // Renderizar categorías horizontales
  const renderCategoryFilters = () => (
    <View style={styles.categoryFiltersContainer}>
      <FlatList
        horizontal
        data={categories}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryFiltersList}
        renderItem={({ item }) => {
          const isSelected = (item.id === "all" && !currentCategory) || item.id === currentCategory

          return (
            <TouchableOpacity
              style={[
                styles.categoryFilterItem,
                { backgroundColor: colors.CARD },
                isSelected && { backgroundColor: colors.PRIMARYCOLOR },
              ]}
              onPress={() => handleCategoryChange(item.id)}
              activeOpacity={0.7}
            >
              <MaterialIcons
                name={item.icon}
                size={22}
                color={isSelected ? "white" : colors.PRIMARYCOLOR}
                style={styles.categoryIcon}
              />
              <Text style={[styles.categoryFilterText, { color: isSelected ? "white" : colors.TEXT }]}>
                {translateCategory(item.id)}
              </Text>
            </TouchableOpacity>
          )
        }}
      />
    </View>
  )

  // Componente principal
  return (
    <SidebarLayout
      title="Recetas Mamá"
      navigation={navigation}
      showBackButton={true}
      rightIcon="cloud-upload-outline"
      onRightIconPress={handleImportRecipes}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      categories={categories}
      currentCategory={currentCategory}
      onCategorySelect={handleCategoryChange}
      showSearch={true}
      showCategories={true}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.WHITEBACKGROUND }]}>
        <StatusBar style={isDark ? "light" : "light"} />

        {/* Header */}
        <Header
          name="Recetas Mamá"
          navigation={navigation}
          showBackButton={true}
          rightIcon="cloud-upload-outline"
          onRightIconPress={handleImportRecipes}
        />

        {/* Contenido principal */}
        <View style={styles.content}>
          {/* Buscador (solo en modo portrait) */}
          {!isLandscape && (
            <View style={styles.searchContainer}>
              <View style={[styles.searchInputWrapper, { backgroundColor: colors.CARD }]}>
                <Ionicons name="search" size={22} color={colors.TEXTSECONDARY} style={styles.searchIcon} />
                <TextInput
                  style={[styles.searchInput, { color: colors.TEXT }]}
                  placeholder="Buscar recetas o ingredientes..."
                  placeholderTextColor={colors.TEXTSECONDARY}
                  value={searchTerm}
                  onChangeText={setSearchTerm}
                />
                {searchTerm.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchTerm("")}>
                    <Ionicons name="close-circle" size={22} color={colors.TEXTSECONDARY} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* Filtros de categoría (solo en modo portrait) */}
          {!isLandscape && renderCategoryFilters()}

          {/* Encabezado de sección */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.TEXT }]}>{getCategoryTitle()}</Text>

            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colors.PRIMARYCOLOR }]}
              onPress={() => navigation.navigate("Add")}
            >
              <Ionicons name="add" size={22} color="white" />
              <Text style={styles.addButtonText}>Nueva</Text>
            </TouchableOpacity>
          </View>

          {/* Lista de recetas */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.PRIMARYCOLOR} />
              <Text style={[styles.loadingText, { color: colors.TEXTSECONDARY }]}>Cargando recetas...</Text>
            </View>
          ) : (
            <FlatList
              data={filteredRecipes}
              renderItem={renderRecipeCard}
              keyExtractor={(item) => item.id}
              numColumns={getGridColumns()}
              key={`grid-${getGridColumns()}`}
              contentContainerStyle={styles.recipesList}
              ListEmptyComponent={renderEmptyList}
              showsVerticalScrollIndicator={false}
              initialNumToRender={8}
              maxToRenderPerBatch={10}
              windowSize={10}
              removeClippedSubviews={true}
            />
          )}
        </View>

        {/* Modal de confirmación de eliminación */}
        {confirmDeleteVisible && (
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContainer, { backgroundColor: colors.CARD }]}>
              <Text style={[styles.modalTitle, { color: colors.TEXT }]}>¿Eliminar receta?</Text>
              <Text style={[styles.modalMessage, { color: colors.TEXTSECONDARY }]}>
                Esta acción no se puede deshacer.
              </Text>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.LIGHTGRAY }]}
                  onPress={() => {
                    setConfirmDeleteVisible(false)
                    setRecipeToDelete(null)
                  }}
                >
                  <Text style={[styles.modalButtonText, { color: colors.TEXT }]}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.RED }]}
                  onPress={() => {
                    handleDeleteRecipe(recipeToDelete)
                    setConfirmDeleteVisible(false)
                    setRecipeToDelete(null)
                  }}
                >
                  <Text style={[styles.modalButtonText, { color: "white" }]}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Indicador de carga durante la importación */}
        {isUploading && (
          <View style={styles.uploadingOverlay}>
            <View style={[styles.uploadingContainer, { backgroundColor: colors.CARD }]}>
              <ActivityIndicator size="large" color={colors.PRIMARYCOLOR} />
              <Text style={[styles.uploadingText, { color: colors.TEXT }]}>Importando recetas...</Text>
            </View>
          </View>
        )}
      </SafeAreaView>
    </SidebarLayout>
  )
}

// Estilos
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingBottom: 20,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 50,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontFamily: "Poppins_400Regular",
    fontSize: 16,
  },
  categoryFiltersContainer: {
    marginVertical: 8,
  },
  categoryFiltersList: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  categoryFilterItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    marginRight: 10,
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  categoryIcon: {
    marginRight: 8,
  },
  categoryFilterText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontFamily: "Poppins_700Bold",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  addButtonText: {
    color: "white",
    fontFamily: "Poppins_500Medium",
    fontSize: 15,
    marginLeft: 5,
  },
  recipesList: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  recipeCardContainer: {
    marginBottom: 16,
  },
  recipeCard: {
    borderRadius: 16,
    overflow: "hidden",
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  recipeImageContainer: {
    position: "relative",
    height: 160,
  },
  recipeImage: {
    width: "100%",
    height: "100%",
  },
  favoriteButton: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  recipeInfo: {
    padding: 12,
  },
  recipeTitle: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    marginBottom: 8,
  },
  categoriesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 6,
  },
  categoryText: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 3,
  },
  actionButtonText: {
    color: "white",
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    marginLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontFamily: "Poppins_500Medium",
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: "Poppins_600SemiBold",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 16,
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modalContainer: {
    width: "80%",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    elevation: 5,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: "Poppins_600SemiBold",
    marginBottom: 10,
    textAlign: "center",
  },
  modalMessage: {
    fontSize: 16,
    fontFamily: "Poppins_400Regular",
    marginBottom: 20,
    textAlign: "center",
  },
  modalButtons: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginHorizontal: 6,
  },
  modalButtonText: {
    fontSize: 16,
    fontFamily: "Poppins_500Medium",
  },
  uploadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  uploadingContainer: {
    width: "80%",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    elevation: 5,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  uploadingText: {
    fontSize: 18,
    fontFamily: "Poppins_500Medium",
    marginTop: 16,
    textAlign: "center",
  },
})
