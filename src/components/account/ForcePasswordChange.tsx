"use client";

import { motion } from "framer-motion";
import { Logo } from "@/components/brand/Logo";
import { useI18n } from "@/i18n/I18nProvider";
import { PasswordForm } from "./PasswordForm";

/** Primer inicio de sesión con contraseña temporal: hay que elegir una propia antes de seguir. */
export function ForcePasswordChange() {
  const { d } = useI18n();
  return (
    <div className="fixed inset-0 z-[70] grid place-items-center overflow-y-auto bg-[#04121f]/70 p-4 backdrop-blur-md" role="dialog" aria-modal="true" aria-labelledby="force-pw-title">
      <motion.div initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className="w-full max-w-lg overflow-hidden rounded-[28px] bg-white shadow-2xl">
        <div className="p-6 text-white sm:p-8" style={{ background: "linear-gradient(135deg, #035e94 0%, #0096d6 55%, #3fd0ff 100%)" }}>
          <Logo className="h-10" tone="light" />
          <h2 id="force-pw-title" className="mt-6 font-display text-2xl font-extrabold tracking-tight sm:text-3xl">{d.account.forceTitle}</h2>
          <p className="mt-2 text-sm text-white/85">{d.account.forceText}</p>
        </div>
        <div className="p-6 sm:p-8">
          <PasswordForm />
        </div>
      </motion.div>
    </div>
  );
}
