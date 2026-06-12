"use client";

import { useState, useRef, useEffect } from "react";
import { Search, MapPin, CalendarClock, Pill, Clock, AlertCircle, List, TrendingUp, Home as HomeIcon, Navigation, Store, Upload, Trash2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { farmacias } from "@/data/mockData";

// Bounding box limits for the static map of Quilpué
const MIN_LAT = -33.060;
const MAX_LAT = -33.035;
const MIN_LNG = -71.455;
const MAX_LNG = -71.420;

// Converts coordinates to percentage positions
const getMarkerPosition = (lat: number, lng: number) => {
  const left = ((lng - MIN_LNG) / (MAX_LNG - MIN_LNG)) * 100;
  const top = ((MAX_LAT - lat) / (MAX_LAT - MIN_LAT)) * 100;
  return { left: `${left}%`, top: `${top}%` };
};

export default function Home() {
  const [activeTab, setActiveTab] = useState("search");
  const [searchTerm, setSearchTerm] = useState("");
  const [isClient, setIsClient] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [maxPrice, setMaxPrice] = useState<number>(6000);
  const [sortBy, setSortBy] = useState<string>("default");
  const [isSeniorMode, setIsSeniorMode] = useState<boolean>(false);
  const [showWelcomeQuestion, setShowWelcomeQuestion] = useState<boolean>(true);

  // States for local registration
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [showRegisterSuccess, setShowRegisterSuccess] = useState(false);
  const [registerForm, setRegisterForm] = useState({
    nombreLocal: "",
    personaCargo: "",
    direccion: "",
    telefono: "",
    correo: "",
  });
  const [photos, setPhotos] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States for map reporting
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [showReportSuccess, setShowReportSuccess] = useState(false);
  const [reportTarget, setReportTarget] = useState("");
  const [reportType, setReportType] = useState("cerrado");
  const [reportDetails, setReportDetails] = useState("");

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      if (photos.length + files.length > 5) {
        alert("¡Máximo 5 fotos permitidas!");
        return;
      }
      const newUrls = files.map(file => URL.createObjectURL(file));
      setPhotos(prev => [...prev, ...newUrls].slice(0, 5));
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsRegisterOpen(false);
    setShowRegisterSuccess(true);
    setRegisterForm({
      nombreLocal: "",
      personaCargo: "",
      direccion: "",
      telefono: "",
      correo: "",
    });
    setPhotos([]);
  };

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsReportOpen(false);
    setShowReportSuccess(true);
    setReportDetails("");
  };

  const openReportForLocal = (localName: string) => {
    setReportTarget(localName);
    setReportType("cerrado");
    setIsReportOpen(true);
  };

  useEffect(() => {
    setIsClient(true);
    setCurrentDate(new Date());
  }, []);

  const getTurno = (date: Date) => {
    const dayIndex = Math.floor(date.getTime() / (1000 * 60 * 60 * 24));
    return farmacias[dayIndex % farmacias.length];
  };

  const todayTurno = getTurno(currentDate);
  const nextTurnos = Array.from({ length: 5 }).map((_, i) => {
    const d = new Date(currentDate);
    d.setDate(currentDate.getDate() + i + 1);
    return {
      date: d,
      farmacia: getTurno(d)
    };
  });

  const meses = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];

  // Map drag state
  const [mapPosition, setMapPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX - mapPosition.x, y: e.clientY - mapPosition.y };
    if (e.target instanceof Element) {
      e.target.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const newX = e.clientX - dragStart.current.x;
    const newY = e.clientY - dragStart.current.y;
    const limit = 200; // Drag limit
    setMapPosition({
      x: Math.max(-limit, Math.min(limit, newX)),
      y: Math.max(-limit, Math.min(limit, newY)),
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    if (e.target instanceof Element) {
      e.target.releasePointerCapture(e.pointerId);
    }
  };

  const rawBuscados = searchTerm.length > 2
    ? farmacias.flatMap(f =>
      f.medicamentos
        .filter(m => m.nombre.toLowerCase().includes(searchTerm.toLowerCase()))
        .map(m => ({ ...m, farmacia: f }))
    )
    : [];

  const medicamentosBuscados = rawBuscados
    .filter(item => item.precio <= maxPrice)
    .sort((a, b) => {
      if (sortBy === "price") {
        return a.precio - b.precio;
      }
      if (sortBy === "stock") {
        return (b.stockCantidad || 0) - (a.stockCantidad || 0);
      }
      return 0;
    });

  return (
    <div className={`min-h-screen pb-20 font-sans transition-colors duration-300 ${isSeniorMode ? 'bg-amber-50/40' : 'bg-slate-50'}`}>
      {/* Welcome Accessibility Dialog */}
      {isClient && showWelcomeQuestion && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-white border-4 border-emerald-600 rounded-3xl p-6 shadow-2xl animate-in zoom-in duration-200">
            <CardContent className="space-y-6 pt-4 text-center">
              <div className="text-5xl">👵👴</div>
              <h2 className="text-3xl font-black text-slate-900 leading-tight">
                ¿Necesitas la letra más grande y botones más fáciles de usar?
              </h2>
              <p className="text-lg text-slate-600 font-bold">
                (Optimizado para adultos mayores o personas con dificultades visuales)
              </p>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <button
                  onClick={() => {
                    setIsSeniorMode(true);
                    setShowWelcomeQuestion(false);
                  }}
                  className="h-20 text-2xl font-black rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg active:scale-95 border-none cursor-pointer flex items-center justify-center gap-2"
                >
                  🟢 SÍ
                </button>
                <button
                  onClick={() => {
                    setIsSeniorMode(false);
                    setShowWelcomeQuestion(false);
                  }}
                  className="h-20 text-2xl font-black rounded-2xl bg-slate-200 hover:bg-slate-300 text-slate-800 shadow-md active:scale-95 border-none cursor-pointer flex items-center justify-center gap-2"
                >
                  ⚪ NO
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Floating Button for Subir Local */}
      {isClient && (
        <div className="fixed top-28 right-0 z-40">
          <button
            onClick={() => setIsRegisterOpen(true)}
            className="bg-white text-slate-900 border-l border-y border-slate-200/80 shadow-xl hover:bg-slate-50 flex items-center gap-2 pl-4 pr-5 py-3 rounded-l-full font-black text-sm transition-all active:scale-95 duration-200 group border-r-0 cursor-pointer"
          >
            <Store className="h-5 w-5 text-emerald-600 transition-transform group-hover:scale-110" />
            <span>Subir Local</span>
          </button>
        </div>
      )}

      {/* Accessibility Bar */}
      <div className={`p-4 text-center border-b transition-colors duration-300 ${isSeniorMode ? 'bg-amber-100 text-amber-950 border-amber-200' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
        <div className="max-w-md mx-auto flex items-center justify-between gap-3 px-1">
          <div className="flex items-center gap-2 text-left">
            <span className="text-xl">👵👴</span>
            <span className={`font-bold leading-tight ${isSeniorMode ? 'text-base text-amber-950' : 'text-xs text-slate-700'}`}>
              {isSeniorMode ? "Modo Adulto Mayor Activo" : "Acceso Adulto Mayor (Letra Grande)"}
            </span>
          </div>
          <button
            onClick={() => setIsSeniorMode(!isSeniorMode)}
            className={`px-4 py-2 rounded-2xl font-black transition-all shadow-md active:scale-95 border-none cursor-pointer ${isSeniorMode
                ? 'bg-red-600 hover:bg-red-700 text-white text-sm'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white text-xs'
              }`}
          >
            {isSeniorMode ? "Volver a Vista Normal" : "Ver con Letra Grande"}
          </button>
        </div>
      </div>

      {/* Header */}
      <header className={`bg-emerald-600 text-white p-6 shadow-md rounded-b-3xl ${isSeniorMode ? 'py-8' : ''}`}>
        <div className="max-w-md mx-auto text-center sm:text-left">
          <a href="/" className={`font-bold flex items-center gap-2 hover:opacity-90 transition-opacity justify-center sm:justify-start w-full sm:w-max cursor-pointer ${isSeniorMode ? 'text-4xl font-black' : 'text-3xl'}`}>
            <Pill className={`shrink-0 ${isSeniorMode ? 'h-10 w-10 text-yellow-300' : 'h-8 w-8'}`} />
            PrecioSano
          </a>
          <p className={`mt-2 text-emerald-100 ${isSeniorMode ? 'text-lg font-bold' : 'text-sm'}`}>Encuentra tu local de salud rápido y fácil.</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto mt-6 px-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={`grid w-full grid-cols-4 bg-white shadow-sm border rounded-2xl transition-all ${isSeniorMode ? 'h-24 mb-8 border-emerald-600 border-2 p-1.5' : 'h-16 mb-6'}`}>
            <TabsTrigger value="search" className={`flex flex-col items-center justify-center gap-1 data-[state=active]:text-emerald-600 rounded-xl h-full transition-all ${isSeniorMode ? 'data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700' : ''}`}>
              <Search className={isSeniorMode ? 'h-6 w-6 stroke-[2.5px]' : 'h-5 w-5'} />
              <span className={isSeniorMode ? 'text-xs font-black' : 'text-[10px] font-semibold'}>Remedios</span>
            </TabsTrigger>
            <TabsTrigger value="map" className={`flex flex-col items-center justify-center gap-1 data-[state=active]:text-emerald-600 rounded-xl h-full transition-all ${isSeniorMode ? 'data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700' : ''}`}>
              <MapPin className={isSeniorMode ? 'h-6 w-6 stroke-[2.5px]' : 'h-5 w-5'} />
              <span className={isSeniorMode ? 'text-xs font-black' : 'text-[10px] font-semibold'}>Mapa</span>
            </TabsTrigger>
            <TabsTrigger value="list" className={`flex flex-col items-center justify-center gap-1 data-[state=active]:text-emerald-600 rounded-xl h-full transition-all ${isSeniorMode ? 'data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700' : ''}`}>
              <List className={isSeniorMode ? 'h-6 w-6 stroke-[2.5px]' : 'h-5 w-5'} />
              <span className={isSeniorMode ? 'text-xs font-black' : 'text-[10px] font-semibold'}>Farmacias</span>
            </TabsTrigger>
            <TabsTrigger value="duty" className={`flex flex-col items-center justify-center gap-1 data-[state=active]:text-emerald-600 rounded-xl h-full transition-all ${isSeniorMode ? 'data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700' : ''}`}>
              <CalendarClock className={isSeniorMode ? 'h-6 w-6 stroke-[2.5px]' : 'h-5 w-5'} />
              <span className={isSeniorMode ? 'text-xs font-black' : 'text-[10px] font-semibold'}>Turnos</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB: BÚSQUEDA DE REMEDIOS */}
          <TabsContent value="search" className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className={`absolute text-gray-400 ${isSeniorMode ? 'left-5 top-5 h-7 w-7 text-emerald-600' : 'left-4 top-3.5 h-5 w-5'}`} />
                <Input
                  placeholder={isSeniorMode ? "BUSCAR REMEDIO AQUÍ..." : "Ej. Paracetamol, Ibuprofeno..."}
                  className={`pl-12 rounded-2xl shadow-sm transition-all bg-white ${isSeniorMode
                      ? 'pl-16 h-18 text-2xl font-black border-emerald-600 border-3 text-black placeholder:text-gray-500'
                      : 'h-14 text-lg border-gray-200 focus-visible:ring-emerald-500'
                    }`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button
                variant="outline"
                className={`p-0 rounded-2xl shadow-sm border-gray-200 bg-white hover:bg-emerald-50 hover:text-emerald-600 transition-colors shrink-0 ${isSeniorMode ? 'h-18 w-18' : 'h-14 w-14'}`}
                onClick={() => window.location.href = '/'}
              >
                <HomeIcon className={isSeniorMode ? 'h-8 w-8' : 'h-6 w-6'} />
              </Button>
            </div>

            {searchTerm.length <= 2 && (
              <div className="mt-6 animate-in fade-in duration-500">
                <h3 className={`font-semibold text-gray-700 flex items-center gap-2 px-1 mb-4 ${isSeniorMode ? 'text-xl font-black text-black' : ''}`}>
                  <TrendingUp className={`text-emerald-500 ${isSeniorMode ? 'h-6 w-6' : 'h-5 w-5'}`} />
                  {isSeniorMode ? 'TOCA UN MEDICAMENTO PARA BUSCAR:' : 'Más Buscados en Chile'}
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {['Paracetamol', 'Losartán', 'Ibuprofeno', 'Ketorolaco', 'Zopiclona', 'Clorfenamina'].map(med => (
                    <Card
                      key={med}
                      className={`cursor-pointer border transition-colors shadow-sm ${isSeniorMode
                          ? 'border-emerald-600 border-2 bg-amber-50 hover:bg-amber-100 hover:border-emerald-700'
                          : 'border-gray-100 hover:border-emerald-300 hover:bg-emerald-50'
                        }`}
                      onClick={() => setSearchTerm(med)}
                    >
                      <CardContent className={`text-center ${isSeniorMode ? 'p-5' : 'p-3'}`}>
                        <span className={`font-semibold text-gray-700 ${isSeniorMode ? 'text-lg font-black text-black' : 'text-sm'}`}>{med}</span>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {searchTerm.length > 2 && (
              <div className="space-y-3 mt-4">
                {/* Controles de Filtro y Ordenamiento */}
                <Card className="rounded-2xl border-none shadow-sm bg-white p-4 space-y-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    {/* Filtro de Precio */}
                    <div className="flex-1 space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold text-gray-500">
                        <span>PRECIO MÁXIMO</span>
                        <span className="text-emerald-600 text-sm font-extrabold">${maxPrice.toLocaleString('es-CL')}</span>
                      </div>
                      <input
                        type="range"
                        min="500"
                        max="6000"
                        step="100"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                      />
                    </div>

                    {/* Ordenamiento */}
                    <div className="flex flex-col gap-2 min-w-[150px]">
                      <span className="text-xs font-bold text-gray-500">ORDENAR POR</span>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="h-10 px-3 text-xs font-bold rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-gray-700 cursor-pointer shadow-sm"
                      >
                        <option value="default">Relevancia</option>
                        <option value="price">Menor precio</option>
                        <option value="stock">Mayor stock</option>
                      </select>
                    </div>
                  </div>
                </Card>

                <h3 className={`font-semibold text-gray-700 flex items-center gap-2 px-1 pt-2 ${isSeniorMode ? 'text-2xl font-black text-black' : ''}`}>
                  Resultados para "{searchTerm}"
                </h3>
                {medicamentosBuscados.length > 0 ? (
                  medicamentosBuscados.map((item: any, idx) => (
                    <Card
                      key={idx}
                      className={`rounded-2xl border-none shadow-md overflow-hidden hover:shadow-lg transition-shadow bg-white ${isSeniorMode ? 'border-4 border-emerald-600 shadow-xl' : ''
                        }`}
                    >
                      <CardContent className={`bg-white ${isSeniorMode
                          ? 'p-6 flex flex-col gap-4'
                          : 'p-5 flex justify-between items-center'
                        }`}>
                        <div className={isSeniorMode ? 'space-y-2' : ''}>
                          <div className={`flex items-center gap-2 mb-1 flex-wrap ${isSeniorMode ? 'justify-between' : ''}`}>
                            <span className={`capitalize ${isSeniorMode ? 'text-3xl font-black text-slate-900' : 'font-bold text-lg text-gray-800'}`}>{item.nombre}</span>
                            <span className={`text-emerald-700 ${isSeniorMode ? 'text-3xl font-black bg-emerald-50 px-3 py-1 rounded-2xl' : 'font-bold text-xl'}`}>${item.precio.toLocaleString('es-CL')}</span>
                          </div>
                          <p className={`font-semibold text-gray-800 ${isSeniorMode ? 'text-xl font-black text-emerald-800 mt-2' : 'text-sm'}`}>{item.farmacia.nombre}</p>
                          <p className={`text-gray-500 flex items-center gap-1 mt-1 ${isSeniorMode ? 'text-lg font-bold text-slate-700' : 'text-xs'}`}>
                            <MapPin className={isSeniorMode ? 'h-5 w-5 text-emerald-600' : 'h-3 w-3'} /> {item.farmacia.direccion}
                          </p>
                        </div>
                        <div className={isSeniorMode ? 'flex flex-col gap-3 mt-2 border-t pt-4 border-slate-100' : 'flex flex-col items-end gap-2.5'}>
                          {item.stock ? (
                            <div className={isSeniorMode ? 'flex items-center justify-between bg-emerald-50 p-3 rounded-2xl border-2 border-emerald-500/20' : 'flex flex-col items-end'}>
                              <Badge variant="default" className={`bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-none shadow-none font-semibold ${isSeniorMode ? 'text-base font-black px-4 py-1.5' : ''}`}>HAY STOCK</Badge>
                              <span className={`text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full mt-1 ${isSeniorMode ? 'text-lg font-black bg-emerald-100' : 'text-[10px]'}`}>{item.stockCantidad} unids. disponibles</span>
                            </div>
                          ) : (
                            <Badge variant="destructive" className={`bg-red-100 text-red-800 hover:bg-red-200 border-none shadow-none font-semibold ${isSeniorMode ? 'text-lg font-black w-full text-center justify-center py-2' : ''}`}>SIN STOCK</Badge>
                          )}
                          {item.stock && (
                            <Dialog>
                              <DialogTrigger className={
                                isSeniorMode
                                  ? 'inline-flex items-center justify-center h-16 w-full rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-lg shadow-lg font-black transition-colors cursor-pointer border-none'
                                  : 'inline-flex items-center justify-center h-8 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs shadow-md font-medium transition-colors cursor-pointer border-none'
                              }>
                                {isSeniorMode ? '🟢 TOCAR AQUÍ PARA VER DIRECCIÓN Y HORARIO' : 'Ver Local'}
                              </DialogTrigger>
                              <DialogContent className="rounded-3xl sm:max-w-md w-[90%]">
                                <DialogHeader>
                                  <DialogTitle className={`text-emerald-800 ${isSeniorMode ? 'text-3xl font-black' : 'text-xl'}`}>{item.farmacia.nombre}</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                  <div className="flex items-center gap-3 text-gray-600 border-b pb-2">
                                    <MapPin className="text-emerald-600 h-6 w-6 shrink-0" />
                                    <span className={isSeniorMode ? 'text-lg font-bold text-black' : 'text-sm'}>{item.farmacia.direccion}</span>
                                  </div>
                                  <div className="flex items-center gap-3 text-gray-600 border-b pb-2">
                                    <Clock className="text-emerald-600 h-6 w-6 shrink-0" />
                                    <span className={isSeniorMode ? 'text-lg font-bold text-black' : 'text-sm'}>Horario: {item.farmacia.horario}</span>
                                  </div>
                                  <div className="bg-emerald-50 p-6 rounded-2xl flex flex-col items-center justify-center border border-emerald-100 mt-2">
                                    {!isSeniorMode && (
                                      <>
                                        <p className="text-sm font-semibold mb-4 text-emerald-800">Escanea el QR para llevar la ruta</p>
                                        <div className="w-32 h-32 bg-white border-2 border-dashed border-emerald-300 flex items-center justify-center rounded-xl shadow-inner mb-4">
                                          <MapPin className="h-10 w-10 text-emerald-200" />
                                        </div>
                                      </>
                                    )}
                                    <Button className={`w-full bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-lg border-none cursor-pointer text-white ${isSeniorMode ? 'h-16 text-lg font-black' : 'h-12 text-md'}`} onClick={() => {
                                      setActiveTab("map");
                                      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
                                    }}>
                                      {isSeniorMode ? '🗺️ VER EN EL MAPA GRANDE' : 'Abrir en Mapa'}
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-10 text-gray-500 bg-white rounded-2xl shadow-sm border border-gray-100">
                    <AlertCircle className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                    <p className="font-medium">No encontramos "{searchTerm}"</p>
                    <p className="text-xs mt-1">Intenta con otro medicamento común.</p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* TAB: MAPA INTERACTIVO */}
          <TabsContent value="map" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className={`rounded-3xl border-none shadow-md overflow-hidden bg-white ${isSeniorMode ? 'border-4 border-emerald-600' : ''}`}>
              <CardHeader className="bg-emerald-50 pb-4 border-b border-emerald-100">
                <CardTitle className={`flex items-center gap-2 text-emerald-800 ${isSeniorMode ? 'text-2xl font-black' : 'text-lg'}`}>
                  <MapPin className={isSeniorMode ? 'h-6 w-6 text-emerald-700' : 'h-5 w-5 text-emerald-600'} />
                  {isSeniorMode ? 'MAPA DE LOCALES EN QUILPUÉ' : 'Locales Cercanos'}
                </CardTitle>
                <CardDescription className={`text-emerald-600/70 ${isSeniorMode ? 'text-base font-bold' : 'text-xs'}`}>
                  {isSeniorMode ? '👉 Arrastra el mapa para moverte y toca un círculo para ver información.' : 'Farmacias disponibles en tu sector'}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div
                  className={`relative w-full overflow-hidden touch-none bg-slate-200 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} ${isSeniorMode ? 'h-[400px]' : 'h-80'}`}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                >
                  <div
                    className="absolute w-[200%] h-[200%] left-[-50%] top-[-50%]"
                    style={{ transform: `translate(${mapPosition.x}px, ${mapPosition.y}px)` }}
                  >
                    <div className="absolute inset-0 bg-[url('/mapa-quilpue.png')] bg-cover bg-center pointer-events-none"></div>

                    {farmacias.map((f) => {
                      return (
                        <Dialog key={f.id}>
                          <DialogTrigger
                            className="absolute w-12 h-12 flex flex-col items-center justify-center cursor-pointer group z-10 border-none bg-transparent outline-none -translate-x-1/2 -translate-y-1/2"
                            style={getMarkerPosition(f.lat, f.lng)}
                            onPointerDown={(e) => e.stopPropagation()}
                          >
                            <div className={`rounded-full border-2 border-white shadow-lg transition-transform group-hover:scale-125 ${isSeniorMode ? 'w-8 h-8' : 'w-5 h-5'
                              } ${f.abierto ? 'bg-emerald-500' : 'bg-red-400'} ${f.deTurno ? 'animate-pulse ring-4 ring-emerald-200' : ''}`} />
                            <div className={`bg-white font-bold rounded-full shadow-md whitespace-nowrap opacity-90 group-hover:opacity-100 text-gray-700 border border-gray-100 ${isSeniorMode ? 'text-xs px-2.5 py-1 font-black mt-2 border-2 border-slate-300' : 'text-[10px] px-2 py-0.5 mt-1'
                              }`}>
                              {f.nombre.split(' ')[1] || f.nombre.split(' ')[0]}
                            </div>
                          </DialogTrigger>
                          <DialogContent className="rounded-3xl sm:max-w-md w-[90%]">
                            <DialogHeader>
                              <DialogTitle className={`text-emerald-800 ${isSeniorMode ? 'text-3xl font-black' : 'text-xl'}`}>{f.nombre}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="flex items-center gap-3 text-gray-600 border-b pb-2">
                                <MapPin className="text-emerald-600 h-6 w-6 shrink-0" />
                                <span className={isSeniorMode ? 'text-lg font-bold text-black' : 'text-sm'}>{f.direccion}</span>
                              </div>
                              <div className="flex items-center gap-3 text-gray-600 border-b pb-2">
                                <Clock className="text-emerald-600 h-6 w-6 shrink-0" />
                                <span className={isSeniorMode ? 'text-lg font-bold text-black' : 'text-sm'}>Horario: {f.horario}</span>
                              </div>
                              <div className="flex items-center gap-2 mt-2">
                                {f.abierto ? (
                                  <Badge variant="default" className={`bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-none shadow-none font-semibold ${isSeniorMode ? 'text-base font-black px-4 py-1.5' : ''}`}>Abierto Ahora</Badge>
                                ) : (
                                  <Badge variant="destructive" className={`bg-red-100 text-red-800 hover:bg-red-200 border-none shadow-none font-semibold ${isSeniorMode ? 'text-base font-black px-4 py-1.5' : ''}`}>Cerrado</Badge>
                                )}
                                {f.deTurno && (
                                  <Badge variant="outline" className={`bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200 shadow-none font-semibold ${isSeniorMode ? 'text-base font-black px-4 py-1.5' : ''}`}>De Turno</Badge>
                                )}
                              </div>
                              <div className="space-y-2 mt-4">
                                <Button
                                  className={`w-full bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-lg border-none cursor-pointer text-white flex items-center justify-center ${isSeniorMode ? 'h-16 text-lg font-black' : 'h-12 text-md'}`}
                                  onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${f.lat},${f.lng}`, '_blank')}
                                >
                                  <Navigation className="mr-2 h-5 w-5" />
                                  {isSeniorMode ? '🚗 INICIAR RUTA CON GOOGLE MAPS' : 'Ir con Mapas'}
                                </Button>
                                <Button
                                  variant="ghost"
                                  className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl h-10 text-xs font-bold flex items-center justify-center gap-1.5"
                                  onClick={() => {
                                    openReportForLocal(f.nombre);
                                  }}
                                >
                                  <AlertTriangle className="h-4 w-4" />
                                  Reportar local cerrado o inexistente
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
              <div className="w-full px-4 pt-2 bg-white flex justify-center">
                <Button
                  variant="outline"
                  className={`w-full border-red-200 text-red-600 hover:bg-red-50 rounded-2xl flex items-center justify-center gap-2 ${isSeniorMode ? 'h-14 text-base font-black border-2 border-red-400' : 'h-11 text-xs font-bold'}`}
                  onClick={() => {
                    setReportTarget("");
                    setReportType("cerrado");
                    setIsReportOpen(true);
                  }}
                >
                  <AlertTriangle className={isSeniorMode ? 'h-5 w-5' : 'h-4 w-4'} />
                  Reportar problema en el mapa
                </Button>
              </div>
              <CardFooter className={`flex gap-3 flex-wrap bg-white ${isSeniorMode ? 'p-6' : 'p-4'}`}>
                <Badge variant="outline" className={`bg-emerald-50 text-emerald-700 border-emerald-200 rounded-full shadow-sm ${isSeniorMode ? 'text-base font-black px-4 py-2' : 'px-3 py-1'}`}><div className={`rounded-full bg-emerald-500 mr-2 ${isSeniorMode ? 'w-3.5 h-3.5' : 'w-2 h-2'}`} /> Abierto</Badge>
                <Badge variant="outline" className={`bg-red-50 text-red-700 border-red-200 rounded-full shadow-sm ${isSeniorMode ? 'text-base font-black px-4 py-2' : 'px-3 py-1'}`}><div className={`rounded-full bg-red-400 mr-2 ${isSeniorMode ? 'w-3.5 h-3.5' : 'w-2 h-2'}`} /> Cerrado</Badge>
                <Badge variant="outline" className={`bg-blue-50 text-blue-700 border-blue-200 rounded-full shadow-sm ${isSeniorMode ? 'text-base font-black px-4 py-2' : 'px-3 py-1'}`}><div className={`rounded-full bg-blue-500 animate-pulse mr-2 ${isSeniorMode ? 'w-3.5 h-3.5' : 'w-2 h-2'}`} /> De Turno</Badge>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* TAB: LISTA DE FARMACIAS */}
          <TabsContent value="list" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h3 className={`font-bold text-gray-700 ${isSeniorMode ? 'text-2xl font-black text-black' : 'text-lg'}`}>Farmacias en Quilpué</h3>
                <Badge className={`bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-none ${isSeniorMode ? 'text-sm font-black px-3 py-1' : ''}`}>{farmacias.length} locales</Badge>
              </div>
              {farmacias.map((f) => (
                <Card
                  key={f.id}
                  className={`rounded-2xl border-none shadow-sm hover:shadow-md transition-shadow bg-white ${isSeniorMode ? 'border-4 border-emerald-600 shadow-xl' : ''
                    }`}
                >
                  <CardContent className={isSeniorMode ? 'p-6 flex flex-col gap-4 bg-white' : 'p-4 bg-white'}>
                    <div className={isSeniorMode ? 'flex flex-col gap-3' : 'flex justify-between items-start'}>
                      <div>
                        <h3 className={`font-bold text-gray-800 ${isSeniorMode ? 'text-2xl font-black text-black' : 'text-lg'}`}>{f.nombre}</h3>
                        <p className={`text-gray-500 flex items-center gap-1 mt-1 ${isSeniorMode ? 'text-base font-bold text-slate-700' : 'text-sm'}`}>
                          <MapPin className={isSeniorMode ? 'h-5 w-5 text-emerald-600' : 'h-3 w-3'} /> {f.direccion}
                        </p>
                        <p className={`text-gray-500 flex items-center gap-1 mt-1 ${isSeniorMode ? 'text-base font-bold text-slate-700' : 'text-sm'}`}>
                          <Clock className={isSeniorMode ? 'h-5 w-5 text-emerald-600' : 'h-3 w-3'} /> {f.horario}
                        </p>
                      </div>
                      <div className={isSeniorMode ? 'flex gap-3 mt-2 border-t pt-4 border-slate-100' : 'flex flex-col items-end gap-2'}>
                        {f.abierto ? (
                          <Badge variant="default" className={`bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-none shadow-none font-semibold ${isSeniorMode ? 'text-base font-black px-4 py-1.5' : 'text-xs'}`}>ABIERTO</Badge>
                        ) : (
                          <Badge variant="destructive" className={`bg-red-100 text-red-800 hover:bg-red-200 border-none shadow-none font-semibold ${isSeniorMode ? 'text-base font-black px-4 py-1.5' : 'text-xs'}`}>CERRADO</Badge>
                        )}
                        {f.deTurno && (
                          <Badge variant="outline" className={`bg-blue-50 text-blue-700 border-blue-200 shadow-none font-semibold ${isSeniorMode ? 'text-base font-black px-4 py-1.5' : 'text-xs'}`}>DE TURNO</Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      className={`w-full bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md border-none cursor-pointer text-white flex items-center justify-center gap-2 ${isSeniorMode ? 'h-14 text-lg font-black mt-2' : 'h-10 text-sm font-semibold mt-3'}`}
                      onClick={() => setActiveTab("map")}
                    >
                      <MapPin className={isSeniorMode ? 'h-5 w-5' : 'h-4 w-4'} />
                      {isSeniorMode ? '🗺️ VER EN EL MAPA' : 'Ver en el Mapa'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* TAB: TURNOS */}
          <TabsContent value="duty" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {isClient ? (
              <div className="space-y-5">
                <div className={`bg-emerald-600 text-white rounded-3xl p-6 shadow-xl flex items-center justify-between relative overflow-hidden ${isSeniorMode ? 'border-4 border-yellow-400 p-8' : ''}`}>
                  <div className="absolute -right-4 -top-4 opacity-10">
                    <CalendarClock className="h-32 w-32" />
                  </div>
                  <div className="relative z-10 w-full">
                    <Badge className={`bg-emerald-500 text-white hover:bg-emerald-500 border-none mb-3 shadow-sm ${isSeniorMode ? 'text-base font-black px-4 py-1.5 bg-yellow-400 text-emerald-950 hover:bg-yellow-400' : ''}`}>
                      {isSeniorMode ? 'HOY DE TURNO EN QUILPUÉ' : 'Hoy en Quilpué'}
                    </Badge>
                    <h2 className={`font-bold ${isSeniorMode ? 'text-3xl font-black text-white mt-2' : 'text-2xl'}`}>{todayTurno.nombre}</h2>
                    <p className={`flex items-center gap-2 mt-2 text-emerald-50 font-medium ${isSeniorMode ? 'text-lg font-black mt-3' : 'text-sm'}`}>
                      <MapPin className={isSeniorMode ? 'h-6 w-6 text-yellow-300' : 'h-4 w-4'} /> {todayTurno.direccion}
                    </p>
                    <Button
                      className={`mt-4 font-bold bg-white hover:bg-emerald-50 shadow-md border-none cursor-pointer text-emerald-800 ${isSeniorMode ? 'w-full h-16 text-lg font-black rounded-2xl' : 'size-sm rounded-xl'
                        }`}
                      onClick={() => setActiveTab("map")}
                    >
                      {isSeniorMode ? '🗺️ VER UBICACIÓN EN EL MAPA' : 'Ver en el Mapa'}
                    </Button>
                  </div>
                </div>

                <div className="pt-2">
                  <h3 className={`font-bold text-gray-700 px-2 mb-3 ${isSeniorMode ? 'text-2xl font-black text-black' : 'text-lg'}`}>Próximos días</h3>
                  <div className="space-y-3">
                    {nextTurnos.map((turno, i) => (
                      <Card
                        key={i}
                        className={`rounded-2xl border-none shadow-sm hover:shadow-md transition-shadow bg-white ${isSeniorMode ? 'border-4 border-emerald-600 shadow-xl p-2' : ''
                          }`}
                      >
                        <CardContent className="p-4 flex gap-4 items-center bg-white">
                          <div className={`text-emerald-800 rounded-xl flex flex-col items-center justify-center border border-emerald-100 ${isSeniorMode ? 'bg-amber-100/70 p-4 border-2 border-emerald-600 min-w-[85px]' : 'bg-emerald-50 p-3 min-w-[65px]'
                            }`}>
                            <span className={`font-bold tracking-widest opacity-80 uppercase ${isSeniorMode ? 'text-xs font-black' : 'text-[10px]'}`}>{meses[turno.date.getMonth()]}</span>
                            <span className={`font-black ${isSeniorMode ? 'text-3xl font-black' : 'text-2xl'}`}>{turno.date.getDate()}</span>
                          </div>
                          <div>
                            <p className={`font-bold text-gray-800 ${isSeniorMode ? 'text-xl font-black text-black' : ''}`}>{turno.farmacia.nombre}</p>
                            <p className={`text-gray-500 mt-1 flex items-center gap-1 ${isSeniorMode ? 'text-base font-bold' : 'text-xs'}`}>
                              <MapPin className={isSeniorMode ? 'h-5 w-5 text-emerald-600' : 'h-3 w-3'} />{turno.farmacia.direccion}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-20 text-gray-400 font-medium flex flex-col items-center gap-3">
                <CalendarClock className="h-8 w-8 animate-pulse text-emerald-300" />
                Cargando turnos...
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Modal: Registrar / Subir Local */}
      <Dialog open={isRegisterOpen} onOpenChange={setIsRegisterOpen}>
        <DialogContent className="rounded-3xl sm:max-w-lg w-[92%] max-h-[90vh] overflow-y-auto p-6 bg-white border border-slate-100">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-emerald-800 flex items-center gap-2">
              <Store className="h-6 w-6 text-emerald-600" />
              Subir Nuevo Local (Encuesta)
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRegisterSubmit} className="space-y-4 py-2">
            <div className="space-y-1 text-left">
              <label className="text-sm font-bold text-slate-700">Nombre del Local *</label>
              <Input
                required
                placeholder="Ej. Farmacia Vida Sana"
                value={registerForm.nombreLocal}
                onChange={e => setRegisterForm(prev => ({ ...prev, nombreLocal: e.target.value }))}
                className="rounded-xl border-slate-200 focus:ring-emerald-500 h-11 text-black placeholder:text-gray-400"
              />
            </div>
            <div className="space-y-1 text-left">
              <label className="text-sm font-bold text-slate-700">Nombre de la Persona a Cargo *</label>
              <Input
                required
                placeholder="Ej. Juan Pérez"
                value={registerForm.personaCargo}
                onChange={e => setRegisterForm(prev => ({ ...prev, personaCargo: e.target.value }))}
                className="rounded-xl border-slate-200 focus:ring-emerald-500 h-11 text-black placeholder:text-gray-400"
              />
            </div>
            <div className="space-y-1 text-left">
              <label className="text-sm font-bold text-slate-700">Dirección *</label>
              <Input
                required
                placeholder="Ej. Av. Valparaíso 1234, Quilpué"
                value={registerForm.direccion}
                onChange={e => setRegisterForm(prev => ({ ...prev, direccion: e.target.value }))}
                className="rounded-xl border-slate-200 focus:ring-emerald-500 h-11 text-black placeholder:text-gray-400"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-700">Número de Teléfono *</label>
                <Input
                  required
                  type="tel"
                  placeholder="Ej. +56912345678"
                  value={registerForm.telefono}
                  onChange={e => setRegisterForm(prev => ({ ...prev, telefono: e.target.value }))}
                  className="rounded-xl border-slate-200 focus:ring-emerald-500 h-11 text-black placeholder:text-gray-400"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-700">Correo Electrónico *</label>
                <Input
                  required
                  type="email"
                  placeholder="Ej. contacto@local.com"
                  value={registerForm.correo}
                  onChange={e => setRegisterForm(prev => ({ ...prev, correo: e.target.value }))}
                  className="rounded-xl border-slate-200 focus:ring-emerald-500 h-11 text-black placeholder:text-gray-400"
                />
              </div>
            </div>

            {/* Photo upload */}
            <div className="space-y-2 pt-2 text-left">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-slate-700">Fotos del Local (Máx. 5) *</label>
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  {photos.length} / 5 seleccionadas
                </span>
              </div>

              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                ref={fileInputRef}
                onChange={handlePhotoUpload}
                disabled={photos.length >= 5}
              />

              {photos.length < 5 ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors bg-slate-50/50 hover:bg-emerald-50/20"
                >
                  <Upload className="h-6 w-6 text-slate-400" />
                  <span className="text-sm font-bold text-slate-600">Subir fotos desde el dispositivo</span>
                  <span className="text-xs text-slate-400">Formatos JPG, PNG. Máx 5 fotos.</span>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold rounded-xl text-center">
                  Has alcanzado el límite de 5 fotos. Elimina alguna para subir otra.
                </div>
              )}

              {/* Photo Previews */}
              {photos.length > 0 && (
                <div className="grid grid-cols-5 gap-2 mt-2">
                  {photos.map((url, i) => (
                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-slate-100 group">
                      <img src={url} alt={`Local ${i + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhoto(i)}
                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity border-none cursor-pointer text-white"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg transition-colors cursor-pointer border-none mt-4"
            >
              Enviar Encuesta de Registro
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Success Dialog for Registration */}
      <Dialog open={showRegisterSuccess} onOpenChange={setShowRegisterSuccess}>
        <DialogContent className="rounded-3xl sm:max-w-md w-[90%] text-center p-8 bg-white border border-slate-100">
          <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4 text-emerald-600">
            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
          </div>
          <DialogTitle className="text-2xl font-black text-slate-900 mb-2">¡Solicitud Enviada!</DialogTitle>
          <p className="text-slate-600 text-sm font-semibold mb-6">
            La información del local ha sido recibida con éxito. Nuestro equipo la revisará y se pondrá en contacto pronto.
          </p>
          <Button
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12 rounded-xl font-bold border-none cursor-pointer"
            onClick={() => setShowRegisterSuccess(false)}
          >
            Entendido
          </Button>
        </DialogContent>
      </Dialog>

      {/* Modal: Reportar Problema en el Mapa */}
      <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
        <DialogContent className="rounded-3xl sm:max-w-md w-[92%] p-6 bg-white border border-slate-100">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-red-800 flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              Reportar Problema
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleReportSubmit} className="space-y-4 py-2">
            <div className="space-y-1 text-left">
              <label className="text-sm font-bold text-slate-700">¿Qué local presenta el problema? *</label>
              <Input
                required
                placeholder="Ej. Farmacia Cruz Verde - Centro o ubicación en el mapa"
                value={reportTarget}
                onChange={e => setReportTarget(e.target.value)}
                className="rounded-xl border-slate-200 focus:ring-red-500 h-11 text-black placeholder:text-gray-400"
              />
            </div>
            <div className="space-y-2 text-left">
              <label className="text-sm font-bold text-slate-700">Tipo de Problema *</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setReportType("cerrado")}
                  className={`py-3 px-2 rounded-xl border text-xs font-black transition-all cursor-pointer ${reportType === "cerrado"
                      ? "border-red-600 bg-red-50 text-red-700 shadow-sm"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                >
                  🔒 Local Cerrado
                </button>
                <button
                  type="button"
                  onClick={() => setReportType("inexistente")}
                  className={`py-3 px-2 rounded-xl border text-xs font-black transition-all cursor-pointer ${reportType === "inexistente"
                      ? "border-red-600 bg-red-50 text-red-700 shadow-sm"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                >
                  ❓ Local Inexistente
                </button>
              </div>
            </div>
            <div className="space-y-1 text-left">
              <label className="text-sm font-bold text-slate-700">Detalles Adicionales</label>
              <textarea
                placeholder="Describe el problema (ej. ahora hay otro local aquí, o cerró permanentemente)."
                value={reportDetails}
                onChange={e => setReportDetails(e.target.value)}
                className="w-full min-h-[80px] p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm font-semibold text-slate-800 bg-white"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-lg transition-colors cursor-pointer border-none mt-2"
            >
              Enviar Reporte
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Success Dialog for Report */}
      <Dialog open={showReportSuccess} onOpenChange={setShowReportSuccess}>
        <DialogContent className="rounded-3xl sm:max-w-md w-[90%] text-center p-8 bg-white border border-slate-100">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600">
            <CheckCircle2 className="h-10 w-10 text-red-600" />
          </div>
          <DialogTitle className="text-2xl font-black text-slate-900 mb-2">¡Reporte Recibido!</DialogTitle>
          <p className="text-slate-600 text-sm font-semibold mb-6">
            Gracias por ayudarnos a mantener actualizada la información. Verificaremos el problema a la brevedad.
          </p>
          <Button
            className="w-full bg-red-600 hover:bg-red-700 text-white h-12 rounded-xl font-bold border-none cursor-pointer"
            onClick={() => setShowReportSuccess(false)}
          >
            Cerrar
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
