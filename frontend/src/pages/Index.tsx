import { HeroSection } from "@/components/home/HeroSection";
import { NewsSection } from "@/components/home/NewsSection";
import { JobsPreviewSection } from "@/components/home/JobsPreviewSection";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />
      <main className="flex-1">
        <HeroSection />
        <JobsPreviewSection />
        <NewsSection />
        
        {/* CTA Section */}
        <section className="py-20 gradient-hero">
          <div className="container text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              Ready to Start Your Journey?
            </h2>
            <p className="text-lg text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
              Join our talented team and make an impact. We're always looking for passionate people who want to grow with us.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a
                href="/careers"
                className="inline-flex items-center gap-2 px-8 py-3 rounded-lg bg-accent text-accent-foreground font-semibold shadow-lg hover:shadow-xl hover:bg-accent/90 transition-all"
              >
                Browse All Jobs
              </a>
              <a
                href="/login"
                className="inline-flex items-center gap-2 px-8 py-3 rounded-lg bg-primary-foreground/10 border border-primary-foreground/30 text-primary-foreground font-semibold hover:bg-primary-foreground/20 transition-all"
              >
                Candidate Login
              </a>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
};

export default Index;
