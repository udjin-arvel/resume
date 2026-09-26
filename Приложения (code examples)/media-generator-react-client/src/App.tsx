import { ConfigProvider, theme as antTheme } from "antd";
import { MainLayout, ProtectedRoute, ContentFactoryCanvasLayout, AuthPagesLayout } from "@app";
import { useTheme, RADAR_COLOR_SCHEME, MobilePlug, BreadcrumbsProvider } from "@shared";
import {
  MainPage,
  ImageGenerationPage,
  VideoGenerationPage,
  ImageUpscalingPage,
  NotFoundPage,
  UnderDevelopmentPage,
  ContentFactoryProjectsListPage,
  ContentFactoryProjectPage,
  SignInPage,
  SignUpPage,
  ChangePasswordPage,
  RestorePasswordPage,
  PrivacyPolicyPage,
  PhotoEditorPage,
  CardInfographicsPage,
  AiChatPage
} from "@pages";
import { createBrowserRouter, Outlet, RouterProvider } from "react-router";
import { App as AntdApp } from "antd";
import { useEffect } from "react";

function AppShell() {
  const { theme } = useTheme();
  return (
    <ConfigProvider
      theme={{
        algorithm: theme === "dark" ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
        token: {
          colorPrimary: RADAR_COLOR_SCHEME.common.primary,
          colorSuccess: RADAR_COLOR_SCHEME.common.success,
          colorError: RADAR_COLOR_SCHEME.common.error,
          colorWarning: RADAR_COLOR_SCHEME.common.warning,
          colorInfo: RADAR_COLOR_SCHEME.common.info,
          fontFamily: "'Manrope', 'Arial', system-ui, sans-serif",
          borderRadius: 8,
        },
      }}
    >
      <AntdApp notification={{
        placement: 'bottomRight',
        duration: 5,
      }}>
        <BreadcrumbsProvider>
          <Outlet />
          <MobilePlug />
        </BreadcrumbsProvider>
      </AntdApp>
    </ConfigProvider>
  );
}

const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      {
        path: "/",
        element: <ProtectedRoute />,
        children: [
          // --- pages w main layout
          {
            element: <MainLayout />,
            children: [
              { index: true, element: <MainPage /> },
              { path: "image-generation", element: <ImageGenerationPage /> },
              { path: "image-upscaling", element: <ImageUpscalingPage /> },
              { path: "video-generation", element: <VideoGenerationPage /> },
              { path: "under-development", element: <UnderDevelopmentPage /> },
              { path: "canvas", element: <ContentFactoryProjectsListPage /> },
              { path: "photo-editor", element: <PhotoEditorPage /> },
              { path: "card-infographics", element: <CardInfographicsPage /> },
              { path: "ai-chat", element: <AiChatPage /> },
            ],
          },
        ],
      },
      // --- specific layout for content-factory canvas
      {
        element: <ContentFactoryCanvasLayout />,
        children: [
          { path: "canvas/:projectId", element: <ContentFactoryProjectPage /> },
        ],
      },
      // --- auth pages layout
      {
        element: <AuthPagesLayout />,
        children: [
          { path: "signin", element: <SignInPage /> },
          { path: "signup", element: <SignUpPage /> },
          { path: "change-password", element: <ChangePasswordPage /> },
          { path: "reset-password", element: <RestorePasswordPage /> },
        ],
      },
      { path: '/privacy-policy', element: <PrivacyPolicyPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);

function App() {
  const { toggle } = useTheme()
  useEffect(function themeToggler() {
    const keydownHandler = (event: KeyboardEvent) => {
      const isShiftKeyPressed = event.shiftKey;
      if (isShiftKeyPressed && (event.key === 't' || event.key === 'T' || event.code === 'KeyT')) {
        toggle()
      }
    }
    document.addEventListener('keydown', keydownHandler)
    return () => {
      document.removeEventListener('keydown', keydownHandler)
    }
  }, [toggle])
  return <RouterProvider router={router} />;
}

export default App;
