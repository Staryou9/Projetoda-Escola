import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Book, User, insertLoanSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface LoanFormProps {
  isOpen: boolean;
  onClose: () => void;
}

// Schema para o formulário de empréstimo
const loanFormSchema = z.object({
  userId: z.string().min(1, "Estudante é obrigatório"),
  bookId: z.string().min(1, "Livro é obrigatório"),
});

type LoanFormValues = z.infer<typeof loanFormSchema>;

export default function LoanForm({ isOpen, onClose }: LoanFormProps) {
  const { toast } = useToast();

  // Buscar estudantes
  const { data: students, isLoading: isLoadingStudents } = useQuery<User[]>({
    queryKey: ["/api/students"],
  });

  // Buscar livros
  const { data: books, isLoading: isLoadingBooks } = useQuery<Book[]>({
    queryKey: ["/api/books"],
  });

  // Configurar o form
  const form = useForm<LoanFormValues>({
    resolver: zodResolver(loanFormSchema),
    defaultValues: {
      userId: "",
      bookId: "",
    },
  });

  // Filtrar apenas livros disponíveis
  const availableBooks = books?.filter(book => book.quantidadeDisponivel > 0) || [];

  // Definir data de devolução (30 dias a partir de hoje)
  const dueDate = addDays(new Date(), 30);
  const formattedDueDate = format(dueDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });

  // Mutação para criar empréstimo
  const loanMutation = useMutation({
    mutationFn: async (values: LoanFormValues) => {
      const loanData = {
        userId: Number(values.userId),
        bookId: Number(values.bookId),
        dataDevolucaoPrevista: dueDate.toISOString(),
        status: "aprovado" // Como é o bibliotecário criando, já aprova automaticamente
      };
      
      const res = await apiRequest("POST", "/api/loans", loanData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Empréstimo registrado",
        description: "O empréstimo foi registrado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/loans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
      form.reset();
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao registrar o empréstimo.",
        variant: "destructive",
      });
    },
  });

  // Handler para submissão do formulário
  const onSubmit = (values: LoanFormValues) => {
    loanMutation.mutate(values);
  };

  const isLoading = isLoadingStudents || isLoadingBooks;
  const hasNoAvailableBooks = books && books.length > 0 && availableBooks.length === 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Registrar Novo Empréstimo</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <p>Carregando dados...</p>
          </div>
        ) : hasNoAvailableBooks ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Não há livros disponíveis para empréstimo no momento.
            </AlertDescription>
          </Alert>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="userId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estudante</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um estudante" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {students?.map(student => (
                          <SelectItem key={student.id} value={String(student.id)}>
                            {student.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bookId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Livro</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um livro" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableBooks.map(book => (
                          <SelectItem key={book.id} value={String(book.id)}>
                            {book.titulo} ({book.quantidadeDisponivel} disponíveis)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="pt-2">
                <p className="text-sm font-medium">Data prevista para devolução:</p>
                <p className="text-sm text-text/70">{formattedDueDate}</p>
              </div>

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onClose}
                  className="mt-2"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  className="bg-primary hover:bg-primary/90 mt-2"
                  disabled={loanMutation.isPending}
                >
                  {loanMutation.isPending ? "Registrando..." : "Registrar Empréstimo"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
