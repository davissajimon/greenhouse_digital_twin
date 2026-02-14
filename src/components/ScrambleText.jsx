import React, { useState, useEffect } from "react";

const ScrambleText = ({
    text,
    delay = 0,
    className = "",
    scrambleSpeed = 30,
    as = "span",
    start = true
}) => {
    const Tag = as;
    const [displayedText, setDisplayedText] = useState(text.replace(/[^\s]/g, "0")); // Start with placeholder 0s
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    useEffect(() => {
        if (!start) return;

        let interval;
        let iteration = 0;

        // Initial delay
        const startTimeout = setTimeout(() => {
            interval = setInterval(() => {
                setDisplayedText(() =>
                    text
                        .split("")
                        .map((letter, index) => {
                            if (letter === " " || letter === "\n") return letter; // Preserve spaces/newlines

                            if (index < iteration) {
                                return text[index]; // Revealed correctly
                            }

                            return chars[Math.floor(Math.random() * chars.length)]; // Random char
                        })
                        .join("")
                );

                if (iteration >= text.length) {
                    clearInterval(interval);
                    setDisplayedText(text); // Ensure final text is exact
                }

                iteration += 1 / 2; // Reveal 1 character every 2 frames
            }, scrambleSpeed);

        }, delay);

        return () => {
            clearTimeout(startTimeout);
            clearInterval(interval);
        };
    }, [text, delay, scrambleSpeed, start]);

    return (
        <Tag className={className}>
            {displayedText}
        </Tag>
    );
};

export default ScrambleText;

