import { useState } from "react";
import { useMailStore } from "../store/useMailStore";
import { emailApi } from "../api/client";

export default function Compose() {
  const { composeForm, setComposeForm, setView, resetComposeForm } = useMailStore();
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState("");

  const handleSend = async () => {
    if (!composeForm.to || !composeForm.subject) {
      setStatus("Please fill in To and Subject");
      return;
    }
    setSending(true);
    try {
      await emailApi.sendEmail(composeForm.to, composeForm.subject, composeForm.body);
      setStatus("Email sent!");
      resetComposeForm();
      setTimeout(() => setView("inbox"), 1000);
    } catch (err) {
      setStatus("Failed to send email");
    }
    setSending(false);
  };

  return (
    <div className="flex-1 overflow-auto p-6">
      <h2 className="text-lg font-semibold text-white mb-6">New Email</h2>
      {["to", "subject"].map((field) => (
        <div key={field} className="mb-4">
          <label className="block text-sm text-gray-500 mb-1 capitalize">{field}</label>
          <input
            value={composeForm[field as keyof typeof composeForm]}
            onChange={(e) => setComposeForm({ [field]: e.target.value })}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-indigo-500"
          />
        </div>
      ))}
      <div className="mb-4">
        <label className="block text-sm text-gray-500 mb-1">Body</label>
        <textarea
          value={composeForm.body}
          onChange={(e) => setComposeForm({ body: e.target.value })}
          rows={8}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-indigo-500 resize-vertical"
        />
      </div>
      <div className="flex items-center gap-4">
        <button
          onClick={handleSend}
          disabled={sending}
          className="bg-indigo-600 text-white text-sm px-5 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          {sending ? "Sending..." : "Send"}
        </button>
        {status && <span className="text-sm text-gray-400">{status}</span>}
      </div>
    </div>
  );
}