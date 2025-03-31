import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import LibrarianLayout from "@/components/layout/librarian-layout";
import { Book } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import BookForm from "@/components/book/book-form";
import BookCard from "@/components/book/book-card";
import { Plus, Search } from "lucide-react";

export default function LibrarianBooks() {
  const [isBookFormOpen, setIsBookFormOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("title-asc");

  // Buscar livros
  const { data: books = [], isLoading } = useQuery<Book[]>({
    queryKey: ["/api/books"],
  });

  // Abrir formulário para adicionar novo livro
  const handleAddBook = () => {
    setEditingBook(undefined);
    setIsBookFormOpen(true);
  };

  // Abrir formulário para editar livro existente
  const handleEditBook = (book: Book) => {
    console.log("Editando livro:", book);
    setEditingBook(book);
    setIsBookFormOpen(true);
  };

  // Fechar formulário
  const handleCloseForm = () => {
    setIsBookFormOpen(false);
    setEditingBook(undefined);
  };

  // Obter categorias únicas para o filtro
  const categories = Array.from(new Set(books.map(book => book.categoria)));

  // Filtrar e ordenar livros
  const filteredBooks = books.filter(book => {
    const matchesSearch = book.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        book.autor.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || book.categoria === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Ordenar livros
  const sortedBooks = [...filteredBooks].sort((a, b) => {
    switch (sortBy) {
      case "title-asc":
        return a.titulo.localeCompare(b.titulo);
      case "title-desc":
        return b.titulo.localeCompare(a.titulo);
      case "author-asc":
        return a.autor.localeCompare(b.autor);
      case "author-desc":
        return b.autor.localeCompare(a.autor);
      case "availability-asc":
        return a.quantidadeDisponivel - b.quantidadeDisponivel;
      case "availability-desc":
        return b.quantidadeDisponivel - a.quantidadeDisponivel;
      default:
        return 0;
    }
  });

  return (
    <LibrarianLayout title="Gerenciamento de Livros">
      {/* Barra de ações */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <Button 
          onClick={handleAddBook}
          className="bg-primary hover:bg-primary/90"
        >
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Livro
        </Button>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-text/50" />
            <Input
              placeholder="Buscar por título ou autor"
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Todas as categorias" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="title-asc">Título: A-Z</SelectItem>
              <SelectItem value="title-desc">Título: Z-A</SelectItem>
              <SelectItem value="author-asc">Autor: A-Z</SelectItem>
              <SelectItem value="author-desc">Autor: Z-A</SelectItem>
              <SelectItem value="availability-desc">Mais disponíveis</SelectItem>
              <SelectItem value="availability-asc">Menos disponíveis</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Grid de livros */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, index) => (
            <Card key={index}>
              <div className="h-48 bg-gray-200 animate-pulse" />
              <CardContent className="p-4">
                <div className="h-6 bg-gray-200 animate-pulse rounded mb-2" />
                <div className="h-4 bg-gray-200 animate-pulse rounded mb-2" />
                <div className="h-4 bg-gray-200 animate-pulse rounded w-2/3 mb-4" />
                <div className="flex justify-between mb-4">
                  <div className="h-4 w-16 bg-gray-200 animate-pulse rounded" />
                  <div className="h-4 w-16 bg-gray-200 animate-pulse rounded" />
                </div>
                <div className="h-9 bg-gray-200 animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : sortedBooks.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {sortedBooks.map(book => (
            <BookCard 
              key={book.id} 
              book={book} 
              onEdit={handleEditBook}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-text/70">
              {searchQuery || categoryFilter !== "all" 
                ? "Nenhum livro encontrado com os filtros aplicados." 
                : "Nenhum livro cadastrado ainda."}
            </p>
            <Button 
              onClick={handleAddBook}
              className="bg-primary hover:bg-primary/90 mt-4"
            >
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Livro
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Modal de formulário */}
      <BookForm 
        book={editingBook} 
        isOpen={isBookFormOpen} 
        onClose={handleCloseForm}
      />
    </LibrarianLayout>
  );
}
