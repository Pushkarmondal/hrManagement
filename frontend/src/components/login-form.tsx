import * as React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type FormState = {
  email: string
  password: string
}

export function LoginForm({ onGoToSignup }: { onGoToSignup?: () => void }) {
  const [form, setForm] = React.useState<FormState>({
    email: "",
    password: "",
  })
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function validate(values: FormState): string | null {
    if (!values.email.trim()) return "Email is required"
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) return "Enter a valid email"
    if (values.password.length < 8) return "Password must be at least 8 characters"
    return null
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    const message = validate(form)
    if (message) {
      setError(message)
      return
    }

    setIsSubmitting(true)
    try {
      // TODO: wire to backend endpoint (e.g. POST /admin/auth/signup or bootstrap-only flow)
      await new Promise((r) => setTimeout(r, 600))
      setSuccess("Account created. You can now log in.")
      setForm({ email: "", password: "" })
    } catch {
      setError("Signup failed. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Login</CardTitle>
        <CardDescription>Log in to access the admin dashboard.</CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2 text-left">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              placeholder="pushkar@glowbook.com"
              autoComplete="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
            />
          </div>

          <div className="space-y-2 text-left">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="********"
              autoComplete="current-password"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
            />
          </div>
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          {success ? (
            <p className="text-sm text-green-600" role="status">
              {success}
            </p>
          ) : null}
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button className="w-full" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Logging in..." : "Login"}
          </Button>
          <p className="text-sm text-muted-foreground">
            Don't have an account?{" "}
            <a
              className="text-primary underline-offset-4 hover:underline"
              href="#"
              onClick={(e) => {
                e.preventDefault()
                onGoToSignup?.()
              }}
            >
              Sign up
            </a>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
