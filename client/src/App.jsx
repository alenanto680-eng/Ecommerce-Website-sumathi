import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import './styles/globals.css';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';

import Navbar from './components/navbar/Navbar';
import Footer from './components/navbar/Footer';

// ── Lazy load public pages ──────────────────────────────────────────────────
const HomePage = lazy(() => import('./pages/Mainpage/HomePage'));
const CollectionsPage = lazy(() => import('./pages/collections/CollectionsPage'));
const AgeGroupPage = lazy(() => import('./pages/collections/AgeGroupPage'));
const CollectionDetailPage = lazy(() => import('./pages/collectiondetails/CollectionDetailPage'));
const CartPage = lazy(() => import('./pages/cart/CartPage'));
const ContactPage = lazy(() => import('./pages/contact/ContactPage'));
const PersonInformation = lazy(() => import('./pages/personinformation/PersonInformation'));
const AccountHub = lazy(() => import('./pages/personinformation/AccountHub'));
const ManageAddresses = lazy(() => import('./pages/manageaddresses/ManageAddresses'));
const MyOrders = lazy(() => import('./pages/myorders/MyOrders'));
const OrderDetail = lazy(() => import('./pages/myorders/OrderDetail'));
const Wishlist = lazy(() => import('./pages/wishlist/Wishlist'));
const MyReviews = lazy(() => import('./pages/myreviews/MyReviews'));
const WriteReview = lazy(() => import('./pages/myorders/WriteReview'));
const SupportHub = lazy(() => import('./pages/support/SupportHub'));
const OrderHelp = lazy(() => import('./pages/support/OrderHelp'));
const ChatSupport = lazy(() => import('./pages/support/ChatSupport'));
const ReviewSubmit = lazy(() => import('./pages/review/ReviewSubmit'));
const Policy = lazy(() => import('./pages/policy/Policy'));

// ── Category pages ──────────────────────────────────────────────────────────
const OccasionDailyWearFrocks = lazy(() => import('./pages/categories/OccasionDailyWearFrocks'));
const PartyWearCollection = lazy(() => import('./pages/categories/PartyWearCollection'));
const DesignerPremiumFrocks = lazy(() => import('./pages/categories/DesignerPremiumFrocks'));
const TraditionalEthnicFrocks = lazy(() => import('./pages/categories/TraditionalEthnicFrocks'));
const FabricBasedCategories = lazy(() => import('./pages/categories/FabricBasedCategories'));

// ── Admin pages ─────────────────────────────────────────────────────────────
const AdminLayout = lazy(() => import('./admin/layout/AdminLayout'));
const Contact = lazy(() => import('./admin/views/Contactmessage'));
const UserManagement = lazy(() => import('./admin/views/UserManagement'));
const ChangeUsername = lazy(() => import('./admin/views/ChangeUsername'));
const ChangePassword = lazy(() => import('./admin/views/ChangePassword'));
const ReviewManagement = lazy(() => import('./admin/views/reviewmanagement'));
const ProductManagement = lazy(() => import('./admin/views/ProductManagement'));
const ProductDetailPage = lazy(() => import('./admin/views/ProductDetailPage'));
const ReviewQRPage = lazy(() => import('./admin/views/ReviewQRPage'));
const ClientManagement = lazy(() => import('./admin/views/ClientManagement'));
const PaymentManagement = lazy(() => import('./admin/views/PaymentManagement'));
const OrderManagement = lazy(() => import('./admin/views/OrderManagement'));
const SupportManagement = lazy(() => import('./admin/views/SupportManagement'));
const Login = lazy(() => import('./admin/login/Login'));
const UserLogin = lazy(() => import('./components/auth/Login'));

import ProtectedRoute from './admin/login/Protectedroute';

// Loading component
const PageLoader = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '100vh',
    background: '#001a14',
    color: '#d4af37'
  }}>
    <div className="animate-pulse">Loading...</div>
  </div>
);

function PublicLayout() {
  return (
    <>
      <Navbar />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/collections" element={<CollectionsPage />} />

          {/* ── Category pages ── */}
          <Route path="/collections/occasion-daily-wear-frocks" element={<OccasionDailyWearFrocks />} />
          <Route path="/collections/party-wear-collection" element={<PartyWearCollection />} />
          <Route path="/collections/designer-premium-frocks" element={<DesignerPremiumFrocks />} />
          <Route path="/collections/traditional-ethnic-frocks" element={<TraditionalEthnicFrocks />} />
          <Route path="/collections/fabric-based-categories" element={<FabricBasedCategories />} />
          {/* ─────────────────── */}

          <Route path="/collections/:ageGroup" element={<AgeGroupPage />} />
          <Route path="/collections/:ageGroup/:productSlug" element={<CollectionDetailPage />} />
          <Route path="/collections/product/:productId" element={<CollectionDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/account" element={<AccountHub />} />
          <Route path="/account/profile" element={<PersonInformation />} />
          <Route path="/account/addresses" element={<ManageAddresses />} />
          <Route path="/account/orders" element={<MyOrders />} />
          <Route path="/account/orders/:orderId" element={<OrderDetail />} />
          <Route path="/account/wishlist" element={<Wishlist />} />
          <Route path="/account/reviews" element={<MyReviews />} />
          <Route path="/account/write-review" element={<WriteReview />} />
          <Route path="/support" element={<SupportHub />} />
          <Route path="/support/order-help" element={<OrderHelp />} />
          <Route path="/support/chat" element={<ChatSupport />} />
          <Route path="/account/policy/:type" element={<Policy />} />
        </Routes>
      </Suspense>
      <Footer />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <WishlistProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Client login — no Navbar/Footer */}
              <Route path="/login" element={<UserLogin />} />

              {/* Admin login */}
              <Route path="/admin/login" element={<Login />} />

              {/* Admin protected routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/admin/contact" replace />} />
                <Route path="contact" element={<Contact />} />
                <Route path="users" element={<UserManagement />} />
                <Route path="change-username" element={<ChangeUsername />} />
                <Route path="change-password" element={<ChangePassword />} />
                <Route path="reviews" element={<ReviewManagement />} />
                <Route path="review-qr" element={<ReviewQRPage />} />
                <Route path="products" element={<ProductManagement />} />
                <Route path="products/:productId/details" element={<ProductDetailPage />} />
                <Route path="clients" element={<ClientManagement />} />
                <Route path="payments" element={<PaymentManagement />} />
                <Route path="orders" element={<OrderManagement />} />
                <Route path="support" element={<SupportManagement />} />
              </Route>

              {/* Review submission page — no Navbar/Footer */}
              <Route path="/review" element={<ReviewSubmit />} />

              {/* All public pages with Navbar + Footer */}
              <Route path="/*" element={<PublicLayout />} />
            </Routes>
          </Suspense>
        </WishlistProvider>
      </CartProvider>
    </BrowserRouter>
  );
}

export default App;
