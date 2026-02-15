"use client";

import dynamic from "next/dynamic";

const AIChatAssistant = dynamic(
    () =>
        import("@/components/AIChatAssistant").then((mod) => mod.AIChatAssistant),
    { ssr: false }
);

export function ChatWrapper() {
    return <AIChatAssistant />;
}
