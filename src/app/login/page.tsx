import { signIn } from "@/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Sparkles, TrendingUp, ShoppingBag } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-background via-muted/30 to-background">
      <Card className="w-full max-w-md border-2 border-primary/20 shadow-2xl backdrop-blur-sm">
        <CardHeader className="text-center space-y-3 pb-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner">
            <ShoppingBag className="h-8 w-8 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl font-black tracking-tight">
              Wishlist Manager <span className="text-primary">PH</span> 🇵🇭
            </CardTitle>
            <CardDescription className="text-sm font-medium mt-1">
              Smart impulse-control & gamified budgeting
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-3 text-left">
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs">
              <span className="font-bold flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                <ShieldCheck className="h-4 w-4" /> 🛡️ Needs Fortress
              </span>
              <p className="text-muted-foreground mt-1">
                Protect essentials & emergency funds.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs">
              <span className="font-bold flex items-center gap-1.5 text-purple-600 dark:text-purple-400">
                <Sparkles className="h-4 w-4" /> ✨ Want Optimizer
              </span>
              <p className="text-muted-foreground mt-1">
                Time Shopee sales & avoid impulse debt.
              </p>
            </div>
          </div>

          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/" });
            }}
          >
            <Button
              type="submit"
              className="w-full h-12 text-base font-bold shadow-lg hover:shadow-primary/25 gap-3"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              Sign in with Google
            </Button>
          </form>

          <div className="space-y-1.5 text-center">
            <p className="text-xs text-muted-foreground">
              Strict authentication enabled. Only authorized Google accounts can access this instance.
            </p>
            <p className="text-[11px] font-mono text-muted-foreground/60">
              v{process.env.NEXT_PUBLIC_APP_VERSION || "2.0.0"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

