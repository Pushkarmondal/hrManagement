import { Button } from "./components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card"

type AuthHomeProps = {
  onSignup: () => void
  onLogin: () => void
}

export function AuthHome({ onSignup, onLogin }: AuthHomeProps) {
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-2 text-center">
        <CardTitle className="text-2xl">
          Welcome
        </CardTitle>
        <CardDescription>
          Sign in or create an account to continue.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <Button className="w-full" onClick={onSignup}>
          Create account
        </Button>

        <Button
          variant="outline"
          className="w-full"
          onClick={onLogin}
        >
          Log in
        </Button>
      </CardContent>
    </Card>
  )
}
