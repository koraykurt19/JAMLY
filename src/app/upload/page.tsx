"use client";

import { UploadListingForm } from "@/components/upload-listing-form";
import { SectionHeading } from "@/components/section-heading";
import { useI18n } from "@/components/language-provider";

export default function UploadListingPage() {
  const { t } = useI18n();

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow={t("uploadEyebrow")}
        title={t("uploadTitle")}
        description={t("uploadDescription")}
      />

      <div className="mt-10 rounded-lg border border-white/10 bg-white/[0.045] p-5 sm:p-7">
        <UploadListingForm />
      </div>
    </section>
  );
}
