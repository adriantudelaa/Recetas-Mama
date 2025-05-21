"use client"

import { useState, useRef, useEffect } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  StatusBar as RNStatusBar,
  Animated,
} from "react-native"
import { StatusBar } from "expo-status-bar"
import { useFonts, Poppins_400Regular, Poppins_700Bold, Poppins_600SemiBold } from "@expo-google-fonts/poppins"
import { Ionicons, MaterialIcons } from "@expo/vector-icons"
import colors from "@styles/colors"
import { auth } from "../../firebaseConfig.js"
import { signInWithEmailAndPassword } from "firebase/auth"
// Añadir el hook useOrientation
import useOrientation from "../hooks/useOrientation"

export default function LoginScreen({ navigation }) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(30)).current
  const logoAnim = useRef(new Animated.Value(0.8)).current

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_700Bold,
    Poppins_600SemiBold,
  })

  // Dentro del componente, añadir:
  const { isTablet, isLandscape, screenWidth } = useOrientation()

  useEffect(() => {
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
      Animated.spring(logoAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start()
  }, [fadeAnim, slideAnim, logoAnim])

  if (!fontsLoaded) {
    return null // No renderizamos nada hasta que las fuentes estén cargadas
  }

  const handleLogin = async () => {
    if (!email || !password) {
      alert("Introduce el usuario y contraseña")
      return
    }

    setIsLoading(true)
    try {
      const response = await signInWithEmailAndPassword(auth, email, password)
      if (response) {
        navigation.replace("Home")
      }
    } catch (e) {
      console.log("Error: ", e.code, e.message)

      let errorMessage = "Ocurrió un error inesperado. Inténtalo de nuevo."

      switch (e.code) {
        case "auth/invalid-email":
          errorMessage = "El formato del correo es inválido."
          break
        case "auth/user-disabled":
          errorMessage = "Esta cuenta ha sido deshabilitada."
          break
        case "auth/user-not-found":
          errorMessage = "No se encontró una cuenta con este correo."
          break
        case "auth/wrong-password":
          errorMessage = "Contraseña incorrecta."
          break
        case "auth/too-many-requests":
          errorMessage = "Demasiados intentos. Intenta más tarde."
          break
        case "auth/network-request-failed":
          errorMessage = "Error de conexión. Revisa tu internet."
          break
        case "auth/operation-not-allowed":
          errorMessage = "La autenticación no está habilitada para este proveedor."
          break
        case "auth/invalid-credential":
          errorMessage = "Las credenciales proporcionadas son inválidas."
          break
        default:
          errorMessage = "Error desconocido: " + e.message
          break
      }

      alert(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = () => {
    navigation.navigate("Registro") // Navegar a la pantalla de registro
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <StatusBar style="dark" />

      {/* En modo landscape, reorganizamos el layout para que sea horizontal */}
      {isLandscape ? (
        <View style={{ flexDirection: "row", flex: 1, alignItems: "center" }}>
          <Animated.View
            style={[
              styles.logoContainer,
              {
                transform: [{ scale: logoAnim }],
                flex: 1,
                marginTop: 0,
                marginBottom: 0,
                paddingHorizontal: 20,
              },
            ]}
          >
            <Image
              source={require("../../assets/icon.png")}
              style={[styles.logo, isTablet && { width: 120, height: 120 }]}
            />
            <Text style={[styles.appName, isTablet && { fontSize: 32 }]}>Recetas Mamá</Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.formContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
                flex: 1.5,
                paddingRight: 40,
              },
            ]}
          >
            <Text style={[styles.title, isTablet && { fontSize: 32 }]}>Iniciar Sesión</Text>

            <View
              style={[
                styles.inputContainer,
                isTablet && {
                  height: 60,
                  borderRadius: 14,
                  marginBottom: 20,
                },
              ]}
            >
              <MaterialIcons
                name="email"
                size={isTablet ? 28 : 24}
                color={colors.TEXTSECONDARY}
                style={styles.inputIcon}
              />
              <TextInput
                style={[
                  styles.input,
                  isTablet && {
                    height: 60,
                    fontSize: 18,
                  },
                ]}
                placeholder="Correo Electrónico"
                placeholderTextColor={colors.TEXTSECONDARY}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View
              style={[
                styles.inputContainer,
                isTablet && {
                  height: 60,
                  borderRadius: 14,
                  marginBottom: 20,
                },
              ]}
            >
              <MaterialIcons
                name="lock"
                size={isTablet ? 28 : 24}
                color={colors.TEXTSECONDARY}
                style={styles.inputIcon}
              />
              <TextInput
                style={[
                  styles.input,
                  isTablet && {
                    height: 60,
                    fontSize: 18,
                  },
                ]}
                placeholder="Contraseña"
                placeholderTextColor={colors.TEXTSECONDARY}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!isPasswordVisible}
              />
              <TouchableOpacity
                onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                style={styles.visibilityIcon}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={isPasswordVisible ? "eye-off" : "eye"}
                  size={isTablet ? 28 : 24}
                  color={colors.TEXTSECONDARY}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.loginButton,
                isTablet && {
                  height: 60,
                  borderRadius: 14,
                  marginTop: 20,
                  marginBottom: 25,
                },
              ]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.7}
            >
              {isLoading ? (
                <Text style={[styles.loginButtonText, isTablet && { fontSize: 20 }]}>Cargando...</Text>
              ) : (
                <>
                  <MaterialIcons name="login" size={isTablet ? 26 : 22} color="white" style={styles.buttonIcon} />
                  <Text style={[styles.loginButtonText, isTablet && { fontSize: 20 }]}>Iniciar Sesión</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.registerContainer}>
              <Text style={[styles.registerText, isTablet && { fontSize: 16 }]}>¿No tienes cuenta?</Text>
              <TouchableOpacity onPress={handleRegister}>
                <Text style={[styles.registerLink, isTablet && { fontSize: 16 }]}>Regístrate</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      ) : (
        // Modo portrait (original)
        <>
          <Animated.View
            style={[
              styles.logoContainer,
              {
                transform: [{ scale: logoAnim }],
              },
              isTablet && { marginTop: 80, marginBottom: 40 },
            ]}
          >
            <Image
              source={require("../../assets/icon.png")}
              style={[styles.logo, isTablet && { width: 150, height: 150 }]}
            />
            <Text style={[styles.appName, isTablet && { fontSize: 36, marginTop: 25 }]}>Recetas Mamá</Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.formContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
              isTablet && {
                width: "85%",
                alignSelf: "center",
                paddingHorizontal: 40,
              },
            ]}
          >
            <Text style={[styles.title, isTablet && { fontSize: 36, marginBottom: 40 }]}>Iniciar Sesión</Text>

            <View
              style={[
                styles.inputContainer,
                isTablet && {
                  height: 65,
                  borderRadius: 16,
                  marginBottom: 25,
                },
              ]}
            >
              <MaterialIcons
                name="email"
                size={isTablet ? 30 : 24}
                color={colors.TEXTSECONDARY}
                style={styles.inputIcon}
              />
              <TextInput
                style={[
                  styles.input,
                  isTablet && {
                    height: 65,
                    fontSize: 18,
                  },
                ]}
                placeholder="Correo Electrónico"
                placeholderTextColor={colors.TEXTSECONDARY}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View
              style={[
                styles.inputContainer,
                isTablet && {
                  height: 65,
                  borderRadius: 16,
                  marginBottom: 25,
                },
              ]}
            >
              <MaterialIcons
                name="lock"
                size={isTablet ? 30 : 24}
                color={colors.TEXTSECONDARY}
                style={styles.inputIcon}
              />
              <TextInput
                style={[
                  styles.input,
                  isTablet && {
                    height: 65,
                    fontSize: 18,
                  },
                ]}
                placeholder="Contraseña"
                placeholderTextColor={colors.TEXTSECONDARY}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!isPasswordVisible}
              />
              <TouchableOpacity
                onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                style={styles.visibilityIcon}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={isPasswordVisible ? "eye-off" : "eye"}
                  size={isTablet ? 30 : 24}
                  color={colors.TEXTSECONDARY}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.loginButton,
                isTablet && {
                  height: 65,
                  borderRadius: 16,
                  marginTop: 25,
                  marginBottom: 30,
                },
              ]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.7}
            >
              {isLoading ? (
                <Text style={[styles.loginButtonText, isTablet && { fontSize: 22 }]}>Cargando...</Text>
              ) : (
                <>
                  <MaterialIcons name="login" size={isTablet ? 28 : 22} color="white" style={styles.buttonIcon} />
                  <Text style={[styles.loginButtonText, isTablet && { fontSize: 22 }]}>Iniciar Sesión</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.registerContainer}>
              <Text style={[styles.registerText, isTablet && { fontSize: 18 }]}>¿No tienes cuenta?</Text>
              <TouchableOpacity onPress={handleRegister}>
                <Text style={[styles.registerLink, isTablet && { fontSize: 18 }]}>Regístrate</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </>
      )}
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.WHITEBACKGROUND,
    paddingTop: Platform.OS === "ios" ? 0 : RNStatusBar.currentHeight,
  },
  logoContainer: {
    alignItems: "center",
    marginTop: 60,
    marginBottom: 30,
  },
  logo: {
    width: 100,
    height: 100,
    resizeMode: "contain",
  },
  appName: {
    fontSize: 28,
    fontFamily: "Poppins_700Bold",
    color: colors.PRIMARYCOLOR,
    marginTop: 15,
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 30,
  },
  title: {
    fontSize: 28,
    marginBottom: 30,
    color: colors.TEXT,
    fontFamily: "Poppins_700Bold",
    textAlign: "center",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.CARD,
    borderRadius: 12,
    marginBottom: 18,
    paddingHorizontal: 15,
    height: 55,
    elevation: 2,
    shadowColor: colors.SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 55,
    fontFamily: "Poppins_400Regular",
    color: colors.TEXT,
    fontSize: 16,
  },
  visibilityIcon: {
    padding: 5,
  },
  loginButton: {
    flexDirection: "row",
    height: 55,
    backgroundColor: colors.PRIMARYCOLOR,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 15,
    marginBottom: 20,
    elevation: 3,
    shadowColor: colors.SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  buttonIcon: {
    marginRight: 10,
  },
  loginButtonText: {
    color: "white",
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
  },
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 15,
  },
  registerText: {
    color: colors.TEXTSECONDARY,
    fontFamily: "Poppins_400Regular",
    fontSize: 16,
  },
  registerLink: {
    color: colors.PRIMARYCOLOR,
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    marginLeft: 5,
  },
})
