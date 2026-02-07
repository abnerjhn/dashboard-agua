import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell
} from 'recharts';
import { 
  Droplets, Map as MapIcon, BarChart3, FileText, 
  Factory, Calendar, AlertCircle, CheckCircle2,
  Filter, X, MapPin, Info, Layers, MousePointerClick, ChevronRight,
  Sun, Moon, Image as ImageIcon, ChevronDown, CheckSquare, Square, ExternalLink
} from 'lucide-react';

// --- IMPORTACIONES DE LEAFLET ---
// Estas líneas funcionarán en tu PC aunque aquí marquen error
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// --- CONFIGURACIÓN DE SUPABASE ---
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

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
const FALLBACK_DATA = [
  { 
    id: 1, 
    titular: "Sin conexión a DB", 
    uso: "Muestra", 
    vol_autorizado: 1000, 
    lat: 13.7, 
    lon: -89.2, 
    depto: "San Salvador", 
    municipio: "San Salvador", 
    distrito: "San Salvador", 
    ubi_geogra: "Zona Central", 
    cuenca: "Lempa",
    estado_pozo: "Inactivo" 
  }
];

// --- COMPONENTE SELECTOR MÚLTIPLE (CHECKBOXES) ---
const MultiSelect = ({ label, options, selectedValues, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (value) => {
    const newSelection = selectedValues.includes(value)
      ? selectedValues.filter(item => item !== value)
      : [...selectedValues, value];
    onChange(newSelection);
  };

  return (
    <div className="relative w-full sm:w-auto min-w-[200px]" ref={containerRef}>
      <label className="block text-xs font-bold text-slate-500 mb-1 ml-1">{label}</label>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all shadow-sm"
      >
        <span className="truncate">
          {selectedValues.length === 0 
            ? "Todos" 
            : `${selectedValues.length} seleccionados`}
        </span>
        <ChevronDown size={16} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-[1001] mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
          {options.length > 0 ? (
            options.map((option) => (
              <div 
                key={option} 
                onClick={() => toggleOption(option)}
                className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0"
              >
                {selectedValues.includes(option) 
                  ? <CheckSquare size={16} className="text-blue-600 flex-shrink-0" /> 
                  : <Square size={16} className="text-slate-300 flex-shrink-0" />}
                <span className={`text-sm truncate ${selectedValues.includes(option) ? 'text-blue-700 font-medium' : 'text-slate-600'}`}>
                  {option}
                </span>
              </div>
            ))
          ) : (
            <div className="px-3 py-2 text-xs text-slate-400 italic">No hay opciones disponibles</div>
          )}
        </div>
      )}
    </div>
  );
};

