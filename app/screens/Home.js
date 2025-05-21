"use client"

import { useState, useEffect, useRef } from "react"
import { View, Text, StyleSheet, TouchableOpacity, Animated, ScrollView, SafeAreaView } from "react-native"
import { StatusBar } from "expo-status-bar"
import {
  useFonts,
  Poppins_400Regular,
  Poppins_700Bold,
  Poppins_600SemiBold,
  Poppins_500Medium,
} from "@expo-google-fonts/poppins"
import { MaterialCommunityIcons, MaterialIcons } from "react-native-vector-icons"
import { signOut } from "firebase/auth"
import { auth } from "../../firebaseConfig"
import Header from "../component/header"
import SidebarLayout from "../component/SidebarLayout"
import useOrientation from "../hooks/useOrientation"
import { useTheme } from "../context/ThemeContext"

export default function Component({ navigation }) {
  const [fraseAleatoria, setFraseAleatoria] = useState("")
  const { isLandscape, isTablet } = useOrientation()
  const { colors, isDark } = useTheme()
  const [confirmVisible, setConfirmVisible] = useState(false)

  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(30)).current

  const seleccionarFraseAleatoria = () => {
    const indiceAleatorio = Math.floor(Math.random() * frases.length)
    setFraseAleatoria(frases[indiceAleatorio])
  }

  const frases = [
    "¡Bienvenida a tus recetas! 🍳",
    "¡Organiza tu menú semanal desde el móvil! 📱",
    "Tus recetas, tu estilo, tu menú 😜.",
    "Planifica tu semana con sabor. 🍽️",
    "¡Bienvenida! ¿Qué cocinamos hoy? 🍲",
    "Recetas únicas para una semana deliciosa. 🍜",
    "¡Vamos a cocinar algo increíble! 🥗",
    "Inspírate y cocina con alegría. 🍕",
  ]

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_700Bold,
    Poppins_600SemiBold,
  })

  useEffect(() => {
    seleccionarFraseAleatoria()

    // Iniciar animaciones
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start()
  }, [fadeAnim, slideAnim])

  if (!fontsLoaded) {
    return null // Return null until fonts are loaded
  }

  const handleLogout = async () => {
    try {
      await signOut(auth)
      navigation.replace("Inicio-Sesion")
      alert("Has cerrado sesión correctamente.")
    } catch (error) {
      console.error("Error al cerrar sesión:", error.message)
    }
  }

  const handleSettings = () => {
    navigation.navigate("Settings")
  }

  // Contenido principal que se renderiza tanto en portrait como en landscape
  const MainContent = () => (
    <Animated.View
      style={[
        styles.content,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      {!isLandscape && <Text style={[styles.subtitle, { color: colors.TEXTSECONDARY }]}>{fraseAleatoria}</Text>}

      <View style={styles.categoriesSection}>
        <Text style={[styles.sectionTitle, { color: colors.TEXT }]}>Categorías</Text>
        <View
          style={[
          styles.categoriesGrid,
          isLandscape && styles.categoriesGridLandscape,
          isTablet && isLandscape && styles.categoriesGridTabletLandscape,
        ]}
        >
          <CategoryItem
            title="Desayuno"
            icon={<MaterialIcons name="free-breakfast" size={isTablet ? 36 : 28} color={colors.BLUE} />}
            onPress={() => navigation.navigate("Recepies", { category: "breakfast" })}
            isWide={isLandscape || isTablet}
            isTablet={isTablet}
            colors={colors}
          />
          <CategoryItem
            title="Comida"
            icon={<MaterialCommunityIcons name="food-drumstick" size={isTablet ? 36 : 28} color={colors.BROWN} />}
            onPress={() => navigation.navigate("Recepies", { category: "lunch" })}
            isWide={isLandscape || isTablet}
            isTablet={isTablet}
            colors={colors}
          />
          <CategoryItem
            title="Merienda"
            icon={<MaterialCommunityIcons name="food-apple" size={isTablet ? 36 : 28} color={colors.RED} />}
            onPress={() => navigation.navigate("Recepies", { category: "snack" })}
            isWide={isLandscape || isTablet}
            isTablet={isTablet}
            colors={colors}
          />
          <CategoryItem
            title="Cena"
            icon={<MaterialIcons name="dinner-dining" size={isTablet ? 36 : 28} color={colors.YELLOW} />}
            onPress={() => navigation.navigate("Recepies", { category: "dinner" })}
            isWide={isLandscape || isTablet}
            isTablet={isTablet}
            colors={colors}
          />
        </View>
      </View>

      <View style={styles.actionsSection}>
        <Text style={[styles.sectionTitle, { color: colors.TEXT }]}>Acciones rápidas</Text>
        <View
          style={[
            styles.actionsGrid,
            isLandscape && styles.actionsGridLandscape,
            isTablet && isLandscape && styles.actionsGridTabletLandscape,
          ]}
        >
          <ActionButton
            icon="restaurant-menu"
            label="Ver Recetas"
            onPress={() => navigation.navigate("Recepies")}
            isWide={isLandscape || isTablet}
            isTablet={isTablet}
            color={colors.SECONDARYCOLOR}
          />
          <ActionButton
            icon="favorite"
            label="Favoritas"
            onPress={() => navigation.navigate("Recepies", { category: "favorites" })}
            isWide={isLandscape || isTablet}
            isTablet={isTablet}
            color={colors.SECONDARYCOLOR}
          />
          <ActionButton
            icon="calendar-today"
            label="Planeador Semanal"
            onPress={() => navigation.navigate("WeeklyPlanner")}
            isWide={isLandscape || isTablet}
            isTablet={isTablet}
            color={colors.SECONDARYCOLOR}
          />
          {/*<ActionButton
            icon="shopping-cart"
            label="Lista de Compra"
            onPress={() => navigation.navigate("ShoppingList", { shoppingList: [], weekId: null })}
            isWide={isLandscape || isTablet}
            isTablet={isTablet}
            color={colors.SECONDARYCOLOR}
          />*/}
          <ActionButton
            icon="logout"
            label="Cerrar sesión"
            color={colors.RED}
            onPress={() => setConfirmVisible(true)}
            isWide={isLandscape || isTablet}
            isTablet={isTablet}
          />
        </View>
      </View>
    </Animated.View>
  )

  return (
    <SidebarLayout
      title="Recetas Mamá"
      navigation={navigation}
      showSettingsButton={true}
      onSettingsPress={handleSettings}
    >
      {confirmVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>¿Cerrar Sesión?</Text>
            <Text style={styles.modalText}>¿Deseas cerrar tu sesión?</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.LIGHTGRAY }]}
                onPress={() => setConfirmVisible(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.TEXT }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.RED }]}
                onPress={async () => {
                  setConfirmVisible(false)
                  await handleLogout()
                }}
              >
                <Text style={styles.modalButtonText}>Cerrar Sesión</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.WHITEBACKGROUND }]}>
        <StatusBar style={isDark ? "light" : "light"} />
        <Header name="Recetas Mamá" navigation={navigation} rightIcon="settings" onRightIconPress={handleSettings} />

        <ScrollView
          style={[styles.scrollView, { backgroundColor: colors.WHITEBACKGROUND }]}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollViewContent,
            isLandscape && { paddingTop: 10 }, // Menos padding en landscape
          ]}
        >
          <MainContent />
        </ScrollView>
      </SafeAreaView>
    </SidebarLayout>
  )
}

