export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
}

export enum Category {
  SALARY = 'Salary',
  FREELANCE = 'Freelance',
  INVESTMENTS = 'Investments',
  RENT = 'Rent',
  GROCERIES = 'Groceries',
  ENTERTAINMENT = 'Entertainment',
  UTILITIES = 'Utilities',
  TRANSPORT = 'Transport',
  HEALTH = 'Health',
  OTHER = 'Other',
}

export interface Transaction {
  id: string;
  date: Date;
  amount: number;
  type: TransactionType;
  category: Category;
  description: string;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  color?: string;
}

export interface DailyBalance {
  date: string;
  balance: number;
  income: number;
  expense: number;
}

export type PlanType = 'free' | 'pro_monthly' | 'pro_yearly';

export interface User {
  id: string;
  name: string;
  email: string;
  plan: PlanType;
  memberSince: Date;
  picture?: string;
}

declare global {
  interface Window {
    Razorpay: any;
    google: any;
  }
}