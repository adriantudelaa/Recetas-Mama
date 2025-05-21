"use client"

import { useState, useRef } from "react"
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
import { collection, addDoc } from "firebase/firestore"
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { db, auth } from "../../firebaseConfig.js"
import Header from "../component/header"
import SidebarLayout from "../component/SidebarLayout"
import useOrientation from "../hooks/useOrientation"
import { useTheme } from "../context/ThemeContext"

export default function AddRecipe({ navigation }) {
  // Estados para los datos de la receta
  const [recipeName, setRecipeName] = useState("")
  const [selectedImage, setSelectedImage] = useState(null)
  const [categories, setCategories] = useState([])
  const [ingredients, setIngredients] = useState([])
  const [instructions, setInstructions] = useState([])
  const [notes, setNotes] = useState("")

  // Estados para los inputs temporales
  const [newIngredient, setNewIngredient] = useState("")
  const [newInstruction, setNewInstruction] = useState("")

  // Estado para el proceso de guardado
  const [isSaving, setIsSaving] = useState(false)

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
      }
    } catch (error) {
      console.error("Error al seleccionar imagen:", error)
      Alert.alert("Error", "No se pudo seleccionar la imagen")
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

      // Subir imagen si existe
      let imageUrl = null
      if (selectedImage) {
        try {
          const storage = getStorage()
          // Crear una referencia única para la imagen usando timestamp y nombre de receta
          const imageFileName = `${Date.now()}_${recipeName.replace(/\s+/g, "_")}.jpg`
          const imageRef = ref(storage, `users/${userId}/recetas/${imageFileName}`)

          // Convertir la URI de la imagen a un blob
          const response = await fetch(selectedImage)
          const blob = await response.blob()

          // Subir el blob a Firebase Storage
          const uploadTask = await uploadBytes(imageRef, blob)
          console.log("Imagen subida correctamente a Firebase Storage")

          // Obtener la URL de descarga de la imagen
          imageUrl = await getDownloadURL(imageRef)
          console.log("URL de imagen obtenida:", imageUrl)
        } catch (imageError) {
          console.error("Error al subir la imagen:", imageError)
          Alert.alert("Advertencia", "No se pudo subir la imagen, pero se guardará la receta sin imagen")
        }
      }

      // Crear objeto de receta
      const recipeData = {
        nombre: recipeName.trim(),
        categoria: categories,
        ingredientes: ingredients,
        instrucciones: instructions,
        notas: notes.trim(),
        imagen: imageUrl,
        fav: false,
        createdAt: new Date(),
      }

      // Guardar en Firestore
      const recipeRef = await addDoc(collection(db, `users/${userId}/recetas`), recipeData)

      Alert.alert("Éxito", "Receta guardada correctamente", [{ text: "OK", onPress: () => navigation.goBack() }])
    } catch (error) {
      console.error("Error al guardar receta:", error)
      Alert.alert("Error", "No se pudo guardar la receta")
    } finally {
      setIsSaving(false)
    }
  }

  // Renderizar formulario
  return (
    <SidebarLayout
      title="Nueva Receta"
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
        <Header name="Nueva Receta" navigation={navigation} showBackButton={true} />

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
            {/* Sección: Nombre de la receta */}
            <View style={[styles.section, { backgroundColor: colors.CARD }]}>
              <Text style={[styles.sectionTitle, { color: colors.TEXT }]}>Nombre de la receta</Text>
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
                    style={[styles.removeImageButton, { backgroundColor: colors.RED }]}
                    onPress={() => setSelectedImage(null)}
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
                  <Text style={styles.saveButtonText}>Guardar Receta</Text>
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
  section: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
    marginBottom: 12,
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