// --- COMPONENTES AUXILIARES ---
const StatCard = ({ title, value, subtext, icon: Icon, colorClass }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-start justify-between hover:shadow-md transition-shadow">
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

// --- COMPONENTE MODAL (FICHA DESCRIPTIVA AMPLIADA) ---
const DetailModal = ({ item, onClose }) => {
  if (!item) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[1000] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-slate-50 border-b border-slate-100 p-6 flex justify-between items-start">
          <div className="flex gap-4 items-start">
            <div className="bg-blue-100 p-3 rounded-xl h-fit">
              <FileText className="text-blue-600" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 leading-tight">{item.titular}</h2>
              <p className="text-sm text-slate-500 mt-1 flex flex-wrap items-center gap-2">
                <span className="font-mono bg-slate-200 px-1.5 py-0.5 rounded text-xs text-slate-600">ID: {item.id}</span>
                <span className="text-slate-300">|</span>
                <span className="font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full text-xs border border-blue-100">{item.uso}</span>
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Contenido Scrollable */}
        <div className="p-6 overflow-y-auto bg-slate-50/50">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* COLUMNA 1: Datos Generales y Ubicación */}
            <div className="space-y-6">
              
              {/* Tarjeta de Estado */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-4">
                  <Info size={14} /> Estado del Permiso
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-slate-500 block mb-1">Estado Pozo</span>
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      item.estado_pozo?.includes('Activo') || item.estado_pozo?.includes('Completado') ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {item.estado_pozo}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block mb-1">Vencimiento</span>
                    <span className={`text-sm font-medium ${new Date(item.vencimiento) < new Date() ? 'text-red-600' : 'text-slate-700'}`}>
                      {item.vencimiento}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block mb-1">Plazo</span>
                    <span className="text-sm font-medium text-slate-700">{item.plazo} Años</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block mb-1">Fuente</span>
                    <span className="text-sm font-medium text-slate-700">{item.fuente}</span>
                  </div>
                </div>
              </div>

              {/* Tarjeta de Ubicación */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-4">
                  <MapPin size={14} /> Ubicación Geográfica
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between border-b border-slate-50 pb-2">
                    <span className="text-slate-500">Departamento:</span>
                    <span className="font-semibold text-slate-700">{item.depto}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-50 pb-2">
                    <span className="text-slate-500">Municipio:</span>
                    <span className="font-medium text-slate-700">{item.municipio}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-50 pb-2">
                    <span className="text-slate-500">Distrito:</span>
                    <span className="font-medium text-slate-700">{item.distrito}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-50 pb-2">
                    <span className="text-slate-500">Cuenca:</span>
                    <span className="font-medium text-slate-700 text-blue-600">{item.cuenca}</span>
                  </div>
                  
                  <div className="mt-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="text-xs text-slate-400 block mb-1 uppercase">Ubi. Geográfica Específica</span>
                    <p className="text-sm font-medium text-slate-800 leading-snug">
                      {item.ubi_geogra}
                    </p>
                  </div>

                  <div className="flex gap-2 mt-2">
                    <span className="px-2 py-1 bg-slate-100 rounded text-xs font-mono text-slate-600">Lat: {item.lat}</span>
                    <span className="px-2 py-1 bg-slate-100 rounded text-xs font-mono text-slate-600">Lon: {item.lon}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* COLUMNA 2: Volúmenes e Historial */}
            <div className="space-y-6">
              
              {/* Balance Hídrico */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-4">
                  <BarChart3 size={14} /> Balance Hídrico (m³/año)
                </h3>
                
                <div className="space-y-3">
                  {/* Solicitado */}
                  <div className="flex justify-between items-center p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-xs font-medium text-slate-500 uppercase">Vol. Solicitado</span>
                    <span className="font-mono text-lg font-bold text-slate-700">
                      {item.vol_solicitado?.toLocaleString()}
                    </span>
                  </div>

                  {/* Autorizado */}
                  <div className="flex justify-between items-center p-3 rounded-lg bg-blue-50 border border-blue-100 relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
                    <span className="text-xs font-bold text-blue-600 uppercase ml-2">Vol. Autorizado</span>
                    <span className="font-mono text-xl font-bold text-blue-700">
                      {item.vol_autorizado?.toLocaleString()}
                    </span>
                  </div>

                  {/* Consumido */}
                  <div className="flex justify-between items-center p-3 rounded-lg bg-green-50 border border-green-100 relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500"></div>
                    <span className="text-xs font-bold text-green-600 uppercase ml-2">Vol. Consumido</span>
                    <span className="font-mono text-xl font-bold text-green-700">
                      {item.vol_consumido?.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Historial 5 Años */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-4">
                  <Calendar size={14} /> Historial de Consumo (Últimos 5 años)
                </h3>
                <div className="grid grid-cols-5 gap-2">
                  {[item.vcAn1, item.vcAn2, item.vcAn3, item.vcAn4, item.vcAn5].map((val, idx) => (
                    <div key={idx} className="flex flex-col items-center">
                      {/* Barra visual simple */}
                      <div className="w-full bg-slate-100 rounded-t-sm h-16 relative flex items-end justify-center overflow-hidden mb-2">
                        <div 
                          className="w-full bg-blue-400 opacity-80" 
                          style={{ 
                            height: `${Math.min(((val || 0) / (item.vol_autorizado || 1)) * 100, 100)}%`,
                            transition: 'height 0.5s ease'
                          }}
                        ></div>
                      </div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Año {idx + 1}</span>
                      <span className="text-xs font-mono font-medium text-slate-700 mt-0.5">
                        {val > 0 ? (val >= 1000 ? (val/1000).toFixed(1) + 'k' : val) : '-'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg font-medium transition-colors shadow-sm"
          >
            Cerrar Ficha
          </button>
        </div>
      </div>
    </div>
  );
};

// --- COMPONENTE DE MAPA LEAFLET ---
const RealMap = ({ data, onPointClick }) => {
  const center = [13.7, -88.9];
  const [mapStyle, setMapStyle] = useState('light');

  const MAP_STYLES = {
    light: {
      url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      attribution: '&copy; OpenStreetMap &copy; CARTO',
    },
    dark: {
      url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      attribution: '&copy; OpenStreetMap &copy; CARTO',
    },
    satellite: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: '&copy; Esri',
    }
  };

  return (
    <div className="relative w-full h-full bg-slate-100 rounded-lg overflow-hidden border border-slate-200 z-0">
      
      <div className="absolute top-4 right-4 bg-white/95 p-1.5 rounded-lg shadow-lg border border-slate-200 z-[999] flex gap-1">
        <button onClick={() => setMapStyle('light')} className={`p-2 rounded-md transition-all ${mapStyle === 'light' ? 'bg-blue-100 text-blue-600' : 'text-slate-500 hover:bg-slate-100'}`} title="Claro"><Sun size={18} /></button>
        <button onClick={() => setMapStyle('dark')} className={`p-2 rounded-md transition-all ${mapStyle === 'dark' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:bg-slate-100'}`} title="Oscuro"><Moon size={18} /></button>
        <button onClick={() => setMapStyle('satellite')} className={`p-2 rounded-md transition-all ${mapStyle === 'satellite' ? 'bg-green-100 text-green-700' : 'text-slate-500 hover:bg-slate-100'}`} title="Satélite"><ImageIcon size={18} /></button>
      </div>

      <div className="absolute bottom-4 left-4 bg-white/95 p-3 rounded-lg text-xs shadow-lg border border-slate-200 z-[999] space-y-2 pointer-events-none">
        <h4 className="font-bold text-slate-700 border-b border-slate-100 pb-1 mb-1 flex items-center gap-1"><Layers size={12}/> Leyenda</h4>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-green-500 border border-white shadow-sm"></span><span className="text-slate-600 font-medium">Activo / Completado</span></div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-yellow-500 border border-white shadow-sm"></span><span className="text-slate-600 font-medium">En Proceso / Otros</span></div>
      </div>

      <MapContainer center={center} zoom={9} style={{ height: '100%', width: '100%' }} scrollWheelZoom={true}>
        <TileLayer key={mapStyle} attribution={MAP_STYLES[mapStyle].attribution} url={MAP_STYLES[mapStyle].url} />
        {data.map((point) => {
          if (!point.lat || !point.lon) return null;
          const isActive = point.estado_pozo?.includes('Activo') || point.estado_pozo?.includes('Completado');
          const color = isActive ? '#22c55e' : '#eab308'; 

          return (
            <CircleMarker
              key={point.id}
              center={[point.lat, point.lon]}
              radius={mapStyle === 'satellite' ? 8 : 6}
              pathOptions={{ color: '#ffffff', weight: 1.5, fillColor: color, fillOpacity: 0.85 }}
            >
              <Tooltip direction="top" offset={[0, -5]} opacity={1}><span className="font-bold text-xs">{point.titular}</span></Tooltip>
              <Popup>
                <div className="p-1 min-w-[200px] font-sans">
                  <h4 className="font-bold text-sm text-slate-800 mb-2 border-b pb-1 pr-4">{point.titular}</h4>
                  <div className="space-y-2 mb-3">
                    <div className="flex justify-between text-xs"><span className="text-slate-500">Uso:</span><span className="font-medium text-slate-700">{point.uso}</span></div>
                    <div className="flex justify-between text-xs"><span className="text-slate-500">Volumen:</span><span className="font-mono font-medium text-slate-700">{point.vol_autorizado?.toLocaleString()} m³</span></div>
                  </div>
                  <button onClick={() => onPointClick(point)} className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-1.5 px-3 rounded transition-colors flex items-center justify-center gap-1">
                    Ver Ficha Completa <ChevronRight size={12} />
                  </button>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---
export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // ESTADO PARA LOS FILTROS MÚLTIPLES
  const [filters, setFilters] = useState({
    rubro: [],
    depto: [],
    municipio: [],
    distrito: [],
    cuenca: []
  });

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    if (!supabase) {
      setErrorMsg("Error de configuración: Faltan claves API.");
      setData(FALLBACK_DATA);
      setLoading(false);
      return;
    }

    try {
      const { data: pozos, error } = await supabase.from('pozos').select('*');
      if (error) throw error;

      if (pozos && pozos.length > 0) {
        const formattedData = pozos.map(p => ({
          id: p.id || p.FID || Math.random(),
          titular: p.Titular || "Desconocido",
          uso: p.Tipo_Uso || "Sin clasificar",
          // Mapeo de Volúmenes nuevos
          vol_solicitado: Number(p.Vsol_m3_a) || 0,
          vol_autorizado: Number(p.Votor_m3_a) || 0,
          vol_consumido: Number(p.Vcons_m3) || 0,
          vcAn1: Number(p.VcAn1_m3) || 0,
          vcAn2: Number(p.VcAn2_m3) || 0,
          vcAn3: Number(p.VcAn3_m3) || 0,
          vcAn4: Number(p.VcAn4_m3) || 0,
          vcAn5: Number(p.VcAn5_m3) || 0,
          
          lat: Number(p.Lat) || 0,
          lon: Number(p.Lon) || 0,
          
          // Mapeo de Ubicación nueva
          depto: p.Departamen || p.NOM_DPTO || "N/A",
          municipio: p.Municipio || p.NOM_MUN || "N/A",
          distrito: p.Distrito || p.NOM_DIS || "N/A",
          ubi_geogra: p.Ubi_Geogra || "N/A",
          cuenca: p.CUENCA || "N/A", // <-- Mapeo de CUENCA
          
          plazo: Number(p.Plazo_otor) || 0,
          vencimiento: p.Venc_perm ? new Date(p.Venc_perm).toLocaleDateString() : "N/A",
          estado_pozo: p.Estado_can || "Desconocido",
          fuente: p.Tipo_Fuent || "Subterránea"
        }));
        setData(formattedData);
        setErrorMsg(null);
      } else {
        setErrorMsg("Conectado, pero no hay datos en la tabla.");
        setData([]);
      }
    } catch (error) {
      console.error("Error:", error);
      setErrorMsg("Error de conexión.");
      setData(FALLBACK_DATA);
    } finally {
      setLoading(false);
    }
  }

  // --- OBTENCIÓN DE OPCIONES ÚNICAS PARA LOS FILTROS ---
  const options = useMemo(() => {
    return {
      rubros: [...new Set(data.map(d => d.uso).filter(Boolean))].sort(),
      deptos: [...new Set(data.map(d => d.depto).filter(Boolean))].sort(),
      municipios: [...new Set(data.map(d => d.municipio).filter(Boolean))].sort(),
      distritos: [...new Set(data.map(d => d.distrito).filter(Boolean))].sort(),
      cuencas: [...new Set(data.map(d => d.cuenca).filter(Boolean))].sort(),
    };
  }, [data]);

  // --- LÓGICA DE FILTRADO MULTI-CRITERIO ---
  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchRubro = filters.rubro.length === 0 || filters.rubro.includes(item.uso);
      const matchDepto = filters.depto.length === 0 || filters.depto.includes(item.depto);
      const matchMuni = filters.municipio.length === 0 || filters.municipio.includes(item.municipio);
      const matchDistrito = filters.distrito.length === 0 || filters.distrito.includes(item.distrito);
      const matchCuenca = filters.cuenca.length === 0 || filters.cuenca.includes(item.cuenca);

      return matchRubro && matchDepto && matchMuni && matchDistrito && matchCuenca;
    });
  }, [filters, data]);

  const handleFilterChange = (key, values) => {
    setFilters(prev => ({ ...prev, [key]: values }));
  };

  // --- CÁLCULOS PARA GRÁFICOS ---
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
        volumen: item.vol_autorizado,
        originalData: item
      }));
  }, [filteredData]);

  const totalVolume = filteredData.reduce((sum, item) => sum + item.vol_autorizado, 0);
  const totalWells = filteredData.length;
  const avgDuration = totalWells > 0 ? (filteredData.reduce((sum, item) => sum + item.plazo, 0) / totalWells).toFixed(1) : 0;

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">Cargando datos...</div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col">
      {selectedItem && <DetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />}

      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg"><Droplets className="text-white h-6 w-6" /></div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-cyan-600 hover:from-blue-800 hover:to-cyan-700 transition-colors flex items-center gap-1">
              <a href="https://geoeit.org/" target="_blank" rel="noopener noreferrer" className="hover:underline decoration-blue-500/30 flex items-center gap-1">
                GEOPORTAL EIT <ExternalLink size={14} className="text-slate-400" />
              </a>
              <span className="text-slate-600 font-normal"> / El Salvador: Extracción de fuentes de agua</span>
            </h1>
          </div>
          <nav className="hidden md:flex space-x-1">
            {['dashboard', 'mapa', 'datos'].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === tab ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'}`}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {errorMsg && <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-center text-amber-800 text-sm">{errorMsg}</div>}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow w-full pb-20">
        
        {/* BARRA DE FILTROS MÚLTIPLES */}
        <div className="mb-8 bg-white p-5 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 text-slate-600 mb-3 pb-2 border-b border-slate-100">
            <Filter size={18} />
            <span className="font-bold text-sm">Filtros Activos</span>
            <span className="ml-auto text-xs bg-slate-100 px-2 py-1 rounded text-slate-500">
              {filteredData.length} registros encontrados
            </span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            <MultiSelect 
              label="Rubro / Uso" 
              options={options.rubros} 
              selectedValues={filters.rubro} 
              onChange={(vals) => handleFilterChange('rubro', vals)} 
            />
            <MultiSelect 
              label="Departamento" 
              options={options.deptos} 
              selectedValues={filters.depto} 
              onChange={(vals) => handleFilterChange('depto', vals)} 
            />
            <MultiSelect 
              label="Municipio" 
              options={options.municipios} 
              selectedValues={filters.municipio} 
              onChange={(vals) => handleFilterChange('municipio', vals)} 
            />
            <MultiSelect 
              label="Distrito" 
              options={options.distritos} 
              selectedValues={filters.distrito} 
              onChange={(vals) => handleFilterChange('distrito', vals)} 
            />
            <MultiSelect 
              label="Cuenca" 
              options={options.cuencas} 
              selectedValues={filters.cuenca} 
              onChange={(vals) => handleFilterChange('cuenca', vals)} 
            />
          </div>
        </div>

        {activeTab === 'dashboard' && (
          <div className="space-y-6">
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
                      <Bar 
                        dataKey="volumen" 
                        fill="#3b82f6" 
                        radius={[0, 4, 4, 0]} 
                        barSize={20} 
                        onClick={(data) => data.originalData && setSelectedItem(data.originalData)}
                        style={{ cursor: 'pointer' }}
                      >
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
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden h-[750px] flex flex-col">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
               <h3 className="font-bold text-slate-700 flex items-center gap-2"><MapIcon size={18} /> Visor de Fuentes Hídricas</h3>
            </div>
            <div className="flex-1 relative p-4 bg-slate-100 z-0">
              <RealMap data={filteredData} onPointClick={setSelectedItem} />
            </div>
          </div>
        )}

        {activeTab === 'datos' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
             <div className="p-6 border-b border-slate-100"><h3 className="font-bold text-lg text-slate-800">Listado de Autorizaciones</h3></div>
             <div className="overflow-x-auto">
               <table className="min-w-full divide-y divide-slate-200">
                 <thead className="bg-slate-50">
                   <tr>
                     <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Titular</th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Rubro</th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Municipio</th>
                     <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Volumen (m³)</th>
                     <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Estado</th>
                   </tr>
                 </thead>
                 <tbody className="bg-white divide-y divide-slate-200">
                   {filteredData.map((item, idx) => (
                     <tr key={item.id || idx} className="hover:bg-slate-50 transition-colors">
                       <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 hover:text-blue-800 cursor-pointer hover:underline" onClick={() => setSelectedItem(item)}>{item.titular}</td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500"><span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold">{item.uso}</span></td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{item.municipio}</td>
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

      {/* FOOTER OFICIAL */}
      <footer className="bg-slate-50 border-t border-slate-200 mt-auto relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center space-y-4">
            <p className="text-sm text-slate-600 font-medium">
              Fuente de Datos:
            </p>
            <p className="text-xs text-slate-500 max-w-3xl mx-auto leading-relaxed">
              La información visualizada corresponde a las fuentes pública del SIHI sobre extracción de fuentes de agua disponibles en los siguientes repositorios:
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4 text-xs">
              <a 
                href="https://sigcfe.maps.arcgis.com/home/item.html?id=7cb86be356ca452bb63f1f6e854c87cf" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 hover:underline flex items-center justify-center gap-1"
              >
                <span className="bg-blue-50 px-2 py-1 rounded border border-blue-100">Fuentes Autorizadas de Extracción (Dataset 1)</span>
              </a>
              <a 
                href="https://sigcfe.maps.arcgis.com/home/item.html?id=9a4754eac5334f7bb1cada6666d411ac" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 hover:underline flex items-center justify-center gap-1"
              >
                <span className="bg-blue-50 px-2 py-1 rounded border border-blue-100">Registros Hídricos Complementarios (Dataset 2)</span>
              </a>
            </div>

            <p className="text-[10px] text-slate-400 italic pt-2">
              Los derechos de la información original pertenecen a la autoridad competente administradora del SIHI.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}