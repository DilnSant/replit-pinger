
export const isUserAdmin = (): boolean => {
  const isAdmin = localStorage.getItem('isAdmin') === 'true';
  const userType = localStorage.getItem('userType') === 'admin';
  const adminToken = localStorage.getItem('adminToken');
  
  return isAdmin || userType || !!adminToken;
};

export const getAuthHeaders = () => {
  const token = localStorage.getItem('supabase_token') || localStorage.getItem('adminToken');
  const isAdmin = isUserAdmin();
  
  // Se for admin, sempre usar as credenciais de admin
  if (isAdmin) {
    return {
      'Authorization': 'AdminAppBrandness:Adminappbrandness'
    };
  }
  
  // Senão, usar token se disponível
  return {
    'Authorization': token ? `Bearer ${token}` : 'AdminAppBrandness:Adminappbrandness'
  };
};
