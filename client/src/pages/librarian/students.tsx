import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import LibrarianLayout from "@/components/layout/librarian-layout";
import { User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, Plus, Search, Pencil, Trash2 } from "lucide-react";
import StudentForm from "@/components/student/student-form";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function LibrarianStudents() {
  const { toast } = useToast();
  const [isStudentFormOpen, setIsStudentFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<User | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<User | null>(null);

  // Buscar estudantes
  const { data: students = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/students"],
  });

  // Mutação para excluir estudante
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/users/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Estudante excluído",
        description: "O estudante foi excluído com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      setDeleteDialogOpen(false);
      setStudentToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir",
        description: error.message || "Não foi possível excluir o estudante.",
        variant: "destructive",
      });
    },
  });

  // Abrir formulário para adicionar novo estudante
  const handleAddStudent = () => {
    setEditingStudent(undefined);
    setIsStudentFormOpen(true);
  };

  // Abrir formulário para editar estudante existente
  const handleEditStudent = (student: User) => {
    setEditingStudent(student);
    setIsStudentFormOpen(true);
  };

  // Fechar formulário
  const handleCloseForm = () => {
    setIsStudentFormOpen(false);
    setEditingStudent(undefined);
  };

  // Confirmar exclusão de estudante
  const confirmDelete = () => {
    if (studentToDelete) {
      deleteMutation.mutate(studentToDelete.id);
    }
  };

  // Filtrar estudantes baseado na busca
  const filteredStudents = students.filter(student => 
    student.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <LibrarianLayout title="Gerenciamento de Estudantes">
      {/* Barra de ações */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <Button 
          onClick={handleAddStudent}
          className="bg-primary hover:bg-primary/90"
        >
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Estudante
        </Button>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-text/50" />
          <Input
            placeholder="Buscar estudantes"
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Tabela de estudantes */}
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
      ) : filteredStudents.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.nome}</TableCell>
                      <TableCell>{student.username}</TableCell>
                      <TableCell>{student.email}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={() => handleEditStudent(student)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon"
                            className="text-red-500 hover:text-red-600"
                            onClick={() => {
                              setStudentToDelete(student);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-text/70">
              {searchQuery 
                ? "Nenhum estudante encontrado com esse critério de busca." 
                : "Nenhum estudante cadastrado ainda."}
            </p>
            <Button 
              onClick={handleAddStudent}
              className="bg-primary hover:bg-primary/90 mt-4"
            >
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Estudante
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Modal de formulário */}
      <StudentForm 
        student={editingStudent} 
        isOpen={isStudentFormOpen} 
        onClose={handleCloseForm}
      />

      {/* Diálogo de confirmação de exclusão */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
          </DialogHeader>
          
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o estudante{' '}
              <strong>{studentToDelete?.nome}</strong>.
            </AlertDescription>
          </Alert>
          
          <p className="text-sm text-text/70 mt-2">
            Todos os dados associados a este estudante serão removidos, incluindo histórico de empréstimos.
          </p>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              type="button"
              variant="destructive" 
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </LibrarianLayout>
  );
}
