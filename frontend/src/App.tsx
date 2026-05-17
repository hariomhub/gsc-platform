import React, { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Navbar          from './components/layout/Navbar.tsx';
import Footer          from './components/layout/Footer.tsx';
import ScrollToTop     from './components/common/ScrollToTop.tsx';
import LoadingSpinner  from './components/common/LoadingSpinner.tsx';
import ProtectedRoute  from './components/common/ProtectedRoute.tsx';
import AdminRoute      from './components/common/AdminRoute.tsx';
import { useAuth }     from './hooks/useAuth.js';
import { ROUTES }      from './constants/routes.js';

// ── Lazy page imports ─────────────────────────────────────────────────────────
const Home                = lazy(() => import('./pages/Home.tsx'));
const About               = lazy(() => import('./pages/About.tsx'));
const Events              = lazy(() => import('./pages/Events.tsx'));
const Services            = lazy(() => import('./pages/Services.tsx'));
const Framework           = lazy(() => import('./pages/Framework.tsx'));
const Resources           = lazy(() => import('./pages/Resources.tsx'));
const ResourceDetail      = lazy(() => import('./pages/ResourceDetail.tsx'));
const Certifications      = lazy(() => import('./pages/Certifications.tsx'));
const CommunityFeed       = lazy(() => import('./pages/CommunityFeed.tsx'));
const FeedPostDetail      = lazy(() => import('./pages/FeedPostDetail.tsx'));
const News                = lazy(() => import('./pages/News.tsx'));
const MediaHub            = lazy(() => import('./pages/MediaHub.tsx'));
const ProductReviews      = lazy(() => import('./pages/ProductReviews.tsx'));
const ProductReviewDetail = lazy(() => import('./pages/ProductReviewDetail.tsx'));
const AllNominees         = lazy(() => import('./pages/AllNominees.tsx'));
const AllWinners          = lazy(() => import('./pages/AllWinners.tsx'));
const Membership          = lazy(() => import('./pages/Membership.tsx'));
const Contact             = lazy(() => import('./pages/Contact.tsx'));
const Login               = lazy(() => import('./pages/Login.tsx'));
const Register            = lazy(() => import('./pages/Register.tsx'));
const RegisterComplete    = lazy(() => import('./pages/RegisterComplete.tsx'));
const Profile             = lazy(() => import('./pages/Profile.tsx'));
const UserDashboard       = lazy(() => import('./pages/UserDashboard.tsx'));
const ExpertWorkshops     = lazy(() => import('./pages/ExpertWorkshops.tsx'));
const CouncilCheckout     = lazy(() => import('./pages/CouncilCheckout.tsx'));
const Notifications       = lazy(() => import('./pages/Notifications.tsx'));
const PrivacyPolicy       = lazy(() => import('./pages/PrivacyPolicy.tsx'));
const DeleteAccount       = lazy(() => import('./pages/DeleteAccount.tsx'));
const NotFound            = lazy(() => import('./pages/NotFound.tsx'));
// Admin
const AdminDashboard      = lazy(() => import('./pages/admin/AdminDashboard.tsx'));
const UserManagement      = lazy(() => import('./pages/admin/UserManagement.tsx'));
const AdminNominees       = lazy(() => import('./pages/admin/AdminNominees.tsx'));

// ── OAuth callback ─────────────────────────────────────────────────────────────
const OAuthLanding = () => {
  const { user, isAuthLoading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (isAuthLoading) return;
    if (user) {
      navigate(user.role === 'founding_member' ? ROUTES.ADMIN : ROUTES.DASHBOARD, { replace: true });
    } else {
      navigate('/login?error=linkedin_failed', { replace: true });
    }
  }, [user, isAuthLoading, navigate]);
  return <LoadingSpinner fullPage />;
};

// ── Guest-only guard ───────────────────────────────────────────────────────────
const GuestRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isAuthLoading } = useAuth();
  if (isAuthLoading) return <LoadingSpinner fullPage />;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
};

