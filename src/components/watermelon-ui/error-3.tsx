"use client";

import { motion } from "framer-motion";
import { ArrowLeft, RefreshCw, AlertTriangle } from "lucide-react";
import Link from "next/link";

export interface ErrorPageProps {
  error?: Error & { digest?: string };
  reset?: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#06060a] font-mono selection:bg-lime-500/30">
      {/* Background cyber grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293720_1px,transparent_1px),linear-gradient(to_bottom,#1f293720_1px,transparent_1px)] bg-[size:28px_28px] opacity-40 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-lime-500/5 blur-[120px] pointer-events-none" />

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center p-4">
        <div className="relative z-10 max-w-2xl space-y-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative inline-block"
          >
            <h1
              className="text-8xl font-black tracking-tighter text-transparent select-none md:text-[10rem]"
              style={{ WebkitTextStroke: "2px rgba(132, 204, 22, 0.2)" }}
            >
              500
            </h1>
            <motion.h1
              animate={{ x: [-3, 3, -3], opacity: [0.8, 1, 0.8] }}
              transition={{
                duration: 0.15,
                repeat: Infinity,
                repeatType: "mirror",
              }}
              className="absolute inset-0 text-8xl font-black tracking-tighter text-lime-500 mix-blend-screen select-none md:text-[10rem]"
              style={{ clipPath: "polygon(0 0, 100% 0, 100% 45%, 0 45%)" }}
            >
              500
            </motion.h1>
            <motion.h1
              animate={{ x: [3, -3, 3], opacity: [0.8, 1, 0.8] }}
              transition={{
                duration: 0.25,
                repeat: Infinity,
                repeatType: "mirror",
              }}
              className="absolute inset-0 text-8xl font-black tracking-tighter text-lime-400 mix-blend-screen select-none md:text-[10rem]"
              style={{
                clipPath: "polygon(0 55%, 100% 55%, 100% 100%, 0 100%)",
              }}
            >
              500
            </motion.h1>
            <h1 className="absolute inset-0 text-8xl font-black tracking-tighter text-white select-none md:text-[10rem]">
              500
            </h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="border border-lime-500/20 bg-black/60 p-6 backdrop-blur-md rounded-xl shadow-2xl"
          >
            <div className="mb-3 flex items-center justify-center gap-2.5">
              <AlertTriangle className="h-5 w-5 text-lime-400" />
              <h2 className="text-xl font-bold tracking-[0.2em] text-lime-400 uppercase md:text-2xl">
                Connection Severed
              </h2>
            </div>

            <p className="leading-relaxed text-zinc-300 text-sm md:text-base max-w-lg mx-auto">
              {error?.message || "Critical routing failure. The requested sequence encountered an unhandled exception in the execution pipeline."}
            </p>

            {error?.digest && (
              <p className="mt-3 text-2xs text-lime-500/70 font-mono tracking-wider">
                DIGEST_HASH: {error.digest}
              </p>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="flex flex-col items-center justify-center gap-4 pt-4 sm:flex-row"
          >
            <Link
              href="/home"
              className="group relative overflow-hidden bg-lime-500 px-8 py-3.5 rounded-lg text-xs font-bold tracking-widest text-black uppercase transition-all duration-300 hover:scale-105 shadow-lg shadow-lime-500/20"
            >
              <div className="absolute inset-0 translate-y-full bg-white transition-transform duration-300 ease-in-out group-hover:translate-y-0" />
              <div className="relative flex items-center gap-2">
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                <span>Initialize Reboot</span>
              </div>
            </Link>

            <button
              onClick={() => {
                if (reset) reset();
                else window.location.reload();
              }}
              className="border border-lime-500/40 px-8 py-3.5 rounded-lg text-xs font-bold tracking-widest text-lime-400 uppercase transition-all duration-300 hover:bg-lime-500 hover:text-black flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Retry Uplink</span>
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
