import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertBookSchema, insertLoanSchema, insertUserSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { UploadedFile } from "express-fileupload";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// Para substituir o __dirname em ambiente de módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware para verificar se o usuário está autenticado
function isAuthenticated(req: Request, res: Response, next: Function) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Não autenticado" });
}

// Middleware para verificar se o usuário é bibliotecário
function isLibrarian(req: Request, res: Response, next: Function) {
  if (req.isAuthenticated() && req.user?.role === "bibliotecario") {
    return next();
  }
  res.status(403).json({ message: "Acesso restrito a bibliotecários" });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Configuração da autenticação
  setupAuth(app);

  // Rotas da API protegidas
  // Rotas de Livros
  app.get("/api/books", async (req, res) => {
    try {
      const books = await storage.getAllBooks();
      res.json(books);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar livros" });
    }
  });

  app.get("/api/books/:id", async (req, res) => {
    try {
      const book = await storage.getBook(Number(req.params.id));
      if (!book) {
        return res.status(404).json({ message: "Livro não encontrado" });
      }
      res.json(book);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar livro" });
    }
  });

  app.post("/api/books", isLibrarian, async (req, res) => {
    try {
      const bookData = insertBookSchema.parse(req.body);
      const book = await storage.createBook(bookData);
      res.status(201).json(book);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      res.status(500).json({ message: "Erro ao criar livro" });
    }
  });

  app.put("/api/books/:id", isLibrarian, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const bookData = insertBookSchema.partial().parse(req.body);
      const book = await storage.updateBook(id, bookData);
      
      if (!book) {
        return res.status(404).json({ message: "Livro não encontrado" });
      }
      
      res.json(book);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      res.status(500).json({ message: "Erro ao atualizar livro" });
    }
  });

  app.delete("/api/books/:id", isLibrarian, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const deleted = await storage.deleteBook(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Livro não encontrado" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Erro ao excluir livro" });
    }
  });

  // Rotas de Usuários/Estudantes
  app.get("/api/users", isLibrarian, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar usuários" });
    }
  });

  app.get("/api/students", isLibrarian, async (req, res) => {
    try {
      const students = await storage.getStudents();
      res.json(students);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar estudantes" });
    }
  });

  app.post("/api/users", isLibrarian, async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByUsername(userData.username);
      
      if (existingUser) {
        return res.status(400).json({ message: "Nome de usuário já existe" });
      }
      
      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      res.status(500).json({ message: "Erro ao criar usuário" });
    }
  });

  app.put("/api/users/:id", isLibrarian, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const userData = insertUserSchema.partial().parse(req.body);
      const user = await storage.updateUser(id, userData);
      
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      res.json(user);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      res.status(500).json({ message: "Erro ao atualizar usuário" });
    }
  });

  app.delete("/api/users/:id", isLibrarian, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const deleted = await storage.deleteUser(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Erro ao excluir usuário" });
    }
  });

  // Rotas de Empréstimos
  app.get("/api/loans", isAuthenticated, async (req, res) => {
    try {
      // Se for bibliotecário, retorna todos os empréstimos
      // Se for estudante, retorna apenas os empréstimos do próprio usuário
      const userId = req.user!.id;
      const isLibrarian = req.user!.role === "bibliotecario";
      
      const loans = isLibrarian 
        ? await storage.getAllLoans() 
        : await storage.getLoansByUser(userId);
      
      res.json(loans);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar empréstimos" });
    }
  });

  app.get("/api/loans/active", isAuthenticated, async (req, res) => {
    try {
      const activeLoans = await storage.getActiveLoans();
      res.json(activeLoans);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar empréstimos ativos" });
    }
  });

  app.get("/api/loans/user/:userId", isLibrarian, async (req, res) => {
    try {
      const userId = Number(req.params.userId);
      const loans = await storage.getLoansByUser(userId);
      res.json(loans);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar empréstimos do usuário" });
    }
  });

  app.post("/api/loans", isAuthenticated, async (req, res) => {
    try {
      const loanData = insertLoanSchema.parse(req.body);
      
      // Se não for bibliotecário, só pode emprestar para si mesmo
      if (req.user!.role !== "bibliotecario" && loanData.userId !== req.user!.id) {
        return res.status(403).json({ message: "Você só pode solicitar empréstimos para você mesmo" });
      }
      
      // Verificar se o livro existe e está disponível
      const book = await storage.getBook(loanData.bookId);
      if (!book) {
        return res.status(404).json({ message: "Livro não encontrado" });
      }
      
      if (book.quantidadeDisponivel <= 0) {
        return res.status(400).json({ message: "Livro indisponível para empréstimo" });
      }
      
      // Se for um estudante, o status inicial é 'pendente' (precisa de aprovação)
      // Se for um bibliotecário, o status inicial é 'aprovado'
      if (req.user!.role !== "bibliotecario") {
        loanData.status = "pendente";
      } else {
        loanData.status = "aprovado";
      }
      
      const loan = await storage.createLoan(loanData);
      res.status(201).json(loan);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      res.status(500).json({ message: "Erro ao criar empréstimo" });
    }
  });

  app.put("/api/loans/:id/approve", isLibrarian, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const loan = await storage.getLoan(id);
      
      if (!loan) {
        return res.status(404).json({ message: "Empréstimo não encontrado" });
      }
      
      if (loan.status !== "pendente") {
        return res.status(400).json({ message: "Este empréstimo não está pendente" });
      }
      
      const updatedLoan = await storage.updateLoan(id, { status: "aprovado" });
      res.json(updatedLoan);
    } catch (error) {
      res.status(500).json({ message: "Erro ao aprovar empréstimo" });
    }
  });

  app.put("/api/loans/:id/return", isLibrarian, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const loan = await storage.getLoan(id);
      
      if (!loan) {
        return res.status(404).json({ message: "Empréstimo não encontrado" });
      }
      
      if (loan.status === "devolvido") {
        return res.status(400).json({ message: "Este empréstimo já foi devolvido" });
      }
      
      const returnedLoan = await storage.returnLoan(id);
      res.json(returnedLoan);
    } catch (error) {
      res.status(500).json({ message: "Erro ao processar devolução" });
    }
  });

  // Rota para upload de capa de livro
  app.post("/api/books/upload-cover", isLibrarian, async (req, res) => {
    try {
      if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).json({ message: "Nenhum arquivo enviado" });
      }

      const coverFile = req.files.capa as UploadedFile;
      const fileName = `capa_${Date.now()}${path.extname(coverFile.name)}`;
      const uploadPath = path.join(__dirname, 'uploads', fileName);

      // Mover o arquivo para o diretório de uploads
      await coverFile.mv(uploadPath);

      // Retornar o caminho relativo para o cliente
      const relativePath = `/uploads/${fileName}`;
      res.json({ path: relativePath });
    } catch (error) {
      console.error('Erro no upload:', error);
      res.status(500).json({ message: "Erro ao fazer upload da capa" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
