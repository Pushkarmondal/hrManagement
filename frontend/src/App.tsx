// import * as React from "react"

// import { LoginForm } from "@/components/login-form"
// import { SignupForm } from "@/components/signup-form"

// type AuthView = "signup" | "login"

// function App() {
//   const [view, setView] = React.useState<AuthView>("signup")

//   return (
//     <div className="flex min-h-svh flex-col items-center justify-center p-6">
//       {view === "signup" ? (
//         <SignupForm onGoToLogin={() => setView("login")} />
//       ) : (
//         <LoginForm onGoToSignup={() => setView("signup")} />
//       )}
//     </div>
//   )
// }

// export default App


import * as React from "react"

import { LoginForm } from "@/components/login-form"
import { SignupForm } from "@/components/signup-form"
import { AuthHome } from "./Home"

type AuthView = "home" | "signup" | "login"

function viewFromHash(hash: string): AuthView {
  const normalized = hash.replace(/^#\/?/, "").toLowerCase()
  if (normalized === "signup") return "signup"
  if (normalized === "login") return "login"
  return "home"
}

function hashFromView(view: AuthView): string {
  if (view === "signup") return "#/signup"
  if (view === "login") return "#/login"
  return "#/home"
}

function App() {
  const [view, setView] = React.useState<AuthView>(() => viewFromHash(window.location.hash))

  React.useEffect(() => {
    const onHashChange = () => {
      setView(viewFromHash(window.location.hash))
    }

    window.addEventListener("hashchange", onHashChange)
    return () => window.removeEventListener("hashchange", onHashChange)
  }, [])

  React.useEffect(() => {
    const next = hashFromView(view)
    if (window.location.hash !== next) {
      window.location.hash = next
    }
  }, [view])

  return (
    <div className="flex min-h-svh items-center justify-center p-6 bg-background">
      {view === "home" && (
        <AuthHome
          onSignup={() => setView("signup")}
          onLogin={() => setView("login")}
        />
      )}

      {view === "signup" && (
        <SignupForm onGoToLogin={() => setView("login")} />
      )}

      {view === "login" && (
        <LoginForm onGoToSignup={() => setView("signup")} />
      )}
    </div>
  )
}

export default App
