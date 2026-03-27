import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Nfc, CalendarCheck, History, Sparkles } from "lucide-react";
import mobileApp from "@/assets/mobile-app-mockup.png";
import obdDevice from "@/assets/obd-device-single.png";

const features = [
  { icon: Nfc, title: "NFC Digital Keys", desc: "Renters unlock cars by tapping their phone — no physical keys, no handoffs." },
  { icon: CalendarCheck, title: "Self-Service Booking", desc: "Customers browse, reserve, and pay — all from the app. Zero staff needed." },
  { icon: History, title: "Trip History", desc: "Complete trip logs with routes, costs, and analytics for every rental." },
  { icon: Sparkles, title: "Premium Experience", desc: "Give your customers a modern, Tesla-like digital experience." },
];

const MobileAppSection = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const phoneX = useTransform(scrollYProgress, [0.1, 0.4], [100, 0]);
  const phoneOpacity = useTransform(scrollYProgress, [0.1, 0.35], [0, 1]);
  const obdX = useTransform(scrollYProgress, [0.1, 0.4], [-100, 0]);

  return (
    <section id="mobile" ref={sectionRef} className="relative py-32 bg-nexdrive-surface-2 overflow-hidden">
      <div className="absolute inset-0 section-dot-pattern opacity-15 pointer-events-none" />
      <div className="absolute top-1/4 right-0 w-[500px] h-[500px] rounded-full bg-accent/4 blur-[150px] pointer-events-none" />

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
            Mobile Application
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground mb-5 tracking-tight">
            Zero-Friction Rentals.{" "}
            <span className="gradient-text">No More Keys.</span>
          </h2>
          <p className="text-muted-foreground text-base leading-relaxed font-body max-w-xl mx-auto">
            Deliver a premium, contactless rental experience to your customers.
            Book, unlock, and drive — all from their smartphone.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Visual — Phone + OBD with NFC wave */}
          <div className="relative flex justify-center items-center min-h-[500px]">
            {/* OBD device */}
            <motion.img
              src={obdDevice}
              alt="OBD-II device"
              style={{ x: obdX, opacity: phoneOpacity }}
              className="absolute left-[10%] top-1/2 -translate-y-1/2 w-28 h-28 object-contain drop-shadow-[0_10px_30px_hsl(var(--primary)/0.15)] z-10"
            />

            {/* NFC Waves */}
            <div className="absolute left-[35%] top-1/2 -translate-y-1/2 z-10">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="absolute w-16 h-16 rounded-full border-2 border-primary/25"
                  animate={{
                    scale: [1, 2.5],
                    opacity: [0.5, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.6,
                  }}
                  style={{ top: "-32px", left: "-32px" }}
                />
              ))}
            </div>

            {/* Phone mockup */}
            <motion.div
              style={{ x: phoneX, opacity: phoneOpacity }}
              className="relative z-10"
            >
              <img
                src={mobileApp}
                alt="NexDrive Mobile App — NFC Digital Key"
                loading="lazy"
                width={300}
                height={600}
                className="drop-shadow-[0_20px_60px_hsl(var(--primary)/0.15)]"
              />
            </motion.div>
          </div>

          {/* Features */}
          <div className="space-y-5">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="flex gap-5 items-start group p-5 rounded-2xl hover:bg-card/60 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/15 flex items-center justify-center text-primary flex-shrink-0 group-hover:shadow-[0_0_20px_hsl(var(--primary)/0.2)] transition-shadow">
                  <f.icon size={22} />
                </div>
                <div>
                  <h3 className="font-heading text-base font-bold text-foreground mb-1.5">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed font-body">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default MobileAppSection;
