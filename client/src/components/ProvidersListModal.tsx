
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X, Search, Mail, Phone, DollarSign, Wrench } from "lucide-react";

interface ProvidersListModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Provider {
  id: string;
  name: string;
  email: string;
  phone?: string;
  specialties?: string;
  hourlyRate?: string;
  notes?: string;
}

export default function ProvidersListModal({ isOpen, onClose }: ProvidersListModalProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: providers = [] } = useQuery<Provider[]>({
    queryKey: ["/api/providers"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: isOpen,
  });

  const filteredProviders = providers.filter(provider =>
    provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    provider.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (provider.specialties && provider.specialties.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-blue-900 flex items-center justify-between">
            Lista de Fornecedores
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X size={16} />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <Input
              placeholder="Buscar por nome, email ou especialidade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="max-h-[400px] overflow-y-auto space-y-3">
            {filteredProviders.length > 0 ? (
              filteredProviders.map((provider) => (
                <div key={provider.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-2">{provider.name}</h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <Mail size={14} />
                      <span>{provider.email}</span>
                    </div>
                    {provider.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone size={14} />
                        <span>{provider.phone}</span>
                      </div>
                    )}
                    {provider.specialties && (
                      <div className="flex items-center space-x-2">
                        <Wrench size={14} />
                        <span>{provider.specialties}</span>
                      </div>
                    )}
                    {provider.hourlyRate && (
                      <div className="flex items-center space-x-2">
                        <DollarSign size={14} />
                        <span>R$ {parseFloat(provider.hourlyRate).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/hora</span>
                      </div>
                    )}
                    {provider.notes && (
                      <div className="mt-2">
                        <p className="text-gray-500 text-xs">Observações:</p>
                        <p className="text-gray-600">{provider.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl text-gray-300 mb-4">🔧</div>
                <p className="text-gray-500 text-lg">
                  {searchTerm ? "Nenhum fornecedor encontrado" : "Nenhum fornecedor cadastrado"}
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
