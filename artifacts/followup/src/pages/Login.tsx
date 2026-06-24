import { useState } from "react";
  import { useLocation, Link } from "wouter";
  import { useAuth } from "@/contexts/AuthContext";
  import { supabaseConfigured } from "@/lib/supabase";
  import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
  import { Input } from "@/components/ui/input";
  import { Button } from "@/components/ui/button";
  import { Label } from "@/components/ui/label";
  import { AlertTriangle } from "lucide-react";

  export default function Login() {
    const [, navigate] = useLocation();
    const { signIn } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
      e.preventDefault();
      setError(null);
      setLoading(true);
      const { error: authError } = await signIn(email, password);
      setLoading(false);
      if (authError) {
        setError(authError.message);
      } else {
        navigate("/dashboard");
      }
    }

    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex flex-col items-center justify-center px-4">
        <div className="mb-8 text-center">
          <Link href="/">
            <span className="font-bold text-2xl text-foreground tracking-tight cursor-pointer hover:opacity-80 transition-opacity">
              FollowUp
            </span>
          </Link>
          <p className="text-sm text-muted-foreground mt-1">Lead tracking for service businesses</p>
        </div>

        {!supabaseConfigured && (
          <div className="w-full max-w-sm mb-4 flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
            <div>
              <p className="font-semibold">Supabase not configured</p>
              <p className="text-xs mt-0.5">
                Set <code className="font-mono bg-amber-100 px-1 rounded">VITE_SUPABASE_URL</code> and{" "}
                <code className="font-mono bg-amber-100 px-1 rounded">VITE_SUPABASE_ANON_KEY</code> in your environment secrets.
              </p>
            </div>
          </div>
        )}

        {/* TEMP: env var debug panel */}
        <div className="w-full max-w-sm mb-4 rounded-lg border border-slate-200 bg-white px-4 py-3 text-xs space-y-1.5 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Env Config Check</p>
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-500 shrink-0">VITE_SUPABASE_URL</span>
            <span className={`font-semibold truncate max-w-[180px] ${import.meta.env.VITE_SUPABASE_URL ? "text-emerald-600" : "text-red-500"}`}>
              {import.meta.env.VITE_SUPABASE_URL
                ? "✓ " + String(import.meta.env.VITE_SUPABASE_URL).replace("https://","").slice(0,22) + "…"
                : "✗ missing"}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-500 shrink-0">VITE_SUPABASE_ANON_KEY</span>
            <span className={`font-semibold ${import.meta.env.VITE_SUPABASE_ANON_KEY ? "text-emerald-600" : "text-red-500"}`}>
              {import.meta.env.VITE_SUPABASE_ANON_KEY
                ? `✓ set (${String(import.meta.env.VITE_SUPABASE_ANON_KEY).length} chars)`
                : "✗ missing"}
            </span>
          </div>
        </div>
        <Card className="w-full max-w-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Sign in</CardTitle>
            <CardDescription>Enter your email and password to continue.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" autoComplete="email" placeholder="you@example.com"
                  value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link href="/forgot-password" className="text-xs text-emerald-700 hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <Input id="password" type="password" autoComplete="current-password" placeholder="••••••••"
                  value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</p>
              )}
              <Button type="submit" className="w-full bg-emerald-700 hover:bg-emerald-800 text-white" disabled={loading}>
                {loading ? "Signing in…" : "Sign in"}
              </Button>
            </form>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link href="/signup" className="font-medium text-emerald-700 hover:underline">Sign up</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
  