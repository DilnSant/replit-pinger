import { Calendar, CheckCircle, CalendarDays, Clock, Gift, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "wouter";

interface StatsCardsProps {
  totalServices: number;
  pendingServices: number;
  resolvedServices: number;
  scheduledServices: number;
  monthlyCreditsUsed: number;
  courtesyServices: number;
  monthlyServices: number;
  month: number;
  year: number;
  onMonthChange: (month: number, year: number) => void;
}

export default function StatsCards({
  totalServices,
  pendingServices,
  resolvedServices,
  scheduledServices,
  monthlyCreditsUsed,
  courtesyServices,
  monthlyServices,
  month,
  year,
  onMonthChange,
}: StatsCardsProps) {
  const [, setLocation] = useLocation();

  const handleCardClick = (cardType: string) => {
    if (cardType === 'TOTAL') {
      setLocation('/services-list');
    } else if (cardType === 'MONTHLY') {
      setLocation('/services-list?monthly=true');
    } else if (cardType === 'COURTESY') {
      setLocation('/services-list?courtesy=true');
    } else {
      setLocation(`/services-list?status=${cardType}`);
    }
    setTimeout(() => window.scrollTo(0, 0), 100);
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {/* Serviços do Mês - Filtro por mês selecionado */}
        <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setLocation(`/services-list?month=${month}&year=${year}`)}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Serviços do Mês</p>
                <p className="text-2xl font-bold text-blue-600">{totalServices}</p>
              </div>
              <div className="text-blue-500">
                <Calendar className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Serviços Incluídos - Pacote mensal do mês */}
        <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setLocation(`/services-list?monthly=true&month=${month}&year=${year}`)}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Serviços Incluídos</p>
                <p className="text-2xl font-bold text-green-600">{monthlyServices}</p>
              </div>
              <div className="text-green-500">
                <Check className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Serviços Agendados do Mês */}
        <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setLocation(`/services-list?status=PROGRAMADO&month=${month}&year=${year}`)}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Serviços Agendados</p>
                <p className="text-2xl font-bold text-purple-600">{scheduledServices}</p>
              </div>
              <div className="text-purple-500">
                <Calendar className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Serviços Cortesia do Mês */}
        <Card className="border-l-4 border-l-pink-500 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setLocation(`/services-list?courtesy=true&month=${month}&year=${year}`)}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Serviços Cortesia</p>
                <p className="text-2xl font-bold text-pink-600">{courtesyServices}</p>
              </div>
              <div className="text-pink-500">
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Serviços Pendentes do Mês */}
        <Card className="border-l-4 border-l-yellow-500 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setLocation(`/services-list?status=PENDENTE&month=${month}&year=${year}`)}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Serviços Pendentes</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingServices}</p>
              </div>
              <div className="text-yellow-500">
                <Clock className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>


    </>
  );
}