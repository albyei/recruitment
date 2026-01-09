import { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Star,
  Video,
  Plus,
  Check,
  X,
  ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  mockInterviews, 
  mockCandidates, 
  mockCalendarAvailability,
  availableTimeSlots,
  Interview 
} from '@/lib/mockHRData';

export default function HRInterviews() {
  const [interviews, setInterviews] = useState<Interview[]>(mockInterviews);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [newInterview, setNewInterview] = useState({
    candidateId: '',
    date: '',
    time: '',
    duration: 60,
    type: 'hr' as 'hr' | 'technical' | 'final',
    interviewers: ''
  });
  const { toast } = useToast();

  const upcomingInterviews = interviews.filter(i => i.status === 'scheduled');
  const completedInterviews = interviews.filter(i => i.status === 'completed');

  const getAvailableSlots = (date: string) => {
    return mockCalendarAvailability[date as keyof typeof mockCalendarAvailability] || [];
  };

  const handleScheduleInterview = () => {
    const candidate = mockCandidates.find(c => c.id === newInterview.candidateId);
    if (!candidate) return;

    const interview: Interview = {
      id: `int-${Date.now()}`,
      candidateId: newInterview.candidateId,
      candidateName: candidate.name,
      position: candidate.position,
      scheduledDate: newInterview.date,
      scheduledTime: newInterview.time,
      duration: newInterview.duration,
      interviewers: newInterview.interviewers.split(',').map(i => i.trim()),
      type: newInterview.type,
      status: 'scheduled',
      meetingLink: 'https://teams.microsoft.com/meet/' + Math.random().toString(36).substr(2, 9)
    };

    setInterviews(prev => [...prev, interview]);
    setShowScheduleDialog(false);
    setNewInterview({
      candidateId: '',
      date: '',
      time: '',
      duration: 60,
      type: 'hr',
      interviewers: ''
    });

    toast({
      title: 'Interview Scheduled',
      description: `Teams/Outlook invite sent to ${candidate.name} and interviewers.`,
    });
  };

  const markAsComplete = (interviewId: string) => {
    setInterviews(prev => prev.map(i => 
      i.id === interviewId ? { ...i, status: 'completed' } : i
    ));
    toast({
      title: 'Interview Completed',
      description: 'Interview has been marked as completed.',
    });
  };

  const cancelInterview = (interviewId: string) => {
    setInterviews(prev => prev.map(i => 
      i.id === interviewId ? { ...i, status: 'cancelled' } : i
    ));
    toast({
      title: 'Interview Cancelled',
      description: 'Cancellation notification sent to all participants.',
    });
  };

  const InterviewCard = ({ interview }: { interview: Interview }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold">{interview.candidateName}</h3>
              <Badge variant={
                interview.type === 'hr' ? 'default' : 
                interview.type === 'technical' ? 'secondary' : 'outline'
              }>
                {interview.type.toUpperCase()}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{interview.position}</p>
            
            <div className="flex flex-wrap gap-4 mt-3 text-sm">
              <div className="flex items-center gap-1 text-muted-foreground">
                <CalendarIcon className="h-4 w-4" />
                <span>{interview.scheduledDate}</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{interview.scheduledTime} ({interview.duration} min)</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-amber-500" />
                <span className="font-medium text-amber-600">{interview.aiScore || '-'}</span>
                <span className="text-muted-foreground">AI Score</span>
              </div>
            </div>
          </div>

          {interview.status === 'scheduled' && (
            <div className="flex flex-col gap-2">
              {interview.meetingLink && (
                <Button size="sm" asChild>
                  <a href={interview.meetingLink} target="_blank" rel="noopener noreferrer">
                    <Video className="h-4 w-4 mr-1" />
                    Join
                  </a>
                </Button>
              )}
              <div className="flex gap-1">
                <Button 
                  size="icon" 
                  variant="outline" 
                  className="h-8 w-8"
                  onClick={() => markAsComplete(interview.id)}
                >
                  <Check className="h-4 w-4 text-green-600" />
                </Button>
                <Button 
                  size="icon" 
                  variant="outline" 
                  className="h-8 w-8"
                  onClick={() => cancelInterview(interview.id)}
                >
                  <X className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            </div>
          )}

          {interview.status === 'completed' && (
            <Badge className="bg-green-500">Completed</Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Interview Scheduler</h1>
          <p className="text-muted-foreground mt-1">Manage interviews with MS Graph calendar sync</p>
        </div>
        <Button onClick={() => setShowScheduleDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Schedule Interview
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="xl:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Calendar</CardTitle>
            <CardDescription>Select a date to view availability</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border w-full max-w-[320px]"
            />
            
            {selectedDate && (
              <div className="mt-4 w-full">
                <h4 className="font-medium text-sm mb-2">
                  Available Slots for {format(selectedDate, 'MMM d, yyyy')}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {getAvailableSlots(format(selectedDate, 'yyyy-MM-dd')).length > 0 ? (
                    getAvailableSlots(format(selectedDate, 'yyyy-MM-dd')).map((slot) => (
                      <Badge key={slot} variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">
                        {slot}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No available slots</p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Interviews List */}
        <div className="xl:col-span-2 space-y-6">
          {/* Upcoming */}
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Upcoming Interviews ({upcomingInterviews.length})
            </h2>
            <div className="space-y-3">
              {upcomingInterviews.length > 0 ? (
                upcomingInterviews.map((interview) => (
                  <InterviewCard key={interview.id} interview={interview} />
                ))
              ) : (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No upcoming interviews scheduled
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Completed */}
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Check className="h-5 w-5" />
              Completed Interviews ({completedInterviews.length})
            </h2>
            <div className="space-y-3">
              {completedInterviews.length > 0 ? (
                completedInterviews.map((interview) => (
                  <InterviewCard key={interview.id} interview={interview} />
                ))
              ) : (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No completed interviews yet
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Schedule New Interview</DialogTitle>
            <DialogDescription>
              Select candidate and time slot. A Teams/Outlook invite will be sent automatically.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Candidate</Label>
              <Select 
                value={newInterview.candidateId} 
                onValueChange={(value) => setNewInterview(prev => ({ ...prev, candidateId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a candidate" />
                </SelectTrigger>
                <SelectContent>
                  {mockCandidates.filter(c => c.stage !== 'hired' && c.stage !== 'rejected').map((candidate) => (
                    <SelectItem key={candidate.id} value={candidate.id}>
                      {candidate.name} - {candidate.position}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input 
                  type="date" 
                  value={newInterview.date}
                  onChange={(e) => setNewInterview(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Time</Label>
                <Select 
                  value={newInterview.time}
                  onValueChange={(value) => setNewInterview(prev => ({ ...prev, time: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTimeSlots.map((slot) => (
                      <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Duration (minutes)</Label>
                <Select 
                  value={newInterview.duration.toString()}
                  onValueChange={(value) => setNewInterview(prev => ({ ...prev, duration: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 min</SelectItem>
                    <SelectItem value="45">45 min</SelectItem>
                    <SelectItem value="60">60 min</SelectItem>
                    <SelectItem value="90">90 min</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Interview Type</Label>
                <Select 
                  value={newInterview.type}
                  onValueChange={(value: 'hr' | 'technical' | 'final') => setNewInterview(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hr">HR Interview</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="final">Final Round</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Interviewers (comma-separated)</Label>
              <Input 
                placeholder="e.g., Jane HR, John Smith"
                value={newInterview.interviewers}
                onChange={(e) => setNewInterview(prev => ({ ...prev, interviewers: e.target.value }))}
              />
            </div>

            <div className="p-3 bg-muted rounded-lg text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <ExternalLink className="h-4 w-4" />
                <span>MS Graph will check calendar availability and send Teams invite</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleScheduleInterview}
              disabled={!newInterview.candidateId || !newInterview.date || !newInterview.time || !newInterview.interviewers}
            >
              Schedule & Send Invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