// Modificar el componente CategoryItem para eliminar animaciones
const CategoryItem = ({ title, icon, onPress, isWide, isTablet, colors }) => {
  return (
    <View
      style={{
        width: isWide ? (isTablet ? "22%" : "23%") : "48%",
        borderRadius: 12,
        padding: isTablet ? 20 : 15,
        alignItems: "center",
        marginBottom: 15,
        marginRight: isWide ? "2%" : 0,
        backgroundColor: colors.CARD,
        elevation: 2,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      }}
    >
      <TouchableOpacity style={{ width: "100%", alignItems: "center" }} onPress={onPress} activeOpacity={0.7}>
        <View
          style={[
            styles.iconContainer,
            isTablet && styles.iconContainerTablet,
            { backgroundColor: colors.WHITEBACKGROUND },
          ]}
        >
          {icon}
        </View>
        <Text style={[styles.categoryText, isTablet && styles.categoryTextTablet, { color: colors.TEXT }]}>
          {title}
        </Text>
      </TouchableOpacity>
    </View>
  )
}

// Modificar el componente ActionButton para que tenga un ancho fijo y se distribuya mejor
const ActionButton = ({ icon, label, onPress, color, isWide, isTablet }) => {
  return (
    <View
      style={{
        backgroundColor: color,
        width: isWide ? (isTablet ? "23%" : "48%") : "48%",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 12,
        paddingVertical: isTablet ? 20 : 15,
        paddingHorizontal: 5,
        marginBottom: 10,
        elevation: 2,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      }}
    >
      <TouchableOpacity style={{ width: "100%", alignItems: "center" }} onPress={onPress} activeOpacity={0.7}>
        <MaterialIcons name={icon} size={isTablet ? 28 : 22} color="white" style={styles.actionIcon} />
        <Text style={[styles.actionText, isTablet && styles.actionTextTablet]}>{label}</Text>
      </TouchableOpacity>
    </View>
  )
}

// Modificar los estilos para mejorar el layout de las acciones rápidas
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  content: {
    flex: 1,
    padding: 15,
  },
  subtitle: {
    fontSize: 18,
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
    marginVertical: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
    marginBottom: 12,
  },
  categoriesSection: {
    marginTop: 8,
  },
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  categoriesGridLandscape: {
    justifyContent: "flex-start",
  },
  categoriesGridTabletLandscape: {
    justifyContent: "space-around",
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  iconContainerTablet: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 15,
  },
  categoryText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 16,
  },
  categoryTextTablet: {
    fontSize: 20,
  },
  actionsSection: {
    marginTop: 15,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
  },
  actionsGridLandscape: {
    justifyContent: "flex-start",
    gap: 15,
  },
  actionsGridTabletLandscape: {
    justifyContent: "flex-start",
    gap: 20,
  },
  actionIcon: {
    marginBottom: 8,
  },
  actionText: {
    color: "white",
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
    textAlign: "center",
  },
  actionTextTablet: {
    fontSize: 18,
  },

  modalOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modalContent: {
    width: "80%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
    marginBottom: 10,
    color: "#333",
  },
  modalText: {
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
    marginBottom: 20,
    color: "#666",
    textAlign: "center",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    marginHorizontal: 5,
    borderRadius: 10,
    alignItems: "center",
  },
  modalButtonText: {
    fontSize: 15,
    color: "white",
    fontFamily: "Poppins_600SemiBold",
  },
})
