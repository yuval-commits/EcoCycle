export type User = {
  id: string;
  name: string;
  email: string;
  community: string;
  capacityKg: number;
};

export type Item = {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  notes: string;
  updatedAt: string;
};

export type Pickup = {
  id: string;
  title: string;
  pickupDate: string;
  location: string;
  notes: string;
  status: "Scheduled" | "Completed" | "Cancelled";
  community: string;
  createdBy: string;
};

export type Dashboard = {
  totalKg: number;
  capacityKg: number;
  capacityPercent: number;
  itemCount: number;
  categoryKg: Record<string, number>;
};

export type InventoryInput = Omit<Item, "id" | "updatedAt">;
export type PickupInput = Pick<Pickup, "title" | "pickupDate" | "location" | "notes">;

const TOKEN_KEY = "ecocycle-token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const saveToken = (token: string) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(path, { ...options, headers });
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { message?: string; error?: string } | null;
    throw new Error(body?.message || body?.error || `Request failed (${response.status})`);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const api = {
  register: (input: { name: string; email: string; password: string; community: string }) =>
    request<{ token: string; user: User }>("/api/auth/register", { method: "POST", body: JSON.stringify(input) }),
  login: (input: { email: string; password: string }) =>
    request<{ token: string; user: User }>("/api/auth/login", { method: "POST", body: JSON.stringify(input) }),
  logout: () => request<{ success: boolean }>("/api/auth/logout", { method: "POST" }),
  me: () => request<User>("/api/me"),
  updateProfile: (input: Pick<User, "community" | "capacityKg">) =>
    request<User>("/api/me", { method: "PUT", body: JSON.stringify(input) }),
  dashboard: () => request<Dashboard>("/api/dashboard"),
  items: () => request<Item[]>("/api/items"),
  addItem: (input: InventoryInput) => request<Item>("/api/items", { method: "POST", body: JSON.stringify(input) }),
  updateItem: (id: string, input: InventoryInput) =>
    request<Item>(`/api/items/${id}`, { method: "PUT", body: JSON.stringify(input) }),
  deleteItem: (id: string) => request<{ success: boolean }>(`/api/items/${id}`, { method: "DELETE" }),
  pickups: () => request<Pickup[]>("/api/collections"),
  addPickup: (input: PickupInput) => request<Pickup>("/api/collections", { method: "POST", body: JSON.stringify(input) }),
  updatePickup: (id: string, status: Pickup["status"]) =>
    request<Pickup>(`/api/collections/${id}`, { method: "PUT", body: JSON.stringify({ status }) }),
};
