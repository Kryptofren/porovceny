
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  ShoppingBasket, 
  ExternalLink, 
  Loader2, 
  AlertCircle, 
  TrendingDown, 
  Info, 
  ChevronDown, 
  ChevronUp, 
  Zap, 
  Lock, 
  Unlock, 
  History, 
  Trash2,
  Coffee,
  Egg,
  Beef,
  Apple,
  Milk,
  UtensilsCrossed
} from 'lucide-react';
import { searchPrices } from './services/geminiService';
import { SearchResult, PriceOffer } from './types';
import StoreBadge from './components/StoreBadge';

type SortKey = keyof PriceOffer;

const SUGGESTIONS = [
  { label: 'Maslo', icon: <Milk className="w-4 h-4" />, color: 'bg-yellow-100 text-yellow-700' },
  { label: 'Vajcia', icon: <Egg className="w-4 h-4" />, color: 'bg-orange-100 text-orange-700' },
  { label: 'Mlieko', icon: <Milk className="w-4 h-4" />, color: 'bg-blue-100 text-blue-700' },
  { label: 'Kuracie prsia', icon: <Beef className="w-4 h-4" />, color: 'bg-red-100 text-red-700' },
  { label: 'Zemiaky', icon: <UtensilsCrossed className="w-4 h-4" />, color: 'bg-amber-100 text-amber-700' },
  { label: 'Jablká', icon: <Apple className="w-4 h-4" />, color: 'bg-green-100 text-green-700' },
  { label: 'Káva', icon: <Coffee className="w-4 h-4" />, color: 'bg-stone-100 text-stone-700' },
  { label: 'Pivo', icon: <Zap className="w-4 h-4" />, color: 'bg-yellow-50 text-yellow-600' },
];

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('price');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterStore, setFilterStore] = useState<string>('All');
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
      const updated = [cleaned, ...filtered].slice(0, 8);
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
      setError(err.message || 'Nastala chyba pri hľadaní.');
    } finally {
      setLoading(false);
    }
  };

  const sortedAndFilteredOffers = useMemo(() => {
    if (!result?.offers) return [];
    let filtered = result.offers;
    if (filterStore !== 'All') {
      filtered = filtered.filter(o => o.store.toLowerCase().includes(filterStore.toLowerCase()));
    }
    return [...filtered].sort((a, b) => {
      const valA = (a[sortKey] || '').toString().toLowerCase();
      const valB = (b[sortKey] || '').toString().toLowerCase();
      if (sortKey === 'price') {
        const numA = parseFloat(valA.replace(/[^0-9.,]/g, '').replace(',', '.'));
        const numB = parseFloat(valB.replace(/[^0-9.,]/g, '').replace(',', '.'));
        if (!isNaN(numA) && !isNaN(numB)) return sortOrder === 'asc' ? numA - numB : numB - numA;
      }
      return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });
  }, [result, sortKey, sortOrder, filterStore]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-slate-100 animate-in fade-in zoom-in-95 duration-500">
          <div className="flex flex-col items-center mb-8">
            <div className="bg-green-600 p-4 rounded-2xl mb-4 shadow-lg shadow-green-200">
              <Lock className="text-white w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black text-slate-800 text-center">Vstup do aplikácie</h1>
            <p className="text-slate-500 text-sm mt-2 text-center">Zadajte prístupové heslo (APP_PASSWORD).</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Heslo"
              className={`w-full px-5 py-4 bg-slate-50 border-2 rounded-2xl outline-none transition-all text-center text-xl tracking-widest font-bold ${
                authError ? 'border-red-300 ring-4 ring-red-50' : 'border-slate-100 focus:border-green-500'
              }`}
              autoFocus
            />
            {authError && <p className="text-red-500 text-xs font-bold text-center">Nesprávne heslo.</p>}
            <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-2xl font-black text-lg transition-all shadow-lg active:scale-[0.98]">
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
            <h1 className="text-lg font-bold text-slate-800">Cenový <span className="text-green-600">Sliedič</span></h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-[10px] font-black border border-blue-100 uppercase">
              <Zap className="w-3 h-3 fill-current" /> Free Engine
            </div>
            <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-500 transition-colors" title="Odhlásiť sa">
              <Unlock className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-8">
        <section className="mb-10 text-center">
          <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Hľadač akciových cien</h2>
          <p className="text-slate-500 mb-8">AI analýza letákov v reálnom čase.</p>
          
          <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto mb-8">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Čo dnes hľadáte? (napr. maslo, mlieko)"
              className="w-full pl-12 pr-32 py-5 bg-white border border-slate-200 rounded-3xl shadow-sm focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none text-lg transition-all"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-6 h-6" />
            <button type="submit" disabled={loading} className="absolute right-3 top-1/2 -translate-y-1/2 bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-2xl font-bold disabled:opacity-50 transition-all shadow-md active:scale-95">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sliediť'}
            </button>
          </form>

          {/* Rýchle návrhy */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
            {SUGGESTIONS.map((s, i) => (
              <button
                key={i}
                onClick={() => handleSearch(undefined, s.label)}
                disabled={loading}
                className={`flex items-center justify-center gap-2 p-3 rounded-2xl border border-transparent hover:border-slate-200 hover:bg-white transition-all shadow-sm group ${s.color} bg-opacity-40`}
              >
                <span className="group-hover:scale-110 transition-transform">{s.icon}</span>
                <span className="text-xs font-black uppercase tracking-wide">{s.label}</span>
              </button>
            ))}
          </div>
        </section>

        {searchHistory.length > 0 && (
          <section className="mb-8 animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <History className="w-3 h-3" /> Nedávno hľadané
              </h3>
              <button onClick={() => { setSearchHistory([]); localStorage.removeItem('sliedic_history'); }} className="text-[10px] text-red-400 font-bold uppercase hover:text-red-600 transition-colors">Vymazať</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {searchHistory.map((term, i) => (
                <button key={i} onClick={() => handleSearch(undefined, term)} className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:border-green-500 hover:text-green-600 transition-all shadow-sm">
                  {term}
                </button>
              ))}
            </div>
          </section>
        )}

        {error && (
          <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-2xl flex items-center gap-3 text-orange-800 text-sm font-bold shadow-sm">
            <AlertCircle className="w-5 h-5 shrink-0" /> {error}
          </div>
        )}

        {loading && (
          <div className="py-24 flex flex-col items-center animate-pulse">
            <div className="relative">
              <Loader2 className="w-16 h-16 text-green-600 animate-spin mb-4" />
              <ShoppingBasket className="w-6 h-6 text-green-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="text-slate-800 font-black text-lg">Hľadáme najlepšie akcie...</p>
            <p className="text-slate-400 text-sm">Prehľadávame Tesco, Lidl, Kaufland a ďalšie.</p>
          </div>
        )}

        {result && !loading && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
              <div className="p-5 bg-slate-50/50 border-b border-slate-100 flex flex-wrap justify-between items-center gap-4">
                <h3 className="font-black text-slate-800 flex items-center gap-2 text-sm md:text-base">
                  <TrendingDown className="w-5 h-5 text-green-600" /> Aktuálne ceny: <span className="text-green-600 italic">"{query}"</span>
                </h3>
                <div className="flex items-center gap-2">
                   <span className="text-[10px] font-black text-slate-400 uppercase">Obchod:</span>
                  <select value={filterStore} onChange={(e) => setFilterStore(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-black outline-none shadow-sm cursor-pointer hover:border-green-500 transition-colors">
                    <option value="All">Všetky</option>
                    {Array.from(new Set(result.offers.map(o => o.store))).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-400 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4">Obchod</th>
                      <th className="px-6 py-4">Produkt</th>
                      <th className="px-6 py-4 cursor-pointer hover:text-green-600 transition-colors" onClick={() => { setSortKey('price'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}>
                        Cena {sortKey === 'price' && (sortOrder === 'asc' ? '↓' : '↑')}
                      </th>
                      <th className="px-6 py-4">Platnosť</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sortedAndFilteredOffers.map((offer, i) => (
                      <tr key={i} className="hover:bg-slate-50/30 transition-colors group">
                        <td className="px-6 py-5"><StoreBadge name={offer.store} /></td>
                        <td className="px-6 py-5 font-bold text-slate-800 text-sm group-hover:text-green-700 transition-colors">{offer.product}</td>
                        <td className="px-6 py-5 font-black text-green-700 text-lg">{offer.price}</td>
                        <td className="px-6 py-5 text-[10px] text-slate-400 font-black uppercase tracking-tighter">{offer.validUntil}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-7 border border-slate-200 rounded-3xl shadow-sm">
                <h4 className="text-[10px] font-black text-slate-400 uppercase mb-4 flex items-center gap-2"><Info className="w-4 h-4 text-blue-500" /> Odporúčanie AI</h4>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">{result.text.split('|')[0]}</p>
              </div>
              <div className="bg-white p-7 border border-slate-200 rounded-3xl shadow-sm">
                <h4 className="text-[10px] font-black text-slate-400 uppercase mb-4 flex items-center gap-2"><ExternalLink className="w-4 h-4 text-green-500" /> Zdroje informácií</h4>
                <div className="space-y-2.5">
                  {result.sources.length > 0 ? result.sources.map((s, i) => (
                    <a key={i} href={s.uri} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between text-[11px] font-bold text-slate-700 bg-slate-50 p-3 rounded-2xl border border-slate-100 hover:border-green-500 hover:bg-white transition-all group">
                      <span className="truncate pr-4">{s.title}</span>
                      <ExternalLink className="w-3 h-3 shrink-0 text-slate-300 group-hover:text-green-600 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </a>
                  )) : (
                    <div className="text-xs text-slate-400 italic text-center py-4">Informácie z globálneho indexu AI letákov.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {!result && !loading && !error && (
          <div className="py-24 text-center animate-in fade-in zoom-in-95 duration-700">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <ShoppingBasket className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="font-black text-slate-800 text-2xl mb-2">Pripravený na nákup?</h3>
            <p className="text-slate-500 text-sm max-w-sm mx-auto leading-relaxed">
              Zadajte potravinu alebo vyberte jednu z kategórií vyššie a my preveríme aktuálne letáky slovenských reťazcov.
            </p>
          </div>
        )}
      </main>

      <footer className="mt-auto py-8 border-t border-slate-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center md:text-left">
          <div className="flex flex-col gap-1">
            <span>&copy; 2025 Sliedič SK</span>
            <span className="text-[8px] opacity-50">Všetky ceny sú informatívne</span>
          </div>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5 text-green-500 bg-green-50 px-3 py-1 rounded-full"><Zap className="w-3 h-3 fill-current" /> Gemini 3.0 Real-time</span>
            <span className="hidden sm:inline">Analyzujeme: Tesco, Lidl, Kaufland, Billa, COOP</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
