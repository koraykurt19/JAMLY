import { MessagesPage } from "@/components/messages-page";

type MessagesRouteProps = {
  searchParams: Promise<{
    conversation?: string | string[];
  }>;
};

export default async function MessagesRoute({ searchParams }: MessagesRouteProps) {
  const { conversation: value } = await searchParams;
  const conversation = Array.isArray(value) ? value[0] : value;
  return <MessagesPage initialConversationId={conversation} />;
}
