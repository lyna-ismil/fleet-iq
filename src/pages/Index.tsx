import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import HardwareSection from "@/components/landing/HardwareSection";
import DashboardSection from "@/components/landing/DashboardSection";
import MobileAppSection from "@/components/landing/MobileAppSection";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <HardwareSection />
      <DashboardSection />
      <MobileAppSection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Index;
