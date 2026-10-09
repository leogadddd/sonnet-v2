import Link from "next/link";

export default function AuthError() {
  return (
    <main className="mx-auto max-w-md p-12 space-y-4">
      <h1 className="text-2xl font-semibold">
        This link could not be verified
      </h1>
      <p>
        It may have expired, already been used, or been opened in a different
        browser. Request a new link and open it in the browser where you
        started.
      </p>
      <Link className="underline block" href="/forgot-password">
        Request a password reset
      </Link>
      <Link className="underline block" href="/sign-in">
        Return to sign in
      </Link>
    </main>
  );
}
