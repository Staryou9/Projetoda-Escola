import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User, insertUserSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

interface StudentFormProps {
  student?: User;
  isOpen: boolean;
  onClose: () => void;
}

// Estendendo o schema para incluir validações adicionais
const studentFormSchema = insertUserSchema.extend({
  nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email inválido"),
  username: z.string().min(3, "Usuário deve ter pelo menos 3 caracteres"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string().optional(),
}).refine((data) => {
  // Se estiver editando e não fornecer senha, não precisa de confirmação
  if (!data.password) return true;
  // Se não tiver confirmPassword definido, retorna true (caso edição)
  if (data.confirmPassword === undefined) return true;
  // Caso contrário, verifica se as senhas coincidem
  return data.password === data.confirmPassword;
}, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type StudentFormValues = z.infer<typeof studentFormSchema>;

export default function StudentForm({ student, isOpen, onClose }: StudentFormProps) {
  const { toast } = useToast();
  const isEditing = !!student;

  // Definir valores padrão para o formulário
  const defaultValues: Partial<StudentFormValues> = isEditing
    ? { 
        ...student,
        password: "", // Não preenchemos a senha ao editar
        confirmPassword: ""
      }
    : {
        nome: "",
        email: "",
        username: "",
        password: "",
        confirmPassword: "",
        role: "estudante", // Por padrão, cria estudantes
      };

  // Configurar o form
  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentFormSchema),
    defaultValues,
  });

  // Mutação para criar/editar estudante
  const studentMutation = useMutation({
    mutationFn: async (values: StudentFormValues) => {
      // Remover confirmPassword antes de enviar
      const { confirmPassword, ...userData } = values;
      
      // Se estiver editando e a senha estiver vazia, remova-a
      if (isEditing && !userData.password) {
        delete userData.password;
      }

      if (isEditing && student) {
        const res = await apiRequest("PUT", `/api/users/${student.id}`, userData);
        return await res.json();
      } else {
        const res = await apiRequest("POST", "/api/users", userData);
        return await res.json();
      }
    },
    onSuccess: () => {
      toast({
        title: isEditing ? "Estudante atualizado" : "Estudante adicionado",
        description: isEditing 
          ? "O estudante foi atualizado com sucesso." 
          : "O estudante foi adicionado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      form.reset(defaultValues);
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao salvar o estudante.",
        variant: "destructive",
      });
    },
  });

  // Handler para submissão do formulário
  const onSubmit = (values: StudentFormValues) => {
    studentMutation.mutate(values);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Estudante" : "Adicionar Novo Estudante"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Digite o nome completo" {...field} />
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
                    <Input type="email" placeholder="email@exemplo.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Usuário</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome de usuário para login" {...field} />
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
                  <FormLabel>{isEditing ? "Nova Senha (deixe em branco para manter a atual)" : "Senha"}</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Digite a senha" {...field} />
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
                  <FormLabel>Confirmar Senha</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Confirme a senha" {...field} />
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
                disabled={studentMutation.isPending}
              >
                {studentMutation.isPending 
                  ? "Salvando..." 
                  : isEditing 
                    ? "Atualizar Estudante" 
                    : "Adicionar Estudante"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
