import Image from "next/image";

export default function SonnetSyncSection() {
  return (
    <section className="py-16 md:py-32" id="SonnetSync">
      <div className="mx-auto max-w-5xl space-y-8 px-6 md:space-y-16">
        <h2 className="relative z-10 max-w-xl text-4xl font-medium lg:text-5xl">
          Sonnet Sync
        </h2>
        <div className="relative">
          <div className="relative z-10 space-y-4 md:w-1/2">
            <p className="text-body">
              Sonnet Sync powers a seamless ecosystem, keeping your blogs
              updated across devices with cloud sync.
            </p>
            <p>Never lose progress—write anywhere with confidence.</p>

            <div className="grid grid-cols-2 gap-3 pt-6 sm:gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium text-[#ff914d]">
                    ⚡ Faaast
                  </h3>
                </div>
                <p className="text-muted-foreground text-sm">
                  Sync instantly, so your latest edits are always ready.
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium text-[#ff914d]">
                    ⚙️ Powerful
                  </h3>
                </div>
                <p className="text-muted-foreground text-sm">
                  Built for creators, ensuring reliability and efficiency.
                </p>
              </div>
            </div>
          </div>
          <div className="mt-12 h-fit md:absolute md:-inset-y-12 md:inset-x-0 md:mt-0">
            <div
              aria-hidden
              className="bg-linear-to-l z-1 to-background absolute inset-0 hidden from-transparent to-55% md:block"
            ></div>
            <div className="border-border/50 relative rounded-2xl border border-dotted p-2">
              <Image
                src="/dark-logo-text.png"
                className="hidden rounded-[12px] dark:block"
                alt="payments illustration dark"
                width={1207}
                height={929}
              />
              <Image
                src="/dark-logo-text.png"
                className="rounded-[12px] shadow dark:hidden"
                alt="payments illustration light"
                width={1207}
                height={929}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
