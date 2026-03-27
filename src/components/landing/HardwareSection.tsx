import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Cpu, Radio, MapPin, Shield, Zap, RefreshCw } from "lucide-react";
import obdDual from "@/assets/obd-device-dual.png";

const features = [
  { icon: Cpu, title: "ESP32 + LTE-M", desc: "Dual-core processing with cellular connectivity for reliable data transmission." },
  { icon: MapPin, title: "Precision GPS", desc: "Real-time vehicle tracking with sub-meter accuracy and geofencing." },
  { icon: Shield, title: "Remote Immobilization", desc: "V2X-safe vehicle immobilization for theft prevention and fleet control." },
  { icon: RefreshCw, title: "Secure OTA Updates", desc: "Over-the-air firmware updates keep every device current without recalls." },
  { icon: Zap, title: "Plug & Play", desc: "Installs in seconds — just plug into the OBD-II port. No wiring needed." },
  { icon: Radio, title: "Real-Time Telemetry", desc: "Engine health, fuel, speed, and 200+ data points streamed live." },
];

const HardwareSection = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const rotateY = useTransform(scrollYProgress, [0, 0.5, 1], [30, 0, -30]);
  const rotateX = useTransform(scrollYProgress, [0, 0.5, 1], [10, 0, -10]);
  const scale = useTransform(scrollYProgress, [0, 0.4, 0.6, 1], [0.8, 1.05, 1.05, 0.9]);

  return (
    <section id="hardware" ref={sectionRef} className="relative py-32 bg-nexdrive-surface-2 overflow-hidden">
      <div className="absolute inset-0 section-dot-pattern opacity-15 pointer-events-none" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-primary/4 blur-[150px] pointer-events-none" />

      <div className="container mx-auto px-6 max-w-7xl relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center max-w-2xl mx-auto mb-20"
        >
          <span className="inline-flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-[0.15em] mb-5 px-4 py-1.5 rounded-full glass-card mx-auto">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            The Hardware
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground mb-5 tracking-tight">
            Deep Vehicle Intelligence.{" "}
            <span className="gradient-text">Absolute Control.</span>
          </h2>
          <p className="text-muted-foreground text-base leading-relaxed font-body max-w-xl mx-auto">
            Our custom-built OBD-II device is the brain of your fleet — delivering real-time data,
            diagnostics, and remote control from a single plug-and-play unit.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-20 items-center">
          {/* 3D Device */}
          <div className="flex justify-center perspective-1000">
            <motion.div
              style={{ rotateY, rotateX, scale }}
              className="preserve-3d relative"
            >
              <div className="absolute inset-0 bg-primary/8 rounded-full blur-[100px] scale-125" />
              <img
                src={obdDual}
                alt="NexDrive OBD-II Device — Internal Components"
                width={500}
                height={500}
                className="relative z-10 drop-shadow-[0_20px_60px_hsl(var(--primary)/0.2)]"
              />
              {/* Floating labels with glass effect */}
              <motion.div
                className="absolute -top-4 -right-4 px-4 py-2 rounded-xl glass-card premium-border text-xs font-bold text-primary font-body"
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                ESP32 Core
              </motion.div>
              <motion.div
                className="absolute bottom-8 -left-4 px-4 py-2 rounded-xl glass-card premium-border text-xs font-bold text-primary font-body"
                animate={{ y: [0, 6, 0] }}
                transition={{ duration: 3.5, repeat: Infinity }}
              >
                LTE-M Module
              </motion.div>
              <motion.div
                className="absolute top-1/2 -right-8 px-4 py-2 rounded-xl glass-card premium-border text-xs font-bold text-primary font-body"
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                GPS Antenna
              </motion.div>
            </motion.div>
          </div>

          {/* Features Grid */}
          <div className="grid sm:grid-cols-2 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="group p-6 rounded-2xl glass-card premium-border hover:shadow-[var(--shadow-card-hover)] transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/15 flex items-center justify-center text-primary mb-4 group-hover:shadow-[0_0_20px_hsl(var(--primary)/0.2)] transition-shadow">
                  <f.icon size={20} />
                </div>
                <h3 className="font-heading text-sm font-bold text-foreground mb-2">{f.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed font-body">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HardwareSection;
