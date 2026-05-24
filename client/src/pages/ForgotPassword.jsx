import { useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { authService } from "@/services/authService";
import { APP_NAME } from "@/constants";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [resetUrl, setResetUrl] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setResetUrl("");
    setError("");
    try {
      const res = await authService.forgotPassword(email);
      const data = res.data?.data;
      setMessage(data?.message || res.data?.message || "Check your email for reset instructions.");
      if (data?.resetUrl) setResetUrl(data.resetUrl);
    } catch (err) {
      setError(err.message || "Request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-border/80">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Sparkles className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl">Forgot password</CardTitle>
          <CardDescription>{APP_NAME} — we will send you a reset link</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs text-muted-foreground">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            {message && <p className="text-sm text-emerald-400">{message}</p>}
            {resetUrl && (
              <div className="rounded-lg border border-border/60 bg-muted/20 p-3 text-xs">
                <p className="mb-1 text-muted-foreground">Development reset link:</p>
                <a href={resetUrl} className="break-all text-primary hover:underline">
                  Open reset page
                </a>
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Sending..." : "Send reset link"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            <Link to="/" className="text-primary hover:underline">
              Back to sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
