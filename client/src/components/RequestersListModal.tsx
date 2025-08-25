
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X, Search, Mail, Phone, MapPin } from "lucide-react";

interface RequestersListModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Requester {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  notes?: string;
}

export default function RequestersListModal({ isOpen, onClose }: RequestersListModalProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: requesters = [] } = useQuery<Requester[]>({
    queryKey: ["/api/requesters"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: isOpen,
  });

  const filteredRequesters = requesters.filter(requester =>
    requester.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    requester.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-blue-900 flex items-center justify-between">
            Lista de Solicitantes
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X size={16} />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <Input
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="max-h-[400px] overflow-y-auto space-y-3">
            {filteredRequesters.length > 0 ? (
              filteredRequesters.map((requester) => (
                <div key={requester.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-2">{requester.name}</h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <Mail size={14} />
                      <span>{requester.email}</span>
                    </div>
                    {requester.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone size={14} />
                        <span>{requester.phone}</span>
                      </div>
                    )}
                    {requester.address && (
                      <div className="flex items-center space-x-2">
                        <MapPin size={14} />
                        <span>{requester.address}</span>
                      </div>
                    )}
                    {requester.notes && (
                      <div className="mt-2">
                        <p className="text-gray-500 text-xs">Observações:</p>
                        <p className="text-gray-600">{requester.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl text-gray-300 mb-4">👥</div>
                <p className="text-gray-500 text-lg">
                  {searchTerm ? "Nenhum solicitante encontrado" : "Nenhum solicitante cadastrado"}
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
