"use client";

import { create } from "zustand";
import type { Lead, LeadStatus } from "./types";

/**
 * Solicitudes de distribuidores desde el dashboard.
 * A diferencia del resto del sistema (mock en el navegador), son datos reales guardados en el servidor:
 * la API pide una clave que el Owner ingresa una vez por dispositivo.
 */
const KEY_STORAGE = "snapslide-leads-key";

export type LeadsStatus = "idle" | "locked" | "unconfigured" | "loading" | "ready" | "error";

function readKey(): string {
  try {
    return localStorage.getItem(KEY_STORAGE) || "";
  } catch {
    return "";
  }
}

interface LeadsState {
  leads: Lead[];
  status: LeadsStatus;
  /** La clave guardada fue rechazada por el servidor. */
  badKey: boolean;
  load: () => Promise<void>;
  unlock: (key: string) => Promise<void>;
  lock: () => void;
  create: (input: Pick<Lead, "company" | "name" | "email" | "phone" | "volume" | "message" | "locale">) => Promise<{ ok: boolean; error?: string }>;
  update: (id: string, patch: Partial<Pick<Lead, "status" | "notes" | "sellerId" | "clientId">>) => Promise<boolean>;
  remove: (id: string) => Promise<boolean>;
}

async function call(path: string, init: RequestInit = {}) {
  return fetch(path, { ...init, headers: { "Content-Type": "application/json", "x-leads-key": readKey(), ...init.headers }, cache: "no-store" });
}

export const useLeads = create<LeadsState>()((set, get) => {
  /** 401/503 cambian el estado de acceso; devuelve true si la respuesta es utilizable. */
  const handleAccess = (res: Response) => {
    if (res.status === 401) set({ status: "locked", badKey: !!readKey() });
    else if (res.status === 503) set({ status: "unconfigured" });
    return res.ok;
  };

  return {
    leads: [],
    status: "idle",
    badKey: false,

    async load() {
      if (!readKey()) return set({ status: "locked", badKey: false });
      if (get().status !== "ready") set({ status: "loading" });
      try {
        const res = await call("/api/leads");
        if (!handleAccess(res)) return;
        const { leads } = (await res.json()) as { leads: Lead[] };
        set({ leads, status: "ready", badKey: false });
      } catch {
        set({ status: "error" });
      }
    },

    async unlock(key) {
      try {
        localStorage.setItem(KEY_STORAGE, key.trim());
      } catch {
        /* sin almacenamiento: no se puede recordar la clave */
      }
      await get().load();
    },

    lock() {
      try {
        localStorage.removeItem(KEY_STORAGE);
      } catch {
        /* ignorar */
      }
      set({ leads: [], status: "locked", badKey: false });
    },

    async create(input) {
      const res = await call("/api/leads", { method: "POST", body: JSON.stringify(input) });
      if (!handleAccess(res)) return { ok: false, error: ((await res.json().catch(() => ({}))) as { error?: string }).error };
      const { lead } = (await res.json()) as { lead?: Lead };
      if (lead) set({ leads: [lead, ...get().leads] });
      return { ok: true };
    },

    async update(id, patch) {
      const prev = get().leads;
      // Optimista: la interfaz responde al instante y se revierte si falla.
      set({ leads: prev.map((l) => (l.id === id ? { ...l, ...patch } : l)) });
      const res = await call(`/api/leads/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
      if (!handleAccess(res)) {
        set({ leads: prev });
        return false;
      }
      const { lead } = (await res.json()) as { lead: Lead };
      set({ leads: get().leads.map((l) => (l.id === id ? lead : l)) });
      return true;
    },

    async remove(id) {
      const prev = get().leads;
      set({ leads: prev.filter((l) => l.id !== id) });
      const res = await call(`/api/leads/${id}`, { method: "DELETE" });
      if (!handleAccess(res)) {
        set({ leads: prev });
        return false;
      }
      return true;
    },
  };
});

export const LEAD_STEPS: LeadStatus[] = ["new", "contacted", "active"];
