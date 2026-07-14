import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin } from 'lucide-react';

// Fix Leaflet's default icon path issues
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapLocationPickerProps {
    city: string;
    onCityFound?: (cityName: string) => void;
}

// Component to dynamically update map center
const MapUpdater: React.FC<{ center: [number, number] }> = ({ center }) => {
    const map = useMap();
    useEffect(() => {
        map.flyTo(center, 12, { animate: true });
    }, [center, map]);
    return null;
};

const MapLocationPicker: React.FC<MapLocationPickerProps> = ({ city, onCityFound }) => {
    const [position, setPosition] = useState<[number, number] | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!city || city.trim().length < 3) return;

        const fetchCoordinates = async () => {
            setLoading(true);
            try {
                // Add a small delay to prevent spamming the API while typing
                const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}&limit=1`);
                const data = await res.json();
                
                if (data && data.length > 0) {
                    setPosition([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
                    if (onCityFound) {
                        onCityFound(data[0].display_name.split(',')[0]);
                    }
                }
            } catch (err) {
                console.error("Geocoding failed", err);
            } finally {
                setLoading(false);
            }
        };

        const timer = setTimeout(fetchCoordinates, 1000); // 1s debounce
        return () => clearTimeout(timer);
    }, [city]);

    return (
        <div className="w-full h-48 bg-card rounded-2xl border border-border-card overflow-hidden relative shadow-sm">
            {loading && (
                <div className="absolute inset-0 z-[1000] bg-page/50 backdrop-blur-[2px] flex items-center justify-center">
                    <div className="flex items-center gap-2 px-4 py-2 bg-card rounded-full shadow-lg border border-border-card">
                        <MapPin size={14} className="text-indigo-500 animate-bounce" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-main">Locating...</span>
                    </div>
                </div>
            )}
            
            {position ? (
                <MapContainer 
                    center={position} 
                    zoom={12} 
                    scrollWheelZoom={false} 
                    style={{ height: '100%', width: '100%', zIndex: 0 }}
                    attributionControl={false}
                >
                    <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    />
                    <Marker position={position} />
                    <MapUpdater center={position} />
                </MapContainer>
            ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-muted/50 gap-3 bg-page">
                    <MapPin size={32} />
                    <p className="text-[10px] font-black uppercase tracking-widest px-8 text-center">
                        Enter a valid city to preview your region
                    </p>
                </div>
            )}
        </div>
    );
};

export default MapLocationPicker;
