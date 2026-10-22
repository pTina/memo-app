import { GoogleLoginButton } from '@/features/auth/components/GoogleLoginButton';

export function LoginPage() {
  return (
    <main className="relative z-10 flex min-h-full flex-col items-center justify-center bg-canvas px-4 text-ink">
      <h1 className="text-2xl">메모장</h1>
      <p className="mt-2 text-sm text-muted">Google 계정으로 로그인하면 메모가 계정에 저장됩니다.</p>
      <div className="mt-6">
        <GoogleLoginButton />
      </div>
    </main>
  );
}