import React, { useState, useMemo } from 'react';
import {
  MapPin,
  Flame,
  Zap,
  Shield,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Navigation,
  Compass,
  Building2,
  Phone,
  Globe,
  ExternalLink,
} from 'lucide-react';
import { ClientProspect } from '../types';

interface InteractiveProspectMapProps {
  prospects: ClientProspect[];
  selectedLocation: string;
  selectedProspectId: string | null;
  onSelectProspect: (prospect: ClientProspect) => void;
  isScanning?: boolean;
}

export const InteractiveProspectMap: React.FC<InteractiveProspectMapProps> = ({
  prospects,
  selectedLocation,
  selectedProspectId,
  onSelectProspect,
  isScanning = false,
}) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredProspect, setHoveredProspect] = useState<ClientProspect | null>(null);

  // Compute bounding box or centroid for prospects
  const { minLat, maxLat, minLng, maxLng, centerLat, centerLng } = useMemo(() => {
    if (prospects.length === 0) {
      return { minLat: 30.2, maxLat: 30.35, minLng: -97.85, maxLng: -97.65, centerLat: 30.2672, centerLng: -97.7431 };
    }
    let minLt = Infinity, maxLt = -Infinity, minLg = Infinity, maxLg = -Infinity;
    prospects.forEach((p) => {
      const lat = p.lat ?? 30.2672;
      const lng = p.lng ?? -97.7431;
      if (lat < minLt) minLt = lat;
      if (lat > maxLt) maxLt = lat;
      if (lng < minLg) minLg = lng;
      if (lng > maxLg) maxLg = lng;
    });

    const cLat = (minLt + maxLt) / 2;
    const cLng = (minLg + maxLg) / 2;
    const latSpan = Math.max(0.04, maxLt - minLt);
    const lngSpan = Math.max(0.04, maxLg - minLg);

    return {
      minLat: cLat - latSpan * 0.6,
      maxLat: cLat + latSpan * 0.6,
      minLng: cLng - lngSpan * 0.6,
      maxLng: cLng + lngSpan * 0.6,
      centerLat: cLat,
      centerLng: cLng,
    };
  }, [prospects]);

  // Convert lat/lng to SVG percentage coordinates (0 - 800, 0 - 500)
  const mapWidth = 800;
  const mapHeight = 460;

  const projectCoord = (lat?: number, lng?: number) => {
    const pLat = lat ?? centerLat;
    const pLng = lng ?? centerLng;
    const x = ((pLng - minLng) / (maxLng - minLng || 0.01)) * (mapWidth - 100) + 50;
    const y = ((maxLat - pLat) / (maxLat - minLat || 0.01)) * (mapHeight - 80) + 40;
    return { x: Math.max(20, Math.min(mapWidth - 20, x)), y: Math.max(20, Math.min(mapHeight - 20, y)) };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div className="relative rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-lg select-none">
      {/* Map Header Toolbar */}
      <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 backdrop-blur border border-slate-700/80 shadow-xs pointer-events-auto">
          <Navigation className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-xs font-semibold text-slate-200">
            {selectedLocation} &bull; {prospects.length} Businesses Plotted
          </span>
          {isScanning && (
            <span className="flex items-center gap-1.5 ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
              Live Radar Scanning
            </span>
          )}
        </div>

        {/* Zoom & Reset Controls */}
        <div className="flex items-center gap-1 px-1.5 py-1 rounded-xl bg-slate-900/90 backdrop-blur border border-slate-700/80 shadow-xs pointer-events-auto">
          <button
            onClick={() => setZoom((z) => Math.min(2.5, z + 0.25))}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(0.75, z - 0.25))}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <div className="w-px h-3 bg-slate-700 mx-0.5" />
          <button
            onClick={resetView}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title="Reset Map View"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* SVG Map Canvas */}
      <div
        className={`w-full h-[380px] sm:h-[440px] cursor-${isDragging ? 'grabbing' : 'grab'} relative overflow-hidden`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg
          viewBox={`0 0 ${mapWidth} ${mapHeight}`}
          className="w-full h-full transition-transform duration-75"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
          }}
        >
          <defs>
            {/* Grid Pattern */}
            <pattern id="mapGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
            </pattern>
            {/* Major Blocks */}
            <pattern id="majorGrid" width="160" height="160" patternUnits="userSpaceOnUse">
              <rect width="160" height="160" fill="none" stroke="rgba(56, 189, 248, 0.06)" strokeWidth="1.5" />
            </pattern>
            {/* Radar Pulse Gradient */}
            <radialGradient id="radarPulse" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(56, 189, 248, 0.4)" />
              <stop offset="60%" stopColor="rgba(56, 189, 248, 0.1)" />
              <stop offset="100%" stopColor="rgba(56, 189, 248, 0)" />
            </radialGradient>
          </defs>

          {/* Dark Cartographic Background */}
          <rect width={mapWidth} height={mapHeight} fill="#090d16" />
          <rect width={mapWidth} height={mapHeight} fill="url(#mapGrid)" />
          <rect width={mapWidth} height={mapHeight} fill="url(#majorGrid)" />

          {/* Simulated Metro Arteries / Road Network */}
          <path
            d={`M 0,${mapHeight * 0.45} Q ${mapWidth * 0.3},${mapHeight * 0.4} ${mapWidth * 0.6},${mapHeight * 0.55} T ${mapWidth},${mapHeight * 0.5}`}
            fill="none"
            stroke="rgba(148, 163, 184, 0.15)"
            strokeWidth="5"
          />
          <path
            d={`M ${mapWidth * 0.4},0 Q ${mapWidth * 0.45},${mapHeight * 0.5} ${mapWidth * 0.5},${mapHeight}`}
            fill="none"
            stroke="rgba(148, 163, 184, 0.15)"
            strokeWidth="4"
          />
          <path
            d={`M 0,${mapHeight * 0.2} L ${mapWidth},${mapHeight * 0.75}`}
            fill="none"
            stroke="rgba(148, 163, 184, 0.08)"
            strokeWidth="2"
          />
          <path
            d={`M ${mapWidth * 0.7},0 L ${mapWidth * 0.3},${mapHeight}`}
            fill="none"
            stroke="rgba(148, 163, 184, 0.08)"
            strokeWidth="2"
          />

          {/* Radar Scanner Animation when Active */}
          {isScanning && (
            <g>
              <circle
                cx={mapWidth / 2}
                cy={mapHeight / 2}
                r="160"
                fill="url(#radarPulse)"
                className="animate-ping origin-center"
                style={{ animationDuration: '3s' }}
              />
              <circle
                cx={mapWidth / 2}
                cy={mapHeight / 2}
                r="120"
                fill="none"
                stroke="rgba(56, 189, 248, 0.3)"
                strokeWidth="1.5"
                strokeDasharray="4,4"
              />
              <circle
                cx={mapWidth / 2}
                cy={mapHeight / 2}
                r="220"
                fill="none"
                stroke="rgba(56, 189, 248, 0.15)"
                strokeWidth="1"
              />
            </g>
          )}

          {/* Center Coordinates Pulse */}
          <circle cx={mapWidth / 2} cy={mapHeight / 2} r="4" fill="#38bdf8" />
          <circle
            cx={mapWidth / 2}
            cy={mapHeight / 2}
            r="8"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="1.5"
            opacity="0.6"
          />

          {/* Business Markers / Pins */}
          {prospects.map((p, idx) => {
            const { x, y } = projectCoord(p.lat, p.lng);
            const isSelected = selectedProspectId === p.id;
            const isHovered = hoveredProspect?.id === p.id;
            const isHot = p.opportunityLevel === 'high';
            const isMed = p.opportunityLevel === 'medium';

            const pinColor = isHot ? '#f43f5e' : isMed ? '#f59e0b' : '#10b981';

            return (
              <g
                key={p.id || idx}
                transform={`translate(${x}, ${y})`}
                className="cursor-pointer transition-transform duration-200"
                onClick={() => onSelectProspect(p)}
                onMouseEnter={() => setHoveredProspect(p)}
                onMouseLeave={() => setHoveredProspect(null)}
              >
                {/* Glow ring on selection or hot lead */}
                {(isSelected || isHovered) && (
                  <circle r="16" fill={pinColor} opacity="0.25" className="animate-pulse" />
                )}

                {/* Outer Pin Body */}
                <circle
                  r={isSelected ? '10' : isHovered ? '8' : '6'}
                  fill={pinColor}
                  stroke="#ffffff"
                  strokeWidth={isSelected ? '2.5' : '1.5'}
                  filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.5))"
                />

                {/* Inner Badge Dot */}
                <circle r="2" fill="#ffffff" />

                {/* Micro Label on hover or selected */}
                {(isSelected || isHovered) && (
                  <g transform="translate(0, -18)">
                    <rect
                      x="-55"
                      y="-16"
                      width="110"
                      height="20"
                      rx="6"
                      fill="#0f172a"
                      stroke="rgba(255,255,255,0.2)"
                      strokeWidth="1"
                    />
                    <text
                      x="0"
                      y="-3"
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="9"
                      fontWeight="bold"
                      className="select-none"
                    >
                      {p.cname.length > 14 ? `${p.cname.slice(0, 14)}...` : p.cname} ({p.seoHealthScore})
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        {/* Hover / Selected Prospect Info Card */}
        {hoveredProspect && (
          <div className="absolute bottom-4 left-4 z-30 max-w-xs p-3 rounded-xl bg-slate-900/95 backdrop-blur border border-slate-700 shadow-xl text-left pointer-events-auto">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  hoveredProspect.opportunityLevel === 'high'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : hoveredProspect.opportunityLevel === 'medium'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}
              >
                {hoveredProspect.opportunityLevel === 'high' ? (
                  <Flame className="w-3 h-3 text-rose-400" />
                ) : hoveredProspect.opportunityLevel === 'medium' ? (
                  <Zap className="w-3 h-3 text-amber-400" />
                ) : (
                  <Shield className="w-3 h-3 text-emerald-400" />
                )}
                <span>Score: {hoveredProspect.seoHealthScore}/100</span>
              </span>
              <span className="text-[10px] text-amber-300 font-bold">
                Viability: {hoveredProspect.viabilityScore ?? 85}/100
              </span>
            </div>
            <h4 className="text-xs font-bold text-white truncate">{hoveredProspect.cname}</h4>
            <div className="text-[10px] text-cyan-300 font-medium mt-0.5">
              {hoveredProspect.rankBracket || 'Page 2 Underdog'} &bull; {hoveredProspect.customerLifetimeValue ? `Avg Ticket: ${hoveredProspect.customerLifetimeValue.split('/')[0]}` : 'Commercial'}
            </div>
            <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
              {hoveredProspect.contact.formattedAddress || selectedLocation}
            </p>
            {hoveredProspect.contact.phone && (
              <div className="flex items-center gap-1.5 text-[11px] text-cyan-400 mt-1.5">
                <Phone className="w-3 h-3" />
                <span>{hoveredProspect.contact.phone}</span>
              </div>
            )}
            <button
              onClick={() => onSelectProspect(hoveredProspect)}
              className="mt-2 w-full py-1 text-center text-[10px] font-bold text-slate-900 bg-white rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
            >
              View Client Dossier &amp; Pitch &rarr;
            </button>
          </div>
        )}
      </div>

      {/* Map Footer Legend */}
      <div className="px-4 py-2 bg-slate-950/80 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-rose-500/30"></span>
            <span>Hot Lead (Score &lt;65)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-amber-500/30"></span>
            <span>Moderate (65–79)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/30"></span>
            <span>Optimized (80+)</span>
          </div>
        </div>
        <div className="text-[10px] text-slate-500">
          Tip: Drag map to pan &bull; Click any pin to inspect client &amp; pitch
        </div>
      </div>
    </div>
  );
};
