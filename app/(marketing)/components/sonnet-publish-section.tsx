import Image from "next/image";

export default function SonnetPublishSection() {
  return (
    <section className="py-16 md:py-32" id="Publish">
      <div className="mx-auto max-w-5xl space-y-8 px-6 md:space-y-16">
        <h2 className="relative z-10 max-w-xl text-4xl font-medium lg:text-5xl">
          The Power of Publishing with Sonnet
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 md:gap-12 lg:gap-24">
          <div className="relative mb-6 sm:mb-0">
            <div className="bg-linear-to-b aspect-76/59 relative rounded-2xl from-zinc-300 to-transparent p-px dark:from-zinc-700">
              <Image
                src="/publish-image.png"
                className="hidden rounded-[15px] dark:block"
                alt="payments illustration dark"
                width={1207}
                height={929}
              />
              <Image
                src="/publish-image.png"
                className="rounded-[15px] shadow dark:hidden"
                alt="payments illustration light"
                width={1207}
                height={929}
              />
            </div>
          </div>

          <div className="relative space-y-4">
            <p>
              Sonnet isn’t just about writing—it’s about sharing your voice with
              the world. Sonnet Publish gives you the tools to share your work
              seamlessly while optimizing it for discovery.
            </p>
            <div className="grid grid-cols-2 gap-3 pt-6 sm:gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium flex items-center gap-x-2 text-[#ff914d]">
                    🔭 Explore Page Visibility
                  </h3>
                </div>
                <p className="text-muted-foreground text-sm">
                  Feature your blogs on Sonnet’s Explore page to reach a wider
                  audience.
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium text-[#ff914d]">
                    📈 SEO Optimization
                  </h3>
                </div>
                <p className="text-muted-foreground text-sm">
                  Fine-tune your blog’s metadata, titles, and descriptions to
                  improve search rankings.
                </p>
              </div>
            </div>
            <div className="pt-6">
              <blockquote className="border-l-4 border-[#ff914d] pl-4">
                <p>
                  Publishing should be effortless and powerful. With Sonnet,
                  your words don’t just exist—they thrive.
                </p>
              </blockquote>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
