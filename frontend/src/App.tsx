import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ScrollToTop } from "./components/ScrollToTop";
import { AuthProvider } from "./contexts/AuthContext";
import Index from "./pages/Index";
import Careers from "./pages/Careers";
import JobDetail from "./pages/JobDetail";
import QuickApply from "./pages/QuickApply";
import News from "./pages/News";
import NewsDetail from "./pages/NewsDetail";
import Login from "./pages/Login";
import CandidateLogin from "./pages/CandidateLogin";
import CandidateRegister from "./pages/CandidateRegister";
import CandidateLayout from "./components/candidate/CandidateLayout";
import CandidateDashboard from "./pages/candidate/CandidateDashboard";
import CandidateApplications from "./pages/candidate/CandidateApplications";
import CandidateProfile from "./pages/candidate/CandidateProfile";
import Dashboard from "./pages/Dashboard";
import InternalLayout from "./components/internal/InternalLayout";
import HiringManagerDashboard from "./pages/hiring-manager/HiringManagerDashboard";
import HiringManagerMPP from "./pages/hiring-manager/HiringManagerMPP";
import HiringManagerRecruitment from "./pages/hiring-manager/HiringManagerRecruitment";
import HiringManagerInbox from "./pages/hiring-manager/HiringManagerInbox";
import HRDashboard from "./pages/hr/HRDashboard";
import HRRequisitions from "./pages/hr/HRRequisitions";
import HRCandidates from "./pages/hr/HRCandidates";
import HRPipeline from "./pages/hr/HRPipeline";
import HRInterviews from "./pages/hr/HRInterviews";
import HRAnalytics from "./pages/hr/HRAnalytics";
import HRNewsManagement from "./pages/hr/HRNewsManagement";
import HRJobOpenings from "./pages/hr/HRJobOpenings";
import HRSurveys from "./pages/hr/HRSurveys";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminDepartments from "./pages/admin/AdminDepartments";
import AdminSettings from "./pages/admin/AdminSettings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/careers" element={<Careers />} />
            <Route path="/careers/:id" element={<JobDetail />} />
            <Route path="/careers/:id/apply" element={<QuickApply />} />
            <Route path="/news" element={<News />} />
            <Route path="/news/:id" element={<NewsDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/candidate-login" element={<CandidateLogin />} />
            <Route path="/candidate-register" element={<CandidateRegister />} />
            
            {/* Candidate Portal (separate layout) */}
            <Route path="/candidate" element={<CandidateLayout />}>
              <Route index element={<CandidateDashboard />} />
              <Route path="applications" element={<CandidateApplications />} />
              <Route path="profile" element={<CandidateProfile />} />
            </Route>

            {/* Dashboard redirect */}
            <Route path="/dashboard" element={<Dashboard />} />
            
            {/* Unified Internal Portal */}
            <Route element={<InternalLayout />}>
              {/* HR */}
              <Route path="/hr" element={<HRDashboard />} />
              <Route path="/hr/requisitions" element={<HRRequisitions />} />
              <Route path="/hr/job-openings" element={<HRJobOpenings />} />
              <Route path="/hr/candidates" element={<HRCandidates />} />
              <Route path="/hr/pipeline" element={<HRPipeline />} />
              <Route path="/hr/interviews" element={<HRInterviews />} />
              <Route path="/hr/analytics" element={<HRAnalytics />} />
              <Route path="/hr/news" element={<HRNewsManagement />} />
              <Route path="/hr/surveys" element={<HRSurveys />} />

              {/* Hiring Manager */}
              <Route path="/hiring-manager" element={<HiringManagerDashboard />} />
              <Route path="/hiring-manager/mpp" element={<HiringManagerMPP />} />
              <Route path="/hiring-manager/recruitment" element={<HiringManagerRecruitment />} />
              <Route path="/hiring-manager/inbox" element={<HiringManagerInbox />} />

              {/* Admin */}
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/departments" element={<AdminDepartments />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
            </Route>
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
