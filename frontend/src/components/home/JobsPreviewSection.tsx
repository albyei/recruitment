import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JobCard } from "@/components/jobs/JobCard";
import { jobs } from "@/lib/mockData";
import { motion } from "framer-motion";

export function JobsPreviewSection() {
  const featuredJobs = jobs.slice(0, 3);

  return (
    <section className="py-20">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-foreground mb-3">Featured Openings</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore our current opportunities and find the perfect role for you
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {featuredJobs.map((job, index) => (
            <JobCard key={job.id} job={job} index={index} />
          ))}
        </div>

        <div className="text-center">
          <Button variant="secondary" size="lg" asChild>
            <Link to="/careers">
              View All Positions
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
