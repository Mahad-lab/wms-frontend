export interface Client {
  id: number;
  name: string;
  phone?: string;
  address?: string;
  current_balance?: number;
}

export interface Category {
  id: number;
  name: string;
}

export interface Item {
  id: number;
  category_id?: number;
  category_name?: string;
  name: string;
  default_unit: string;
}

export interface OrderLine {
  id?: number;
  item_id?: number;
  item_name: string;
  category: string;
  rate: number;
  weight: number;
  unit: string;
  total: number;
}

export interface Order {
  id: number;
  client_id: number;
  client_name: string;
  order_date: string;
  old_balance: number;
  current_total: number;
  grand_total: number;
  paid: number;
  balance_due: number;
  notes?: string;
  lines?: OrderLine[];
}

export interface Payment {
  id: number;
  client_id: number;
  client_name: string;
  amount: number;
  payment_date: string;
  method: string;
  note: string | undefined;
  reference?: string;
}