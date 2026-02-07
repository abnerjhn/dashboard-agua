import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell
} from 'recharts';
import { 
  Droplets, Map as MapIcon, BarChart3, FileText, 
  Factory, Calendar, AlertCircle, CheckCircle2,
  Filter
} from 'lucide-react';

// --- CONFIGURACIÓN DE SUPABASE ---
// Este código es el correcto para Vercel/Vite.
// Usa import.meta.env para leer las variables de entorno.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

// Inicializamos el cliente. 
// Si las variables no existen (como en este chat), no fallará catastróficamente, 
// pero mostrará un error en consola.
let supabase = null;
try {
  if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
  } else {
    console.warn("Faltan variables de entorno de Supabase.");
  }
} catch (error) {
  console.error("Error al inicializar Supabase:", error);
}

const COLORS = ['#0ea5e9', '#22c55e', '#eab308', '#f97316', '#ef4444', '#8b5cf6', '#6366f1'];

// --- DATOS DE RESPALDO (Fallback) ---
// Se usarán solo si la conexión a Supabase falla o no hay datos.
const FALLBACK_DATA = [
  { id: 1, titular: "Sin conexión a DB", uso: "Muestra", vol_autorizado: 1000, lat: 13.7, lon: -89.2, depto: "San Salvador", estado_pozo: "Inactivo" }
];

// --- COMPONENTES AUXILIARES ---

const StatCard = ({ title, value, subtext, icon: Icon, colorClass }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-start justify-between">
    <div>
      <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
      {subtext && <p className="text-xs text-slate-400 mt-2">{subtext}</p>}
    </div>
    <div className={`p-3 rounded-lg ${colorClass}`}>
      <Icon size={24} className="text-white" />
    </div>
  </div>
);

// --- COMPONENTE DE MAPA ---

