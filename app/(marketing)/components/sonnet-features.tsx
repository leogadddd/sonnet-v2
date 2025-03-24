export default function Features() {
  return (
    <section className="py-12 md:py-20">
      <div className="mx-auto max-w-5xl space-y-8 px-6 md:space-y-16">
        <div className="relative z-10 mx-auto max-w-xl space-y-6 text-center md:space-y-12">
          <h2 className="text-balance text-4xl font-medium lg:text-5xl">
            The foundation for creative blogging
          </h2>
          <p>
            Sonnet is a local-first blogging platform for seamless writing,
            organization, and publishing.
          </p>
        </div>

        <div className="rounded-lg overflow-hidden relative mx-auto grid max-w-4xl divide-x divide-y border *:p-12 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h3 className="text-md font-medium text-[#ff914d]">
                📝 Local-First Writing
              </h3>
            </div>
            <p className="text-sm text-muted-foreground/75">
              Blogs are saved in your browser for instant access.
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="text-md font-medium text-[#ff914d]">
                ☁️ Seamless Syncing
              </h3>
            </div>
            <p className="text-sm text-muted-foreground/75">
              Keep your blogs updated across devices with cloud sync.
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="text-md font-medium text-[#ff914d]">
                📤 LLM Writing Assistance
              </h3>
            </div>
            <p className="text-sm text-muted-foreground/75">
              Get smart suggestions to improve your content.
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="text-md font-medium text-[#ff914d]">
                ✍️ Powerful Editor
              </h3>
            </div>
            <p className="text-sm text-muted-foreground/75">
              A sleek, distraction-free editor with rich formatting and media
              support.
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="text-md font-medium text-[#ff914d]">
                🔒 Reliable & Secure
              </h3>
            </div>
            <p className="text-sm text-muted-foreground/75">
              Your data stays safe and consistent across all devices. Let me
              know if this works!
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="text-md font-medium text-[#ff914d]">
                🔄 Version Control{" "}
                <span className="text-muted-foreground/50 break-keep">
                  (in-development)
                </span>
              </h3>
            </div>
            <p className="text-sm text-muted-foreground/75">
              Track changes and restore previous versions easily. <br />
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
