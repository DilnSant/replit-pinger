import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Settings, User as UserIcon, LogOut, UserPlus, Building, Users, List, Wrench, Home, Building2, User, Shield, Menu, X } from "lucide-react";
import { useLocation } from "wouter";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";



interface HeaderProps {
  selectedMonth: number;
  selectedYear: number;
  onMonthChange: (month: number, year: number) => void;
}

export default function Header({ selectedMonth, selectedYear, onMonthChange }: HeaderProps) {
  const [, setLocation] = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isAdmin] = useState(() => localStorage.getItem('isAdmin') === 'true');
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const months = [
    { value: 1, label: "Janeiro" },
    { value: 2, label: "Fevereiro" },
    { value: 3, label: "Março" },
    { value: 4, label: "Abril" },
    { value: 5, label: "Maio" },
    { value: 6, label: "Junho" },
    { value: 7, label: "Julho" },
    { value: 8, label: "Agosto" },
    { value: 9, label: "Setembro" },
    { value: 10, label: "Outubro" },
    { value: 11, label: "Novembro" },
    { value: 12, label: "Dezembro" },
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2024 + 2 }, (_, i) => 2024 + i);

  // Filter available months based on selected year
  const getAvailableMonths = () => {
    if (selectedYear === 2024) {
      // For 2024, only show June onwards (months 6-12)
      return months.slice(5); // June is index 5
    }
    // For years after 2024, show all months
    return months;
  };

  const getAvailableMonthsNumbers = () => {
    if (selectedYear === 2024) {
      return Array.from({ length: 7 }, (_, i) => i + 6); // 6, 7, 8, 9, 10, 11, 12
    }
    return Array.from({ length: 12 }, (_, i) => i + 1); // 1-12
  };


  const handleMonthSelect = useCallback((value: string) => {
    const [month, year] = value.split('-').map(Number);
    onMonthChange(month, year);
  }, [onMonthChange]);

  const monthOptions = useMemo(() => {
    const options = [];
    const minYear = 2024;
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1; // JavaScript months are 0-indexed

    for (let year = currentYear; year >= 2025; year--) {
      let startMonth = 12;
      if (year === currentYear) {
        startMonth = currentMonth;
      }

      let endMonth = 1;
      if (year === 2025) {
        endMonth = 6; // Start from June 2025
      }

      for (let month = startMonth; month >= endMonth; month--) {

        options.push({
          value: `${month}-${year}`,
          label: `${months[month - 1].label} ${year}`
        });
      }
    }
    return options.sort((a, b) => {
        const [monthA, yearA] = a.value.split('-').map(Number);
        const [monthB, yearB] = b.value.split('-').map(Number);
        if (yearA !== yearB) {
            return yearB - yearA;
        }
        return monthB - monthA;
    });
  }, []);


  const handleYearChange = (year: string) => {
    const newYear = parseInt(year);
    let newMonth = selectedMonth;

    // If switching to 2024 and current month is before June, set to June
    if (newYear === 2024 && selectedMonth < 6) {
      newMonth = 6;
    } else if (newYear > 2024 && selectedMonth < 1) { // Ensure month is valid for future years if it was reset
        newMonth = 1;
    }

    onMonthChange(newMonth, newYear);
  };

  const handleMonthChange = (month: string) => {
    const newMonth = parseInt(month);
    onMonthChange(newMonth, selectedYear);
  };

  const logout = () => {
    localStorage.removeItem('isAdmin');
    setLocation('/');
  };

  const navigationItems = [
    { label: "Solicitantes", path: "/requesters" },
    { label: "Fornecedores", path: "/providers" },
  ];

  if (isAdmin) {
    navigationItems.push({ label: "Admin", path: "/admin/usuarios" });
  }

  const handleNavigation = (path: string) => {
    setLocation(path);
    setMobileMenuOpen(false);
  };

  return (
    <header className="shadow-sm border-b border-blue-300 sticky top-0 z-50" style={{ backgroundColor: '#004182' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <Wrench className="text-lg" style={{ color: '#004182' }} />
            </div>
            <h1 className="text-sm sm:text-2xl font-bold text-white">Gestão Método Brandness</h1>
            {isAdmin && (
              <div className="hidden sm:inline-block bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium border border-red-200">
                🔐 Modo Administrador
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {/* Month Filter - Desktop */}
            <Select value={selectedYear ? `${selectedMonth}-${selectedYear}` : ''} onValueChange={handleMonthSelect}>
              <SelectTrigger className="w-48 hidden sm:flex">
                <SelectValue placeholder="Selecione o Mês/Ano" />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Month Filter - Mobile */}
            <Select value={selectedYear ? `${selectedMonth}-${selectedYear}` : ''} onValueChange={handleMonthSelect}>
              <SelectTrigger className="h-10 items-center justify-between rounded-md border border-input bg-background px-3 py-2 ring-offset-background data-[placeholder]:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 w-22 flex sm:hidden text-xs pt-[0px] pb-[0px] pl-[4px] pr-[4px] ml-[0px] mr-[0px]">
                <SelectValue placeholder="Mês/Ano" />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Settings Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="hidden sm:inline-flex text-blue-600 hover:bg-blue-600 hover:text-white transition-colors">
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-white">
                <DropdownMenuItem
                  className="cursor-pointer hover:font-bold transition-all duration-200"
                  onClick={() => {
                    setLocation('/requesters');
                    setIsDropdownOpen(false);
                  }}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Solicitantes
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer hover:font-bold transition-all duration-200"
                  onClick={() => {
                    setLocation('/providers');
                    setIsDropdownOpen(false);
                  }}
                >
                  <Building className="mr-2 h-4 w-4" />
                  Fornecedores
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => window.open('https://wa.link/xrf522', '_blank')} className="cursor-pointer hover:font-bold transition-all duration-200">
                  <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.382"/>
                  </svg>
                  Suporte Desenvolvedor
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu Trigger */}
            {isMobile && (
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" className="sm:hidden w-10 h-10 text-white hover:bg-white/20 transition-colors flex items-center justify-center p-0">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64 bg-white overflow-y-auto" style={{ height: 'fit-content', maxHeight: '90vh' }}>
                  <SheetHeader>
                    <SheetTitle>Menu</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6 space-y-4">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setLocation('/requesters');
                        setMobileMenuOpen(false);
                      }}
                      className="w-full justify-start text-left text-base"
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      Solicitantes
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setLocation('/providers');
                        setMobileMenuOpen(false);
                      }}
                      className="w-full justify-start text-left text-base"
                    >
                      <Building className="mr-2 h-4 w-4" />
                      Fornecedores
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        window.open('https://wa.link/xrf522', '_blank');
                        setMobileMenuOpen(false);
                      }}
                      className="w-full justify-start text-left text-base"
                    >
                      <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.382"/>
                      </svg>
                      Suporte Desenvolvedor
                    </Button>
                    
                    {isAdmin ? (
                      <>
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setLocation('/admin-services');
                            setMobileMenuOpen(false);
                          }}
                          className="w-full justify-start text-left text-base"
                        >
                          <List className="mr-2 h-4 w-4" />
                          Gerenciar Serviços
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => {
                            logout();
                            setMobileMenuOpen(false);
                          }}
                          className="w-full justify-start text-left text-base"
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          Sair
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setLocation('/admin-login');
                          setMobileMenuOpen(false);
                        }}
                        className="w-full justify-start text-left text-base"
                      >
                        <Shield className="mr-2 h-4 w-4" />
                        Acesso Admin
                      </Button>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            )}


            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0 hidden sm:flex">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src="/attached_assets/brandnessbr_logo_1755091192957.jpeg" alt="Brandness Logo" />
                    <AvatarFallback className="bg-blue-600 text-xs">
                      B
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-white">
                {isAdmin && (
                  <>
                    <DropdownMenuItem
                      className="hover:font-bold cursor-pointer"
                      onClick={() => setLocation('/admin-services')}
                    >
                      <List className="mr-2 h-4 w-4" />
                      Gerenciar Serviços
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem
                  className="hover:font-bold cursor-pointer"
                  onClick={() => setLocation('/admin-login')}
                >
                  <Shield className="mr-2 h-4 w-4" />
                  Acesso Admin
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="hover:font-bold cursor-pointer"
                  onClick={logout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

          </div>
        </div>
      </div>
    </header>
  );
}