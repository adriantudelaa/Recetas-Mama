"use client"

import { useState, useEffect, useRef } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from "react-native"
import { StatusBar } from "expo-status-bar"
import { Ionicons, MaterialIcons } from "@expo/vector-icons"
import * as ImagePicker from "expo-image-picker"
import { doc, getDoc, updateDoc } from "firebase/firestore"
// Añadir la importación de deleteObject para eliminar archivos de Storage
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"
import { db, auth } from "../../firebaseConfig.js"
import Header from "../component/header"
import SidebarLayout from "../component/SidebarLayout"
import useOrientation from "../hooks/useOrientation"
import { useTheme } from "../context/ThemeContext"

export default function EditRecipe({ route, navigation }) {
  // Obtener el ID de la receta de los parámetros
  const { recipeId } = route.params

  // Estados para los datos de la receta
  const [recipeName, setRecipeName] = useState("")
  const [selectedImage, setSelectedImage] = useState(null)
  const [originalImageUrl, setOriginalImageUrl] = useState(null)
  const [categories, setCategories] = useState([])
  const [ingredients, setIngredients] = useState([])
  const [instructions, setInstructions] = useState([])
  const [notes, setNotes] = useState("")
  const [isFavorite, setIsFavorite] = useState(false)

  // Estados para los inputs temporales
  const [newIngredient, setNewIngredient] = useState("")
  const [newInstruction, setNewInstruction] = useState("")

  // Estados para el proceso de carga y guardado
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [imageChanged, setImageChanged] = useState(false)

  // Referencias para los inputs
  const ingredientInputRef = useRef(null)
  const instructionInputRef = useRef(null)

  // Hooks
  const { colors, isDark } = useTheme()
  const { isTablet, isLandscape } = useOrientation()

  // Categorías disponibles
  const availableCategories = [
    { id: "breakfast", name: "Desayuno", icon: "free-breakfast" },
    { id: "lunch", name: "Comida", icon: "restaurant" },
    { id: "dinner", name: "Cena", icon: "dinner-dining" },
    { id: "snack", name: "Merienda", icon: "local-cafe" },
  ]

  // Cargar datos de la receta
  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        setIsLoading(true)

        const userId = auth.currentUser?.uid
        if (!userId) {
          Alert.alert("Error", "No hay un usuario autenticado")
          navigation.goBack()
          return
        }

        const recipeRef = doc(db, `users/${userId}/recetas`, recipeId)
        const recipeSnap = await getDoc(recipeRef)

        if (!recipeSnap.exists()) {
          Alert.alert("Error", "No se encontró la receta")
          navigation.goBack()
          return
        }

        const recipeData = recipeSnap.data()

        // Establecer los datos en el estado
        setRecipeName(recipeData.nombre || "")
        setOriginalImageUrl(recipeData.imagen || null)
        setSelectedImage(recipeData.imagen || null)
        setCategories(recipeData.categoria || [])
        setIngredients(recipeData.ingredientes || [])
        setInstructions(recipeData.instrucciones || [])
        setNotes(recipeData.notas || "")
        setIsFavorite(recipeData.fav || false)
      } catch (error) {
        console.error("Error al cargar receta:", error)
        Alert.alert("Error", "No se pudo cargar la receta")
        navigation.goBack()
      } finally {
        setIsLoading(false)
      }
    }

    fetchRecipe()
  }, [recipeId])

  // Función para seleccionar imagen
  const handleSelectImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()

      if (status !== "granted") {
        Alert.alert("Permiso denegado", "Necesitamos permiso para acceder a tu galería de imágenes")
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      })

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0].uri)
        setImageChanged(true)
      }
    } catch (error) {
      console.error("Error al seleccionar imagen:", error)
      Alert.alert("Error", "No se pudo seleccionar la imagen")
    }
  }

  // Modificar la función que maneja la eliminación de imágenes
  const handleRemoveImage = async () => {
    try {
      // Si hay una imagen original en Storage, intentar eliminarla
      if (originalImageUrl && originalImageUrl.includes("firebasestorage")) {
        const storage = getStorage()

        // Extraer la ruta del archivo de la URL
        // Las URLs de Firebase Storage tienen un formato como:
        // https://firebasestorage.googleapis.com/v0/b/BUCKET_NAME/o/ENCODED_FILE_PATH?token=TOKEN
        const filePathStart = originalImageUrl.indexOf("/o/") + 3
        const filePathEnd = originalImageUrl.indexOf("?", filePathStart)

        if (filePathStart > 2 && filePathEnd > filePathStart) {
          const encodedFilePath = originalImageUrl.substring(filePathStart, filePathEnd)
          const filePath = decodeURIComponent(encodedFilePath)

          try {
            const imageRef = ref(storage, filePath)
            await deleteObject(imageRef)
            console.log("Imagen eliminada de Storage correctamente")
          } catch (deleteError) {
            // Si la imagen no existe o hay otro error, lo ignoramos y continuamos
            console.log("No se pudo eliminar la imagen de Storage, posiblemente ya no existe:", deleteError.message)
            // No lanzamos el error para evitar que crashee la app
          }
        }
      }

      // Actualizar el estado para reflejar que la imagen ha sido eliminada
      setSelectedImage(null)
      setImageChanged(true)
    } catch (error) {
      console.error("Error general al eliminar la imagen:", error)
      // Aún así, actualizamos el estado para que la UI refleje que la imagen fue eliminada
      setSelectedImage(null)
      setImageChanged(true)
    }
  }

  // Función para alternar categoría
  const toggleCategory = (categoryId) => {
    setCategories((prev) => {
      if (prev.includes(categoryId)) {
        return prev.filter((id) => id !== categoryId)
      } else {
        return [...prev, categoryId]
      }
    })
  }

  // Función para añadir ingrediente
  const addIngredient = () => {
    if (newIngredient.trim()) {
      setIngredients((prev) => [...prev, newIngredient.trim()])
      setNewIngredient("")
      ingredientInputRef.current?.focus()
    }
  }

  // Función para eliminar ingrediente
  const removeIngredient = (index) => {
    setIngredients((prev) => prev.filter((_, i) => i !== index))
  }

  // Función para añadir instrucción
  const addInstruction = () => {
    if (newInstruction.trim()) {
      setInstructions((prev) => [...prev, newInstruction.trim()])
      setNewInstruction("")
      instructionInputRef.current?.focus()
    }
  }

  // Función para eliminar instrucción
  const removeInstruction = (index) => {
    setInstructions((prev) => prev.filter((_, i) => i !== index))
  }

  // Función para alternar favorito
  const toggleFavorite = () => {
    setIsFavorite((prev) => !prev)
  }

  // Función para guardar la receta
  const saveRecipe = async () => {
    // Validación básica
    if (!recipeName.trim()) {
      Alert.alert("Error", "Por favor, introduce un nombre para la receta")
      return
    }

    if (ingredients.length === 0) {
      Alert.alert("Error", "Por favor, añade al menos un ingrediente")
      return
    }

    if (instructions.length === 0) {
      Alert.alert("Error", "Por favor, añade al menos una instrucción")
      return
    }

    try {
      setIsSaving(true)

      const userId = auth.currentUser?.uid
      if (!userId) {
        Alert.alert("Error", "No hay un usuario autenticado")
        setIsSaving(false)
        return
      }

      // Subir imagen si ha cambiado
      let imageUrl = originalImageUrl
      if (imageChanged) {
        if (selectedImage) {
          try {
            const storage = getStorage()
            // Crear una referencia única para la imagen usando timestamp y nombre de receta
            const imageFileName = `${Date.now()}_${recipeName.replace(/\s+/g, "_")}.jpg`
            const imageRef = ref(storage, `users/${userId}/recetas/${imageFileName}`)

            // Si la imagen es una URL de Firebase, no necesitamos subirla de nuevo
            if (!selectedImage.startsWith("http")) {
              // Convertir la URI de la imagen a un blob
              const response = await fetch(selectedImage)
              const blob = await response.blob()

              // Subir el blob a Firebase Storage
              await uploadBytes(imageRef, blob)
              console.log("Imagen subida correctamente a Firebase Storage")
            }

            // Obtener la URL de descarga de la imagen
            imageUrl = await getDownloadURL(imageRef)
            console.log("URL de imagen obtenida:", imageUrl)
          } catch (imageError) {
            console.error("Error al subir la imagen:", imageError)
            Alert.alert("Advertencia", "No se pudo actualizar la imagen, se mantendrá la imagen anterior")
            imageUrl = originalImageUrl
          }
        } else {
          // Si se eliminó la imagen, establecer imageUrl a null
          imageUrl = null
        }
      }

      // Crear objeto de receta actualizado
      const updatedRecipeData = {
        nombre: recipeName.trim(),
        categoria: categories,
        ingredientes: ingredients,
        instrucciones: instructions,
        notas: notes.trim(),
        imagen: imageUrl,
        fav: isFavorite,
        updatedAt: new Date(),
      }

      // Actualizar en Firestore
      const recipeRef = doc(db, `users/${userId}/recetas`, recipeId)
      await updateDoc(recipeRef, updatedRecipeData)

      Alert.alert("Éxito", "Receta actualizada correctamente", [{ text: "OK", onPress: () => navigation.goBack() }])
    } catch (error) {
      console.error("Error al actualizar receta:", error)
      Alert.alert("Error", "No se pudo actualizar la receta")
    } finally {
      setIsSaving(false)
    }
  }

  // Mostrar indicador de carga mientras se cargan los datos
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.WHITEBACKGROUND }]}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <Header name="Editar Receta" navigation={navigation} showBackButton={true} />

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.PRIMARYCOLOR} />
          <Text style={[styles.loadingText, { color: colors.TEXTSECONDARY }]}>Cargando receta...</Text>
        </View>
      </SafeAreaView>
    )
  }

  // Renderizar formulario
  return (
    <SidebarLayout
      title="Editar Receta"
      navigation={navigation}
      showBackButton={true}
      extraContent={
        isLandscape && selectedImage ? (
          <View style={styles.sidebarImageContainer}>
            <Image source={{ uri: selectedImage }} style={styles.sidebarImage} resizeMode="cover" />
          </View>
        ) : null
      }
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.WHITEBACKGROUND }]}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <Header name="Editar Receta" navigation={navigation} showBackButton={true} />

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardAvoidingView}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollViewContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Sección: Nombre y favorito */}
            <View style={[styles.section, { backgroundColor: colors.CARD }]}>
              <View style={styles.nameAndFavoriteContainer}>
                <Text style={[styles.sectionTitle, { color: colors.TEXT }]}>Nombre de la receta</Text>
                <TouchableOpacity style={styles.favoriteButton} onPress={toggleFavorite} activeOpacity={0.7}>
                  <Ionicons
                    name={isFavorite ? "heart" : "heart-outline"}
                    size={28}
                    color={isFavorite ? colors.RED : colors.TEXTSECONDARY}
                  />
                </TouchableOpacity>
              </View>

              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.WHITEBACKGROUND, color: colors.TEXT, borderColor: colors.LIGHTGRAY },
                ]}
                placeholder="Ej: Lasaña vegetariana"
                placeholderTextColor={colors.TEXTSECONDARY}
                value={recipeName}
                onChangeText={setRecipeName}
                maxLength={50}
              />
            </View>

            {/* Sección: Categorías */}
            <View style={[styles.section, { backgroundColor: colors.CARD }]}>
              <Text style={[styles.sectionTitle, { color: colors.TEXT }]}>Categorías</Text>
              <Text style={[styles.sectionDescription, { color: colors.TEXTSECONDARY }]}>
                Selecciona las categorías que mejor describan tu receta
              </Text>

              <View style={styles.categoriesContainer}>
                {availableCategories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryChip,
                      { backgroundColor: colors.WHITEBACKGROUND },
                      categories.includes(category.id) && { backgroundColor: colors.PRIMARYCOLOR },
                    ]}
                    onPress={() => toggleCategory(category.id)}
                    activeOpacity={0.7}
                  >
                    <MaterialIcons
                      name={category.icon}
                      size={20}
                      color={categories.includes(category.id) ? "white" : colors.PRIMARYCOLOR}
                      style={styles.categoryIcon}
                    />
                    <Text
                      style={[
                        styles.categoryText,
                        { color: colors.TEXT },
                        categories.includes(category.id) && { color: "white" },
                      ]}
                    >
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Sección: Imagen */}
            <View style={[styles.section, { backgroundColor: colors.CARD }]}>
              <Text style={[styles.sectionTitle, { color: colors.TEXT }]}>Imagen</Text>

              {selectedImage ? (
                <View style={styles.selectedImageContainer}>
                  <Image source={{ uri: selectedImage }} style={styles.selectedImage} resizeMode="cover" />
                  <TouchableOpacity
                    style={[styles.changeImageButton, { backgroundColor: colors.PRIMARYCOLOR }]}
                    onPress={handleSelectImage}
                  >
                    <MaterialIcons name="edit" size={22} color="white" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.removeImageButton, { backgroundColor: colors.RED }]}
                    onPress={handleRemoveImage}
                  >
                    <Ionicons name="trash-outline" size={22} color="white" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.imagePickerButton, { backgroundColor: colors.PRIMARYCOLOR }]}
                  onPress={handleSelectImage}
                  activeOpacity={0.8}
                >
                  <MaterialIcons name="add-photo-alternate" size={24} color="white" />
                  <Text style={styles.imagePickerText}>Seleccionar imagen</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Sección: Ingredientes */}
            <View style={[styles.section, { backgroundColor: colors.CARD }]}>
              <Text style={[styles.sectionTitle, { color: colors.TEXT }]}>Ingredientes</Text>

              <View style={styles.addItemContainer}>
                <TextInput
                  ref={ingredientInputRef}
                  style={[
                    styles.addItemInput,
                    { backgroundColor: colors.WHITEBACKGROUND, color: colors.TEXT, borderColor: colors.LIGHTGRAY },
                  ]}
                  placeholder="Ej: 200g de harina"
                  placeholderTextColor={colors.TEXTSECONDARY}
                  value={newIngredient}
                  onChangeText={setNewIngredient}
                  onSubmitEditing={addIngredient}
                  returnKeyType="done"
                  blurOnSubmit={false}
                />
                <TouchableOpacity
                  style={[styles.addItemButton, { backgroundColor: colors.PRIMARYCOLOR }]}
                  onPress={addIngredient}
                  disabled={!newIngredient.trim()}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add" size={24} color="white" />
                </TouchableOpacity>
              </View>

              {ingredients.length > 0 ? (
                <View style={styles.itemsList}>
                  {ingredients.map((ingredient, index) => (
                    <View key={index} style={[styles.itemRow, { backgroundColor: colors.WHITEBACKGROUND }]}>
                      <View style={styles.itemContent}>
                        <View style={[styles.itemBullet, { backgroundColor: colors.PRIMARYCOLOR }]} />
                        <Text style={[styles.itemText, { color: colors.TEXT }]}>{ingredient}</Text>
                      </View>
                      <TouchableOpacity style={styles.removeItemButton} onPress={() => removeIngredient(index)}>
                        <Ionicons name="close-circle" size={22} color={colors.RED} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={[styles.emptyListText, { color: colors.TEXTSECONDARY }]}>
                  No hay ingredientes añadidos
                </Text>
              )}
            </View>

            {/* Sección: Instrucciones */}
            <View style={[styles.section, { backgroundColor: colors.CARD }]}>
              <Text style={[styles.sectionTitle, { color: colors.TEXT }]}>Instrucciones</Text>

              <View style={styles.addItemContainer}>
                <TextInput
                  ref={instructionInputRef}
                  style={[
                    styles.addItemInput,
                    { backgroundColor: colors.WHITEBACKGROUND, color: colors.TEXT, borderColor: colors.LIGHTGRAY },
                  ]}
                  placeholder="Ej: Precalentar el horno a 180°C"
                  placeholderTextColor={colors.TEXTSECONDARY}
                  value={newInstruction}
                  onChangeText={setNewInstruction}
                  onSubmitEditing={addInstruction}
                  returnKeyType="done"
                  blurOnSubmit={false}
                  multiline
                />
                <TouchableOpacity
                  style={[styles.addItemButton, { backgroundColor: colors.PRIMARYCOLOR }]}
                  onPress={addInstruction}
                  disabled={!newInstruction.trim()}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add" size={24} color="white" />
                </TouchableOpacity>
              </View>

              {instructions.length > 0 ? (
                <View style={styles.itemsList}>
                  {instructions.map((instruction, index) => (
                    <View key={index} style={[styles.itemRow, { backgroundColor: colors.WHITEBACKGROUND }]}>
                      <View style={styles.itemContent}>
                        <View style={[styles.stepNumberContainer, { backgroundColor: colors.PRIMARYCOLOR }]}>
                          <Text style={styles.stepNumber}>{index + 1}</Text>
                        </View>
                        <Text style={[styles.itemText, { color: colors.TEXT }]}>{instruction}</Text>
                      </View>
                      <TouchableOpacity style={styles.removeItemButton} onPress={() => removeInstruction(index)}>
                        <Ionicons name="close-circle" size={22} color={colors.RED} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={[styles.emptyListText, { color: colors.TEXTSECONDARY }]}>
                  No hay instrucciones añadidas
                </Text>
              )}
            </View>

            {/* Sección: Notas */}
            <View style={[styles.section, { backgroundColor: colors.CARD }]}>
              <Text style={[styles.sectionTitle, { color: colors.TEXT }]}>Notas adicionales</Text>
              <TextInput
                style={[
                  styles.textArea,
                  { backgroundColor: colors.WHITEBACKGROUND, color: colors.TEXT, borderColor: colors.LIGHTGRAY },
                ]}
                placeholder="Notas opcionales, consejos, variaciones..."
                placeholderTextColor={colors.TEXTSECONDARY}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Botón de guardar */}
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: colors.SUCCESS }]}
              onPress={saveRecipe}
              disabled={isSaving}
              activeOpacity={0.8}
            >
              {isSaving ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <MaterialIcons name="save" size={24} color="white" />
                  <Text style={styles.saveButtonText}>Guardar Cambios</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </SidebarLayout>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    fontFamily: "Poppins_500Medium",
  },
  section: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  nameAndFavoriteContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  favoriteButton: {
    padding: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
  },
  sectionDescription: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    marginBottom: 16,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: "Poppins_400Regular",
  },
  categoriesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    marginRight: 10,
    marginBottom: 10,
  },
  categoryIcon: {
    marginRight: 8,
  },
  categoryText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
  },
  imagePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
  },
  imagePickerText: {
    color: "white",
    fontFamily: "Poppins_500Medium",
    fontSize: 16,
    marginLeft: 10,
  },
  selectedImageContainer: {
    position: "relative",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 8,
  },
  selectedImage: {
    width: "100%",
    height: 200,
    borderRadius: 12,
  },
  changeImageButton: {
    position: "absolute",
    top: 10,
    right: 60,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  removeImageButton: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  addItemContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  addItemInput: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: "Poppins_400Regular",
    marginRight: 10,
  },
  addItemButton: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  itemsList: {
    marginTop: 8,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  itemContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  itemBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 8,
    marginRight: 12,
  },
  stepNumberContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  stepNumber: {
    color: "white",
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
  },
  itemText: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Poppins_400Regular",
    lineHeight: 22,
  },
  removeItemButton: {
    padding: 4,
  },
  emptyListText: {
    textAlign: "center",
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    fontStyle: "italic",
    marginTop: 8,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: "Poppins_400Regular",
    minHeight: 100,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 20,
  },
  saveButtonText: {
    color: "white",
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
    marginLeft: 10,
  },
  sidebarImageContainer: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 16,
    padding: 10,
  },
  sidebarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
  },
})
