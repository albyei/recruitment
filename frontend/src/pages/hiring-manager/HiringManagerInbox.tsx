import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { mockMPPRequests } from "@/lib/mockHiringManagerData";
import { Inbox, AlertCircle, RefreshCw, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function HiringManagerInbox() {
  const navigate = useNavigate();
  
  const rejectedOrRevisionRequests = mockMPPRequests.filter(
    (mpp) => mpp.status === 'rejected' || mpp.status === 'revision_requested'
  );

  const statusConfig = {
    rejected: {
      label: "Rejected",
      variant: "destructive" as const,
      icon: AlertCircle,
      color: "text-destructive",
    },
    revision_requested: {
      label: "Revision Requested",
      variant: "default" as const,
      icon: RefreshCw,
      color: "text-amber-500",
    },
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Inbox</h1>
        <p className="text-muted-foreground">View rejected MPPs and change requests from HR</p>
      </div>

      {rejectedOrRevisionRequests.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <Inbox className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No pending items</h3>
            <p className="text-muted-foreground">
              All your MPP requests have been approved. You're all caught up!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {rejectedOrRevisionRequests.map((mpp) => {
            const config = statusConfig[mpp.status as 'rejected' | 'revision_requested'];
            const StatusIcon = config.icon;

            return (
              <Card key={mpp.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`mt-1 ${config.color}`}>
                        <StatusIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{mpp.title}</CardTitle>
                        <CardDescription>
                          Submitted on {new Date(mpp.submittedAt).toLocaleDateString()}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant={config.variant}>{config.label}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Quantity:</span>
                      <span className="ml-2 font-medium text-foreground">{mpp.quantity}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Salary Range:</span>
                      <span className="ml-2 font-medium text-foreground">
                        {formatCurrency(mpp.salaryMin)} - {formatCurrency(mpp.salaryMax)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Priority:</span>
                      <Badge variant="outline" className="ml-2 capitalize">{mpp.priority}</Badge>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-1">Requirements</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">{mpp.requirements}</p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-1">Original Justification</h4>
                    <p className="text-sm text-muted-foreground">{mpp.justification}</p>
                  </div>

                  {mpp.feedback && (
                    <div className="p-4 bg-muted/50 rounded-lg border-l-4 border-l-primary">
                      <h4 className="text-sm font-medium text-foreground mb-1">HR Feedback</h4>
                      <p className="text-sm text-muted-foreground">{mpp.feedback}</p>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-2">
                    {mpp.status === 'revision_requested' && (
                      <Button onClick={() => navigate('/hiring-manager/mpp')}>
                        <FileText className="h-4 w-4 mr-2" />
                        Revise & Resubmit
                      </Button>
                    )}
                    {mpp.status === 'rejected' && (
                      <Button variant="outline" onClick={() => navigate('/hiring-manager/mpp')}>
                        <FileText className="h-4 w-4 mr-2" />
                        Submit New Request
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
