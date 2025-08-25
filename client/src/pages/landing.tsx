import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Users, Wrench, FileText } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#D9e0e8] flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-blue-900 rounded-lg flex items-center justify-center">
                <Wrench className="text-white text-lg" />
              </div>
              <h1 className="text-xl font-bold text-blue-900">App Método {'>'} Brandness</h1>
            </div>
            <Button onClick={() => window.location.href = '/admin-login'}>
              Admin
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Sistema de Gestão de Serviços
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Gerencie solicitações de serviços da Brandness de forma eficiente e organizada
          </p>

        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <Card>
            <CardHeader>
              <Settings className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>Gestão Completa</CardTitle>
              <CardDescription>
                Controle total sobre solicitações, fornecedores e equipe
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>Múltiplos Usuários</CardTitle>
              <CardDescription>
                Sistema compartilhado para toda a equipe Brandness
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Wrench className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>Limite Mensal</CardTitle>
              <CardDescription>
                4 serviços mensais incluídos no pacote, com controle automático
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <FileText className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>Relatórios</CardTitle>
              <CardDescription>
                Métricas e estatísticas detalhadas dos serviços realizados
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-600">
          <p>&copy; 2025 App Método {'>'} Brandness. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
