import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import logoWowrack from "@/assets/wowrack-logo.png";
import { useCandidateAuth } from "@/contexts/CandidateAuthContext";

const navLinks = [
  { name: "Home", path: "/" },
  { name: "News & Culture", path: "/news" },
  { name: "Careers", path: "/careers" },
];

export function PublicHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { candidate, isLoggedIn } = useCandidateAuth();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-card/80 backdrop-blur-lg">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center">
          <img src={logoWowrack} alt="Wowrack Logo" className="h-8 w-auto" />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                location.pathname === link.path
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {isLoggedIn && candidate ? (
            <Link to="/candidate" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <span className="text-sm font-medium text-foreground">{candidate.fullName}</span>
              <Avatar className="h-8 w-8">
                <AvatarImage src={candidate.avatarUrl} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {getInitials(candidate.fullName)}
                </AvatarFallback>
              </Avatar>
            </Link>
          ) : (
            <>
              <Button 
                variant="ghost" 
                asChild 
                className="text-muted-foreground hover:text-foreground hover:bg-transparent"
              >
                <Link to="/candidate-login">Login</Link>
              </Button>
              <Button 
                asChild 
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-5 shadow-sm"
              >
                <Link to="/candidate-register">Register</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 hover:bg-muted rounded-lg"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-border bg-card"
          >
            <nav className="container py-4 flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === link.path
                      ? "bg-muted text-primary"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              <div className="pt-2 border-t border-border mt-2 flex flex-col gap-2">
                {isLoggedIn && candidate ? (
                  <Link
                    to="/candidate"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={candidate.avatarUrl} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {getInitials(candidate.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{candidate.fullName}</p>
                      <p className="text-xs text-muted-foreground">Go to Dashboard</p>
                    </div>
                  </Link>
                ) : (
                  <>
                    <Button variant="ghost" asChild className="justify-start">
                      <Link to="/candidate-login" onClick={() => setIsOpen(false)}>Login</Link>
                    </Button>
                    <Button asChild className="bg-primary text-primary-foreground">
                      <Link to="/candidate-register" onClick={() => setIsOpen(false)}>Register</Link>
                    </Button>
                  </>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
