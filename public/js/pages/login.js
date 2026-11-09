// Login Page
class LoginPage {
    static render() {
        return `
            <div class="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-10">
                <div class="pointer-events-none absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950"></div>
                <div class="pointer-events-none absolute inset-0 opacity-70" style="background-image: radial-gradient(1.5px 1.5px at 12% 18%, rgba(255,255,255,0.9), transparent), radial-gradient(1px 1px at 32% 72%, rgba(255,255,255,0.7), transparent), radial-gradient(1px 1px at 58% 34%, rgba(255,255,255,0.6), transparent), radial-gradient(1.5px 1.5px at 78% 82%, rgba(255,255,255,0.8), transparent), radial-gradient(1px 1px at 88% 12%, rgba(255,255,255,0.7), transparent), radial-gradient(1px 1px at 46% 92%, rgba(255,255,255,0.5), transparent), radial-gradient(1px 1px at 6% 56%, rgba(255,255,255,0.6), transparent); background-size: 420px 420px;"></div>
                <div class="pointer-events-none absolute -top-48 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-blue-500/20 blur-3xl"></div>
                <div class="pointer-events-none absolute -bottom-48 -right-24 h-[26rem] w-[26rem] rounded-full bg-indigo-500/20 blur-3xl"></div>

                <div class="relative w-full max-w-md">
                    <div class="mb-8 flex flex-col items-center text-center">
                        <img src="/assets/nasa%20cairo%20logo.png" alt="NASA Space Apps Cairo" class="h-20 w-20 rounded-2xl bg-white/10 object-contain p-2 shadow-lg ring-1 ring-white/20">
                        <p class="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-blue-300">NASA Space Apps · Cairo</p>
                        <h1 class="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl">Judging System</h1>
                    </div>

                    <div class="rounded-2xl bg-white p-6 shadow-2xl shadow-black/40 sm:p-8">
                        <h2 class="text-xl font-semibold text-slate-900">Sign in</h2>
                        <p class="mt-1 text-sm text-slate-500">Use the credentials provided by the organizers.</p>
                        <div class="mt-6">
                            ${LoginForm.render()}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    static afterRender() {
        LoginForm.afterRender();
    }
}
