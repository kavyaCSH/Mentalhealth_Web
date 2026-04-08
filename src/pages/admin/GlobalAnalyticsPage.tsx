import React, { useState, useEffect, useMemo } from 'react';
import {
    BarChart3,
    Activity,
    Map as MapIcon,
    AlertTriangle,
    RefreshCw,
    ArrowLeft,
    TrendingUp,
    ShieldAlert,
    Brain,
    MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AnalyticsService } from '../../api/services/analytics.service';
import type { CentralAnalytics, HeatMapNode } from '../../types/analytics.types';
import Button from '../../components/ui/Button';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const RISK_COLORS: Record<string, string> = {
    Low: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    Moderate: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    High: 'bg-orange-50 text-orange-600 border-orange-200',
    Critical: 'bg-rose-50 text-rose-600 border-rose-200',
};

const RISK_COLORS_HEX: Record<string, string> = {
    Low: '#10b981', // emerald-500
    Moderate: '#eab308', // yellow-500
    High: '#f97316', // orange-500
    Critical: '#e11d48', // rose-600
};

const GlobalAnalyticsPage = () => {
    const navigate = useNavigate();
    const [analytics, setAnalytics] = useState<CentralAnalytics | null>(null);
    const [heatMap, setHeatMap] = useState<HeatMapNode[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'dashboard' | 'heatmap'>('dashboard');

    const fetchData = async () => {
        setLoading(true);
        try {
            const [centralData, mapData] = await Promise.all([
                AnalyticsService.getCentralAnalytics(),
                AnalyticsService.getHeatMapData()
            ]);
            setAnalytics(centralData);
            setHeatMap(mapData);
        } catch (error) {
            console.error('Failed to load global analytics', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 60000); // refresh every minute
        return () => clearInterval(interval);
    }, []);

    const totalConsults = useMemo(() => {
        if (!analytics) return 0;
        return analytics.by_city.reduce((sum, city) => sum + city.total_consults, 0);
    }, [analytics]);

    const averageRisk = useMemo(() => {
        if (!analytics || analytics.by_city.length === 0) return 0;
        const totalScore = analytics.by_city.reduce((sum, city) => sum + city.avg_risk_score, 0);
        return (totalScore / analytics.by_city.length).toFixed(2);
    }, [analytics]);

    return (
        <div className="p-8 space-y-10 animate-fade-in max-w-7xl pb-32">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors mb-4"
                    >
                        <ArrowLeft size={14} /> Back to Command
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl flex items-center justify-center text-white shadow-xl glow-primary">
                            <BarChart3 size={30} />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight text-main">Global Analytics</h1>
                            <p className="text-muted font-medium">Bird's-Eye View of Platform Telemetry & Clinical Density.</p>
                        </div>
                    </div>
                </div>
                <Button
                    variant="primary"
                    leftIcon={<RefreshCw size={18} className={loading ? 'animate-spin' : ''} />}
                    onClick={fetchData}
                    isLoading={loading}
                    className="shadow-xl shadow-indigo-100 h-14 rounded-2xl px-8 uppercase tracking-widest font-black text-xs"
                >
                    Sync Telemetry
                </Button>
            </header>

            {/* Quick Stats */}
            <div className="grid gap-6 md:grid-cols-4">
                <div className="card-premium p-6 flex flex-col justify-between border-slate-100/50 bg-gradient-to-br from-white to-slate-50">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                            <Activity size={20} />
                        </div>
                        <TrendingUp size={20} className="text-emerald-500" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Consults</p>
                        <p className="text-3xl font-black text-slate-900 tracking-tight">{loading ? '—' : totalConsults}</p>
                    </div>
                </div>

                <div className="card-premium p-6 flex flex-col justify-between border-slate-100/50 bg-gradient-to-br from-white to-slate-50">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                            <AlertTriangle size={20} />
                        </div>
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Avg Global Risk Score</p>
                        <p className="text-3xl font-black text-slate-900 tracking-tight">{loading ? '—' : averageRisk}</p>
                    </div>
                </div>

                <div className="card-premium p-6 flex flex-col justify-between border-slate-100/50 bg-gradient-to-br from-white to-slate-50">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
                            <ShieldAlert size={20} />
                        </div>
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">High/Critical Flags</p>
                        <p className="text-3xl font-black text-slate-900 tracking-tight">
                            {loading ? '—' : analytics?.risk_distribution.filter(r => r._id === 'High' || r._id === 'Critical').reduce((a,b) => a + b.count, 0) || 0}
                        </p>
                    </div>
                </div>

                <div className="card-premium p-6 flex flex-col justify-between border-slate-100/50 bg-gradient-to-br from-white to-slate-50">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600">
                            <MapPin size={20} />
                        </div>
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Regions</p>
                        <p className="text-3xl font-black text-slate-900 tracking-tight">
                            {loading ? '—' : analytics?.by_city.length || 0}
                        </p>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <button
                    onClick={() => setActiveTab('dashboard')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                        activeTab === 'dashboard' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-700'
                    }`}
                >
                    <BarChart3 size={16} /> Aggregate Data
                </button>
                <button
                    onClick={() => setActiveTab('heatmap')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                        activeTab === 'heatmap' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-700'
                    }`}
                >
                    <MapIcon size={16} /> Geographic Heat Map
                </button>
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'dashboard' && analytics && (
                    <motion.div
                        key="dashboard"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-8"
                    >
                        {/* Risk Distribution & Region Breakdown grid */}
                        <div className="grid lg:grid-cols-3 gap-8">
                            {/* Risk Distribution */}
                            <div className="lg:col-span-1 card-premium p-8 border-slate-100/50 flex flex-col">
                                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-2">
                                    <ShieldAlert size={16} /> Population Risk Stratification
                                </h3>
                                
                                <div className="space-y-6 flex-1 flex flex-col justify-center">
                                    {analytics.risk_distribution.map(risk => (
                                        <div key={risk._id}>
                                            <div className="flex justify-between items-end mb-2">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${RISK_COLORS[risk._id] || RISK_COLORS['Moderate']}`}>
                                                    {risk._id} Risk
                                                </span>
                                                <span className="text-xl font-black text-slate-900">{risk.count}</span>
                                            </div>
                                            <div className="w-full bg-slate-50 rounded-full h-3 border border-slate-100 overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${(risk.count / totalConsults || 1) * 100}%` }}
                                                    transition={{ duration: 1, delay: 0.2 }}
                                                    className={`h-full ${
                                                        risk._id === 'Low' ? 'bg-emerald-500' :
                                                        risk._id === 'Moderate' ? 'bg-yellow-500' :
                                                        risk._id === 'High' ? 'bg-orange-500' : 'bg-rose-500'
                                                    }`}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Regional Breakdown */}
                            <div className="lg:col-span-2 card-premium border-slate-100/50 overflow-hidden">
                                <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <MapPin size={16} /> Regional Threat Intelligence
                                    </h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-white border-b border-slate-100">
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Region</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Consults</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Avg Risk</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Dominant Symptoms</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {analytics.by_city.map((city, idx) => (
                                                <motion.tr 
                                                    key={city._id}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: idx * 0.1 }}
                                                    className="hover:bg-slate-50 transition-colors"
                                                >
                                                    <td className="px-8 py-6 font-bold text-slate-900">{city._id}</td>
                                                    <td className="px-8 py-6 text-sm font-bold text-slate-600">{city.total_consults}</td>
                                                    <td className="px-8 py-6">
                                                        <span className={`px-2 py-1 rounded-md border text-[10px] font-black ${
                                                            (city.avg_risk_score || 0) > 0.7 ? 'bg-rose-50 text-rose-600 border-rose-200' :
                                                            (city.avg_risk_score || 0) > 0.4 ? 'bg-orange-50 text-orange-600 border-orange-200' :
                                                            'bg-emerald-50 text-emerald-600 border-emerald-200'
                                                        }`}>
                                                            {(city.avg_risk_score || 0).toFixed(2)}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="flex flex-wrap gap-2">
                                                            {(Array.isArray(city.symptom_summary) ? city.symptom_summary.flat() : []).slice(0,3).map((sym, i) => (
                                                                <span key={i} className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded text-[9px] font-bold uppercase tracking-wider">
                                                                    {sym}
                                                                </span>
                                                            ))}
                                                            {(Array.isArray(city.symptom_summary) ? city.symptom_summary.flat() : []).length > 3 && (
                                                                <span className="px-2 py-1 bg-slate-50 text-slate-400 rounded text-[9px] font-bold">
                                                                    +{(Array.isArray(city.symptom_summary) ? city.symptom_summary.flat() : []).length - 3}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            ))}
                                            {analytics.by_city.length === 0 && (
                                                <tr>
                                                    <td colSpan={4} className="px-8 py-10 text-center text-sm font-medium text-slate-400">
                                                        No regional data available yet.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'heatmap' && (
                    <motion.div
                        key="heatmap"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="card-premium border-slate-100/50 p-1 space-y-0 overflow-hidden relative"
                    >
                        {/* MapContainer replacing placeholder */}
                        <div className="relative h-[400px] bg-slate-100 rounded-t-[30px] overflow-hidden border-b border-slate-100/50">
                            <MapContainer 
                                center={[20, 0]} 
                                zoom={2} 
                                style={{ height: '100%', width: '100%', zIndex: 0 }}
                                minZoom={2}
                            >
                                <TileLayer
                                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
                                />
                                {heatMap.map((node, i) => (
                                    <CircleMarker
                                        key={node._id || i}
                                        center={[node.coordinates.lat, node.coordinates.lng]}
                                        pathOptions={{
                                            color: RISK_COLORS_HEX[node.risk_level] || '#6366f1',
                                            fillColor: RISK_COLORS_HEX[node.risk_level] || '#6366f1',
                                            fillOpacity: 0.7,
                                            weight: 2
                                        }}
                                        radius={8}
                                    >
                                        <Popup className="font-sans">
                                            <div className="min-w-[150px]">
                                                <p className="font-bold text-slate-900 mb-1">{node.city}</p>
                                                <p className="text-xs text-slate-600 mb-2">{node.primary_diagnosis}</p>
                                                <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border inline-block ${RISK_COLORS[node.risk_level] || RISK_COLORS['Moderate']}`}>
                                                    {node.risk_level} Risk
                                                </span>
                                            </div>
                                        </Popup>
                                    </CircleMarker>
                                ))}
                            </MapContainer>
                        </div>

                        <div className="p-8 bg-white max-h-[500px] overflow-y-auto">
                            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <Brain size={16} /> Diagnostic Clusters (Raw Telemetry)
                            </h3>
                            
                            <div className="grid gap-4 md:grid-cols-2">
                                {heatMap.map((node, i) => (
                                    <div key={node._id || i} className="p-5 rounded-2xl border border-slate-100 bg-slate-50 flex flex-col justify-between hover:border-indigo-200 transition-colors">
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <p className="font-bold text-slate-900">{node.city}</p>
                                                <p className="text-[10px] font-mono text-slate-500 mt-1">lat: {node.coordinates.lat.toFixed(4)}, lng: {node.coordinates.lng.toFixed(4)}</p>
                                            </div>
                                            <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border ${RISK_COLORS[node.risk_level] || RISK_COLORS['Moderate']}`}>
                                                {node.risk_level}
                                            </span>
                                        </div>
                                        <div className="pt-4 border-t border-slate-200/50">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Primary Diagnosis</p>
                                            <p className="text-sm font-bold text-slate-700">{node.primary_diagnosis}</p>
                                        </div>
                                    </div>
                                ))}

                                {heatMap.length === 0 && (
                                    <div className="md:col-span-2 text-center py-10">
                                        <p className="text-sm font-medium text-slate-400">No geo-tagged diagnostic data available.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default GlobalAnalyticsPage;
