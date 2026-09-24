import React, { lazy, Suspense } from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@/index.css";
import App from "@/App";

const AdminApp = lazy(() => import('@/admin/AdminApp'));
const isAdminPath = window.location.pathname === '/admin' || window.location.pathname.startsWith('/admin/');

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  },
});

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      {isAdminPath ? <Suspense fallback={null}><AdminApp /></Suspense> : <App />}
    </QueryClientProvider>
  </React.StrictMode>,
);
