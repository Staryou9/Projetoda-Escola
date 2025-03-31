import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import StudentLayout from "@/components/layout/student-layout";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Loan, Book } from "@shared/schema";
import { User, Mail, BookOpen } from "lucide-react";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";

// Schema para atualização de perfil
const profileUpdateSchema = z.object({
  nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres").optional().or(z.literal("")),
  confirmPassword: z.string().optional().or(z.literal("")),
}).refine((data) => {
  // Se não fornecer senha, não precisa de confirmação
  if (!data.password) return true;
  return data.password === data.confirmPassword;
}, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type ProfileFormValues = z.infer<typeof profileUpdateSchema>;

export default function StudentProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  
  // Buscar empréstimos e livros para estatísticas
  const { data: loans = [] } = useQuery<Loan[]>({
    queryKey: ["/api/loans"],
  });
  
  const { data: books = [] } = useQuery<Book[]>({
    queryKey: ["/api/books"],
  });
  
  // Filtrar apenas os empréstimos do usuário atual
  const userLoans = user ? loans.filter(loan => loan.userId === user.id) : [];
  const activeLoans = userLoans.filter(loan => loan.status === "aprovado").length;
  const completedLoans = userLoans.filter(loan => loan.status === "devolvido").length;
  
  // Obter livros favoritos (mais emprestados pelo usuário)
  const favoriteBooks = user ? books.filter(book => 
    userLoans.some(loan => loan.bookId === book.id)
  ).slice(0, 3) : [];
  
  // Configurar o form
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      nome: user?.nome || "",
      email: user?.email || "",
      password: "",
      confirmPassword: "",
    },
  });
  
  // Mutação para atualizar usuário
  const updateProfileMutation = useMutation({
    mutationFn: async (values: ProfileFormValues) => {
      if (!user) return null;
      
      // Remover confirmPassword antes de enviar
      const { confirmPassword, ...userData } = values;
      
      // Se senha estiver vazia, não enviar
      if (!userData.password) {
        delete userData.password;
      }
      
      const res = await apiRequest("PUT", `/api/users/${user.id}`, userData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram atualizadas com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      setIsEditing(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar",
        description: error.message || "Não foi possível atualizar seu perfil.",
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (values: ProfileFormValues) => {
    updateProfileMutation.mutate(values);
  };
  
  // Obter iniciais para o avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  if (!user) return null;

  return (
    <StudentLayout title="Meu Perfil">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="md:col-span-2">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center mb-6">
              <Avatar className="h-20 w-20 text-lg">
                <AvatarFallback className="bg-primary text-white">
                  {getInitials(user.nome)}
                </AvatarFallback>
              </Avatar>
              
              <div>
                <h3 className="text-2xl font-bold mb-1">{user.nome}</h3>
                <p className="text-text/70 flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  {user.email}
                </p>
                <p className="text-text/70 flex items-center gap-1 mt-1">
                  <User className="h-4 w-4" />
                  Usuário: {user.username}
                </p>
              </div>
            </div>
            
            {isEditing ? (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="nome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome Completo</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nova Senha (deixe em branco para manter a atual)</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirmar Nova Senha</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end gap-2 pt-2">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="submit"
                      className="bg-primary hover:bg-primary/90"
                      disabled={updateProfileMutation.isPending}
                    >
                      {updateProfileMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                    </Button>
                  </div>
                </form>
              </Form>
            ) : (
              <Button 
                className="bg-primary hover:bg-primary/90"
                onClick={() => setIsEditing(true)}
              >
                Editar Perfil
              </Button>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <h3 className="font-bold text-lg mb-4">Estatísticas</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                <span className="text-text/70">Total de Empréstimos</span>
                <span className="font-bold">{userLoans.length}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                <span className="text-text/70">Empréstimos Ativos</span>
                <span className="font-bold">{activeLoans}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text/70">Empréstimos Concluídos</span>
                <span className="font-bold">{completedLoans}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardContent className="p-6">
          <h3 className="font-bold text-lg mb-4">Livros Recentes</h3>
          {favoriteBooks.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {favoriteBooks.map(book => (
                <div key={book.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                  <div className="h-10 w-10 bg-primary/10 rounded-md flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-primary/70" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{book.titulo}</p>
                    <p className="text-xs text-text/70 truncate">{book.autor}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-text/70 text-center">
              Você ainda não emprestou nenhum livro.
            </p>
          )}
        </CardContent>
      </Card>
    </StudentLayout>
  );
}
