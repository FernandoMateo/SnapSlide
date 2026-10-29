"use client";

import { UserProfile } from "@/components/account/UserProfile";
import { useCurrentUser } from "@/lib/store";

export default function MyProfilePage() {
  const me = useCurrentUser();
  if (!me) return null;
  return <UserProfile user={me} self />;
}
