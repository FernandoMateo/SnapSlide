"use client";

import { UserProfile } from "@/components/account/UserProfile";
import { useI18n } from "@/i18n/I18nProvider";
import { useCurrentUser, useStore } from "@/lib/store";

export default function PortalAccountPage() {
  const { d } = useI18n();
  const me = useCurrentUser();
  const client = useStore((s) => s.db.clients[0]);
  if (!me) return null;
  return (
    <div className="grid gap-4">
      <UserProfile user={me} self />
      {client && (
        <section className="card p-6">
          <h2 className="font-display text-xl font-bold tracking-tight">{d.portal.company}</h2>
          <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <Info label={d.portal.company} value={client.company} />
            <Info label={d.clients.contact} value={client.contact} />
            <Info label={d.clients.address} value={[client.address, client.city, client.zip].filter(Boolean).join(", ") || "—"} />
            <Info label={d.portal.terms} value={`${client.paymentTerms} ${d.common.days}`} />
          </dl>
        </section>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[0.68rem] font-bold uppercase tracking-[0.1em] text-ink-faint">{label}</dt>
      <dd className="mt-1 font-semibold">{value}</dd>
    </div>
  );
}
