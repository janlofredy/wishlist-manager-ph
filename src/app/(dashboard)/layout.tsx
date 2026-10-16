import { auth, signOut } from "@/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ShoppingBag,
  LayoutDashboard,
  Wallet,
  Sparkles,
  Calendar,
  LogOut,
  Moon,
  Sun,
  ShieldCheck,
} from "lucide-react";
import Image from "next/image";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5 font-black text-lg">
            <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <span>
              Wishlist <span className="text-primary">PH</span>
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-semibold text-muted-foreground">
            <Link
              href="/"
              className="px-3 py-1.5 rounded-lg hover:text-foreground hover:bg-muted/50 transition-colors flex items-center gap-1.5"
            >
              <LayoutDashboard className="h-4 w-4" /> Dashboard
            </Link>
            <Link
              href="/wishlists"
              className="px-3 py-1.5 rounded-lg hover:text-foreground hover:bg-muted/50 transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="h-4 w-4 text-purple-500" /> Wishlists
            </Link>
            <Link
              href="/budget"
              className="px-3 py-1.5 rounded-lg hover:text-foreground hover:bg-muted/50 transition-colors flex items-center gap-1.5"
            >
              <Wallet className="h-4 w-4 text-emerald-500" /> Smart Budget
            </Link>
            <Link
              href="/advisor"
              className="px-3 py-1.5 rounded-lg hover:text-foreground hover:bg-muted/50 transition-colors flex items-center gap-1.5"
            >
              <ShieldCheck className="h-4 w-4 text-blue-500" /> Delay Advisor
            </Link>
            <Link
              href="/sales"
              className="px-3 py-1.5 rounded-lg hover:text-foreground hover:bg-muted/50 transition-colors flex items-center gap-1.5"
            >
              <Calendar className="h-4 w-4 text-orange-500" /> PH Sales
            </Link>
          </nav>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-3">
            {session?.user && (
              <div className="flex items-center gap-2 pl-2">
                {session.user.image ? (
                  <Image
                    src={session.user.image}
                    alt={session.user.name || "User"}
                    width={32}
                    height={32}
                    className="rounded-full ring-2 ring-primary/20"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">
                    {session.user.name?.[0] || "U"}
                  </div>
                )}
                <span className="hidden sm:inline-block text-xs font-bold text-foreground">
                  {session.user.name?.split(" ")[0]}
                </span>
                <form
                  action={async () => {
                    "use server";
                    await signOut({ redirectTo: "/login" });
                  }}
                >
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                    <LogOut className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8">
        {children}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur-md p-2 z-50 flex items-center justify-around text-[10px] font-bold">
        <Link href="/" className="flex flex-col items-center gap-1 py-1 text-muted-foreground hover:text-primary">
          <LayoutDashboard className="h-5 w-5" /> Home
        </Link>
        <Link href="/wishlists" className="flex flex-col items-center gap-1 py-1 text-muted-foreground hover:text-primary">
          <Sparkles className="h-5 w-5 text-purple-500" /> Wishlist
        </Link>
        <Link href="/budget" className="flex flex-col items-center gap-1 py-1 text-muted-foreground hover:text-primary">
          <Wallet className="h-5 w-5 text-emerald-500" /> Budget
        </Link>
        <Link href="/advisor" className="flex flex-col items-center gap-1 py-1 text-muted-foreground hover:text-primary">
          <ShieldCheck className="h-5 w-5 text-blue-500" /> Advisor
        </Link>
        <Link href="/sales" className="flex flex-col items-center gap-1 py-1 text-muted-foreground hover:text-primary">
          <Calendar className="h-5 w-5 text-orange-500" /> Sales
        </Link>
      </div>
    </div>
  );
}
