import { useCopilotAction, useCopilotReadable } from "@copilotkit/react-core";
import { useMailStore } from "../store/useMailStore";
import { emailApi } from "../api/client";

export function useCopilotActions() {
  const {
    view, emails, selectedEmail,
    setView, setEmails, setSelectedEmail,
    setComposeForm, resetComposeForm, setActiveFilter,
  } = useMailStore();

  // ─── Expose current UI state to the AI ───
  useCopilotReadable({
    description: "Current mail app state",
    value: JSON.stringify({
      currentView: view,
      selectedEmail: selectedEmail
        ? { id: selectedEmail.id, from: selectedEmail.from, subject: selectedEmail.subject }
        : null,
      totalEmails: emails.length,
    }),
  });

  // ─── Action: Open Compose and Fill Fields ───
  useCopilotAction({
    name: "composeEmail",
    description: "Opens the compose form and fills in the email fields. Use when user wants to send, write, or compose an email.",
    parameters: [
      { name: "to", type: "string", description: "Recipient email address", required: true },
      { name: "subject", type: "string", description: "Email subject line", required: true },
      { name: "body", type: "string", description: "Email body content", required: true },
    ],
    handler: async ({ to, subject, body }) => {
      setView("compose");
      // Small delay so user sees the view change first
      await new Promise((r) => setTimeout(r, 300));
      setComposeForm({ to });
      await new Promise((r) => setTimeout(r, 300));
      setComposeForm({ subject });
      await new Promise((r) => setTimeout(r, 300));
      setComposeForm({ body });
      return "Compose form opened and filled. User can review and click Send.";
    },
  });

  // ─── Action: Send Email Directly ───
  useCopilotAction({
    name: "sendEmail",
    description: "Send an email immediately. Use when user explicitly says 'send' an email.",
    parameters: [
      { name: "to", type: "string", description: "Recipient email address", required: true },
      { name: "subject", type: "string", description: "Email subject", required: true },
      { name: "body", type: "string", description: "Email body", required: true },
    ],
    handler: async ({ to, subject, body }) => {
      setView("compose");
      setComposeForm({ to, subject, body });
      try {
        await emailApi.sendEmail(to, subject, body);
        resetComposeForm();
        setView("inbox");
        return `Email sent to ${to} successfully!`;
      } catch (err) {
        return "Failed to send email. Please try again.";
      }
    },
  });

  // ─── Action: Search/Filter Emails ───
  useCopilotAction({
    name: "searchEmails",
    description: "Search or filter emails by date range, sender, keyword, or unread status. Use when user says 'show', 'find', 'filter', or 'search' emails.",
    parameters: [
      { name: "days", type: "number", description: "Show emails from last N days", required: false },
      { name: "sender", type: "string", description: "Filter by sender email or name", required: false },
      { name: "unread", type: "boolean", description: "Show only unread emails", required: false },
      { name: "keyword", type: "string", description: "Search keyword in email subject or body", required: false },
    ],
    handler: async ({ days, sender, unread, keyword }) => {
      const params: any = {};
      if (days) params.days = days;
      if (sender) params.sender = sender;
      if (unread) params.unread = unread;
      if (keyword) params.q = keyword;

      const results = await emailApi.getEmails(params);
      setEmails(results);
      setView("inbox");

      const filterDesc = [
        days && `last ${days} days`,
        sender && `from ${sender}`,
        unread && "unread only",
        keyword && `containing "${keyword}"`,
      ].filter(Boolean).join(", ");

      setActiveFilter(filterDesc);
      return `Found ${results.length} emails${filterDesc ? ` (${filterDesc})` : ""}.`;
    },
  });

  // ─── Action: Open a Specific Email ───
  useCopilotAction({
    name: "openEmail",
    description: "Open and display a specific email. Use when user says 'open', 'read', or 'show' a particular email.",
    parameters: [
      { name: "sender", type: "string", description: "Sender name or email to find", required: false },
      { name: "subject", type: "string", description: "Subject keyword to find", required: false },
    ],
    handler: async ({ sender, subject }) => {
      // Search in current emails first
      let found = emails.find((e) => {
        const matchSender = sender ? e.from.toLowerCase().includes(sender.toLowerCase()) : true;
        const matchSubject = subject ? e.subject.toLowerCase().includes(subject.toLowerCase()) : true;
        return matchSender && matchSubject;
      });

      if (!found && sender) {
        // Fetch from backend if not in current list
        const results = await emailApi.getEmails({ sender });
        if (results.length > 0) found = results[0];
      }

      if (found) {
        setSelectedEmail(found);
        setView("detail");
        return `Opened email: "${found.subject}" from ${found.from}`;
      }
      return "Could not find that email. Try being more specific.";
    },
  });

  // ─── Action: Reply to Current Email ───
  useCopilotAction({
    name: "replyToEmail",
    description: "Reply to the currently open email. Use when user says 'reply to this' while viewing an email.",
    parameters: [
      { name: "body", type: "string", description: "Reply message body", required: true },
    ],
    handler: async ({ body }) => {
      if (!selectedEmail) {
        return "No email is currently open. Please open an email first.";
      }
      setComposeForm({
        to: selectedEmail.from,
        subject: `Re: ${selectedEmail.subject}`,
        body,
      });
      setView("compose");
      return `Reply drafted to ${selectedEmail.from}. Review and click Send.`;
    },
  });

  // ─── Action: Navigate ───
  useCopilotAction({
    name: "navigate",
    description: "Navigate to a specific view: inbox, sent, or compose.",
    parameters: [
      { name: "view", type: "string", description: "View to navigate to: 'inbox', 'sent', or 'compose'", required: true },
    ],
    handler: async ({ view: targetView }) => {
      const v = targetView.toLowerCase();
      if (v === "inbox" || v === "sent" || v === "compose") {
        if (v === "compose") resetComposeForm();
        setView(v);
        return `Navigated to ${v}.`;
      }
      return "Unknown view. Try inbox, sent, or compose.";
    },
  });
}