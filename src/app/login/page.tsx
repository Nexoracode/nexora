import { Logo } from "@/components/logo";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center px-4">
      <div className="card w-full max-w-sm">
        <Logo size={56} className="mb-3" />
        <h1 className="mb-1 text-xl font-bold">نکسورا</h1>
        <p className="mb-5 text-sm text-slate-500">مدیریت لایسنس سایت‌ها</p>
        <LoginForm />
      </div>
    </main>
  );
}
