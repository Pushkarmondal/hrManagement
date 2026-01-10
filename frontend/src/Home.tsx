import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Sparkles, ArrowRight } from "lucide-react"

type AuthHomeProps = {
  onSignup: () => void
  onLogin: () => void
}

export function AuthHome({ onSignup, onLogin }: AuthHomeProps) {
  return (
    <div className="relative w-full max-w-md">
      {/* Animated gradient background */}
      <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-background blur-3xl animate-pulse" />
      
      {/* Floating orbs */}
      <div className="absolute -top-12 -left-12 h-24 w-24 rounded-full bg-primary/20 blur-2xl animate-pulse" />
      <div className="absolute -bottom-12 -right-12 h-32 w-32 rounded-full bg-primary/15 blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />

      <Card className="relative backdrop-blur-sm bg-card/95 border shadow-2xl">
        <CardHeader className="space-y-6 text-center pb-8">
          {/* Animated icon container */}
          <div className="mx-auto relative group">
            <div className="absolute inset-0 rounded-2xl bg-primary blur-md opacity-50 group-hover:opacity-75 transition-opacity" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg transform transition-transform group-hover:scale-110">
              <Sparkles className="h-8 w-8 text-primary-foreground animate-pulse" />
            </div>
          </div>

          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold">
              Welcome back
            </CardTitle>

            <CardDescription className="text-base">
              Sign in to continue your journey or create a new account to get started.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 pb-8">
          <Button 
            className="w-full h-12 text-base font-medium shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] group" 
            onClick={onSignup}
          >
            Create account
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>

          <Button
            variant="outline"
            className="w-full h-12 text-base font-medium transition-all hover:scale-[1.02] group"
            onClick={onLogin}
          >
            Log in
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>

          {/* Subtle divider */}
          <div className="pt-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-card px-2 text-muted-foreground">
                  Secure & encrypted
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}