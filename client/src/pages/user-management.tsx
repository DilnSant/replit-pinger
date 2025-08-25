import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Users, UserCheck, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  userType?: string;
  isAdmin: boolean;
  createdAt: string;
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingUsers, setUpdatingUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/users");
      if (!response.ok) {
        throw new Error("Erro ao carregar usuários");
      }
      const data = await response.json();
      setUsers(data);
      setError("");
    } catch (err) {
      setError("Erro ao carregar usuários");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateUserType = async (userId: string, userType: string) => {
    if (!userType) return;

    setUpdatingUsers(prev => new Set(prev).add(userId));

    try {
      const response = await fetch(`/api/admin/user-type/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userType }),
      });

      const data = await response.json();

      if (response.ok) {
        setUsers(prevUsers =>
          prevUsers.map(user =>
            user.id === userId ? { ...user, userType } : user
          )
        );
      } else {
        throw new Error(data.message || "Erro ao atualizar tipo de usuário");
      }
    } catch (err) {
      console.error("Erro ao atualizar tipo de usuário:", err);
      setError(err instanceof Error ? err.message : "Erro ao atualizar tipo de usuário");
    } finally {
      setUpdatingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const getUserTypeVariant = (userType?: string) => {
    switch (userType) {
      case "admin": return "default";
      case "solicitante": return "secondary";
      case "fornecedor": return "outline";
      case "visualizador": return "destructive";
      default: return "secondary";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando usuários...</span>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Users className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Gerenciamento de Usuários</h1>
      </div>

      {error && (
        <Alert className="mb-6" variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Usuários do Sistema ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome/Email</TableHead>
                  <TableHead>Tipo Atual</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead>Data de Criação</TableHead>
                  <TableHead>Alterar Tipo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {user.firstName && user.lastName
                            ? `${user.firstName} ${user.lastName}`
                            : user.email?.split('@')[0] || 'Usuário'}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getUserTypeVariant(user.userType)}>
                        {user.userType || "Não definido"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.isAdmin ? "default" : "secondary"}>
                        {user.isAdmin ? "Sim" : "Não"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Select
                          value={user.userType || ""}
                          onValueChange={(value) => updateUserType(user.id, value)}
                          disabled={updatingUsers.has(user.id)}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="solicitante">Solicitante</SelectItem>
                            <SelectItem value="fornecedor">Fornecedor</SelectItem>
                            <SelectItem value="visualizador">Visualizador</SelectItem>
                          </SelectContent>
                        </Select>
                        {updatingUsers.has(user.id) && (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {users.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Nenhum usuário encontrado
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-6">
        <Button onClick={loadUsers} variant="outline">
          Atualizar Lista
        </Button>
      </div>
    </div>
  );
}