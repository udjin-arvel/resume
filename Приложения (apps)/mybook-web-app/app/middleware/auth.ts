export default defineNuxtRouteMiddleware(async (to) => {
  const authStore = useAuthStore();

  if (!authStore.isAuthenticated) {
    authStore.initAuth();
  }

  const requiresAuth = to.meta.requiresAuth;

  if (requiresAuth) {
    const ok = await authStore.checkAuth();
    if (!ok) {
      return navigateTo('/auth');
    }
  }
  
  // Check if route requires specific permissions
  const requiredRole = to.meta.requiredRole;
  
  if (requiredRole && !hasRole(authStore.user?.status, requiredRole)) {
    // Redirect to home page or show error
    return navigateTo('/');
  }
});

function hasRole(userStatus: string | undefined, requiredRole: string): boolean {
  if (!userStatus) return false;
  
  const roleHierarchy = {
    'ADMIN': 4,
    'MODERATOR': 3,
    'WRITER': 2,
    'READER': 1
  };
  
  const userLevel = roleHierarchy[userStatus as keyof typeof roleHierarchy] || 0;
  const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0;
  
  return userLevel >= requiredLevel;
} 