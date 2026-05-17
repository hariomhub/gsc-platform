import { useContext } from 'react';
import AuthContext from '../context/AuthContext.tsx';

/**
 * Access the AuthContext.
 * Must be used inside <AuthProvider>.
 */
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used inside <AuthProvider>');
    }
    return context;
};
