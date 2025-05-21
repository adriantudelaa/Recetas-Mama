"use client";

import { useState, useEffect } from "react";
import { Dimensions, Platform } from "react-native";

export default function useOrientation() {
  const [orientation, setOrientation] = useState(
    Dimensions.get("window").width > Dimensions.get("window").height ? "landscape" : "portrait"
  );
  const [screenWidth, setScreenWidth] = useState(Dimensions.get("window").width);
  const [screenHeight, setScreenHeight] = useState(Dimensions.get("window").height);
  const [isTablet, setIsTablet] = useState(
    Math.min(Dimensions.get("window").width, Dimensions.get("window").height) >= 600
  );

  const isIpad = Platform.OS === "ios" && Platform.isPad;
  const aspectRatio = screenWidth / screenHeight;
  const sidebarWidth = isTablet ? 300 : 250;

  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      const { width, height } = window;
      const isLandscape = width > height;
      setOrientation(isLandscape ? "landscape" : "portrait");
      setScreenWidth(width);
      setScreenHeight(height);
      setIsTablet(Math.min(width, height) >= 600);
    });

    return () => subscription?.remove();
  }, []);

  const translateCategory = (category) => {
    const translations = {
      breakfast: "Desayuno",
      lunch: "Comida",
      dinner: "Cena",
      snack: "Merienda",
      favorites: "Favoritos",
      all: "Todas",
    };
    return translations[category] || category;
  };

  const getGridColumns = () => {
    if (orientation === "landscape") return 2; // siempre 2 en landscape
    if (screenWidth >= 1200) return 4;
    if (screenWidth >= 900) return 3;
    if (screenWidth >= 600) return 2;
    return 1;
  };

  const getItemWidth = (itemSpacing = 10, paddingHorizontal = 30) => {
    const columns = getGridColumns();
    const usableWidth =
      orientation === "landscape"
        ? screenWidth * (2 / 3) // Solo 2/3 del ancho si hay barra lateral
        : screenWidth;

    const totalSpacing = itemSpacing * (columns - 1);
    const totalPadding = paddingHorizontal;
    const availableWidth = usableWidth - totalSpacing - totalPadding;

    return Math.floor(availableWidth / columns);
  };

  const getImageHeight = (baseHeight) => {
    if (orientation === "landscape") {
      return isTablet ? baseHeight * 0.7 : baseHeight * 0.6;
    }
    return isTablet ? baseHeight * 1.2 : baseHeight;
  };

  return {
    orientation,
    isLandscape: orientation === "landscape",
    isPortrait: orientation === "portrait",
    screenWidth,
    screenHeight,
    isTablet,
    isIpad,
    aspectRatio,
    sidebarWidth,
    translateCategory,
    scale: (size) => (screenWidth / 375) * size,
    getGridColumns,
    getItemWidth,
    getImageHeight,
  };
}
