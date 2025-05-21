"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  FlatList,
  Image,
  TextInput,
  SafeAreaView,
  Alert,
  Share,
  Platform,
} from "react-native"
import { StatusBar } from "expo-status-bar"
import { Ionicons, MaterialIcons, AntDesign, Feather } from "@expo/vector-icons"
import { format, addWeeks, subWeeks, startOfWeek, endOfWeek, addDays, isSameDay } from "date-fns"
import { es } from "date-fns/locale"
import { collection, getDocs, doc, getDoc, setDoc } from "firebase/firestore"
import { db, auth } from "../../firebaseConfig.js"
import * as Print from "expo-print"
import { shareAsync } from "expo-sharing"
import Header from "../component/header"
import SidebarLayout from "../component/SidebarLayout"
import useOrientation from "../hooks/useOrientation"
import { useTheme } from "../context/ThemeContext"

// Categorías de proteínas para sugerencias lógicas
const PROTEIN_CATEGORIES = {
  POLLO: ["pollo", "pechuga", "muslo", "ave", "gallina", "pavo"],
  CARNE: ["carne", "ternera", "cerdo", "res", "vacuno", "cordero", "lomo", "filete"],
  PESCADO: ["pescado", "atún", "salmón", "merluza", "bacalao", "dorada", "lubina", "rape"],
  MARISCO: ["marisco", "gambas", "langostinos", "mejillones", "calamares", "pulpo"],
  VEGETARIANO: ["tofu", "seitán", "legumbres", "garbanzos", "lentejas", "judías", "vegetariano", "vegano"],
  HUEVO: ["huevo", "tortilla", "revuelto", "huevos"],
  PASTA: ["pasta", "espagueti", "macarrones", "tallarines", "lasaña", "canelones"],
  ARROZ: ["arroz", "paella", "risotto"],
}

