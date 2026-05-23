export const farmacias = [
  {
    id: 1,
    nombre: "Farmacia Cruz Verde - Centro",
    direccion: "Claudio Vicuña 402, Quilpué",
    horario: "08:30 - 21:00",
    abierto: true,
    deTurno: true,
    lat: -33.045,
    lng: -71.442,
    medicamentos: [
      { nombre: "Paracetamol", precio: 1500, stock: true, stockCantidad: 24 },
      { nombre: "Losartán", precio: 3200, stock: true, stockCantidad: 15 },
      { nombre: "Ibuprofeno", precio: 2200, stock: true, stockCantidad: 40 },
      { nombre: "Ketorolaco", precio: 3800, stock: false, stockCantidad: 0 },
      { nombre: "Zopiclona", precio: 4500, stock: true, stockCantidad: 8 },
      { nombre: "Clorfenamina", precio: 1200, stock: true, stockCantidad: 50 },
      { nombre: "Amoxicilina", precio: 3500, stock: false, stockCantidad: 0 }
    ]
  },
  {
    id: 2,
    nombre: "Ahumada - Los Carrera",
    direccion: "Los Carrera 501, Quilpué",
    horario: "09:00 - 20:30",
    abierto: true,
    deTurno: false,
    lat: -33.043,
    lng: -71.441,
    medicamentos: [
      { nombre: "Paracetamol", precio: 1700, stock: false, stockCantidad: 0 },
      { nombre: "Losartán", precio: 2900, stock: true, stockCantidad: 18 },
      { nombre: "Ibuprofeno", precio: 2100, stock: true, stockCantidad: 12 },
      { nombre: "Ketorolaco", precio: 4100, stock: true, stockCantidad: 22 },
      { nombre: "Zopiclona", precio: 4800, stock: false, stockCantidad: 0 },
      { nombre: "Clorfenamina", precio: 1500, stock: true, stockCantidad: 30 },
      { nombre: "Loratadina", precio: 1200, stock: true, stockCantidad: 25 }
    ]
  },
  {
    id: 3,
    nombre: "Farmacia Salcobrand - Mall",
    direccion: "Portal El Belloto, Quilpué",
    horario: "10:00 - 20:00",
    abierto: true,
    deTurno: false,
    lat: -33.055,
    lng: -71.425,
    medicamentos: [
      { nombre: "Paracetamol", precio: 1200, stock: true, stockCantidad: 100 },
      { nombre: "Losartán", precio: 3500, stock: false, stockCantidad: 0 },
      { nombre: "Ibuprofeno", precio: 2400, stock: true, stockCantidad: 35 },
      { nombre: "Ketorolaco", precio: 4500, stock: true, stockCantidad: 14 },
      { nombre: "Zopiclona", precio: 4200, stock: true, stockCantidad: 20 },
      { nombre: "Clorfenamina", precio: 1100, stock: false, stockCantidad: 0 },
      { nombre: "Amoxicilina", precio: 3200, stock: true, stockCantidad: 15 }
    ]
  },
  {
    id: 4,
    nombre: "Farmacia Independiente Salud",
    direccion: "Freire 1002, Quilpué",
    horario: "09:30 - 19:30",
    abierto: false,
    deTurno: false,
    lat: -33.041,
    lng: -71.445,
    medicamentos: [
      { nombre: "Paracetamol", precio: 1000, stock: true, stockCantidad: 5 },
      { nombre: "Losartán", precio: 2800, stock: true, stockCantidad: 9 },
      { nombre: "Ibuprofeno", precio: 1800, stock: false, stockCantidad: 0 },
      { nombre: "Ketorolaco", precio: 3500, stock: true, stockCantidad: 30 },
      { nombre: "Zopiclona", precio: 3900, stock: true, stockCantidad: 12 },
      { nombre: "Clorfenamina", precio: 900, stock: true, stockCantidad: 40 },
      { nombre: "Loratadina", precio: 900, stock: true, stockCantidad: 15 }
    ]
  }
];

export const turnosDelMes = [
  { dia: "12/05/2026", farmacia: "Farmacia Cruz Verde - Centro", direccion: "Claudio Vicuña 402, Quilpué" },
  { dia: "13/05/2026", farmacia: "Ahumada - Los Carrera", direccion: "Los Carrera 501, Quilpué" },
  { dia: "14/05/2026", farmacia: "Farmacia Independiente Salud", direccion: "Freire 1002, Quilpué" },
];
