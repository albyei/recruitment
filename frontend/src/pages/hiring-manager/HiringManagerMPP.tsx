import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { FileText, Send } from "lucide-react";

interface MPPFormData {
  title: string;
  aboutRole: string;
  responsibilities: string;
  requirements: string;
  benefits: string;
  salaryMin: number;
  salaryMax: number;
  quantity: number;
  priority: 'high' | 'medium' | 'low';
  justification: string;
}

const initialFormData: MPPFormData = {
  title: '',
  aboutRole: '',
  responsibilities: '',
  requirements: '',
  benefits: '',
  salaryMin: 0,
  salaryMax: 0,
  quantity: 1,
  priority: 'medium',
  justification: '',
};

export default function HiringManagerMPP() {
  const [formData, setFormData] = useState<MPPFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'quantity' || name === 'salaryMin' || name === 'salaryMax' 
        ? Number(value) 
        : value,
    }));
  };

  const handlePriorityChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      priority: value as 'high' | 'medium' | 'low',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.aboutRole || !formData.responsibilities || 
        !formData.requirements || !formData.benefits || !formData.justification) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (formData.salaryMin > formData.salaryMax) {
      toast({
        title: "Validation Error",
        description: "Minimum salary cannot exceed maximum salary.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    toast({
      title: "MPP Request Submitted",
      description: "Your manpower planning request has been sent to HR for approval.",
    });
    
    setFormData(initialFormData);
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Manpower Planning Request</h1>
        <p className="text-muted-foreground">Submit a new position request for HR approval</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            New MPP Request
          </CardTitle>
          <CardDescription>
            Fill out the form below to request a new position for your department
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="title">Position Title *</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., Senior Software Engineer"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="aboutRole">About This Role *</Label>
              <Textarea
                id="aboutRole"
                name="aboutRole"
                value={formData.aboutRole}
                onChange={handleInputChange}
                placeholder="Provide a brief description of the role and its purpose..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="responsibilities">Responsibilities *</Label>
              <Textarea
                id="responsibilities"
                name="responsibilities"
                value={formData.responsibilities}
                onChange={handleInputChange}
                placeholder="List the key responsibilities for this role..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="requirements">Requirements *</Label>
              <Textarea
                id="requirements"
                name="requirements"
                value={formData.requirements}
                onChange={handleInputChange}
                placeholder="Describe the required skills, experience, and qualifications..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="benefits">Benefits *</Label>
              <Textarea
                id="benefits"
                name="benefits"
                value={formData.benefits}
                onChange={handleInputChange}
                placeholder="List the benefits offered for this position..."
                rows={3}
              />
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="salaryMin">Salary Range (Min)</Label>
                <Input
                  id="salaryMin"
                  name="salaryMin"
                  type="number"
                  min="0"
                  value={formData.salaryMin}
                  onChange={handleInputChange}
                  placeholder="e.g., 15000000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="salaryMax">Salary Range (Max)</Label>
                <Input
                  id="salaryMax"
                  name="salaryMax"
                  type="number"
                  min="0"
                  value={formData.salaryMax}
                  onChange={handleInputChange}
                  placeholder="e.g., 25000000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority *</Label>
                <Select value={formData.priority} onValueChange={handlePriorityChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="justification">Justification *</Label>
              <Textarea
                id="justification"
                name="justification"
                value={formData.justification}
                onChange={handleInputChange}
                placeholder="Explain why this position is needed..."
                rows={4}
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting} size="lg">
                {isSubmitting ? (
                  "Submitting..."
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Submit Request
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}