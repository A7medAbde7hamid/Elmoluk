import { Banknote, CreditCard, Smartphone, Wallet, Upload } from "lucide-react";

type PaymentMethod = "cash" | "card" | "vodafone_cash" | "wallet";

interface Props {
  value: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
  totalAmount: number;
  receiptImage?: string | null;
  onReceiptUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const methods: { value: PaymentMethod; label: string; icon: typeof Banknote; description: string }[] = [
  { value: "cash", label: "نقداً", icon: Banknote, description: "الدفع عند الحضور" },
  { value: "card", label: "بطاقة ائتمان", icon: CreditCard, description: "فيزا - ماستركارد" },
  { value: "vodafone_cash", label: "فودافون كاش", icon: Smartphone, description: "الدفع عبر Vodafone Cash" },
  { value: "wallet", label: "المحفظة", icon: Wallet, description: "الرصيد المتاح في المحفظة" },
];

export function PaymentMethodSelector({ value, onChange, totalAmount, receiptImage, onReceiptUpload }: Props) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-white mb-4">طريقة الدفع</h3>
      <div className="grid grid-cols-2 gap-3">
        {methods.map((method) => (
          <button
            key={method.value}
            onClick={() => onChange(method.value)}
            className={`p-4 rounded-xl border-2 text-right transition-all ${
              value === method.value
                ? "border-amber-500 bg-amber-500/10"
                : "border-zinc-800 bg-zinc-900/50 hover:border-amber-500/30"
            }`}
          >
            <method.icon className={`w-6 h-6 mb-2 ${value === method.value ? "text-amber-400" : "text-gray-400"}`} />
            <p className="font-bold text-white text-sm">{method.label}</p>
            <p className="text-gray-500 text-xs mt-1">{method.description}</p>
          </button>
        ))}
      </div>

      {value === "vodafone_cash" && (
        <div className="bg-zinc-900 rounded-xl border border-amber-500/20 p-4">
          <p className="text-amber-400 font-bold mb-2">بيانات الدفع عبر فودافون كاش</p>
          <p className="text-gray-400 text-sm mb-3">
            قم بتحويل المبلغ {totalAmount.toLocaleString()} ج.م إلى الرقم التالي:
          </p>
          <div className="bg-black rounded-lg p-3 text-center mb-3">
            <span className="text-2xl font-bold text-amber-400">01068824098</span>
          </div>
          <p className="text-gray-400 text-sm mb-3">ثم قم برفع صورة الإيصال:</p>
          <label className="flex items-center gap-2 px-4 py-3 bg-amber-500/10 border border-amber-500/30 rounded-lg cursor-pointer hover:bg-amber-500/20 transition-colors">
            <Upload className="w-5 h-5 text-amber-400" />
            <span className="text-amber-400 text-sm font-medium">
              {receiptImage ? "تم رفع الإيصال" : "رفع إيصال الدفع"}
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={onReceiptUpload}
              className="hidden"
            />
          </label>
          {receiptImage && (
            <img
              src={receiptImage}
              alt="Receipt"
              className="mt-3 w-full h-32 object-cover rounded-lg"
            />
          )}
        </div>
      )}
    </div>
  );
}
