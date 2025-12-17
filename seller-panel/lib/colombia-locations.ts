// Colombian departments and their main cities
export interface City {
  name: string
  code?: string
}

export interface Department {
  name: string
  code: string
  cities: string[]
}

export const COLOMBIA_DEPARTMENTS: Department[] = [
  {
    name: 'Amazonas',
    code: 'AMA',
    cities: ['Leticia', 'Puerto Nariño']
  },
  {
    name: 'Antioquia',
    code: 'ANT',
    cities: ['Medellín', 'Bello', 'Itagüí', 'Envigado', 'Apartadó', 'Turbo', 'Rionegro', 'Sabaneta', 'Caldas', 'La Estrella']
  },
  {
    name: 'Arauca',
    code: 'ARA',
    cities: ['Arauca', 'Tame', 'Saravena']
  },
  {
    name: 'Atlántico',
    code: 'ATL',
    cities: ['Barranquilla', 'Soledad', 'Malambo', 'Sabanalarga', 'Puerto Colombia', 'Galapa']
  },
  {
    name: 'Bolívar',
    code: 'BOL',
    cities: ['Cartagena', 'Magangué', 'Turbaco', 'Arjona', 'Carmen de Bolívar']
  },
  {
    name: 'Boyacá',
    code: 'BOY',
    cities: ['Tunja', 'Duitama', 'Sogamoso', 'Chiquinquirá', 'Paipa', 'Villa de Leyva']
  },
  {
    name: 'Caldas',
    code: 'CAL',
    cities: ['Manizales', 'La Dorada', 'Chinchiná', 'Villamaría', 'Riosucio']
  },
  {
    name: 'Caquetá',
    code: 'CAQ',
    cities: ['Florencia', 'San Vicente del Caguán', 'Puerto Rico']
  },
  {
    name: 'Casanare',
    code: 'CAS',
    cities: ['Yopal', 'Aguazul', 'Villanueva', 'Monterrey', 'Tauramena']
  },
  {
    name: 'Cauca',
    code: 'CAU',
    cities: ['Popayán', 'Santander de Quilichao', 'Puerto Tejada', 'Patía']
  },
  {
    name: 'Cesar',
    code: 'CES',
    cities: ['Valledupar', 'Aguachica', 'Codazzi', 'Bosconia', 'La Jagua de Ibirico']
  },
  {
    name: 'Chocó',
    code: 'CHO',
    cities: ['Quibdó', 'Istmina', 'Condoto', 'Tadó']
  },
  {
    name: 'Córdoba',
    code: 'COR',
    cities: ['Montería', 'Cereté', 'Lorica', 'Sahagún', 'Montelíbano', 'Planeta Rica']
  },
  {
    name: 'Cundinamarca',
    code: 'CUN',
    cities: ['Bogotá', 'Soacha', 'Fusagasugá', 'Facatativá', 'Zipaquirá', 'Chía', 'Mosquera', 'Madrid', 'Funza', 'Cajicá', 'Girardot', 'Cota']
  },
  {
    name: 'Guainía',
    code: 'GUA',
    cities: ['Inírida']
  },
  {
    name: 'Guaviare',
    code: 'GUV',
    cities: ['San José del Guaviare']
  },
  {
    name: 'Huila',
    code: 'HUI',
    cities: ['Neiva', 'Pitalito', 'Garzón', 'La Plata', 'Campoalegre']
  },
  {
    name: 'La Guajira',
    code: 'LAG',
    cities: ['Riohacha', 'Maicao', 'Uribia', 'Manaure', 'San Juan del Cesar']
  },
  {
    name: 'Magdalena',
    code: 'MAG',
    cities: ['Santa Marta', 'Ciénaga', 'Fundación', 'Plato', 'El Banco']
  },
  {
    name: 'Meta',
    code: 'MET',
    cities: ['Villavicencio', 'Acacías', 'Granada', 'San Martín', 'Puerto López']
  },
  {
    name: 'Nariño',
    code: 'NAR',
    cities: ['Pasto', 'Tumaco', 'Ipiales', 'Túquerres']
  },
  {
    name: 'Norte de Santander',
    code: 'NSA',
    cities: ['Cúcuta', 'Ocaña', 'Pamplona', 'Villa del Rosario', 'Los Patios']
  },
  {
    name: 'Putumayo',
    code: 'PUT',
    cities: ['Mocoa', 'Puerto Asís', 'Valle del Guamuez', 'Orito']
  },
  {
    name: 'Quindío',
    code: 'QUI',
    cities: ['Armenia', 'Calarcá', 'La Tebaida', 'Montenegro', 'Quimbaya']
  },
  {
    name: 'Risaralda',
    code: 'RIS',
    cities: ['Pereira', 'Dosquebradas', 'Santa Rosa de Cabal', 'La Virginia']
  },
  {
    name: 'San Andrés y Providencia',
    code: 'SAP',
    cities: ['San Andrés', 'Providencia']
  },
  {
    name: 'Santander',
    code: 'SAN',
    cities: ['Bucaramanga', 'Floridablanca', 'Girón', 'Piedecuesta', 'Barrancabermeja', 'San Gil', 'Socorro']
  },
  {
    name: 'Sucre',
    code: 'SUC',
    cities: ['Sincelejo', 'Corozal', 'San Marcos', 'Tolú', 'Sampués']
  },
  {
    name: 'Tolima',
    code: 'TOL',
    cities: ['Ibagué', 'Espinal', 'Melgar', 'Honda', 'Líbano', 'Chaparral']
  },
  {
    name: 'Valle del Cauca',
    code: 'VAC',
    cities: ['Cali', 'Palmira', 'Buenaventura', 'Tuluá', 'Cartago', 'Buga', 'Jamundí', 'Yumbo']
  },
  {
    name: 'Vaupés',
    code: 'VAU',
    cities: ['Mitú']
  },
  {
    name: 'Vichada',
    code: 'VID',
    cities: ['Puerto Carreño', 'La Primavera', 'Cumaribo']
  }
]

// Helper functions
export function getDepartmentNames(): string[] {
  return COLOMBIA_DEPARTMENTS.map(d => d.name).sort()
}

export function getCitiesByDepartment(departmentName: string): string[] {
  const department = COLOMBIA_DEPARTMENTS.find(d => d.name === departmentName)
  return department ? department.cities : []
}

export function getAllCities(): string[] {
  return COLOMBIA_DEPARTMENTS.flatMap(d => d.cities).sort()
}
