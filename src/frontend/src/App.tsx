import { Toaster } from "@/components/ui/sonner";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import AdminPage from "./pages/AdminPage";
import CareersPage from "./pages/CareersPage";
import EmployeePortalPage from "./pages/EmployeePortalPage";
import HomePage from "./pages/HomePage";
import SupportPortalPage from "./pages/SupportPortalPage";

const rootRoute = createRootRoute({
  component: () => (
    <>
      <Toaster richColors position="top-right" />
      <Outlet />
    </>
  ),
});

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

const careersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/careers",
  component: CareersPage,
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: AdminPage,
});

const employeeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/employee",
  component: EmployeePortalPage,
});

const supportRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/support",
  component: SupportPortalPage,
});

const routeTree = rootRoute.addChildren([
  homeRoute,
  careersRoute,
  adminRoute,
  employeeRoute,
  supportRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
