import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";

const navLinks = [
  { label: "Hardware", href: "#hardware" },
  { label: "Dashboard", href: "#dashboard" },
  { label: "Mobile App", href: "#mobile" },
  { label: "Contact", href: "#cta" },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-background/80 backdrop-blur-2xl backdrop-saturate-[180%] border-b border-border/50 shadow-[0_1px_3px_hsl(var(--primary)/0.06)] py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="container mx-auto px-6 flex items-center justify-between max-w-7xl">
        <a href="#" className="flex items-center gap-2.5 font-heading font-bold text-xl text-foreground">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-[0_2px_10px_hsl(var(--primary)/0.3)]">
            <span className="text-primary-foreground font-bold text-sm">N</span>
          </div>
          NexDrive
        </a>

        <div className="hidden md:flex items-center gap-10">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors relative after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-[2px] after:bg-primary after:rounded-full after:transition-all after:duration-300 hover:after:w-full"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <a href="#cta" className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all shadow-[0_2px_12px_hsl(var(--primary)/0.3)] hover:shadow-[0_4px_16px_hsl(var(--primary)/0.4)] hover:-translate-y-0.5">
            Book a Demo
          </a>
        </div>

        <button
          className="md:hidden p-2 text-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="md:hidden bg-background/95 backdrop-blur-2xl border-t border-border/50 px-6 py-6"
        >
          <div className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="text-foreground font-medium py-2"
              >
                {link.label}
              </a>
            ))}
            <a href="#cta" className="mt-2 px-5 py-3 rounded-lg bg-primary text-primary-foreground text-sm font-semibold text-center shadow-[0_2px_12px_hsl(var(--primary)/0.3)]">
              Book a Demo
            </a>
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
};

export default Navbar;
