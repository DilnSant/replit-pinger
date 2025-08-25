import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertRequesterSchema, type Requester, type NewRequester } from "@shared/schema";
import { apiRequest, queryClient, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, UserPlus, Mail } from "lucide-react";

export default function RequestersPage() {
  const { toast } = useToast();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingRequester, setEditingRequester] = useState<Requester | null>(null);
  const [isAdmin] = useState(() => localStorage.getItem('isAdmin') === 'true');

  const { data: requestersResponse, isLoading } = useQuery<{
    requesters: Requester[];
    pagination: any;
  }>({
    queryKey: ["/api/requesters"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const requesters = requestersResponse?.requesters || [];

  const createMutation = useMutation({
    mutationFn: async (data: NewRequester) => {
      const token = localStorage.getItem('supabase_token') || localStorage.getItem('adminToken');
      const response = await fetch('/api/requesters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : 'AdminAppBrandness:Adminappbrandness'
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao criar solicitante');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/requesters"] });
      setIsCreateModalOpen(false);
      toast({
        title: "Sucesso",
        description: "Solicitante criado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao criar solicitante: " + error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: NewRequester }) => {
      const response = await fetch(`/api/requesters/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'AdminAppBrandness:Adminappbrandness'
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao atualizar solicitante');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/requesters"] });
      setEditingRequester(null);
      toast({
        title: "Sucesso",
        description: "Solicitante atualizado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar solicitante: " + error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = localStorage.getItem('supabase_token') || localStorage.getItem('adminToken');
      const response = await fetch(`/api/requesters/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': token ? `Bearer ${token}` : 'AdminAppBrandness:Adminappbrandness'
        }
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao remover solicitante');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/requesters"] });
      toast({
        title: "Sucesso",
        description: "Solicitante removido com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao remover solicitante: " + error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#D9e0e8] container mx-auto p-6">
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando solicitantes...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#D9e0e8] container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gerenciar Solicitantes</h1>
          <p className="text-gray-600">Gerencie os funcionários da Brandness que podem solicitar serviços</p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Novo Solicitante
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Novo Solicitante</DialogTitle>
            </DialogHeader>
            <RequesterForm
              onSubmit={(data) => createMutation.mutate(data)}
              isLoading={createMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {requesters.map((requester) => (
          <Card key={requester.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <UserPlus className="w-5 h-5 mr-2 text-blue-600" />
                  {requester.name}
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingRequester(requester)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  {isAdmin && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteMutation.mutate(requester.id)}
                      className="text-red-600 hover:text-red-700"
                      data-testid="button-delete-requester"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="w-4 h-4 mr-2" />
                  {requester.email}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Notificações por email:</span>
                  <span className={`text-sm font-medium ${requester.receiveEmailNotification ? 'text-green-600' : 'text-gray-500'}`}>
                    {requester.receiveEmailNotification ? 'Ativadas' : 'Desativadas'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Modal */}
      <Dialog open={!!editingRequester} onOpenChange={() => setEditingRequester(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Solicitante</DialogTitle>
          </DialogHeader>
          {editingRequester && (
            <RequesterForm
              defaultValues={editingRequester}
              onSubmit={(data) => updateMutation.mutate({ id: editingRequester.id, data })}
              isLoading={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface RequesterFormProps {
  defaultValues?: Requester;
  onSubmit: (data: NewRequester) => void;
  isLoading: boolean;
}

function RequesterForm({ defaultValues, onSubmit, isLoading }: RequesterFormProps) {
  const form = useForm<NewRequester>({
    resolver: zodResolver(insertRequesterSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      email: defaultValues?.email ?? "",
      receiveEmailNotification: defaultValues?.receiveEmailNotification ?? false,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input placeholder="Nome do solicitante" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input 
                  type="email" 
                  placeholder="email@brandness.com" 
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="receiveEmailNotification"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Notificações por Email</FormLabel>
                <div className="text-sm text-gray-600">
                  Receber notificações sobre atualizações de serviços
                </div>
              </div>
              <FormControl>
                <Switch
                  checked={field.value || false}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </form>
    </Form>
  );
}