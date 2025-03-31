import { useQuery } from "@tanstack/react-query";
import StudentLayout from "@/components/layout/student-layout";
import { Loan, Book, LoanStatus } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { format, isBefore, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Book as BookIcon, CheckCircle, Clock, AlertTriangle } from "lucide-react";

// Helper para renderizar o status do empréstimo
const LoanStatusBadge = ({ status, dueDate }: { status: LoanStatus, dueDate: Date }) => {
  const isPastDue = status === "aprovado" && isBefore(new Date(dueDate), new Date());
  
  if (isPastDue) {
    return <Badge variant="destructive">Atrasado</Badge>;
  }
  
  switch (status) {
    case "pendente":
      return <Badge variant="secondary">Pendente</Badge>;
    case "aprovado":
      return <Badge variant="default" className="bg-secondary">Aprovado</Badge>;
    case "devolvido":
      return <Badge variant="outline">Devolvido</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export default function StudentMyLoans() {
  const { user } = useAuth();
  
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
  
  // Separar por status
  const activeLoans = userLoans.filter(
    loan => loan.status === "aprovado" || loan.status === "pendente"
  );
  
  const pendingLoans = userLoans.filter(loan => loan.status === "pendente");
  const returnedLoans = userLoans.filter(loan => loan.status === "devolvido");
  
  // Obter dados do livro a partir do ID
  const getBook = (bookId: number) => {
    return books.find(book => book.id === bookId);
  };
  
  // Formatar data
  const formatDate = (date: Date | string) => {
    return format(new Date(date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };
  
  // Calcular dias restantes ou dias de atraso
  const getDaysMessage = (dueDate: Date | string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffDays = differenceInDays(due, today);
    
    if (diffDays < 0) {
      return `${Math.abs(diffDays)} dias de atraso`;
    } else if (diffDays === 0) {
      return "Devolução hoje";
    } else if (diffDays === 1) {
      return "1 dia restante";
    } else {
      return `${diffDays} dias restantes`;
    }
  };
  
  // Renderizar card de empréstimo
  const renderLoanCard = (loan: Loan) => {
    const book = getBook(loan.bookId);
    const isPastDue = loan.status === "aprovado" && isBefore(new Date(loan.dataDevolucaoPrevista), new Date());
    
    if (!book) return null;
    
    return (
      <Card key={loan.id} className="mb-4">
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 flex-shrink-0 bg-primary/10 rounded-md flex items-center justify-center">
              <BookIcon className="h-8 w-8 text-primary/70" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg mb-1 truncate">{book.titulo}</h3>
              <p className="text-sm text-gray-600 mb-2">{book.autor}</p>
              
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <LoanStatusBadge status={loan.status} dueDate={new Date(loan.dataDevolucaoPrevista)} />
                  
                  {loan.status === "aprovado" && (
                    <span className={`text-xs flex items-center gap-1 ${
                      isPastDue ? 'text-red-600' : 'text-gray-500'
                    }`}>
                      {isPastDue ? (
                        <AlertTriangle className="h-3 w-3" />
                      ) : (
                        <Clock className="h-3 w-3" />
                      )}
                      {getDaysMessage(loan.dataDevolucaoPrevista)}
                    </span>
                  )}
                  
                  {loan.status === "devolvido" && loan.dataDevolvido && (
                    <span className="text-xs flex items-center gap-1 text-green-600">
                      <CheckCircle className="h-3 w-3" />
                      Devolvido em {formatDate(loan.dataDevolvido)}
                    </span>
                  )}
                </div>
                
                <div className="text-xs text-gray-500">
                  {loan.status === "pendente" ? (
                    <span>Solicitado em {formatDate(loan.dataEmprestimo)}</span>
                  ) : (
                    <span>Empréstimo: {formatDate(loan.dataEmprestimo)}</span>
                  )}
                  {loan.status !== "pendente" && (
                    <span className="block">
                      Devolução prevista: {formatDate(loan.dataDevolucaoPrevista)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };
  
  return (
    <StudentLayout title="Meus Empréstimos">
      <Tabs defaultValue="ativos" className="space-y-6">
        <TabsList className="w-full max-w-md mx-auto grid grid-cols-3">
          <TabsTrigger value="ativos">
            Ativos
            {activeLoans.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeLoans.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="pendentes">
            Pendentes
            {pendingLoans.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {pendingLoans.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>
        
        <TabsContent value="ativos">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, index) => (
                <Card key={index}>
                  <CardContent className="p-5">
                    <div className="flex gap-4">
                      <div className="w-16 h-16 bg-gray-200 animate-pulse rounded-md" />
                      <div className="flex-1">
                        <div className="h-5 bg-gray-200 animate-pulse rounded mb-2 w-3/4" />
                        <div className="h-4 bg-gray-200 animate-pulse rounded mb-3 w-1/2" />
                        <div className="flex justify-between">
                          <div className="h-4 bg-gray-200 animate-pulse rounded w-20" />
                          <div className="h-4 bg-gray-200 animate-pulse rounded w-32" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : activeLoans.length > 0 ? (
            <div className="space-y-4">
              {activeLoans
                .filter(loan => loan.status === "aprovado")
                .map(renderLoanCard)}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-text/70">
                  Você não possui empréstimos ativos no momento.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="pendentes">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(2)].map((_, index) => (
                <Card key={index}>
                  <CardContent className="p-5">
                    <div className="flex gap-4">
                      <div className="w-16 h-16 bg-gray-200 animate-pulse rounded-md" />
                      <div className="flex-1">
                        <div className="h-5 bg-gray-200 animate-pulse rounded mb-2 w-3/4" />
                        <div className="h-4 bg-gray-200 animate-pulse rounded mb-3 w-1/2" />
                        <div className="flex justify-between">
                          <div className="h-4 bg-gray-200 animate-pulse rounded w-20" />
                          <div className="h-4 bg-gray-200 animate-pulse rounded w-32" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : pendingLoans.length > 0 ? (
            <div className="space-y-4">
              {pendingLoans.map(renderLoanCard)}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-text/70">
                  Você não possui solicitações de empréstimo pendentes.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="historico">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, index) => (
                <Card key={index}>
                  <CardContent className="p-5">
                    <div className="flex gap-4">
                      <div className="w-16 h-16 bg-gray-200 animate-pulse rounded-md" />
                      <div className="flex-1">
                        <div className="h-5 bg-gray-200 animate-pulse rounded mb-2 w-3/4" />
                        <div className="h-4 bg-gray-200 animate-pulse rounded mb-3 w-1/2" />
                        <div className="flex justify-between">
                          <div className="h-4 bg-gray-200 animate-pulse rounded w-20" />
                          <div className="h-4 bg-gray-200 animate-pulse rounded w-32" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : returnedLoans.length > 0 ? (
            <div className="space-y-4">
              {returnedLoans.map(renderLoanCard)}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-text/70">
                  Seu histórico de empréstimos está vazio.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </StudentLayout>
  );
}
