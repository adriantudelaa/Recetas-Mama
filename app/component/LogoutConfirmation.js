"use client"

import { useState } from "react"
import { View, StyleSheet, TouchableOpacity, Text, Modal } from "react-native"
import colors from "@styles/colors.js"
import { MaterialIcons } from "@expo/vector-icons"

const LogoutConfirmation = ({ style, onLogout }) => {
  const [showModal, setShowModal] = useState(false)

  const showModalHandler = () => {
    setShowModal(true)
  }

  const hideModalHandler = () => {
    setShowModal(false)
  }

  const confirmLogoutHandler = () => {
    hideModalHandler()
    onLogout() // Llama a la función de cierre de sesión proporcionada
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.logoutButton} onPress={showModalHandler}>
        <MaterialIcons name="logout" size={20} color="white" style={styles.buttonIcon} />
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>

      <Modal visible={showModal} transparent animationType="fade" onRequestClose={hideModalHandler}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.alertTitle}>Cerrar Sesión</Text>
            <Text style={styles.alertMessage}>¿Estás seguro de que deseas cerrar sesión?</Text>
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.cancelButton} onPress={hideModalHandler}>
                <Text style={styles.cancelButtonText}>No</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmButton} onPress={confirmLogoutHandler}>
                <Text style={styles.confirmButtonText}>Sí</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  logoutButton: {
    height: 54,
    marginBottom: 15,
    flex: 1,
    borderRadius: 12,
    backgroundColor: colors.RED,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    shadowColor: "rgba(255, 71, 87, 0.3)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    flexDirection: "row",
  },
  buttonIcon: {
    marginRight: 8,
  },
  logoutText: {
    color: "white",
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: colors.CARD,
    borderRadius: 16,
    padding: 25,
    width: "85%",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  alertTitle: {
    fontSize: 22,
    color: colors.TEXT,
    fontFamily: "Poppins_600SemiBold",
    marginBottom: 10,
  },
  alertMessage: {
    fontSize: 16,
    color: colors.TEXTSECONDARY,
    textAlign: "center",
    fontFamily: "Poppins_400Regular",
    marginVertical: 15,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 15,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.LIGHTGRAY,
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 12,
    marginRight: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    color: colors.TEXT,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: colors.RED,
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 12,
    marginLeft: 8,
  },
  confirmButtonText: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    color: "#fff",
  },
})

export default LogoutConfirmation
