import { MessagesPage } from "@/components/messages-page";

type MessagesRouteProps = {
  searchParams: {
    conversation?: string | string[];
  };
};

export default function MessagesRoute({ searchParams }: MessagesRouteProps) {
  const conversation = Array.isArray(searchParams.conversation)
    ? searchParams.conversation[0]
    : searchParams.conversation;
  return <MessagesPage initialConversationId={conversation} />;
}
