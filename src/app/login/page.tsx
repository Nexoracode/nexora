import { BrandMark } from "@/components/brand-mark";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden px-4">
      {/* Soft glows in the logo's colours behind the card. */}
      <div aria-hidden className="pointer-events-none absolute -start-32 -top-32 size-96 rounded-full bg-[#22d3ee]/20 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-40 -end-32 size-[28rem] rounded-full bg-[#8b5cf6]/20 blur-3xl" />

      <div className="relative w-full max-w-sm">
        <div className="mb-7 flex justify-center">
          <BrandMark size={44} />
        </div>
        <div className="card !p-7 shadow-[0_10px_40px_rgba(67,97,238,0.10)]">
          <h1 className="mb-1 text-xl font-bold">ورود به پنل</h1>
          <p className="mb-6 text-sm text-slate-500">مدیریت لایسنس سایت‌ها</p>
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
