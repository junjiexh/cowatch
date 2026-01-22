"use client";

import Link from "next/link";
import { Logo } from "@/components/icons/logo";
import { Button } from "@/components/ui/button";
import { User, LogIn, LogOut } from "lucide-react";
import { useAuth } from "@/stores/auth-store";

export function Navbar() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      <div className="glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/">
              <Logo size="md" />
            </Link>
            <div className="flex items-center gap-3">
              {isLoading ? (
                // Loading skeleton
                <div className="h-9 w-24 bg-white/5 rounded-md animate-pulse" />
              ) : isAuthenticated && user ? (
                // Logged in state
                <>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                    <div className="h-7 w-7 rounded-full bg-gradient-to-br from-[oklch(0.75_0.15_195)] to-[oklch(0.7_0.2_320)] flex items-center justify-center">
                      <span className="text-xs font-medium text-white">
                        {user.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm text-white/80 font-medium max-w-[100px] truncate">
                      {user.username}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={logout}
                    className="hover:bg-white/10 transition-all duration-300 text-white/60 hover:text-white"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </>
              ) : (
                // Logged out state
                <>
                  <Button
                    variant="ghost"
                    asChild
                    className="hover:bg-white/10 transition-all duration-300 text-white/60 hover:text-white"
                  >
                    <Link href="/login">
                      <LogIn className="h-4 w-4 mr-2" />
                      Login
                    </Link>
                  </Button>
                  <Button
                    asChild
                    className="bg-gradient-to-r from-[oklch(0.75_0.15_195)] to-[oklch(0.65_0.17_200)] hover:from-[oklch(0.8_0.15_195)] hover:to-[oklch(0.7_0.17_200)] text-white neon-glow-subtle hover:neon-glow transition-all duration-300"
                  >
                    <Link href="/register">
                      <User className="h-4 w-4 mr-2" />
                      Sign up
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
