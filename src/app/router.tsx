import { createBrowserRouter, Navigate } from "react-router-dom";
import { App } from "./App";
import { BuildQueuePage } from "../pages/BuildQueuePage";
import { InsightSharePage } from "../pages/InsightSharePage";
import { TodayPage } from "../pages/TodayPage";
import { TopicsPage } from "../pages/TopicsPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: <Navigate to="/today" replace />
      },
      {
        path: "today",
        element: <TodayPage />
      },
      {
        path: "build",
        element: <BuildQueuePage />
      },
      {
        path: "topics",
        element: <TopicsPage />
      },
      {
        path: "insights/:insightId",
        element: <InsightSharePage />
      }
    ]
  }
]);
