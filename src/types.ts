export type Lang = 'ru' | 'uz';
export type Role = 'user' | 'declarant';
export type AppStatus = 'pending' | 'progress' | 'done' | 'cancelled';
export type AppType = 'customs' | 'consult' | 'cert' | 'calc' | 'delivery';

export interface StatusEvent {
  status: AppStatus;
  at: string;
}

export interface Application {
  id: string;
  title: string;
  description: string;
  type: AppType;
  status: AppStatus;
  createdAt: string;
  needDocs: boolean;
  attachment?: string;
  history: StatusEvent[];
}

export interface Source {
  id: number;
  site: string;
  title: string;
  score: number;
}

export interface Message {
  id: string;
  from: 'me' | 'them' | 'bot';
  text: string;
  at: string;
  attachment?: string;
  sources?: Source[];
  link?: { label: string; to: string };
  typing?: boolean;
}

export type Channel = 'email' | 'telegram' | 'internal';

export interface Dialog {
  id: string;
  channel: Channel;
  title: string;
  contact: string;
  archived: boolean;
  unread: number;
  messages: Message[];
}

export interface CustomsRequest {
  id: string;
  post: string;
  subject: string;
  status: 'draft' | 'sent' | 'answered';
  at: string;
}

export interface Task {
  id: string;
  title: string;
  due: string;
  priority: 'high' | 'mid' | 'low';
  status: 'todo' | 'aziza' | 'done';
  result?: string;
}

export interface Invoice {
  id: string;
  contract: string;
  title: string;
  amount: number;
  dueDate: string;
  paid: boolean;
}

export interface Payment {
  id: string;
  title: string;
  amount: number;
  at: string;
  method: string;
}

export interface EnergyTx {
  id: string;
  type: 'in' | 'out';
  title: string;
  amount: number;
  at: string;
}

export interface ServiceUsage {
  id: string;
  service: string;
  energy: number;
  at: string;
}

export type FileExt = 'pdf' | 'xlsx' | 'csv' | 'txt' | 'json';

export interface FileItem {
  id: string;
  name: string;
  ext: FileExt;
  size: number;
  at: string;
  source: string;
  content?: string;
}

export interface OcrDoc {
  id: string;
  name: string;
  progress: number;
  status: 'processing' | 'done';
  rows: number;
}

export interface OcrOrder {
  id: string;
  createdAt: string;
  status: 'created' | 'processing' | 'done';
  docs: OcrDoc[];
}

export interface AppNotification {
  id: string;
  text: string;
  at: string;
  read: boolean;
  to: string;
}

export interface Profile {
  name: string;
  email: string;
  phone: string;
}

export interface AzizaSettings {
  model: string;
  knowledgeBase: boolean;
  style: 'short' | 'detailed' | 'legal';
  country: string;
}

export interface State {
  lang: Lang;
  mode: 'light' | 'dark';
  role: Role;
  loggedIn: boolean;
  onboarded: boolean;
  collapsed: boolean;
  menuOrder: string[];
  declMenuOrder: string[];
  profile: Profile;
  nextAppId: number;
  applications: Application[];
  dialogs: Dialog[];
  customsRequests: CustomsRequest[];
  aziza: Message[];
  azizaSettings: AzizaSettings;
  tasks: Task[];
  invoices: Invoice[];
  payments: Payment[];
  energy: EnergyTx[];
  services: ServiceUsage[];
  files: FileItem[];
  ocrOrders: OcrOrder[];
  notifications: AppNotification[];
  courses: Record<string, number[]>;
}
