import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Shield, ShieldCheck } from "lucide-react";
import { apiRequest, getQueryFn } from "@/lib/queryClient";

interface User {
  id: string;
  email: string;
  name?: string;
  userType: string;
  isAdmin: boolean;
  receiveEmailNotification: boolean;
}

export default function AdminUsers() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [pendingChanges, setPendingChanges] = useState<Record<string, Partial<User>>>({});

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: user?.isAdmin,
  });

  const promoteUserMutation = useMutation({
    mutationFn: (userId: string) => apiRequest('POST', '/api/admin/promote', { userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Sucesso",
        description: "Usuário promovido a administrador",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao promover usuário",
        variant: "destructive",
      });
    },
  });

  const revokeUserMutation = useMutation({
    mutationFn: (userId: string) => apiRequest('POST', '/api/admin/revoke', { userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Sucesso",
        description: "Privilégios de administrador removidos",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao revogar privilégios",
        variant: "destructive",
      });
    },
  });

  const setUserTypeMutation = useMutation({
    mutationFn: ({ userId, userType }: { userId: string; userType: string }) =>
      apiRequest('POST', '/api/admin/set-type', { userId, userType }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setPendingChanges(prev => {
        const newState = { ...prev };
        delete newState[userId];
        return newState;
      });
      toast({
        title: "Sucesso",
        description: "Tipo de usuário atualizado",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar tipo de usuário",
        variant: "destructive",
      });
    },
  });

  const setReceiveEmailNotificationMutation = useMutation({
    mutationFn: ({ userId, receiveEmailNotification }: { userId: string; receiveEmailNotification: boolean }) =>
      apiRequest('POST', '/api/admin/set-receive-email-notification', { userId, receiveEmailNotification }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setPendingChanges(prev => {
        const newState = { ...prev };
        delete newState[userId];
        return newState;
      });
      toast({
        title: "Sucesso",
        description: "Preferência de notificação por email atualizada",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar preferência de notificação por email",
        variant: "destructive",
      });
    },
  });

  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen bg-[#D9e0e8]">
        <Header
          selectedMonth={new Date().getMonth() + 1}
          selectedYear={new Date().getFullYear()}
          onMonthChange={() => {}}
        />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Acesso Negado</h1>
            <p className="text-gray-600">Você não tem permissão para acessar esta página.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#D9e0e8]">
      <Header
        selectedMonth={new Date().getMonth() + 1}
        selectedYear={new Date().getFullYear()}
        onMonthChange={() => {}}
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gerenciar Usuários</h1>
          <p className="text-gray-600">Gerencie permissões e tipos de usuários do sistema</p>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <p>Carregando usuários...</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {users.map((userItem) => {
              const hasPendingChange = pendingChanges[userItem.id] !== undefined;
              const isEmailNotificationChanged = hasPendingChange && pendingChanges[userItem.id]?.receiveEmailNotification !== undefined && pendingChanges[userItem.id]?.receiveEmailNotification !== userItem.receiveEmailNotification;
              const isUserTypeChanged = hasPendingChange && pendingChanges[userItem.id]?.userType !== undefined && pendingChanges[userItem.id]?.userType !== userItem.userType;

              return (
                <Card key={userItem.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Users className="h-5 w-5" />
                          {userItem.name || userItem.email}
                          {userItem.isAdmin && (
                            <Badge variant="destructive">
                              <Shield className="h-3 w-3 mr-1" />
                              Admin
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription>{userItem.email}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {userItem.userType || 'Não definido'}
                        </Badge>
                        <Badge variant={userItem.receiveEmailNotification ? "secondary" : "outline"}>
                          {userItem.receiveEmailNotification ? "Email ON" : "Email OFF"}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                      {/* Admin Controls */}
                      <div className="flex items-center gap-2">
                        {userItem.isAdmin ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => revokeUserMutation.mutate(userItem.id)}
                            disabled={revokeUserMutation.isPending}
                          >
                            <Shield className="h-4 w-4 mr-2" />
                            Revogar Admin
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => promoteUserMutation.mutate(userItem.id)}
                            disabled={promoteUserMutation.isPending}
                          >
                            <ShieldCheck className="h-4 w-4 mr-2" />
                            Promover a Admin
                          </Button>
                        )}
                      </div>

                      {/* User Type Controls */}
                      <div className="flex items-center gap-2">
                        <Select
                          value={pendingChanges[userItem.id]?.userType || userItem.userType || ''}
                          onValueChange={(value) => {
                            setPendingChanges(prev => ({
                              ...prev,
                              [userItem.id]: { ...(prev[userItem.id] || {}), userType: value }
                            }));
                          }}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue placeholder="Tipo de usuário" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fornecedor">Fornecedor</SelectItem>
                            <SelectItem value="solicitante">Solicitante</SelectItem>
                            <SelectItem value="visualizador">Visualizador</SelectItem>
                          </SelectContent>
                        </Select>

                        {isUserTypeChanged && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setUserTypeMutation.mutate({
                                userId: userItem.id,
                                userType: pendingChanges[userItem.id]!.userType!
                              });
                            }}
                            disabled={setUserTypeMutation.isPending}
                          >
                            Salvar Tipo
                          </Button>
                        )}
                      </div>

                      {/* Email Notification Controls */}
                      <div className="flex items-center gap-2">
                        <Select
                          value={String(pendingChanges[userItem.id]?.receiveEmailNotification ?? userItem.receiveEmailNotification)}
                          onValueChange={(value) => {
                            setPendingChanges(prev => ({
                              ...prev,
                              [userItem.id]: { ...(prev[userItem.id] || {}), receiveEmailNotification: value === 'true' }
                            }));
                          }}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue placeholder="Notificação por Email" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">Receber Notificações por Email</SelectItem>
                            <SelectItem value="false">Não Receber Notificações por Email</SelectItem>
                          </SelectContent>
                        </Select>

                        {isEmailNotificationChanged && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setReceiveEmailNotificationMutation.mutate({
                                userId: userItem.id,
                                receiveEmailNotification: pendingChanges[userItem.id]!.receiveEmailNotification!
                              });
                            }}
                            disabled={setReceiveEmailNotificationMutation.isPending}
                          >
                            Salvar Notificação
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}