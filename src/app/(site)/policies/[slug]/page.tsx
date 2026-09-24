import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { policies } from "@/lib/policies";
import { PageHeader } from "@/components/ui/PageHeader";
import { container } from "@/components/ui/styles";

export const dynamicParams = false;

export function generateStaticParams() {
  return policies.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/policies/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const policy = policies.find((p) => p.slug === slug);
  return policy ? { title: policy.title } : {};
}

export default async function PolicyPage({ params }: PageProps<"/policies/[slug]">) {
  const { slug } = await params;
  const policy = policies.find((p) => p.slug === slug);
  if (!policy) notFound();

  return (
    <>
      <PageHeader eyebrow="Policies" title={policy.title} />
      <div className={`${container} prose-warm max-w-3xl`}>
        {policy.sections.map((s) => (
          <section key={s.heading}>
            <h2>{s.heading}</h2>
            {s.paragraphs.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </section>
        ))}
      </div>
    </>
  );
}
