"use client"

import { useState } from "react"
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image } from "react-native"
import { AntDesign, Ionicons } from "@expo/vector-icons"
import colors from "@styles/colors"
import { addDays, format, startOfWeek } from "date-fns"
import { es } from "date-fns/locale"

export default function Component({ navigation }) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const startOfWeekDate = startOfWeek(currentDate, { weekStartsOn: 1 })
  const endOfWeekDate = addDays(startOfWeekDate, 6)
  const formattedWeek = `${format(startOfWeekDate, "dd", { locale: es })} - ${format(endOfWeekDate, "dd MMMM yyyy", { locale: es })}`

  const handlePreviousWeek = () => {
    setCurrentDate((prevDate) => addDays(prevDate, -7))
  }

  const handleNextWeek = () => {
    setCurrentDate((prevDate) => addDays(prevDate, 7))
  }

  const getMenuForWeek = (weekStartDate) => {
    const weekNumber = format(weekStartDate, "w")
    return weekNumber % 2 === 0 ? evenWeekMenu : oddWeekMenu
  }

  const menuForWeek = getMenuForWeek(startOfWeekDate)

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.appTitle}>App de Recetas</Text>
      </View>
      <View style={styles.weekNav}>
        <TouchableOpacity style={styles.iconButton} onPress={handlePreviousWeek}>
          <AntDesign name="left" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.weekText}>
          Semana: <Text style={styles.boldText}>{formattedWeek}</Text>
        </Text>
        <TouchableOpacity style={styles.iconButton} onPress={handleNextWeek}>
          <AntDesign name="right" size={24} color="white" />
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.generateButton}>
        <Ionicons name="add" size={24} color="white" />
        <Text style={styles.generateButtonText}>Crea tu menú semanal</Text>
      </TouchableOpacity>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          {["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"].map((day, index) => (
            <View key={index} style={styles.dayContainer}>
              <Text style={styles.dayText}>{day}</Text>
              <View style={styles.menuItems}>
                {menuForWeek[day].map((item, idx) => (
                  <View key={idx} style={styles.card}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Image source={item.image} style={styles.image} />
                    <Text style={styles.cardTitle2}>{item.title2}</Text>
                    <Text style={styles.cardDescription}>{item.description}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  )
}

const evenWeekMenu = {
  Lunes: [
    {
      image: require("@assets/placeholder.png"),
      title: "Comida",
      title2: "Grilled Chicken Salad",
      description: "Romaine lettuce, grilled chicken, cherry tomatoes, cucumber, and balsamic vinaigrette.",
    },
    {
      image: require("@assets/placeholder.png"),
      title: "Cena",
      title2: "Vegetable Stir-Fry",
      description: "Mixed vegetables, tofu, and brown rice in a savory sauce.",
    },
  ],
  Martes: [
    {
      image: require("@assets/placeholder.png"),
      title: "Comida",
      title2: "Beef Tacos",
      description: "Ground beef, lettuce, tomato, cheese, and sour cream in soft tortillas.",
    },
    {
      image: require("@assets/placeholder.png"),
      title: "Cena",
      title2: "Quinoa Salad",
      description: "Quinoa, roasted vegetables, feta, and lemon dressing.",
    },
  ],
  Miércoles: [
    {
      image: require("@assets/placeholder.png"),
      title: "Comida",
      title2: "Baked Salmon",
      description: "Salmon fillet, roasted asparagus, and lemon-dill sauce.",
    },
    {
      image: require("@assets/placeholder.png"),
      title: "Cena",
      title2: "Lentil Soup",
      description: "Hearty lentil soup with carrots, celery, and crusty bread.",
    },
  ],
  Jueves: [
    {
      image: require("@assets/placeholder.png"),
      title: "Comida",
      title2: "Chicken Fajitas",
      description: "Grilled chicken, peppers, onions, and warm tortillas.",
    },
    {
      image: require("@assets/placeholder.png"),
      title: "Cena",
      title2: "Vegetable Lasagna",
      description: "Layers of pasta, vegetables, and creamy cheese sauce.",
    },
  ],
  Viernes: [
    {
      image: require("@assets/placeholder.png"),
      title: "Comida",
      title2: "Shrimp Scampi",
      description: "Sautéed shrimp in a garlic-butter sauce, served over linguine.",
    },
    {
      image: require("@assets/placeholder.png"),
      title: "Cena",
      title2: "Veggie Stir-Fry",
      description: "Mixed vegetables, tofu, and brown rice in a savory sauce.",
    },
  ],
  Sábado: [
    {
      image: require("@assets/placeholder.png"),
      title: "Comida",
      title2: "Grilled Steak",
      description: "Marinated steak, roasted potatoes, and grilled asparagus.",
    },
    {
      image: require("@assets/placeholder.png"),
      title: "Cena",
      title2: "Vegetable Curry",
      description: "Mixed vegetables in a creamy coconut curry sauce, served with basmati rice.",
    },
  ],
  Domingo: [
    {
      image: require("@assets/placeholder.png"),
      title: "Comida",
      title2: "Roast Chicken",
      description: "Whole roasted chicken, roasted vegetables, and mashed potatoes.",
    },
    {
      image: require("@assets/placeholder.png"),
      title: "Cena",
      title2: "Vegetable Frittata",
      description: "Baked egg dish with mixed vegetables and cheese.",
    },
  ],
}

const oddWeekMenu = {
  Lunes: [
    {
      image: require("@assets/placeholder.png"),
      title: "Comida",
      title2: "Caesar Salad",
      description: "Romaine lettuce, Caesar dressing, croutons, and Parmesan cheese.",
    },
    {
      image: require("@assets/placeholder.png"),
      title: "Cena",
      title2: "Spaghetti Carbonara",
      description: "Spaghetti with bacon, eggs, and Parmesan cheese.",
    },
  ],
  Martes: [
    {
      image: require("@assets/placeholder.png"),
      title: "Comida",
      title2: "Chicken Wrap",
      description: "Grilled chicken, lettuce, tomato, and avocado in a tortilla wrap.",
    },
    {
      image: require("@assets/placeholder.png"),
      title: "Cena",
      title2: "Vegetable Soup",
      description: "Mixed vegetable soup with a side of bread.",
    },
  ],
  Miércoles: [
    {
      image: require("@assets/placeholder.png"),
      title: "Comida",
      title2: "Fish Tacos",
      description: "Grilled fish, cabbage slaw, and lime crema in soft tortillas.",
    },
    {
      image: require("@assets/placeholder.png"),
      title: "Cena",
      title2: "Stuffed Peppers",
      description: "Bell peppers stuffed with rice, ground beef, and cheese.",
    },
  ],
  Jueves: [
    {
      image: require("@assets/placeholder.png"),
      title: "Comida",
      title2: "Turkey Sandwich",
      description: "Turkey, lettuce, tomato, and mayo on whole grain bread.",
    },
    {
      image: require("@assets/placeholder.png"),
      title: "Cena",
      title2: "Eggplant Parmesan",
      description: "Baked eggplant slices with marinara and mozzarella cheese.",
    },
  ],
  Viernes: [
    {
      image: require("@assets/placeholder.png"),
      title: "Comida",
      title2: "Grilled Cheese",
      description: "Grilled cheese sandwich with a side of tomato soup.",
    },
    {
      image: require("@assets/placeholder.png"),
      title: "Cena",
      title2: "Chicken Stir-Fry",
      description: "Chicken and vegetables stir-fried with soy sauce and served over rice.",
    },
  ],
  Sábado: [
    {
      image: require("@assets/placeholder.png"),
      title: "Comida",
      title2: "Pasta Salad",
      description: "Pasta with cherry tomatoes, cucumbers, olives, and Italian dressing.",
    },
    {
      image: require("@assets/placeholder.png"),
      title: "Cena",
      title2: "Beef Stew",
      description: "Hearty beef stew with potatoes, carrots, and celery.",
    },
  ],
  Domingo: [
    {
      image: require("@assets/placeholder.png"),
      title: "Comida",
      title2: "BLT Sandwich",
      description: "Bacon, lettuce, and tomato on toasted bread with mayo.",
    },
    {
      image: require("@assets/placeholder.png"),
      title: "Cena",
      title2: "Vegetable Casserole",
      description: "Baked casserole with mixed vegetables and cheese.",
    },
  ],
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.WHITEBACKGROUND,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.PRIMARYCOLOR,
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 15,
  },
  appTitle: {
    color: "white",
    marginRight: 65,
    fontSize: 25,
    fontFamily: "Poppins_700Bold",
  },
  weekNav: {
    alignContent: "center",
    justifyContent: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.PRIMARYCOLOR,
    paddingVertical: 10,
    width: "100%",
  },
  iconButton: {
    padding: 8,
  },
  weekText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 18,
    color: "white",
    marginHorizontal: 10,
  },
  boldText: {
    fontWeight: "700",
  },
  generateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.SECONDARYCOLOR,
    padding: 8,
    margin: 16,
    borderRadius: 20,
    elevation: 5,
  },
  generateButtonText: {
    color: "white",
    fontFamily: "Poppins_500Medium",
    marginLeft: 4,
  },
  grid: {
    marginTop: 16,
    backgroundColor: colors.WHITEBACKGROUND,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  dayContainer: {
    backgroundColor: colors.WHITEBACKGROUND,
    borderRadius: 8,
    paddingLeft: 16,
    paddingRight: 16,
    marginBottom: 10,
    width: "100%",
  },
  dayText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 30,
    textAlign: "center",
  },
  menuItems: {
    marginTop: 16,
  },
  card: {
    backgroundColor: "white",
    borderColor: colors.GRAY,
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    elevation: 5,
  },
  image: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  cardTitle: {
    fontFamily: "Poppins_500Medium",
    fontSize: 16,
    textDecorationLine: "underline",
    marginBottom: 8,
  },
  cardTitle2: {
    textAlign: "center",
    paddingVertical: 4,
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
  },
  cardDescription: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: colors.DARKGRAY,
  },
})
