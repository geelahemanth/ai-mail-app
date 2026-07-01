import { CopilotKit } from "@copilotkit/react-core";
import { CopilotSidebar } from "@copilotkit/react-ui";
import "@copilotkit/react-ui/styles.css";
import Sidebar from "./components/Sidebar";
import Inbox from "./components/Inbox";
import SentMail from "./components/SentMail";
import Compose from "./components/Compose";
import EmailDetail from "./components/EmailDetail";
import { useMailStore } from "./store/useMailStore";
import { useCopilotActions } from "./copilot/actions";
import { useRealtimeEmails } from "./hooks/useRealtimeEmails";

function MailApp() {
  const { view } = useMailStore();
  useCopilotActions();
  useRealtimeEmails();

  return (
    <div className="flex h-screen bg-gray-950 text-white">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        {view === "inbox" && <Inbox />}
        {view === "sent" && <SentMail />}
        {view === "compose" && <Compose />}
        {view === "detail" && <EmailDetail />}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <CopilotKit runtimeUrl="/copilotkit">
      <CopilotSidebar
        labels={{ title: "AI Assistant", initial: "How can I help? Try 'Show my unread emails'" }}
      >
        <MailApp />
      </CopilotSidebar>
    </CopilotKit>
  );
}