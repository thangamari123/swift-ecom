import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/lib/store';
import { toast } from 'react-toastify';

export function useAdminRoleGuard(allowedRoles: string[]) {
  const { user, userRole } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    // If not logged in or role is loading, wait
    if (!user || userRole === null) return;
    
    // Superadmin bypasses all role checks
    if (user.email === 'editztm3@gmail.com') return;

    if (!allowedRoles.includes(userRole as string)) {
      toast.error('You do not have permission to access this page.');
      navigate('/admin');
    }
  }, [user, userRole, navigate, allowedRoles]);
}
