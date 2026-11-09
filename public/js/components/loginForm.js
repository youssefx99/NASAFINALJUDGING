// Login Form Component
class LoginForm {
    static render() {
        return `
            <form id="loginForm" class="space-y-5">
                <div>
                    <label for="email" class="label">Email address</label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        autocomplete="username"
                        autocapitalize="none"
                        spellcheck="false"
                        required
                        class="input py-2.5 text-base sm:text-sm"
                        placeholder="you@example.com"
                    />
                </div>

                <div>
                    <label for="password" class="label">Password</label>
                    <div class="relative">
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autocomplete="current-password"
                            required
                            class="input py-2.5 pr-11 text-base sm:text-sm"
                            placeholder="Enter your password"
                        />
                        <button type="button" id="togglePassword" class="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-slate-400 hover:text-slate-600 focus:outline-none focus-visible:text-blue-600" aria-label="Show password">
                            <svg data-eye class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                            <svg data-eye-off class="hidden h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path></svg>
                        </button>
                    </div>
                </div>

                <div id="loginError" role="alert" class="hidden rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"></div>

                <button type="submit" class="btn btn-primary w-full py-3 text-base">Sign in</button>
            </form>
        `;
    }

    static afterRender() {
        const form = document.getElementById('loginForm');
        const errorDiv = document.getElementById('loginError');
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        const toggle = document.getElementById('togglePassword');

        if (window.matchMedia('(pointer: fine)').matches) emailInput.focus();

        toggle.addEventListener('click', () => {
            const show = passwordInput.type === 'password';
            passwordInput.type = show ? 'text' : 'password';
            toggle.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
            toggle.querySelector('[data-eye]').classList.toggle('hidden', show);
            toggle.querySelector('[data-eye-off]').classList.toggle('hidden', !show);
        });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            errorDiv.classList.add('hidden');

            const submitBtn = form.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.innerHTML = `
                <svg class="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                Signing in…
            `;

            const showError = (message) => {
                errorDiv.textContent = message;
                errorDiv.classList.remove('hidden');
                passwordInput.select();
            };

            try {
                const result = await authService.login(emailInput.value.trim(), passwordInput.value);
                if (result.success) {
                    router.navigate(result.user.role === 'admin' ? '/admin' : '/dashboard');
                    return;
                }
                showError(result.message);
            } catch (error) {
                showError('An unexpected error occurred');
            }
            submitBtn.disabled = false;
            submitBtn.textContent = 'Sign in';
        });
    }
}
