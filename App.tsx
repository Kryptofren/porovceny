
import React, { useState, useEffect } from 'react';
import { 
  Search, 
  ShoppingBasket, 
  ExternalLink, 
  Loader2, 
  AlertCircle, 
  TrendingDown, 
  Info, 
  Zap, 
  Lock, 
  Unlock, 
  History,
  AlertTriangle,
  RefreshCw,
  Copy
} from 'lucide-react';
import { searchPrices } from './services/geminiService';
import { SearchResult } from './types';
import StoreBadge from './components/StoreBadge';

const CATEGORIES = [
  { label: 'Maslo', color: 'bg-yellow-100 text-yellow-700' },
  { label: 'Mlieko', color: 'bg-blue-100 text-blue-700' },
  { label: 'Vajcia', color: 'bg-orange-100 text-orange-700' },
  { label: 'Olej', color: 'bg-amber-100 text-amber-700' },
  { label: 'Kuracie prsia', color: 'bg-red-100 text-red-700' },
  { label: 'Pivo', color: 'bg-yellow-50 text-yellow-800' },
];

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (localStorage.getItem('sliedic_auth') === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPassword = process.env.APP_PASSWORD || '2244';
    if (password === correctPassword) {
      setIsAuthenticated(true);
      localStorage.setItem('sliedic_auth', 'true');
    } else {
      setAuthError(true);
      setPassword('');
    }
  };

  const handleSearch = async (e?: React.FormEvent, directQuery?: string) => {
    if (e) e.preventDefault();
    const searchTerm = directQuery || query;
    if (!searchTerm.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await searchPrices(searchTerm);
      setResult(data);
      setQuery(searchTerm);
    } catch (err: any) {
      setError(err.message || 'Chyba pripojenia.');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl p-10 border border-slate-200">
          <div className="flex flex-col items-center mb-8">
            <div className="bg-green-600 p-5 rounded-3xl mb-4 shadow-xl shadow-green-200 rotate-3">
              <Lock className="text-white w-8 h-8" />
            </div>
            <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">Sliedič Vstup</h1>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="HESLO (APP_PASSWORD)"
              className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none text-center text-xl font-bold focus:border-green-500 transition-all"
              autoFocus
            />
            <button type="submit" className="w-full bg-slate-900 hover:bg-black text-white py-5 rounded-2xl font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg">
              Odomknúť aplikáciu
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBasket className="text-green-600 w-6 h-6" />
            <h1 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Cenový <span className="text-green-600">Sliedič</span></h1>
          </div>
          <button onClick={() => { localStorage.removeItem('sliedic_auth'); setIsAuthenticated(false); }} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
            <Unlock className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-8">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-black text-slate-900 mb-2 uppercase tracking-tight">Kde je to v akcii?</h2>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em]">Inteligentné vyhľadávanie v letákoch</p>
        </div>

        <form onSubmit={handleSearch} className="relative mb-12">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Zadajte potravinu (napr. maslo, mlieko, pivo...)"
            className="w-full pl-14 pr-36 py-6 bg-white border-2 border-slate-100 rounded-[2rem] shadow-xl focus:border-green-500 outline-none text-xl font-medium transition-all"
          />
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 w-6 h-6" />
          <button type="submit" disabled={loading} className="absolute right-3 top-1/2 -translate-y-1/2 bg-green-600 hover:bg-green-700 text-white px-8 py-3.5 rounded-2xl font-black uppercase text-sm tracking-wider disabled:opacity-50 transition-all active:scale-95">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sliediť'}
          </button>
        </form>

        {!result && !loading && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-12">
            {CATEGORIES.map((cat, i) => (
              <button key={i} onClick={() => handleSearch(undefined, cat.label)} className={`${cat.color} bg-opacity-40 p-6 rounded-3xl border-2 border-transparent hover:border-white hover:shadow-lg transition-all text-center group`}>
                <span className="block text-xs font-black uppercase tracking-widest group-hover:scale-105 transition-transform">{cat.label}</span>
              </button>
            ))}
          </div>
        )}

        {error && (
          <div className="mb-10 p-8 bg-white border-4 border-red-100 rounded-[2.5rem] shadow-xl animate-in zoom-in-95 duration-300">
            <div className="flex flex-col items-center text-center">
              <div className="bg-red-500 p-4 rounded-full mb-4">
                <AlertTriangle className="text-white w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-red-600 uppercase mb-2">Chyba v nastavení kľúča</h3>
              <p className="text-slate-600 font-bold text-sm mb-6 leading-relaxed">
                Google API hlási, že váš kľúč je neplatný. Toto sa stáva, ak je v kľúči chyba alebo medzera.
              </p>
              
              <div className="bg-slate-50 p-6 rounded-2xl w-full mb-6 text-left border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Technický detail:</p>
                <code className="text-[10px] text-red-500 break-all font-mono">{error}</code>
              </div>

              <div className="flex flex-col gap-3 w-full">
                <a href="https://aistudio.google.com/app/apikey" target="_blank" className="flex items-center justify-center gap-2 bg-green-600 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-green-700 transition-all">
                  <ExternalLink className="w-4 h-4" /> Získať nový kľúč
                </a>
                <button onClick={() => window.location.reload()} className="flex items-center justify-center gap-2 bg-slate-100 text-slate-600 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-200 transition-all">
                  <RefreshCw className="w-4 h-4" /> Skúsiť znova (Refresh)
                </button>
              </div>
              <p className="mt-4 text-[10px] text-slate-400 font-bold uppercase">Po zmene kľúča vo Verceli musíte urobiť "REDEPLOY"!</p>
            </div>
          </div>
        )}

        {loading && (
          <div className="py-24 flex flex-col items-center justify-center">
            <div className="relative">
              <div className="w-24 h-24 border-8 border-green-50 border-t-green-600 rounded-full animate-spin"></div>
              <ShoppingBasket className="w-10 h-10 text-green-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="mt-8 text-2xl font-black text-slate-800 uppercase tracking-tighter animate-pulse">Prehľadávam letáky...</p>
          </div>
        )}

        {result && !loading && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">
              <div className="p-8 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                  <TrendingDown className="text-green-600" /> Najlepšie ceny pre: {query}
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">
                      <th className="px-8 py-5">Obchod</th>
                      <th className="px-8 py-5">Produkt</th>
                      <th className="px-8 py-5">Cena</th>
                      <th className="px-8 py-5">Platnosť</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {result.offers.map((offer, i) => (
                      <tr key={i} className="hover:bg-slate-50/30 transition-colors">
                        <td className="px-8 py-6"><StoreBadge name={offer.store} /></td>
                        <td className="px-8 py-6 font-bold text-slate-800">{offer.product}</td>
                        <td className="px-8 py-6 font-black text-green-700 text-2xl tracking-tighter">{offer.price}</td>
                        <td className="px-8 py-6 text-xs text-slate-400 font-bold uppercase">{offer.validUntil}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-blue-600 p-8 rounded-[2rem] text-white shadow-xl shadow-blue-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-white/20 p-2 rounded-xl"><Info className="w-5 h-5" /></div>
                <h4 className="font-black uppercase tracking-widest text-sm">Zhrnutie od AI</h4>
              </div>
              <p className="text-blue-50 font-medium leading-relaxed italic">{result.text}</p>
            </div>
          </div>
        )}
      </main>

      <footer className="py-12 bg-white border-t border-slate-200">
        <div className="max-w-5xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">
            &copy; 2025 CENOVÝ SLIEDIČ SK
          </div>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2 text-green-500 font-black text-[10px] uppercase tracking-widest">
              <Zap className="w-4 h-4 fill-current" /> Powered by Gemini Flash 3.0
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
