import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  BookMarked,
  History,
  User,
  LogOut,
  Menu,
  X
} from "lucide-react";

interface StudentLayoutProps {
  children: React.ReactNode;
  title: string;
}

export default function StudentLayout({ children, title }: StudentLayoutProps) {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  // Links da navegação
  const navLinks = [
    { href: "/catalog", label: "Catálogo", icon: <BookOpen className="mr-2 h-5 w-5" /> },
    { href: "/my-loans", label: "Meus Empréstimos", icon: <BookMarked className="mr-2 h-5 w-5" /> },
    { href: "/history", label: "Histórico", icon: <History className="mr-2 h-5 w-5" /> },
    { href: "/profile", label: "Meu Perfil", icon: <User className="mr-2 h-5 w-5" /> },
  ];

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar - Desktop */}
      <aside className="bg-primary text-white w-64 flex-shrink-0 hidden md:flex flex-col overflow-y-auto">
        <div className="p-5 border-b border-primary-hover">
          <h1 className="font-inter font-bold text-xl">Biblioteca Digital</h1>
          <p className="text-gray-300 text-sm">Portal do Estudante</p>
        </div>
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href}>
                  <a className={`flex items-center py-2 px-4 rounded-md ${
                    location === link.href ? 'bg-primary-hover' : 'hover:bg-primary-hover'
                  } text-white font-medium transition-colors`}>
                    {link.icon}
                    {link.label}
                  </a>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="p-4 border-t border-primary-hover">
          <div className="mb-4 px-4 py-2">
            <p className="text-sm text-gray-300">Logado como</p>
            <p className="font-medium">{user?.nome}</p>
          </div>
          <Button 
            variant="outline" 
            onClick={handleLogout} 
            className="w-full justify-start text-white border-white/20 hover:bg-primary-hover hover:text-white"
            disabled={logoutMutation.isPending}
          >
            <LogOut className="mr-2 h-5 w-5" />
            {logoutMutation.isPending ? "Saindo..." : "Sair"}
          </Button>
        </div>
      </aside>

      {/* Header Mobile */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-primary text-white z-10 p-4 flex justify-between items-center">
        <h1 className="font-inter font-bold text-lg">Biblioteca Digital</h1>
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-white hover:bg-primary-hover" 
          onClick={() => setMobileMenuOpen(true)}
        >
          <Menu className="h-6 w-6" />
        </Button>
      </div>

      {/* Mobile Menu (quando aberto) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-primary z-50 flex flex-col md:hidden">
          <div className="flex justify-between items-center p-4 border-b border-primary-hover">
            <h1 className="font-inter font-bold text-xl text-white">Biblioteca Digital</h1>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white hover:bg-primary-hover" 
              onClick={closeMobileMenu}
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
          <nav className="flex-1 p-4">
            <ul className="space-y-4">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>
                    <a 
                      className={`flex items-center py-3 px-4 rounded-md ${
                        location === link.href ? 'bg-primary-hover' : 'hover:bg-primary-hover'
                      } text-white font-medium transition-colors`}
                      onClick={closeMobileMenu}
                    >
                      {link.icon}
                      {link.label}
                    </a>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="p-4 border-t border-primary-hover">
            <div className="mb-4 px-4 py-2">
              <p className="text-sm text-gray-300">Logado como</p>
              <p className="font-medium text-white">{user?.nome}</p>
            </div>
            <Button 
              variant="outline" 
              onClick={handleLogout} 
              className="w-full justify-start text-white border-white/20 hover:bg-primary-hover hover:text-white"
              disabled={logoutMutation.isPending}
            >
              <LogOut className="mr-2 h-5 w-5" />
              {logoutMutation.isPending ? "Saindo..." : "Sair"}
            </Button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background pt-16 md:pt-0">
        <div className="p-6">
          <h2 className="text-2xl font-bold font-inter mb-6">{title}</h2>
          {children}
        </div>
      </main>
    </div>
  );
}
