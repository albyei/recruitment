import { useState } from 'react';
import { 
  FileText, 
  CheckCircle, 
  XCircle, 
  MessageSquare,
  Clock,
  Filter,
  Search,
  Eye
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { mockMPPRequests, MPPRequest } from '@/lib/mockHRData';

export default function HRRequisitions() {
  const [requests, setRequests] = useState<MPPRequest[]>(mockMPPRequests);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<MPPRequest | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'revision' | null>(null);
  const [detailRequest, setDetailRequest] = useState<MPPRequest | null>(null);
  const [feedback, setFeedback] = useState('');
  const { toast } = useToast();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const filteredRequests = requests.filter(req => {
    const matchesStatus = filterStatus === 'all' || req.status === filterStatus;
    const matchesSearch = req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         req.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         req.requestedBy.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleAction = () => {
    if (!selectedRequest || !actionType) return;

    const newStatus = actionType === 'approve' ? 'approved' : 
                     actionType === 'reject' ? 'rejected' : 'revision';

    setRequests(prev => prev.map(req => 
      req.id === selectedRequest.id 
        ? { ...req, status: newStatus, hrFeedback: feedback }
        : req
    ));

    const messages = {
      approve: 'MPP approved! Job posting will be published to the landing page.',
      reject: 'MPP has been rejected.',
      revision: 'Revision request sent to the hiring manager.'
    };

    toast({
      title: actionType === 'approve' ? 'Approved!' : actionType === 'reject' ? 'Rejected' : 'Revision Requested',
      description: messages[actionType],
    });

    setSelectedRequest(null);
    setActionType(null);
    setFeedback('');
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20">Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">Rejected</Badge>;
      case 'revision':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">Revision</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold">Requisition Management</h1>
        <p className="text-muted-foreground mt-1">Review and manage Manpower Planning Requests</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title, department, or requester..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="revision">Revision</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Requests List */}
      <div className="grid gap-4">
        {filteredRequests.map((request) => (
          <Card key={request.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{request.title}</h3>
                    {getStatusBadge(request.status)}
                    <div className={`h-2 w-2 rounded-full ${getPriorityColor(request.priority)}`} title={`${request.priority} priority`} />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Department</p>
                      <p className="font-medium">{request.department}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Requested By</p>
                      <p className="font-medium">{request.requestedBy}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Quantity</p>
                      <p className="font-medium">{request.quantity} position(s)</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Salary Range</p>
                      <p className="font-medium">{formatCurrency(request.salaryMin)} - {formatCurrency(request.salaryMax)}</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className="text-sm text-muted-foreground">Date Posted: {request.datePosted}</p>
                  </div>
                  {request.hrFeedback && (
                    <div className="mt-3 p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium">HR Feedback:</p>
                      <p className="text-sm text-muted-foreground">{request.hrFeedback}</p>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2 lg:flex-col">
                  <Button 
                    variant="outline"
                    onClick={() => setDetailRequest(request)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Detail
                  </Button>
                  {request.status === 'pending' && (
                    <>
                      <Button 
                        onClick={() => { setSelectedRequest(request); setActionType('approve'); }}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => { setSelectedRequest(request); setActionType('revision'); }}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Request Changes
                      </Button>
                      <Button 
                        variant="destructive"
                        onClick={() => { setSelectedRequest(request); setActionType('reject'); }}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </>
                  )}

                  {request.status !== 'pending' && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Submitted {request.submittedDate}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredRequests.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No Requests Found</h3>
              <p className="text-muted-foreground">Try adjusting your filters or search query.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!detailRequest} onOpenChange={() => setDetailRequest(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-xl">{detailRequest?.title}</DialogTitle>
            <DialogDescription>
              {detailRequest?.department} • Posted on {detailRequest?.datePosted}
            </DialogDescription>
          </DialogHeader>
          
          {detailRequest && (
            <ScrollArea className="max-h-[60vh] pr-4">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  {getStatusBadge(detailRequest.status)}
                  <Badge variant="outline" className="capitalize">{detailRequest.priority} Priority</Badge>
                  <span className="text-sm text-muted-foreground">
                    {detailRequest.quantity} position(s)
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2">About This Role</h4>
                  <p className="text-sm text-muted-foreground">{detailRequest.aboutRole}</p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2">Responsibilities</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{detailRequest.responsibilities}</p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2">Requirements</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{detailRequest.requirements}</p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2">Benefits</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{detailRequest.benefits}</p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2">Salary Range</h4>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(detailRequest.salaryMin)} - {formatCurrency(detailRequest.salaryMax)}
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2">Justification</h4>
                  <p className="text-sm text-muted-foreground">{detailRequest.justification}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Requested By</p>
                    <p className="font-medium">{detailRequest.requestedBy}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Submitted Date</p>
                    <p className="font-medium">{detailRequest.submittedDate}</p>
                  </div>
                </div>

                {detailRequest.hrFeedback && (
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="text-sm font-semibold text-foreground mb-2">HR Feedback</h4>
                    <p className="text-sm text-muted-foreground">{detailRequest.hrFeedback}</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailRequest(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Action Dialog */}
      <Dialog open={!!actionType} onOpenChange={() => { setActionType(null); setFeedback(''); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' && 'Approve MPP Request'}
              {actionType === 'reject' && 'Reject MPP Request'}
              {actionType === 'revision' && 'Request Changes'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'approve' && 'This will publish the job posting to the landing page.'}
              {actionType === 'reject' && 'Please provide a reason for rejecting this request.'}
              {actionType === 'revision' && 'Specify what changes are needed.'}
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-medium">{selectedRequest.title}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedRequest.department} • {selectedRequest.quantity} position(s)
                </p>
              </div>
              
              {(actionType === 'reject' || actionType === 'revision') && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {actionType === 'reject' ? 'Rejection Reason' : 'Requested Changes'}
                  </label>
                  <Textarea
                    placeholder={actionType === 'reject' 
                      ? 'Please explain why this request is being rejected...'
                      : 'Describe the changes needed...'}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    rows={4}
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => { setActionType(null); setFeedback(''); }}>
              Cancel
            </Button>
            <Button 
              onClick={handleAction}
              className={actionType === 'approve' ? 'bg-green-600 hover:bg-green-700' : 
                        actionType === 'reject' ? 'bg-red-600 hover:bg-red-700' : ''}
              disabled={(actionType === 'reject' || actionType === 'revision') && !feedback.trim()}
            >
              {actionType === 'approve' && 'Approve & Publish'}
              {actionType === 'reject' && 'Reject Request'}
              {actionType === 'revision' && 'Send Feedback'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}