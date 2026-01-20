
import React, { useState, useMemo, useEffect } from 'react';
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
  Coffee,
  Egg,
  Beef,
  Apple,
  Milk,
  UtensilsCrossed,
  Pizza,
  Carrot,
  Fish
} from 'lucide-react';
import { searchPrices } from './services/geminiService';
import { SearchResult, PriceOffer } from './types';
import StoreBadge from './components/StoreBadge';

const CATEGORIES = [
  { 
    title: "Základné",
    items: [
      { label: 'Maslo', icon: <Milk className="w-4 h-4" />, color: 'bg-yellow-100 text-yellow-700' },
      { label: 'Vajcia', icon: <Egg className="w-4 h-4" />, color: 'bg-orange-100 text-orange-700' },
      { label: 'Mlieko', icon: <Milk className="w-4 h-4" />, color: 'bg-blue-100 text-blue-700' },
      { label: 'Chlieb', icon: <UtensilsCrossed className="w-4 h-4" />, color: 'bg-amber-100 text-amber-700' },
    ]
  },
  { 
    title: "Čerstvé",
    items: [
      { label: 'Kuracie prsia', icon: <Beef className="w-4 h-4" />, color: 'bg-red-100 text-red-700' },
      { label: 'Jablká', icon: <Apple className="w-4 h-4" />, color: 'bg-green-100 text-green-700' },
      { label: 'Zemiaky', icon: <Carrot className="w-4 h-4" />, color: 'bg-orange-50 text-orange-800' },
      { label: 'Losos', icon: <Fish className="w-4 h-4" />, color: 'bg-pink-100 text-pink-700' },
    ]
  }
];

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  useEffect(() => {
    if (localStorage.getItem('sliedic_auth') === 'true') {
      setIsAuthenticated(true);
    }
    const savedHistory = localStorage.getItem('sliedic_history');
    if (savedHistory) {
      try { setSearchHistory(JSON.parse(savedHistory)); } catch (e) { console.error(e); }
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPassword = process.env.APP_PASSWORD || '2244';
    if (password === correctPassword) {
      setIsAuthenticated(true);
      setAuthError(false);
      localStorage.setItem('sliedic_auth', 'true');
    } else {
      setAuthError(true);
      setPassword('');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('sliedic_auth');
    setIsAuthenticated(false);
  };

  const addToHistory = (term: string) => {
    const cleaned = term.trim();
    if (!cleaned) return;
    setSearchHistory(prev => {
      const filtered = prev.filter(h => h.toLowerCase() !== cleaned.toLowerCase());
      const updated = [cleaned, ...filtered].slice(0, 10);
      localStorage.setItem('sliedic_history', JSON.stringify(updated));
      return updated;
    });
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
      addToHistory(searchTerm);
    } catch (err: any) {
      setError(err.message || 'Nastala neočakávaná chyba.');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-slate-100 animate-in fade-in zoom-in-95 duration-500">
          <div className="flex flex-col items-center mb-8">
            <div className="bg-green-600 p-4 rounded-2xl mb-4 shadow-lg shadow-green-200">
              <Lock className="text-white w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black text-slate-800 text-center uppercase tracking-tight">Sliedič Vstup</h1>
            <p className="text-slate-500 text-xs mt-2 text-center font-bold">Zadajte heslo z Vercelu (APP_PASSWORD).</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••"
              className={`w-full px-5 py-4 bg-slate-50 border-2 rounded-2xl outline-none transition-all text-center text-2xl tracking-[1em] font-black ${
                authError ? 'border-red-300 ring-4 ring-red-50' : 'border-slate-100 focus:border-green-500'
              }`}
              autoFocus
            />
            {authError && <p className="text-red-500 text-[10px] font-black uppercase text-center">Chybné heslo!</p>}
            <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-2xl font-black text-lg transition-all shadow-lg active:scale-95">
              Odomknúť
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.location.reload()}>
            <div className="bg-green-600 p-2 rounded-lg"><ShoppingBasket className="text-white w-5 h-5" /></div>
            <h1 className="text-lg font-black text-slate-800 uppercase tracking-tighter">Cenový <span className="text-green-600">Sliedič</span></h1>
          </div>
          <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><Unlock className="w-5 h-5" /></button>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-8">
        <section className="mb-10 text-center">
          <h2 className="text-4xl font-black text-slate-900 mb-2 tracking-tighter uppercase">Nákupný Návrh</h2>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-8">Analyzujeme akcie cez Google AI</p>
          
          <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto mb-10">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Čo chcete kúpiť? (napr. maslo, olej)"
              className="w-full pl-12 pr-32 py-5 bg-white border-2 border-slate-100 rounded-3xl shadow-xl focus:border-green-500 outline-none text-lg transition-all"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-6 h-6" />
            <button type="submit" disabled={loading} className="absolute right-3 top-1/2 -translate-y-1/2 bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-2xl font-black disabled:opacity-50 transition-all active:scale-95 shadow-lg">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'VYHĽADAŤ'}
            </button>
          </form>

          {!result && !loading && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              {CATEGORIES.map((cat, idx) => (
                <div key={idx}>
                  <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-4">{cat.title}</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
                    {cat.items.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => handleSearch(undefined, s.label)}
                        className={`flex flex-col items-center gap-2 p-5 rounded-3xl border-2 border-transparent hover:border-white hover:shadow-xl transition-all group ${s.color} bg-opacity-30`}
                      >
                        <span className="scale-125 group-hover:scale-150 transition-transform duration-300">{s.icon}</span>
                        <span className="text-[10px] font-black uppercase mt-1">{s.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {error && (
          <div className="mb-10 p-6 bg-red-50 border-2 border-red-100 rounded-3xl flex flex-col items-center text-center gap-3">
            <AlertCircle className="w-8 h-8 text-red-500 animate-pulse" />
            <div>
              <p className="text-red-800 font-black uppercase text-sm mb-1">{error}</p>
              <p className="text-red-600 text-[10px] font-bold">Skúste zadať iný názov alebo skontrolujte pripojenie.</p>
            </div>
          </div>
        )}

        {loading && (
          <div className="py-24 flex flex-col items-center">
            <div className="relative mb-6">
              <div className="w-20 h-20 border-4 border-green-100 border-t-green-600 rounded-full animate-spin"></div>
              <ShoppingBasket className="w-8 h-8 text-green-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="text-slate-800 font-black text-xl uppercase tracking-tighter">Sliedim v letákoch...</p>
          </div>
        )}

        {result && !loading && (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
            {result.offers.length > 0 ? (
              <div className="bg-white border border-slate-200 rounded-[2rem] shadow-2xl overflow-hidden">
                <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex flex-wrap justify-between items-center gap-4">
                  <h3 className="font-black text-slate-800 flex items-center gap-3 text-lg uppercase tracking-tight">
                    <TrendingDown className="w-6 h-6 text-green-600" /> Výsledky: <span className="text-green-600">{query}</span>
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-400 border-b border-slate-100">
                      <tr>
                        <th className="px-8 py-5">Obchod</th>
                        <th className="px-8 py-5">Produkt</th>
                        <th className="px-8 py-5 text-green-600">Cena</th>
                        <th className="px-8 py-5">Platnosť</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {result.offers.map((offer, i) => (
                        <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-8 py-6"><StoreBadge name={offer.store} /></td>
                          <td className="px-8 py-6 font-black text-slate-800 text-sm group-hover:text-green-700">{offer.product}</td>
                          <td className="px-8 py-6 font-black text-green-700 text-2xl tracking-tighter">{offer.price}</td>
                          <td className="px-8 py-6 text-[10px] text-slate-400 font-black uppercase">{offer.validUntil}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="p-10 bg-white rounded-[2rem] border border-slate-200 text-center">
                <p className="text-slate-400 font-black uppercase">Žiadne konkrétne akcie v tabuľke, prečítajte si AI odporúčanie nižšie.</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-blue-50/50 p-8 rounded-[2rem] border border-blue-100">
                <h4 className="text-[10px] font-black text-blue-400 uppercase mb-4 flex items-center gap-2"><Info className="w-4 h-4" /> AI Odporúčanie</h4>
                <p className="text-sm text-slate-700 leading-relaxed font-bold italic whitespace-pre-line">{result.text}</p>
              </div>
              <div className="bg-white p-8 border border-slate-200 rounded-[2rem]">
                <h4 className="text-[10px] font-black text-slate-400 uppercase mb-4 flex items-center gap-2"><ExternalLink className="w-4 h-4 text-green-500" /> Zdroje dát</h4>
                <div className="space-y-3">
                  {result.sources.length > 0 ? result.sources.map((s, i) => (
                    <a key={i} href={s.uri} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between text-[11px] font-black text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-100 hover:border-green-500 hover:bg-white transition-all group">
                      <span className="truncate pr-4 uppercase">{s.title}</span>
                      <ExternalLink className="w-4 h-4 shrink-0 text-slate-300 group-hover:text-green-600" />
                    </a>
                  )) : (
                    <p className="text-[10px] text-slate-400 font-bold uppercase py-4">Dáta čerpané z interných záznamov modelu.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="mt-auto py-10 bg-white border-t border-slate-100">
        <div className="max-w-5xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
          <span>&copy; 2025 SLIEDIČ SK</span>
          <span className="flex items-center gap-2 text-green-500"><Zap className="w-4 h-4 fill-current" /> GEMINI AI SMART ENGINE</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
