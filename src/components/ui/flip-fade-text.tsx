"use client"

import { useEffect, useState, useMemo, useCallback, memo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

export type FlipWord = string | { text: string; className?: string }

interface FlipFadeTextProps {
    /**
     * Array of words or phrases to cycle through
     * @default ["DISCOVER STORIES", "DRAWN BY IMAGINATION"]
     */
    words?: FlipWord[]
    /**
     * Interval between word changes in milliseconds
     * @default 3000
     */
    interval?: number
    /**
     * Additional CSS classes for the container
     */
    className?: string
    /**
     * Additional CSS classes for the text
     */
    textClassName?: string
    /**
     * Animation duration for each letter in seconds
     * @default 0.55
     */
    letterDuration?: number
    /**
     * Stagger delay between letters on enter in seconds
     * @default 0.035
     */
    staggerDelay?: number
    /**
     * Stagger delay between letters on exit in seconds
     * @default 0.02
     */
    exitStaggerDelay?: number
}

const defaultWords: FlipWord[] = ["DISCOVER\nSTORIES", "DRAWN BY\nIMAGINATION"]

// Memoized Letter component for performance
const Letter = memo(function Letter({
    char,
    letterDuration,
}: {
    char: string
    letterDuration: number
}) {
    return (
        <motion.span
            style={{ transformStyle: "preserve-3d", display: "inline-block" }}
            variants={{
                initial: {
                    rotateX: 90,
                    y: 20,
                    opacity: 0,
                    filter: "blur(6px)",
                },
                animate: {
                    rotateX: 0,
                    y: 0,
                    opacity: 1,
                    filter: "blur(0px)",
                    transition: {
                        duration: letterDuration,
                        ease: [0.2, 0.65, 0.3, 0.9],
                    },
                },
                exit: {
                    rotateX: -90,
                    y: -20,
                    opacity: 0,
                    filter: "blur(6px)",
                    transition: {
                        duration: letterDuration * 0.65,
                        ease: "easeIn",
                    },
                },
            }}
            className="inline-block select-none"
        >
            {char === " " ? "\u00A0" : char}
        </motion.span>
    )
})

// Memoized Word component for performance
const Word = memo(function Word({
    text,
    customClassName,
    staggerDelay,
    exitStaggerDelay,
    letterDuration,
    textClassName,
}: {
    text: string
    customClassName?: string
    staggerDelay: number
    exitStaggerDelay: number
    letterDuration: number
    textClassName?: string
}) {
    // Support newlines in case multi-line phrases are passed
    const lines = useMemo(() => text.split("\n"), [text])

    let globalCharIndex = 0

    return (
        <motion.div
            className={cn(
                "flex flex-col items-center justify-center font-bold uppercase tracking-wider gap-y-1 sm:gap-y-2",
                textClassName,
                customClassName
            )}
            initial="initial"
            animate="animate"
            exit="exit"
            variants={{
                initial: { opacity: 1 },
                animate: {
                    opacity: 1,
                    transition: {
                        staggerChildren: staggerDelay,
                    },
                },
                exit: {
                    opacity: 1,
                    transition: {
                        staggerChildren: exitStaggerDelay,
                    },
                },
            }}
        >
            {lines.map((line, lineIdx) => {
                const wordsInLine = line.split(" ").filter(Boolean)
                return (
                    <div
                        key={`line-${lineIdx}`}
                        className="flex flex-wrap items-center justify-center gap-x-[0.28em] leading-none"
                    >
                        {wordsInLine.map((word, wordIdx) => (
                            <span
                                key={`word-${lineIdx}-${wordIdx}`}
                                className="inline-flex whitespace-nowrap"
                            >
                                {word.split("").map((char) => {
                                    const charKey = `char-${globalCharIndex++}`
                                    return (
                                        <Letter
                                            key={charKey}
                                            char={char}
                                            letterDuration={letterDuration}
                                        />
                                    )
                                })}
                            </span>
                        ))}
                    </div>
                )
            })}
        </motion.div>
    )
})

export function FlipFadeText({
    words = defaultWords,
    interval = 3200,
    className,
    textClassName,
    letterDuration = 0.5,
    staggerDelay = 0.03,
    exitStaggerDelay = 0.015,
}: FlipFadeTextProps) {
    const [index, setIndex] = useState(0)

    const updateIndex = useCallback(() => {
        setIndex((prev) => (prev + 1) % words.length)
    }, [words.length])

    useEffect(() => {
        if (words.length <= 1) return
        const timer = setInterval(updateIndex, interval)
        return () => clearInterval(timer)
    }, [updateIndex, interval, words.length])

    const currentItem = words[index]
    const currentText = typeof currentItem === "string" ? currentItem : currentItem.text
    const currentCustomClass = typeof currentItem === "string" ? undefined : currentItem.className

    return (
        <div className={cn("flex items-center justify-center min-h-[2.15em]", className)}>
            <div className="relative flex items-center justify-center w-full min-h-[2.15em]" style={{ perspective: "1000px" }}>
                <AnimatePresence mode="wait">
                    <Word
                        key={`${index}-${currentText}`}
                        text={currentText}
                        customClassName={currentCustomClass}
                        staggerDelay={staggerDelay}
                        exitStaggerDelay={exitStaggerDelay}
                        letterDuration={letterDuration}
                        textClassName={textClassName}
                    />
                </AnimatePresence>
            </div>
        </div>
    )
}

export default FlipFadeText
