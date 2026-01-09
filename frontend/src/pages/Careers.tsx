import { useState, useMemo } from "react";
import { JobCard } from "@/components/jobs/JobCard";
import { JobFilters } from "@/components/jobs/JobFilters";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { jobs } from "@/lib/mockData";
import { motion } from "framer-motion";

export default function Careers() {
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [location, setLocation] = useState("");
  const [type, setType] = useState("");

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const matchesSearch =
        !search ||
        job.title.toLowerCase().includes(search.toLowerCase()) ||
        job.description.toLowerCase().includes(search.toLowerCase());
      const matchesDepartment = !department || department === "all" || job.department === department;
      const matchesLocation = !location || location === "all" || job.location === location;
      const matchesType = !type || type === "all" || job.type === type;
      return matchesSearch && matchesDepartment && matchesLocation && matchesType;
    });
  }, [search, department, location, type]);

  const clearFilters = () => {
    setSearch("");
    setDepartment("");
    setLocation("");
    setType("");
  };

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      
      {/* Hero */}
      <section className="gradient-hero pt-32 pb-16">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl"
          >
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-4">
              Find Your Next Opportunity
            </h1>
            <p className="text-lg text-primary-foreground/80">
              We're looking for talented people to join our team. Explore our open positions and discover your perfect role.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Jobs Section */}
      <section className="py-12">
        <div className="container">
          <JobFilters
            search={search}
            onSearchChange={setSearch}
            department={department}
            onDepartmentChange={setDepartment}
            location={location}
            onLocationChange={setLocation}
            type={type}
            onTypeChange={setType}
            onClear={clearFilters}
          />

          <div className="mt-8">
            <p className="text-sm text-muted-foreground mb-6">
              Showing {filteredJobs.length} {filteredJobs.length === 1 ? "position" : "positions"}
            </p>

            {filteredJobs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredJobs.map((job, index) => (
                  <JobCard key={job.id} job={job} index={index} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-card rounded-xl border border-border">
                <p className="text-lg font-medium text-foreground mb-2">No positions found</p>
                <p className="text-muted-foreground mb-4">Try adjusting your filters</p>
                <button
                  onClick={clearFilters}
                  className="text-secondary hover:underline font-medium"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
