import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { motion } from "framer-motion";

export default function Splash() {
  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-sky-400">
      {/* Animated Clouds */}
      <div className="absolute inset-0 pointer-events-none">
        {[1, 2, 3, 4, 5].map((i) => (
          <motion.div
            key={i}
            initial={{ x: -200, y: i * 100 }}
            animate={{ x: "110vw" }}
            transition={{
              duration: 20 + i * 5,
              repeat: Infinity,
              ease: "linear",
              delay: i * 2,
            }}
            className="absolute text-6xl opacity-40 filter blur-[1px]"
          >
            ☁️
          </motion.div>
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-8 p-4 text-center">
        <motion.h1
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-6xl md:text-8xl font-medieval text-primary drop-shadow-[0_5px_0_rgba(0,0,0,0.5)] tracking-tighter"
        >
          Paname City
        </motion.h1>

        <div className="flex flex-col gap-4 w-64">
          <Link href="/game">
            <Button
              className="w-full h-16 text-2xl font-medieval border-b-4 border-primary-border shadow-lg"
              data-testid="button-play"
            >
              JOUER
            </Button>
          </Link>

          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="secondary"
                className="w-full h-12 text-xl font-medieval border-b-4 border-secondary-border shadow-md"
                data-testid="button-credits"
              >
                CRÉDITS
              </Button>
            </DialogTrigger>
            <DialogContent className="font-medieval bg-card border-card-border">
              <DialogHeader>
                <DialogTitle className="text-2xl text-center">Crédits</DialogTitle>
              </DialogHeader>
              <div className="py-6 text-center text-lg leading-relaxed">
                Imaginé, Créé, conçu et développé par Sally avec amour, pour le serveur discord.gg/paname en 2026
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
