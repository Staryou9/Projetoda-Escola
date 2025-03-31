import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import LibrarianLayout from "@/components/layout/librarian-layout";
import { Loan, Book, User, LoanStatus } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, CheckCircle, XCircle } from "lucide-react";
import LoanForm from "@/components/loan/loan-form";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { format, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

export default function LibrarianLoans() {
  const { toast } = useToast();
  const [isLoanFormOpen, setIsLoanFormOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Buscar empréstimos, livros e estudantes
  const { data: loans = [], isLoading: isLoadingLoans } = useQuery<Loan[]>({
    queryKey: ["/api/loans"],
  });

  const { data: books = [], isLoading: isLoadingBooks } = useQuery<Book[]>({
    queryKey: ["/api/books"],
  });

  const { data: students = [], isLoading: isLoadingStudents } = useQuery<User[]>({
    queryKey: ["/api/students"],
  });

  // Mutação para aprovar empréstimo
  const approveLoanMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("PUT", `/api/loans/${id}/approve`, {});
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Empréstimo aprovado",
        description: "O empréstimo foi aprovado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/loans"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao aprovar",
        description: error.message || "Não foi possível aprovar o empréstimo.",
        variant: "destructive",
      });
    },
  });

  // Mutação para registrar devolução
  const returnLoanMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("PUT", `/api/loans/${id}/return`, {});
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Devolução registrada",
        description: "A devolução foi registrada com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/loans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao registrar devolução",
        description: error.message || "Não foi possível registrar a devolução.",
        variant: "destructive",
      });
    },
  });

  const isLoading = isLoadingLoans || isLoadingBooks || isLoadingStudents;

  // Obter nome do estudante a partir do ID
  const getStudentName = (id: number) => {
    const student = students.find(s => s.id === id);
    return student?.nome || "Estudante não encontrado";
  };

  // Obter título do livro a partir do ID
  const getBookTitle = (id: number) => {
    const book = books.find(b => b.id === id);
    return book?.titulo || "Livro não encontrado";
  };

  // Formatar data
  const formatDate = (date: Date | string) => {
    return format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
  };

  // Filtrar empréstimos baseado na busca e filtro de status
  const filteredLoans = loans.filter(loan => {
    const studentName = getStudentName(loan.userId);
    const bookTitle = getBookTitle(loan.bookId);
    
    const matchesSearch = 
      studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bookTitle.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = 
      statusFilter === "all" || 
      (statusFilter === "atrasado" 
        ? (loan.status === "aprovado" && isBefore(new Date(loan.dataDevolucaoPrevista), new Date())) 
        : loan.status === statusFilter);
    
    return matchesSearch && matchesStatus;
  });

  // Ordenar empréstimos (mais recentes primeiro)
  const sortedLoans = [...filteredLoans].sort((a, b) => 
    new Date(b.dataEmprestimo).getTime() - new Date(a.dataEmprestimo).getTime()
  );

  return (
    <LibrarianLayout title="Gerenciamento de Empréstimos">
      {/* Barra de ações */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <Button 
          onClick={() => setIsLoanFormOpen(true)}
          className="bg-primary hover:bg-primary/90"
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo Empréstimo
        </Button>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-text/50" />
            <Input
              placeholder="Buscar por estudante ou livro"
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Todos os status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="aprovado">Aprovado</SelectItem>
              <SelectItem value="devolvido">Devolvido</SelectItem>
              <SelectItem value="atrasado">Atrasado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabela de empréstimos */}
      {isLoading ? (
        <Card>
          <CardContent className="p-6">
            <div className="h-8 bg-gray-200 animate-pulse rounded mb-4 w-1/4" />
            <div className="space-y-2">
              {[...Array(5)].map((_, index) => (
                <div key={index} className="h-12 bg-gray-200 animate-pulse rounded" />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : sortedLoans.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Estudante</TableHead>
                    <TableHead>Livro</TableHead>
                    <TableHead>Data Empréstimo</TableHead>
                    <TableHead>Data Devolução</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedLoans.map((loan) => {
                    const isPendingApproval = loan.status === "pendente";
                    const canBeReturned = loan.status === "aprovado";
                    
                    return (
                      <TableRow key={loan.id}>
                        <TableCell className="font-medium">{getStudentName(loan.userId)}</TableCell>
                        <TableCell>{getBookTitle(loan.bookId)}</TableCell>
                        <TableCell>{formatDate(loan.dataEmprestimo)}</TableCell>
                        <TableCell>{formatDate(loan.dataDevolucaoPrevista)}</TableCell>
                        <TableCell>
                          <LoanStatusBadge 
                            status={loan.status} 
                            dueDate={new Date(loan.dataDevolucaoPrevista)}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <TooltipProvider>
                              {isPendingApproval && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      variant="outline" 
                                      size="icon"
                                      className="text-secondary"
                                      onClick={() => approveLoanMutation.mutate(loan.id)}
                                      disabled={approveLoanMutation.isPending}
                                    >
                                      <CheckCircle className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Aprovar Empréstimo</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                              
                              {canBeReturned && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      variant="outline" 
                                      size="icon"
                                      onClick={() => returnLoanMutation.mutate(loan.id)}
                                      disabled={returnLoanMutation.isPending}
                                    >
                                      <XCircle className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Registrar Devolução</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </TooltipProvider>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-text/70">
              {searchQuery || statusFilter !== "all"
                ? "Nenhum empréstimo encontrado com os filtros aplicados." 
                : "Nenhum empréstimo registrado ainda."}
            </p>
            <Button 
              onClick={() => setIsLoanFormOpen(true)}
              className="bg-primary hover:bg-primary/90 mt-4"
            >
              <Plus className="mr-2 h-4 w-4" />
              Novo Empréstimo
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Modal de formulário de empréstimo */}
      <LoanForm 
        isOpen={isLoanFormOpen} 
        onClose={() => setIsLoanFormOpen(false)}
      />
    </LibrarianLayout>
  );
}
