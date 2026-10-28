"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { B2BSection } from "@/components/landing/B2BSection";
import { Footer } from "@/components/landing/Footer";
import { Hero } from "@/components/landing/Hero";
import { IntroSheet } from "@/components/landing/IntroSheet";
import { Manifesto } from "@/components/landing/Manifesto";
import { Navbar } from "@/components/landing/Navbar";
import { ProductShowcase } from "@/components/landing/ProductShowcase";

export default function LandingPage() {
  const [introDone, setIntroDone] = useState(false);

  useEffect(() => {
    if (document.documentElement.classList.contains("intro-seen")) setIntroDone(true);
  }, []);

  return (
    <>
      <AnimatePresence>
        {!introDone && (
          <motion.div key="intro" data-intro-root exit={{ opacity: 0 }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}>
            <IntroSheet onDone={() => setIntroDone(true)} />
          </motion.div>
        )}
      </AnimatePresence>

      <Navbar />
      <main>
        <Hero ready={introDone} />
        <Manifesto />
        <ProductShowcase />
        <B2BSection />
      </main>
      <Footer />
    </>
  );
}
