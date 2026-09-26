import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { WorkerAppLayout } from "@/components/layout/WorkerAppLayout";
import { PageError } from "@/components/common/PageError";
import {
  BlockedProfileBanner,
  ProfileBasicInfoSection,
  ProfileDocumentsSection,
  ProfileHeaderCard,
  ProfileLanguageSegment,
  ProfileLogoutButton,
  ProfilePageSkeleton,
} from "@/components/worker/profile";
import { useAuth } from "@/hooks/useAuth";
import { useDocuments } from "@/lib/api/hooks/useDocuments";
import { showError, showSuccess } from "@/lib/toast";

export const Route = createFileRoute("/_worker/worker/profile")({
  head: () => ({ meta: [{ title: "Профиль — Работник" }] }),
  component: WorkerProfilePage,
});

function WorkerProfilePage() {
  const { t, i18n: i18nInstance } = useTranslation();
  const { user, isLoading, updateUserProfile } = useAuth();
  const [savingLanguage, setSavingLanguage] = useState(false);

  const {
    data: documents,
    isLoading: docsLoading,
    isError: docsError,
    refetch: refetchDocs,
  } = useDocuments({
    entityType: "user",
    entityId: user?.id,
  });

  const handleLanguage = async (lang: string) => {
    if (lang === i18nInstance.language) return;
    setSavingLanguage(true);
    try {
      await i18nInstance.changeLanguage(lang);
      await updateUserProfile({ language: lang });
      showSuccess(t("worker.profile.languageSaved"));
    } catch (err) {
      showError(err);
    } finally {
      setSavingLanguage(false);
    }
  };

  if (isLoading || !user) {
    return (
      <WorkerAppLayout activeNav="profile" className="bg-[#F1F5F9]">
        <div className="px-4 pb-6 pt-4">
          <ProfilePageSkeleton />
        </div>
      </WorkerAppLayout>
    );
  }

  const isBlocked = user.status === "blocked";

  const documentsBlock = docsLoading ? (
    <div className="mb-4 animate-pulse space-y-2">
      <div className="h-4 w-24 rounded bg-slate-200" />
      <div className="overflow-hidden rounded-2xl bg-white">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="border-b border-slate-100 px-4 py-3 last:border-b-0">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-slate-200" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-24 rounded bg-slate-200" />
                <div className="h-3 w-32 rounded bg-slate-200" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  ) : docsError ? (
    <PageError onRetry={() => refetchDocs()} />
  ) : (
    <ProfileDocumentsSection documents={documents} />
  );

  if (isBlocked) {
    return (
      <WorkerAppLayout activeNav="profile" navMode="blocked" className="bg-[#F1F5F9]">
        <div className="px-4 pb-6 pt-4">
          <h1 className="mb-4 text-xl font-bold text-slate-900">{t("worker.profile.title")}</h1>

          <BlockedProfileBanner user={user} />
          <ProfileBasicInfoSection user={user} readOnly />
          {documentsBlock}
          <ProfileLanguageSegment
            value={i18nInstance.language}
            onChange={handleLanguage}
            saving={savingLanguage}
          />
          <ProfileLogoutButton />
        </div>
      </WorkerAppLayout>
    );
  }

  return (
    <WorkerAppLayout
      activeNav="profile"
      className="bg-[#F1F5F9]"
      title={t("worker.profile.title")}
    >
      <div className="px-4 pb-6 pt-4">
        <ProfileHeaderCard user={user} />
        <ProfileBasicInfoSection user={user} />
        {documentsBlock}
        <ProfileLanguageSegment
          value={i18nInstance.language}
          onChange={handleLanguage}
          saving={savingLanguage}
        />
        <ProfileLogoutButton />
      </div>
    </WorkerAppLayout>
  );
}
