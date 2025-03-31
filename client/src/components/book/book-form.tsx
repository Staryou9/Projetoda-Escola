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
import { useState, useRef } from "react";
import { Loader2, Upload } from "lucide-react";

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
  const [uploadingImage, setUploadingImage] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(book?.capa || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  console.log("BookForm recebeu props:", { book, isEditing });

  // Definir valores padrão para o formulário
  const defaultValues: Partial<BookFormValues> = isEditing
    ? { 
        ...book,
        capa: book.capa || "", // Garantir que capa é string
        descricao: book.descricao || "", // Garantir que descricao é string
      }
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
  console.log("Valores padrão para o formulário:", defaultValues);
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

  // Mutação para upload de capa
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("capa", file);
      
      const response = await fetch("/api/books/upload-cover", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error("Erro ao fazer upload da imagem");
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      form.setValue("capa", data.path);
      setPreviewUrl(data.path);
      setUploadingImage(false);
      toast({
        title: "Upload realizado",
        description: "A imagem da capa foi carregada com sucesso."
      });
    },
    onError: (error: Error) => {
      setUploadingImage(false);
      toast({
        title: "Erro no upload",
        description: error.message || "Ocorreu um erro ao fazer upload da imagem.",
        variant: "destructive",
      });
    }
  });
  
  // Função para lidar com a seleção de arquivo
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      // Verificar se é uma imagem
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Formato inválido",
          description: "Por favor, selecione um arquivo de imagem válido (JPEG, PNG, etc).",
          variant: "destructive"
        });
        return;
      }
      
      // Verificar o tamanho (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "O tamanho máximo permitido é de 5MB.",
          variant: "destructive"
        });
        return;
      }
      
      setUploadingImage(true);
      uploadMutation.mutate(file);
    }
  };
  
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
                    <FormLabel>Capa do Livro</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="/uploads/capa.jpg" 
                        {...field} 
                        value={field.value || ""}
                        className="hidden"
                      />
                    </FormControl>
                    <div className="mt-2">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingImage}
                        className="w-full"
                      >
                        {uploadingImage ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Enviando...
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2 h-4 w-4" />
                            Enviar Imagem
                          </>
                        )}
                      </Button>
                    </div>
                    {previewUrl && (
                      <div className="mt-2 relative h-[100px] w-full overflow-hidden rounded-md border">
                        <img 
                          src={previewUrl} 
                          alt="Pré-visualização da capa" 
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
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
                      value={field.value || ""}
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
