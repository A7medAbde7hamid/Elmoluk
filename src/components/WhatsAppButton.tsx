import { MessageCircle } from "lucide-react";

export function WhatsAppButton() {
  return (
    <a
      href="https://wa.me/201097314558"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 bg-green-600 hover:bg-green-700 text-white p-4 rounded-full shadow-lg hover:scale-110 transition-all duration-200"
      title="راسلنا على واتساب"
    >
      <MessageCircle className="w-6 h-6" />
    </a>
  );
}
