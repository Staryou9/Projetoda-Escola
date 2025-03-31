import { Switch, Route } from "wouter";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import { ProtectedRoute } from "./lib/protected-route";

// Importando páginas do bibliotecário
import LibrarianDashboard from "@/pages/librarian/dashboard";
import LibrarianBooks from "@/pages/librarian/books";
import LibrarianStudents from "@/pages/librarian/students";
import LibrarianLoans from "@/pages/librarian/loans";

// Importando páginas do estudante
import StudentCatalog from "@/pages/student/catalog";
import StudentMyLoans from "@/pages/student/my-loans";
import StudentHistory from "@/pages/student/history";
import StudentProfile from "@/pages/student/profile";

function Router() {
  return (
    <Switch>
      {/* Rota de autenticação (pública) */}
      <Route path="/auth" component={AuthPage} />

      {/* Rotas do bibliotecário (protegidas) */}
      <ProtectedRoute path="/" component={LibrarianDashboard} role="bibliotecario" />
      <ProtectedRoute path="/books" component={LibrarianBooks} role="bibliotecario" />
      <ProtectedRoute path="/students" component={LibrarianStudents} role="bibliotecario" />
      <ProtectedRoute path="/loans" component={LibrarianLoans} role="bibliotecario" />

      {/* Rotas do estudante (protegidas) */}
      <ProtectedRoute path="/catalog" component={StudentCatalog} role="estudante" />
      <ProtectedRoute path="/my-loans" component={StudentMyLoans} role="estudante" />
      <ProtectedRoute path="/history" component={StudentHistory} role="estudante" />
      <ProtectedRoute path="/profile" component={StudentProfile} role="estudante" />

      {/* Fallback para 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return <Router />;
}

export default App;
