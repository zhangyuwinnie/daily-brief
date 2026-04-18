import { Suspense, lazy } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";

const App = lazy(() => import("./App").then((module) => ({ default: module.App })));
const InsightSharePage = lazy(() =>
  import("../pages/InsightSharePage").then((module) => ({ default: module.InsightSharePage }))
);
const TodayPage = lazy(() => import("../pages/TodayPage").then((module) => ({ default: module.TodayPage })));

function RouteLoadingFallback() {
  return (
    <div className="app-page text-[color:var(--text-strong)]">
      <div className="app-shell items-center justify-center px-6 py-20 text-center">
        <div className="max-w-md">
          <p className="eyebrow">Loading route</p>
          <h1 className="display-title mt-3 text-4xl font-semibold">Loading page...</h1>
          <p className="mt-4 text-sm text-[color:var(--text-muted)]">
            Splitting route code so the initial bundle stays lighter.
          </p>
        </div>
      </div>
    </div>
  );
}

function withRouteFallback(element: React.ReactNode) {
  return <Suspense fallback={<RouteLoadingFallback />}>{element}</Suspense>;
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: withRouteFallback(<App />),
    children: [
      {
        index: true,
        element: <Navigate to="/today" replace />
      },
      {
        path: "today",
        element: withRouteFallback(<TodayPage />)
      },
      {
        path: "insights/:insightId",
        element: withRouteFallback(<InsightSharePage />)
      }
    ]
  }
]);