export default function App() {
  return (
    <>
      <ScrollToTop />
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <main id="main-content" style={{ flex: 1 }}>
          <Suspense fallback={<LoadingSpinner fullPage />}>
            <Routes>
              {/* Public */}
              <Route path={ROUTES.HOME}          element={<Home />} />
              <Route path={ROUTES.ABOUT}         element={<About />} />
              <Route path={ROUTES.EVENTS}        element={<Events />} />
              <Route path={ROUTES.SERVICES}      element={<Services />} />
              <Route path={ROUTES.FRAMEWORK}     element={<Framework />} />
              <Route path={ROUTES.RESOURCES}     element={<Resources />} />
              <Route path="/resources/:id"       element={<ResourceDetail />} />
              <Route path={ROUTES.CERTIFICATION} element={<Certifications />} />
              <Route path={ROUTES.COMMUNITY}     element={<CommunityFeed />} />
              <Route path="/community/:id"       element={<FeedPostDetail />} />
              <Route path={ROUTES.NEWS}          element={<News />} />
              <Route path={ROUTES.MEDIA_HUB}     element={<MediaHub />} />
              <Route path={ROUTES.CONTACT}       element={<Contact />} />
              <Route path={ROUTES.PRIVACY}       element={<PrivacyPolicy />} />
              <Route path="/delete-account"      element={<DeleteAccount />} />
              <Route path={ROUTES.PRODUCT_REVIEWS}      element={<ProductReviews />} />
              <Route path="/services/esg-solutions/:id" element={<ProductReviewDetail />} />
              <Route path={ROUTES.NOMINEES}      element={<AllNominees />} />
              <Route path={ROUTES.WINNERS}       element={<AllWinners />} />
              {/* Legacy redirects */}
              <Route path="/community"       element={<Navigate to="/community" replace />} />
              <Route path="/community/:id"   element={<Navigate to="/community" replace />} />
              <Route path="/ai-research"         element={<Navigate to="/community" replace />} />
              <Route path="/assessment"          element={<Navigate to="/framework" replace />} />
              <Route path="/services/product-reviews"    element={<Navigate to="/services/esg-solutions" replace />} />
              <Route path="/services/product-reviews/:id" element={<Navigate to="/services/esg-solutions" replace />} />
              <Route path="/executive-workshops" element={<Navigate to="/expert-workshops" replace />} />
              {/* Membership */}
              <Route path={ROUTES.MEMBERSHIP}    element={<Membership />} />
              <Route path={ROUTES.LOGIN}         element={<GuestRoute><Login /></GuestRoute>} />
              <Route path={ROUTES.REGISTER}      element={<GuestRoute><Register /></GuestRoute>} />
              <Route path="/register/complete"   element={<RegisterComplete />} />
              {/* Protected */}
              <Route path={ROUTES.WORKSHOPS}     element={<ExpertWorkshops />} />
              <Route path="/council-checkout"    element={<ProtectedRoute><CouncilCheckout /></ProtectedRoute>} />
              <Route path={ROUTES.PROFILE}       element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path={ROUTES.DASHBOARD}     element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
              <Route path={ROUTES.NOTIFICATIONS} element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
              {/* Admin */}
              <Route path={ROUTES.ADMIN}         element={<AdminRoute><AdminDashboard /></AdminRoute>} />
              <Route path={ROUTES.ADMIN_USERS}   element={<AdminRoute><UserManagement /></AdminRoute>} />
              <Route path={ROUTES.ADMIN_NOMINEES}element={<AdminRoute><AdminNominees /></AdminRoute>} />
              {/* OAuth */}
              <Route path="/auth/callback"       element={<OAuthLanding />} />
              {/* 404 */}
              <Route path="*"                    element={<NotFound />} />
            </Routes>
          </Suspense>
        </main>
        <Footer />
      </div>
    </>
  );
}
