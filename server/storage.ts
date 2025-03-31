import { users, books, loans, type User, type InsertUser, type Book, type InsertBook, type Loan, type InsertLoan, UserRole, LoanStatus } from "@shared/schema";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);
const scryptAsync = promisify(scrypt);

// Funções para senha
async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export interface IStorage {
  // Usuários
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  getStudents(): Promise<User[]>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  validateUser(username: string, password: string): Promise<User | null>;
  
  // Livros
  getBook(id: number): Promise<Book | undefined>;
  getBookByTitle(titulo: string): Promise<Book | undefined>;
  createBook(book: InsertBook): Promise<Book>;
  getAllBooks(): Promise<Book[]>;
  updateBook(id: number, book: Partial<InsertBook>): Promise<Book | undefined>;
  deleteBook(id: number): Promise<boolean>;
  updateBookQuantity(id: number, change: number): Promise<Book | undefined>;
  
  // Empréstimos
  getLoan(id: number): Promise<Loan | undefined>;
  createLoan(loan: InsertLoan): Promise<Loan>;
  getAllLoans(): Promise<Loan[]>;
  getLoansByUser(userId: number): Promise<Loan[]>;
  getLoansByBook(bookId: number): Promise<Loan[]>;
  getActiveLoans(): Promise<Loan[]>;
  updateLoan(id: number, loan: Partial<InsertLoan>): Promise<Loan | undefined>;
  returnLoan(id: number): Promise<Loan | undefined>;
  
  // Sessão
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private books: Map<number, Book>;
  private loans: Map<number, Loan>;
  sessionStore: session.SessionStore;
  
  private userCounter: number;
  private bookCounter: number;
  private loanCounter: number;

  constructor() {
    this.users = new Map();
    this.books = new Map();
    this.loans = new Map();
    this.userCounter = 1;
    this.bookCounter = 1;
    this.loanCounter = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // 24 horas
    });
    
    // Inserir usuários de teste
    this.createInitialData();
  }

  private async createInitialData() {
    // Usuários de teste
    await this.createUser({
      username: "admin",
      password: await hashPassword("admin123"),
      nome: "Administrador",
      email: "admin@biblioteca.com",
      role: "bibliotecario"
    });

    await this.createUser({
      username: "joao",
      password: await hashPassword("senha123"),
      nome: "João Silva",
      email: "joao@email.com",
      role: "estudante"
    });

    // Livros de exemplo
    const books = [
      {
        titulo: "Dom Casmurro",
        autor: "Machado de Assis",
        categoria: "Literatura Brasileira",
        descricao: "Um clássico da literatura brasileira",
        anoPublicacao: 1899,
        quantidadeTotal: 5,
        quantidadeDisponivel: 3,
        capa: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
      },
      {
        titulo: "1984",
        autor: "George Orwell",
        categoria: "Ficção Científica",
        descricao: "Uma visão distópica do futuro",
        anoPublicacao: 1949,
        quantidadeTotal: 3,
        quantidadeDisponivel: 1,
        capa: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
      },
      {
        titulo: "Orgulho e Preconceito",
        autor: "Jane Austen",
        categoria: "Romance",
        descricao: "Um clássico da literatura inglesa",
        anoPublicacao: 1813,
        quantidadeTotal: 2,
        quantidadeDisponivel: 0,
        capa: "https://images.unsplash.com/photo-1621351183012-e2f9972dd9bf?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
      },
      {
        titulo: "Cem Anos de Solidão",
        autor: "Gabriel García Márquez",
        categoria: "Realismo Mágico",
        descricao: "Uma obra prima da literatura latino-americana",
        anoPublicacao: 1967,
        quantidadeTotal: 3,
        quantidadeDisponivel: 2,
        capa: "https://images.unsplash.com/photo-1629992101753-56d196c8aabb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
      },
      {
        titulo: "Memórias Póstumas de Brás Cubas",
        autor: "Machado de Assis",
        categoria: "Literatura Brasileira",
        descricao: "Um romance inovador",
        anoPublicacao: 1881,
        quantidadeTotal: 4,
        quantidadeDisponivel: 4,
        capa: "https://images.unsplash.com/photo-1585521551924-c13ab2fac9ed?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
      },
      {
        titulo: "A Revolução dos Bichos",
        autor: "George Orwell",
        categoria: "Ficção Política",
        descricao: "Uma alegoria política",
        anoPublicacao: 1945,
        quantidadeTotal: 2,
        quantidadeDisponivel: 0,
        capa: "https://images.unsplash.com/photo-1614332287897-cdc485fa562d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
      }
    ];

    for (const book of books) {
      await this.createBook(book);
    }

    // Criar alguns empréstimos
    const hoje = new Date();
    const trintaDias = new Date();
    trintaDias.setDate(hoje.getDate() + 30);
    
    await this.createLoan({
      userId: 2, // joao
      bookId: 1, // Dom Casmurro
      dataDevolucaoPrevista: trintaDias,
      status: "aprovado"
    });
  }

  // Métodos de Usuário
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getStudents(): Promise<User[]> {
    return Array.from(this.users.values()).filter(
      (user) => user.role === "estudante"
    );
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }

  async validateUser(username: string, password: string): Promise<User | null> {
    const user = await this.getUserByUsername(username);
    if (!user) return null;
    
    const passwordValid = await comparePasswords(password, user.password);
    return passwordValid ? user : null;
  }

  // Métodos de Livro
  async getBook(id: number): Promise<Book | undefined> {
    return this.books.get(id);
  }

  async getBookByTitle(titulo: string): Promise<Book | undefined> {
    return Array.from(this.books.values()).find(
      (book) => book.titulo === titulo
    );
  }

  async createBook(insertBook: InsertBook): Promise<Book> {
    const id = this.bookCounter++;
    const book: Book = { ...insertBook, id };
    this.books.set(id, book);
    return book;
  }

  async getAllBooks(): Promise<Book[]> {
    return Array.from(this.books.values());
  }

  async updateBook(id: number, bookData: Partial<InsertBook>): Promise<Book | undefined> {
    const book = this.books.get(id);
    if (!book) return undefined;

    const updatedBook = { ...book, ...bookData };
    this.books.set(id, updatedBook);
    return updatedBook;
  }

  async deleteBook(id: number): Promise<boolean> {
    return this.books.delete(id);
  }

  async updateBookQuantity(id: number, change: number): Promise<Book | undefined> {
    const book = this.books.get(id);
    if (!book) return undefined;

    const updatedBook = { 
      ...book, 
      quantidadeDisponivel: Math.max(0, book.quantidadeDisponivel + change)
    };
    this.books.set(id, updatedBook);
    return updatedBook;
  }

  // Métodos de Empréstimo
  async getLoan(id: number): Promise<Loan | undefined> {
    return this.loans.get(id);
  }

  async createLoan(insertLoan: InsertLoan): Promise<Loan> {
    const id = this.loanCounter++;
    const dataEmprestimo = new Date();
    const loan: Loan = { ...insertLoan, id, dataEmprestimo };
    
    // Atualizar quantidade disponível do livro
    await this.updateBookQuantity(insertLoan.bookId, -1);
    
    this.loans.set(id, loan);
    return loan;
  }

  async getAllLoans(): Promise<Loan[]> {
    return Array.from(this.loans.values());
  }

  async getLoansByUser(userId: number): Promise<Loan[]> {
    return Array.from(this.loans.values()).filter(
      (loan) => loan.userId === userId
    );
  }

  async getLoansByBook(bookId: number): Promise<Loan[]> {
    return Array.from(this.loans.values()).filter(
      (loan) => loan.bookId === bookId
    );
  }

  async getActiveLoans(): Promise<Loan[]> {
    return Array.from(this.loans.values()).filter(
      (loan) => loan.status === "pendente" || loan.status === "aprovado"
    );
  }

  async updateLoan(id: number, loanData: Partial<InsertLoan>): Promise<Loan | undefined> {
    const loan = this.loans.get(id);
    if (!loan) return undefined;

    const updatedLoan = { ...loan, ...loanData };
    this.loans.set(id, updatedLoan);
    return updatedLoan;
  }

  async returnLoan(id: number): Promise<Loan | undefined> {
    const loan = this.loans.get(id);
    if (!loan) return undefined;

    // Atualizar o empréstimo
    const returnedLoan: Loan = { 
      ...loan, 
      status: "devolvido",
      dataDevolvido: new Date()
    };
    this.loans.set(id, returnedLoan);
    
    // Atualizar a quantidade disponível do livro
    await this.updateBookQuantity(loan.bookId, 1);
    
    return returnedLoan;
  }
}

export const storage = new MemStorage();
