import { create } from "zustand";

export type Email = {
  id: string;
  threadId: string;
  from: string;
  to: string;
  subject: string;
  date: string;
  snippet: string;
  body?: string;
  unread: boolean;
};

export type View = "inbox" | "sent" | "compose" | "detail";

type ComposeForm = {
  to: string;
  subject: string;
  body: string;
};

type MailStore = {
  view: View;
  emails: Email[];
  sentEmails: Email[];
  selectedEmail: Email | null;
  composeForm: ComposeForm;
  activeFilter: string;

  setView: (view: View) => void;
  setEmails: (emails: Email[]) => void;
  setSentEmails: (emails: Email[]) => void;
  setSelectedEmail: (email: Email | null) => void;
  setComposeForm: (form: Partial<ComposeForm>) => void;
  resetComposeForm: () => void;
  setActiveFilter: (filter: string) => void;
  addNewEmail: (email: Email) => void;
};

export const useMailStore = create<MailStore>((set) => ({
  view: "inbox",
  emails: [],
  sentEmails: [],
  selectedEmail: null,
  composeForm: { to: "", subject: "", body: "" },
  activeFilter: "",

  setView: (view) => set({ view }),
  setEmails: (emails) => set({ emails }),
  setSentEmails: (sentEmails) => set({ sentEmails }),
  setSelectedEmail: (selectedEmail) => set({ selectedEmail }),
  setComposeForm: (form) =>
    set((state) => ({ composeForm: { ...state.composeForm, ...form } })),
  resetComposeForm: () =>
    set({ composeForm: { to: "", subject: "", body: "" } }),
  setActiveFilter: (activeFilter) => set({ activeFilter }),
  addNewEmail: (email) =>
    set((state) => ({ emails: [email, ...state.emails] })),
}));