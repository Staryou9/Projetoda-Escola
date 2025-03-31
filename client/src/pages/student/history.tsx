import { useQuery } from "@tanstack/react-query";
import StudentLayout from "@/components/layout/student-layout";
import { Loan, Book } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  ArrowUpDown,
  Clock,
  CircleCheck,
  CircleX,
  Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function StudentHistory() {
  const { user } = useAuth();
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc'>('date-desc');
  
  // Buscar empréstimos e livros
  const { data: loans = [], isLoading: isLoadingLoans } = useQuery<Loan[]>({
    queryKey: ["/api/loans"],
  });
  
  const { data: books = [], isLoading: isLoadingBooks } = useQuery<Book[]>({
    queryKey: ["/api/books"],
  });
  
  const isLoading = isLoadingLoans || isLoadingBooks;
  
  // Filtrar apenas os empréstimos do usuário atual
  const userLoans = user ? loans.filter(loan => loan.userId === user.id) : [];
  
  // Ordenar por data
  const sortedLoans = [...userLoans].sort((a, b) => {
    const dateA = new Date(a.dataEmprestimo).getTime();
    const dateB = new Date(b.dataEmprestimo).getTime();
    return sortBy === 'date-desc' ? dateB - dateA : dateA - dateB;
  });
  
  // Obter título do livro a partir do ID
  const getBookTitle = (bookId: number) => {
    const book = books.find(b => b.id === bookId);
    return book ? book.titulo : "Livro não encontrado";
  };
  
  // Formatar data
  const formatDate = (date: Date | string) => {
    return format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
  };
  
  // Calcular duração do empréstimo
  const getLoanDuration = (loan: Loan) => {
    if (loan.status === "pendente") {
      return "Pendente";
    }
    
    const startDate = new Date(loan.dataEmprestimo);
    let endDate: Date;
    
    if (loan.status === "devolvido" && loan.dataDevolvido) {
      endDate = new Date(loan.dataDevolvido);
    } else {
      // Para empréstimos ativos, usar a data atual
      endDate = new Date();
    }
    
    const days = differenceInDays(endDate, startDate);
    return `${days} dias`;
  };
  
  // Status do empréstimo para exibição
  const getLoanStatus = (loan: Loan) => {
    switch (loan.status) {
      case "pendente":
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Pendente
          </Badge>
        );
      case "aprovado":
        return (
          <Badge variant="default" className="bg-secondary flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Em andamento
          </Badge>
        );
      case "devolvido":
        const dueDate = new Date(loan.dataDevolucaoPrevista);
        const returnDate = loan.dataDevolvido ? new Date(loan.dataDevolvido) : new Date();
        const isLate = returnDate > dueDate;
        
        return isLate ? (
          <Badge variant="destructive" className="flex items-center gap-1">
            <CircleX className="h-3 w-3" />
            Devolvido com atraso
          </Badge>
        ) : (
          <Badge variant="outline" className="text-green-600 flex items-center gap-1">
            <CircleCheck className="h-3 w-3" />
            Devolvido no prazo
          </Badge>
        );
      default:
        return <Badge variant="outline">{loan.status}</Badge>;
    }
  };
  
  // Alternar ordenação
  const toggleSort = () => {
    setSortBy(sortBy === 'date-desc' ? 'date-asc' : 'date-desc');
  };

  return (
    <StudentLayout title="Histórico de Empréstimos">
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="mb-4">
            <h3 className="font-bold text-lg mb-2">Resumo de Atividades</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Total de Empréstimos</p>
                <p className="text-2xl font-bold text-primary">{userLoans.length}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">Devolvidos</p>
                <p className="text-2xl font-bold text-green-600">
                  {userLoans.filter(loan => loan.status === "devolvido").length}
                </p>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg">
                <p className="text-sm text-gray-600">Em Andamento</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {userLoans.filter(loan => loan.status === "aprovado").length}
                </p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600">Pendentes</p>
                <p className="text-2xl font-bold text-purple-600">
                  {userLoans.filter(loan => loan.status === "pendente").length}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-bold font-inter text-lg">Todos os Empréstimos</h3>
            <Button variant="ghost" size="sm" onClick={toggleSort} className="flex items-center gap-1">
              <ArrowUpDown className="h-4 w-4" />
              {sortBy === 'date-desc' ? 'Mais recentes primeiro' : 'Mais antigos primeiro'}
            </Button>
          </div>
          
          {isLoading ? (
            <div className="p-6">
              <div className="space-y-2">
                {[...Array(5)].map((_, index) => (
                  <div key={index} className="h-12 bg-gray-200 animate-pulse rounded" />
                ))}
              </div>
            </div>
          ) : sortedLoans.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Livro</TableHead>
                    <TableHead>Data Empréstimo</TableHead>
                    <TableHead>Data Devolução</TableHead>
                    <TableHead>Duração</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedLoans.map((loan) => (
                    <TableRow key={loan.id}>
                      <TableCell className="font-medium">{getBookTitle(loan.bookId)}</TableCell>
                      <TableCell>{formatDate(loan.dataEmprestimo)}</TableCell>
                      <TableCell>
                        {loan.status === "devolvido" && loan.dataDevolvido
                          ? formatDate(loan.dataDevolvido)
                          : loan.status === "pendente"
                          ? "Aguardando aprovação"
                          : `Prevista: ${formatDate(loan.dataDevolucaoPrevista)}`}
                      </TableCell>
                      <TableCell>{getLoanDuration(loan)}</TableCell>
                      <TableCell>{getLoanStatus(loan)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-6 text-center">
              <p className="text-text/70">Você ainda não tem histórico de empréstimos.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </StudentLayout>
  );
}
