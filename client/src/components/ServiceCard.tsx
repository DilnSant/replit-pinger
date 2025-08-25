import { Badge } from "@/components/ui/badge";
import type { Service } from "@shared/schema";

import { isUserAdmin } from "@/lib/adminUtils";

interface ServiceCardProps {
  service: Service;
  onUpdate: () => void;
  isAdmin?: boolean;
}

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

const serviceTypeLabels = {
  manutencao: "Manutenção",
  reparo: "Reparo",
  instalacao: "Instalação",
  montagem: "Montagem",
  limpeza: "Limpeza",
  correcao: "Correção",
};

export default function ServiceCard({ service, onUpdate, isAdmin = false }: ServiceCardProps) {
  const formatDate = (date: string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString('pt-BR');
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
          <span className="text-green-600">✓</span>
          Créditos usados: {creditsUsed}
        </span>
      );
    }
    if (!value) return "-";
    return (
      <span className="flex items-center gap-1">
        <span>$</span>
        R$ {parseFloat(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
      </span>
    );
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex space-x-4">
        {/* Service Image */}
        <div className="flex-shrink-0">
          {service.images && service.images.length > 0 ? (
            <img
              src={service.images[0]}
              alt={service.title}
              className="w-[120px] h-[80px] object-cover rounded-lg"
            />
          ) : (
            <div className="w-[120px] h-[80px] bg-gray-200 rounded-lg flex items-center justify-center">
              <span className="text-gray-400 text-sm">Sem imagem</span>
            </div>
          )}
        </div>

        {/* Service Information */}
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-2">{service.title}</h3>
          <div className="space-y-1 text-sm text-gray-600">
            <p>
              <span className="font-medium">Data:</span> {formatDate(service.requestDate ? service.requestDate.toString() : null)}
            </p>
            <div className="flex items-center gap-2">
              <span className="font-medium">Status:</span>
              <Badge className={`${statusColors[service.status as keyof typeof statusColors]} text-xs font-medium`}>
                {statusLabels[service.status as keyof typeof statusLabels]}
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              {service.isMonthlyPackage && (
                <>
                  <span className="text-green-600">✓</span>
                  <span>Créditos usados: {service.creditsUsed || 0}</span>
                </>
              )}
              {service.isCourtesy && (
                <>
                  <span className="text-blue-600">🎁</span>
                  <span>Cortesia</span>
                </>
              )}
              {!service.isMonthlyPackage && !service.isCourtesy && service.value && (
                <span>R$ {parseFloat(service.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}