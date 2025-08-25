import { useEffect, useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ChevronLeft, Plus, Edit, Trash2, Save, X, Upload, CloudUpload, Mail } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import type { Service, Provider, Requester } from "@shared/schema";
import { getQueryFn } from "@/lib/queryClient";
import NewServiceModal from "@/components/NewServiceModal";

interface GroupedServices {
  [key: string]: Service[];
}

export default function AdminServicesPage() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAdmin] = useState(() => localStorage.getItem('isAdmin') === 'true');
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editedData, setEditedData] = useState<Partial<Service & { requestDate?: string; completionDate?: string }>>({});
  const [isNewServiceModalOpen, setIsNewServiceModalOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);

  // Redirect if not admin
  useEffect(() => {
    if (!isAdmin) {
      setLocation('/dashboard');
    }
  }, [isAdmin, setLocation]);

  const { data: services = [], isLoading } = useQuery<Service[]>({
    queryKey: ["/api/services/all"],
    queryFn: async () => {
      const response = await fetch('/api/services/all', {
        headers: {
          'Authorization': 'AdminAppBrandness:Adminappbrandness'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch services');
      const data = await response.json();
      // Transform data to include requester and provider details correctly
      return data.map((service: any) => ({
        ...service,
        requesterId: service.requesterId,
        providerId: service.providerId,
        requester: service.requesterName ? {
          id: service.requesterId,
          name: service.requesterName,
          email: service.requesterEmail
        } : null,
        provider: service.providerName ? {
          id: service.providerId,
          name: service.providerName,  
          email: service.providerEmail
        } : null
      }));
    },
    enabled: isAdmin,
  });

  const { data: providersData } = useQuery<{providers: Provider[]}>({
    queryKey: ["/api/providers"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: isAdmin,
  });

  const { data: requestersData } = useQuery<{requesters: Requester[]}>({
    queryKey: ["/api/requesters"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: isAdmin,
  });

  const providers = providersData?.providers || [];
  const requesters = requestersData?.requesters || [];

  const updateServiceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Service> }) => {
      const token = localStorage.getItem('supabase_token') || localStorage.getItem('adminToken');
      const response = await fetch(`/api/services/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : 'AdminAppBrandness:Adminappbrandness'
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Erro ao atualizar serviço');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setEditingService(null);
      setEditedData({});
      toast({
        title: "Sucesso",
        description: "Serviço atualizado com sucesso",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar serviço",
        variant: "destructive",
      });
      setEditingService(null);
      setEditedData({});
    },
  });

  const deleteServiceMutation = useMutation({
    mutationFn: async (serviceId: string) => {
      const token = localStorage.getItem('supabase_token') || localStorage.getItem('adminToken');
      const response = await fetch(`/api/services/${serviceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': token ? `Bearer ${token}` : 'AdminAppBrandness:Adminappbrandness'
        }
      });
      if (!response.ok) throw new Error('Erro ao deletar serviço');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services/all"] });
      toast({
        title: "Sucesso",
        description: "Serviço deletado com sucesso",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao deletar serviço",
        variant: "destructive",
      });
    },
  });

  const testEmailMutation = useMutation({
    mutationFn: () => getQueryFn({ url: "/api/test-email-notifications", method: "POST" }),
    onSuccess: (data: any) => {
      toast({
        title: "Teste de emails concluído!",
        description: `${data.emailsSent} de ${data.emailsTotal} emails enviados com sucesso.`
      });
    },
    onError: () => {
      toast({ title: "Erro ao testar emails", variant: "destructive" });
    },
  });

  // Calculate stats
  const totalServices = services.length;
  const pendingServices = services.filter(s => s.status === 'PENDENTE').length;
  const resolvedServices = services.filter(s => s.status === 'RESOLVIDO').length;
  const scheduledServices = services.filter(s => s.status === 'PROGRAMADO').length;

  // Group services by month/year
  const groupedServices: GroupedServices = services.reduce((groups, service) => {
    const date = new Date(service.requestDate);
    const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (!groups[monthYear]) {
      groups[monthYear] = [];
    }
    groups[monthYear].push(service);
    return groups;
  }, {} as GroupedServices);

  // Sort months in descending order (most recent first)
  const sortedMonths = Object.keys(groupedServices).sort((a, b) => b.localeCompare(a));

  const formatMonthYear = (monthYear: string) => {
    const [year, month] = monthYear.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('pt-BR', { year: 'numeric', month: 'long' });
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setEditedData({
      title: service.title,
      description: service.description,
      serviceType: service.serviceType,
      status: service.status,
      value: service.value,
      isMonthlyPackage: service.isMonthlyPackage,
      isCourtesy: service.isCourtesy,
      creditsUsed: service.creditsUsed,
      requesterId: service.requesterId,
      providerId: service.providerId,
      requestDate: service.requestDate ? (service.requestDate instanceof Date ? service.requestDate.toISOString().split('T')[0] : service.requestDate.toString().split('T')[0]) : '',
      completionDate: service.completionDate ? (service.completionDate instanceof Date ? service.completionDate.toISOString().split('T')[0] : service.completionDate.toString().split('T')[0]) : ''
    });
    setSelectedImages([]);
    setImagesToDelete([]);
  };

  const handleSave = async () => {
    if (!editingService) return;

    try {
      const formData = new FormData();

      // Add basic service data
      const dataToUpdate = {
        ...editedData,
        requestDate: editedData.requestDate || editingService.requestDate,
        completionDate: editedData.completionDate !== undefined ? editedData.completionDate : editingService.completionDate
      };

      // Add text fields to FormData
      Object.entries(dataToUpdate).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, value.toString());
          }
        }
      });

      // Add new images
      selectedImages.forEach((image) => {
        formData.append('images', image);
      });

      // Add images to delete
      if (imagesToDelete.length > 0) {
        formData.append('imagesToDelete', JSON.stringify(imagesToDelete));
      }

      const token = localStorage.getItem('supabase_token') || localStorage.getItem('adminToken');
      const response = await fetch(`/api/services/${editingService.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': token ? `Bearer ${token}` : 'AdminAppBrandness:Adminappbrandness'
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to update service');
      }

      toast({
        title: "Sucesso",
        description: "Serviço atualizado com sucesso!",
      });

      setEditingService(null);
      setEditedData({});
      setSelectedImages([]);
      setImagesToDelete([]);
      queryClient.invalidateQueries({ queryKey: ["/api/services/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });

    } catch (error: any) {
      console.error('Update service error:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar serviço",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    setEditingService(null);
    setEditedData({});
    setSelectedImages([]);
    setImagesToDelete([]);
  };

  const handleDelete = (serviceId: string) => {
    if (confirm('Tem certeza que deseja deletar este serviço?')) {
      deleteServiceMutation.mutate(serviceId);
    }
  };

  // Image management functions
  const onDrop = useCallback((acceptedFiles: File[]) => {
    setSelectedImages(prev => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    multiple: true,
  });

  const removeNewImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const markImageForDeletion = (imagePath: string) => {
    setImagesToDelete(prev => [...prev, imagePath]);
  };

  const unmarkImageForDeletion = (imagePath: string) => {
    setImagesToDelete(prev => prev.filter(path => path !== imagePath));
  };

  const statusLabels = {
    PENDENTE: "Pendente",
    RESOLVIDO: "Resolvido", 
    PROGRAMADO: "Programado",
  };

  const statusColors = {
    PENDENTE: "bg-yellow-100 text-yellow-800",
    RESOLVIDO: "bg-green-100 text-green-800",
    PROGRAMADO: "bg-blue-100 text-blue-800",
  };

  const serviceTypeOptions = [
    "Design Gráfico",
    "Desenvolvimento Web",
    "Marketing Digital",
    "Consultoria",
    "Fotografia",
    "Videomaking",
    "Redação",
    "Tradução",
    "Outros"
  ];

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-[#D9e0e8]">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-[12px] pl-[4px] pr-[4px] pt-[3px] pb-[3px] font-bold text-[#004182]">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => setLocation('/dashboard')}
                className="flex items-center space-x-2"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Voltar</span>
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">
                Administração de Serviços
              </h1>
            </div>
            {/* Buttons removed as per request */}
            {/* 
            <Button 
              onClick={() => testEmailMutation.mutate()}
              disabled={testEmailMutation.isPending}
              variant="outline"
              className="border-green-600 text-green-600 hover:bg-green-50"
            >
              <Mail className="w-4 w-4 mr-2" />
              {testEmailMutation.isPending ? "Testando..." : "Testar Emails"}
            </Button>
            <Button onClick={() => setIsNewServiceModalOpen(true)} className="justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 flex items-center space-x-2 pl-[15px] pr-[15px] mt-[0px] mb-[0px] ml-[0px] mr-[0px] font-bold text-[13px]">
              <Plus className="h-4 w-4" />
              <span className="ml-[0px] mr-[0px] text-[12px]">Novo</span>
            </Button>
            */}
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="text-center py-12">
            <p>Carregando serviços...</p>
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl text-gray-300 mb-4">📋</div>
            <p className="text-gray-500 text-lg">Nenhum serviço encontrado</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              {/* Total de Serviços */}
              <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white cursor-pointer hover:shadow-lg transition-all"
                    onClick={() => setLocation('/services-list')}>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm font-medium">Total de Serviços</p>
                      <p className="text-2xl sm:text-3xl font-bold">{totalServices}</p>
                    </div>
                    <div className="text-blue-200">
                      <svg className="h-6 w-6 sm:h-8 sm:w-8" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Pendentes */}
              <Card className="hover:shadow-md transition-shadow cursor-pointer hover:shadow-lg"
                    onClick={() => setLocation('/services-list?status=PENDENTE')}>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm font-medium">Pendentes</p>
                      <p className="text-2xl sm:text-3xl font-bold text-orange-500">({pendingServices})</p>
                    </div>
                    <div className="text-orange-500">
                      <svg className="h-6 w-6 sm:h-8 sm:w-8" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                      </svg>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Resolvidos */}
              <Card className="hover:shadow-md transition-shadow cursor-pointer hover:shadow-lg"
                    onClick={() => setLocation('/services-list?status=RESOLVIDO')}>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm font-medium">Resolvidos</p>
                      <p className="text-2xl sm:text-3xl font-bold text-green-600">({resolvedServices})</p>
                    </div>
                    <div className="text-green-500">
                      <svg className="h-6 w-6 sm:h-8 sm:w-8" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                      </svg>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Programados */}
              <Card className="hover:shadow-md transition-shadow cursor-pointer hover:shadow-lg"
                    onClick={() => setLocation('/services-list?status=PROGRAMADO')}>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm font-medium">Programados</p>
                      <p className="text-2xl sm:text-3xl font-bold text-blue-600">({scheduledServices})</p>
                    </div>
                    <div className="text-blue-500">
                      <svg className="h-6 w-6 sm:h-8 sm:w-8" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                      </svg>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {sortedMonths.map(monthYear => (
              <div key={monthYear} className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900 capitalize">
                  {formatMonthYear(monthYear)} ({groupedServices[monthYear].length} serviços)
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {groupedServices[monthYear]
                    .sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime())
                    .map((service) => (
                      <Card key={service.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                          {editingService?.id === service.id ? (
                            <Input
                              value={editedData.title || ''}
                              onChange={(e) => setEditedData({...editedData, title: e.target.value})}
                              className="text-lg font-semibold"
                            />
                          ) : (
                            <CardTitle className="text-lg">{service.title}</CardTitle>
                          )}

                          {editingService?.id === service.id ? (
                            <Select 
                              value={editedData.status || service.status} 
                              onValueChange={(value) => setEditedData({...editedData, status: value})}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="PENDENTE">Pendente</SelectItem>
                                <SelectItem value="PROGRAMADO">Programado</SelectItem>
                                <SelectItem value="RESOLVIDO">Resolvido</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge className={`${statusColors[service.status as keyof typeof statusColors]} w-fit`}>
                              {statusLabels[service.status as keyof typeof statusLabels]}
                            </Badge>
                          )}
                        </CardHeader>
                        <CardContent>
                          {/* Display and manage service images */}
                          {editingService?.id === service.id ? (
                            <div className="mb-4 space-y-4">
                              {/* Existing Images Management */}
                              {service.images && service.images.length > 0 && (
                                <div>
                                  <h4 className="text-sm font-medium mb-2">Imagens Atuais:</h4>
                                  <div className="grid grid-cols-2 gap-2">
                                    {service.images.map((imagePath, index) => {
                                      const isMarkedForDeletion = imagesToDelete.includes(imagePath);
                                      return (
                                        <div key={index} className="relative">
                                          <img 
                                            src={`/uploads/${imagePath.split('/').pop()}`}
                                            alt={`Service ${index + 1}`}
                                            className={`w-full h-20 object-cover rounded-md ${isMarkedForDeletion ? 'opacity-50 grayscale' : ''}`}
                                            onError={(e) => {
                                              e.currentTarget.style.display = 'none';
                                            }}
                                          />
                                          <button
                                            type="button"
                                            onClick={() => isMarkedForDeletion ? unmarkImageForDeletion(imagePath) : markImageForDeletion(imagePath)}
                                            className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                              isMarkedForDeletion 
                                                ? 'bg-green-500 text-white hover:bg-green-600' 
                                                : 'bg-red-500 text-white hover:bg-red-600'
                                            }`}
                                          >
                                            {isMarkedForDeletion ? '↶' : '✕'}
                                          </button>
                                        </div>
                                      );
                                    })}
                                  </div>
                                  {imagesToDelete.length > 0 && (
                                    <p className="text-xs text-red-500 mt-1">
                                      {imagesToDelete.length} imagem(ns) marcada(s) para exclusão
                                    </p>
                                  )}
                                </div>
                              )}

                              {/* New Images Upload */}
                              <div>
                                <h4 className="text-sm font-medium mb-2">Adicionar Novas Imagens:</h4>
                                <div
                                  {...getRootProps()}
                                  className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                                    isDragActive
                                      ? 'border-blue-600 bg-blue-50'
                                      : 'border-gray-300 hover:border-gray-400'
                                  }`}
                                >
                                  <input {...getInputProps()} />
                                  <CloudUpload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                                  <p className="text-sm text-gray-600 mb-1">Arraste imagens aqui</p>
                                  <p className="text-xs text-gray-500">ou clique para selecionar</p>
                                </div>

                                {/* Preview of new images */}
                                {selectedImages.length > 0 && (
                                  <div className="mt-2">
                                    <p className="text-xs text-gray-600 mb-1">Novas imagens a adicionar:</p>
                                    <div className="grid grid-cols-3 gap-2">
                                      {selectedImages.map((file, index) => (
                                        <div key={index} className="relative">
                                          <img
                                            src={URL.createObjectURL(file)}
                                            alt={`New ${index + 1}`}
                                            className="w-full h-16 object-cover rounded-md"
                                          />
                                          <button
                                            type="button"
                                            onClick={() => removeNewImage(index)}
                                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs hover:bg-red-600"
                                          >
                                            ✕
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            /* Read-only image display */
                            (service.images && service.images.length > 0 && (<div className="mb-4">
                              <div className="grid grid-cols-2 gap-2">
                                {service.images.slice(0, 4).map((imagePath, index) => (
                                  <div key={index} className="relative">
                                    <img 
                                      src={`/uploads/${imagePath.split('/').pop()}`}
                                      alt={`Service ${index + 1}`}
                                      className="w-full h-20 object-cover rounded-md"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                      }}
                                    />
                                  </div>
                                ))}
                              </div>
                              {service.images.length > 4 && (
                                <p className="text-xs text-gray-500 mt-1">
                                  +{service.images.length - 4} mais imagens
                                </p>
                              )}
                            </div>))
                          )}

                          {editingService?.id === service.id ? (
                            <div className="space-y-4">
                              <Textarea
                                placeholder="Descrição"
                                value={editedData.description || ''}
                                onChange={(e) => setEditedData({...editedData, description: e.target.value})}
                              />

                              <Select 
                                value={editedData.requesterId || ''} 
                                onValueChange={(value) => setEditedData({...editedData, requesterId: value})}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o solicitante" />
                                </SelectTrigger>
                                <SelectContent>
                                  {requesters.map((requester) => (
                                    <SelectItem key={requester.id} value={requester.id}>
                                      {requester.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>

                              <Select 
                                value={editedData.providerId || ''} 
                                onValueChange={(value) => setEditedData({...editedData, providerId: value})}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o fornecedor" />
                                </SelectTrigger>
                                <SelectContent>
                                  {providers.map((provider) => (
                                    <SelectItem key={provider.id} value={provider.id}>
                                      {provider.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>

                              <Input
                                type="number"
                                placeholder="Valor (R$)"
                                value={editedData.value || ''}
                                onChange={(e) => setEditedData({...editedData, value: e.target.value})}
                              />

                              <Input
                                type="date"
                                placeholder="Data de solicitação"
                                value={typeof editedData.requestDate === 'string' ? editedData.requestDate : ''}
                                onChange={(e) => setEditedData({...editedData, requestDate: e.target.value})}
                              />

                              <Input
                                type="date"
                                placeholder="Data de conclusão"
                                value={typeof editedData.completionDate === 'string' ? editedData.completionDate : ''}
                                onChange={(e) => setEditedData({...editedData, completionDate: e.target.value})}
                              />

                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  checked={editedData.isMonthlyPackage || false}
                                  onCheckedChange={(checked) => setEditedData({...editedData, isMonthlyPackage: checked as boolean})}
                                />
                                <label className="text-sm">Incluído no pacote mensal</label>
                              </div>

                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  checked={editedData.isCourtesy || false}
                                  onCheckedChange={(checked) => setEditedData({...editedData, isCourtesy: checked as boolean})}
                                />
                                <label className="text-sm">Cortesia</label>
                              </div>

                              <Input
                                type="number"
                                placeholder="Créditos utilizados"
                                value={editedData.creditsUsed || 0}
                                onChange={(e) => setEditedData({...editedData, creditsUsed: parseInt(e.target.value) || 0})}
                              />

                              {/* Status Field */}
                              <Select 
                                value={editedData.status || ''} 
                                onValueChange={(value) => setEditedData({...editedData, status: value})}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o status" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="PENDENTE">Pendente</SelectItem>
                                  <SelectItem value="PROGRAMADO">Programado</SelectItem>
                                  <SelectItem value="RESOLVIDO">Resolvido</SelectItem>
                                </SelectContent>
                              </Select>

                              {/* Added Service Type editing field */}
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Tipo de Serviço</label>
                                <div className="grid grid-cols-2 gap-2">
                                  {["Manutenção", "Reparo", "Instalação", "Montagem", "Limpeza", "Correção"].map((type) => (
                                    <div key={type} className="flex items-center space-x-2">
                                      <Checkbox
                                        id={`edit-${type}`}
                                        checked={Array.isArray(editedData.serviceType) ? editedData.serviceType.includes(type) : (service.serviceType || []).includes(type)}
                                        onCheckedChange={(checked) => {
                                          const currentTypes = Array.isArray(editedData.serviceType) ? editedData.serviceType : (service.serviceType || []);
                                          if (checked) {
                                            setEditedData({...editedData, serviceType: [...currentTypes, type]});
                                          } else {
                                            setEditedData({...editedData, serviceType: currentTypes.filter((t: string) => t !== type)});
                                          }
                                        }}
                                      />
                                      <label htmlFor={`edit-${type}`} className="text-sm">{type}</label>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className="flex justify-end space-x-2 pt-4 border-t">
                                <Button variant="ghost" size="sm" onClick={handleCancel}>
                                  <X className="h-4 w-4" />
                                </Button>
                                <Button size="sm" onClick={handleSave}>
                                  <Save className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="space-y-2 text-sm">
                                <p><strong>Solicitante:</strong> {(service as any).requester?.name || (service as any).requesterName || requesters.find(r => r.id === service.requesterId)?.name || 'Não definido'}</p>
                                <p><strong>Fornecedor:</strong> {(service as any).provider?.name || (service as any).providerName || providers.find(p => p.id === service.providerId)?.name || 'Não definido'}</p>
                                <p><strong>Data:</strong> {new Date(service.requestDate).toLocaleDateString('pt-BR')}</p>
                                {service.value && (
                                  <p><strong>Valor:</strong> R$ {parseFloat(service.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                )}
                                {service.isMonthlyPackage && (
                                  <div className="text-green-600">
                                    <p>✓ Créditos usados: {service.creditsUsed || 0}</p>
                                  </div>
                                )}
                                {service.isCourtesy && <p className="text-blue-600">🎁 Cortesia</p>}
                                {service.description && (
                                  <p><strong>Descrição:</strong> {service.description.substring(0, 100)}{service.description.length > 100 ? '...' : ''}</p>
                                )}
                                {service.serviceType && Array.isArray(service.serviceType) && service.serviceType.length > 0 && (
                                  <p><strong>Tipo de Serviço:</strong> {service.serviceType.join(', ')}</p>
                                )}
                              </div>

                              <div className="flex justify-end space-x-2 mt-4 pt-4 border-t">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleEdit(service)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleDelete(service.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      {/* New Service Modal */}
      <NewServiceModal
        isOpen={isNewServiceModalOpen}
        onClose={() => setIsNewServiceModalOpen(false)}
        onServiceCreated={() => {
          setIsNewServiceModalOpen(false);
          queryClient.invalidateQueries({ queryKey: ["/api/services/all"] });
        }}
      />
    </div>
  );
}