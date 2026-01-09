import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ScrollToTop } from "./components/ScrollToTop";
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
import HiringManagerLayout from "./components/hiring-manager/HiringManagerLayout";
import HiringManagerDashboard from "./pages/hiring-manager/HiringManagerDashboard";
import HiringManagerMPP from "./pages/hiring-manager/HiringManagerMPP";
import HiringManagerRecruitment from "./pages/hiring-manager/HiringManagerRecruitment";
import HiringManagerInbox from "./pages/hiring-manager/HiringManagerInbox";
import HRLayout from "./components/hr/HRLayout";
import HRDashboard from "./pages/hr/HRDashboard";
import HRRequisitions from "./pages/hr/HRRequisitions";
import HRCandidates from "./pages/hr/HRCandidates";
import HRPipeline from "./pages/hr/HRPipeline";
import HRInterviews from "./pages/hr/HRInterviews";
import HRAnalytics from "./pages/hr/HRAnalytics";
import HRNewsManagement from "./pages/hr/HRNewsManagement";

import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminSettings from "./pages/admin/AdminSettings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
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
          
          {/* Candidate Portal */}
          <Route path="/candidate" element={<CandidateLayout />}>
            <Route index element={<CandidateDashboard />} />
            <Route path="applications" element={<CandidateApplications />} />
            <Route path="profile" element={<CandidateProfile />} />
          </Route>
          
          {/* Hiring Manager Portal */}
          <Route path="/hiring-manager" element={<HiringManagerLayout />}>
            <Route index element={<HiringManagerDashboard />} />
            <Route path="mpp" element={<HiringManagerMPP />} />
            <Route path="recruitment" element={<HiringManagerRecruitment />} />
            <Route path="inbox" element={<HiringManagerInbox />} />
          </Route>
          
          {/* HR Portal */}
          <Route path="/hr" element={<HRLayout />}>
            <Route index element={<HRDashboard />} />
            <Route path="requisitions" element={<HRRequisitions />} />
            <Route path="candidates" element={<HRCandidates />} />
            <Route path="pipeline" element={<HRPipeline />} />
            <Route path="interviews" element={<HRInterviews />} />
            <Route path="analytics" element={<HRAnalytics />} />
            <Route path="news" element={<HRNewsManagement />} />
            
          </Route>
          
          {/* Admin Portal */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
