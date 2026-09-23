'use client';
import './globals.css';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminRootLayout({ children }) {
  const pathname = usePathname();

  // 🔒 Catch all variations of the login path to hide header and navbar instantly
  const isLoginPage = pathname === '/login' || pathname === '/admin-login' || pathname.includes('login');

  return (
    <html lang="en" className="h-full">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
        <title>Shopmatries Food Admin Hub</title>
      </head>
      
      {/* Outer theatrical background wrapper */}
      <body className="bg-slate-950 text-slate-900 h-dvh w-screen m-0 p-0 flex justify-center items-center antialiased overflow-hidden selection:bg-emerald-500 selection:text-white">
        
        {/* Responsive App Frame Container */}
        <div className="w-full h-full sm:h-[92vh] sm:max-h-[880px] sm:w-[410px] sm:rounded-[40px] bg-white shadow-2xl relative flex flex-col justify-between border-0 sm:border-[8px] border-slate-900 overflow-hidden">
          
          {/* Top Brand Header (Hidden instantly on Login) */}
          {!isLoginPage && (
            <header className="shrink-0 bg-white border-b border-slate-100 px-4 py-3 flex justify-between items-center z-30 shadow-sm">
              <div className="flex items-center space-x-2">
                <span className="w-7 h-7 bg-emerald-600 rounded-xl flex items-center justify-center text-white text-xs font-black shadow-md shadow-emerald-600/25">⚡</span>
                <h1 className="text-xs font-black tracking-tight text-slate-900">
                  Shop Matries <span className="text-emerald-600">Food Admin</span>
                </h1>
              </div>
              <a href="https://food-30d.pages.dev/" target="_blank" className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-slate-200 transition">
                Customer App ↗
              </a>
            </header>
          )}

          {/* Scrollable Content Area */}
          <main className="flex-1 overflow-y-auto relative bg-slate-50/50 p-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {children}
          </main>

          {/* Stationary Bottom Navigation Bar (Hidden instantly on Login) */}
          {!isLoginPage && (
            <nav className="shrink-0 bg-white/95 backdrop-blur-md border-t border-slate-100 flex justify-around items-center py-2 px-0.5 z-35 shadow-lg">
              <Link 
                href="/" 
                className={`flex flex-col items-center py-1 px-1.5 rounded-xl transition ${pathname === '/' ? 'text-emerald-600 font-bold scale-105' : 'text-slate-400 font-medium hover:text-slate-600'}`}
              >
                <span className="text-sm">📦</span>
                <span className="text-[9px]">Orders</span>
              </Link>

              <Link 
                href="/restaurants" 
                className={`flex flex-col items-center py-1 px-1.5 rounded-xl transition ${pathname === '/restaurants' ? 'text-emerald-600 font-bold scale-105' : 'text-slate-400 font-medium hover:text-slate-600'}`}
              >
                <span className="text-sm">🍱</span>
                <span className="text-[9px]">Catalog</span>
              </Link>

              <Link 
                href="/add-sku" 
                className={`flex flex-col items-center py-1 px-1.5 rounded-xl transition ${pathname === '/add-sku' ? 'text-emerald-600 font-bold scale-105' : 'text-slate-400 font-medium hover:text-slate-600'}`}
              >
                <span className="text-sm">🍲</span>
                <span className="text-[9px]">Add Dish</span>
              </Link>

              <Link 
                href="/offers" 
                className={`flex flex-col items-center py-1 px-1.5 rounded-xl transition ${pathname === '/offers' ? 'text-emerald-600 font-bold scale-105' : 'text-slate-400 font-medium hover:text-slate-600'}`}
              >
                <span className="text-sm">🏷️</span>
                <span className="text-[9px]">Offers</span>
              </Link>

              <Link 
                href="/delivery-fee" 
                className={`flex flex-col items-center py-1 px-1.5 rounded-xl transition ${pathname === '/delivery-fee' ? 'text-emerald-600 font-bold scale-105' : 'text-slate-400 font-medium hover:text-slate-600'}`}
              >
                <span className="text-sm">🛵</span>
                <span className="text-[9px]">Delivery</span>
              </Link>
            </nav>
          )}

        </div>
      </body>
    </html>
  );
}