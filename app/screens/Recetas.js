"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Image,
  Share,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
} from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { MaterialIcons } from "@expo/vector-icons"
import { StatusBar } from "expo-status-bar"
import { doc, updateDoc, getDoc } from "firebase/firestore"
import { db, auth } from "../../firebaseConfig.js"
import Header from "../component/header"
import SidebarLayout from "../component/SidebarLayout"
import useOrientation from "../hooks/useOrientation"
import { useTheme } from "../context/ThemeContext"

const NOTES_STORAGE_KEY = "@personal_notes"

export default function RecipeDetails({ route, navigation }) {
  // Extraer la receta de los parámetros de navegación con manejo seguro
  const { recipe } = route.params || {}

  // Estados
  const [personalNotes, setPersonalNotes] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Hooks personalizados
  const { isLandscape, isTablet, translateCategory } = useOrientation()
  const { colors, isDark } = useTheme()

  // Cargar notas guardadas al iniciar
  useEffect(() => {
    const loadNotes = async () => {
      try {
        // Primero intentamos cargar desde Firebase
        const userId = auth.currentUser?.uid
        if (userId && recipe?.id) {
          const recipeRef = doc(db, `users/${userId}/recetas`, recipe.id)
          const recipeSnap = await getDoc(recipeRef)

          if (recipeSnap.exists() && recipeSnap.data().notas) {
            setPersonalNotes(recipeSnap.data().notas)
            // También actualizamos AsyncStorage para tener una copia local
            await AsyncStorage.setItem(`${NOTES_STORAGE_KEY}_${recipe.id}`, recipeSnap.data().notas)
          } else {
            // Si no hay en Firebase, intentamos desde AsyncStorage
            const savedNotes = await AsyncStorage.getItem(`${NOTES_STORAGE_KEY}_${recipe?.id || recipe?.nombre}`)
            if (savedNotes !== null) {
              setPersonalNotes(savedNotes)
            }
          }
        }
      } catch (error) {
        console.error("Error al cargar notas:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadNotes()
  }, [recipe?.id, recipe?.nombre])

  // Guardar notas cuando cambian
  useEffect(() => {
    const saveNotes = async () => {
      if (personalNotes === "") return // No guardar si está vacío

      try {
        setIsSaving(true)

        // Guardar en AsyncStorage primero (como respaldo)
        await AsyncStorage.setItem(`${NOTES_STORAGE_KEY}_${recipe?.id || recipe?.nombre}`, personalNotes)

        // Luego guardar en Firebase
        const userId = auth.currentUser?.uid
        if (userId && recipe?.id) {
          const recipeRef = doc(db, `users/${userId}/recetas`, recipe.id)
          await updateDoc(recipeRef, {
            notas: personalNotes,
            updatedAt: new Date(),
          })
        }
      } catch (error) {
        console.error("Error al guardar notas:", error)
      } finally {
        setIsSaving(false)
      }
    }

    // Usar un debounce para no guardar en cada pulsación
    const timeoutId = setTimeout(() => {
      if (personalNotes !== "") {
        saveNotes()
      }
    }, 1000) // Aumentamos a 1 segundo para reducir escrituras

    return () => clearTimeout(timeoutId)
  }, [personalNotes, recipe?.id, recipe?.nombre])

  // Función para compartir la receta
  const handleShare = async () => {
    try {
      // Preparar el texto para compartir
      const ingredientsList = recipe.ingredientes?.map((item) => `• ${item}`).join("\n") || "No hay ingredientes"
      const stepsList =
        recipe.instrucciones?.map((step, index) => `${index + 1}. ${step}`).join("\n") || "No hay instrucciones"

      const shareText = `🍽️ ${recipe.nombre} 🍽️\n\n📋 INGREDIENTES:\n${ingredientsList}\n\n👩‍🍳 INSTRUCCIONES:\n${stepsList}`

      await Share.share({
        message: shareText,
        title: recipe.nombre,
      })
    } catch (error) {
      console.error("Error al compartir:", error)
      Alert.alert("Error", "No se pudo compartir la receta")
    }
  }

  // Traducir categorías para mostrarlas en español
  const translatedCategories = recipe.categoria
    ? Array.isArray(recipe.categoria)
      ? recipe.categoria.map((cat) => translateCategory(cat))
      : [translateCategory(recipe.categoria)]
    : []

  // Renderizar contenido para modo landscape
  const LandscapeContent = () => (
    <View style={styles.landscapeContainer}>
      <View style={styles.landscapeLeftColumn}>
        <View style={[styles.section, { backgroundColor: colors.CARD }]}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="restaurant" size={isTablet ? 30 : 24} color={colors.PRIMARYCOLOR} />
            <Text style={[styles.subtitle, { color: colors.TEXT }, isTablet && { fontSize: 22, marginLeft: 15 }]}>
              Ingredientes
            </Text>
          </View>
          <View style={styles.list}>
            {recipe.ingredientes && recipe.ingredientes.length > 0 ? (
              recipe.ingredientes.map((item, index) => (
                <View key={index} style={styles.listItemContainer}>
                  <View
                    style={[
                      styles.bullet,
                      isTablet && { width: 10, height: 10, marginTop: 10 },
                      { backgroundColor: colors.PRIMARYCOLOR },
                    ]}
                  />
                  <Text style={[styles.listItem, { color: colors.TEXT }, isTablet && { fontSize: 18, lineHeight: 28 }]}>
                    {item}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={[styles.emptyText, { color: colors.TEXTSECONDARY }]}>No hay ingredientes disponibles</Text>
            )}
          </View>
        </View>
      </View>

      <View style={styles.landscapeLeftColumn}>
        <View style={[styles.section, { backgroundColor: colors.CARD }]}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="format-list-numbered" size={isTablet ? 30 : 24} color={colors.PRIMARYCOLOR} />
            <Text style={[styles.subtitle, { color: colors.TEXT }, isTablet && { fontSize: 22, marginLeft: 15 }]}>
              Instrucciones
            </Text>
          </View>
          <View style={styles.list}>
            {recipe.instrucciones && recipe.instrucciones.length > 0 ? (
              recipe.instrucciones.map((step, index) => (
                <View key={index} style={styles.stepContainer}>
                  <View
                    style={[
                      styles.stepNumberContainer,
                      { backgroundColor: colors.PRIMARYCOLOR },
                      isTablet && { width: 34, height: 34, borderRadius: 17 },
                    ]}
                  >
                    <Text style={[styles.stepNumber, isTablet && { fontSize: 16 }]}>{index + 1}</Text>
                  </View>
                  <Text style={[styles.stepText, { color: colors.TEXT }, isTablet && { fontSize: 18, lineHeight: 28 }]}>
                    {step}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={[styles.emptyText, { color: colors.TEXTSECONDARY }]}>No hay instrucciones disponibles</Text>
            )}
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.CARD }]}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="edit-note" size={isTablet ? 30 : 24} color={colors.PRIMARYCOLOR} />
            <Text style={[styles.subtitle, { color: colors.TEXT }, isTablet && { fontSize: 22, marginLeft: 15 }]}>
              Notas Personales
            </Text>
            {isSaving && <ActivityIndicator size="small" color={colors.PRIMARYCOLOR} style={{ marginLeft: 10 }} />}
          </View>
          <TextInput
            style={[
              styles.textArea,
              {
                backgroundColor: colors.WHITEBACKGROUND,
                color: colors.TEXT,
                borderColor: colors.LIGHTGRAY,
              },
              isTablet && {
                fontSize: 18,
                paddingHorizontal: 20,
                paddingVertical: 15,
                borderRadius: 15,
              },
            ]}
            placeholder="Escribe tus notas aquí..."
            placeholderTextColor={colors.TEXTSECONDARY}
            value={personalNotes}
            onChangeText={setPersonalNotes}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        </View>
      </View>
    </View>
  )

  // Renderizar contenido para modo portrait
  const PortraitContent = () => (
    <>
      <View style={[styles.imageContainer, isTablet && { height: 350 }]}>
        <Image
          source={{ uri: recipe.imagen || "https://via.placeholder.com/400x300?text=Sin+imagen" }}
          style={styles.image}
          defaultSource={require("../../assets/placeholder.png")}
        />
        <View style={styles.titleOverlay}>
          <Text style={[styles.title, isTablet && { fontSize: 28 }]}>{recipe.nombre}</Text>
          {translatedCategories.length > 0 && (
            <View style={styles.categoryContainer}>
              {translatedCategories.map((cat, index) => (
                <View key={index} style={styles.categoryBadge}>
                  <Text style={[styles.categoryText, isTablet && { fontSize: 16 }]}>{cat}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: colors.CARD }]}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="restaurant" size={isTablet ? 30 : 24} color={colors.PRIMARYCOLOR} />
          <Text style={[styles.subtitle, { color: colors.TEXT }, isTablet && { fontSize: 22, marginLeft: 15 }]}>
            Ingredientes
          </Text>
        </View>
        <View style={styles.list}>
          {recipe.ingredientes && recipe.ingredientes.length > 0 ? (
            recipe.ingredientes.map((item, index) => (
              <View key={index} style={styles.listItemContainer}>
                <View
                  style={[
                    styles.bullet,
                    isTablet && { width: 10, height: 10, marginTop: 10 },
                    { backgroundColor: colors.PRIMARYCOLOR },
                  ]}
                />
                <Text style={[styles.listItem, { color: colors.TEXT }, isTablet && { fontSize: 18, lineHeight: 28 }]}>
                  {item}
                </Text>
              </View>
            ))
          ) : (
            <Text style={[styles.emptyText, { color: colors.TEXTSECONDARY }]}>No hay ingredientes disponibles</Text>
          )}
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: colors.CARD }]}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="format-list-numbered" size={isTablet ? 30 : 24} color={colors.PRIMARYCOLOR} />
          <Text style={[styles.subtitle, { color: colors.TEXT }, isTablet && { fontSize: 22, marginLeft: 15 }]}>
            Instrucciones
          </Text>
        </View>
        <View style={styles.list}>
          {recipe.instrucciones && recipe.instrucciones.length > 0 ? (
            recipe.instrucciones.map((step, index) => (
              <View key={index} style={styles.stepContainer}>
                <View
                  style={[
                    styles.stepNumberContainer,
                    { backgroundColor: colors.PRIMARYCOLOR },
                    isTablet && { width: 34, height: 34, borderRadius: 17 },
                  ]}
                >
                  <Text style={[styles.stepNumber, isTablet && { fontSize: 16 }]}>{index + 1}</Text>
                </View>
                <Text style={[styles.stepText, { color: colors.TEXT }, isTablet && { fontSize: 18, lineHeight: 28 }]}>
                  {step}
                </Text>
              </View>
            ))
          ) : (
            <Text style={[styles.emptyText, { color: colors.TEXTSECONDARY }]}>No hay instrucciones disponibles</Text>
          )}
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: colors.CARD }]}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="edit-note" size={isTablet ? 30 : 24} color={colors.PRIMARYCOLOR} />
          <Text style={[styles.subtitle, { color: colors.TEXT }, isTablet && { fontSize: 22, marginLeft: 15 }]}>
            Notas Personales
          </Text>
          {isSaving && <ActivityIndicator size="small" color={colors.PRIMARYCOLOR} style={{ marginLeft: 10 }} />}
        </View>
        <TextInput
          style={[
            styles.textArea,
            {
              backgroundColor: colors.WHITEBACKGROUND,
              color: colors.TEXT,
              borderColor: colors.LIGHTGRAY,
            },
            isTablet && {
              fontSize: 18,
              paddingHorizontal: 20,
              paddingVertical: 15,
              borderRadius: 15,
            },
          ]}
          placeholder="Escribe tus notas aquí..."
          placeholderTextColor={colors.TEXTSECONDARY}
          value={personalNotes}
          onChangeText={setPersonalNotes}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />
      </View>
    </>
  )

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.WHITEBACKGROUND }}>
        <StatusBar style={isDark ? "light" : "light"} />
        <Header name={recipe?.nombre || "Detalles de Receta"} navigation={navigation} showBackButton={true} />
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.PRIMARYCOLOR} />
          <Text style={{ marginTop: 20, color: colors.TEXT, fontFamily: "Poppins_500Medium", fontSize: 16 }}>
            Cargando receta...
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SidebarLayout
      title={recipe.nombre || "Detalles de Receta"}
      navigation={navigation}
      showBackButton={true}
      rightIcon="share-social"
      onRightIconPress={handleShare}
      extraContent={
        isLandscape && (
          <>
            <Image
              source={{ uri: recipe.imagen || "https://via.placeholder.com/400x300?text=Sin+imagen" }}
              style={styles.sidebarImage}
              defaultSource={require("../../assets/placeholder.png")}
            />
            {translatedCategories.length > 0 && (
              <View style={styles.sidebarCategoryContainer}>
                {translatedCategories.map((cat, index) => (
                  <View key={index} style={styles.sidebarCategoryBadge}>
                    <Text style={styles.sidebarCategoryText}>{cat}</Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )
      }
    >
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.WHITEBACKGROUND }]}>
        <StatusBar style={isDark ? "light" : "light"} />
        <Header
          name={recipe.nombre || "Detalles de Receta"}
          navigation={navigation}
          showBackButton={true}
          rightIcon="share-social"
          onRightIconPress={handleShare}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 20}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ScrollView
              style={[styles.scrollView, { backgroundColor: colors.WHITEBACKGROUND }]}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[styles.scrollViewContent, isLandscape && styles.scrollViewContentLandscape]}
              keyboardShouldPersistTaps="handled"
            >
              {isLandscape ? <LandscapeContent /> : <PortraitContent />}
            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </SidebarLayout>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    padding: 5,
    paddingBottom: 100, // Espacio adicional en la parte inferior
  },
  scrollViewContentLandscape: {
    paddingBottom: 120, // Más espacio en landscape para el teclado
  },
  // Estilos para modo portrait
  imageContainer: {
    position: "relative",
    height: 240,
    width: "100%",
    marginBottom: 16,
    borderRadius: 12,
    overflow: "hidden",
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  image: {
    width: "100%",
    height: "100%",
    backgroundColor: "#f0f0f0",
  },
  titleOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 15,
  },
  title: {
    fontSize: 24,
    fontFamily: "Poppins_700Bold",
    color: "white",
    marginBottom: 5,
  },
  categoryContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  categoryBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
    color: "white",
  },
  section: {
    borderRadius: 12,
    padding: 18,
    marginBottom: 16,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  subtitle: {
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
    marginLeft: 10,
    flex: 1,
  },
  list: {
    paddingLeft: 5,
  },
  listItemContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  bullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 8,
    marginRight: 12,
  },
  listItem: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Poppins_400Regular",
    lineHeight: 22,
  },
  stepContainer: {
    flexDirection: "row",
    marginBottom: 15,
  },
  stepNumberContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    marginTop: 2,
  },
  stepNumber: {
    color: "white",
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
  },
  stepText: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Poppins_400Regular",
    lineHeight: 22,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    textAlignVertical: "top",
    fontFamily: "Poppins_400Regular",
    fontSize: 16,
    minHeight: 120,
  },
  emptyText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 16,
    fontStyle: "italic",
    textAlign: "center",
    padding: 10,
  },
  // Estilos para modo landscape
  landscapeContainer: {
    flex: 1,
  },
  landscapeLeftColumn: {
    flex: 1,
    marginRight: 8,
  },
  landscapeRightColumn: {
    flex: 1,
    marginLeft: 8,
  },
  sidebarCategoryContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 10,
    marginBottom: 20,
    paddingHorizontal: 15,
  },
  sidebarCategoryBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  sidebarCategoryText: {
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
    color: "white",
  },
  sidebarImage: {
    width: "90%",
    height: 200,
    borderRadius: 12,
    marginBottom: 10,
    resizeMode: "cover",
    alignSelf: "center",
    backgroundColor: "#f0f0f0",
  },
})
