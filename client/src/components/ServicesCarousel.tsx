import { useState, useMemo } from "react";
import { Calendar, User, Building2, DollarSign, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import type { Service } from "@shared/schema";

interface ServicesCarouselProps {
  services: Service[];
  selectedMonth: number;
  selectedYear: number;
}

export default function ServicesCarousel({ services, selectedMonth, selectedYear }: ServicesCarouselProps) {
  const [showImagePreview, setShowImagePreview] = useState<{ [key: string]: boolean }>({});
  const [currentPreviewImage, setCurrentPreviewImage] = useState<{ [key: string]: number }>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const setLocation = useLocation()[1];

  // Filter services to only show completed ones from selected month/year
  const recentServices = services
    .filter((service) => {
      if (!service.completionDate) return false;

      const completionDate = new Date(service.completionDate);
      const completionMonth = completionDate.getMonth() + 1; // getMonth() returns 0-11
      const completionYear = completionDate.getFullYear();

      return completionMonth === selectedMonth && completionYear === selectedYear;
    })
    .sort((a, b) => {
      const dateA = new Date(a.completionDate || a.requestDate || a.createdAt);
      const dateB = new Date(b.completionDate || b.requestDate || b.createdAt);
      return dateB.getTime() - dateA.getTime();
    });

  const ITEMS_PER_PAGE = 4;
  const totalPages = Math.ceil(recentServices.length / ITEMS_PER_PAGE);

  // Get current page services
  const currentServices = recentServices.slice(
    currentIndex * ITEMS_PER_PAGE,
    (currentIndex + 1) * ITEMS_PER_PAGE
  );

  const goToPrevious = () => {
    setCurrentIndex(prev => prev > 0 ? prev - 1 : totalPages - 1);
  };

  const goToNext = () => {
    setCurrentIndex(prev => prev < totalPages - 1 ? prev + 1 : 0);
  };

  if (recentServices.length === 0) {
    const monthNames = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Octubro", "Novembro", "Dezembro"
    ];

    return (
      <div className="text-center py-8">
        <div className="text-4xl text-gray-300 mb-4">📋</div>
        <p className="text-gray-500">
          Nenhum serviço concluído encontrado em {monthNames[selectedMonth - 1]} de {selectedYear}
        </p>
      </div>
    );
  }

  const formatDate = (date: string | null) => {
    if (!date) return 'Data não informada';
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatValue = (value: string | null, isMonthlyPackage: boolean, isCourtesy: boolean = false, creditsUsed: number = 0) => {
    if (isCourtesy) {
      return (
        <span className="flex items-center gap-1 text-xs">
          <span className="text-blue-600">🎁</span>
          Cortesia
        </span>
      );
    }
    if (isMonthlyPackage) {
      return (
        <span className="flex items-center gap-1 text-xs">
          <Check className="h-3 w-3 text-green-600" />
          Créditos usados: {creditsUsed}
        </span>
      );
    }
    if (!value) return "Valor não informado";
    return (
      <span className="flex items-center gap-1 text-xs">
        <DollarSign className="h-3 w-3" />
        R$ {parseFloat(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
      </span>
    );
  };

  const getMainImage = (service: any) => {
    if (service.images && service.images.length > 0) {
      return service.images[0];
    }
    return null;
  };

  return (
    <div className="relative">
      {/* Header com navegação */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Últimos Serviços Realizados</h3>

        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              ({currentIndex + 1} de {totalPages})
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={goToPrevious}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNext}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Grid de serviços - sempre 4 colunas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 min-h-[280px]">
        {currentServices.map((service) => (
        <Card
          key={service.id}
          className="hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => setLocation(`/services-list?service=${service.id}`)}
        >
          <CardContent className="p-3">
            <div className="flex flex-col h-full">
              {/* Image */}
              {getMainImage(service) ? (
                <div
                  className="relative mb-3 rounded-lg overflow-hidden"
                  onMouseEnter={() => service.images && service.images.length > 1 && setShowImagePreview({...showImagePreview, [service.id]: true})}
                  onMouseLeave={() => setShowImagePreview({...showImagePreview, [service.id]: false})}
                >
                  {showImagePreview[service.id] && service.images && service.images.length > 1 ? (
                    <div className="relative">
                      <img
                        src={service.images[currentPreviewImage[service.id] || 0]}
                        alt={`${service.title} - Imagem ${(currentPreviewImage[service.id] || 0) + 1}`}
                        className="w-full h-32 object-cover transition-opacity duration-200"
                      />
                      <div className="absolute inset-0 flex items-center justify-between p-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const current = currentPreviewImage[service.id] || 0;
                            setCurrentPreviewImage({
                              ...currentPreviewImage,
                              [service.id]: current === 0 ? service.images!.length - 1 : current - 1
                            });
                          }}
                          className="bg-black/50 text-white p-1 rounded-full hover:bg-black/70"
                        >
                          <ChevronLeft className="h-3 w-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const current = currentPreviewImage[service.id] || 0;
                            setCurrentPreviewImage({
                              ...currentPreviewImage,
                              [service.id]: current === service.images!.length - 1 ? 0 : current + 1
                            });
                          }}
                          className="bg-black/50 text-white p-1 rounded-full hover:bg-black/70"
                        >
                          <ChevronRight className="h-3 w-3" />
                        </button>
                      </div>
                      <div className="absolute bottom-2 left-2 right-2">
                        <div className="flex justify-center gap-1">
                          {service.images.map((_, index) => (
                            <div
                              key={index}
                              className={`w-1.5 h-1.5 rounded-full ${
                                index === (currentPreviewImage[service.id] || 0) ? 'bg-white' : 'bg-white/50'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <img
                      src={getMainImage(service)!}
                      alt={service.title}
                      className="w-full h-32 object-cover"
                    />
                  )}
                  {service.images && service.images.length > 1 && !showImagePreview[service.id] && (
                    <Badge className="absolute top-2 left-2 bg-black/70 text-white text-xs">
                      {service.images.length} fotos
                    </Badge>
                  )}
                </div>
              ) : (
                <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center mb-3">
                  <div className="text-gray-400 text-3xl">📷</div>
                </div>
              )}

              {/* Content */}
              <div className="flex-1">
                <h4 className="font-medium text-sm text-gray-900 line-clamp-2 mb-3">
                  {service.title}
                </h4>

                <div className="space-y-1 text-xs text-gray-600">
                  <div className="flex items-center gap-2">
                    <User className="h-3 w-3" />
                    <span className="truncate">
                      Solicitante: {(service as any).requester?.name || (service as any).requesterName || 'Não informado'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Building2 className="h-3 w-3" />
                    <span className="truncate">
                      Fornecedor: {(service as any).provider?.name || (service as any).providerName || 'Não informado'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {formatValue(service.value, service.isMonthlyPackage || false, service.isCourtesy || false, service.creditsUsed || 0)}
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(service.completionDate ? service.completionDate.toString() : null)}</span>
                  </div>
                </div>

                {service.serviceType && service.serviceType.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {[...new Set(service.serviceType)].map((type, index) => (
                      <Badge key={index} variant="secondary" className="text-xs px-1 py-0">
                        {type}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        ))}
      </div>

      {/* Indicadores de página */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-4 gap-2">
          {Array.from({ length: totalPages }, (_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentIndex
                  ? 'bg-blue-600'
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}