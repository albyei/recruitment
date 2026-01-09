import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mockRequisitions, mockForwardedCandidates, ForwardedCandidate } from "@/lib/mockHiringManagerData";
import { useToast } from "@/hooks/use-toast";
import { Users, Star, MessageSquare, Eye, Calendar, Clock, Video } from "lucide-react";

export default function HiringManagerRecruitment() {
  const [candidates, setCandidates] = useState(mockForwardedCandidates);
  const [selectedCandidate, setSelectedCandidate] = useState<ForwardedCandidate | null>(null);
  const [feedback, setFeedback] = useState("");
  const [score, setScore] = useState<string>("");
  const { toast } = useToast();

  const openRequisitions = mockRequisitions.filter((r) => r.status === 'open');

  const statusColors = {
    pending_review: "secondary",
    interview_scheduled: "default",
    interviewed: "outline",
    hired: "default",
    rejected: "destructive",
  } as const;

  const statusLabels = {
    pending_review: "Pending Review",
    interview_scheduled: "Interview Scheduled",
    interviewed: "Interviewed",
    hired: "Hired",
    rejected: "Rejected",
  };

  const handleSubmitFeedback = () => {
    if (!selectedCandidate || !feedback || !score) {
      toast({
        title: "Validation Error",
        description: "Please provide both feedback and score.",
        variant: "destructive",
      });
      return;
    }

    setCandidates((prev) =>
      prev.map((c) =>
        c.id === selectedCandidate.id
          ? { ...c, interviewFeedback: feedback, interviewScore: Number(score), status: 'interviewed' as const }
          : c
      )
    );

    toast({
      title: "Feedback Submitted",
      description: `Interview feedback for ${selectedCandidate.name} has been saved.`,
    });

    setSelectedCandidate(null);
    setFeedback("");
    setScore("");
  };

  const handleJoinMeeting = (meetingLink: string) => {
    window.open(meetingLink, '_blank');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Recruitment Progress</h1>
        <p className="text-muted-foreground">View openings and manage candidate feedback</p>
      </div>

      {/* Open Positions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Open Positions
          </CardTitle>
          <CardDescription>Current job openings in your department</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {openRequisitions.map((req) => (
              <div key={req.id} className="p-4 border rounded-lg bg-card">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-medium text-foreground">{req.title}</h3>
                    <p className="text-sm text-muted-foreground">{req.id}</p>
                  </div>
                  <Badge variant={req.priority === 'high' ? 'destructive' : req.priority === 'medium' ? 'default' : 'secondary'}>
                    {req.priority}
                  </Badge>
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="text-foreground font-medium">{req.filled}/{req.quantity}</span>
                  </div>
                  <Progress value={(req.filled / req.quantity) * 100} className="h-2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Forwarded Candidates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Candidates (HR Forwarded)
          </CardTitle>
          <CardDescription>Review and provide feedback for forwarded candidates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {candidates.map((candidate) => (
              <div key={candidate.id} className="flex items-center justify-between p-4 border rounded-lg bg-card">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-medium text-foreground">{candidate.name}</h3>
                    <Badge variant={statusColors[candidate.status]}>
                      {statusLabels[candidate.status]}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{candidate.position}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm flex-wrap">
                    {/* Interview Date & Time (shown for interview_scheduled) */}
                    {candidate.status === 'interview_scheduled' && candidate.interviewDate && (
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {candidate.interviewDate}
                        {candidate.interviewTime && (
                          <>
                            <Clock className="h-4 w-4 ml-2" />
                            {candidate.interviewTime}
                          </>
                        )}
                      </span>
                    )}
                    <span className="text-muted-foreground">
                      AI Score: <span className="font-medium text-foreground">{candidate.aiScore}%</span>
                    </span>
                    <span className="text-muted-foreground">
                      Forwarded: {new Date(candidate.forwardedDate).toLocaleDateString()}
                    </span>
                    {candidate.interviewScore && (
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                        {candidate.interviewScore}/5
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {/* Join Button for interview_scheduled */}
                  {candidate.status === 'interview_scheduled' && candidate.meetingLink && (
                    <Button 
                      variant="default" 
                      size="sm"
                      onClick={() => handleJoinMeeting(candidate.meetingLink!)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Video className="h-4 w-4 mr-1" />
                      Join
                    </Button>
                  )}
                  {candidate.interviewFeedback ? (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View Feedback
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Interview Feedback - {candidate.name}</DialogTitle>
                          <DialogDescription>
                            Score: {candidate.interviewScore}/5
                          </DialogDescription>
                        </DialogHeader>
                        <div className="mt-4">
                          <p className="text-foreground">{candidate.interviewFeedback}</p>
                        </div>
                      </DialogContent>
                    </Dialog>
                  ) : (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          size="sm"
                          onClick={() => setSelectedCandidate(candidate)}
                        >
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Add Feedback
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Interview Feedback</DialogTitle>
                          <DialogDescription>
                            Provide feedback for {candidate.name}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 mt-4">
                          <div className="space-y-2">
                            <Label>Interview Score</Label>
                            <Select value={score} onValueChange={setScore}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select score" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1">1 - Poor</SelectItem>
                                <SelectItem value="2">2 - Below Average</SelectItem>
                                <SelectItem value="3">3 - Average</SelectItem>
                                <SelectItem value="4">4 - Good</SelectItem>
                                <SelectItem value="5">5 - Excellent</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Feedback</Label>
                            <Textarea
                              value={feedback}
                              onChange={(e) => setFeedback(e.target.value)}
                              placeholder="Enter your interview feedback..."
                              rows={4}
                            />
                          </div>
                          <Button onClick={handleSubmitFeedback} className="w-full">
                            Submit Feedback
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
