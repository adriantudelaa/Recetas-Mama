"use client"

import { useState } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar as RNStatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from "react-native"
import { StatusBar } from "expo-status-bar"
import colors from "@styles/colors"
import { Ionicons, MaterialIcons } from "@expo/vector-icons"
import { db, auth } from "../../firebaseConfig.js"
import { createUserWithEmailAndPassword, deleteUser } from "firebase/auth"
import { doc, setDoc } from "firebase/firestore"
import useOrientation from "../hooks/useOrientation"

export default function Registro({ navigation }) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [isLoading, setIsLoading] = useState(false)

  const { isTablet, isLandscape, screenWidth } = useOrientation()

  const handleChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    // Clear error when typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }))
    }
  }

  const validateForm = () => {
    let valid = true
    const newErrors = {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    }

    if (!formData.name.trim()) {
      newErrors.name = "El nombre es obligatorio"
      valid = false
    }

    if (!formData.email.trim()) {
      newErrors.email = "El email es obligatorio"
      valid = false
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email inválido"
      valid = false
    }

    if (!formData.password) {
      newErrors.password = "La contraseña es obligatoria"
      valid = false
    } else if (formData.password.length < 6) {
      newErrors.password = "La contraseña debe tener al menos 6 caracteres"
      valid = false
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden"
      valid = false
    }

    setErrors(newErrors)
    return valid
  }

  const handleSubmit = async () => {
    if (validateForm()) {
      setIsLoading(true)
      try {
        const { email, password, name } = formData

        if (!email || !password || !name) {
          alert("Usuario omitido por datos incompletos")
          return
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password)
        const user = userCredential.user

        try {
          await setDoc(doc(db, "users", user.uid), {
            email,
            name,
            createdAt: new Date(),
          })
          console.log(`Usuario registrado: ${email}`)
          alert("Registro exitoso")
          navigation.navigate("Inicio-Sesion") // Redirigir después del registro
        } catch (firestoreError) {
          console.error(`Error al guardar en Firestore para ${email}:`, firestoreError.message)
          await deleteUser(user)
          alert(`Error al guardar los datos: ${firestoreError.message}`)
        }
      } catch (authError) {
        console.error(`Error al registrar ${formData.email}:`, authError.message)
        alert(`Error al registrar: ${authError.message}`)
      } finally {
        setIsLoading(false)
      }
    }
  }

  // Mejorar la visualización en modo landscape
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : null}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <StatusBar style="dark" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={isLandscape ? { flexGrow: 1 } : undefined}
      >
        {isLandscape ? (
          // Layout para modo landscape
          <View style={{ flexDirection: "row", paddingVertical: 20 }}>
            <View style={{ flex: 1, paddingHorizontal: 20 }}>
              <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate("Inicio-Sesion")}>
                  <Ionicons name="arrow-back" size={24} color={colors.TEXT} />
                  <Text style={styles.backText}>Atrás</Text>
                </TouchableOpacity>
              </View>

              <View style={[styles.logoContainer, { marginVertical: 20 }]}>
                <Image
                  source={require("../../assets/icon.png")}
                  style={[styles.logo, isTablet && { width: 100, height: 100 }]}
                />
                <Text style={[styles.appName, { fontSize: isTablet ? 28 : 24, marginTop: 15 }]}>Recetas Mamá</Text>
              </View>
            </View>

            <View
              style={[
                styles.formContainer,
                {
                  flex: 2,
                  paddingHorizontal: 20,
                  paddingRight: 40,
                },
              ]}
            >
              <Text style={[styles.title, { fontSize: isTablet ? 28 : 24, marginBottom: 20 }]}>Crear cuenta</Text>

              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <View style={{ width: "48%" }}>
                  <View
                    style={[
                      styles.inputContainer,
                      errors.name && styles.inputError,
                      {
                        height: isTablet ? 55 : 50,
                        borderRadius: 12,
                        marginBottom: 15,
                      },
                    ]}
                  >
                    <MaterialIcons
                      name="person"
                      size={isTablet ? 24 : 22}
                      color={colors.TEXTSECONDARY}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={[styles.input, { fontSize: isTablet ? 16 : 15 }]}
                      placeholder="Nombre"
                      placeholderTextColor={colors.TEXTSECONDARY}
                      value={formData.name}
                      onChangeText={(value) => handleChange("name", value)}
                    />
                  </View>
                  {errors.name ? (
                    <Text style={[styles.errorText, { fontSize: 12, marginBottom: 15 }]}>{errors.name}</Text>
                  ) : null}

                  <View
                    style={[
                      styles.inputContainer,
                      errors.email && styles.inputError,
                      {
                        height: isTablet ? 55 : 50,
                        borderRadius: 12,
                        marginBottom: 15,
                      },
                    ]}
                  >
                    <MaterialIcons
                      name="email"
                      size={isTablet ? 24 : 22}
                      color={colors.TEXTSECONDARY}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={[styles.input, { fontSize: isTablet ? 16 : 15 }]}
                      placeholder="Email"
                      placeholderTextColor={colors.TEXTSECONDARY}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      value={formData.email}
                      onChangeText={(value) => handleChange("email", value)}
                    />
                  </View>
                  {errors.email ? (
                    <Text style={[styles.errorText, { fontSize: 12, marginBottom: 15 }]}>{errors.email}</Text>
                  ) : null}
                </View>

                <View style={{ width: "48%" }}>
                  <View
                    style={[
                      styles.inputContainer,
                      errors.password && styles.inputError,
                      {
                        height: isTablet ? 55 : 50,
                        borderRadius: 12,
                        marginBottom: 15,
                      },
                    ]}
                  >
                    <MaterialIcons
                      name="lock"
                      size={isTablet ? 24 : 22}
                      color={colors.TEXTSECONDARY}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={[styles.input, { fontSize: isTablet ? 16 : 15 }]}
                      placeholder="Contraseña"
                      placeholderTextColor={colors.TEXTSECONDARY}
                      secureTextEntry={!showPassword}
                      value={formData.password}
                      onChangeText={(value) => handleChange("password", value)}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.visibilityIcon}>
                      <Ionicons name={showPassword ? "eye-off" : "eye"} size={22} color={colors.TEXTSECONDARY} />
                    </TouchableOpacity>
                  </View>
                  {errors.password ? (
                    <Text style={[styles.errorText, { fontSize: 12, marginBottom: 15 }]}>{errors.password}</Text>
                  ) : null}

                  <View
                    style={[
                      styles.inputContainer,
                      errors.confirmPassword && styles.inputError,
                      {
                        height: isTablet ? 55 : 50,
                        borderRadius: 12,
                        marginBottom: 15,
                      },
                    ]}
                  >
                    <MaterialIcons
                      name="lock"
                      size={isTablet ? 24 : 22}
                      color={colors.TEXTSECONDARY}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={[styles.input, { fontSize: isTablet ? 16 : 15 }]}
                      placeholder="Repetir contraseña"
                      placeholderTextColor={colors.TEXTSECONDARY}
                      secureTextEntry={!showConfirmPassword}
                      value={formData.confirmPassword}
                      onChangeText={(value) => handleChange("confirmPassword", value)}
                    />
                    <TouchableOpacity
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={styles.visibilityIcon}
                    >
                      <Ionicons name={showConfirmPassword ? "eye-off" : "eye"} size={22} color={colors.TEXTSECONDARY} />
                    </TouchableOpacity>
                  </View>
                  {errors.confirmPassword ? (
                    <Text style={[styles.errorText, { fontSize: 12, marginBottom: 15 }]}>{errors.confirmPassword}</Text>
                  ) : null}
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.registerButton,
                  {
                    height: isTablet ? 55 : 50,
                    borderRadius: 12,
                    marginTop: 15,
                    marginBottom: 20,
                  },
                ]}
                onPress={handleSubmit}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Text style={[styles.registerButtonText, { fontSize: isTablet ? 18 : 16 }]}>Cargando...</Text>
                ) : (
                  <>
                    <MaterialIcons
                      name="person-add"
                      size={isTablet ? 22 : 20}
                      color="white"
                      style={styles.buttonIcon}
                    />
                    <Text style={[styles.registerButtonText, { fontSize: isTablet ? 18 : 16 }]}>Registrarse</Text>
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.loginContainer}>
                <Text style={[styles.loginText, { fontSize: isTablet ? 16 : 15 }]}>¿Ya tienes cuenta?</Text>
                <TouchableOpacity onPress={() => navigation.navigate("Inicio-Sesion")}>
                  <Text style={[styles.loginLink, { fontSize: isTablet ? 16 : 15 }]}>Iniciar sesión</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          // Layout original para modo portrait
          <>
            <View style={styles.header}>
              <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate("Inicio-Sesion")}>
                <Ionicons name="arrow-back" size={24} color={colors.TEXT} />
                <Text style={styles.backText}>Atrás</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.logoContainer, isTablet && { marginVertical: 30 }]}>
              <Image
                source={require("../../assets/icon.png")}
                style={[styles.logo, isTablet && { width: 120, height: 120 }]}
              />
            </View>

            <View
              style={[
                styles.formContainer,
                isTablet && {
                  width: "90%",
                  alignSelf: "center",
                  paddingHorizontal: 30,
                },
              ]}
            >
              <Text style={[styles.title, isTablet && { fontSize: 32, marginBottom: 30 }]}>Crear cuenta</Text>

              <View
                style={[
                  styles.inputContainer,
                  errors.name && styles.inputError,
                  isTablet && {
                    height: 60,
                    borderRadius: 14,
                    marginBottom: 20,
                  },
                ]}
              >
                <MaterialIcons
                  name="person"
                  size={isTablet ? 26 : 22}
                  color={colors.TEXTSECONDARY}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, isTablet && { fontSize: 18, height: 60 }]}
                  placeholder="Nombre"
                  placeholderTextColor={colors.TEXTSECONDARY}
                  value={formData.name}
                  onChangeText={(value) => handleChange("name", value)}
                />
              </View>
              {errors.name ? (
                <Text style={[styles.errorText, isTablet && { fontSize: 14, marginBottom: 20 }]}>{errors.name}</Text>
              ) : null}

              <View
                style={[
                  styles.inputContainer,
                  errors.email && styles.inputError,
                  isTablet && {
                    height: 60,
                    borderRadius: 14,
                    marginBottom: 20,
                  },
                ]}
              >
                <MaterialIcons
                  name="email"
                  size={isTablet ? 26 : 22}
                  color={colors.TEXTSECONDARY}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, isTablet && { fontSize: 18, height: 60 }]}
                  placeholder="Email"
                  placeholderTextColor={colors.TEXTSECONDARY}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={formData.email}
                  onChangeText={(value) => handleChange("email", value)}
                />
              </View>
              {errors.email ? (
                <Text style={[styles.errorText, isTablet && { fontSize: 14, marginBottom: 20 }]}>{errors.email}</Text>
              ) : null}

              <View
                style={[
                  styles.inputContainer,
                  errors.password && styles.inputError,
                  isTablet && {
                    height: 60,
                    borderRadius: 14,
                    marginBottom: 20,
                  },
                ]}
              >
                <MaterialIcons
                  name="lock"
                  size={isTablet ? 26 : 22}
                  color={colors.TEXTSECONDARY}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, isTablet && { fontSize: 18, height: 60 }]}
                  placeholder="Contraseña"
                  placeholderTextColor={colors.TEXTSECONDARY}
                  secureTextEntry={!showPassword}
                  value={formData.password}
                  onChangeText={(value) => handleChange("password", value)}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.visibilityIcon}>
                  <Ionicons name={showPassword ? "eye-off" : "eye"} size={22} color={colors.TEXTSECONDARY} />
                </TouchableOpacity>
              </View>
              {errors.password ? (
                <Text style={[styles.errorText, isTablet && { fontSize: 14, marginBottom: 20 }]}>
                  {errors.password}
                </Text>
              ) : null}

              <View
                style={[
                  styles.inputContainer,
                  errors.confirmPassword && styles.inputError,
                  isTablet && {
                    height: 60,
                    borderRadius: 14,
                    marginBottom: 20,
                  },
                ]}
              >
                <MaterialIcons
                  name="lock"
                  size={isTablet ? 26 : 22}
                  color={colors.TEXTSECONDARY}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, isTablet && { fontSize: 18, height: 60 }]}
                  placeholder="Repetir contraseña"
                  placeholderTextColor={colors.TEXTSECONDARY}
                  secureTextEntry={!showConfirmPassword}
                  value={formData.confirmPassword}
                  onChangeText={(value) => handleChange("confirmPassword", value)}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.visibilityIcon}
                >
                  <Ionicons name={showConfirmPassword ? "eye-off" : "eye"} size={22} color={colors.TEXTSECONDARY} />
                </TouchableOpacity>
              </View>
              {errors.confirmPassword ? (
                <Text style={[styles.errorText, isTablet && { fontSize: 14, marginBottom: 20 }]}>
                  {errors.confirmPassword}
                </Text>
              ) : null}

              <TouchableOpacity
                style={[
                  styles.registerButton,
                  isTablet && {
                    height: 60,
                    borderRadius: 14,
                    marginTop: 20,
                    marginBottom: 25,
                  },
                ]}
                onPress={handleSubmit}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Text style={[styles.registerButtonText, isTablet && { fontSize: 20 }]}>Cargando...</Text>
                ) : (
                  <>
                    <MaterialIcons
                      name="person-add"
                      size={isTablet ? 24 : 20}
                      color="white"
                      style={styles.buttonIcon}
                    />
                    <Text style={[styles.registerButtonText, isTablet && { fontSize: 20 }]}>Registrarse</Text>
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.loginContainer}>
                <Text style={[styles.loginText, isTablet && { fontSize: 18 }]}>¿Ya tienes cuenta?</Text>
                <TouchableOpacity onPress={() => navigation.navigate("Inicio-Sesion")}>
                  <Text style={[styles.loginLink, isTablet && { fontSize: 18 }]}>Iniciar sesión</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.WHITEBACKGROUND,
    paddingTop: Platform.OS === "ios" ? 0 : RNStatusBar.currentHeight,
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  backText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 16,
    color: colors.TEXT,
    marginLeft: 5,
  },
  logoContainer: {
    alignItems: "center",
    marginVertical: 15,
  },
  logo: {
    width: 70,
    height: 70,
    resizeMode: "contain",
  },
  formContainer: {
    paddingHorizontal: 30,
    paddingBottom: 40,
  },
  title: {
    fontSize: 26,
    marginBottom: 25,
    color: colors.TEXT,
    fontFamily: "Poppins_700Bold",
    textAlign: "center",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.CARD,
    borderRadius: 10,
    marginBottom: 15,
    paddingHorizontal: 12,
    height: 50,
    elevation: 2,
    shadowColor: colors.SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  inputError: {
    borderWidth: 1,
    borderColor: colors.RED,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    fontFamily: "Poppins_400Regular",
    color: colors.TEXT,
    fontSize: 15,
  },
  visibilityIcon: {
    padding: 5,
  },
  errorText: {
    color: colors.RED,
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    marginTop: -10,
    marginBottom: 15,
    marginLeft: 5,
  },
  registerButton: {
    flexDirection: "row",
    height: 50,
    backgroundColor: colors.PRIMARYCOLOR,
    borderRadius: 10,
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
    marginRight: 8,
  },
  registerButtonText: {
    color: "white",
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  loginText: {
    color: colors.TEXTSECONDARY,
    fontFamily: "Poppins_400Regular",
    fontSize: 15,
  },
  loginLink: {
    color: colors.PRIMARYCOLOR,
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    marginLeft: 5,
  },
})
