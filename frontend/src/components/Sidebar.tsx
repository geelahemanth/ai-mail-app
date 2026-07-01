import { useMailStore, type View } from "../store/useMailStore";

const navItems: { label: string; view: View }[] = [
  { label: "Inbox", view: "inbox" },
  { label: "Sent", view: "sent" },
  { label: "Compose", view: "compose" },
];

export default function Sidebar() {
  const { view, setView, resetComposeForm } = useMailStore();

  return (
    <div className="w-56 bg-gray-900 border-r border-gray-800 p-4 flex flex-col gap-1">
      <h1 className="text-lg font-bold text-white mb-6 px-3">AI Mail</h1>
      {navItems.map((item) => (
        <button
          key={item.view}
          onClick={() => {
            if (item.view === "compose") resetComposeForm();
            setView(item.view);
          }}
          className={`text-left px-3 py-2 rounded-lg text-sm transition ${
            view === item.view
              ? "bg-indigo-600 text-white"
              : "text-gray-400 hover:bg-gray-800 hover:text-white"
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}