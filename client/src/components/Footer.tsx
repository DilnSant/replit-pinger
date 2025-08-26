
import React from 'react';

export default function Footer() {
  return (
    <footer className="text-white mt-16" style={{ backgroundColor: '#004182' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-4">
          {/* Logo */}
          <div className="flex items-center">
            <img 
              src="https://wyxnyliiuxdhbbctxzlk.supabase.co/storage/v1/object/public/public_images/logorodape.png" 
              alt="Método Develops" 
              className="h-20 w-auto"
            />
          </div>

          {/* Developer credit */}
          <div className="text-center sm:flex-1 sm:text-center">
            <p className="font-bold text-sm hidden sm:block">
              Desenvolvido por Dilney Santos | Todos os direitos reservados
            </p>
            <div className="sm:hidden">
              <p className="font-bold text-sm">
                Desenvolvido por Dilney Santos
              </p>
              <p className="font-bold text-sm">
                Todos os direitos reservados
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
