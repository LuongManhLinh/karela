import ChatLayout from "@/components/chat/ChatLayout";

interface PLChatLayoutProps {
  children?: React.ReactNode;
}
const PLChatLayout: React.FC<PLChatLayoutProps> = ({ children }) => {
  return <ChatLayout level="story">{children}</ChatLayout>;
};

export default PLChatLayout;
