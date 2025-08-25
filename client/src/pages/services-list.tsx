import { useEffect, useState, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ChevronLeft, Calendar, User, Building, DollarSign, Eye, Check, Edit, CheckCircle, Trash2, Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import type { Service, Requester, Provider } from "@shared/schema";
import { getQueryFn, queryClient } from "@/lib/queryClient";
import { useDropzone } from "react-dropzone";

// Assume isUserAdmin is imported or defined elsewhere in your project
// Example: import { isUserAdmin } from "@/lib/auth";
// For the purpose of this example, we'll define a placeholder:
const isUserAdmin = () => {
  return localStorage.getItem('isAdmin') === 'true' || localStorage.getItem('userType') === 'admin';
};

// Status colors and labels for the Badge component - defined globally
const statusColors: { [key: string]: string } = {
  PENDENTE: "bg-yellow-100 text-yellow-800",
  RESOLVIDO: "bg-green-100 text-green-800",
  PROGRAMADO: "bg-blue-100 text-blue-800",
  CANCELADO: "bg-red-100 text-red-800",
};

const statusLabels: { [key: string]: string } = {
  PENDENTE: "Pendente",
  RESOLVIDO: "Resolvido",
  PROGRAMADO: "Programado",
  CANCELADO: "Cancelado",
};

interface GroupedServices {
  [key: string]: Service[];
}

export default function ServicesListPage() {
  const [location, setLocation] = useLocation();
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  // Get status filter, monthly filter, and courtesy filter from URL params
  const searchParams = new URLSearchParams(location.split('?')[1] || '');
  const statusFilter = searchParams.get('status');
  const monthlyFilter = searchParams.get('monthly') === 'true';
  const courtesyFilter = searchParams.get('courtesy') === 'true';
  const serviceIdFromUrl = searchParams.get('service') || null;

  const { data: servicesResponse } = useQuery<{
    services: Service[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>({
    queryKey: ["/api/services", { limit: 1000 }], // Get all services
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const services = servicesResponse?.services || [];

  // If a specific service is requested, open it directly
  useEffect(() => {
    if (serviceIdFromUrl && services.length > 0) {
      const service = services.find(s => s.id === serviceIdFromUrl);
      if (service) {
        setSelectedService(service);
      }
    }
  }, [serviceIdFromUrl, services]);

  // Filter services based on status, monthly package, or courtesy
  const filteredServices = useMemo(() => {
    let filtered = services;

    if (statusFilter) {
      filtered = filtered.filter(service => service.status === statusFilter);
    }

    if (monthlyFilter) {
      filtered = filtered.filter(service => service.isMonthlyPackage);
    }

    if (courtesyFilter) {
      filtered = filtered.filter(service => service.isCourtesy);
    }

    return filtered;
  }, [services, statusFilter, monthlyFilter, courtesyFilter]);

  // Group services by status first, then by month/year for resolved services
  const groupedServices: GroupedServices = {};

  if (statusFilter) {
    // If filtering by specific status, group by month/year
    if (statusFilter === 'RESOLVIDO') {
      filteredServices
        .reduce((groups, service) => {
          // Use completion date if available, otherwise use request date
          const dateToUse = service.completionDate || service.requestDate || service.createdAt;
          const date = new Date(dateToUse);
          const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

          if (!groups[monthYear]) {
            groups[monthYear] = [];
          }
          groups[monthYear].push(service);
          return groups;
        }, groupedServices);
    } else {
      // For PENDENTE and PROGRAMADO, group by status
      groupedServices[statusFilter] = filteredServices;
    }
  } else if (monthlyFilter || courtesyFilter) {
    // If filtering by monthly or courtesy, use filtered services
    const pendingServices = filteredServices.filter(service => service.status === 'PENDENTE');
    const scheduledServices = filteredServices.filter(service => service.status === 'PROGRAMADO');
    const resolvedServices = filteredServices.filter(service => service.status === 'RESOLVIDO');

    if (pendingServices.length > 0) {
      groupedServices['PENDENTE'] = pendingServices;
    }
    if (scheduledServices.length > 0) {
      groupedServices['PROGRAMADO'] = scheduledServices;
    }

    // Group resolved services by month/year
    resolvedServices.reduce((groups, service) => {
      // Use completion date if available, otherwise use request date
      const dateToUse = service.completionDate || service.requestDate || service.createdAt;
      const date = new Date(dateToUse);
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!groups[monthYear]) {
        groups[monthYear] = [];
      }
      groups[monthYear].push(service);
      return groups;
    }, groupedServices);
  } else {
    // Show all services grouped by status
    const pendingServices = services.filter(service => service.status === 'PENDENTE');
    const scheduledServices = services.filter(service => service.status === 'PROGRAMADO');
    const resolvedServices = services.filter(service => service.status === 'RESOLVIDO');

    if (pendingServices.length > 0) {
      groupedServices['PENDENTE'] = pendingServices;
    }
    if (scheduledServices.length > 0) {
      groupedServices['PROGRAMADO'] = scheduledServices;
    }

    // Group resolved services by month/year
    resolvedServices.reduce((groups, service) => {
      // Use completion date if available, otherwise use request date
      const dateToUse = service.completionDate || service.requestDate || service.createdAt;
      const date = new Date(dateToUse);
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!groups[monthYear]) {
        groups[monthYear] = [];
      }
      groups[monthYear].push(service);
      return groups;
    }, groupedServices);
  }

  // Sort groups - status groups first, then months in descending order
  const sortedGroups = Object.keys(groupedServices).sort((a, b) => {
    // Priority order: PENDENTE, PROGRAMADO, then months (newest first)
    const statusOrder = { 'PENDENTE': 1, 'PROGRAMADO': 2 };
    const aOrder = statusOrder[a as keyof typeof statusOrder] || 999;
    const bOrder = statusOrder[b as keyof typeof statusOrder] || 999;

    if (aOrder !== 999 && bOrder !== 999) {
      return aOrder - bOrder;
    }
    if (aOrder !== 999) return -1;
    if (bOrder !== 999) return 1;

    // Both are month/year, sort descending
    return b.localeCompare(a);
  });

  const formatGroupTitle = (groupKey: string) => {
    if (groupKey === 'PENDENTE') return 'Serviços Pendentes';
    if (groupKey === 'PROGRAMADO') return 'Serviços Programados';

    // It's a month/year
    const [year, month] = groupKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('pt-BR', {
      month: 'long',
      year: 'numeric'
    });
  };

  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return 'Não informado';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatValue = (value: string | null, isMonthlyPackage: boolean, isCourtesy: boolean = false, creditsUsed?: number | null) => {
    if (isCourtesy) {
      return (
        <span className="flex items-center gap-1">
          <span className="text-blue-600">🎁</span>
          Cortesia
        </span>
      );
    }
    if (isMonthlyPackage) {
      return (
        <span className="flex items-center gap-1">
          <Check className="h-4 w-4 text-green-600" />
          Créditos usados: {creditsUsed !== undefined && creditsUsed !== null ? creditsUsed : 0}
        </span>
      );
    }
    if (!value) return "Valor não informado";
    return (
      <span className="flex items-center gap-1">
        <DollarSign className="h-4 w-4" />
        R$ {parseFloat(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
      </span>
    );
  };

  if (selectedService) {
    return (
      <ServiceDetailView
        service={selectedService}
        onBack={() => setSelectedService(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#D9e0e8]">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/dashboard')}
              className="text-gray-600 hover:text-gray-900"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Voltar ao Dashboard
            </Button>
            <h1 className="text-2xl font-bold text-blue-900">
              {courtesyFilter ? 'Serviços Cortesia' :
               monthlyFilter ? 'Serviços do Pacote Mensal' : 
               statusFilter ? `Serviços ${statusLabels[statusFilter as keyof typeof statusLabels]}` : 
               'Lista de Serviços'}
            </h1>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {sortedGroups.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl text-gray-300 mb-4">📋</div>
            <p className="text-gray-500 text-lg">
              {courtesyFilter ? 'Nenhum serviço cortesia encontrado' :
               monthlyFilter ? 'Nenhum serviço incluído no pacote mensal encontrado' : 
               statusFilter ? `Nenhum serviço ${statusLabels[statusFilter as keyof typeof statusLabels]?.toLowerCase()} encontrado`
                : 'Nenhum serviço encontrado'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {sortedGroups.map(groupKey => (
              <div key={groupKey} className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900 capitalize">
                  {formatGroupTitle(groupKey)}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {groupedServices[groupKey]
                    .sort((a, b) => {
                      // For status groups, sort by request date (newest first)
                      if (groupKey === 'PENDENTE' || groupKey === 'PROGRAMADO') {
                        return new Date(b.requestDate || b.createdAt).getTime() - new Date(a.requestDate || a.createdAt).getTime();
                      }
                      // For resolved services, sort by completion date
                      return new Date(b.completionDate!).getTime() - new Date(a.completionDate!).getTime();
                    })
                    .map(service => (
                      <ServiceListCard
                        key={service.id}
                        service={service}
                        onClick={() => setSelectedService(service)}
                        formatDate={formatDate}
                        formatValue={(value, isMonthlyPackage, isCourtesy, creditsUsed) => formatValue(value, isMonthlyPackage, isCourtesy, creditsUsed)}
                      />
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

interface ServiceListCardProps {
  service: Service & {
    requester?: { name: string; email: string };
    provider?: { name: string; email: string };
    requesterName?: string;
    providerName?: string;
  };
  onClick: () => void;
  formatDate: (date: string | Date | null | undefined) => string;
  formatValue: (value: string | null, isMonthlyPackage: boolean, isCourtesy?: boolean, creditsUsed?: number | null) => React.ReactNode;
}

function ServiceListCard({ service, onClick, formatDate, formatValue }: ServiceListCardProps) {
  const getMainImage = () => {
    if (service.images && service.images.length > 0) {
      return service.images[0];
    }
    return null;
  };


  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer relative" onClick={onClick}>
      <CardContent className="p-3">
        <div className="flex flex-col h-full">
          {/* Image */}
          {getMainImage() ? (
            <div className="relative mb-3 rounded-lg overflow-hidden">
              <img
                src={getMainImage()!}
                alt={service.title}
                className="w-full h-28 object-cover"
              />
              {service.images && service.images.length > 1 && (
                <Badge className="absolute top-2 right-2 bg-black/70 text-white text-xs">
                  +{service.images.length - 1}
                </Badge>
              )}
            </div>
          ) : (
            <div className="w-full h-28 bg-gray-100 rounded-lg flex items-center justify-center mb-3">
              <div className="text-gray-400 text-3xl">📷</div>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 space-y-2">
            <h3 className="font-semibold text-gray-900 line-clamp-2">
              {service.title}
            </h3>

            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>
                  {service.status === 'RESOLVIDO' 
                    ? formatDate(service.completionDate) 
                    : formatDate(service.requestDate)
                  }
                </span>
              </div>

              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="truncate">
                  {service.requesterName || service.requester?.name || 'Solicitante não informado'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                <span className="truncate">
                  {service.providerName || service.provider?.name || 'Fornecedor não informado'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-blue-600 font-medium">
                  {formatValue(service.value, service.isMonthlyPackage || false, service.isCourtesy || false, service.creditsUsed || 0)}
                </span>
              </div>
            </div>

            {service.serviceType && service.serviceType.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {[...new Set(service.serviceType)].map((type, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {type}
                  </Badge>
                ))}
              </div>
            )}





            {/* View details icon removed as requested */}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface ServiceDetailViewProps {
  service: Service & {
    requester?: { name: string; email: string };
    provider?: { name: string; email: string };
    requesterName?: string;
    providerName?: string;
  };
  onBack: () => void;
}

function ServiceDetailView({ service, onBack }: ServiceDetailViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedService, setEditedService] = useState(service);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);

  // Fetch requesters and providers for dropdown selections
  const { data: requestersData } = useQuery<{requesters: Requester[]}>({
    queryKey: ["/api/requesters"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const { data: providersData } = useQuery<{providers: Provider[]}>({
    queryKey: ["/api/providers"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const requesters = requestersData?.requesters || [];
  const providers = providersData?.providers || [];

  // Service types options
  const serviceTypeOptions = [
    "Manutenção", "Correção", "Instalação", "Limpeza", 
    "Montagem", "Desmontagem", "Pintura", "Elétrica", 
    "Hidráulica", "Jardinagem", "Orçamento"
  ];

  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const { toast } = useToast();

  // Check if user is admin
  const isAdmin = isUserAdmin();

  const formatDateTime = (date: string | Date | null | undefined) => {
    if (!date) return 'Não informado';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatValue = (value: string | null, isMonthlyPackage: boolean, isCourtesy: boolean = false, creditsUsed: number = 0) => {
    if (isCourtesy) {
      return (
        <span className="flex items-center gap-1">
          <span className="text-blue-600">🎁</span>
          Cortesia
        </span>
      );
    }
    if (isMonthlyPackage) {
      return (
        <span className="flex items-center gap-1">
          <Check className="h-4 w-4 text-green-600" />
          Créditos usados: {creditsUsed !== undefined && creditsUsed !== null ? creditsUsed : 0}
        </span>
      );
    }
    if (!value) return "Valor não informado";
    return (
      <span className="flex items-center gap-1">
        <DollarSign className="h-4 w-4" />
        R$ {parseFloat(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
      </span>
    );
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setNewImages(prev => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    multiple: true,
  });

  const removeNewImage = (index: number) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
  };

  const markImageForDeletion = (imagePath: string) => {
    setImagesToDelete(prev => [...prev, imagePath]);
  };

  const unmarkImageForDeletion = (imagePath: string) => {
    setImagesToDelete(prev => prev.filter(path => path !== imagePath));
  };

  const handleDeleteService = async () => {
    if (!window.confirm('Tem certeza que deseja excluir este serviço? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      const response = await fetch(`/api/services/${service.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': 'AdminAppBrandness:Adminappbrandness'
        },
      });

      if (response.ok) {
        toast({
          title: "Serviço excluído",
          description: "O serviço foi excluído com sucesso.",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/services"] });
        onBack();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao excluir');
      }
    } catch (error) {
      console.error('Erro ao excluir serviço:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o serviço.",
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    try {
      const formData = new FormData();

      // Add basic service data
      formData.append('title', editedService.title);
      formData.append('description', editedService.description || '');
      formData.append('serviceType', JSON.stringify(editedService.serviceType));
      formData.append('status', editedService.status);
      formData.append('value', editedService.value || '');
      formData.append('requesterId', editedService.requesterId || '');
      formData.append('providerId', editedService.providerId || '');
      formData.append('requestDate', editedService.requestDate || '');
      formData.append('completionDate', editedService.completionDate || '');
      formData.append('isMonthlyPackage', editedService.isMonthlyPackage?.toString() || 'false');
      formData.append('isCourtesy', editedService.isCourtesy?.toString() || 'false');
      formData.append('creditsUsed', editedService.creditsUsed?.toString() || '0');

      // Add images to delete
      formData.append('imagesToDelete', JSON.stringify(imagesToDelete));

      // Add new images
      newImages.forEach((image) => {
        formData.append('images', image);
      });

      const response = await fetch(`/api/services/${service.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': 'AdminAppBrandness:Adminappbrandness'
        },
        body: formData,
      });

      if (response.ok) {
        const updatedService = await response.json();
        toast({
          title: "Serviço atualizado",
          description: "As alterações foram salvas com sucesso.",
        });
        setIsEditing(false);
        setNewImages([]);
        setImagesToDelete([]);
        queryClient.invalidateQueries({ queryKey: ["/api/services"] });
        // Atualizar o serviço local com os dados retornados
        Object.assign(service, updatedService.service);
        setEditedService(service);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao salvar');
      }
    } catch (error) {
      console.error('Erro ao salvar serviço:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as alterações.",
        variant: "destructive",
      });
    }
  };

  // Admin delete functionality would go here if it were part of this change.

  return (
    <div className="min-h-screen bg-[#D9e0e8]">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="text-gray-600 hover:text-gray-900"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Voltar à lista
              </Button>
              <h1 className="text-2xl font-bold text-blue-900">Detalhes do Serviço</h1>
            </div>
            {isAdmin && (
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsEditing(false);
                        setEditedService(service);
                        setNewImages([]);
                        setImagesToDelete([]);
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSave}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Salvar
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={handleDeleteService}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6">
            {/* Title */}
            {isEditing ? (
              <input
                type="text"
                value={editedService.title}
                onChange={(e) => setEditedService({ ...editedService, title: e.target.value })}
                className="text-2xl font-bold text-gray-900 mb-6 w-full border-b border-gray-300 focus:border-blue-500 outline-none"
              />
            ) : (
              <h2 className="text-2xl font-bold text-gray-900 mb-6">{service.title}</h2>
            )}

            {/* Images Grid */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900">Imagens</h3>
                {isAdmin && isEditing && (
                  <div className="text-sm text-gray-600">
                    Clique no X para remover imagens existentes
                  </div>
                )}
              </div>

              {/* Existing Images */}
              {service.images && service.images.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  {service.images
                    .filter(image => !imagesToDelete.includes(image))
                    .map((image, index) => (
                    <div key={index} className="relative aspect-video rounded-lg overflow-hidden">
                      <img
                        src={image}
                        alt={`${service.title} - Imagem ${index + 1}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                        onClick={() => setSelectedImageIndex(index)}
                      />
                      {isAdmin && isEditing && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markImageForDeletion(image);
                          }}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Images marked for deletion */}
              {isAdmin && isEditing && imagesToDelete.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-red-600 mb-2">
                    Imagens que serão removidas:
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {imagesToDelete.map((image, index) => (
                      <div key={index} className="relative aspect-video rounded-lg overflow-hidden opacity-50">
                        <img
                          src={image}
                          alt={`Será removida - ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-red-500 bg-opacity-50 flex items-center justify-center">
                          <span className="text-white font-semibold">SERÁ REMOVIDA</span>
                        </div>
                        <button
                          onClick={() => unmarkImageForDeletion(image)}
                          className="absolute top-2 right-2 bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-green-600"
                        >
                          ↺
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New images upload */}
              {isAdmin && isEditing && (
                <div className="space-y-4">
                  <div 
                    {...getRootProps()} 
                    className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                      isDragActive 
                        ? 'border-blue-400 bg-blue-50' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <input {...getInputProps()} />
                    <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">
                      {isDragActive 
                        ? 'Solte as imagens aqui...' 
                        : 'Clique ou arraste imagens para adicionar'
                      }
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PNG, JPG, GIF até 10MB cada
                    </p>
                  </div>

                  {/* New images preview */}
                  {newImages.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-green-600 mb-2">
                        Novas imagens que serão adicionadas:
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {newImages.map((image, index) => (
                          <div key={index} className="relative aspect-video rounded-lg overflow-hidden">
                            <img
                              src={URL.createObjectURL(image)}
                              alt={`Nova imagem ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <button
                              onClick={() => removeNewImage(index)}
                              className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Show message if no images */}
              {(!service.images || service.images.length === 0) && newImages.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">📷</div>
                  <p>Nenhuma imagem disponível</p>
                </div>
              )}
            </div>

            {/* Image Modal */}
            {selectedImageIndex !== null && service.images && (
              <div 
                className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
                onClick={() => setSelectedImageIndex(null)}
              >
                <div className="relative max-w-4xl max-h-full">
                  <img
                    src={service.images[selectedImageIndex]}
                    alt={`${service.title} - Imagem ${selectedImageIndex + 1}`}
                    className="max-w-full max-h-full object-contain"
                  />
                  <button
                    onClick={() => setSelectedImageIndex(null)}
                    className="absolute top-4 right-4 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-full w-8 h-8 flex items-center justify-center"
                  >
                    ✕
                  </button>
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                    {service.images.map((_, index) => (
                      <button
                        key={index}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedImageIndex(index);
                        }}
                        className={`w-3 h-3 rounded-full ${
                          index === selectedImageIndex ? 'bg-white' : 'bg-white bg-opacity-50'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Service Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Informações do Serviço</h3>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Descrição</label>
                    {isEditing ? (
                      <textarea
                        value={editedService.description || ''}
                        onChange={(e) => setEditedService({ ...editedService, description: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-md focus:border-blue-500 outline-none"
                        rows={3}
                      />
                    ) : (
                      <p className="text-gray-900">{service.description || 'Não informado'}</p>
                    )}
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700">Tipos de Serviço</label>
                      {isEditing ? (
                        <div className="mt-1 grid grid-cols-2 gap-2">
                          {serviceTypeOptions.map((type) => (
                            <div key={type} className="flex items-center space-x-2">
                              <Checkbox
                                id={type}
                                checked={(editedService.serviceType || []).includes(type)}
                                onCheckedChange={(checked) => {
                                  const currentTypes = editedService.serviceType || [];
                                  if (checked) {
                                    setEditedService({
                                      ...editedService,
                                      serviceType: [...currentTypes, type]
                                    });
                                  } else {
                                    setEditedService({
                                      ...editedService,
                                      serviceType: currentTypes.filter(t => t !== type)
                                    });
                                  }
                                }}
                              />
                              <label htmlFor={type} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                {type}
                              </label>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2 mt-1">
                          {service.serviceType && service.serviceType.length > 0 ? (
                            [...new Set(service.serviceType)].map((type, index) => (
                              <Badge key={index} variant="secondary">
                                {type}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-gray-500">Não informado</span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      {isEditing ? (
                        <select
                          value={editedService.status}
                          onChange={(e) => setEditedService({ ...editedService, status: e.target.value })}
                          className="w-full p-2 border border-gray-300 rounded-md focus:border-blue-500 outline-none"
                        >
                          <option value="PENDENTE">Pendente</option>
                          <option value="RESOLVIDO">Resolvido</option>
                          <option value="PROGRAMADO">Programado</option>
                          <option value="CANCELADO">Cancelado</option>
                        </select>
                      ) : (
                        <Badge className={statusColors[service.status as keyof typeof statusColors]}>
                          {statusLabels[service.status as keyof typeof statusLabels]}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Package Type and Courtesy Checkboxes */}
                  {isEditing && (
                    <div className="flex gap-4 mb-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="isMonthlyPackage"
                          checked={editedService.isMonthlyPackage || false}
                          onCheckedChange={(checked) => 
                            setEditedService({ ...editedService, isMonthlyPackage: !!checked })
                          }
                        />
                        <label htmlFor="isMonthlyPackage" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Pacote Mensal
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="isCourtesy"
                          checked={editedService.isCourtesy || false}
                          onCheckedChange={(checked) => 
                            setEditedService({ ...editedService, isCourtesy: !!checked })
                          }
                        />
                        <label htmlFor="isCourtesy" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Cortesia
                        </label>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700">Valor</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedService.value || ''}
                          onChange={(e) => setEditedService({ ...editedService, value: e.target.value })}
                          className="w-full p-2 border border-gray-300 rounded-md focus:border-blue-500 outline-none"
                          disabled={editedService.isMonthlyPackage || (editedService.isCourtesy ?? false)}
                        />
                      ) : (
                        <p className="text-blue-600 font-semibold">
                          {formatValue(service.value, service.isMonthlyPackage || false, service.isCourtesy || false, service.creditsUsed || 0)}
                        </p>
                      )}
                    </div>
                    {service.isMonthlyPackage && (
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700">Créditos Utilizados</label>
                        {isEditing ? (
                          <input
                            type="number"
                            min="1"
                            max="4"
                            value={editedService.creditsUsed || 0}
                            onChange={(e) => {
                              const value = parseInt(e.target.value);
                              if (value >= 1 && value <= 4) {
                                setEditedService({ ...editedService, creditsUsed: value });
                              }
                            }}
                            className="w-full p-2 border border-gray-300 rounded-md focus:border-blue-500 outline-none"
                          />
                        ) : (
                          <p className="text-gray-900">{service.creditsUsed || 0}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Datas e Responsáveis</h3>

                <div className="space-y-3">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700">Data de Solicitação</label>
                      {isEditing ? (
                        <input
                          type="date"
                          value={editedService.requestDate ? new Date(editedService.requestDate).toISOString().split('T')[0] : ''}
                          onChange={(e) => setEditedService({ ...editedService, requestDate: e.target.value })}
                          className="w-full p-2 border border-gray-300 rounded-md focus:border-blue-500 outline-none"
                        />
                      ) : (
                        <p className="text-gray-900">
                          {formatDateTime(service.requestDate)}
                        </p>
                      )}
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700">Data de Conclusão</label>
                      {isEditing ? (
                        <input
                          type="date"
                          value={editedService.completionDate ? new Date(editedService.completionDate).toISOString().split('T')[0] : ''}
                          onChange={(e) => setEditedService({ ...editedService, completionDate: e.target.value })}
                          className="w-full p-2 border border-gray-300 rounded-md focus:border-blue-500 outline-none"
                        />
                      ) : (
                        <p className="text-gray-900">
                          {formatDateTime(service.completionDate)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700">Solicitante</label>
                      {isEditing ? (
                        <select
                          value={editedService.requesterId || ''}
                          onChange={(e) => setEditedService({ ...editedService, requesterId: e.target.value })}
                          className="w-full p-2 border border-gray-300 rounded-md focus:border-blue-500 outline-none"
                        >
                          <option value="">Selecione um solicitante</option>
                          {requesters.map((requester) => (
                            <option key={requester.id} value={requester.id}>
                              {requester.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div>
                          <p className="text-gray-900">
                            {service.requester?.name || 'Não informado'}
                          </p>
                          {service.requester?.email && (
                            <p className="text-sm text-gray-500">{service.requester.email}</p>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700">Fornecedor</label>
                      {isEditing ? (
                        <select
                          value={editedService.providerId || ''}
                          onChange={(e) => setEditedService({ ...editedService, providerId: e.target.value })}
                          className="w-full p-2 border border-gray-300 rounded-md focus:border-blue-500 outline-none"
                        >
                          <option value="">Selecione um fornecedor</option>
                          {providers.map((provider) => (
                            <option key={provider.id} value={provider.id}>
                              {provider.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div>
                          <p className="text-gray-900">
                            {service.provider?.name || 'Não informado'}
                          </p>
                          {service.provider?.email && (
                            <p className="text-sm text-gray-500">{service.provider.email}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}