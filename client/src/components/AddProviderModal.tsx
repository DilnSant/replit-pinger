
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X } from "lucide-react";

interface AddProviderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProviderAdded: () => void;
}

export default function AddProviderModal({ isOpen, onClose, onProviderAdded }: AddProviderModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    specialties: "",
    hourlyRate: "",
    notes: "",
  });

  const createProviderMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch("/api/providers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error("Erro ao criar fornecedor");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Fornecedor adicionado com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/providers"] });
      setFormData({ name: "", email: "", phone: "", specialties: "", hourlyRate: "", notes: "" });
      onProviderAdded();
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao adicionar fornecedor. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      toast({
        title: "Erro",
        description: "Nome e email são obrigatórios.",
        variant: "destructive",
      });
      return;
    }
    createProviderMutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-blue-900 flex items-center justify-between">
            Adicionar Novo Fornecedor
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X size={16} />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Nome do fornecedor/empresa"
              required
            />
          </div>

          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              placeholder="email@exemplo.com"
              required
            />
          </div>

          <div>
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
              placeholder="(11) 99999-9999"
            />
          </div>

          <div>
            <Label htmlFor="specialties">Especialidades</Label>
            <Textarea
              id="specialties"
              value={formData.specialties}
              onChange={(e) => handleInputChange("specialties", e.target.value)}
              placeholder="Ex: Encanamento, Elétrica, Limpeza..."
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="hourlyRate">Valor por Hora (R$)</Label>
            <Input
              id="hourlyRate"
              type="number"
              step="0.01"
              value={formData.hourlyRate}
              onChange={(e) => handleInputChange("hourlyRate", e.target.value)}
              placeholder="0.00"
            />
          </div>

          <div>
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder="Observações adicionais"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={createProviderMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {createProviderMutation.isPending ? "Adicionando..." : "Adicionar Fornecedor"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
