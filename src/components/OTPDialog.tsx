import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface OTPDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sentCode: string | null;
  pendingBookingId: number | null;
  onVerify: (id: number, code: string) => void;
  isVerifying: boolean;
}

export function OTPDialog({ open, onOpenChange, sentCode, pendingBookingId, onVerify, isVerifying }: OTPDialogProps) {
  const [otpCode, setOtpCode] = useState(["", "", "", ""]);

  const handleClose = (o: boolean) => {
    if (!o) { onOpenChange(false); setOtpCode(["", "", "", ""]); }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-zinc-900 border-amber-500/20 text-white max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center">تأكيد الحجز</DialogTitle>
          <DialogDescription className="text-center text-gray-400">
            {sentCode ? "كود التحقق الخاص بك" : "تم إرسال كود التحقق عبر واتساب"}
          </DialogDescription>
        </DialogHeader>
        {sentCode && (
          <div className="text-center mb-4">
            <p className="text-gray-400 text-sm mb-2">انسخ الكود التالي أو اضغط تأكيد:</p>
            <p className="text-3xl font-bold text-amber-400 tracking-widest ltr" dir="ltr">{sentCode}</p>
          </div>
        )}
        <div className="flex justify-center gap-3 my-6" dir="ltr">
          {otpCode.map((digit, i) => (
            <input
              key={i}
              type="text"
              maxLength={1}
              autoFocus={i === 0}
              value={digit}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "");
                const newCode = [...otpCode];
                newCode[i] = val;
                setOtpCode(newCode);
                if (val && i < 3) {
                  document.getElementById(`otp-${i + 1}`)?.focus();
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Backspace" && !digit && i > 0) {
                  document.getElementById(`otp-${i - 1}`)?.focus();
                }
              }}
              id={`otp-${i}`}
              className="w-14 h-14 text-center text-2xl font-bold bg-zinc-800 border border-amber-500/30 rounded-xl text-white focus:border-amber-500 focus:outline-none"
            />
          ))}
        </div>
        <Button
          className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold"
          disabled={otpCode.some((d) => !d) || isVerifying}
          onClick={() => {
            if (pendingBookingId) {
              onVerify(pendingBookingId, otpCode.join(""));
            }
          }}
        >
          {isVerifying ? "جاري التحقق..." : "تأكيد"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
