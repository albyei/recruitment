import { Link } from "react-router-dom";
import { MapPin, Briefcase, Clock, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Job } from "@/lib/mockData";
import { motion } from "framer-motion";

interface JobCardProps {
  job: Job;
  index?: number;
}

export function JobCard({ job, index = 0 }: JobCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="group relative bg-card rounded-xl border border-border p-6 shadow-card hover:shadow-card-hover transition-all duration-300 hover:border-secondary/30 h-full"
    >
      <div className="flex flex-col gap-4 h-full">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground group-hover:text-secondary transition-colors">
              {job.title}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">{job.department}</p>
          </div>
          <Badge variant="secondary" className="shrink-0">
            {job.type}
          </Badge>
        </div>

        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4" />
            {job.location}
          </span>
          <span className="flex items-center gap-1.5">
            <DollarSign className="h-4 w-4" />
            {job.salary}
          </span>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2 flex-1">
          {job.description}
        </p>

        <div className="flex items-center justify-between pt-2 mt-auto">
          <span className="text-xs text-muted-foreground">
            Posted {new Date(job.postedDate).toLocaleDateString()}
          </span>
          <Button variant="outline" size="sm" asChild>
            <Link to={`/careers/${job.id}`}>See Details</Link>
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
