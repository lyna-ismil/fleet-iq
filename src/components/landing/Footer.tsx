import { Linkedin, Github, Twitter } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-nexdrive-surface-2 border-t border-border/50 pt-16 pb-8">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 font-heading font-bold text-lg text-foreground mb-4">
              <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center shadow-[0_2px_8px_hsl(var(--primary)/0.3)]">
                <span className="text-primary-foreground font-bold text-xs">N</span>
              </div>
              NexDrive
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4 font-body">
              AIoT-powered connected vehicle ecosystem for modern car rental
              and fleet management.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-heading text-xs font-bold text-foreground uppercase tracking-[0.1em] mb-5">
              Product
            </h4>
            <ul className="space-y-3">
              {["OBD-II Hardware", "Admin Dashboard", "Mobile App", "API"].map((l) => (
                <li key={l}>
                  <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors font-body">
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-heading text-xs font-bold text-foreground uppercase tracking-[0.1em] mb-5">
              Company
            </h4>
            <ul className="space-y-3">
              {["About Us", "Careers", "Blog", "Contact"].map((l) => (
                <li key={l}>
                  <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors font-body">
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-heading text-xs font-bold text-foreground uppercase tracking-[0.1em] mb-5">
              Legal
            </h4>
            <ul className="space-y-3">
              {["Privacy Policy", "Terms of Service", "Security"].map((l) => (
                <li key={l}>
                  <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors font-body">
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center pt-8 border-t border-border/50 gap-4">
          <p className="text-xs text-muted-foreground font-body">
            © 2026 NexDrive. All rights reserved.
          </p>
          <div className="flex gap-3">
            {[Linkedin, Twitter, Github].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="w-9 h-9 rounded-xl glass-card flex items-center justify-center text-muted-foreground hover:text-primary hover:shadow-[0_0_12px_hsl(var(--primary)/0.15)] transition-all"
              >
                <Icon size={16} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
