import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("hero");

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
      <h1 className="font-cormorant text-5xl md:text-7xl text-cream text-center leading-tight">
        {t("headline")}
      </h1>
      <p className="mt-6 text-muted font-jost text-lg md:text-xl text-center max-w-2xl">
        {t("subheadline")}
      </p>
    </main>
  );
}
