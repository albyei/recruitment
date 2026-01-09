import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import logoWowrack from "@/assets/wowrack-logo.png";

type UserRole = "hr" | "manager" | "admin";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (role: UserRole) => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);

    toast.success("Login successful!");
    
    switch (role) {
      case "hr":
        navigate("/hr");
        break;
      case "manager":
        navigate("/manager");
        break;
      case "admin":
        navigate("/admin");
        break;
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

          <Tabs defaultValue="hr" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="hr">HR</TabsTrigger>
              <TabsTrigger value="manager">Hiring Manager</TabsTrigger>
              <TabsTrigger value="admin">Admin</TabsTrigger>
            </TabsList>

            <TabsContent value="hr">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleLogin("hr");
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="email-hr">HR Email</Label>
                  <Input
                    id="email-hr"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="hr@company.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-hr">Password</Label>
                  <Input
                    id="password-hr"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign in as HR"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="manager">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleLogin("manager");
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="email-manager">Work Email</Label>
                  <Input
                    id="email-manager"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-manager">Password</Label>
                  <Input
                    id="password-manager"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign in as Manager"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="admin">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleLogin("admin");
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="email-admin">Admin Email</Label>
                  <Input
                    id="email-admin"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@company.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-admin">Password</Label>
                  <Input
                    id="password-admin"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign in as Admin"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

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
