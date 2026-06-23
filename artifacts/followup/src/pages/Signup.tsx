import { useState } from "react";
  import { useLocation, Link } from "wouter";
  import { useAuth } from "@/contexts/AuthContext";
  import { supabaseConfigured } from "@/lib/supabase";
  import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
  import { Input } from "@/components/ui/input";
  import { Button } from "@/components/ui/button";
  import { Label } from "@/components/ui/label";
  import { CheckCircle2, AlertTriangle } from "lucide-react";

  export default function Signup() {
    const [, navigate] = useLocation();
    const { signUp } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [needsConfirmation, setNeedsConfirmation] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
      e.preventDefault();
      setError(null);
      if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
      setLoading(true);
      const { error: authError, needsConfirmation: confirm } = await signUp(email, password);
      setLoading(false);
      if (authError) { setError(authError.message); }
      else if (confirm) { setNeedsConfirmation(true); }
      else { navigate("/dashboard"); }
    }

    if (needsConfirmation) {
      return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex flex-col items-center justify-center px-4">
          <Card className="w-full max-w-sm text-center">
            <CardContent className="pt-8 pb-8 space-y-4">
              <div className="flex justify-center"><CheckCircle2 className="h-12 w-12 text-emerald-600" /></div>
              <h2 className="text-xl font-bold">Check your email</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We sent a confirmation link to{" "}
                <span className="font-medium text-foreground">{email}</span>.
                Click it to activate your account, then sign in.
              </p>
              <Link href="/login"><Button variant="outline" className="w-full mt-2">Go to sign in</Button></Link>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex flex-col items-center justify-center px-4">
        <div className="mb-8 text-center">
          <Link href="/"><span className="font-bold text-2xl text-foreground tracking-tight cursor-pointer hover:opacity-80 transition-opacity">FollowUp</span></Link>
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

        <Card className="w-full max-w-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Create your account</CardTitle>
            <CardDescription>Start tracking leads in under a minute.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" autoComplete="email" placeholder="you@example.com"
                  value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" autoComplete="new-password" placeholder="At least 6 characters"
                  value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</p>
              )}
              <Button type="submit" className="w-full bg-emerald-700 hover:bg-emerald-800 text-white" disabled={loading}>
                {loading ? "Creating account…" : "Create account"}
              </Button>
            </form>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-emerald-700 hover:underline">Sign in</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
  