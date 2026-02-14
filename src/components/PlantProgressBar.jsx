import React, { useEffect, useRef, useState } from 'react';
import { motion, useSpring, useTransform, useMotionValue } from 'framer-motion';

export function PlantProgressBar({ scrollContainerId }) {
    const trackRef = useRef(null);
    const thumbRef = useRef(null);
    const [thumbHeight, setThumbHeight] = useState(80); // Default, will measure
    const isDragging = useRef(false);

    // Motion value for Y position
    const y = useMotionValue(0);

    // Plant Growth Logic
    // Only grow when moving down, shrink up
    // Map Y pixels to 0-1 range based on track height
    const scrollProgress = useTransform(y, (latest) => {
        if (!trackRef.current) return 0;
        const trackH = trackRef.current.clientHeight;
        return latest / (trackH - thumbHeight);
    });

    const smoothProgress = useSpring(scrollProgress, {
        stiffness: 100, damping: 20
    });

    const stemPathLength = useTransform(smoothProgress, [0, 1], [0, 1]);
    const leafScale = useTransform(smoothProgress, [0.2, 0.8], [0, 1]);

    // 1. SCROLL LISENER: Updates Plant Position (One way binding)
    useEffect(() => {
        const container = document.getElementById(scrollContainerId);
        if (!container) return;

        const handleScroll = () => {
            if (isDragging.current || !trackRef.current) return;

            const { scrollTop, scrollHeight, clientHeight } = container;
            const maxScroll = scrollHeight - clientHeight;
            if (maxScroll <= 0) return;

            const trackH = trackRef.current.clientHeight;
            const maxThumbY = trackH - thumbHeight;

            // Map scroll position to thumb Y position
            const p = scrollTop / maxScroll;
            y.set(p * maxThumbY);
        };

        // Measure thumb once mounted
        if (thumbRef.current) {
            setThumbHeight(thumbRef.current.clientHeight);
        }

        container.addEventListener('scroll', handleScroll, { passive: true });
        // Initial sync
        handleScroll();

        return () => container.removeEventListener('scroll', handleScroll);
    }, [scrollContainerId, thumbHeight, y]);

    // 2. DRAG LISTENER: Updates Scroll Position (Reverse binding)
    const handleDrag = () => {
        const container = document.getElementById(scrollContainerId);
        if (!container || !trackRef.current) return;

        const currentY = y.get();
        const trackH = trackRef.current.clientHeight;
        const maxThumbY = trackH - thumbHeight;

        if (maxThumbY <= 0) return;

        // Calculate percentage
        const p = Math.min(Math.max(currentY / maxThumbY, 0), 1);

        // Update Scroll
        const { scrollHeight, clientHeight } = container;
        container.scrollTop = p * (scrollHeight - clientHeight);
    };

    // 3. WHEEL LISTENER: Allow scrolling over the track
    const handleWheel = (e) => {
        const container = document.getElementById(scrollContainerId);
        if (container) {
            container.scrollTop += e.deltaY;
        }
    };

    return (
        <React.Fragment>
            {/* Inject CSS to hide native scrollbar */}
            <style>{`
                #${scrollContainerId}::-webkit-scrollbar { display: none; }
                #${scrollContainerId} { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>

            {/* TRACK */}
            <div
                ref={trackRef}
                className="custom-scroll-track"
                onWheel={handleWheel}
            >
                {/* DRAGGABLE THUMB */}
                <motion.div
                    ref={thumbRef}
                    className="plant-thumb"
                    style={{ y }}
                    drag="y"
                    dragConstraints={trackRef} // Constrain to parent track
                    dragElastic={0}
                    dragMomentum={false}
                    onDragStart={() => isDragging.current = true}
                    onDrag={handleDrag}
                    onDragEnd={() => isDragging.current = false}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 1.1, cursor: "grabbing" }}
                >
                    <svg width="40" height="60" viewBox="0 0 50 100" className="plant-svg">
                        {/* Pot */}
                        <path d="M10 75 L40 75 L36 95 L14 95 Z" fill="#6D4C41" stroke="#5D4037" strokeWidth="1" />
                        <path d="M8 75 L42 75 L42 79 L8 79 Z" fill="#5D4037" />

                        {/* Stem */}
                        <motion.path
                            d="M25 75 Q 25 55 25 45"
                            fill="transparent"
                            stroke="#558B2F"
                            strokeWidth="3"
                            strokeLinecap="round"
                            style={{ pathLength: stemPathLength }}
                        />

                        {/* Leaves */}
                        <motion.g style={{ scale: leafScale, originX: "25px", originY: "45px" }}>
                            <path d="M25 45 Q 10 40 10 30 Q 15 20 25 45" fill="#7CB342" stroke="#558B2F" strokeWidth="0.5" />
                            <path d="M25 45 Q 40 40 40 30 Q 35 20 25 45" fill="#7CB342" stroke="#558B2F" strokeWidth="0.5" />
                            <path d="M25 35 Q 30 25 25 20 Q 20 25 25 35" fill="#8BC34A" stroke="#558B2F" strokeWidth="0.5" />
                        </motion.g>
                    </svg>
                </motion.div>
            </div>

            <style>{`
                .custom-scroll-track {
                    position: fixed;
                    top: 0;
                    right: 0;
                    bottom: 0;
                    width: 40px; /* Reliable click target */
                    z-index: 10000;
                    /* Capture pointers for wheel/drag, but careful not to block content if width is too wide */
                    pointer-events: auto;
                    touch-action: none; /* Prevent browser handling gestures */
                }

                .plant-thumb {
                    position: absolute;
                    left: 0;
                    width: 100%;
                    height: 80px; /* Fixed thumb size */
                    cursor: grab;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
            `}</style>
        </React.Fragment>
    );
}
