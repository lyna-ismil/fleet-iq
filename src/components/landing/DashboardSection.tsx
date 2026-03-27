import { useRef } from "react";
import { motion } from "framer-motion";
import { BarChart3, MapPinned, Brain, Eye } from "lucide-react";

const features = [
  { icon: Eye, title: "Live Fleet Tracking", desc: "See every vehicle in real-time on an interactive map with status indicators." },
  { icon: Brain, title: "AI Predictive Maintenance", desc: "Remaining Useful Life (RUL) predictions cut unexpected breakdowns by 70%." },
  { icon: MapPinned, title: "Geofencing Alerts", desc: "Set virtual boundaries and get instant alerts when vehicles leave zones." },
  { icon: BarChart3, title: "Operational Analytics", desc: "Revenue, utilization, and performance dashboards at your fingertips." },
];

const DashboardSection = () => {
  const sectionRef = useRef<HTMLDivElement>(null);

  return (
    <section id="dashboard" ref={sectionRef} className="relative py-32 bg-background overflow-hidden">
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full bg-primary/4 blur-[150px] pointer-events-none" />

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
            Admin Dashboard
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground mb-5 tracking-tight">
            Turn Data into Decisions.{" "}
            <span className="gradient-text">Cut Costs.</span>
          </h2>
          <p className="text-muted-foreground text-base leading-relaxed font-body max-w-xl mx-auto">
            Your fleet's command center — real-time monitoring, AI-driven insights,
            and complete operational visibility from one powerful dashboard.
          </p>
        </motion.div>

        {/* Feature cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group p-7 rounded-2xl glass-card premium-border hover:shadow-[var(--shadow-card-hover)] transition-all duration-300 hover:-translate-y-1.5"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/15 flex items-center justify-center text-primary mb-5 group-hover:shadow-[0_0_20px_hsl(var(--primary)/0.2)] transition-shadow">
                <f.icon size={22} />
              </div>
              <h3 className="font-heading text-base font-bold text-foreground mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed font-body">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DashboardSection;
