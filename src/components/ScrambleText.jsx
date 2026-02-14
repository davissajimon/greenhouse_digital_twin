import React, { useState, useEffect } from "react";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";

const ScrambleText = ({
    text,
    delay = 0,
    className = "",
    scrambleSpeed = 20,
    as = "span",
    start = true
}) => {
    const Tag = as;

    // Start with random characters instead of 0s
    const [displayedText, setDisplayedText] = useState(() =>
        text.split("").map(char => (char === " " || char === "\n") ? char : CHARS[Math.floor(Math.random() * CHARS.length)]).join("")
    );

    useEffect(() => {
        if (!start) return;

        let interval;
        let startTimeout;

        // Initial delay
        startTimeout = setTimeout(() => {
            let iteration = 0;
            interval = setInterval(() => {
                setDisplayedText(() =>
                    text
                        .split("")
                        .map((letter, index) => {
                            if (letter === " " || letter === "\n") return letter; // Preserve spaces/newlines

                            if (index < iteration) {
                                return text[index]; // Revealed correctly
                            }

                            return CHARS[Math.floor(Math.random() * CHARS.length)]; // Random char
                        })
                        .join("")
                );

                if (iteration >= text.length) {
                    clearInterval(interval);
                    setDisplayedText(text); // Ensure final text is exact
                }

                iteration += 1; // Reveal 1 character every frame for faster animation
            }, scrambleSpeed);

        }, delay);

        return () => {
            clearTimeout(startTimeout);
            if (interval) clearInterval(interval);
        };
    }, [text, delay, scrambleSpeed, start]);

    return (
        <Tag className={className}>
            {displayedText}
        </Tag>
    );
};

export default ScrambleText;
