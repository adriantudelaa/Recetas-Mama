"use client"

import { createContext, useState, useEffect, useContext } from "react"
import { useColorScheme, Appearance } from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { lightColors, darkColors } from "@styles/colors"

// Clave para almacenar la preferencia de tema
const THEME_PREFERENCE_KEY = "@theme_preference"

// Opciones de tema
export const THEME_OPTIONS = {
  LIGHT: "light",
  DARK: "dark",
  SYSTEM: "system",
}

// Crear el contexto
export const ThemeContext = createContext()

// Hook personalizado para usar el tema
export const useTheme = () => useContext(ThemeContext)

export const ThemeProvider = ({ children }) => {
  // Obtener el tema del sistema usando Appearance directly
  const [systemTheme, setSystemTheme] = useState(Appearance.getColorScheme())
  
  // Estado para la preferencia de tema (light, dark, system)
  const [themePreference, setThemePreference] = useState(THEME_OPTIONS.SYSTEM)

  // Estado para el tema actual aplicado (light o dark)
  const [currentTheme, setCurrentTheme] = useState(
    systemTheme === "dark" ? THEME_OPTIONS.DARK : THEME_OPTIONS.LIGHT
  )

  // Estado para los colores actuales
  const [colors, setColors] = useState(
    systemTheme === "dark" ? darkColors : lightColors
  )

  // Escuchar cambios en el tema del sistema
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      console.log("Sistema cambió a:", colorScheme);
      setSystemTheme(colorScheme);
    });

    return () => subscription.remove();
  }, []);

  // Cargar la preferencia de tema al inicio
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedPreference = await AsyncStorage.getItem(THEME_PREFERENCE_KEY)
        if (savedPreference) {
          setThemePreference(savedPreference)
        }
      } catch (error) {
        console.error("Error al cargar la preferencia de tema:", error)
      }
    }

    loadThemePreference()
  }, [])

  // Actualizar el tema actual cuando cambia la preferencia o el tema del sistema
  useEffect(() => {
    let newTheme;

    if (themePreference === THEME_OPTIONS.SYSTEM) {
      // Usar systemTheme que viene de Appearance.getColorScheme()
      newTheme = systemTheme === "dark" ? THEME_OPTIONS.DARK : THEME_OPTIONS.LIGHT;
    } else {
      newTheme = themePreference;
    }
    
    setCurrentTheme(newTheme);
    setColors(newTheme === THEME_OPTIONS.DARK ? darkColors : lightColors);
  }, [themePreference, systemTheme]);

  // Función para cambiar la preferencia de tema
  const changeTheme = async (newThemePreference) => {
    try {
      setThemePreference(newThemePreference)
      await AsyncStorage.setItem(THEME_PREFERENCE_KEY, newThemePreference)
    } catch (error) {
      console.error("Error al guardar la preferencia de tema:", error)
    }
  }

  // Valores proporcionados por el contexto
  const themeContextValue = {
    themePreference,
    currentTheme,
    colors,
    changeTheme,
    isDark: currentTheme === THEME_OPTIONS.DARK,
    systemTheme, // Exponer el tema del sistema para depuración
  }

  return <ThemeContext.Provider value={themeContextValue}>{children}</ThemeContext.Provider>
}
