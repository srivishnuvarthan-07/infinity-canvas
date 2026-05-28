import React from "react";
import { Box } from "lucide-react";

export function LoadingScreen() {
    return (
        <div className="fixed inset-0 bg-[#FAF9F5] flex flex-col items-center justify-center z-[9999]">
            <div className="relative flex flex-col items-center">
                {/* The Logo with a gentle float and pulse */}
                <div className="h-20 w-20 bg-slate-900 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-indigo-500/20 animate-bounce transition-all">
                    <Box className="h-10 w-10 animate-pulse text-indigo-300" strokeWidth={1.5} />
                </div>
                
                {/* Minimalist animated loading text */}
                <div className="mt-8 flex flex-col items-center gap-2">
                    <h2 className="text-xl font-black tracking-tight text-slate-800 flex items-center gap-1">
                        InfiniCanvas
                    </h2>
                    <div className="flex gap-1.5 items-center justify-center h-4">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-[bounce_1s_infinite_0ms]"></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-[bounce_1s_infinite_200ms]"></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-[bounce_1s_infinite_400ms]"></span>
                    </div>
                </div>
                
                {/* Subtle grid background specific to the loader */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-[radial-gradient(#00000008_1.5px,transparent_1.5px)] [background-size:24px_24px] rounded-full pointer-events-none -z-10 animate-spin-slow opacity-60"></div>
            </div>
        </div>
    );
}
