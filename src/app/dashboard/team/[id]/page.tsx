"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { UserDrawer } from "@/components/account/UserDrawer";
import { UserProfile } from "@/components/account/UserProfile";
import { Notice } from "@/components/dashboard/ui";
import { useI18n } from "@/i18n/I18nProvider";
import { can } from "@/lib/business";
import { useCurrentUser, useStore } from "@/lib/store";

export default function TeamMemberPage() {
  const { d } = useI18n();
  const { id } = useParams<{ id: string }>();
  const me = useCurrentUser()!;
  const user = useStore((s) => s.db.users.find((u) => u.id === id));
  const [editing, setEditing] = useState(false);

  if (!can(me, "users.manage")) return <Notice kind="error">{d.perm.denied}</Notice>;
  if (!user) return <Notice kind="error">{d.common.none}</Notice>;

  return (
    <>
      <Link href="/dashboard/team" className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-ink-soft hover:text-ink">← {d.profile.back}</Link>
      <UserProfile user={user} self={user.id === me.id} onEdit={() => setEditing(true)} />
      <UserDrawer open={editing} onClose={() => setEditing(false)} user={user} />
    </>
  );
}
