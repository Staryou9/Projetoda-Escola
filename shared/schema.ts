import { pgTable, text, serial, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enum para tipo de usuário
export const userRoleEnum = pgEnum("user_role", ["bibliotecario", "estudante"]);

// Enum para status de empréstimo
export const loanStatusEnum = pgEnum("loan_status", ["pendente", "aprovado", "devolvido", "atrasado"]);

// Tabela de usuários
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  nome: text("nome").notNull(),
  email: text("email").notNull(),
  role: userRoleEnum("role").notNull().default("estudante"),
});

// Tabela de livros
export const books = pgTable("books", {
  id: serial("id").primaryKey(),
  titulo: text("titulo").notNull(),
  autor: text("autor").notNull(),
  categoria: text("categoria").notNull(),
  descricao: text("descricao"),
  anoPublicacao: integer("ano_publicacao"),
  quantidadeTotal: integer("quantidade_total").notNull().default(1),
  quantidadeDisponivel: integer("quantidade_disponivel").notNull().default(1),
  capa: text("capa"),
});

// Tabela de empréstimos
export const loans = pgTable("loans", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  bookId: integer("book_id").notNull(),
  dataEmprestimo: timestamp("data_emprestimo").notNull().defaultNow(),
  dataDevolucaoPrevista: timestamp("data_devolucao_prevista").notNull(),
  dataDevolvido: timestamp("data_devolvido"),
  status: loanStatusEnum("status").notNull().default("pendente"),
});

// Schemas de inserção
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertBookSchema = createInsertSchema(books).omit({ id: true });
export const insertLoanSchema = createInsertSchema(loans).omit({ id: true, dataEmprestimo: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Book = typeof books.$inferSelect;
export type InsertBook = z.infer<typeof insertBookSchema>;

export type Loan = typeof loans.$inferSelect;
export type InsertLoan = z.infer<typeof insertLoanSchema>;

export type UserRole = "bibliotecario" | "estudante";
export type LoanStatus = "pendente" | "aprovado" | "devolvido" | "atrasado";
