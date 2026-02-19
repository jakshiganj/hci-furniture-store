/**
 * ProtectedRoute — Route guard component
 *
 * Wraps any route that requires authentication.
 * If the user is not logged in, they are redirected to /login.
 * If logged in, the wrapped children are rendered normally.
 *
 * Usage in App.tsx:
 *   <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
 */

import { Navigate } from 'react-router-dom';
import { isLoggedIn } from '../utils/auth';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
    // Check if user has an active session in localStorage
    if (!isLoggedIn()) {
        // No session → redirect to login page
        return <Navigate to="/login" replace />;
    }

    // Session exists → render the protected content
    return <>{children}</>;
}
