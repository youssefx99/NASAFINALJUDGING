// Login Page
class LoginPage {
    static render() {
        return `
            <style>
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                @keyframes fadeInLeft {
                    from {
                        opacity: 0;
                        transform: translateX(-30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-20px); }
                }
                .animate-fadeInUp {
                    animation: fadeInUp 0.8s ease-out;
                }
                .animate-fadeInLeft {
                    animation: fadeInLeft 0.8s ease-out;
                }
                .animate-float {
                    animation: float 3s ease-in-out infinite;
                }
            </style>
            <div class="min-h-screen flex items-center justify-center bg-gray-100 p-8">
                <div class="flex w-full max-w-6xl h-[600px] bg-white rounded-3xl shadow-2xl overflow-hidden">
                    <!-- Left Section - Welcome & Branding -->
                    <div class="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600 relative overflow-hidden">
                        <!-- Decorative Background Elements -->
                        <div class="absolute inset-0">
                            <!-- Wave patterns -->
                            <svg class="absolute bottom-0 left-0 w-full opacity-20" viewBox="0 0 1440 320" xmlns="http://www.w3.org/2000/svg">
                                <path fill="#ffffff" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,154.7C960,171,1056,181,1152,165.3C1248,149,1344,107,1392,85.3L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
                            </svg>
                            
                            <!-- Geometric shapes -->
                            <div class="absolute top-20 left-20 w-16 h-16 border-4 border-white opacity-20 rounded-full animate-float"></div>
                            <div class="absolute top-40 right-32 w-8 h-8 bg-white opacity-10 rounded-full" style="animation: float 4s ease-in-out infinite;"></div>
                            <div class="absolute bottom-40 left-40 w-12 h-12 bg-white opacity-10 transform rotate-45" style="animation: float 5s ease-in-out infinite;"></div>
                            <div class="absolute top-1/3 right-20 text-white opacity-20 text-4xl">+</div>
                            <div class="absolute bottom-1/4 right-1/3 text-white opacity-20 text-2xl">×</div>
                            <div class="absolute top-1/2 left-1/4 w-6 h-6 border-2 border-white opacity-20"></div>
                        </div>
                        
                        <!-- Content -->
                        <div class="relative z-10 flex flex-col justify-between p-12 text-white h-full">
                            <div class="flex-1 flex flex-col justify-center animate-fadeInLeft">
                                <img src="/assets/nasa cairo logo.png" alt="NASA Cairo Logo" class="w-32 h-32 mb-6 animate-float">
                                <h1 class="text-4xl font-bold">Welcome back!</h1>
                            </div>
                            <div class="text-center">
                                <p class="text-white text-sm opacity-80">NASA Teams Judging System</p>
                            </div>
                        </div>
                    </div>

                    <!-- Right Section - Login Form -->
                    <div class="flex-1 flex items-center justify-center bg-white p-12">
                        <div class="w-full max-w-sm animate-fadeInUp">
                            <!-- Mobile Logo -->
                            <div class="lg:hidden text-center mb-6">
                                <img src="/assets/nasa cairo logo.png" alt="NASA Cairo Logo" class="w-20 h-20 mx-auto mb-4">
                            </div>
                            
                            <div>
                                <h2 class="text-2xl font-bold text-gray-900 mb-6">Sign In</h2>
                                ${LoginForm.render()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    static afterRender() {
        // Initialize the login form
        LoginForm.afterRender();
    }
}
