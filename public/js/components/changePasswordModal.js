// Change Password Modal Component
class ChangePasswordModal {
    static isOpen = false;

    static render() {
        if (!ChangePasswordModal.isOpen) return '';

        return `
            <div id="changePasswordModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                    <div class="mt-3">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="text-lg font-medium text-gray-900">Change Password</h3>
                            <button onclick="ChangePasswordModal.close()" class="text-gray-400 hover:text-gray-600">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                            </button>
                        </div>
                        
                        <form id="changePasswordForm" class="space-y-4">
                            <!-- Current Password -->
                            <div>
                                <label for="currentPassword" class="block text-sm font-medium text-gray-700 mb-1">
                                    Current Password
                                </label>
                                <input 
                                    type="password" 
                                    id="currentPassword" 
                                    name="currentPassword"
                                    required
                                    class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Enter current password"
                                />
                            </div>

                            <!-- New Password -->
                            <div>
                                <label for="newPassword" class="block text-sm font-medium text-gray-700 mb-1">
                                    New Password
                                </label>
                                <input 
                                    type="password" 
                                    id="newPassword" 
                                    name="newPassword"
                                    required
                                    class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Enter new password"
                                    oninput="ChangePasswordModal.validatePassword()"
                                />
                                <!-- Password Strength Indicator -->
                                <div id="passwordStrength" class="mt-2 hidden">
                                    <div class="flex items-center space-x-2">
                                        <div class="flex-1 bg-gray-200 rounded-full h-2">
                                            <div id="strengthBar" class="h-2 rounded-full transition-all duration-300" style="width: 0%"></div>
                                        </div>
                                        <span id="strengthText" class="text-xs font-medium"></span>
                                    </div>
                                    <div id="passwordRequirements" class="mt-2 text-xs space-y-1">
                                        <div id="req-length" class="flex items-center space-x-1">
                                            <span class="w-3 h-3 rounded-full bg-gray-300"></span>
                                            <span>At least 8 characters</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Confirm Password -->
                            <div>
                                <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-1">
                                    Confirm New Password
                                </label>
                                <input 
                                    type="password" 
                                    id="confirmPassword" 
                                    name="confirmPassword"
                                    required
                                    class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Confirm new password"
                                    oninput="ChangePasswordModal.validatePasswordMatch()"
                                />
                                <div id="passwordMatch" class="mt-1 text-xs hidden"></div>
                            </div>

                            <!-- Error Message -->
                            <div id="changePasswordError" class="hidden bg-red-50 border border-red-200 rounded-md p-3">
                                <div class="flex">
                                    <svg class="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
                                    </svg>
                                    <div class="ml-3">
                                        <p class="text-sm text-red-800" id="changePasswordErrorText"></p>
                                    </div>
                                </div>
                            </div>

                            <!-- Success Message -->
                            <div id="changePasswordSuccess" class="hidden bg-green-50 border border-green-200 rounded-md p-3">
                                <div class="flex">
                                    <svg class="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                                    </svg>
                                    <div class="ml-3">
                                        <p class="text-sm text-green-800">Password changed successfully!</p>
                                    </div>
                                </div>
                            </div>

                            <!-- Buttons -->
                            <div class="flex justify-end space-x-3 pt-4">
                                <button 
                                    type="button" 
                                    onclick="ChangePasswordModal.close()"
                                    class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    id="changePasswordSubmit"
                                    class="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Change Password
                                </button>
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
    }

    static close() {
        ChangePasswordModal.isOpen = false;
        const modal = document.getElementById('changePasswordModal');
        if (modal) {
            modal.remove();
        }
    }

    static renderModal() {
        // Remove existing modal if any
        const existingModal = document.getElementById('changePasswordModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', ChangePasswordModal.render());
    }

    static attachEventListeners() {
        const form = document.getElementById('changePasswordForm');
        if (form) {
            form.addEventListener('submit', ChangePasswordModal.handleSubmit);
        }

        // Close modal when clicking outside
        const modal = document.getElementById('changePasswordModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    ChangePasswordModal.close();
                }
            });
        }
    }

    static async handleSubmit(e) {
        e.preventDefault();
        
        const submitButton = document.getElementById('changePasswordSubmit');
        const errorDiv = document.getElementById('changePasswordError');
        const successDiv = document.getElementById('changePasswordSuccess');
        
        // Hide previous messages
        errorDiv.classList.add('hidden');
        successDiv.classList.add('hidden');
        
        // Disable submit button
        submitButton.disabled = true;
        submitButton.textContent = 'Changing...';

        try {
            const formData = new FormData(e.target);
            const data = {
                currentPassword: formData.get('currentPassword'),
                newPassword: formData.get('newPassword'),
                confirmPassword: formData.get('confirmPassword')
            };

            // Client-side validation
            if (!data.currentPassword || !data.newPassword || !data.confirmPassword) {
                throw new Error('All fields are required');
            }

            if (data.newPassword !== data.confirmPassword) {
                throw new Error('New password and confirmation do not match');
            }

            // Make API call
            const response = await fetch('/api/auth/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authService.token}`
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok) {
                // Show success message
                successDiv.classList.remove('hidden');
                
                // Reset form
                e.target.reset();
                
                // Close modal after 2 seconds
                setTimeout(() => {
                    ChangePasswordModal.close();
                }, 2000);
            } else {
                throw new Error(result.message || 'Failed to change password');
            }
        } catch (error) {
            // Show error message
            document.getElementById('changePasswordErrorText').textContent = error.message;
            errorDiv.classList.remove('hidden');
        } finally {
            // Re-enable submit button
            submitButton.disabled = false;
            submitButton.textContent = 'Change Password';
        }
    }

    static validatePassword() {
        const passwordInput = document.getElementById('newPassword');
        const strengthDiv = document.getElementById('passwordStrength');
        const strengthBar = document.getElementById('strengthBar');
        const strengthText = document.getElementById('strengthText');
        
        const password = passwordInput.value;
        
        if (password.length === 0) {
            strengthDiv.classList.add('hidden');
            return;
        }
        
        strengthDiv.classList.remove('hidden');
        
        // Check requirements (only length)
        const requirements = {
            length: password.length >= 8
        };
        
        // Update requirement indicators
        Object.keys(requirements).forEach(req => {
            const element = document.getElementById(`req-${req}`);
            const indicator = element.querySelector('span');
            if (requirements[req]) {
                indicator.className = 'w-3 h-3 rounded-full bg-green-500';
                element.classList.add('text-green-600');
                element.classList.remove('text-gray-600');
            } else {
                indicator.className = 'w-3 h-3 rounded-full bg-gray-300';
                element.classList.add('text-gray-600');
                element.classList.remove('text-green-600');
            }
        });
        
        // Calculate strength based on length
        const strength = requirements.length ? 100 : (password.length / 8) * 100;
        
        // Update strength bar
        strengthBar.style.width = `${Math.min(strength, 100)}%`;
        
        if (password.length < 8) {
            strengthBar.className = 'h-2 rounded-full transition-all duration-300 bg-red-500';
            strengthText.textContent = 'Too Short';
            strengthText.className = 'text-xs font-medium text-red-600';
        } else {
            strengthBar.className = 'h-2 rounded-full transition-all duration-300 bg-green-500';
            strengthText.textContent = 'Valid';
            strengthText.className = 'text-xs font-medium text-green-600';
        }
    }

    static validatePasswordMatch() {
        const newPasswordInput = document.getElementById('newPassword');
        const confirmPasswordInput = document.getElementById('confirmPassword');
        const matchDiv = document.getElementById('passwordMatch');
        
        const newPassword = newPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        
        if (confirmPassword.length === 0) {
            matchDiv.classList.add('hidden');
            return;
        }
        
        matchDiv.classList.remove('hidden');
        
        if (newPassword === confirmPassword) {
            matchDiv.textContent = '✓ Passwords match';
            matchDiv.className = 'mt-1 text-xs text-green-600';
        } else {
            matchDiv.textContent = '✗ Passwords do not match';
            matchDiv.className = 'mt-1 text-xs text-red-600';
        }
    }
}