const CustomGeoMap = ({ data }) => {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const minLon = -90.2;
  const maxLon = -87.6;
  const minLat = 13.0;
  const maxLat = 14.5;
  const width = 800;
  const height = 400;

  const getX = (lon) => ((lon - minLon) / (maxLon - minLon)) * width;
  const getY = (lat) => height - ((lat - minLat) / (maxLat - minLat)) * height;

  return (
    <div className="relative w-full h-full bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
      <div className="absolute top-4 right-4 bg-white/90 p-2 rounded text-xs text-slate-500 z-10 shadow-sm">
        El Salvador (Proyección Simple)
      </div>
      
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full cursor-crosshair">
        <path 
          d={`M ${getX(-90.1)} ${getY(13.6)} Q ${getX(-89.0)} ${getY(14.4)} ${getX(-87.7)} ${getY(13.5)} T ${getX(-88.0)} ${getY(13.1)} T ${getX(-90.0)} ${getY(13.5)} Z`} 
          fill="#e2e8f0" 
          stroke="#cbd5e1"
        />
        {data.map((point, index) => (
          <g 
            key={point.id || index}
            onMouseEnter={() => setHoveredPoint(point)}
            onMouseLeave={() => setHoveredPoint(null)}
          >
            <circle
              cx={getX(point.lon)}
              cy={getY(point.lat)}
              r={hoveredPoint?.id === point.id ? 8 : 4}
              fill={point.estado_pozo?.includes('Activo') || point.estado_pozo?.includes('Completado') ? '#22c55e' : '#eab308'}
              stroke="white"
              strokeWidth={1.5}
              className="transition-all duration-300 ease-in-out hover:opacity-100 opacity-70"
            />
          </g>
        ))}
      </svg>

      {hoveredPoint && (
        <div 
          className="absolute bg-white p-3 rounded-lg shadow-xl border border-slate-200 pointer-events-none z-20 w-48"
          style={{ 
            left: `${(getX(hoveredPoint.lon) / width) * 100}%`, 
            top: `${(getY(hoveredPoint.lat) / height) * 100}%`,
            transform: 'translate(-50%, -120%)'
          }}
        >
          <h4 className="font-bold text-xs text-blue-700 line-clamp-2">{hoveredPoint.titular}</h4>
          <div className="text-[10px] text-slate-600 mt-1 space-y-0.5">
            <p><span className="font-semibold">Uso:</span> {hoveredPoint.uso}</p>
            <p><span className="font-semibold">Vol:</span> {hoveredPoint.vol_autorizado?.toLocaleString()} m³</p>
          </div>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-white"></div>
        </div>
      )}
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedSector, setSelectedSector] = useState('Todos');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);

    if (!supabase) {
      console.warn("No hay cliente de Supabase configurado.");
      setErrorMsg("Error de configuración: Faltan claves API.");
      setData(FALLBACK_DATA);
      setLoading(false);
      return;
    }

    try {
      // Nombre exacto de tu tabla en Supabase: 'pozos'
      const { data: pozos, error } = await supabase
        .from('pozos')
        .select('*');

      if (error) throw error;

      if (pozos && pozos.length > 0) {
        // Mapeo de columnas CSV -> Estado React
        const formattedData = pozos.map(p => ({
          id: p.id || p.FID || Math.random(),
          titular: p.Titular || "Desconocido",
          uso: p.Tipo_Uso || "Sin clasificar",
          vol_autorizado: Number(p.Votor_m3_a) || 0,
          lat: Number(p.Lat) || 0,
          lon: Number(p.Lon) || 0,
          depto: p.Departamen || p.NOM_DPTO || "N/A",
          municipio: p.Municipio || p.NOM_MUN || "N/A",
          plazo: Number(p.Plazo_otor) || 0,
          vencimiento: p.Venc_perm ? new Date(p.Venc_perm).toLocaleDateString() : "N/A",
          estado_pozo: p.Estado_can || "Desconocido",
          fuente: p.Tipo_Fuent || "Subterránea"
        }));
        setData(formattedData);
        setErrorMsg(null);
      } else {
        console.warn("La tabla 'pozos' está vacía.");
        setErrorMsg("Conectado, pero no hay datos en la tabla.");
        setData([]);
      }
    } catch (error) {
      console.error("Error obteniendo datos:", error);
      setErrorMsg("Error de conexión a Supabase. Revisa la consola.");
      setData(FALLBACK_DATA);
    } finally {
      setLoading(false);
    }
  }

  // --- LÓGICA DE PROCESAMIENTO ---
  
  const filteredData = useMemo(() => {
    if (selectedSector === 'Todos') return data;
    return data.filter(item => item.uso === selectedSector);
  }, [selectedSector, data]);

  const dataBySector = useMemo(() => {
    const grouped = filteredData.reduce((acc, curr) => {
      acc[curr.uso] = (acc[curr.uso] || 0) + curr.vol_autorizado;
      return acc;
    }, {});
    return Object.keys(grouped).map(key => ({ name: key, value: grouped[key] })).sort((a,b) => b.value - a.value);
  }, [filteredData]);

  const topCompanies = useMemo(() => {
    return [...filteredData]
      .sort((a, b) => b.vol_autorizado - a.vol_autorizado)
      .slice(0, 5)
      .map(item => ({
        name: item.titular.length > 15 ? item.titular.substring(0, 15) + '...' : item.titular,
        full_name: item.titular,
        volumen: item.vol_autorizado
      }));
  }, [filteredData]);

  const totalVolume = filteredData.reduce((sum, item) => sum + item.vol_autorizado, 0);
  const totalWells = filteredData.length;
  const avgDuration = totalWells > 0 ? (filteredData.reduce((sum, item) => sum + item.plazo, 0) / totalWells).toFixed(1) : 0;
  
  const uniqueSectors = ['Todos', ...new Set(data.map(d => d.uso).filter(Boolean))];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 gap-2">
        <div className="w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        Cargando datos hídricos...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      
      {/* HEADER */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Droplets className="text-white h-6 w-6" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-cyan-600">
              Gestión Hídrica El Salvador
            </h1>
          </div>
          
          <nav className="hidden md:flex space-x-1">
            {['dashboard', 'mapa', 'datos'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab 
                    ? 'bg-blue-50 text-blue-700' 
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* ERROR BANNER */}
      {errorMsg && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2">
          <div className="max-w-7xl mx-auto flex items-center gap-2 text-amber-800 text-sm">
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* FILTERS */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 text-slate-600">
            <Filter size={20} />
            <span className="font-medium">Filtro por Rubro:</span>
          </div>
          <div className="flex gap-4 w-full sm:w-auto">
            <select 
              className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border bg-slate-50"
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
            >
              {uniqueSectors.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* KPI CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard title="Volumen Autorizado Total" value={`${(totalVolume / 1000000).toFixed(2)} M m³`} subtext="Metros cúbicos anuales" icon={Droplets} colorClass="bg-blue-500" />
              <StatCard title="Permisos Activos" value={totalWells} subtext="Pozos registrados" icon={FileText} colorClass="bg-emerald-500" />
              <StatCard title="Plazo Promedio" value={`${avgDuration} Años`} subtext="Duración media" icon={Calendar} colorClass="bg-amber-500" />
              <StatCard title="Mayor Extractor" value={topCompanies[0]?.name.split(' ')[0] || "N/A"} subtext={topCompanies[0] ? `${(topCompanies[0]?.volumen / 1000).toFixed(1)}k m³` : "-"} icon={Factory} colorClass="bg-indigo-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><Factory size={20} className="text-blue-500"/>Volumen por Rubro</h3>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={dataBySector} cx="50%" cy="50%" innerRadius={60} outerRadius={100} fill="#8884d8" paddingAngle={5} dataKey="value" label={({name, percent}) => percent > 0.1 ? `${name}` : ''}>
                        {dataBySector.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                      </Pie>
                      <RechartsTooltip formatter={(value) => `${value.toLocaleString()} m³`} />
                      <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><BarChart3 size={20} className="text-emerald-500"/>Top 5 Empresas</h3>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={topCompanies} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={100} style={{fontSize: '11px'}} />
                      <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none' }} formatter={(value) => [`${value.toLocaleString()} m³`, 'Volumen']} />
                      <Bar dataKey="volumen" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20}>
                        {topCompanies.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'mapa' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden h-[600px] flex flex-col">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50"><h3 className="font-bold text-slate-700 flex items-center gap-2"><MapIcon size={18} /> Geolocalización de Fuentes</h3><span className="text-xs text-slate-500 bg-white px-2 py-1 rounded border">{filteredData.length} Puntos visibles</span></div>
            <div className="flex-1 relative p-4 bg-slate-100"><CustomGeoMap data={filteredData} /></div>
          </div>
        )}

        {activeTab === 'datos' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
             <div className="p-6 border-b border-slate-100"><h3 className="font-bold text-lg text-slate-800">Detalle de Autorizaciones</h3></div>
             <div className="overflow-x-auto">
               <table className="min-w-full divide-y divide-slate-200">
                 <thead className="bg-slate-50">
                   <tr>
                     <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Titular</th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Rubro</th>
                     <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Volumen (m³)</th>
                     <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Estado</th>
                   </tr>
                 </thead>
                 <tbody className="bg-white divide-y divide-slate-200">
                   {filteredData.map((item, idx) => (
                     <tr key={item.id || idx} className="hover:bg-slate-50 transition-colors">
                       <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{item.titular}</td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500"><span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold">{item.uso}</span></td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 text-right font-mono">{item.vol_autorizado.toLocaleString()}</td>
                       <td className="px-6 py-4 whitespace-nowrap text-center"><span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${item.estado_pozo?.includes('Activo') ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{item.estado_pozo}</span></td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </div>
        )}
      </main>
    </div>
  );
}