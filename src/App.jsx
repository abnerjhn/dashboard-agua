import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell
} from 'recharts';
import { 
  Droplets, Map as MapIcon, BarChart3, FileText, 
  Factory, Calendar, AlertCircle, CheckCircle2,
  Filter
} from 'lucide-react';

// --- DATOS SIMULADOS (Basados en tus archivos) ---
const RAW_DATA = [
  {
    id: 229,
    titular: "TACUBAYA, S.A. DE C.V.",
    uso: "Industrial",
    vol_autorizado: 22950,
    vol_solicitado: 22950,
    lat: 13.95859,
    lon: -89.863454,
    depto: "Ahuachapán",
    municipio: "Ahuachapán Centro",
    plazo: 5,
    vencimiento: "2029-04-08",
    estado_pozo: "Activo",
    fuente: "Subterránea"
  },
  {
    id: 420,
    titular: "CARNES DE EL SALVADOR, S.A. DE C.V.",
    uso: "Industrial",
    vol_autorizado: 204000,
    vol_solicitado: 204000,
    lat: 13.660317,
    lon: -89.789493,
    depto: "Sonsonate",
    municipio: "Sonsonate Centro",
    plazo: 5,
    vencimiento: "2030-06-15",
    estado_pozo: "En proceso",
    fuente: "Subterránea"
  },
  {
    id: 266,
    titular: "UNIFERSA-DISAGRO, S.A. DE C.V.",
    uso: "Comercial",
    vol_autorizado: 6315.18,
    vol_solicitado: 6315.18,
    lat: 13.300000, 
    lon: -87.800000, 
    depto: "La Unión",
    municipio: "La Unión Sur",
    plazo: 5,
    vencimiento: "2029-04-08",
    estado_pozo: "Completado",
    fuente: "Subterránea"
  },
  {
    id: 237,
    titular: "Amalia Montoya de Ayala",
    uso: "Agropecuario",
    vol_autorizado: 3409.09,
    vol_solicitado: 3409.09,
    lat: 13.495694,
    lon: -88.985944,
    depto: "La Paz",
    municipio: "La Paz Centro",
    plazo: 5,
    vencimiento: "2029-04-09",
    estado_pozo: "Activo",
    fuente: "Subterránea"
  },
  { id: 101, titular: "INGENIO EL ANGEL", uso: "Agroindustrial", vol_autorizado: 500000, lat: 13.78, lon: -89.20, depto: "San Salvador", plazo: 10, estado_pozo: "Activo", fuente: "Superficial" },
  { id: 102, titular: "TEXTUFIL", uso: "Industrial", vol_autorizado: 150000, lat: 13.70, lon: -89.25, depto: "La Libertad", plazo: 3, estado_pozo: "Mantenimiento", fuente: "Subterránea" },
  { id: 103, titular: "ANDA (Pozo 4)", uso: "Abastecimiento Público", vol_autorizado: 1200000, lat: 13.68, lon: -89.18, depto: "San Salvador", plazo: 20, estado_pozo: "Activo", fuente: "Subterránea" },
  { id: 104, titular: "HOTELES DE PLAYA S.A.", uso: "Turístico", vol_autorizado: 45000, lat: 13.48, lon: -89.35, depto: "La Libertad", plazo: 5, estado_pozo: "Activo", fuente: "Subterránea" },
  { id: 105, titular: "RIEGO ZAPOTITAN", uso: "Agropecuario", vol_autorizado: 300000, lat: 13.75, lon: -89.45, depto: "La Libertad", plazo: 1, estado_pozo: "Activo", fuente: "Superficial" },
];

const COLORS = ['#0ea5e9', '#22c55e', '#eab308', '#f97316', '#ef4444', '#8b5cf6', '#6366f1'];

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

