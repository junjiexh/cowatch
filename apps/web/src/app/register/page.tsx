"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  Lock,
  User,
  ArrowRight,
  Sparkles,
  Check,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/icons/logo";
import { BackgroundEffects } from "@/components/lobby/background-effects";
import { useAuth } from "@/stores/auth-store";
import { cn } from "@/lib/utils";

export default function RegisterPage() {
  const router = useRouter();
  const { register, isAuthenticated } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
  });

  // Redirect if already authenticated
  if (isAuthenticated) {
    router.push("/");
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    // Validate password strength
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      setIsLoading(false);
      return;
    }

    const result = await register(formData.username, formData.password);

    if (result.success) {
      router.push("/");
    } else {
      setError(result.error || "Registration failed");
    }

    setIsLoading(false);
  };

  // Password strength indicators
  const passwordChecks = [
    { label: "At least 6 characters", valid: formData.password.length >= 6 },
    { label: "Contains uppercase", valid: /[A-Z]/.test(formData.password) },
    { label: "Contains number", valid: /[0-9]/.test(formData.password) },
  ];

  const passwordsMatch =
    formData.password === formData.confirmPassword &&
    formData.confirmPassword.length > 0;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-12">
      <BackgroundEffects />

      {/* Main Card */}
      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-6 duration-700">
        {/* Logo */}
        <div className="flex justify-center mb-8 animate-in fade-in duration-700 fill-mode-both">
          <Link href="/">
            <Logo size="lg" />
          </Link>
        </div>

        {/* Glass Card */}
        <div className="glass-card rounded-2xl p-8 relative overflow-hidden">
          {/* Gradient top border */}
          <div
            className="absolute top-0 left-0 right-0 h-1"
            style={{
              background: `linear-gradient(90deg, oklch(0.7 0.2 320), oklch(0.75 0.15 195))`,
            }}
          />

          {/* Header */}
          <div
            className="text-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
            style={{ animationDelay: "100ms" }}
          >
            <h1 className="text-2xl font-bold text-white mb-2">
              Create your account
            </h1>
            <p className="text-white/50 text-sm">
              Join the party and watch together
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2 animate-in fade-in duration-200">
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
              <span className="text-sm text-red-400">{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username Field */}
            <div
              className="space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
              style={{ animationDelay: "150ms" }}
            >
              <Label htmlFor="username" className="text-white/70 text-sm">
                Username
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="coolwatcher"
                  value={formData.username}
                  onChange={handleChange}
                  minLength={2}
                  maxLength={20}
                  className={cn(
                    "pl-10 h-11 bg-white/5 border-white/10 text-white placeholder:text-white/30",
                    "focus-visible:border-[oklch(0.75_0.15_195)] focus-visible:ring-[oklch(0.75_0.15_195_/_20%)]",
                    "transition-all duration-300"
                  )}
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div
              className="space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
              style={{ animationDelay: "200ms" }}
            >
              <Label htmlFor="password" className="text-white/70 text-sm">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  minLength={6}
                  maxLength={100}
                  className={cn(
                    "pl-10 pr-10 h-11 bg-white/5 border-white/10 text-white placeholder:text-white/30",
                    "focus-visible:border-[oklch(0.75_0.15_195)] focus-visible:ring-[oklch(0.75_0.15_195_/_20%)]",
                    "transition-all duration-300"
                  )}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              {/* Password Strength Indicators */}
              {formData.password && (
                <div className="space-y-1.5 pt-2 animate-in fade-in duration-300">
                  {passwordChecks.map((check, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex items-center gap-2 text-xs transition-colors duration-200",
                        check.valid ? "text-emerald-400" : "text-white/30"
                      )}
                    >
                      <Check
                        className={cn(
                          "h-3 w-3 transition-all duration-200",
                          check.valid ? "opacity-100 scale-100" : "opacity-50 scale-75"
                        )}
                      />
                      {check.label}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div
              className="space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
              style={{ animationDelay: "250ms" }}
            >
              <Label
                htmlFor="confirmPassword"
                className="text-white/70 text-sm"
              >
                Confirm Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={cn(
                    "pl-10 pr-10 h-11 bg-white/5 border-white/10 text-white placeholder:text-white/30",
                    "focus-visible:border-[oklch(0.75_0.15_195)] focus-visible:ring-[oklch(0.75_0.15_195_/_20%)]",
                    "transition-all duration-300",
                    formData.confirmPassword &&
                      (passwordsMatch
                        ? "border-emerald-400/50"
                        : "border-red-400/50")
                  )}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {formData.confirmPassword && !passwordsMatch && (
                <p className="text-xs text-red-400 animate-in fade-in duration-200">
                  Passwords do not match
                </p>
              )}
            </div>

            {/* Submit Button */}
            <div
              className="pt-2 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
              style={{ animationDelay: "300ms" }}
            >
              <Button
                type="submit"
                disabled={isLoading || !passwordsMatch || formData.password.length < 6}
                className={cn(
                  "w-full h-11 text-base font-medium",
                  "bg-gradient-to-r from-[oklch(0.7_0.2_320)] to-[oklch(0.75_0.15_195)]",
                  "hover:from-[oklch(0.75_0.2_320)] hover:to-[oklch(0.8_0.15_195)]",
                  "text-white shadow-lg",
                  "transition-all duration-300",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
                style={{
                  boxShadow: `0 0 20px oklch(0.7 0.2 320 / 30%), 0 0 40px oklch(0.75 0.15 195 / 20%)`,
                }}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 animate-pulse" />
                    Creating account...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    Create account
                    <ArrowRight className="h-4 w-4" />
                  </div>
                )}
              </Button>
            </div>

            {/* Terms */}
            <p
              className="text-xs text-white/30 text-center animate-in fade-in duration-500 fill-mode-both"
              style={{ animationDelay: "350ms" }}
            >
              By signing up, you agree to our{" "}
              <Link
                href="/terms"
                className="text-white/50 hover:text-[oklch(0.75_0.15_195)] transition-colors"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy"
                className="text-white/50 hover:text-[oklch(0.75_0.15_195)] transition-colors"
              >
                Privacy Policy
              </Link>
            </p>
          </form>

          {/* Divider */}
          <div
            className="flex items-center gap-4 my-8 animate-in fade-in duration-500 fill-mode-both"
            style={{ animationDelay: "400ms" }}
          >
            <div className="flex-1 border-t border-white/10" />
            <span className="text-xs uppercase text-white/30">
              or sign up with
            </span>
            <div className="flex-1 border-t border-white/10" />
          </div>

          {/* Social Login */}
          <div
            className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
            style={{ animationDelay: "450ms" }}
          >
            <Button
              type="button"
              variant="outline"
              className="h-11 bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white hover:border-white/20 transition-all duration-300"
            >
              <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-11 bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white hover:border-white/20 transition-all duration-300"
            >
              <svg
                className="h-5 w-5 mr-2"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              GitHub
            </Button>
          </div>

          {/* Login Link */}
          <p
            className="text-center text-sm text-white/40 mt-8 animate-in fade-in duration-500 fill-mode-both"
            style={{ animationDelay: "500ms" }}
          >
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-[oklch(0.75_0.15_195)] hover:text-[oklch(0.8_0.15_195)] font-medium transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>

        {/* Back to Home */}
        <div
          className="text-center mt-6 animate-in fade-in duration-500 fill-mode-both"
          style={{ animationDelay: "550ms" }}
        >
          <Link
            href="/"
            className="text-sm text-white/30 hover:text-white/60 transition-colors inline-flex items-center gap-1"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
