import { useQuery } from "@tanstack/react-query";
import LibrarianLayout from "@/components/layout/librarian-layout";
import { Book, Loan, User } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Users, RefreshCw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState } from "react";
import BookForm from "@/components/book/book-form";
import StudentForm from "@/components/student/student-form";
import LoanForm from "@/components/loan/loan-form";

export default function LibrarianDashboard() {
  const [isBookFormOpen, setIsBookFormOpen] = useState(false);
  const [isStudentFormOpen, setIsStudentFormOpen] = useState(false);
  const [isLoanFormOpen, setIsLoanFormOpen] = useState(false);
  
  // Buscar dados para o dashboard
  const { data: books = [] } = useQuery<Book[]>({
    queryKey: ["/api/books"],
  });

  const { data: students = [] } = useQuery<User[]>({
    queryKey: ["/api/students"],
  });

  const { data: loans = [] } = useQuery<Loan[]>({
    queryKey: ["/api/loans"],
  });

  // Calcular estatísticas
  const totalBooks = books.length;
  const totalStudents = students.length;
  const activeLoans = loans.filter(loan => loan.status === "aprovado" || loan.status === "pendente").length;
  const overdueLoans = loans.filter(loan => {
    const dueDate = new Date(loan.dataDevolucaoPrevista);
    return loan.status === "aprovado" && dueDate < new Date();
  }).length;

  // Top 4 livros mais emprestados
  const bookLoanCount = books.map(book => {
    const loanCount = loans.filter(loan => loan.bookId === book.id).length;
    return { 
      id: book.id,
      titulo: book.titulo,
      loanCount 
    };
  }).sort((a, b) => b.loanCount - a.loanCount).slice(0, 4);

  // Obter atividades recentes (últimos 4 empréstimos/devoluções)
  const recentActivities = [...loans]
    .sort((a, b) => new Date(b.dataEmprestimo).getTime() - new Date(a.dataEmprestimo).getTime())
    .slice(0, 4);

  // Próximas devoluções (4 empréstimos com devolução mais próxima)
  const upcomingReturns = loans
    .filter(loan => loan.status === "aprovado")
    .sort((a, b) => new Date(a.dataDevolucaoPrevista).getTime() - new Date(b.dataDevolucaoPrevista).getTime())
    .slice(0, 4);

  // Obter nome do usuário a partir do ID
  const getUserName = (userId: number) => {
    const user = students.find(s => s.id === userId);
    return user ? user.nome : "Usuário desconhecido";
  };

  // Obter título do livro a partir do ID
  const getBookTitle = (bookId: number) => {
    const book = books.find(b => b.id === bookId);
    return book ? book.titulo : "Livro desconhecido";
  };

  // Função para formatar data
  const formatDate = (date: Date | string) => {
    return format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
  };

  return (
    <LibrarianLayout title="Dashboard">
      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-primary">
                <BookOpen className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-gray-500 text-sm">Total de Livros</p>
                <h3 className="font-bold text-2xl">{totalBooks}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-secondary">
                <Users className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-gray-500 text-sm">Estudantes</p>
                <h3 className="font-bold text-2xl">{totalStudents}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                <RefreshCw className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-gray-500 text-sm">Empréstimos Ativos</p>
                <h3 className="font-bold text-2xl">{activeLoans}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-red-100 text-red-600">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-gray-500 text-sm">Atrasados</p>
                <h3 className="font-bold text-2xl">{overdueLoans}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Atividade Recente */}
      <Card className="mb-8">
        <CardContent className="p-0">
          <div className="p-6 border-b border-gray-200">
            <h3 className="font-bold font-inter text-lg">Atividade Recente</h3>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ação</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Detalhes</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentActivities.length > 0 ? (
                  recentActivities.map(activity => (
                    <TableRow key={activity.id}>
                      <TableCell>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          activity.status === 'devolvido' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {activity.status === 'devolvido' ? 'Devolução' : 'Empréstimo'}
                        </span>
                      </TableCell>
                      <TableCell>{getUserName(activity.userId)}</TableCell>
                      <TableCell>{getBookTitle(activity.bookId)}</TableCell>
                      <TableCell>{formatDate(activity.dataEmprestimo)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4">
                      Nenhuma atividade recente
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {/* Seção inferior com 3 cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Ações Rápidas */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-bold font-inter text-lg mb-4">Ações Rápidas</h3>
            <div className="space-y-4">
              <Button 
                className="w-full bg-primary hover:bg-primary-hover text-white"
                onClick={() => setIsBookFormOpen(true)}
              >
                <BookOpen className="mr-2 h-5 w-5" />
                Adicionar Livro
              </Button>
              <Button 
                className="w-full bg-secondary hover:bg-secondary-hover text-white"
                onClick={() => setIsStudentFormOpen(true)}
              >
                <Users className="mr-2 h-5 w-5" />
                Cadastrar Estudante
              </Button>
              <Button 
                className="w-full bg-primary hover:bg-primary-hover text-white"
                onClick={() => setIsLoanFormOpen(true)}
              >
                <RefreshCw className="mr-2 h-5 w-5" />
                Registrar Empréstimo
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Livros Populares */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-bold font-inter text-lg mb-4">Livros Populares</h3>
            <ul className="divide-y divide-gray-200">
              {bookLoanCount.length > 0 ? (
                bookLoanCount.map(book => (
                  <li key={book.id} className="py-3 flex justify-between">
                    <span className="truncate">{book.titulo}</span>
                    <span className="text-gray-500">{book.loanCount} empréstimos</span>
                  </li>
                ))
              ) : (
                <li className="py-3 text-center text-gray-500">
                  Nenhum empréstimo registrado
                </li>
              )}
            </ul>
          </CardContent>
        </Card>
        
        {/* Devoluções Pendentes */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-bold font-inter text-lg mb-4">Devoluções Pendentes</h3>
            <ul className="divide-y divide-gray-200">
              {upcomingReturns.length > 0 ? (
                upcomingReturns.map(loan => {
                  const dueDate = new Date(loan.dataDevolucaoPrevista);
                  const today = new Date();
                  const diffDays = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
                  
                  let statusText = `${diffDays} dias restantes`;
                  let statusClass = "text-gray-500";
                  
                  if (diffDays < 0) {
                    statusText = `${Math.abs(diffDays)} dias atraso`;
                    statusClass = "text-red-600";
                  } else if (diffDays === 0) {
                    statusText = "Vence hoje";
                    statusClass = "text-yellow-600";
                  } else if (diffDays <= 3) {
                    statusClass = "text-yellow-600";
                  }
                  
                  return (
                    <li key={loan.id} className="py-3 flex justify-between items-center">
                      <div>
                        <p className="font-medium">{getUserName(loan.userId)}</p>
                        <p className="text-sm text-gray-500">{getBookTitle(loan.bookId)}</p>
                      </div>
                      <span className={`text-sm font-medium ${statusClass}`}>
                        {statusText}
                      </span>
                    </li>
                  );
                })
              ) : (
                <li className="py-3 text-center text-gray-500">
                  Nenhuma devolução pendente
                </li>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Formulários modais */}
      <BookForm isOpen={isBookFormOpen} onClose={() => setIsBookFormOpen(false)} />
      <StudentForm isOpen={isStudentFormOpen} onClose={() => setIsStudentFormOpen(false)} />
      <LoanForm isOpen={isLoanFormOpen} onClose={() => setIsLoanFormOpen(false)} />
    </LibrarianLayout>
  );
}
