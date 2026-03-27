import { motion } from "framer-motion";
import { ArrowRight, Mail } from "lucide-react";

const CTASection = () => {
  return (
    <section id="cta" className="relative py-32 overflow-hidden bg-gradient-to-br from-nexdrive-surface-3 via-background to-nexdrive-surface-2">
      <div className="absolute inset-0 section-dot-pattern opacity-15 pointer-events-none" />
      <div className="absolute top-[-150px] left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/6 blur-[160px] pointer-events-none" />

      <div className="container mx-auto px-6 max-w-3xl relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="glass-card premium-border rounded-3xl p-12 sm:p-16"
        >
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6 tracking-tight leading-tight">
            Ready to Modernize{" "}
            <span className="gradient-text">Your Fleet?</span>
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed mb-10 max-w-xl mx-auto font-body">
            Join forward-thinking fleet operators using NexDrive to cut costs,
            prevent theft, and deliver a premium customer experience.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:contact@nexdrive.io"
              className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all shadow-[0_4px_20px_hsl(var(--primary)/0.35)] hover:shadow-[0_8px_30px_hsl(var(--primary)/0.45)] hover:-translate-y-0.5 shimmer"
            >
              Book a Demo
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </a>
            <a
              href="mailto:contact@nexdrive.io"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border border-primary/20 text-foreground font-medium hover:border-primary/40 hover:text-primary transition-all hover:-translate-y-0.5"
            >
              <Mail size={16} />
              Contact Sales
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
