import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import StudentLayout from "@/components/layout/student-layout";
import { Book } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import BookCard from "@/components/book/book-card";
import { Search } from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

// Número de livros por página
const BOOKS_PER_PAGE = 8;

export default function StudentCatalog() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("title-asc");
  const [currentPage, setCurrentPage] = useState(1);

  // Buscar livros
  const { data: books = [], isLoading } = useQuery<Book[]>({
    queryKey: ["/api/books"],
  });

  // Obter categorias únicas para o filtro
  const categories = [...new Set(books.map(book => book.categoria))];

  // Filtrar livros
  const filteredBooks = books.filter(book => {
    const matchesSearch = 
      book.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.autor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.categoria.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (book.descricao && book.descricao.toLowerCase().includes(searchQuery.toLowerCase()));
    
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
      case "newest":
        return (b.anoPublicacao || 0) - (a.anoPublicacao || 0);
      case "oldest":
        return (a.anoPublicacao || 0) - (b.anoPublicacao || 0);
      default:
        return 0;
    }
  });

  // Paginação
  const totalPages = Math.ceil(sortedBooks.length / BOOKS_PER_PAGE);
  const paginatedBooks = sortedBooks.slice(
    (currentPage - 1) * BOOKS_PER_PAGE,
    currentPage * BOOKS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <StudentLayout title="Catálogo de Livros">
      {/* Barra de busca e filtros */}
      <Card className="p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-text/50" />
            <Input
              placeholder="Buscar por título, autor ou assunto..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full md:w-48">
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
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="title-asc">Título: A-Z</SelectItem>
              <SelectItem value="title-desc">Título: Z-A</SelectItem>
              <SelectItem value="author-asc">Autor: A-Z</SelectItem>
              <SelectItem value="author-desc">Autor: Z-A</SelectItem>
              <SelectItem value="newest">Mais recentes</SelectItem>
              <SelectItem value="oldest">Mais antigos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Grid de livros */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, index) => (
            <Card key={index} className="overflow-hidden">
              <div className="h-48 bg-gray-200 animate-pulse" />
              <div className="p-4">
                <div className="h-6 bg-gray-200 animate-pulse rounded mb-2" />
                <div className="h-4 bg-gray-200 animate-pulse rounded mb-2" />
                <div className="h-4 bg-gray-200 animate-pulse rounded w-2/3 mb-4" />
                <div className="flex justify-between mb-4">
                  <div className="h-4 w-16 bg-gray-200 animate-pulse rounded" />
                  <div className="h-4 w-16 bg-gray-200 animate-pulse rounded" />
                </div>
                <div className="h-9 bg-gray-200 animate-pulse rounded" />
              </div>
            </Card>
          ))}
        </div>
      ) : paginatedBooks.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            {paginatedBooks.map(book => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
          
          {/* Paginação */}
          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage > 1) handlePageChange(currentPage - 1);
                    }}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
                
                {Array.from({ length: totalPages }).map((_, index) => {
                  const page = index + 1;
                  
                  // Mostrar primeiras 2 páginas, a página atual, e as últimas 2 páginas
                  if (
                    page === 1 ||
                    page === 2 ||
                    page === currentPage ||
                    page === totalPages ||
                    page === totalPages - 1 ||
                    page === currentPage - 1 ||
                    page === currentPage + 1
                  ) {
                    return (
                      <PaginationItem key={page}>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            handlePageChange(page);
                          }}
                          isActive={page === currentPage}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  }
                  
                  // Adicionar elipses entre páginas não adjacentes
                  if (
                    (page === 3 && currentPage > 4) ||
                    (page === totalPages - 2 && currentPage < totalPages - 3)
                  ) {
                    return (
                      <PaginationItem key={`ellipsis-${page}`}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    );
                  }
                  
                  return null;
                })}
                
                <PaginationItem>
                  <PaginationNext 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage < totalPages) handlePageChange(currentPage + 1);
                    }}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      ) : (
        <Card className="p-6 text-center">
          <p className="text-text/70">
            {searchQuery || categoryFilter !== "all"
              ? "Nenhum livro encontrado com os filtros aplicados."
              : "Nenhum livro disponível no catálogo."}
          </p>
        </Card>
      )}
    </StudentLayout>
  );
}
