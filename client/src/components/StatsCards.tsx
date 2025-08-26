import { Calendar, CheckCircle, CalendarDays, Clock, Gift } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "wouter";

interface StatsCardsProps {
  totalServices: number;
  pendingServices: number;
  resolvedServices: number;
  scheduledServices: number;
  monthlyCreditsUsed: number;
  courtesyServices: number;
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
    // Scroll to top after navigation
    setTimeout(() => window.scrollTo(0, 0), 100);
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-6 mb-6 sm:mb-8">
      {/* Serviços do Mês */}
      <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white cursor-pointer hover:shadow-lg transition-all"
              onClick={() => handleCardClick('TOTAL')}>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="text-xl sm:text-2xl font-bold">{totalServices}</p>
                <p className="text-blue-100 text-sm font-medium">Serviços do Mês</p>
              </div>
              <div className="text-blue-200">
                <Calendar className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Inclusos no Plano Mensal */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="text-xl sm:text-2xl font-bold text-green-600">{monthlyCreditsUsed}</p>
                <p className="text-gray-600 text-sm font-medium">Incluídos</p>
              </div>
              <div className="text-green-500">
                <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Serviços Agendados */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="text-xl sm:text-2xl font-bold text-blue-600">{scheduledServices}</p>
                <p className="text-gray-600 text-sm font-medium">Serviços Agendados</p>
              </div>
              <div className="text-blue-500">
                <CalendarDays className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Serviços Cortesia */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="text-xl sm:text-2xl font-bold text-purple-600">{courtesyServices}</p>
                <p className="text-gray-600 text-sm font-medium">Cortesia</p>
              </div>
              <div className="text-purple-500">
                <Gift className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pendentes */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="text-xl sm:text-2xl font-bold text-orange-500">{pendingServices}</p>
                <p className="text-gray-600 text-sm font-medium">Serviços Pendentes</p>
              </div>
              <div className="text-orange-500">
                <Clock className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
    </div>
  );
}