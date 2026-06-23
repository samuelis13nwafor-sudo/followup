import { useState } from "react";
  import { Link } from "wouter";
  import { useAuth } from "@/contexts/AuthContext";
  import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
  import { Input } from "@/components/ui/input";
  import { Button } from "@/components/ui/button";
  import { Label } from "@/components/ui/label";
  import { Mail } from "lucide-react";

  export default function ForgotPassword() {
    const { sendPasswordReset } = useAuth();
    const [email, setEmail] = useState("");
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent) {
      e.preventDefault();
      setError(null);
      setLoading(true);
      const { error: authError } = await sendPasswordReset(email);
      setLoading(false);
      if (authError) { setError(authError.message); } else { setSent(true); }
    }

    if (sent) {
      return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex flex-col items-center justify-center px-4">
          <Card className="w-full max-w-sm text-center">
            <CardContent className="pt-8 pb-8 space-y-4">
              <div className="flex justify-center"><Mail className="h-12 w-12 text-emerald-600" /></div>
              <h2 className="text-xl font-bold">Check your email</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                If an account exists for <span className="font-medium text-foreground">{email}</span>,
                we sent a password reset link. It expires in 1 hour.
              </p>
              <Link href="/login"><Button variant="outline" className="w-full mt-2">Back to sign in</Button></Link>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex flex-col items-center justify-center px-4">
        <div className="mb-8 text-center">
          <Link href="/"><span className="font-bold text-2xl text-foreground tracking-tight cursor-pointer hover:opacity-80 transition-opacity">FollowUp</span></Link>
        </div>
        <Card className="w-full max-w-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Reset your password</CardTitle>
            <CardDescription>Enter your email and we'll send a reset link.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" autoComplete="email" placeholder="you@example.com"
                  value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</p>
              )}
              <Button type="submit" className="w-full bg-emerald-700 hover:bg-emerald-800 text-white" disabled={loading}>
                {loading ? "Sending…" : "Send reset link"}
              </Button>
            </form>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              <Link href="/login" className="font-medium text-emerald-700 hover:underline">Back to sign in</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
  