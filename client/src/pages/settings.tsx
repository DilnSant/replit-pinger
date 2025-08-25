
import { useState } from "react";
import { useLocation } from "wouter";
import { ChevronLeft, Mail, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [monthlyReports, setMonthlyReports] = useState(false);
  const [reportEmail, setReportEmail] = useState("");

  const handleSaveSettings = () => {
    // Here you would typically save to your backend
    toast({
      title: "Configurações salvas",
      description: "As configurações foram atualizadas com sucesso.",
    });
  };

  const handleConfigureReports = () => {
    if (!reportEmail) {
      toast({
        title: "Email obrigatório",
        description: "Por favor, insira um email para receber os relatórios.",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Relatórios configurados",
      description: `Os relatórios mensais serão enviados para: ${reportEmail}`,
    });
  };

  return (
    <div className="min-h-screen bg-[#D9e0e8]">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/dashboard')}
              className="text-gray-600 hover:text-gray-900"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Voltar ao Dashboard
            </Button>
            <h1 className="text-2xl font-bold text-blue-900">Configurações</h1>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          
          {/* Email Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Notificações por E-mail
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Notificações de Atualizações</Label>
                  <p className="text-sm text-gray-600">
                    Receba e-mails quando houver atualizações nos serviços
                  </p>
                </div>
                <Switch
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Notificações de Novos Serviços</Label>
                  <p className="text-sm text-gray-600">
                    Receba e-mails quando novos serviços forem criados
                  </p>
                </div>
                <Switch
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>
              
              <div className="flex justify-end">
                <Button onClick={handleSaveSettings}>
                  Salvar Configurações
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Reports */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Relatórios Mensais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Resumo mensal enviado por email</Label>
                  <p className="text-sm text-gray-600">
                    Receba um relatório completo dos serviços do mês
                  </p>
                </div>
                <Switch
                  checked={monthlyReports}
                  onCheckedChange={setMonthlyReports}
                />
              </div>

              {monthlyReports && (
                <div className="space-y-2">
                  <Label htmlFor="report-email">Email para relatórios</Label>
                  <div className="flex gap-2">
                    <Input
                      id="report-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={reportEmail}
                      onChange={(e) => setReportEmail(e.target.value)}
                      className="flex-1"
                    />
                    <Button onClick={handleConfigureReports}>
                      Configurar
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
        </div>
      </main>
    </div>
  );
}
