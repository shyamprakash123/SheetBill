import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
// import { Toaster } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import Layout from "./components/Layout";
import Auth from "./components/Auth";
import LandingPage from "./components/LandingPage";
import Dashboard from "./pages/Dashboard";
import Sales from "./pages/Sales";
import Purchases from "./pages/Purchases";
import Quotations from "./pages/Quotations";
import Inventory from "./pages/Inventory";
import Customers from "./pages/Customers";
import Vendors from "./pages/Vendors";
import Reports from "./pages/Reports";
import CreditNotes from "./pages/CreditNotes";
import PurchaseOrders from "./pages/PurchaseOrders";
import Expenses from "./pages/Expenses";
import EWayBills from "./pages/EWayBills";
import Payments from "./pages/Payments";
import GoogleAuthCallback from "./pages/GoogleAuthCallback";
import AuthCallback from "./pages/AuthCallback";
import { useAuthStore } from "./store/auth";
import { useTheme } from "./hooks/useTheme";
import "./index.css";
import SettingsContent from "./components/settings/SettingsContent";
import BackendInitializer from "./components/wrapper/BackendInitializer";
import InvoiceForm from "./components/invoice/InvoiceForm";
import EditInvoiceForm from "./components/invoice/EditInvoiceForm";
import { Toaster } from "./components/DatePickerComponent/Toaster";

function App() {
  const { loading } = useAuthStore();
  const { isDark } = useTheme();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mb-4 mx-auto">
            <span className="text-white font-bold text-xl">S</span>
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">
            Loading SheetBill...
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <Router>
      <div className={`App ${isDark ? "dark" : ""}`}>
        <Toaster />
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/auth/google/callback"
              element={<GoogleAuthCallback />}
            />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route
              path="/app"
              element={
                <BackendInitializer>
                  <Layout />
                </BackendInitializer>
              }
            >
              <Route index element={<Navigate to="/app/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="sales" element={<Sales />} />
              <Route path="purchases" element={<Purchases />} />
              <Route path="quotations" element={<Quotations />} />
              <Route path="inventory" element={<Inventory />} />
              <Route path="customers" element={<Customers />} />
              <Route path="vendors" element={<Vendors />} />
              <Route path="reports" element={<Reports />} />
              <Route path="settings" element={<SettingsContent />} />
              <Route path="credit-notes" element={<CreditNotes />} />
              <Route path="purchase-orders" element={<PurchaseOrders />} />
              <Route path="expenses" element={<Expenses />} />
              <Route path="eway-bills" element={<EWayBills />} />
              <Route path="payments" element={<Payments />} />
              <Route path="create/:invoice_type" element={<InvoiceForm />} />
              <Route
                path="edit/:invoice_type/:invoice_rowId/:invoice_id"
                element={<EditInvoiceForm />}
              />
            </Route>
            {/* Legacy routes for backward compatibility */}
            <Route
              path="/dashboard"
              element={<Navigate to="/app/dashboard" replace />}
            />
            <Route
              path="/invoices"
              element={<Navigate to="/app/sales" replace />}
            />
            <Route
              path="/products"
              element={<Navigate to="/app/inventory" replace />}
            />
            <Route
              path="/customers"
              element={<Navigate to="/app/customers" replace />}
            />
            <Route
              path="/reports"
              element={<Navigate to="/app/reports" replace />}
            />
            <Route
              path="/settings"
              element={<Navigate to="/app/settings" replace />}
            />
          </Routes>
        </AnimatePresence>

        {/* <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: isDark ? "#374151" : "#ffffff",
              color: isDark ? "#f3f4f6" : "#111827",
              border: isDark ? "1px solid #4b5563" : "1px solid #e5e7eb",
            },
          }}
        /> */}
      </div>
    </Router>
  );
}

export default App;
