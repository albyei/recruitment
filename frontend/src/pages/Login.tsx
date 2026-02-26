import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import logoWowrack from "@/assets/wowrack-logo.png";
import { useAuth } from "@/contexts/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const success = await login(email, password);
    setIsLoading(false);

    if (success) {
      toast.success("Login successful!");
      // Navigate to the first available portal dashboard
      navigate("/dashboard");
    } else {
      toast.error("Invalid credentials. Try: siti@wowrack.com, budi@wowrack.com, rizky@wowrack.com, dewi@wowrack.com, or ahmad@wowrack.com");
    }
  };

  return (
    <div className="min-h-screen flex relative">
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        asChild
        className="absolute top-6 left-6 z-10"
      >
        <Link to="/">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Link>
      </Button>

      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md"
        >
          <Link to="/" className="flex items-center mb-8">
            <img src={logoWowrack} alt="Wowrack Logo" className="h-10 w-auto" />
          </Link>

          <h1 className="text-2xl font-bold mb-2">Wowrack Recruitment Portal</h1>
          <p className="text-muted-foreground mb-8">Sign in to access the recruitment management system</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@wowrack.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 p-4 rounded-lg bg-muted/50 border">
            <p className="text-xs font-medium text-muted-foreground mb-2">Demo accounts:</p>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p><span className="font-medium">HR:</span> siti@wowrack.com</p>
              <p><span className="font-medium">Manager:</span> budi@wowrack.com</p>
              <p><span className="font-medium">Admin:</span> rizky@wowrack.com</p>
              <p><span className="font-medium">HR + Admin:</span> dewi@wowrack.com</p>
              <p><span className="font-medium">Manager + HR:</span> ahmad@wowrack.com</p>
            </div>
          </div>

          <div className="mt-8 text-center">
            <Link to="/forgot-password" className="text-sm text-muted-foreground hover:text-secondary">
              Forgot your password?
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Right Side - Hero */}
      <div className="hidden lg:flex flex-1 gradient-hero items-center justify-center p-12">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-lg text-center"
        >
          <h2 className="text-3xl font-bold text-primary-foreground mb-4">
            HR Management Portal
          </h2>
          <p className="text-primary-foreground/80 text-lg">
            Manage candidates, review applications, and streamline your hiring process with Wowrack Indonesia Recruitment.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
