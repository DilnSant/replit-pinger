
import React from 'react';

export default function Footer() {
  return (
    <footer className="text-white mt-16" style={{ backgroundColor: '#004182' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Logo à esquerda */}
          <div className="flex items-center">
            <img 
              src="https://wyxnyliiuxdhbbctxzlk.supabase.co/storage/v1/object/public/public_images/logorodape.png" 
              alt="Método Develops" 
              className="h-20 w-auto"
            />
          </div>

          {/* Links rápidos */}
          <div className="text-center sm:text-right">
            <h3 className="font-bold text-sm mb-2">Links Rápidos</h3>
            <div className="flex flex-col space-y-1">
              <a 
                href="/services-list" 
                className="text-sm hover:text-blue-200 transition-colors"
              >
                Serviços
              </a>
              <a 
                href="/requesters" 
                className="text-sm hover:text-blue-200 transition-colors"
              >
                Solicitantes
              </a>
              <a 
                href="/providers" 
                className="text-sm hover:text-blue-200 transition-colors"
              >
                Fornecedores
              </a>
            </div>
          </div>
        </div>
        
        {/* Developer credit - centered at bottom */}
        <div className="text-center mt-4 border-t border-white/20 pt-4">
          <p className="font-bold text-sm">
            Desenvolvido por Dilney Santos | Todos os direitos reservados
          </p>
        </div>
      </div>
    </footer>
  );
}
