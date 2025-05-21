"use client"
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, StatusBar } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { THEME_OPTIONS, useTheme } from "../context/ThemeContext"
import Header from "../component/header"
import useOrientation from "../hooks/useOrientation"

export default function Component({ navigation }) {
  const { colors, themePreference, changeTheme, isDark } = useTheme()
  const { isTablet, isLandscape } = useOrientation()

  const themeOptions = [
    { value: THEME_OPTIONS.LIGHT, label: "Claro", icon: "sunny-outline" },
    { value: THEME_OPTIONS.DARK, label: "Oscuro", icon: "moon-outline" },
    { value: THEME_OPTIONS.SYSTEM, label: "Sistema", icon: "phone-portrait-outline" },
  ]

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.WHITEBACKGROUND }]}>
      <StatusBar style={isDark ? "light" : "light"} />
      <Header name="Ajustes" navigation={navigation} showBackButton={true} />

      <ScrollView
        style={[styles.scrollView, { backgroundColor: colors.WHITEBACKGROUND }]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollViewContent,
          isTablet && { paddingHorizontal: 25, paddingVertical: 20 },
          isLandscape && { paddingTop: 10 }, // Menos padding en landscape
        ]}
      >
        <View
          style={[
            styles.card,
            { backgroundColor: colors.CARD },
            isTablet && {
              maxWidth: isLandscape ? 800 : 600,
              padding: 30,
              borderRadius: 16,
            },
            isLandscape &&
              !isTablet && {
                maxWidth: "95%",
                padding: 20,
              },
          ]}
        >
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: colors.TEXT }, isTablet && { fontSize: 28 }]}>Ajustes</Text>
            <Text
              style={[
                styles.cardDescription,
                { color: colors.TEXTSECONDARY },
                isTablet && { fontSize: 16, marginTop: 8 },
              ]}
            >
              Personaliza tu aplicación.
            </Text>
          </View>

          <View style={[styles.cardContent, isTablet && { gap: 30 }]}>
            <View style={[styles.section, isTablet && { gap: 20 }]}>
              <Text style={[styles.label, { color: colors.TEXT }, isTablet && { fontSize: 22 }]}>Tema</Text>
              <View style={[styles.themeOptions, isLandscape && { justifyContent: "flex-start" }]}>
                {themeOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.themeOption,
                      { backgroundColor: colors.WHITEBACKGROUND },
                      themePreference === option.value && [
                        styles.themeOptionActive,
                        { borderColor: colors.PRIMARYCOLOR },
                      ],
                      isTablet && {
                        width: isLandscape ? "20%" : "31%",
                        padding: 20,
                        marginRight: isLandscape ? 20 : 0,
                      },
                      isLandscape &&
                        !isTablet && {
                          width: "30%",
                          marginRight: 10,
                        },
                    ]}
                    onPress={() => changeTheme(option.value)}
                  >
                    <Ionicons
                      name={option.icon}
                      size={isTablet ? 32 : 24}
                      color={themePreference === option.value ? colors.PRIMARYCOLOR : colors.TEXTSECONDARY}
                    />
                    <Text
                      style={[
                        styles.themeOptionText,
                        { color: colors.TEXTSECONDARY },
                        themePreference === option.value && { color: colors.PRIMARYCOLOR },
                        isTablet && { fontSize: 16, marginTop: 12 },
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={[styles.section, isTablet && { gap: 20 }]}>
              <Text style={[styles.label, { color: colors.TEXT }, isTablet && { fontSize: 22 }]}>Información</Text>
              <View
                style={[
                  styles.infoBox,
                  { backgroundColor: colors.WHITEBACKGROUND },
                  isTablet && { padding: 20, borderRadius: 14 },
                ]}
              >
                <Text style={[styles.infoText, { color: colors.TEXT }, isTablet && { fontSize: 16, marginBottom: 8 }]}>
                  Versión: 1.5.0
                </Text>
                <Text style={[styles.infoText, { color: colors.TEXTSECONDARY }, isTablet && { fontSize: 16 }]}>
                  Desarrollado con ❤️ para Recetas Mamá
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
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
    padding: 16,
  },
  card: {
    width: "100%",
    maxWidth: 600,
    alignSelf: "center",
    borderRadius: 12,
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 2,
    padding: 20,
    marginBottom: 20,
  },
  cardHeader: {
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 22,
    fontFamily: "Poppins_700Bold",
  },
  cardDescription: {
    fontSize: 14,
    marginTop: 5,
    fontFamily: "Poppins_400Regular",
  },
  cardContent: {
    gap: 20,
  },
  section: {
    gap: 12,
  },
  label: {
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
  },
  themeOptions: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  themeOption: {
    width: "31%",
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "transparent",
    padding: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  themeOptionActive: {
    borderColor: "#8D53FF",
  },
  themeOptionText: {
    marginTop: 8,
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    textAlign: "center",
  },
  infoBox: {
    padding: 15,
    borderRadius: 10,
  },
  infoText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    marginBottom: 5,
  },
})
