"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from "react-native"
import { StatusBar } from "expo-status-bar"
import { Ionicons, MaterialIcons } from "@expo/vector-icons"
import { collection, getDocs, doc, setDoc, query, orderBy, limit } from "firebase/firestore"
import { db, auth } from "../../firebaseConfig.js"
import Header from "../component/header"
import SidebarLayout from "../component/SidebarLayout"
import useOrientation from "../hooks/useOrientation"
import { useTheme } from "../context/ThemeContext"

export default function ShoppingList({ route, navigation }) {
  const { shoppingList: initialShoppingList, weekId: initialWeekId } = route.params || {
    shoppingList: [],
    weekId: null,
  }
  const [shoppingList, setShoppingList] = useState(initialShoppingList || [])
  const [filteredList, setFilteredList] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [weekId, setWeekId] = useState(initialWeekId)
  const { colors, isDark } = useTheme()
  const { isTablet, isLandscape } = useOrientation()

  // Cargar la lista de compra si no se proporcionó una inicial
  useEffect(() => {
    if (!initialShoppingList.length) {
      loadLatestShoppingList()
    } else {
      setFilteredList(initialShoppingList)
    }
  }, [initialShoppingList])

  // Filtrar la lista cuando cambia el término de búsqueda
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredList(shoppingList)
    } else {
      const filtered = shoppingList.filter((item) => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
      setFilteredList(filtered)
    }
  }, [searchTerm, shoppingList])

  // Cargar la lista de compra más reciente desde Firebase
  const loadLatestShoppingList = async () => {
    try {
      setIsLoading(true)
      const userId = auth.currentUser?.uid
      if (!userId) {
        setIsLoading(false)
        return
      }

      // Intentar obtener el menú semanal más reciente
      const menusRef = collection(db, `users/${userId}/weeklyMenus`)
      const q = query(menusRef, orderBy("startDate", "desc"), limit(1))
      const querySnapshot = await getDocs(q)

      if (!querySnapshot.empty) {
        const latestMenu = querySnapshot.docs[0]
        const latestWeekId = latestMenu.id
        setWeekId(latestWeekId)

        const menuData = latestMenu.data()
        if (menuData.shoppingList && menuData.shoppingList.length > 0) {
          setShoppingList(menuData.shoppingList)
          setFilteredList(menuData.shoppingList)
          return
        }
      }

      // Si no hay lista de compra, inicializar una vacía
      setShoppingList([])
      setFilteredList([])
    } catch (error) {
      console.error("Error al cargar lista de compra:", error)
      Alert.alert("Error", "No se pudo cargar la lista de compra")
    } finally {
      setIsLoading(false)
    }
  }

  // Guardar la lista de compra en Firebase
  const saveShoppingList = async () => {
    try {
      setIsSaving(true)
      const userId = auth.currentUser?.uid
      if (!userId) {
        Alert.alert("Error", "No hay un usuario autenticado")
        setIsSaving(false)
        return
      }

      if (!weekId) {
        // Si no hay un weekId, crear uno nuevo con la fecha actual
        const today = new Date()
        const newWeekId = today.toISOString().split("T")[0] // formato YYYY-MM-DD
        setWeekId(newWeekId)

        // Crear un nuevo documento para la lista de compra
        const menuRef = doc(db, `users/${userId}/weeklyMenus`, newWeekId)
        await setDoc(menuRef, {
          startDate: today,
          endDate: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000), // una semana después
          shoppingList: shoppingList,
          createdAt: new Date(),
        })
      } else {
        // Actualizar el documento existente
        const menuRef = doc(db, `users/${userId}/weeklyMenus`, weekId)
        await setDoc(menuRef, { shoppingList }, { merge: true })
      }

      Alert.alert("Éxito", "Lista de compra guardada correctamente")
    } catch (error) {
      console.error("Error al guardar lista de compra:", error)
      Alert.alert("Error", "No se pudo guardar la lista de compra")
    } finally {
      setIsSaving(false)
    }
  }

  // Añadir un nuevo ingrediente a la lista
  const addIngredient = (text) => {
    if (!text.trim()) return

    // Verificar si el ingrediente ya existe
    const normalizedText = text.toLowerCase().trim()
    const existingIndex = shoppingList.findIndex((item) => item.name.toLowerCase().trim() === normalizedText)

    if (existingIndex !== -1) {
      // Si existe, incrementar el contador
      const updatedList = [...shoppingList]
      updatedList[existingIndex].count += 1
      setShoppingList(updatedList)
    } else {
      // Si no existe, añadirlo como nuevo
      setShoppingList([
        ...shoppingList,
        {
          name: text.trim(),
          count: 1,
          checked: false,
        },
      ])
    }

    setNewIngredient("")
  }

  // Estado para el nuevo ingrediente
  const [newIngredient, setNewIngredient] = useState("")

  // Marcar o desmarcar un ingrediente en la lista
  const toggleIngredientChecked = (index) => {
    const itemIndex = shoppingList.findIndex((item) => item.name === filteredList[index].name)

    if (itemIndex !== -1) {
      const updatedList = [...shoppingList]
      updatedList[itemIndex].checked = !updatedList[itemIndex].checked
      setShoppingList(updatedList)

      // Actualizar también la lista filtrada
      const updatedFilteredList = [...filteredList]
      updatedFilteredList[index].checked = updatedList[itemIndex].checked
      setFilteredList(updatedFilteredList)
    }
  }

  // Eliminar un ingrediente de la lista
  const removeIngredient = (index) => {
    const itemIndex = shoppingList.findIndex((item) => item.name === filteredList[index].name)

    if (itemIndex !== -1) {
      const updatedList = [...shoppingList]
      updatedList.splice(itemIndex, 1)
      setShoppingList(updatedList)

      // Actualizar también la lista filtrada
      const updatedFilteredList = [...filteredList]
      updatedFilteredList.splice(index, 1)
      setFilteredList(updatedFilteredList)
    }
  }

  // Renderizar un ingrediente en la lista de compra
  const renderShoppingListItem = ({ item, index }) => (
    <View style={[styles.shoppingListItem, { backgroundColor: colors.CARD }, item.checked && { opacity: 0.6 }]}>
      <TouchableOpacity style={styles.checkboxContainer} onPress={() => toggleIngredientChecked(index)}>
        <View
          style={[
            styles.checkbox,
            { borderColor: colors.PRIMARYCOLOR },
            item.checked && { backgroundColor: colors.PRIMARYCOLOR },
          ]}
        >
          {item.checked && <Ionicons name="checkmark" size={16} color="white" />}
        </View>
      </TouchableOpacity>

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

      <TouchableOpacity style={styles.deleteButton} onPress={() => removeIngredient(index)}>
        <Ionicons name="trash-outline" size={22} color={colors.RED} />
      </TouchableOpacity>
    </View>
  )

  return (
    <SidebarLayout title="Lista de Compra" navigation={navigation} showBackButton={true}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.WHITEBACKGROUND }]}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <Header name="Lista de Compra" navigation={navigation} showBackButton={true} />

        <View style={styles.searchContainer}>
          <View style={[styles.searchInputContainer, { backgroundColor: colors.CARD }]}>
            <Ionicons name="search" size={22} color={colors.TEXTSECONDARY} style={styles.searchIcon} />
            <TextInput
              placeholder="Buscar ingredientes..."
              value={searchTerm}
              onChangeText={setSearchTerm}
              style={[styles.searchInput, { color: colors.TEXT }]}
              placeholderTextColor={colors.TEXTSECONDARY}
            />
            {searchTerm.length > 0 && (
              <TouchableOpacity onPress={() => setSearchTerm("")} style={styles.clearButton}>
                <Ionicons name="close-circle" size={22} color={colors.TEXTSECONDARY} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.addItemContainer}>
          <View style={[styles.addItemInputContainer, { backgroundColor: colors.CARD }]}>
            <TextInput
              placeholder="Añadir ingrediente..."
              value={newIngredient}
              onChangeText={setNewIngredient}
              style={[styles.addItemInput, { color: colors.TEXT }]}
              placeholderTextColor={colors.TEXTSECONDARY}
              onSubmitEditing={() => addIngredient(newIngredient)}
              returnKeyType="done"
            />
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colors.PRIMARYCOLOR }]}
              onPress={() => addIngredient(newIngredient)}
            >
              <Ionicons name="add" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.SUCCESS }]}
            onPress={saveShoppingList}
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
        </View>

        <View style={styles.shoppingListContainer}>
          <View style={styles.shoppingListHeader}>
            <Text style={[styles.shoppingListTitle, { color: colors.TEXT }]}>Ingredientes</Text>
            <Text style={[styles.shoppingListSubtitle, { color: colors.TEXTSECONDARY }]}>
              {filteredList.length} ingredientes
            </Text>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.PRIMARYCOLOR} />
              <Text style={[styles.loadingText, { color: colors.TEXTSECONDARY }]}>Cargando lista de compra...</Text>
            </View>
          ) : filteredList.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="shopping-cart" size={48} color={colors.TEXTSECONDARY} />
              <Text style={[styles.emptyText, { color: colors.TEXT }]}>No hay ingredientes en la lista de compra</Text>
              <Text style={[styles.emptySubtext, { color: colors.TEXTSECONDARY }]}>
                Añade ingredientes usando el campo de arriba
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredList}
              renderItem={renderShoppingListItem}
              keyExtractor={(item, index) => `${item.name}-${index}`}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.shoppingListContent}
            />
          )}
        </View>
      </SafeAreaView>
    </SidebarLayout>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 15,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchInputContainer: {
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
  clearButton: {
    padding: 5,
  },
  addItemContainer: {
    paddingHorizontal: 15,
    paddingBottom: 15,
  },
  addItemInputContainer: {
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
  addItemInput: {
    flex: 1,
    height: 50,
    fontFamily: "Poppins_400Regular",
    fontSize: 16,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  actionButtonsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginHorizontal: 20,
    marginBottom: 15,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginHorizontal: 5,
  },
  actionButtonText: {
    color: "white",
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    marginLeft: 5,
  },
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
    marginRight: 10,
  },
  countText: {
    color: "white",
    fontSize: 12,
    fontFamily: "Poppins_600SemiBold",
  },
  deleteButton: {
    padding: 5,
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
})
