'use client';
import { useState, useEffect, useRef } from 'react';

export default function AdminGeoFencePage() {
  const [message, setMessage] = useState('');
  const [radiusKm, setRadiusKm] = useState(10);
  const [savedZone, setSavedZone] = useState(null);
  
  const mapRef = useRef(null);
  const circleRef = useRef(null);

  useEffect(() => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://food-cgs4.onrender.com';

    // Fetch existing geo-fence settings from backend
    fetch(`${API_URL}/api/settings/geofence`)
      .then(res => res.json())
      .then(data => {
        if (data && data.radiusMeters) {
          const km = Math.round(data.radiusMeters / 1000);
          setRadiusKm(km);
          setSavedZone(data);
          
          // If map is already loaded, update circle/center
          if (mapRef.current && window.google) {
            updateMapCircle(data.centerLat, data.centerLng, data.radiusMeters);
          }
        }
      })
      .catch(() => {});

    // Load Google Maps script with drawing library dynamically
    const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${googleApiKey}&libraries=drawing`;
      script.async = true;
      script.onload = initMap;
      document.body.appendChild(script);
    } else {
      initMap();
    }
  }, []);

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

      // Listen to radius changes if dragged on map
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
    const defaultCenter = { lat: 13.9299, lng: 75.5681 }; // Shivamogga Hub
    const map = new window.google.maps.Map(document.getElementById('admin-map-container'), {
      center: defaultCenter,
      zoom: 13,
    });
    mapRef.current = map;

    // If we already have a saved zone, render it
    if (savedZone) {
      updateMapCircle(savedZone.centerLat, savedZone.centerLng, savedZone.radiusMeters);
    }

    // Create Drawing Manager for admin to draw delivery circle zone
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
      // Remove previous drawn circle if exists
      if (circleRef.current && circleRef.current !== circle) {
        circleRef.current.setMap(null);
      }
      circleRef.current = circle;

      const center = circle.getCenter();
      const radius = circle.getRadius(); // in meters

      const zoneData = {
        centerLat: center.lat(),
        centerLng: center.lng(),
        radiusMeters: radius
      };

      setSavedZone(zoneData);
      setRadiusKm(parseFloat((radius / 1000).toFixed(1)));

      // Listen to future adjustments on this new circle
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

  // Handle direct manual KM input change
  const handleRadiusKmChange = (e) => {
    const val = parseFloat(e.target.value) || 0;
    setRadiusKm(val);
    const radiusMeters = val * 1000;

    if (savedZone) {
      const updated = { ...savedZone, radiusMeters };
      setSavedZone(updated);
      updateMapCircle(updated.centerLat, updated.centerLng, radiusMeters);
    } else {
      // Default to Shivamogga Hub if no zone drawn yet
      const defaultCenter = { lat: 13.9299, lng: 75.5681 };
      const updated = { centerLat: defaultCenter.lat, centerLng: defaultCenter.lng, radiusMeters };
      setSavedZone(updated);
      updateMapCircle(defaultCenter.lat, defaultCenter.lng, radiusMeters);
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
        body: JSON.stringify(savedZone)
      });

      if (res.ok) {
        setMessage('✅ Geo-Fence Delivery Zone successfully saved & synced!');
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
    <div className="space-y-4 pb-6">
      
      {/* Header */}
      <div className="bg-white border border-orange-100 p-4 rounded-3xl shadow-sm space-y-1">
        <h2 className="text-sm font-black text-slate-950">🗺️ Geo-Fence Delivery Zone Manager</h2>
        <p className="text-[11px] text-slate-500">Draw a circular service boundary on the map or set exact kilometers. Customers outside this zone will be blocked from ordering.</p>
      </div>

      {message && (
        <div className="bg-orange-50 border border-orange-200 text-orange-700 text-xs font-bold p-3 rounded-2xl text-center shadow-sm">
          {message}
        </div>
      )}

      {/* Google Map Container */}
      <div className="bg-white border border-orange-100 p-4 rounded-3xl shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <h3 className="text-xs font-black text-slate-900 uppercase">Draw or Set Service Range</h3>
          
          {/* Direct KM Input Control */}
          <div className="flex items-center space-x-2 bg-orange-50 px-3 py-1.5 rounded-2xl border border-orange-200">
            <span className="text-[11px] font-bold text-orange-900">Radius (KM):</span>
            <input 
              type="number" 
              min="1" 
              max="100" 
              value={radiusKm} 
              onChange={handleRadiusKmChange}
              className="w-16 bg-white border border-orange-300 text-center text-xs font-black py-1 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        <div 
          id="admin-map-container" 
          className="w-full h-96 rounded-2xl overflow-hidden border border-orange-200 shadow-inner bg-slate-100"
        ></div>

        <p className="text-[10px] text-slate-500">
          💡 Tip: You can type your exact kilometer range above or use the circle tool on top of the map to draw your delivery boundary.
        </p>
      </div>

      {/* Save Button */}
      <button 
        onClick={handleSaveGeoFence}
        className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white text-xs font-black py-4 rounded-2xl shadow-xl transition active:scale-95 cursor-pointer flex items-center justify-center space-x-2"
      >
        <span>Save & Enforce Geo-Fence Zone ⚡</span>
      </button>

    </div>
  );
}