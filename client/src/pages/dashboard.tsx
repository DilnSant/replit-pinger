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
import { Plus, Calendar, Users, Truck, DollarSign, FileText, User, MapPin, Phone, Clock, CheckCircle, ChevronLeft, ChevronRight, Check } from "lucide-react";
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

          {/* Quick Access Links */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Acesso Rápido</h3>
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <button 
                onClick={() => setLocation('/services-list?status=RESOLVIDO')}
                className="flex flex-col items-center gap-2 text-green-600 hover:text-green-800 font-medium transition-colors"
              >
                <div className="text-green-500">
                  <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                </div>
                <span>Resolvidos</span>
                <span className="text-xs text-gray-500">({allResolvedServices.length})</span>
              </button>

              <button 
                onClick={() => setLocation('/services-list?monthly=true')}
                className="flex flex-col items-center gap-2 text-blue-600 hover:text-blue-800 font-medium transition-colors"
              >
                <div className="text-blue-500">
                  <Check className="h-8 w-8" />
                </div>
                <span>Incluídos</span>
                <span className="text-xs text-gray-500">({allServices.filter(s => s.isMonthlyPackage || s.is_monthly_package).length})</span>
              </button>

              <button 
                onClick={() => setLocation('/services-list?courtesy=true')}
                className="flex flex-col items-center gap-2 text-pink-600 hover:text-pink-800 font-medium transition-colors"
              >
                <div className="text-pink-500">
                  <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </div>
                <span>Cortesia</span>
                <span className="text-xs text-gray-500">({allServices.filter(s => s.isCourtesy || s.is_courtesy).length})</span>
              </button>
            </div>
          </div>

          {/* Services Tabs */}
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