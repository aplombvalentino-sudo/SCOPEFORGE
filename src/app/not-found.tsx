import Link from "next/link";

export default function NotFound() {
  return (
    <div className="blueprint blueprint-fade flex min-h-dvh flex-col items-center justify-center bg-bg px-6 text-center">
      <p className="microlabel">Error 404</p>
      <h1 className="mt-3 font-display text-3xl font-medium tracking-tight text-ink">
        This route isn&apos;t in scope.
      </h1>
      <p className="mt-2 max-w-sm text-[14px] text-ink-mute">
        The page you&apos;re looking for doesn&apos;t exist — possibly a change order we never approved.
      </p>
      <Link
        href="/dashboard"
        className="mt-6 inline-flex h-9 items-center rounded-md bg-accent px-4 text-[13px] font-medium text-on-accent transition-colors hover:bg-accent-hover"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
