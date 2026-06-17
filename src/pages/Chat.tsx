import { useState, useRef, useEffect } from "react";
import { trpc } from "@/providers/trpc";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle, Send, Bot, User } from "lucide-react";

const SESSION_KEY = "chat_session_id";

function getSessionId(): string {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) { id = crypto.randomUUID?.() || Math.random().toString(36).slice(2); localStorage.setItem(SESSION_KEY, id); }
  return id;
}

export default function Chat() {
  const sessionId = getSessionId();
  const [messages, setMessages] = useState<{ text: string; isBot: boolean }[]>([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: history } = trpc.chat.history.useQuery({ sessionId });
  const sendMsg = trpc.chat.sendMessage.useMutation({
    onSuccess: (data) => {
      setMessages((prev) => [...prev, { text: data.response, isBot: true }]);
    },
  });

  useEffect(() => {
    if (history) {
      setMessages(history.map((m) => ({ text: m.message, isBot: m.isBot })).reverse());
    }
  }, [history]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSend = () => {
    if (!input.trim() || sendMsg.isPending) return;
    setMessages((prev) => [...prev, { text: input, isBot: false }]);
    sendMsg.mutate({ message: input, sessionId });
    setInput("");
  };

  return (
    <Layout>
      <div className="min-h-screen bg-black pt-24 pb-20">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-8">
            <MessageCircle className="w-10 h-10 text-amber-400 mx-auto mb-2" />
            <h1 className="text-3xl font-bold text-white">المساعدة والدعم</h1>
          </div>
          <Card className="bg-zinc-900/50 border-amber-500/10">
            <CardContent className="p-0">
              <div className="h-[500px] overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && (
                  <div className="text-center py-16 text-gray-500">
                    <Bot className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>اكتب رسالتك للبدء</p>
                  </div>
                )}
                {messages.map((msg, i) => (
                  <div key={i} className={`flex gap-3 ${msg.isBot ? "" : "flex-row-reverse"}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.isBot ? "bg-amber-500/20" : "bg-blue-500/20"}`}>
                      {msg.isBot ? <Bot className="w-4 h-4 text-amber-400" /> : <User className="w-4 h-4 text-blue-400" />}
                    </div>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${msg.isBot ? "bg-zinc-800 text-gray-200 rounded-tr-2xl" : "bg-amber-500/20 text-amber-200 rounded-tl-2xl"}`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {sendMsg.isPending && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center"><Bot className="w-4 h-4 text-amber-400" /></div>
                    <div className="bg-zinc-800 rounded-2xl rounded-tr-2xl px-4 py-2.5"><span className="text-gray-400 animate-pulse">يكتب...</span></div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
              <div className="border-t border-amber-500/10 p-4">
                <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
                  <Input placeholder="اكتب رسالتك هنا..." value={input} onChange={(e) => setInput(e.target.value)} className="bg-zinc-800 border-amber-500/20 text-white flex-1" />
                  <Button type="submit" disabled={!input.trim() || sendMsg.isPending} className="bg-amber-500 hover:bg-amber-600 text-black"><Send className="w-4 h-4" /></Button>
                </form>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
