import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Thermometer, 
  Sun, 
  Cloud, 
  CloudRain, 
  CloudSnow, 
  Wind, 
  MapPin, 
  Navigation, 
  Clock, 
  AlertTriangle, 
  RefreshCw,
  Sparkles
} from "lucide-react";

interface WeatherData {
  temperature: string;
  weather: string;
  location: string;
  tips: string;
}

export default function App() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [loadingText, setLoadingText] = useState<string>("আপনার ব্রাউজার থেকে অবস্থান সংগ্রহ করা হচ্ছে...");
  const [resultData, setResultData] = useState<WeatherData | null>(null);
  const [progress, setProgress] = useState<number>(100);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Rotate loading text feedback during search grounding
  useEffect(() => {
    if (status !== "loading") return;
    const texts = [
      "ব্রাউজার কোঅর্ডিনেট বিশ্লেষণ করা হচ্ছে...",
      "স্যাটেলাইট ওয়েদার স্টেশন থেকে তথ্য মেলানো হচ্ছে...",
      "জেমিলাই এআই (Gemini AI) দ্বারা রিয়েল-টাইম সার্চ গ্রাউন্ডিং করা হচ্ছে...",
      "আপনার বর্তমান অঞ্চলের তাপমাত্রা সাজানো হচ্ছে..."
    ];
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % texts.length;
      setLoadingText(texts[index]);
    }, 1200);

    return () => clearInterval(interval);
  }, [status]);

  // Handle the 5-seconds automatic return countdown when showing success result
  useEffect(() => {
    if (status !== "success") return;

    const totalTime = 5000; // 5 seconds
    const intervalTime = 50; // update progress every 50ms
    const totalSteps = totalTime / intervalTime; // 100 steps
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      setProgress(((totalSteps - currentStep) / totalSteps) * 100);

      if (currentStep >= totalSteps) {
        clearInterval(timer);
        handleBackToIdle();
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [status]);

  const handleBackToIdle = () => {
    setStatus("idle");
    setErrorMsg(null);
    setResultData(null);
    setProgress(100);
  };

  const checkTemperature = async () => {
    setStatus("loading");
    setErrorMsg(null);
    setLoadingText("আপনার ব্রাউজার থেকে অবস্থান সংগ্রহ করা হচ্ছে...");

    if (!navigator.geolocation) {
      setStatus("error");
      setErrorMsg("দুঃখিত, আপনার ব্রাউজারটি Geolocation সমর্থন করে না। ক্রোম বা সাফারি ব্যবহার করুন।");
      return;
    }

    try {
      // Prompt user for standard browser Geolocation
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 10000,
          enableHighAccuracy: true
        });
      });

      setLoadingText("সার্ভার থেকে রিয়েল-টাইম আবহাওয়া খোঁজ করা হচ্ছে...");

      const response = await fetch("/api/temperature", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          lat: position.coords.latitude,
          lon: position.coords.longitude
        })
      });

      const resJson = await response.json();

      if (resJson.success && resJson.data) {
        setResultData(resJson.data);
        setStatus("success");
      } else {
        throw new Error(resJson.error || "আপনার অবস্থানের তাপমাত্রা খুঁজে পাওয়া যায়নি।");
      }
    } catch (err: any) {
      console.error(err);
      let localizedError = "আপনার ব্রাউজার লোকেশন অনুমতি দেওয়া হয়নি অথবা সংযোগ বিচ্ছিন্ন।";
      
      if (err.code === 1) { // PERMISSION_DENIED
        localizedError = "লোকেশনের পারমিশন ব্লক করা আছে। ক্রোম/সাফারি এর সাইট সেটিংসে গিয়ে লোকেশন অ্যাক্সেস অন করুন।";
      } else if (err.code === 2) { // POSITION_UNAVAILABLE
        localizedError = "আপনার ডিভাইসের বর্তমান অবস্থান নির্ধারণ করা সম্ভব হচ্ছে না।";
      } else if (err.code === 3) { // TIMEOUT
        localizedError = "অবস্থান নির্ধারণ করতে বেশি সময় লেগেছে। অনুগ্রহ করে আবার চেষ্টা করুন।";
      } else if (err.message) {
        localizedError = err.message;
      }
      
      setStatus("error");
      setErrorMsg(localizedError);
    }
  };

  // Helper to choose the right icon matching weather conditions
  const renderWeatherIcon = (weather: string) => {
    const w = weather.toLowerCase();
    if (w.includes("বৃষ্টি") || w.includes("rain") || w.includes("ঝড়") || w.includes("storm") || w.includes("জল")) {
      return (
        <span className="relative flex items-center justify-center">
          <CloudRain className="w-20 h-20 text-blue-400 animate-bounce" />
        </span>
      );
    }
    if (w.includes("মেঘ") || w.includes("cloud") || w.includes("প্যাঁচ") || w.includes("কুয়াশা") || w.includes("fog") || w.includes("ধোঁয়া")) {
      return (
        <span className="relative flex items-center justify-center">
          <Cloud className="w-20 h-20 text-slate-400 animate-pulse" />
        </span>
      );
    }
    if (w.includes("তুষার") || w.includes("snow") || w.includes("শীতল") || w.includes("ঠান্ডা") || w.includes("cold")) {
      return <CloudSnow className="w-20 h-20 text-sky-200" />;
    }
    if (w.includes("বাতাস") || w.includes("wind") || w.includes("ঝড়ো")) {
      return <Wind className="w-20 h-20 text-teal-300" />;
    }
    return (
      <span className="relative flex items-center justify-center">
        <Sun className="w-20 h-20 text-amber-400 animate-spin" style={{ animationDuration: "20s" }} />
      </span>
    );
  };

  // Convert English digit display to Bengali digit
  const getBengaliNumber = (num: number) => {
    const bh = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
    return num.toString().split("").map(digit => bh[parseInt(digit)] || digit).join("");
  };

  return (
    <div id="app-container" className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans antialiased selection:bg-blue-600 selection:text-white">
      
      {/* Background ambient glowing blobs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full filter blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full filter blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-6 py-4 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30">
              <Navigation className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                লাইভ আবহাওয়া <span className="text-xs bg-blue-500/15 text-blue-300 px-2 py-0.5 rounded-full font-mono border border-blue-500/20 font-bold">GPS AUTO</span>
              </h1>
              <p className="text-xs text-slate-400">ক্রোম, সাফারি ও গ্লোবাল ব্রাউজার লোকেশন ভিত্তিক তাপমাত্রা পরিমাপক</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 bg-slate-800/40 px-3 py-1.5 rounded-lg border border-slate-700/50">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span>অটো-রিপ্লে: ৫ সেকেন্ড</span>
          </div>
        </div>
      </header>

      {/* Main Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 flex flex-col justify-center items-center z-10">
        <div className="w-full max-w-lg min-h-[420px] flex flex-col justify-center">
          
          <AnimatePresence mode="wait">
            
            {/* 1. IDLE STATE LAYOUT (NO SEARCH BOX AT ALL) */}
            {status === "idle" && (
              <motion.div
                key="idle-view"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-lg flex flex-col space-y-8 text-center"
                id="panel-main-controls"
              >
                <div className="space-y-3">
                  <div className="mx-auto w-20 h-20 bg-blue-600/15 text-blue-400 rounded-2xl flex items-center justify-center border border-blue-500/20 mb-4 animate-[bounce_3s_infinite]">
                    <Thermometer className="w-12 h-12" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-snug">
                    আপনার চারপাশের তাপমাত্রা দেখুন
                  </h2>
                  <p className="text-sm text-slate-300 max-w-sm mx-auto leading-relaxed">
                    নিচের বাটনে চাপ দিলে ব্রাউজার লোকেশনের (GPS) মাধ্যমে আপনার চারপাশের রিয়েল-টাইম তাপমাত্রা স্বয়ংক্রিয়ভাবে পরিমাপ করা হবে।
                  </p>
                </div>

                {/* Nice warning / explanation for location */}
                <div className="flex items-center gap-3 bg-blue-950/20 border border-blue-900/30 p-4 rounded-xl text-left max-w-sm mx-auto">
                  <Navigation className="w-5 h-5 text-blue-400 shrink-0 animate-pulse" />
                  <p className="text-xs text-slate-400 leading-normal">
                    ক্রোম বা সাফারিতে লোকেশন পারমিশন চাইলে <strong className="text-blue-300">Allow / OK</strong> নির্বাচন করুন।
                  </p>
                </div>

                {/* Primary Button */}
                <button
                  id="btn-fetch-temp"
                  onClick={checkTemperature}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.98] text-white font-semibold py-4 px-6 rounded-2xl transition-all shadow-xl shadow-blue-900/20 hover:shadow-blue-500/15 flex items-center justify-center gap-2.5 group cursor-pointer text-base"
                >
                  <Navigation className="w-5 h-5 text-indigo-200 group-hover:rotate-12 transition-transform" />
                  <span>এখন তাপমাত্রা মাপুন</span>
                </button>
              </motion.div>
            )}

            {/* 2. LOADING STATE */}
            {status === "loading" && (
              <motion.div
                key="loading-view"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-lg flex flex-col items-center justify-center text-center space-y-6"
                id="loading-container"
              >
                <div className="relative flex items-center justify-center w-24 h-24">
                  {/* Outer spinning ring */}
                  <div className="absolute inset-0 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin" />
                  {/* Inner pulse element */}
                  <Thermometer className="w-10 h-10 text-blue-400 animate-pulse" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-white">অবস্থান খোঁজ করা হচ্ছে...</h3>
                  <p className="text-xs sm:text-sm text-slate-400 min-h-[48px] max-w-xs mx-auto animate-pulse">
                    {loadingText}
                  </p>
                </div>

                <div className="w-40 bg-slate-950 h-1.5 rounded-full overflow-hidden relative">
                  <div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-teal-400 h-full absolute inset-y-0 w-3/4 animate-[shimmer_1.5s_infinite]" />
                </div>
              </motion.div>
            )}

            {/* 3. SUCCESS STATE WITH DYNAMIC TIMER BAR */}
            {status === "success" && resultData && (
              <motion.div
                key="success-view"
                initial={{ opacity: 0, y: 15, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -15, scale: 0.98 }}
                className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-lg relative"
                id="result-display-panel"
              >
                {/* Glowing ring/glow according to weather */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-400 to-teal-500 shadow-xl shadow-blue-500/50" />

                <div className="p-6 sm:p-8 space-y-6 flex flex-col items-center">
                  
                  {/* Weather Icon Category */}
                  <div className="flex justify-center p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 shadow-inner w-32 h-32 items-center">
                    {renderWeatherIcon(resultData.weather)}
                  </div>

                  {/* Temperature Info Display */}
                  <div className="text-center space-y-1">
                    <span className="text-xs text-blue-400 uppercase tracking-widest font-mono font-bold flex items-center justify-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: "3s" }} />
                      আপনার এলাকার আবহাওয়া
                    </span>
                    <h2 className="text-6xl sm:text-7xl font-bold font-display text-white tracking-tighter my-2">
                      {resultData.temperature}
                    </h2>
                    <div className="flex items-center justify-center gap-1 text-slate-200 font-semibold text-lg">
                      <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                      <span>{resultData.location}</span>
                    </div>
                    <p className="text-slate-400 font-medium text-sm mt-1 bg-slate-950/60 py-1.5 px-4 rounded-full border border-slate-850 inline-block">
                      অবস্থা: {resultData.weather}
                    </p>
                  </div>

                  {/* Personal Suggestion / AI Tips */}
                  {resultData.tips && (
                    <div className="w-full bg-blue-950/15 border border-blue-900/30 p-4 rounded-2xl text-center">
                      <p className="text-xs text-blue-300 font-semibold tracking-wide font-mono mb-1">এআই পরামর্শ (Advice):</p>
                      <p className="text-sm text-slate-200 leading-relaxed">{resultData.tips}</p>
                    </div>
                  )}

                  {/* Interactive Button to forcefully trigger early return */}
                  <button
                    id="btn-return-early"
                    onClick={handleBackToIdle}
                    className="text-xs bg-slate-950/80 border border-slate-800 hover:border-slate-755 text-slate-400 hover:text-white py-2.5 px-4 rounded-xl transition-all font-medium cursor-pointer shrink-0"
                  >
                    নতুন পরিমাপ করতে ফিরে যান
                  </button>

                </div>

                {/* COUNTDOWN TIMER COMPONENT & VISUAL SLIDER */}
                <div className="border-t border-slate-800 bg-slate-950/60 px-6 py-4 flex items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-400 font-mono font-medium">
                    <Clock className="w-4 h-4 text-blue-500 animate-spin" style={{ animationDuration: "6s" }} />
                    <span>স্বয়ংক্রিয় প্রস্থান: <strong className="text-blue-400 font-semibold tracking-wider font-display text-sm pl-0.5">{getBengaliNumber(Math.ceil((progress / 100) * 5))}</strong> সেকেন্ড</span>
                  </div>
                  
                  {/* Progress Indicator Track Bar */}
                  <div className="flex-1 max-w-xs h-2 bg-slate-900 border border-slate-800 rounded-full overflow-hidden relative">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-75 ease-linear progress-bar-glow"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

              </motion.div>
            )}

            {/* 4. ERROR STATE */}
            {status === "error" && (
              <motion.div
                key="error-view"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="bg-slate-900 border border-red-900/40 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-lg flex flex-col items-center justify-center text-center space-y-5"
                id="error-block-container"
              >
                <div className="w-14 h-14 bg-red-650/15 text-red-500 rounded-2xl flex items-center justify-center border border-red-500/20 shadow-lg shadow-red-900/10">
                  <AlertTriangle className="w-7 h-7" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-white">লোকেশনের অনুমতি পাওয়া যায়নি</h3>
                  <p className="text-sm text-slate-400 max-w-xs mx-auto leading-relaxed">
                    {errorMsg || "অপ্রত্যাশিত সার্ভার বা ব্রাউজার কোঅর্ডিনেট বিভ্রাট ঘটেছে। অনুগ্রহ করে আবার লোকেশন অ্যাক্সেস অন করে চেষ্টা করুন।"}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    id="btn-retry"
                    onClick={() => {
                      setStatus("idle");
                      setErrorMsg(null);
                    }}
                    className="bg-slate-950 border border-slate-850 hover:border-slate-700 text-slate-300 hover:text-white font-medium py-2.5 px-5 rounded-xl text-sm transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>পিছনে যান</span>
                  </button>
                  <button
                    id="btn-direct-retry"
                    onClick={checkTemperature}
                    className="bg-red-600 hover:bg-red-500 text-white font-semibold py-2.5 px-5 rounded-xl text-sm transition-all shadow-lg hover:shadow-red-500/10 cursor-pointer"
                  >
                    আবার চেষ্টা করুন
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 px-6 py-4 text-center text-xs text-slate-500 bg-slate-950">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <p>© {new Date().getFullYear()} তাপমাত্রা পরিমাপক অ্যাপ। সর্বস্বত্ব সংরক্ষিত।</p>
          <p className="text-slate-600 font-mono">Chrome & Safari ব্রাউজার সামঞ্জস্যপূর্ণ</p>
        </div>
      </footer>

    </div>
  );
}
