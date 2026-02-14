/**
 * GlobeView.jsx
 * 
 * Interactive 3D globe using Globe.GL.
 * Supports click to select lat/lon, with marker and pulse animation.
 */

import React, { useEffect, useRef, useState, memo } from 'react';
import Globe from 'globe.gl';

function GlobeViewComponent({ onLocationSelect, selectedCoords, onReady }) {
    const globeContainerRef = useRef(null);
    const globeInstanceRef = useRef(null);
    const debounceTimerRef = useRef(null);
    const onLocationSelectRef = useRef(onLocationSelect);
    const onReadyRef = useRef(onReady);
    const [isReady, setIsReady] = useState(false);

    // Keep ref in sync to avoid stale closure in globe click handler
    useEffect(() => { onLocationSelectRef.current = onLocationSelect; }, [onLocationSelect]);
    useEffect(() => { onReadyRef.current = onReady; }, [onReady]);

    // Initialize the globe once
    useEffect(() => {
        if (!globeContainerRef.current || globeInstanceRef.current) return;

        const container = globeContainerRef.current;
        const width = container.clientWidth;
        const height = container.clientHeight;

        const globe = Globe()
            .width(width)
            .height(height)
            .globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
            .bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png')
            .backgroundImageUrl('//unpkg.com/three-globe/example/img/night-sky.png')
            .atmosphereColor('#4da8da')
            .atmosphereAltitude(0.25)
            .pointsData([])
            .pointAltitude(0.02)
            .pointRadius(0.6)
            .pointColor(() => '#ff5e5e')
            .ringsData([])
            .ringColor(() => t => `rgba(255, 94, 94, ${1 - t})`)
            .ringMaxRadius(4)
            .ringPropagationSpeed(2)
            .ringRepeatPeriod(1200)
            .labelsData([])
            .labelText('label')
            .labelSize(1.5)
            .labelDotRadius(0.4)
            .labelColor(() => '#ffffff')
            .labelResolution(2)
            .onGlobeClick(({ lat, lng }) => {
                // Debounce rapid clicks (500ms)
                if (debounceTimerRef.current) {
                    clearTimeout(debounceTimerRef.current);
                }
                debounceTimerRef.current = setTimeout(() => {
                    if (onLocationSelectRef.current) {
                        onLocationSelectRef.current({
                            lat: Math.round(lat * 10000) / 10000,
                            lon: Math.round(lng * 10000) / 10000,
                        });
                    }
                }, 100); // Small debounce for rapid-fire protection
            });

        globe(container);

        // Camera positioning
        globe.pointOfView({ lat: 20, lng: 78, altitude: 2.5 }, 0); // Start over India

        // Customize renderer
        const renderer = globe.renderer();
        if (renderer) {
            renderer.setClearColor('#000000', 0);
        }

        // Auto-rotate
        const controls = globe.controls();
        if (controls) {
            controls.autoRotate = true;
            controls.autoRotateSpeed = 0.5;
            controls.enableZoom = true;
            controls.minDistance = 120;
            controls.maxDistance = 500;
        }

        globeInstanceRef.current = globe;
        // Fire onReady after globe initialises (small delay for textures)
        queueMicrotask(() => {
            setIsReady(true);
            if (onReadyRef.current) setTimeout(onReadyRef.current, 800);
        });

        // Handle resize
        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                if (width > 0 && height > 0 && globeInstanceRef.current) {
                    globeInstanceRef.current.width(width).height(height);
                }
            }
        });
        resizeObserver.observe(container);

        return () => {
            resizeObserver.disconnect();
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
            // Cleanup globe renderer
            if (globeInstanceRef.current) {
                const r = globeInstanceRef.current.renderer();
                if (r) r.dispose();
                globeInstanceRef.current._destructor && globeInstanceRef.current._destructor();
            }
            globeInstanceRef.current = null;
        };
    }, []); // Only mount once

    // Update marker when selectedCoords change
    useEffect(() => {
        if (!globeInstanceRef.current || !selectedCoords) return;

        const { lat, lon } = selectedCoords;

        // Stop auto-rotation on selection
        const controls = globeInstanceRef.current.controls();
        if (controls) {
            controls.autoRotate = false;
        }

        // Place marker point
        globeInstanceRef.current.pointsData([
            { lat, lng: lon, size: 0.6, color: '#ff5e5e' }
        ]);

        // Pulse ring animation
        globeInstanceRef.current.ringsData([
            { lat, lng: lon, maxR: 4, propagationSpeed: 2, repeatPeriod: 1200 }
        ]);

        // Fly to location
        globeInstanceRef.current.pointOfView({ lat, lng: lon, altitude: 1.5 }, 1000);
    }, [selectedCoords]);


    return (
        <div className="globe-wrapper">
            <div
                ref={globeContainerRef}
                className="globe-container"
            />
            {!isReady && (
                <div className="globe-loading">
                    <div className="globe-loading-spinner" />
                    <span>Loading Globe...</span>
                </div>
            )}
        </div>
    );
}

export const GlobeView = memo(GlobeViewComponent);
export default GlobeView;
