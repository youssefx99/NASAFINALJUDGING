// Main Application
class App {
  constructor() {
    this.init();
  }

  init() {
    // Register routes
    router.addRoute('/login', LoginPage);
    router.addRoute('/', LoginPage);
    router.addRoute('/admin', AdminPage);
    router.addRoute('/admin/upload-data', UploadDataPage);
    router.addRoute('/admin/upload-data-stream', UploadDataStreamPage);
    router.addRoute('/admin/judges', JudgesManagementPage);
    router.addRoute('/admin/judges/:id', JudgeDetailPage);
    router.addRoute('/admin/teams', TeamsManagementPage);
    router.addRoute('/admin/teams/:id', TeamDetailPage);
    router.addRoute('/admin/panels', PanelManagementPage);
    router.addRoute('/admin/stage1', Stage1ManagementPage);
    router.addRoute('/admin/stage2', Stage2ManagementPage);
    router.addRoute('/admin/stage2-qualify', Stage2QualifyPage);
    router.addRoute('/winners', WinnersPage);
    router.addRoute('/dashboard', DashboardPage);
    router.addRoute('/stage1/:teamId', Stage1TeamDetailPage);
    router.addRoute('/stage2/:teamId', Stage2TeamDetailPage);

    // Start the router
    router.start();

    // Handle initial routing based on authentication
    this.handleInitialRoute();
  }

  handleInitialRoute() {
    const currentPath = window.location.pathname;

    // Force redirect to login if not authenticated
    if (!authService.isAuthenticated()) {
      if (currentPath !== '/login') {
        router.navigate('/login', false);
      }
    } else {
      // Authenticated users
      if (currentPath === '/login' || currentPath === '/') {
        if (authService.isAdmin()) {
          router.navigate('/admin', false);
        } else {
          router.navigate('/dashboard', false);
        }
      } else {
        router.render();
      }
    }
  }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new App();
});
