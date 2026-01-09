import { useState } from 'react';
import { 
  Search, 
  Filter, 
  User, 
  Mail, 
  Phone, 
  Linkedin,
  FileText,
  Star,
  Clock,
  ChevronRight,
  X
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { mockCandidates, Candidate, pipelineStages } from '@/lib/mockHRData';

export default function HRCandidates() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [filterStage, setFilterStage] = useState<string>('all');
  const [minAiScore, setMinAiScore] = useState<number>(0);
  const [minExperience, setMinExperience] = useState<number>(0);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  const departments = [...new Set(mockCandidates.map(c => c.department))];

  const filteredCandidates = mockCandidates.filter(candidate => {
    const matchesSearch = candidate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         candidate.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         candidate.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesDepartment = filterDepartment === 'all' || candidate.department === filterDepartment;
    const matchesStage = filterStage === 'all' || candidate.stage === filterStage;
    const matchesAiScore = candidate.aiScore >= minAiScore;
    const matchesExperience = candidate.experience >= minExperience;
    
    return matchesSearch && matchesDepartment && matchesStage && matchesAiScore && matchesExperience;
  });

  const getStageInfo = (stage: string) => {
    return pipelineStages.find(s => s.key === stage) || { label: stage, color: 'bg-gray-500' };
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold">Candidate Management</h1>
        <p className="text-muted-foreground mt-1">Search, filter, and manage all candidates</p>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filter Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterStage} onValueChange={setFilterStage}>
                <SelectTrigger>
                  <SelectValue placeholder="All Stages" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stages</SelectItem>
                  {pipelineStages.map(stage => (
                    <SelectItem key={stage.key} value={stage.key}>{stage.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Min AI Score</span>
                  <span className="font-medium">{minAiScore}</span>
                </div>
                <Slider
                  value={[minAiScore]}
                  onValueChange={(value) => setMinAiScore(value[0])}
                  max={100}
                  step={5}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Min Experience (years)</span>
                  <span className="font-medium">{minExperience}</span>
                </div>
                <Slider
                  value={[minExperience]}
                  onValueChange={(value) => setMinExperience(value[0])}
                  max={15}
                  step={1}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {filteredCandidates.length} of {mockCandidates.length} candidates
              </p>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setFilterDepartment('all');
                  setFilterStage('all');
                  setMinAiScore(0);
                  setMinExperience(0);
                }}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Candidates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCandidates.map((candidate) => {
          const stageInfo = getStageInfo(candidate.stage);
          return (
            <Card 
              key={candidate.id} 
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedCandidate(candidate)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-lg font-medium text-primary">
                        {candidate.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold">{candidate.name}</h3>
                      <p className="text-sm text-muted-foreground">{candidate.position}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">AI Score</span>
                    <div className="flex items-center gap-2">
                      <Progress value={candidate.aiScore} className="w-20 h-2" />
                      <span className="text-sm font-medium">{candidate.aiScore}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Experience</span>
                    <span className="text-sm font-medium">{candidate.experience} years</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Stage</span>
                    <Badge className={`${stageInfo.color} text-white`}>
                      {stageInfo.label}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-1 pt-2">
                    {candidate.skills.slice(0, 3).map((skill) => (
                      <Badge key={skill} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {candidate.skills.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{candidate.skills.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredCandidates.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No Candidates Found</h3>
            <p className="text-muted-foreground">Try adjusting your filters or search query.</p>
          </CardContent>
        </Card>
      )}

      {/* Candidate Detail Sheet */}
      <Sheet open={!!selectedCandidate} onOpenChange={() => setSelectedCandidate(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          {selectedCandidate && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-2xl font-medium text-primary">
                      {selectedCandidate.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <SheetTitle className="text-xl">{selectedCandidate.name}</SheetTitle>
                    <SheetDescription>{selectedCandidate.position}</SheetDescription>
                  </div>
                </div>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Contact Info */}
                <div className="space-y-3">
                  <h4 className="font-semibold">Contact Information</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a href={`mailto:${selectedCandidate.email}`} className="text-primary hover:underline">
                        {selectedCandidate.email}
                      </a>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedCandidate.phone}</span>
                    </div>
                    {selectedCandidate.linkedIn && (
                      <div className="flex items-center gap-2 text-sm">
                        <Linkedin className="h-4 w-4 text-muted-foreground" />
                        <a href={selectedCandidate.linkedIn} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          LinkedIn Profile
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Star className="h-4 w-4 text-amber-500" />
                        <span className="text-2xl font-bold">{selectedCandidate.aiScore}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">AI Score</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold mb-1">{selectedCandidate.experience}</div>
                      <p className="text-sm text-muted-foreground">Years Exp.</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Skills */}
                <div className="space-y-3">
                  <h4 className="font-semibold">Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedCandidate.skills.map((skill) => (
                      <Badge key={skill} variant="secondary">{skill}</Badge>
                    ))}
                  </div>
                </div>

                {/* Resume */}
                <div className="space-y-3">
                  <h4 className="font-semibold">Resume</h4>
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    View Resume (PDF)
                  </Button>
                </div>

                {/* Timeline */}
                <div className="space-y-3">
                  <h4 className="font-semibold">Activity Timeline</h4>
                  <ScrollArea className="h-64">
                    <div className="space-y-4">
                      {selectedCandidate.timeline.map((event, index) => (
                        <div key={event.id} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className="h-3 w-3 rounded-full bg-primary" />
                            {index < selectedCandidate.timeline.length - 1 && (
                              <div className="w-0.5 h-full bg-border mt-1" />
                            )}
                          </div>
                          <div className="flex-1 pb-4">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-sm">{event.event}</p>
                              <span className="text-xs text-muted-foreground">{event.date}</span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                            {event.user && (
                              <p className="text-xs text-muted-foreground mt-1">by {event.user}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button className="flex-1">Move to Next Stage</Button>
                  <Button variant="outline">Schedule Interview</Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
