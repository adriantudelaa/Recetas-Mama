"use client"

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StatusBar,
  Platform,
  SafeAreaView,
} from "react-native"
import { Ionicons, MaterialIcons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import useOrientation from "../hooks/useOrientation"
import { useTheme } from "../context/ThemeContext"

export default function SidebarLayout({
  children,
  title,
  navigation,
  showBackButton = false,
  rightIcon = null,
  onRightIconPress = null,
  searchTerm = "",
  onSearchChange = null,
  categories = [],
  currentCategory = "",
  onCategorySelect = null,
  showSearch = false,
  showCategories = false,
  showSettingsButton = false,
  onSettingsPress = null,
  extraContent = null,
}) {
  const { isLandscape, sidebarWidth, translateCategory } = useOrientation()
  const { colors, isDark } = useTheme()

  // Si no estamos en landscape, renderizamos solo los children
  if (!isLandscape) {
    return <>{children}</>
  }

  return (
    <View style={styles.container}>
      {/* Barra lateral izquierda */}
      <LinearGradient
        colors={[colors.PRIMARYCOLOR, colors.ACCENTCOLOR]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.sidebar, { width: sidebarWidth }]}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.sidebarHeader}>
            {showBackButton ? (
              <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.7}>
                <Ionicons name="arrow-back" size={24} color="white" />
              </TouchableOpacity>
            ) : (
              <View style={styles.placeholder} />
            )}

            <Text style={styles.sidebarTitle}>{title}</Text>

            {rightIcon ? (
              <TouchableOpacity style={styles.rightButton} onPress={onRightIconPress} activeOpacity={0.7}>
                <Ionicons name={rightIcon} size={24} color="white" />
              </TouchableOpacity>
            ) : (
              <View style={styles.placeholder} />
            )}
          </View>

          {/* Renderizar contenido extra si existe */}
          {extraContent}

          <ScrollView style={styles.sidebarContent} showsVerticalScrollIndicator={false}>
            {showSearch && (
              <View style={styles.searchContainer}>
                <View style={styles.searchInputContainer}>
                  <Ionicons name="search" size={22} color={colors.TEXTSECONDARY} style={styles.searchIcon} />
                  <TextInput
                    placeholder="Buscar recetas..."
                    value={searchTerm}
                    onChangeText={onSearchChange}
                    style={styles.searchInput}
                    placeholderTextColor="rgba(255,255,255,0.7)"
                  />
                  {searchTerm?.length > 0 && (
                    <TouchableOpacity onPress={() => onSearchChange("")} style={styles.clearButton}>
                      <Ionicons name="close-circle" size={22} color="white" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            {showCategories && categories.length > 0 && (
              <View style={styles.categoriesContainer}>
                <Text style={styles.categoriesTitle}>Categorías</Text>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryItem,
                      currentCategory === category.id || (category.id === "all" && currentCategory === "")
                        ? styles.categoryItemActive
                        : null,
                    ]}
                    onPress={() => onCategorySelect(category.id)}
                    activeOpacity={0.7}
                  >
                    <MaterialIcons
                      name={category.icon}
                      size={22}
                      color={
                        currentCategory === category.id || (category.id === "all" && currentCategory === "")
                          ? colors.PRIMARYCOLOR
                          : "white"
                      }
                    />
                    <Text
                      style={[
                        styles.categoryText,
                        currentCategory === category.id || (category.id === "all" && currentCategory === "")
                          ? styles.categoryTextActive
                          : null,
                      ]}
                    >
                      {translateCategory(category.id)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>

          {showSettingsButton && (
            <TouchableOpacity style={styles.settingsButton} onPress={onSettingsPress} activeOpacity={0.7}>
              <Ionicons name="settings-outline" size={24} color="white" />
              <Text style={styles.settingsText}>Ajustes</Text>
            </TouchableOpacity>
          )}
        </SafeAreaView>
      </LinearGradient>

      {/* Contenido principal */}
      <View style={styles.content}>{children}</View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
  },
  sidebar: {
    height: "100%",
  },
  sidebarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Platform.OS === "ios" ? 10 : StatusBar.currentHeight || 30,
    marginBottom: 20,
    paddingHorizontal: 15,
  },
  sidebarTitle: {
    fontSize: 20,
    fontFamily: "Poppins_600SemiBold",
    color: "white",
    textAlign: "center",
    flex: 1,
  },
  backButton: {
    padding: 8,
  },
  rightButton: {
    padding: 8,
  },
  placeholder: {
    width: 40,
    height: 40,
  },
  sidebarContent: {
    flex: 1,
    paddingHorizontal: 15,
  },
  searchContainer: {
    marginBottom: 20,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 50,
  },
  searchIcon: {
    marginRight: 10,
    color: "white",
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontFamily: "Poppins_400Regular",
    fontSize: 16,
    color: "white",
  },
  clearButton: {
    padding: 5,
  },
  categoriesContainer: {
    marginBottom: 20,
  },
  categoriesTitle: {
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
    color: "white",
    marginBottom: 15,
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 1,
    borderRadius: 12,
    marginBottom: 8,
  },
  categoryItemActive: {
    backgroundColor: "white",
  },
  categoryText: {
    marginLeft: 12,
    fontFamily: "Poppins_500Medium",
    fontSize: 16,
    color: "white",
  },
  categoryTextActive: {
    color: "#8D53FF",
  },
  settingsButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 12,
    marginHorizontal: 15,
    marginBottom: 30,
  },
  settingsText: {
    marginLeft: 12,
    fontFamily: "Poppins_500Medium",
    fontSize: 16,
    color: "white",
  },
  content: {
    flex: 1,
  },
})
