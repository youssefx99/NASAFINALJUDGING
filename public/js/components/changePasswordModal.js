// Change Password Modal Component
class ChangePasswordModal {
    static isOpen = false;

    static onKeydown = (e) => {
        if (e.key === 'Escape') ChangePasswordModal.close();
    };

    static render() {
        if (!ChangePasswordModal.isOpen) return '';

        return `
            <div id="changePasswordModal" class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm">
                <div class="flex min-h-full items-center justify-center p-4">
                    <div class="card w-full max-w-md" role="dialog" aria-modal="true" aria-labelledby="changePasswordTitle">
                        <div class="card-header">
                            <div>
                                <h3 id="changePasswordTitle" class="card-title">Change password</h3>
                                <p class="mt-0.5 text-sm text-slate-500">Choose a new password with at least 8 characters.</p>
                            </div>
                            <button type="button" onclick="ChangePasswordModal.close()" class="btn btn-ghost -mr-2 h-9 w-9 p-0" aria-label="Close">
                                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>

                        <form id="changePasswordForm" class="card-body space-y-4" novalidate>
                            <div>
                                <label for="currentPassword" class="label">Current password</label>
                                <input type="password" id="currentPassword" name="currentPassword" autocomplete="current-password" required
                                    class="input py-2.5 text-base sm:text-sm" placeholder="Enter current password" />
                            </div>

                            <div>
                                <label for="newPassword" class="label">New password</label>
                                <input type="password" id="newPassword" name="newPassword" autocomplete="new-password" required
                                    class="input py-2.5 text-base sm:text-sm" placeholder="Enter new password"
                                    oninput="ChangePasswordModal.validatePassword()" />
                                <div id="passwordStrength" class="mt-2 hidden">
                                    <div class="flex items-center gap-2">
                                        <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200">
                                            <div id="strengthBar" class="h-full rounded-full transition-all duration-300" style="width: 0%"></div>
                                        </div>
                                        <span id="strengthText" class="text-xs font-medium"></span>
                                    </div>
                                    <div id="req-length" class="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500">
                                        <span class="h-2 w-2 rounded-full bg-slate-300"></span>
                                        <span>At least 8 characters</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label for="confirmPassword" class="label">Confirm new password</label>
                                <input type="password" id="confirmPassword" name="confirmPassword" autocomplete="new-password" required
                                    class="input py-2.5 text-base sm:text-sm" placeholder="Re-enter new password"
                                    oninput="ChangePasswordModal.validatePasswordMatch()" />
                                <div id="passwordMatch" class="mt-1.5 hidden text-xs"></div>
                            </div>

                            <div id="changePasswordError" role="alert" class="hidden rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                                <span id="changePasswordErrorText"></span>
                            </div>

                            <div class="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                                <button type="button" onclick="ChangePasswordModal.close()" class="btn btn-secondary">Cancel</button>
                                <button type="submit" id="changePasswordSubmit" class="btn btn-primary">Change password</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
    }

    static open() {
        ChangePasswordModal.isOpen = true;
        ChangePasswordModal.renderModal();
        ChangePasswordModal.attachEventListeners();
        document.getElementById('currentPassword').focus();
    }

    static close() {
        ChangePasswordModal.isOpen = false;
        document.removeEventListener('keydown', ChangePasswordModal.onKeydown);
        const modal = document.getElementById('changePasswordModal');
        if (modal) {
            modal.remove();
        }
    }

    static renderModal() {
        const existingModal = document.getElementById('changePasswordModal');
        if (existingModal) {
            existingModal.remove();
        }
        document.body.insertAdjacentHTML('beforeend', ChangePasswordModal.render());
    }

    static attachEventListeners() {
        document.getElementById('changePasswordForm').addEventListener('submit', ChangePasswordModal.handleSubmit);
        document.getElementById('changePasswordModal').addEventListener('click', (e) => {
            if (!e.target.closest('[role="dialog"]')) ChangePasswordModal.close();
        });
        document.removeEventListener('keydown', ChangePasswordModal.onKeydown);
        document.addEventListener('keydown', ChangePasswordModal.onKeydown);
    }

    static showError(message) {
        document.getElementById('changePasswordErrorText').textContent = message;
        document.getElementById('changePasswordError').classList.remove('hidden');
    }

    static async handleSubmit(e) {
        e.preventDefault();

        const submitButton = document.getElementById('changePasswordSubmit');
        document.getElementById('changePasswordError').classList.add('hidden');

        const formData = new FormData(e.target);
        const data = {
            currentPassword: formData.get('currentPassword'),
            newPassword: formData.get('newPassword'),
            confirmPassword: formData.get('confirmPassword'),
        };

        let validationError = null;
        if (!data.currentPassword || !data.newPassword || !data.confirmPassword) {
            validationError = 'All fields are required';
        } else if (data.newPassword.length < 8) {
            validationError = 'New password must be at least 8 characters';
        } else if (data.newPassword !== data.confirmPassword) {
            validationError = 'New password and confirmation do not match';
        } else if (data.newPassword === data.currentPassword) {
            validationError = 'New password must be different from current password';
        }
        if (validationError) {
            ChangePasswordModal.showError(validationError);
            return;
        }

        submitButton.disabled = true;
        submitButton.textContent = 'Changing…';

        try {
            const result = await UI.api('/api/auth/change-password', { method: 'POST', body: data });
            if (result?.token) authService.setToken(result.token);
            ChangePasswordModal.close();
            UI.toast('Password changed successfully', 'success');
        } catch (error) {
            ChangePasswordModal.showError(error.message || 'Failed to change password');
            submitButton.disabled = false;
            submitButton.textContent = 'Change password';
        }
    }

    static validatePassword() {
        const password = document.getElementById('newPassword').value;
        const strengthDiv = document.getElementById('passwordStrength');
        const strengthBar = document.getElementById('strengthBar');
        const strengthText = document.getElementById('strengthText');
        const requirement = document.getElementById('req-length');

        if (document.getElementById('confirmPassword').value) {
            ChangePasswordModal.validatePasswordMatch();
        }

        if (password.length === 0) {
            strengthDiv.classList.add('hidden');
            return;
        }
        strengthDiv.classList.remove('hidden');

        const valid = password.length >= 8;
        strengthBar.style.width = `${valid ? 100 : (password.length / 8) * 100}%`;

        if (valid) {
            strengthBar.className = 'h-full rounded-full bg-emerald-500 transition-all duration-300';
            strengthText.textContent = 'Valid';
            strengthText.className = 'text-xs font-medium text-emerald-600';
            requirement.className = 'mt-1.5 flex items-center gap-1.5 text-xs text-emerald-600';
            requirement.firstElementChild.className = 'h-2 w-2 rounded-full bg-emerald-500';
        } else {
            strengthBar.className = 'h-full rounded-full bg-red-500 transition-all duration-300';
            strengthText.textContent = 'Too short';
            strengthText.className = 'text-xs font-medium text-red-600';
            requirement.className = 'mt-1.5 flex items-center gap-1.5 text-xs text-slate-500';
            requirement.firstElementChild.className = 'h-2 w-2 rounded-full bg-slate-300';
        }
    }

    static validatePasswordMatch() {
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const matchDiv = document.getElementById('passwordMatch');

        if (confirmPassword.length === 0) {
            matchDiv.classList.add('hidden');
            return;
        }

        if (newPassword === confirmPassword) {
            matchDiv.textContent = '✓ Passwords match';
            matchDiv.className = 'mt-1.5 text-xs text-emerald-600';
        } else {
            matchDiv.textContent = '✗ Passwords do not match';
            matchDiv.className = 'mt-1.5 text-xs text-red-600';
        }
    }
}
