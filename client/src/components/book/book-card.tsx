import { Book } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

interface BookCardProps {
  book: Book;
  onEdit?: (book: Book) => void;
}

export default function BookCard({ book, onEdit }: BookCardProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const isLibrarian = user?.role === "bibliotecario";

  // Mutação para solicitar empréstimo
  const requestLoanMutation = useMutation({
    mutationFn: async () => {
      const today = new Date();
      const dueDate = new Date();
      dueDate.setDate(today.getDate() + 30); // 30 dias de empréstimo

      const res = await apiRequest("POST", "/api/loans", {
        userId: user?.id,
        bookId: book.id,
        dataDevolucaoPrevista: dueDate.toISOString(),
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Solicitação enviada",
        description: "Seu pedido de empréstimo foi enviado com sucesso.",
      });
      // Invalidar cache para recarregar os livros
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro na solicitação",
        description: error.message || "Não foi possível solicitar o empréstimo.",
        variant: "destructive",
      });
    },
  });

  // Verifica se o livro está disponível
  const isAvailable = book.quantidadeDisponivel > 0;
  
  // Define status do livro
  let statusText = "Indisponível";
  let statusClass = "bg-gray-100 text-gray-800";
  
  if (isAvailable) {
    statusText = "Disponível";
    statusClass = "bg-green-100 text-green-800";
  } else if (book.quantidadeTotal > 0) {
    statusText = "Emprestado";
    statusClass = "bg-red-100 text-red-800";
  }

  return (
    <Card className="overflow-hidden h-full flex flex-col">
      <div className="h-48 bg-gray-200 flex items-center justify-center overflow-hidden">
        {book.capa ? (
          <img 
            src={book.capa} 
            alt={book.titulo} 
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full w-full bg-primary/10">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-primary/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
        )}
      </div>
      <CardContent className="p-4 flex-1 flex flex-col">
        <h3 className="font-bold text-lg mb-1 line-clamp-1">{book.titulo}</h3>
        <p className="text-text/70 text-sm mb-1">{book.autor}</p>
        <p className="text-xs text-text/50 mb-3">{book.categoria}</p>
        
        <div className="flex items-center justify-between mb-3 mt-auto">
          <span className={`text-xs px-2 py-1 rounded-full ${statusClass}`}>
            {statusText}
          </span>
          <span className="text-xs text-text/50">
            {book.quantidadeDisponivel} de {book.quantidadeTotal} exemplares
          </span>
        </div>
        
        {isLibrarian && onEdit ? (
          <Button 
            onClick={() => onEdit(book)}
            className="w-full bg-primary hover:bg-primary/90"
          >
            Editar Livro
          </Button>
        ) : (
          <Button 
            onClick={() => requestLoanMutation.mutate()}
            className="w-full bg-primary hover:bg-primary/90"
            disabled={!isAvailable || requestLoanMutation.isPending}
          >
            {requestLoanMutation.isPending 
              ? "Processando..." 
              : isAvailable 
                ? "Solicitar Empréstimo" 
                : "Indisponível"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