export default function WeeklyPlanner({ navigation }) {
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [weeklyMenu, setWeeklyMenu] = useState({})
  const [recipes, setRecipes] = useState([])
  const [filteredRecipes, setFilteredRecipes] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [suggestionsModalVisible, setSuggestionsModalVisible] = useState(false)
  const [selectedDay, setSelectedDay] = useState("")
  const [selectedMeal, setSelectedMeal] = useState("")
  const [suggestions, setSuggestions] = useState([])
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false)
  const [shoppingList, setShoppingList] = useState([])
  const { colors, isDark } = useTheme()
  const { isTablet, isLandscape } = useOrientation()

  // Obtener el inicio y fin de la semana actual
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }) // Lunes como inicio de semana
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 })
  const weekId = format(weekStart, "yyyy-MM-dd")

  // Días de la semana
  const weekDays = [
    { id: "monday", name: "Lunes" },
    { id: "tuesday", name: "Martes" },
    { id: "wednesday", name: "Miércoles" },
    { id: "thursday", name: "Jueves" },
    { id: "friday", name: "Viernes" },
    { id: "saturday", name: "Sábado" },
    { id: "sunday", name: "Domingo" },
  ]

  // Cargar recetas
  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        const userId = auth.currentUser?.uid
        if (!userId) {
          setIsLoading(false)
          return
        }

        const recetasRef = collection(db, `users/${userId}/recetas`)
        const querySnapshot = await getDocs(recetasRef)
        const recipesData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          // Añadir categoría de proteína a cada receta
          proteinCategory: detectProteinCategory(doc.data()),
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

    fetchRecipes()
  }, [])

  // Cargar menú semanal cuando cambia la semana
  useEffect(() => {
    const loadWeeklyMenu = async () => {
      try {
        setIsLoading(true)
        const userId = auth.currentUser?.uid
        if (!userId) {
          setIsLoading(false)
          return
        }

        const menuRef = doc(db, `users/${userId}/weeklyMenus`, weekId)
        const menuSnap = await getDoc(menuRef)

        if (menuSnap.exists()) {
          setWeeklyMenu(menuSnap.data().days || {})
        } else {
          // Inicializar un menú vacío para la semana
          const emptyMenu = {}
          weekDays.forEach((day) => {
            emptyMenu[day.id] = { lunch: null, dinner: null }
          })
          setWeeklyMenu(emptyMenu)
        }
      } catch (error) {
        console.error("Error al cargar menú semanal:", error)
        Alert.alert("Error", "No se pudo cargar el menú semanal")
      } finally {
        setIsLoading(false)
      }
    }

    loadWeeklyMenu()
  }, [weekId])

  // Actualizar la lista de compra cuando cambia el menú semanal
  useEffect(() => {
    if (Object.keys(weeklyMenu).length > 0) {
      generateShoppingList()
    }
  }, [weeklyMenu])

  // Filtrar recetas cuando cambia el término de búsqueda
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredRecipes(recipes)
    } else {
      const filtered = recipes.filter(
        (recipe) =>
          recipe.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          recipe.ingredientes?.some((ingredient) => ingredient.toLowerCase().includes(searchTerm.toLowerCase())),
      )
      setFilteredRecipes(filtered)
    }
  }, [searchTerm, recipes])

  // Detectar la categoría de proteína de una receta
  const detectProteinCategory = (recipe) => {
    if (!recipe.ingredientes || recipe.ingredientes.length === 0) {
      return "OTROS"
    }

    const ingredientesText = recipe.ingredientes.join(" ").toLowerCase()

    for (const [category, keywords] of Object.entries(PROTEIN_CATEGORIES)) {
      if (keywords.some((keyword) => ingredientesText.includes(keyword))) {
        return category
      }
    }

    return "OTROS"
  }

  // Generar la lista de compra basada en las recetas del menú semanal
  const generateShoppingList = () => {
    // Recopilar todos los ingredientes de las recetas en el menú
    const allIngredients = []

    Object.values(weeklyMenu).forEach((dayMenu) => {
      if (dayMenu.lunch && dayMenu.lunch.ingredientes) {
        allIngredients.push(...dayMenu.lunch.ingredientes)
      }
      if (dayMenu.dinner && dayMenu.dinner.ingredientes) {
        allIngredients.push(...dayMenu.dinner.ingredientes)
      }
    })

    // Consolidar ingredientes (eliminar duplicados y contar ocurrencias)
    const ingredientMap = new Map()

    allIngredients.forEach((ingredient) => {
      const normalizedIngredient = ingredient.toLowerCase().trim()
      if (ingredientMap.has(normalizedIngredient)) {
        ingredientMap.set(normalizedIngredient, {
          ...ingredientMap.get(normalizedIngredient),
          count: ingredientMap.get(normalizedIngredient).count + 1,
        })
      } else {
        ingredientMap.set(normalizedIngredient, {
          name: ingredient,
          count: 1,
          checked: false,
        })
      }
    })

    // Convertir el mapa a un array para la lista de compra
    const consolidatedList = Array.from(ingredientMap.values())

    // Ordenar alfabéticamente
    consolidatedList.sort((a, b) => a.name.localeCompare(b.name))

    setShoppingList(consolidatedList)
  }

  // Navegar a la semana anterior
  const goToPreviousWeek = () => {
    setCurrentWeek(subWeeks(currentWeek, 1))
  }

  // Navegar a la semana siguiente
  const goToNextWeek = () => {
    setCurrentWeek(addWeeks(currentWeek, 1))
  }

  // Abrir modal para seleccionar receta
  const openRecipeSelector = (day, meal) => {
    setSelectedDay(day)
    setSelectedMeal(meal)
    setModalVisible(true)
  }

  // Seleccionar receta para un día y comida específicos
  const selectRecipe = (recipe) => {
    setWeeklyMenu((prev) => ({
      ...prev,
      [selectedDay]: {
        ...prev[selectedDay],
        [selectedMeal]: recipe,
      },
    }))
    setModalVisible(false)
  }

  // Eliminar receta de un día y comida específicos
  const removeRecipe = (day, meal) => {
    setWeeklyMenu((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [meal]: null,
      },
    }))
  }

  // Guardar menú semanal en Firebase
  const saveWeeklyMenu = async () => {
    try {
      setIsSaving(true)
      const userId = auth.currentUser?.uid
      if (!userId) return

      await setDoc(
        doc(db, `users/${userId}/weeklyMenus`, weekId),
        {
          startDate: weekStart,
          endDate: weekEnd,
          days: weeklyMenu,
          shoppingList: shoppingList,
        },
        { merge: true },
      )

      Alert.alert("Éxito", "Menú semanal guardado correctamente")
    } catch (error) {
      console.error("Error al guardar menú semanal:", error)
      Alert.alert("Error", "No se pudo guardar el menú semanal")
    } finally {
      setIsSaving(false)
    }
  }

  // Obtener la fecha para un día específico de la semana
  const getDayDate = (dayIndex) => {
    return addDays(weekStart, dayIndex)
  }

  // Generar sugerencias de recetas con lógica mejorada
  const generateSuggestions = async (day, meal) => {
    try {
      setIsGeneratingSuggestions(true)
      setSelectedDay(day)
      setSelectedMeal(meal)

      // Obtener recetas que no están ya en el menú semanal
      const usedRecipeIds = []
      Object.values(weeklyMenu).forEach((dayMenu) => {
        if (dayMenu.lunch) usedRecipeIds.push(dayMenu.lunch.id)
        if (dayMenu.dinner) usedRecipeIds.push(dayMenu.dinner.id)
      })

      // Recopilar categorías de proteínas ya utilizadas en días cercanos
      const avoidProteinCategories = []

      // Encontrar el índice del día seleccionado
      const selectedDayIndex = weekDays.findIndex((d) => d.id === day)

      // Verificar el día anterior (si existe)
      if (selectedDayIndex > 0) {
        const prevDay = weekDays[selectedDayIndex - 1].id
        const prevDayMenu = weeklyMenu[prevDay]

        if (prevDayMenu) {
          // Si es cena, verificar la comida del mismo día y la cena del día anterior
          if (meal === "dinner") {
            if (prevDayMenu.dinner?.proteinCategory) {
              avoidProteinCategories.push(prevDayMenu.dinner.proteinCategory)
            }
            if (weeklyMenu[day]?.lunch?.proteinCategory) {
              avoidProteinCategories.push(weeklyMenu[day].lunch.proteinCategory)
            }
          }
          // Si es comida, verificar la cena del día anterior
          else if (meal === "lunch") {
            if (prevDayMenu.dinner?.proteinCategory) {
              avoidProteinCategories.push(prevDayMenu.dinner.proteinCategory)
            }
          }
        }
      }

      // Filtrar por categoría según el tipo de comida
      let categoryFilter = []
      if (meal === "lunch") {
        categoryFilter = ["lunch"]
      } else if (meal === "dinner") {
        categoryFilter = ["dinner"]
      }

      // Obtener recetas que coincidan con la categoría y no estén ya en el menú
      const availableRecipes = recipes.filter((recipe) => {
        // Si la receta ya está en uso en el menú, no sugerirla
        if (usedRecipeIds.includes(recipe.id)) return false

        // Si no tiene categorías definidas, incluirla de todos modos
        if (!recipe.categoria || recipe.categoria.length === 0) return true

        // Si coincide con alguna de las categorías filtradas, incluirla
        return categoryFilter.length === 0 || recipe.categoria.some((cat) => categoryFilter.includes(cat))
      })

      // Priorizar recetas que no repitan proteínas de días cercanos
      const prioritizedRecipes = availableRecipes.filter(
        (recipe) => !avoidProteinCategories.includes(recipe.proteinCategory),
      )

      // Si hay suficientes recetas priorizadas, usar esas; de lo contrario, usar todas las disponibles
      const recipesToSuggest = prioritizedRecipes.length >= 3 ? prioritizedRecipes : availableRecipes

      // Ordenar aleatoriamente y limitar a 5 sugerencias
      const suggestedRecipes = recipesToSuggest.sort(() => 0.5 - Math.random()).slice(0, 5)

      setSuggestions(suggestedRecipes)
      setSuggestionsModalVisible(true)
    } catch (error) {
      console.error("Error al generar sugerencias:", error)
      Alert.alert("Error", "No se pudieron generar sugerencias")
    } finally {
      setIsGeneratingSuggestions(false)
    }
  }

  // Marcar o desmarcar un ingrediente en la lista de compra
  const toggleIngredientChecked = (index) => {
    const updatedList = [...shoppingList]
    updatedList[index].checked = !updatedList[index].checked
    setShoppingList(updatedList)
  }

  // Generar HTML para imprimir el menú semanal
  const generateHtml = () => {
    let menuHtml = `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
          <style>
            body {
              font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
              margin: 0;
              padding: 20px;
              color: #333;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
              padding-bottom: 10px;
              border-bottom: 1px solid #ddd;
            }
            .week-title {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .week-dates {
              font-size: 16px;
              color: #666;
            }
            .day {
              margin-bottom: 20px;
              padding: 15px;
              border: 1px solid #ddd;
              border-radius: 8px;
            }
            .day-header {
              display: flex;
              justify-content: space-between;
              margin-bottom: 10px;
              padding-bottom: 5px;
              border-bottom: 1px solid #eee;
            }
            .day-name {
              font-size: 18px;
              font-weight: bold;
            }
            .day-date {
              font-size: 14px;
              color: #666;
            }
            .meal-container {
              margin-bottom: 15px;
            }
            .meal-label {
              font-size: 16px;
              font-weight: 500;
              margin-bottom: 5px;
              color: #555;
            }
            .recipe {
              padding: 10px;
              background-color: #f9f9f9;
              border-radius: 5px;
            }
            .recipe-name {
              font-size: 15px;
              font-weight: 500;
            }
            .no-recipe {
              font-style: italic;
              color: #999;
            }
            .shopping-list {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
            }
            .shopping-list-title {
              font-size: 20px;
              font-weight: bold;
              margin-bottom: 15px;
            }
            .shopping-list-item {
              font-size: 14px;
              margin-bottom: 8px;
              padding-left: 20px;
              position: relative;
            }
            .shopping-list-item:before {
              content: "•";
              position: absolute;
              left: 0;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="week-title">Menú Semanal</div>
            <div class="week-dates">${format(weekStart, "d", { locale: es })} - ${format(weekEnd, "d MMM yyyy", {
              locale: es,
            })}</div>
          </div>
    `

    weekDays.forEach((day, index) => {
      const dayDate = getDayDate(index)
      const dayMenu = weeklyMenu[day.id] || { lunch: null, dinner: null }

      menuHtml += `
        <div class="day">
          <div class="day-header">
            <div class="day-name">${day.name}</div>
            <div class="day-date">${format(dayDate, "d MMM", { locale: es })}</div>
          </div>
          
          <div class="meal-container">
            <div class="meal-label">Comida</div>
            ${
              dayMenu.lunch
                ? `<div class="recipe"><div class="recipe-name">${dayMenu.lunch.nombre}</div></div>`
                : `<div class="no-recipe">No hay receta seleccionada</div>`
            }
          </div>
          
          <div class="meal-container">
            <div class="meal-label">Cena</div>
            ${
              dayMenu.dinner
                ? `<div class="recipe"><div class="recipe-name">${dayMenu.dinner.nombre}</div></div>`
                : `<div class="no-recipe">No hay receta seleccionada</div>`
            }
          </div>
        </div>
      `
    })

    // Añadir lista de compra al HTML
    if (shoppingList.length > 0) {
      menuHtml += `
        <div class="shopping-list">
          <div class="shopping-list-title">Lista de Compra</div>
      `

      shoppingList.forEach((item) => {
        menuHtml += `<div class="shopping-list-item">${item.name}</div>`
      })

      menuHtml += `</div>`
    }

    menuHtml += `
        </body>
      </html>
    `

    return menuHtml
  }

  // Imprimir o compartir el menú semanal
  const printWeeklyMenu = async () => {
    try {
      const html = generateHtml()
      const { uri } = await Print.printToFileAsync({ html })

      if (Platform.OS === "ios") {
        await Print.printAsync({ uri })
      } else {
        await shareAsync(uri, { UTI: ".pdf", mimeType: "application/pdf" })
      }
    } catch (error) {
      console.error("Error al imprimir menú:", error)
      Alert.alert("Error", "No se pudo imprimir el menú semanal")
    }
  }

  // Compartir el menú semanal como texto
  const shareWeeklyMenu = async () => {
    try {
      let menuText = `🍽️ MENÚ SEMANAL 🍽️\n${format(weekStart, "d", { locale: es })} - ${format(weekEnd, "d MMM yyyy", {
        locale: es,
      })}\n\n`

      weekDays.forEach((day, index) => {
        const dayDate = getDayDate(index)
        const dayMenu = weeklyMenu[day.id] || { lunch: null, dinner: null }

        menuText += `📆 ${day.name} (${format(dayDate, "d MMM", { locale: es })})\n`
        menuText += `🍽️ Comida: ${dayMenu.lunch ? dayMenu.lunch.nombre : "No asignada"}\n`
        menuText += `🍽️ Cena: ${dayMenu.dinner ? dayMenu.dinner.nombre : "No asignada"}\n\n`
      })

      // Añadir lista de compra al texto compartido
      if (shoppingList.length > 0) {
        menuText += `🛒 LISTA DE COMPRA 🛒\n\n`
        shoppingList.forEach((item) => {
          menuText += `• ${item.name}\n`
        })
      }

      await Share.share({
        message: menuText,
        title: "Menú Semanal",
      })
    } catch (error) {
      console.error("Error al compartir menú:", error)
      Alert.alert("Error", "No se pudo compartir el menú semanal")
    }
  }

  // Renderizar un día de la semana
  const renderDay = (day, index) => {
    const dayDate = getDayDate(index)
    const isToday = isSameDay(dayDate, new Date())
    const dayMenu = weeklyMenu[day.id] || { lunch: null, dinner: null }

    return (
      <View
        key={day.id}
        style={[
          styles.dayContainer,
          { backgroundColor: colors.CARD },
          isToday && { borderColor: colors.PRIMARYCOLOR, borderWidth: 2 },
        ]}
      >
        <View style={styles.dayHeader}>
          <Text style={[styles.dayName, { color: colors.TEXT }]}>{day.name}</Text>
          <Text style={[styles.dayDate, { color: colors.TEXTSECONDARY }]}>
            {format(dayDate, "d MMM", { locale: es })}
          </Text>
        </View>

        <View style={styles.mealContainer}>
          <View style={styles.mealHeader}>
            <Text style={[styles.mealLabel, { color: colors.TEXT }]}>Comida</Text>
            {/*<TouchableOpacity
              style={styles.suggestButton}
              onPress={() => generateSuggestions(day.id, "lunch")}
              disabled={isGeneratingSuggestions}
            >
              <Feather name="zap" size={16} color={colors.PRIMARYCOLOR} />
              <Text style={[styles.suggestButtonText, { color: colors.PRIMARYCOLOR }]}>Sugerir</Text>
            </TouchableOpacity>*/}
          </View>

          {dayMenu.lunch ? (
            <View style={styles.selectedRecipe}>
              <Image
                source={{ uri: dayMenu.lunch.imagen || "https://via.placeholder.com/100" }}
                style={styles.recipeImage}
              />
              <View style={styles.recipeInfo}>
                <Text style={[styles.recipeName, { color: colors.TEXT }]} numberOfLines={2}>
                  {dayMenu.lunch.nombre}
                </Text>
                <TouchableOpacity style={styles.removeButton} onPress={() => removeRecipe(day.id, "lunch")}>
                  <Ionicons name="close-circle" size={22} color={colors.RED} />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.addMealButton, { backgroundColor: colors.LIGHTGRAY }]}
              onPress={() => openRecipeSelector(day.id, "lunch")}
            >
              <Ionicons name="add" size={24} color={colors.TEXTSECONDARY} />
              <Text style={[styles.addMealText, { color: colors.TEXTSECONDARY }]}>Añadir receta</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.mealContainer}>
          <View style={styles.mealHeader}>
            <Text style={[styles.mealLabel, { color: colors.TEXT }]}>Cena</Text>
            {/*<TouchableOpacity
              style={styles.suggestButton}
              onPress={() => generateSuggestions(day.id, "dinner")}
              disabled={isGeneratingSuggestions}
            >
              <Feather name="zap" size={16} color={colors.PRIMARYCOLOR} />
              <Text style={[styles.suggestButtonText, { color: colors.PRIMARYCOLOR }]}>Sugerir</Text>
            </TouchableOpacity>*/}
          </View>

          {dayMenu.dinner ? (
            <View style={styles.selectedRecipe}>
              <Image
                source={{ uri: dayMenu.dinner.imagen || "https://via.placeholder.com/100" }}
                style={styles.recipeImage}
              />
              <View style={styles.recipeInfo}>
                <Text style={[styles.recipeName, { color: colors.TEXT }]} numberOfLines={2}>
                  {dayMenu.dinner.nombre}
                </Text>
                <TouchableOpacity style={styles.removeButton} onPress={() => removeRecipe(day.id, "dinner")}>
                  <Ionicons name="close-circle" size={22} color={colors.RED} />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.addMealButton, { backgroundColor: colors.LIGHTGRAY }]}
              onPress={() => openRecipeSelector(day.id, "dinner")}
            >
              <Ionicons name="add" size={24} color={colors.TEXTSECONDARY} />
              <Text style={[styles.addMealText, { color: colors.TEXTSECONDARY }]}>Añadir receta</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    )
  }

  // Renderizar un ingrediente en la lista de compra
  const renderShoppingListItem = ({ item, index }) => (
    <TouchableOpacity
      style={[styles.shoppingListItem, { backgroundColor: colors.CARD }, item.checked && { opacity: 0.6 }]}
      onPress={() => toggleIngredientChecked(index)}
    >
      <View style={styles.checkboxContainer}>
        <View
          style={[
            styles.checkbox,
            { borderColor: colors.PRIMARYCOLOR },
            item.checked && { backgroundColor: colors.PRIMARYCOLOR },
          ]}
        >
          {item.checked && <Ionicons name="checkmark" size={16} color="white" />}
        </View>
      </View>
      <Text
        style={[
          styles.shoppingListItemText,
          { color: colors.TEXT },
          item.checked && { textDecorationLine: "line-through" },
        ]}
      >
        {item.name}
      </Text>
      {item.count > 1 && (
        <View style={[styles.countBadge, { backgroundColor: colors.PRIMARYCOLOR }]}>
          <Text style={styles.countText}>{item.count}</Text>
        </View>
      )}
    </TouchableOpacity>
  )

  // Renderizar una receta en el selector
  const renderRecipeItem = ({ item }) => (
    <TouchableOpacity style={[styles.recipeItem, { backgroundColor: colors.CARD }]} onPress={() => selectRecipe(item)}>
      <Image source={{ uri: item.imagen || "https://via.placeholder.com/100" }} style={styles.recipeItemImage} />
      <View style={styles.recipeItemInfo}>
        <Text style={[styles.recipeItemName, { color: colors.TEXT }]} numberOfLines={2}>
          {item.nombre}
        </Text>
        {item.categoria && item.categoria.length > 0 && (
          <View style={styles.categoryContainer}>
            {item.categoria.map((cat, index) => (
              <View key={index} style={[styles.categoryBadge, { backgroundColor: colors.LIGHTGRAY }]}>
                <Text style={[styles.categoryText, { color: colors.TEXTSECONDARY }]}>{cat}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  )

  return (
    <SidebarLayout
      title="Planeador Semanal"
      navigation={navigation}
      showBackButton={true}
      showSearch={isLandscape}
      searchTerm={isLandscape ? searchTerm : ""}
      onSearchChange={isLandscape ? setSearchTerm : null}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.WHITEBACKGROUND }]}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <Header name="Planeador Semanal" navigation={navigation} showBackButton={true} />

        <View style={styles.weekSelector}>
          <TouchableOpacity style={styles.weekButton} onPress={goToPreviousWeek}>
            <Ionicons name="chevron-back" size={24} color={colors.PRIMARYCOLOR} />
          </TouchableOpacity>
          <Text style={[styles.weekText, { color: colors.TEXT }]}>
            {format(weekStart, "d", { locale: es })} - {format(weekEnd, "d MMM yyyy", { locale: es })}
          </Text>
          <TouchableOpacity style={styles.weekButton} onPress={goToNextWeek}>
            <Ionicons name="chevron-forward" size={24} color={colors.PRIMARYCOLOR} />
          </TouchableOpacity>
        </View>

        {/* Modificar la sección de botones de acción para quitar el botón de lista de compra */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.SUCCESS }]}
            onPress={saveWeeklyMenu}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <MaterialIcons name="save" size={20} color="white" />
                <Text style={styles.actionButtonText}>Guardar</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.SECONDARYCOLOR }]}
            onPress={printWeeklyMenu}
          >
            <MaterialIcons name="print" size={20} color="white" />
            <Text style={styles.actionButtonText}>Imprimir</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.BLUE }]} onPress={shareWeeklyMenu}>
            <MaterialIcons name="share" size={20} color="white" />
            <Text style={styles.actionButtonText}>Compartir</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.PRIMARYCOLOR} />
            <Text style={[styles.loadingText, { color: colors.TEXTSECONDARY }]}>Cargando planeador semanal...</Text>
          </View>
        ) : (
          // Vista de menú semanal
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollViewContent}
            showsVerticalScrollIndicator={false}
          >
            {weekDays.map((day, index) => renderDay(day, index))}
          </ScrollView>
        )}

        {/* Modal para seleccionar receta */}
        <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
          <View style={[styles.modalOverlay, { backgroundColor: "rgba(0,0,0,0.5)" }]}>
            <View
              style={[
                styles.modalContent,
                { backgroundColor: colors.WHITEBACKGROUND },
                isTablet && { width: "80%", maxWidth: 700 },
              ]}
            >
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.TEXT }]}>Seleccionar Receta</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <AntDesign name="close" size={24} color={colors.TEXT} />
                </TouchableOpacity>
              </View>

              <View style={[styles.searchContainer, { backgroundColor: colors.LIGHTGRAY }]}>
                <Ionicons name="search" size={20} color={colors.TEXTSECONDARY} />
                <TextInput
                  style={[styles.searchInput, { color: colors.TEXT }]}
                  placeholder="Buscar recetas..."
                  placeholderTextColor={colors.TEXTSECONDARY}
                  value={searchTerm}
                  onChangeText={setSearchTerm}
                />
                {searchTerm.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchTerm("")}>
                    <Ionicons name="close-circle" size={20} color={colors.TEXTSECONDARY} />
                  </TouchableOpacity>
                )}
              </View>

              {filteredRecipes.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <MaterialIcons name="no-meals" size={48} color={colors.TEXTSECONDARY} />
                  <Text style={[styles.emptyText, { color: colors.TEXT }]}>No se encontraron recetas</Text>
                </View>
              ) : (
                <FlatList
                  data={filteredRecipes}
                  renderItem={renderRecipeItem}
                  keyExtractor={(item) => item.id}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.recipeList}
                />
              )}
            </View>
          </View>
        </Modal>

        {/* Modal para sugerencias de recetas */}
        <Modal
          visible={suggestionsModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setSuggestionsModalVisible(false)}
        >
          <View style={[styles.modalOverlay, { backgroundColor: "rgba(0,0,0,0.5)" }]}>
            <View
              style={[
                styles.modalContent,
                { backgroundColor: colors.WHITEBACKGROUND },
                isTablet && { width: "80%", maxWidth: 700 },
              ]}
            >
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.TEXT }]}>Sugerencias</Text>
                <TouchableOpacity onPress={() => setSuggestionsModalVisible(false)}>
                  <AntDesign name="close" size={24} color={colors.TEXT} />
                </TouchableOpacity>
              </View>

              {isGeneratingSuggestions ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.PRIMARYCOLOR} />
                  <Text style={[styles.loadingText, { color: colors.TEXTSECONDARY }]}>Generando sugerencias...</Text>
                </View>
              ) : suggestions.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <MaterialIcons name="lightbulb-outline" size={48} color={colors.TEXTSECONDARY} />
                  <Text style={[styles.emptyText, { color: colors.TEXT }]}>No hay sugerencias disponibles</Text>
                </View>
              ) : (
                <FlatList
                  data={suggestions}
                  renderItem={renderRecipeItem}
                  keyExtractor={(item) => item.id}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.recipeList}
                />
              )}
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </SidebarLayout>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  weekSelector: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 15,
  },
  weekButton: {
    padding: 10,
  },
  weekText: {
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
    marginHorizontal: 10,
  },
  actionButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 20,
    marginBottom: 15,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    flex: 1,
    marginHorizontal: 3,
  },
  actionButtonText: {
    color: "white",
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    marginLeft: 5,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  dayContainer: {
    borderRadius: 12,
    marginBottom: 15,
    padding: 15,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  dayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  dayName: {
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
  },
  dayDate: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
  },
  mealContainer: {
    marginBottom: 15,
  },
  mealHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  mealLabel: {
    fontSize: 16,
    fontFamily: "Poppins_500Medium",
  },
  suggestButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  suggestButtonText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    marginLeft: 4,
  },
  addMealButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
  },
  addMealText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    marginLeft: 8,
  },
  selectedRecipe: {
    flexDirection: "row",
    borderRadius: 8,
    overflow: "hidden",
  },
  recipeImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  recipeInfo: {
    flex: 1,
    padding: 10,
    justifyContent: "space-between",
  },
  recipeName: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    flex: 1,
  },
  removeButton: {
    alignSelf: "flex-end",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    maxHeight: "80%",
    borderRadius: 12,
    padding: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: "Poppins_600SemiBold",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 15,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontFamily: "Poppins_400Regular",
    fontSize: 16,
  },
  recipeList: {
    paddingBottom: 20,
  },
  recipeItem: {
    flexDirection: "row",
    borderRadius: 8,
    marginBottom: 10,
    overflow: "hidden",
  },
  recipeItemImage: {
    width: 80,
    height: 80,
  },
  recipeItemInfo: {
    flex: 1,
    padding: 10,
  },
  recipeItemName: {
    fontFamily: "Poppins_500Medium",
    fontSize: 16,
    marginBottom: 5,
  },
  categoryContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 5,
    marginBottom: 5,
  },
  categoryText: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 30,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    fontFamily: "Poppins_400Regular",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 30,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    fontFamily: "Poppins_500Medium",
  },
  emptySubtext: {
    marginTop: 5,
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
  },
  // Estilos para la lista de compra
  shoppingListContainer: {
    flex: 1,
    paddingHorizontal: 15,
  },
  shoppingListHeader: {
    marginBottom: 15,
  },
  shoppingListTitle: {
    fontSize: 20,
    fontFamily: "Poppins_600SemiBold",
  },
  shoppingListSubtitle: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
  },
  shoppingListContent: {
    paddingBottom: 20,
  },
  shoppingListItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  checkboxContainer: {
    marginRight: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  shoppingListItemText: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Poppins_400Regular",
  },
  countBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  countText: {
    color: "white",
    fontSize: 12,
    fontFamily: "Poppins_600SemiBold",
  },
})
