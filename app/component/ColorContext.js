"use client"

import { createContext, useState, useEffect } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"

export const ColorContext = createContext()

export const ColorProvider = ({ children }) => {
  const [primaryColor, setPrimaryColor] = useState("#8D53FF")

  useEffect(() => {
    const loadColor = async () => {
      try {
        const savedColor = await AsyncStorage.getItem("colorTheme")
        if (savedColor) {
          setPrimaryColor(savedColor)
        }
      } catch (error) {
        console.error("Error loading color theme", error)
      }
    }
    loadColor()
  }, [])

  const updateColor = async (newColor) => {
    try {
      setPrimaryColor(newColor)
      await AsyncStorage.setItem("colorTheme", newColor)
    } catch (error) {
      console.error("Error saving color theme", error)
    }
  }

  return <ColorContext.Provider value={{ primaryColor, updateColor }}>{children}</ColorContext.Provider>
}
