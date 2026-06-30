import { ChevronLeftIcon } from "../components/Icons";
import { pressIn, pressOut } from "../utils/touch";

function Section({ title, children }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">{title}</h2>
      <p className="selectable text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{children}</p>
    </section>
  );
}

export function PrivacyScreen({ onBack }) {
  return (
    <div
      className="min-h-[100dvh] bg-white dark:bg-[#0e0e0f] flex flex-col transition-colors duration-200"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="flex-1 max-w-[480px] w-full mx-auto px-5 pt-6 pb-16">
        {/* Header */}
        <header className="flex items-center gap-3 mb-10">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back"
            onTouchStart={pressIn}
            onTouchEnd={pressOut}
            onTouchCancel={pressOut}
            className="p-2 -ml-2 rounded-lg text-zinc-500 dark:text-zinc-400 active:text-zinc-900 dark:active:text-white active:bg-zinc-100 dark:active:bg-zinc-800 transition-colors"
            style={{ background: "none", border: "none", WebkitTapHighlightColor: "transparent" }}
          >
            <ChevronLeftIcon size={20} />
          </button>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">
            privacy policy
          </h1>
        </header>

        <div className="flex flex-col gap-8">
          {/* Intro */}
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
              last updated: june 2026
            </p>
            <p className="selectable text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Settle it. is built to collect as little as possible. Here&apos;s exactly what happens with your data.
            </p>
          </div>

          <Section title="What we collect">
            Nothing personally identifiable. We don&apos;t ask for your name, email, or any account information because there are no accounts. When you submit an argument, the text you type is sent to our AI provider (Anthropic) solely to generate a verdict, and is not stored on our servers afterward.
          </Section>

          <Section title="What stays on your device">
            All of your preferences and history — including your settle history, win streak, and app settings like theme and sound — are stored locally in your browser or device storage. This data never leaves your device and is never transmitted to us. If you clear your browser data or uninstall the app, this information is permanently deleted and cannot be recovered, because we never had a copy of it.
          </Section>

          <Section title="Third-party services">
            We use Anthropic&apos;s API to generate verdicts. The text you submit is processed by Anthropic according to their own privacy practices, available at anthropic.com/legal/privacy. We do not share any data with advertisers, analytics providers, or any other third parties.
          </Section>

          <Section title="Cookies and tracking">
            Settle it. does not use cookies, tracking pixels, or any analytics services that follow you across the web.
          </Section>

          <Section title="Children's privacy">
            Settle it. is not directed at children under 13 and we do not knowingly collect information from children.
          </Section>

          <Section title="Changes to this policy">
            If this policy changes, we&apos;ll update the date above. Continued use of the app after changes means you accept the updated policy.
          </Section>

          <Section title="Contact">
            Questions about this policy can be sent to{" "}
            <a
              href="mailto:settleit.support@gmail.com"
              className="underline"
              style={{ color: "var(--accent)" }}
            >
              settleit.support@gmail.com
            </a>
            .
          </Section>
        </div>
      </div>
    </div>
  );
}
