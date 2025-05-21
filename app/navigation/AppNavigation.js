"use client"

import { useState, useEffect } from "react"
import { createStackNavigator } from "@react-navigation/stack"
import { NavigationContainer, DefaultTheme, DarkTheme } from "@react-navigation/native"
import { useFonts, Inter_400Regular, Inter_700Bold, Inter_500Medium, Inter_600SemiBold } from "@expo-google-fonts/inter"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "../../firebaseConfig.js"
import { useTheme } from "../context/ThemeContext.js"

import Home from "@screens/Home.js"
import WeekMenu from "@screens/WeekMenu.js"
import Recepies from "@screens/Recepies.js"
import Settings from "@screens/Settings.js"
import Recetas from "@screens/Recetas.js"
import Add from "@screens/Add.js"
import Edit from "@screens/Edit.js"
import LoginScreen from "@screens/Inicio-Sesion.js"
import Registro from "@screens/Registro.js"
import WeeklyPlanner from "@screens/WeeklyPlanner.js"
import ShoppingList from "../screens/ShoppingList.js"

// Importamos las configuraciones de animación
import { CardStyleInterpolators } from "@react-navigation/stack"

const Stack = createStackNavigator()

// Configuración de animaciones para las transiciones entre pantallas
const screenOptions = {
  headerShown: false,
  gestureEnabled: true,
  cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
  transitionSpec: {
    open: {
      animation: "timing",
      config: {
        duration: 300,
      },
    },
    close: {
      animation: "timing",
      config: {
        duration: 300,
      },
    },
  },
}

// Configuración específica para la pantalla de Recepies (sin gestos)
const recepiesScreenOptions = {
  ...screenOptions,
  gestureEnabled: false, // Desactivamos los gestos para esta pantalla
}

function AppNavigator() {
  const [initialRoute, setInitialRoute] = useState("Inicio-Sesion")
  const [isLoading, setIsLoading] = useState(true)
  const { isDark, colors } = useTheme()

  // Personalizar los temas de navegación
  const customLightTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: colors.WHITEBACKGROUND,
      card: colors.CARD,
      text: colors.TEXT,
    },
  }

  const customDarkTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: colors.WHITEBACKGROUND,
      card: colors.CARD,
      text: colors.TEXT,
    },
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setInitialRoute("Home")
      } else {
        setInitialRoute("Inicio-Sesion")
      }
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [])

  if (isLoading) return null

  return (
    <Stack.Navigator initialRouteName={initialRoute}>
      <Stack.Screen name="Home" component={Home} options={screenOptions} />
      <Stack.Screen name="Inicio-Sesion" component={LoginScreen} options={screenOptions} />
      <Stack.Screen name="Registro" component={Registro} options={screenOptions} />
      <Stack.Screen name="WeekMenu" component={WeekMenu} options={screenOptions} />
      <Stack.Screen name="Recepies" component={Recepies} options={recepiesScreenOptions} />
      <Stack.Screen name="Settings" component={Settings} options={screenOptions} />
      <Stack.Screen name="Add" component={Add} options={screenOptions} />
      <Stack.Screen name="Edit" component={Edit} options={screenOptions} />
      <Stack.Screen name="Recetas" component={Recetas} options={screenOptions} />
      <Stack.Screen name="WeeklyPlanner" component={WeeklyPlanner} options={screenOptions} />
      <Stack.Screen name="ShoppingList" component={ShoppingList} options={screenOptions} />

    </Stack.Navigator>
  )
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_700Bold,
    Inter_500Medium,
    Inter_600SemiBold,
  })

  const { isDark } = useTheme()

  if (!fontsLoaded) {
    return null
  }

  return (
    <NavigationContainer theme={isDark ? DarkTheme : DefaultTheme}>
      <AppNavigator />
    </NavigationContainer>
  )
}
