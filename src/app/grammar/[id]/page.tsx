import { GRAMMAR_TOPICS } from "@/content/grammar";
import { TopicClient } from "./TopicClient";

export function generateStaticParams() {
  return GRAMMAR_TOPICS.map((t) => ({ id: t.id }));
}

export const dynamicParams = false;

export default async function TopicPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TopicClient id={id} />;
}
