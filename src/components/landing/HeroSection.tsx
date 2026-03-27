import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import ecosystemDevices from "@/assets/ecosystem-devices.png";
import capgeminiLogo from "@/assets/capgemini-logo.png";
import heroCarSilhouette from "@/assets/hero-car-silhouette.png";

const stats = [
  { value: "99.9%", label: "Uptime" },
  { value: "50ms", label: "Latency" },
  { value: "10K+", label: "Vehicles" },
];

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center pt-28 pb-24 overflow-hidden bg-gradient-to-br from-background via-secondary/30 to-nexdrive-surface-3">
      {/* Fine grid pattern */}
      <div className="absolute inset-0 section-dot-pattern opacity-20 pointer-events-none" />

      {/* Premium glowing orbs — larger, more dramatic */}
      <div className="absolute -top-32 -right-32 w-[700px] h-[700px] rounded-full bg-primary/8 blur-[160px] pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full bg-accent/6 blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] rounded-full bg-nexdrive-blue-glow/5 blur-[100px] pointer-events-none" />

      {/* Subtle car silhouette */}
      <motion.img
        src={heroCarSilhouette}
        alt=""
        aria-hidden="true"
        initial={{ opacity: 0, x: 80 }}
        animate={{ opacity: 0.06, x: 0 }}
        transition={{ duration: 1.4, delay: 0.5 }}
        className="absolute bottom-0 right-0 w-[70%] max-w-[900px] pointer-events-none select-none"
      />

      <div className="container mx-auto px-6 max-w-7xl relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left content */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full glass-card premium-border text-sm font-semibold text-primary mb-8"
            >
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_hsl(var(--primary)/0.6)]" />
              AIoT-Powered Fleet Intelligence
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="font-heading text-4xl sm:text-5xl lg:text-[3.5rem] xl:text-6xl font-bold text-foreground leading-[1.08] tracking-tight mb-7"
            >
              Empower Your Fleet with{" "}
              <span className="gradient-text">AI & IoT</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-lg text-muted-foreground leading-relaxed mb-10 max-w-lg font-body"
            >
              The all-in-one connected vehicle ecosystem for modern car rentals.
              Hardware, software, and mobile access — in one platform.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="flex flex-wrap gap-4 mb-14"
            >
              <a
                href="#cta"
                className="group inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all shadow-[0_4px_20px_hsl(var(--primary)/0.35)] hover:shadow-[0_8px_30px_hsl(var(--primary)/0.45)] hover:-translate-y-0.5 shimmer"
              >
                Book a Demo
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </a>
              <a
                href="#hardware"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border border-primary/20 text-foreground font-medium text-sm hover:border-primary/40 hover:text-primary transition-all glass-card hover:-translate-y-0.5"
              >
                Explore the Ecosystem
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="glass-card premium-border rounded-2xl px-8 py-6"
            >
              <div className="flex items-center gap-8">
                {stats.map((stat, i) => (
                  <div key={stat.label} className="flex items-center gap-8">
                    <div>
                      <div className="font-heading text-2xl font-bold gradient-text">
                        {stat.value}
                      </div>
                      <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-1">
                        {stat.label}
                      </div>
                    </div>
                    {i < stats.length - 1 && (
                      <div className="w-px h-10 bg-gradient-to-b from-transparent via-border to-transparent" />
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right — Ecosystem devices */}
          <motion.div
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="flex justify-center"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-primary/10 rounded-full blur-[100px] scale-125" />
              <div className="absolute inset-0 bg-nexdrive-blue-glow/8 rounded-full blur-[60px] scale-100" />
              <img
                src={ecosystemDevices}
                alt="NexDrive ecosystem — OBD-II device, laptop dashboard, and mobile app"
                width={520}
                height={520}
                className="relative z-10 drop-shadow-[0_20px_60px_hsl(var(--primary)/0.2)]"
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Powered by Capgemini */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.6 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-3 glass-card rounded-full px-6 py-2.5"
      >
        <span className="text-xs text-muted-foreground font-body uppercase tracking-wider">Powered by</span>
        <img src={capgeminiLogo} alt="Capgemini" className="h-5 object-contain" />
      </motion.div>
    </section>
  );
};

export default HeroSection;
