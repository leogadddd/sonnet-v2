import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export default function Pricing() {
  return (
    <section className="py-16 md:py-32" id="Pricing">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mx-auto max-w-2xl space-y-6 text-center">
          <h1 className="text-center text-4xl font-semibold lg:text-5xl">
            Flexible Pricing for Every Creator
          </h1>
          <p>
            Write for free, upgrade for more power—sync, optimize, and grow with
            Sonnet.
          </p>
        </div>

        <div className="mt-8 grid gap-6 md:mt-20 md:grid-cols-5 md:gap-0">
          <div className="rounded-(--radius) flex flex-col justify-between space-y-8 border p-6 md:col-span-2 md:my-2 md:rounded-r-none md:border-r-0 lg:p-10">
            <div className="space-y-4">
              <div>
                <h2 className="font-medium">Free</h2>
                <span className="my-3 block text-2xl font-semibold">
                  $0 / mo
                </span>
                {/* <p className="text-muted-foreground text-sm">Per editor</p> */}
              </div>

              <Button asChild variant="outline" className="w-full">
                <Link href="">Get Started</Link>
              </Button>

              <hr className="border-dashed" />

              <ul className="list-outside space-y-3 text-sm">
                {[
                  "Unlimited Publishing",
                  "Sync up to 5 Blogs (Manual Sync)",
                  "Basic SEO Tools",
                  "Basic Analytics Dashboard",
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <Check className="size-3" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="dark:bg-muted/50 rounded-(--radius) border p-6 shadow-lg shadow-gray-950/5 md:col-span-3 lg:p-10 dark:[--color-muted:var(--color-zinc-900)]">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <h2 className="font-bold text-[#ff914d]">Pro</h2>
                  <span className="my-3 block text-2xl font-semibold">
                    $19 / mo
                  </span>
                  {/* <p className="text-muted-foreground text-sm">Per editor</p> */}
                </div>

                <Button asChild className="w-full">
                  <Link href="">Get Started</Link>
                </Button>
              </div>

              <div>
                <div className="text-sm font-medium">Everything in free +</div>

                <ul className="mt-4 list-outside space-y-3 text-sm">
                  {[
                    "LLM-Powered Writing Assistance",
                    "Unlimited Syncing",
                    "Advanced SEO Tools",
                    "Version Control",
                    "Full Analytics Dashboard",
                    "Scheduled Posts",
                    "Email and Chat Support",
                  ].map((item, index) => (
                    <li
                      key={index}
                      className="flex items-center gap-2 text-[#ff914d]"
                    >
                      <Check className="size-3 " />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
