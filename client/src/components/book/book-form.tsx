import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Book, insertBookSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface BookFormProps {
  book?: Book;
  isOpen: boolean;
  onClose: () => void;
}

// Estendendo o schema para incluir validações adicionais
const bookFormSchema = insertBookSchema.extend({
  titulo: z.string().min(2, "Título deve ter pelo menos 2 caracteres"),
  autor: z.string().min(2, "Autor deve ter pelo menos 2 caracteres"),
  categoria: z.string().min(2, "Categoria deve ter pelo menos 2 caracteres"),
  anoPublicacao: z.number().int().positive().optional().nullable(),
  quantidadeTotal: z.number().int().positive("Quantidade deve ser maior que zero"),
  quantidadeDisponivel: z.number().int().min(0, "Quantidade disponível não pode ser negativa"),
});

type BookFormValues = z.infer<typeof bookFormSchema>;

export default function BookForm({ book, isOpen, onClose }: BookFormProps) {
  const { toast } = useToast();
  const isEditing = !!book;

  // Definir valores padrão para o formulário
  const defaultValues: Partial<BookFormValues> = isEditing
    ? { ...book }
    : {
        titulo: "",
        autor: "",
        categoria: "",
        descricao: "",
        anoPublicacao: undefined,
        quantidadeTotal: 1,
        quantidadeDisponivel: 1,
        capa: "",
      };

  // Configurar o form
  const form = useForm<BookFormValues>({
    resolver: zodResolver(bookFormSchema),
    defaultValues,
  });

  // Mutação para criar/editar livro
  const bookMutation = useMutation({
    mutationFn: async (values: BookFormValues) => {
      if (isEditing && book) {
        const res = await apiRequest("PUT", `/api/books/${book.id}`, values);
        return await res.json();
      } else {
        const res = await apiRequest("POST", "/api/books", values);
        return await res.json();
      }
    },
    onSuccess: () => {
      toast({
        title: isEditing ? "Livro atualizado" : "Livro adicionado",
        description: isEditing 
          ? "O livro foi atualizado com sucesso." 
          : "O livro foi adicionado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
      form.reset(defaultValues);
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao salvar o livro.",
        variant: "destructive",
      });
    },
  });

  // Handler para submissão do formulário
  const onSubmit = (values: BookFormValues) => {
    bookMutation.mutate(values);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Livro" : "Adicionar Novo Livro"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="titulo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input placeholder="Digite o título do livro" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="autor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Autor</FormLabel>
                  <FormControl>
                    <Input placeholder="Digite o nome do autor" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="categoria"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Literatura Brasileira, Ficção Científica" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="anoPublicacao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ano de Publicação</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Ex: 2020" 
                        {...field}
                        value={field.value || ""}
                        onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="capa"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL da Capa</FormLabel>
                    <FormControl>
                      <Input placeholder="https://exemplo.com/imagem.jpg" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quantidadeTotal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantidade Total</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min={1}
                        {...field}
                        value={field.value}
                        onChange={e => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quantidadeDisponivel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantidade Disponível</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min={0}
                        {...field}
                        value={field.value}
                        onChange={e => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descreva o livro brevemente" 
                      rows={3} 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                disabled={bookMutation.isPending}
              >
                {bookMutation.isPending 
                  ? "Salvando..." 
                  : isEditing 
                    ? "Atualizar Livro" 
                    : "Adicionar Livro"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
