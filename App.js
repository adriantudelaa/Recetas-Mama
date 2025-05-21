import Appnavigation from "@navigation/AppNavigation"
import SplashScreenWrapper from "./Splashscreen.js"
import { ThemeProvider } from "./app/context/ThemeContext"

export default function App() {
  return (
    <ThemeProvider>
      <SplashScreenWrapper>
        <Appnavigation />
      </SplashScreenWrapper>
    </ThemeProvider>
  )
}
