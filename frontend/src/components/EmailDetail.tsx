import { useMailStore } from "../store/useMailStore";

export default function EmailDetail() {
  const { selectedEmail, setView, setComposeForm } = useMailStore();

  if (!selectedEmail) return null;

  const handleReply = () => {
    setComposeForm({
      to: selectedEmail.from,
      subject: `Re: ${selectedEmail.subject}`,
      body: "",
    });
    setView("compose");
  };

  return (
    <div className="flex-1 overflow-auto p-6">
      <button
        onClick={() => setView("inbox")}
        className="text-sm text-gray-400 border border-gray-700 px-3 py-1 rounded-md hover:bg-gray-800 mb-6"
      >
        ← Back
      </button>
      <h2 className="text-xl font-semibold text-white mb-2">{selectedEmail.subject}</h2>
      <p className="text-sm text-gray-500 mb-6">
        From: {selectedEmail.from} · {selectedEmail.date}
      </p>
      <div className="text-gray-300 leading-relaxed mb-8 whitespace-pre-wrap">
        {selectedEmail.body || selectedEmail.snippet}
      </div>
      <button
        onClick={handleReply}
        className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700"
      >
        Reply
      </button>
    </div>
  );
}