// --- COMPONENTE DE MAPA SVG PERSONALIZADO ---
// Este componente dibuja un mapa basado en coordenadas Lat/Lon sin librerías externas
const CustomGeoMap = ({ data }) => {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // 1. Determinar los límites (Bounding Box) de El Salvador aproximado + margen
  // SV aprox: Lon -90.2 a -87.6, Lat 13.1 a 14.5
  const minLon = -90.2;
  const maxLon = -87.6;
  const minLat = 13.0;
  const maxLat = 14.5;

  const width = 800;
  const height = 400;

  // Función para normalizar coordenadas a píxeles SVG
  const getX = (lon) => {
    return ((lon - minLon) / (maxLon - minLon)) * width;
  };

  // Latitud se invierte porque en SVG Y=0 está arriba
  const getY = (lat) => {
    return height - ((lat - minLat) / (maxLat - minLat)) * height;
  };

  return (
    <div className="relative w-full h-full bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
      <div className="absolute top-4 right-4 bg-white/90 p-2 rounded text-xs text-slate-500 z-10">
        El Salvador (Proyección Simple)
      </div>
      
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full cursor-crosshair">
        {/* Fondo sutil para representar el territorio (abstracto) */}
        <path 
          d={`M ${getX(-90.1)} ${getY(13.6)} Q ${getX(-89.0)} ${getY(14.4)} ${getX(-87.7)} ${getY(13.5)} T ${getX(-88.0)} ${getY(13.1)} T ${getX(-90.0)} ${getY(13.5)} Z`} 
          fill="#e2e8f0" 
          stroke="#cbd5e1"
        />
        
        {/* Puntos de datos */}
        {data.map((point) => (
          <g 
            key={point.id}
            onMouseEnter={() => setHoveredPoint(point)}
            onMouseLeave={() => setHoveredPoint(null)}
          >
            <circle
              cx={getX(point.lon)}
              cy={getY(point.lat)}
              r={hoveredPoint?.id === point.id ? 8 : 5}
              fill={point.estado_pozo === 'Activo' ? '#22c55e' : '#eab308'}
              stroke="white"
              strokeWidth={2}
              className="transition-all duration-300 ease-in-out hover:opacity-100 opacity-80"
            />
            {/* Etiqueta simple si está activo */}
            {hoveredPoint?.id === point.id && (
              <text
                x={getX(point.lon)}
                y={getY(point.lat) - 15}
                textAnchor="middle"
                fill="#1e293b"
                fontSize="12"
                fontWeight="bold"
                className="bg-white"
              >
                {point.titular.substring(0, 15)}...
              </text>
            )}
          </g>
        ))}
      </svg>

      {/* Tooltip Flotante Personalizado */}
      {hoveredPoint && (
        <div 
          className="absolute bg-white p-3 rounded-lg shadow-lg border border-slate-200 pointer-events-none z-20"
          style={{ 
            left: `${(getX(hoveredPoint.lon) / width) * 100}%`, 
            top: `${(getY(hoveredPoint.lat) / height) * 100}%`,
            transform: 'translate(-50%, -110%)'
          }}
        >
          <h4 className="font-bold text-sm text-blue-700">{hoveredPoint.titular}</h4>
          <div className="text-xs text-slate-600 mt-1">
            <p><span className="font-semibold">Uso:</span> {hoveredPoint.uso}</p>
            <p><span className="font-semibold">Volumen:</span> {hoveredPoint.vol_autorizado.toLocaleString()} m³</p>
            <p><span className="font-semibold">Estado:</span> {hoveredPoint.estado_pozo}</p>
          </div>
        </div>
      )}
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedSector, setSelectedSector] = useState('Todos');

  // --- LÓGICA DE PROCESAMIENTO DE DATOS ---
  
  const filteredData = useMemo(() => {
    return selectedSector === 'Todos' 
      ? RAW_DATA 
      : RAW_DATA.filter(item => item.uso === selectedSector);
  }, [selectedSector]);

  // 1. Datos por Rubro (Uso)
  const dataBySector = useMemo(() => {
    const grouped = filteredData.reduce((acc, curr) => {
      acc[curr.uso] = (acc[curr.uso] || 0) + curr.vol_autorizado;
      return acc;
    }, {});
    return Object.keys(grouped).map(key => ({ name: key, value: grouped[key] })).sort((a,b) => b.value - a.value);
  }, [filteredData]);

  // 2. Top Empresas Extractoras
  const topCompanies = useMemo(() => {
    return [...filteredData]
      .sort((a, b) => b.vol_autorizado - a.vol_autorizado)
      .slice(0, 5)
      .map(item => ({
        name: item.titular.length > 20 ? item.titular.substring(0, 20) + '...' : item.titular,
        full_name: item.titular,
        volumen: item.vol_autorizado
      }));
  }, [filteredData]);

  // 3. Duración de Permisos (Años)
  const durationData = useMemo(() => {
    const counts = filteredData.reduce((acc, curr) => {
      const yearKey = `${curr.plazo} Años`;
      acc[yearKey] = (acc[yearKey] || 0) + 1;
      return acc;
    }, {});
    return Object.keys(counts).map(key => ({ name: key, count: counts[key] }));
  }, [filteredData]);

  // 4. Totales KPI
  const totalVolume = filteredData.reduce((sum, item) => sum + item.vol_autorizado, 0);
  const totalWells = filteredData.length;
  const avgDuration = totalWells > 0 ? (filteredData.reduce((sum, item) => sum + item.plazo, 0) / totalWells).toFixed(1) : 0;

  // Obtener lista única de sectores para el filtro
  const uniqueSectors = ['Todos', ...new Set(RAW_DATA.map(d => d.uso))];

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
              Gestión Hídrica: Extracción y Vertidos
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

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* FILTERS BAR */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 text-slate-600">
            <Filter size={20} />
            <span className="font-medium">Filtros Activos:</span>
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
              <StatCard 
                title="Volumen Autorizado Total" 
                value={`${(totalVolume / 1000000).toFixed(2)} M m³`} 
                subtext="Metros cúbicos anuales"
                icon={Droplets}
                colorClass="bg-blue-500"
              />
              <StatCard 
                title="Permisos Activos" 
                value={totalWells} 
                subtext="Pozos y fuentes superficiales"
                icon={FileText}
                colorClass="bg-emerald-500"
              />
              <StatCard 
                title="Plazo Promedio" 
                value={`${avgDuration} Años`} 
                subtext="Duración media de autorización"
                icon={Calendar}
                colorClass="bg-amber-500"
              />
              <StatCard 
                title="Empresa Mayor Extracción" 
                value={topCompanies[0]?.name.split(' ')[0] || "N/A"} 
                subtext={topCompanies[0] ? `${(topCompanies[0]?.volumen / 1000).toFixed(1)}k m³` : "-"}
                icon={Factory}
                colorClass="bg-indigo-500"
              />
            </div>

            {/* CHARTS ROW 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Extracción por Rubro */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Factory size={20} className="text-blue-500"/>
                  Extracción por Rubro (Sector)
                </h3>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dataBySector}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                        label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {dataBySector.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(value) => `${value.toLocaleString()} m³`} />
                      <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-xs text-slate-500 mt-2 text-center">Muestra qué rubros tienen mayor volumen de agua asignado.</p>
              </div>

              {/* Top Empresas */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <BarChart3 size={20} className="text-emerald-500"/>
                  Top 5 Empresas: Mayor Extracción
                </h3>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={topCompanies}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={100} style={{fontSize: '11px'}} />
                      <RechartsTooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(value) => [`${value.toLocaleString()} m³`, 'Volumen']}
                      />
                      <Bar dataKey="volumen" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20}>
                        {topCompanies.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

            {/* CHARTS ROW 2: Duración y Análisis */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Calendar size={20} className="text-amber-500"/>
                Distribución de Años de Permiso
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={durationData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip />
                    <Bar dataKey="count" name="Cantidad de Permisos" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-sm text-slate-500 mt-2">
                Análisis: La mayoría de los permisos se otorgan por 5 años, seguido de permisos largos para abastecimiento público.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'mapa' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden h-[600px] flex flex-col">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
               <h3 className="font-bold text-slate-700 flex items-center gap-2">
                 <MapIcon size={18} /> Geolocalización de Fuentes
               </h3>
               <span className="text-xs text-slate-500 bg-white px-2 py-1 rounded border">
                 {filteredData.length} Puntos visibles
               </span>
            </div>
            <div className="flex-1 relative p-4 bg-slate-100">
              {/* COMPONENTE DE MAPA SVG REEMPLAZADO */}
              <CustomGeoMap data={filteredData} />
            </div>
          </div>
        )}

        {activeTab === 'datos' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
             <div className="p-6 border-b border-slate-100">
               <h3 className="font-bold text-lg text-slate-800">Detalle de Autorizaciones</h3>
               <p className="text-sm text-slate-500">Listado completo de fuentes autorizadas y sus características.</p>
             </div>
             <div className="overflow-x-auto">
               <table className="min-w-full divide-y divide-slate-200">
                 <thead className="bg-slate-50">
                   <tr>
                     <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Titular</th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Rubro</th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Ubicación</th>
                     <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Volumen (m³/año)</th>
                     <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Vencimiento</th>
                     <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Estado</th>
                   </tr>
                 </thead>
                 <tbody className="bg-white divide-y divide-slate-200">
                   {filteredData.map((item) => (
                     <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                       <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                         {item.titular}
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                         <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold">
                           {item.uso}
                         </span>
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                         {item.municipio}, {item.depto}
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 text-right font-mono">
                         {item.vol_autorizado.toLocaleString()}
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 text-center">
                         {item.vencimiento}
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-center">
                         <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                           item.estado_pozo === 'Activo' || item.estado_pozo === 'Completado'
                             ? 'bg-green-100 text-green-800' 
                             : 'bg-yellow-100 text-yellow-800'
                         }`}>
                           {item.estado_pozo === 'Activo' || item.estado_pozo === 'Completado' ? <CheckCircle2 size={12}/> : <AlertCircle size={12}/>}
                           {item.estado_pozo}
                         </span>
                       </td>
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