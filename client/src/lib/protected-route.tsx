import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";
import { UserRole } from "@shared/schema";

export function ProtectedRoute({
  path,
  component: Component,
  role
}: {
  path: string;
  component: () => React.JSX.Element;
  role?: UserRole;
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  // Se não estiver autenticado, redireciona para a página de login
  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // Se um papel específico for requerido e o usuário não tiver esse papel
  if (role && user.role !== role) {
    // Redirecionar para a página apropriada com base no papel do usuário
    const redirectPath = user.role === "bibliotecario" ? "/" : "/catalog";
    return (
      <Route path={path}>
        <Redirect to={redirectPath} />
      </Route>
    );
  }

  // Se tudo estiver ok, renderiza o componente
  return <Route path={path} component={Component} />;
}
