import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { X, Search, Navigation, Crosshair } from 'lucide-react';
import Button from '../ui/Button';

// Fix for default marker icon in Leaflet + Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

interface LocationPickerProps {
    initialCoords: { lat: number; lng: number };
    onConfirm: (coords: { lat: number; lng: number }, address?: string) => void;
    onClose: () => void;
}

const LocationPicker = ({ initialCoords, onConfirm, onClose }: LocationPickerProps) => {
    const [position, setPosition] = useState(initialCoords);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    // Sync position when initialCoords changes
    useEffect(() => {
        setPosition(initialCoords);
    }, [initialCoords]);

    const LocationMarker = () => {
        useMapEvents({
            click(e) {
                setPosition(e.latlng);
            },
        });

        return position ? (
            <Marker position={position} />
        ) : null;
    };

    const ChangeView = ({ center }: { center: { lat: number; lng: number } }) => {
        const map = useMap();
        useEffect(() => {
            map.setView(center, map.getZoom());
        }, [center, map]);
        return null;
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        setIsSearching(true);
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
            const data = await response.json();
            if (data && data.length > 0) {
                const { lat, lon } = data[0];
                setPosition({ lat: parseFloat(lat), lng: parseFloat(lon) });
            }
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setIsSearching(false);
        }
    };

    const detectLocation = () => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition((pos) => {
            setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        });
    };

    return (
        <div className="flex flex-col h-[80vh] bg-card rounded-3xl overflow-hidden shadow-2xl border border-border-card animate-scale-up">
            {/* Header */}
            <header className="p-6 border-b border-border-card flex items-center justify-between bg-card shrink-0">
                <div>
                    <h3 className="text-sm font-black text-main uppercase tracking-widest flex items-center gap-2">
                        <Navigation size={16} className="text-indigo-600" />
                        Pin Precise Location
                    </h3>
                    <p className="text-[10px] text-muted font-bold uppercase tracking-wider mt-1">Interactive Map Selection</p>
                </div>
                <button 
                    onClick={onClose}
                    className="p-2 hover:bg-page rounded-xl text-muted hover:text-main transition-colors"
                >
                    <X size={20} />
                </button>
            </header>

            {/* Search Bar */}
            <div className="p-4 bg-page/30 border-b border-border-card shrink-0 px-6">
                <form onSubmit={handleSearch} className="relative group">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-indigo-600 transition-colors" />
                    <input 
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search for a city, area, or landmark..."
                        className="w-full bg-card border border-border-card rounded-xl pl-12 pr-24 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all outline-none text-main placeholder:text-muted/50 shadow-sm"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        <button 
                            type="submit"
                            disabled={isSearching}
                            className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all disabled:opacity-50"
                        >
                            {isSearching ? '...' : 'Search'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Map Area */}
            <div className="flex-1 relative z-10 min-h-0">
                <MapContainer 
                    center={position} 
                    zoom={13} 
                    style={{ height: '100%', width: '100%' }}
                    zoomControl={false}
                >
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    <LocationMarker />
                    <ChangeView center={position} />
                </MapContainer>

                {/* Map Controls */}
                <div className="absolute bottom-6 right-6 z-[1000] flex flex-col gap-3">
                    <button 
                        onClick={detectLocation}
                        className="w-12 h-12 bg-card border border-border-card rounded-2xl flex items-center justify-center text-indigo-600 shadow-xl shadow-black/10 hover:scale-105 active:scale-95 transition-all"
                        title="Current Location"
                    >
                        <Crosshair size={24} />
                    </button>
                </div>

                {/* Coordinate Badge */}
                <div className="absolute top-6 left-6 z-[1000] pointer-events-none">
                    <div className="bg-card/90 backdrop-blur border border-border-card px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-4">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-muted uppercase tracking-widest">Pin Coordinates</span>
                            <span className="text-[11px] font-black text-indigo-600 font-mono mt-0.5">
                                {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="p-6 border-t border-border-card bg-card flex items-center justify-between gap-6 shrink-0">
                <p className="text-[10px] text-muted font-bold max-w-[200px] leading-relaxed uppercase tracking-widest">
                    Tap the map to adjust the pin or drag it to your exact location.
                </p>
                <div className="flex gap-4">
                    <Button variant="secondary" onClick={onClose} className="rounded-xl px-6 py-2.5 text-[10px] uppercase font-black tracking-widest border-border-card">
                        Cancel
                    </Button>
                    <Button 
                        variant="primary" 
                        onClick={() => onConfirm(position)} 
                        className="rounded-xl px-10 py-2.5 text-[10px] uppercase font-black tracking-widest shadow-lg shadow-indigo-600/20"
                    >
                        Confirm Selection
                    </Button>
                </div>
            </footer>
        </div>
    );
};

export default LocationPicker;
