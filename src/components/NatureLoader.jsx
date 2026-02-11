import React from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

export const NatureLoader = ({ message = "Loading...", minHeight = "auto" }) => {
    return (
        <div style={{
            width: '100vw',
            height: '100vh',
            minHeight: minHeight,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#0d1117', // Match the app background
            position: 'absolute', // Cover everything
            top: 0,
            left: 0,
            zIndex: 9999, // Ensure it's on top
        }}>
            <div style={{ width: '300px', height: '300px' }}>
                <DotLottieReact
                    src="/NatureLoader.lottie"
                    loop
                    autoplay
                />
            </div>
            <div style={{
                marginTop: '20px',
                color: '#8FBC8F', // Soft green to match nature theme
                fontFamily: 'Inter, sans-serif',
                fontSize: '1.2rem',
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.1em'
            }}>
                {message}
            </div>
        </div>
    );
};

// Also export a smaller inline version if needed, but the main request is "on all screen"
export const InlineLoader = () => (
    <div style={{ width: '100px', height: '100px' }}>
        <DotLottieReact
            src="/NatureLoader.lottie"
            loop
            autoplay
        />
    </div>
);
