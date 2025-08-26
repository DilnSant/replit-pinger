import { useEffect, useState, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import StatsCards from "@/components/StatsCards";
import ServiceCard from "@/components/ServiceCard";
import NewServiceModal from "@/components/NewServiceModal";
import ServicesCarousel from "@/components/ServicesCarousel";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, ArrowRight, User, Building2, FileText, Building, UserPlus, LogOut, Settings, Clock, CheckCircle, Calendar, ChevronRight } from "lucide-react";
import type { Service } from "@shared/schema";
import { apiRequest, queryClient, getQueryFn } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";


export default function Dashboard() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isNewServiceModalOpen, setIsNewServiceModalOpen] = useState(false);
  const [isAdmin] = useState(() => localStorage.getItem('isAdmin') === 'true');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [hasShownAdminToast, setHasShownAdminToast] = useState(() => 
    sessionStorage.getItem('adminToastShown') === 'true'
  );

  // Check admin status on component mount - only show toast once per session
  useEffect(() => {
    const adminStatus = localStorage.getItem('isAdmin') === 'true';
    const toastShown = sessionStorage.getItem('adminToastShown') === 'true';

    if (adminStatus && !toastShown) {
      toast({
        title: "Modo Administrador Ativo",
        description: "Você tem privilégios de administrador",
      });
      sessionStorage.setItem('adminToastShown', 'true');
      setHasShownAdminToast(true);
    }
  }, [toast]);

  // Memoize query keys to prevent unnecessary re-renders
  const servicesQueryKey = useMemo(() => [
    "/api/services", 
    selectedMonth, 
    selectedYear
  ], [selectedMonth, selectedYear]);

  const statsQueryKey = useMemo(() => [
    "/api/stats", 
    selectedMonth, 
    selectedYear
  ], [selectedMonth, selectedYear]);

  const { data: servicesResponse, refetch: refetchServices } = useQuery<{
    services: Service[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>({
    queryKey: servicesQueryKey,
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  // Query for all services (to get total count)
  const { data: allServicesResponse } = useQuery<{
    services: Service[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>({
    queryKey: ["/api/services", "all"],
    queryFn: async () => {
      const response = await fetch('/api/services?limit=10000');
      if (!response.ok) throw new Error('Failed to fetch all services');
      return response.json();
    },
  });

  // Query for all resolved services (not filtered by month)
  const { data: allResolvedServicesResponse } = useQuery<{
    services: Service[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>({
    queryKey: ["/api/services", "all-resolved"],
    queryFn: async () => {
      const response = await fetch('/api/services?status=RESOLVIDO&limit=1000');
      if (!response.ok) throw new Error('Failed to fetch all resolved services');
      return response.json();
    },
  });

  const services = servicesResponse?.services || [];
  const allServices = allServicesResponse?.services || [];
  const allResolvedServices = allResolvedServicesResponse?.services || [];

  // Get total counts for all time - using allServices directly in the components

  const { data: stats, refetch: refetchStats } = useQuery<{
    totalServices: number;
    pendingServices: number;
    resolvedServices: number;
    scheduledServices: number;
    monthlyPlanServices: number;
    year: number;
    month: number;
  }>({
    queryKey: statsQueryKey,
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  // Memoize filtered services to prevent unnecessary recalculations
  const filteredServices = useMemo(() => {
    return services.filter((service: any) => {
      // Access the correct field name from API response
      const dateField = service.request_date || service.requestDate;
      if (!dateField) return false;

      const serviceDate = new Date(dateField);
      const serviceYear = serviceDate.getFullYear();
      const serviceMonth = serviceDate.getMonth() + 1;

      // Filter by selected month and year
      return serviceYear === selectedYear && serviceMonth === selectedMonth;
    });
  }, [services, selectedMonth, selectedYear]);

  const servicesByStatus = useMemo(() => {
    const pending = filteredServices.filter((service) => service.status === "PENDENTE");
    const resolved = filteredServices.filter((service) => service.status === "RESOLVIDO");
    const scheduled = filteredServices.filter((service) => service.status === "PROGRAMADO");

    return { pending, resolved, scheduled };
  }, [filteredServices]);

  const { pending: pendingServices, resolved: resolvedServices, scheduled: scheduledServices } = servicesByStatus;

  const handleServiceCreated = useCallback(() => {
    // Invalidate all related queries
    queryClient.invalidateQueries({ queryKey: ["/api/services"] });
    queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    queryClient.invalidateQueries({ queryKey: ["/api/services/all"] });
    queryClient.invalidateQueries({ queryKey: ["/api/services", "all-resolved"] });
    refetchServices();
    refetchStats();
    setIsNewServiceModalOpen(false);
  }, [refetchServices, refetchStats, queryClient]);

  const handleMonthChange = useCallback((month: number, year: number) => {
    // Only update if values actually changed
    if (month !== selectedMonth || year !== selectedYear) {
      setSelectedMonth(month);
      setSelectedYear(year);
      // Queries will automatically refetch due to key change
    }
  }, [selectedMonth, selectedYear]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('token'); // Assuming you also want to remove the token
    // Optionally clear session storage too if needed
    sessionStorage.removeItem('adminToastShown');
    // Redirect or reload the page to reflect the logout
    setLocation('/'); // Redirect to the home page or login page
    // Or window.location.reload();
  }, [setLocation]);


  return (
    <div className="min-h-screen bg-[#D9e0e8]">
      <Header 
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        onMonthChange={handleMonthChange}
      />

      <main className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
            <Button 
              onClick={() => setIsNewServiceModalOpen(true)} 
              className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
              size="sm"
            >
              Novo Serviço
            </Button>
          </div>

          {/* Stats Cards */}
          <StatsCards 
            totalServices={filteredServices.length}
            pendingServices={pendingServices.length}
            resolvedServices={resolvedServices.length}
            scheduledServices={scheduledServices.length}
            monthlyCreditsUsed={filteredServices.filter(s => s.isMonthlyPackage).reduce((total, service) => total + (service.creditsUsed || 0), 0)}
            courtesyServices={filteredServices.filter(s => s.isCourtesy).length}
            monthlyServices={filteredServices.filter(s => s.isMonthlyPackage).length}
            month={selectedMonth}
            year={selectedYear}
            onMonthChange={handleMonthChange}
          />

          {/* Services Carousel */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <ServicesCarousel 
              services={allResolvedServices} 
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
            />
          </div>






          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <Tabs defaultValue="pending" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-gray-50 border-b">
                <TabsTrigger value="pending" className="data-[state=active]:bg-white data-[state=active]:text-blue-600">
                  Pendentes ({pendingServices.length})
                </TabsTrigger>
                <TabsTrigger value="resolved" className="data-[state=active]:bg-white data-[state=active]:text-blue-600">
                  Resolvidos ({allResolvedServices.length})
                </TabsTrigger>
                <TabsTrigger value="scheduled" className="data-[state=active]:bg-white data-[state=active]:text-blue-600">
                  Agendados ({scheduledServices.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pending" className="p-6">
                {pendingServices.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {pendingServices.map((service) => (
                      <ServiceCard 
                        key={service.id} 
                        service={service} 
                        onUpdate={handleServiceCreated}
                        isAdmin={isAdmin} 
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-6xl text-gray-300 mb-4">⏳</div>
                    <p className="text-gray-500 text-lg">Nenhum serviço pendente</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="resolved" className="p-6">
                {allResolvedServices.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {allResolvedServices
                      .sort((a, b) => new Date(b.completionDate || b.requestDate).getTime() - new Date(a.completionDate || a.requestDate).getTime())
                      .map((service) => (
                      <ServiceCard 
                        key={service.id} 
                        service={service} 
                        onUpdate={handleServiceCreated}
                        isAdmin={isAdmin} 
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-6xl text-gray-300 mb-4">✅</div>
                    <p className="text-gray-500 text-lg">Nenhum serviço resolvido</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="scheduled" className="p-6">
                {scheduledServices.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {scheduledServices.map((service) => (
                      <ServiceCard 
                        key={service.id} 
                        service={service} 
                        onUpdate={handleServiceCreated}
                        isAdmin={isAdmin} 
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-6xl text-gray-300 mb-4">📅</div>
                    <p className="text-gray-500 text-lg">Nenhum serviço agendado</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>

      <NewServiceModal
        isOpen={isNewServiceModalOpen}
        onClose={() => setIsNewServiceModalOpen(false)}
        onServiceCreated={handleServiceCreated}
      />

      <Footer />
    </div>
  );
}