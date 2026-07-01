import { useEffect } from "react";
import { useMailStore } from "../store/useMailStore";
import { emailApi } from "../api/client";

export default function Inbox() {
  const { emails, setEmails, setSelectedEmail, setView } = useMailStore();

  useEffect(() => {
    emailApi.getEmails().then(setEmails).catch(console.error);
  }, []);

  return (
    <div className="flex-1 overflow-auto">
      <h2 className="text-lg font-semibold text-white p-4 border-b border-gray-800">
        Inbox
      </h2>
      {emails.map((email) => (
        <div
          key={email.id}
          onClick={() => { setSelectedEmail(email); setView("detail"); }}
          className="p-4 border-b border-gray-800 cursor-pointer hover:bg-gray-800/50 transition"
        >
          <div className="flex justify-between mb-1">
            <span className={`text-sm ${email.unread ? "text-white font-semibold" : "text-gray-400"}`}>
              {email.unread && <span className="inline-block w-2 h-2 bg-indigo-500 rounded-full mr-2" />}
              {email.from}
            </span>
            <span className="text-xs text-gray-500">{email.date}</span>
          </div>
          <div className="text-sm text-gray-300">{email.subject}</div>
          <div className="text-xs text-gray-500 mt-1 truncate">{email.snippet}</div>
        </div>
      ))}
    </div>
  );
}