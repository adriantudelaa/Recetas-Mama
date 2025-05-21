"use client"

import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { useTheme } from "../context/ThemeContext"
import useOrientation from "../hooks/useOrientation"

export default function Header({
  name,
  navigation,
  showBackButton = false,
  rightIcon = null,
  onRightIconPress = null,
}) {
  const { colors, isDark } = useTheme()
  const { isTablet, isLandscape, screenWidth, screenHeight } = useOrientation()

  // En modo landscape, no mostramos el header (se maneja en SidebarLayout)
  if (isLandscape) {
    return null
  }

  return (
    <SafeAreaView>
      <LinearGradient
        colors={[colors.PRIMARYCOLOR, colors.ACCENTCOLOR]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[
          styles.header,
          {
            paddingHorizontal: screenWidth * 0.05, // 5% del ancho de la pantalla
            paddingBottom: isTablet ? 24 : 18,
          },
        ]}
      >
        {showBackButton ? (
          <TouchableOpacity
            style={[styles.backButton, isTablet && styles.tabletButton]}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={isTablet ? 30 : 26} color="white" />
          </TouchableOpacity>
        ) : (
          <View style={[styles.placeholder, isTablet && { width: isTablet ? 30 : 26, height: isTablet ? 30 : 26 }]} />
        )}

        <Text style={[styles.name, { fontSize: isTablet ? 26 : 22 }]}>{name}</Text>

        {rightIcon ? (
          <TouchableOpacity
            style={[styles.rightButton, isTablet && styles.tabletButton]}
            onPress={onRightIconPress}
            activeOpacity={0.7}
          >
            <Ionicons name={rightIcon} size={isTablet ? 30 : 26} color="white" />
          </TouchableOpacity>
        ) : (
          <View style={[styles.placeholder, isTablet && { width: isTablet ? 30 : 26, height: isTablet ? 30 : 26 }]} />
        )}
      </LinearGradient>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 50,
    elevation: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  backButton: {
    padding: 5,
  },
  rightButton: {
    padding: 5,
  },
  tabletButton: {
    padding: 8,
  },
  placeholder: {
    width: 36,
    height: 36,
  },
  name: {
    fontFamily: "Poppins_600SemiBold",
    color: "white",
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
})
