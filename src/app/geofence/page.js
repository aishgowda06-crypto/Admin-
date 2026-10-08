'use client';
import { useState, useEffect, useRef } from 'react';

export default function AdminGeoFencePage() {
  const [selectedCity, setSelectedCity] = useState('Shivamogga');
  const [customCityInput, setCustomCityInput] = useState('');
  const [message, setMessage] = useState('');
  const [radiusKm, setRadiusKm] = useState(10);
  const [savedZone, setSavedZone] = useState(null);
  
  const mapRef = useRef(null);
  const circleRef = useRef(null);

  const defaultCityCoords = {
    Shivamogga: { lat: 13.9299, lng: 75.5681, radiusMeters: 10000 },
    Bengaluru: { lat: 12.9716, lng: 77.5946, radiusMeters: 15000 },
    Mysuru: { lat: 12.2958, lng: 76.6394, radiusMeters: 10000 },
  };

  useEffect(() => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://food-cgs4.onrender.com';

    fetch(`${API_URL}/api/settings/geofence?city=${encodeURIComponent(selectedCity)}`)
      .then(res => res.json())
      .then(data => {
        const zone = data && data.radiusMeters ? data : {
          centerLat: defaultCityCoords[selectedCity]?.lat || 13.9299,
          centerLng: defaultCityCoords[selectedCity]?.lng || 75.5681,
          radiusMeters: defaultCityCoords[selectedCity]?.radiusMeters || 10000,
          city: selectedCity
        };

        const km = Math.round(zone.radiusMeters / 1000);
        setRadiusKm(km);
        setSavedZone(zone);
        
        if (mapRef.current && window.google) {
          updateMapCircle(zone.centerLat, zone.centerLng, zone.radiusMeters);
        }
      })
      .catch(() => {
        const preset = defaultCityCoords[selectedCity] || { lat: 13.9299, lng: 75.5681, radiusMeters: 10000 };
        const zone = { centerLat: preset.lat, centerLng: preset.lng, radiusMeters: preset.radiusMeters, city: selectedCity };
        setSavedZone(zone);
        setRadiusKm(Math.round(preset.radiusMeters / 1000));
        if (mapRef.current && window.google) {
          updateMapCircle(preset.lat, preset.lng, preset.radiusMeters);
        }
      });

    const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
    const existingScript = document.getElementById('google-maps-script');

    if (!window.google && !existingScript) {
      const script = document.createElement('script');
      script.id = 'google-maps-script';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${googleApiKey}&libraries=drawing`;
      script.async = true;
      script.onload = initMap;
      document.body.appendChild(script);
    } else if (window.google && window.google.maps) {
      initMap();
    } else if (existingScript) {
      existingScript.addEventListener('load', initMap);
    }
  }, [selectedCity]);

  const updateMapCircle = (lat, lng, radiusMeters) => {
    if (!mapRef.current || !window.google) return;

    const center = { lat, lng };
    mapRef.current.setCenter(center);

    if (circleRef.current) {
      circleRef.current.setCenter(center);
      circleRef.current.setRadius(radiusMeters);
    } else {
      circleRef.current = new window.google.maps.Circle({
        strokeColor: '#e64a19',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#ff5722',
        fillOpacity: 0.25,
        map: mapRef.current,
        center: center,
        radius: radiusMeters,
        editable: true,
      });

      window.google.maps.event.addListener(circleRef.current, 'radius_changed', () => {
        const newRadius = circleRef.current.getRadius();
        setRadiusKm(parseFloat((newRadius / 1000).toFixed(1)));
        setSavedZone(prev => prev ? { ...prev, radiusMeters: newRadius } : null);
      });

      window.google.maps.event.addListener(circleRef.current, 'center_changed', () => {
        const newCenter = circleRef.current.getCenter();
        setSavedZone(prev => prev ? { ...prev, centerLat: newCenter.lat(), centerLng: newCenter.lng() } : null);
      });
    }
  };

  const initMap = () => {
    const mapContainer = document.getElementById('admin-map-container');
    if (!mapContainer || !window.google || !window.google.maps) return;

    if (mapRef.current) {
      if (savedZone) {
        updateMapCircle(savedZone.centerLat, savedZone.centerLng, savedZone.radiusMeters);
      }
      return;
    }

    const preset = defaultCityCoords[selectedCity] || { lat: 13.9299, lng: 75.5681 };
    const defaultCenter = { lat: preset.lat, lng: preset.lng };
    
    const map = new window.google.maps.Map(mapContainer, {
      center: defaultCenter,
      zoom: 13,
    });
    mapRef.current = map;

    if (savedZone) {
      updateMapCircle(savedZone.centerLat, savedZone.centerLng, savedZone.radiusMeters);
    }

    const drawingManager = new window.google.maps.drawing.DrawingManager({
      drawingMode: window.google.maps.drawing.OverlayType.CIRCLE,
      drawingControl: true,
      drawingControlOptions: {
        position: window.google.maps.ControlPosition.TOP_CENTER,
        drawingModes: ['circle'],
      },
      circleOptions: {
        fillColor: '#ff5722',
        fillOpacity: 0.25,
        strokeWeight: 2,
        strokeColor: '#e64a19',
        editable: true,
      },
    });
    drawingManager.setMap(map);

    window.google.maps.event.addListener(drawingManager, 'circlecomplete', function(circle) {
      if (circleRef.current && circleRef.current !== circle) {
        circleRef.current.setMap(null);
      }
      circleRef.current = circle;

      const center = circle.getCenter();
      const radius = circle.getRadius();

      const zoneData = {
        city: selectedCity,
        centerLat: center.lat(),
        centerLng: center.lng(),
        radiusMeters: radius
      };

      setSavedZone(zoneData);
      setRadiusKm(parseFloat((radius / 1000).toFixed(1)));

      window.google.maps.event.addListener(circle, 'radius_changed', () => {
        const newRadius = circle.getRadius();
        setRadiusKm(parseFloat((newRadius / 1000).toFixed(1)));
        setSavedZone(prev => prev ? { ...prev, radiusMeters: newRadius } : null);
      });

      window.google.maps.event.addListener(circle, 'center_changed', () => {
        const newCenter = circle.getCenter();
        setSavedZone(prev => prev ? { ...prev, centerLat: newCenter.lat(), centerLng: newCenter.lng() } : null);
      });
    });
  };

  const handleRadiusKmChange = (e) => {
    const val = parseFloat(e.target.value) || 0;
    setRadiusKm(val);
    const radiusMeters = val * 1000;

    const preset = defaultCityCoords[selectedCity] || { lat: 13.9299, lng: 75.5681 };
    const currentLat = savedZone?.centerLat || preset.lat;
    const currentLng = savedZone?.centerLng || preset.lng;

    const updated = { city: selectedCity, centerLat: currentLat, centerLng: currentLng, radiusMeters };
    setSavedZone(updated);
    updateMapCircle(currentLat, currentLng, radiusMeters);
  };

  const handleAddCustomCity = (e) => {
    e.preventDefault();
    if (!customCityInput.trim()) return;
    const formattedCity = customCityInput.trim();
    setSelectedCity(formattedCity);
    setCustomCityInput('');

    const defaultLat = 13.9299;
    const defaultLng = 75.5681;
    const defaultRadius = 10000;

    setRadiusKm(10);
    const newZone = { city: formattedCity, centerLat: defaultLat, centerLng: defaultLng, radiusMeters: defaultRadius };
    setSavedZone(newZone);
    if (mapRef.current && window.google) {
      updateMapCircle(defaultLat, defaultLng, defaultRadius);
    }
  };

  const handleSaveGeoFence = async (e) => {
    e.preventDefault();
    if (!savedZone) {
      return alert('⚠️ Please draw a delivery circle zone on the map or enter a radius in KM first!');
    }

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://food-cgs4.onrender.com';

    try {
      const res = await fetch(`${API_URL}/api/settings/geofence`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...savedZone, city: selectedCity })
      });

      if (res.ok) {
        setMessage(`✅ Geo-Fence Delivery Zone for ${selectedCity} successfully saved & synced!`);
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('❌ Failed to save geo-fence zone to server.');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (err) {
      console.error('Geo-fence save error:', err);
      setMessage('❌ Network error while saving zone.');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  return (
    <div className="space-y-4 pb-6 max-w-md mx-auto">
      
      {/* Header & City Selection Card */}
      <div className="bg-white border border-orange-100 p-4 rounded-3xl shadow-sm space-y-3">
        <div>
          <h2 className="text-sm font-black text-slate-950">🗺️ Multi-City Geo-Fence Manager</h2>
          <p className="text-[11px] text-slate-500 mt-0.5">Configure delivery boundaries for each city to restrict hotel listings locally.</p>
        </div>

        <div className="space-y-2 pt-1 border-t border-orange-100">
          <label className="text-[10px] font-bold text-slate-600 block">Select Active City</label>
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="w-full bg-orange-50/50 border border-orange-200 text-xs font-bold text-slate-800 py-2.5 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 cursor-pointer"
          >
            <option value="Shivamogga">Shivamogga</option>
            <option value="Bengaluru">Bengaluru</option>
            <option value="Mysuru">Mysuru</option>
            {selectedCity && !['Shivamogga', 'Bengaluru', 'Mysuru'].includes(selectedCity) && (
              <option value={selectedCity}>{selectedCity}</option>
            )}
          </select>

          {/* Add Custom City Form */}
          <form onSubmit={handleAddCustomCity} className="flex items-center space-x-2 pt-1">
            <input
              type="text"
              placeholder="Or type new city name..."
              value={customCityInput}
              onChange={(e) => setCustomCityInput(e.target.value)}
              className="w-full bg-orange-50/50 border border-orange-200 text-xs text-slate-800 px-3 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
            <button
              type="submit"
              className="bg-slate-900 hover:bg-black text-white text-xs font-bold px-4 py-2.5 rounded-xl transition cursor-pointer shrink-0 shadow-sm"
            >
              + Add
            </button>
          </form>
        </div>
      </div>

      {message && (
        <div className="bg-orange-50 border border-orange-200 text-orange-700 text-xs font-bold p-3 rounded-2xl text-center shadow-sm">
          {message}
        </div>
      )}

      {/* Google Map Container Card */}
      <div className="bg-white border border-orange-100 p-4 rounded-3xl shadow-sm space-y-3">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xs font-black text-slate-900 uppercase">Boundary Zone</h3>
            <p className="text-[10px] text-orange-600 font-bold">{selectedCity}</p>
          </div>
          
          <div className="flex items-center space-x-1.5 bg-orange-50 px-2.5 py-1.5 rounded-xl border border-orange-200">
            <span className="text-[10px] font-bold text-slate-700">KM:</span>
            <input 
              type="number" 
              min="1" 
              max="100" 
              value={radiusKm} 
              onChange={handleRadiusKmChange}
              className="w-14 bg-white border border-orange-300 text-center text-xs font-black py-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
        </div>

        <div 
          id="admin-map-container" 
          className="w-full h-80 rounded-2xl overflow-hidden border border-orange-200 shadow-inner bg-slate-100"
        ></div>

        <p className="text-[10px] text-slate-500 text-center">
          💡 Drag circle or update KM above to set boundary for {selectedCity}.
        </p>
      </div>

      {/* Save Button */}
      <button 
        onClick={handleSaveGeoFence}
        className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white text-xs font-black py-3.5 rounded-2xl shadow-lg shadow-orange-500/20 transition active:scale-95 cursor-pointer flex items-center justify-center space-x-2"
      >
        <span>Save Geo-Fence for {selectedCity} ⚡</span>
      </button>

    </div>
  );
}