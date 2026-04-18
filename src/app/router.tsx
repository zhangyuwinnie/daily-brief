import { Suspense, lazy } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";

const App = lazy(() => import("./App").then((module) => ({ default: module.App })));
const InsightSharePage = lazy(() =>
  import("../pages/InsightSharePage").then((module) => ({ default: module.InsightSharePage }))
);
const TodayPage = lazy(() => import("../pages/TodayPage").then((module) => ({ default: module.TodayPage })));

function RouteLoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e0f7ea] via-[#c8eed8] to-[#9adfb9] px-3 py-3 text-slate-800 sm:px-4 md:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-1.5rem)] w-full max-w-[1400px] items-center justify-center rounded-shell border border-white/60 bg-white/40 px-6 py-20 text-center shadow-glass backdrop-blur-xl lg:min-h-[calc(100vh-3rem)]">
        <div className="max-w-md">
          <h1 className="text-2xl font-black text-slate-800">Loading page...</h1>
          <p className="mt-3 text-sm text-slate-600">Splitting route code so the initial bundle stays lighter.</p>
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
