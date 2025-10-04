// Simple SPA Router
class Router {
  constructor() {
    this.routes = {};
    this.currentRoute = null;
    this.appElement = document.getElementById('app');

    // Listen for browser navigation
    window.addEventListener('popstate', () => {
      this.handleRoute();
    });
  }

  addRoute(path, component) {
    this.routes[path] = component;
  }

  navigate(path, pushState = true) {
    if (pushState) {
      history.pushState({ path }, '', path);
    }
    this.currentRoute = path;
    this.render();
  }

  handleRoute() {
    const path = window.location.pathname;
    this.currentRoute = path;
    this.render();
  }

  render() {
    const path = this.currentRoute || '/';
    console.log('Router rendering path:', path);
    let component = this.routes[path];

    // Handle dynamic routes FIRST
    if (!component) {
      console.log('No exact match, trying dynamic routes...');
      for (const routePath in this.routes) {
        if (routePath.includes(':')) {
          const routeRegex = new RegExp(
            '^' + routePath.replace(/:[^\s/]+/g, '([^/]+)') + '$',
          );
          console.log('Testing route:', routePath, 'regex:', routeRegex, 'against path:', path);
          if (routeRegex.test(path)) {
            component = this.routes[routePath];
            console.log('✅ MATCHED dynamic route:', routePath, 'Component:', component);
            break;
          }
        }
      }
      if (!component) {
        console.log('❌ No dynamic route matched');
      }
    } else {
      console.log('✅ Found exact route match');
    }

    // Check authentication for protected routes
    const protectedAdminRoutes = [
      '/admin',
      '/admin/upload-data',
      '/admin/judges',
      '/admin/teams',
      '/admin/panels',
      '/admin/stage1',
      '/admin/stage2',
      '/admin/stage2-qualify',
    ];
    
    // Check for dynamic routes
    const teamDetailMatch = path.match(/^\/admin\/teams\/[a-f0-9]+$/);
    const isTeamDetailRoute = teamDetailMatch !== null;
    const judgeDetailMatch = path.match(/^\/admin\/judges\/[a-f0-9]+$/);
    const isJudgeDetailRoute = judgeDetailMatch !== null;
    const isProtectedRoute =
      protectedAdminRoutes.includes(path) ||
      isTeamDetailRoute ||
      isJudgeDetailRoute ||
      path === '/dashboard' ||
      path.startsWith('/stage1/') ||
      path.startsWith('/stage2/');

    if (isProtectedRoute && !authService.isAuthenticated()) {
      component = this.routes['/login'];
      this.navigate('/login', false);
    }

    // Check admin routes (only redirect if user is NOT admin)
    if (
      (protectedAdminRoutes.includes(path) || isTeamDetailRoute || isJudgeDetailRoute) &&
      authService.isAuthenticated() &&
      !authService.isAdmin()
    ) {
      component = this.routes['/dashboard'];
      this.navigate('/dashboard', false);
    }
    
    // Default routing logic ONLY if still no component
    if (!component) {
      console.log('⚠️ No component found, using default routing');
      if (authService.isAuthenticated()) {
        component = authService.isAdmin()
          ? this.routes['/admin']
          : this.routes['/dashboard'];
      } else {
        component = this.routes['/login'];
      }
    }

    console.log('🎯 Final component to render:', component?.constructor?.name || component);

    // Clear any existing intervals before rendering new component
    this.clearAllIntervals();

    // Render the component
    if (component) {
      this.appElement.innerHTML = component.render();
      if (component.afterRender) {
        component.afterRender();
      }
    }
  }

  clearAllIntervals() {
    // Clear admin page intervals
    if (window.adminRefreshInterval) {
      clearInterval(window.adminRefreshInterval);
      window.adminRefreshInterval = null;
    }

    // Clear panel management intervals
    if (window.panelRefreshInterval) {
      clearInterval(window.panelRefreshInterval);
      window.panelRefreshInterval = null;
    }

    // Clear any other intervals that might be running
    if (window.stage1RefreshInterval) {
      clearInterval(window.stage1RefreshInterval);
      window.stage1RefreshInterval = null;
    }

    if (window.stage2RefreshInterval) {
      clearInterval(window.stage2RefreshInterval);
      window.stage2RefreshInterval = null;
    }
  }

  start() {
    this.handleRoute();
  }
}

// Global router instance
const router = new Router();
