// Comprehensive world destinations database — tourist, trekking, hiking, and adventure
// Categorized by type for filtering relevance

export interface WorldDestination {
  name: string
  region: string
  country: string
  continent: string
  lat: number
  lng: number
  tags: DestinationTag[]
}

export type DestinationTag =
  | "tourist"
  | "trekking"
  | "hiking"
  | "beach"
  | "mountain"
  | "cultural"
  | "adventure"
  | "wildlife"
  | "camping"
  | "cycling"
  | "water-sports"
  | "road-trip"
  | "winter-sports"
  | "desert"

// ─── ASIA DESTINATIONS ──────────────────────────────────────────────────────
const ASIA_DEST: WorldDestination[] = [
  // India
  { name: "Nandi Hills", region: "Karnataka", country: "India", continent: "Asia", lat: 13.3702, lng: 77.6835, tags: ["hiking", "cycling", "road-trip"] },
  { name: "Coorg", region: "Karnataka", country: "India", continent: "Asia", lat: 12.3375, lng: 75.8069, tags: ["trekking", "camping", "tourist"] },
  { name: "Chikmagalur", region: "Karnataka", country: "India", continent: "Asia", lat: 13.3153, lng: 75.7754, tags: ["trekking", "hiking", "camping"] },
  { name: "Hampi", region: "Karnataka", country: "India", continent: "Asia", lat: 15.335, lng: 76.46, tags: ["cultural", "cycling", "tourist"] },
  { name: "Gokarna", region: "Karnataka", country: "India", continent: "Asia", lat: 14.55, lng: 74.3167, tags: ["beach", "trekking", "water-sports"] },
  { name: "Ooty", region: "Tamil Nadu", country: "India", continent: "Asia", lat: 11.4102, lng: 76.695, tags: ["tourist", "trekking", "cycling"] },
  { name: "Munnar", region: "Kerala", country: "India", continent: "Asia", lat: 10.0889, lng: 77.0595, tags: ["tourist", "trekking", "camping"] },
  { name: "Wayanad", region: "Kerala", country: "India", continent: "Asia", lat: 11.6854, lng: 76.132, tags: ["trekking", "wildlife", "camping"] },
  { name: "Alleppey Backwaters", region: "Kerala", country: "India", continent: "Asia", lat: 9.4981, lng: 76.3388, tags: ["tourist", "water-sports"] },
  { name: "Ladakh", region: "Ladakh", country: "India", continent: "Asia", lat: 34.1526, lng: 77.5771, tags: ["trekking", "mountain", "adventure", "cycling", "road-trip"] },
  { name: "Manali", region: "Himachal Pradesh", country: "India", continent: "Asia", lat: 32.2396, lng: 77.1887, tags: ["trekking", "mountain", "adventure", "winter-sports"] },
  { name: "Rishikesh", region: "Uttarakhand", country: "India", continent: "Asia", lat: 30.0869, lng: 78.2676, tags: ["adventure", "water-sports", "trekking", "camping"] },
  { name: "Valley of Flowers", region: "Uttarakhand", country: "India", continent: "Asia", lat: 30.728, lng: 79.605, tags: ["trekking", "hiking", "mountain"] },
  { name: "Kedarnath", region: "Uttarakhand", country: "India", continent: "Asia", lat: 30.7346, lng: 79.0669, tags: ["trekking", "cultural", "mountain"] },
  { name: "Roopkund", region: "Uttarakhand", country: "India", continent: "Asia", lat: 30.262, lng: 79.731, tags: ["trekking", "mountain", "adventure"] },
  { name: "Spiti Valley", region: "Himachal Pradesh", country: "India", continent: "Asia", lat: 32.246, lng: 78.035, tags: ["road-trip", "trekking", "mountain", "adventure"] },
  { name: "Rajasthan Desert", region: "Rajasthan", country: "India", continent: "Asia", lat: 26.449, lng: 71.372, tags: ["desert", "camping", "cultural", "road-trip"] },
  { name: "Andaman Islands", region: "Andaman & Nicobar", country: "India", continent: "Asia", lat: 11.7401, lng: 92.6586, tags: ["beach", "water-sports", "adventure"] },
  { name: "Meghalaya Living Root Bridges", region: "Meghalaya", country: "India", continent: "Asia", lat: 25.2948, lng: 91.5822, tags: ["trekking", "hiking", "cultural"] },
  { name: "Dzukou Valley", region: "Nagaland", country: "India", continent: "Asia", lat: 25.53, lng: 93.95, tags: ["trekking", "camping", "mountain"] },
  { name: "Sakleshpur", region: "Karnataka", country: "India", continent: "Asia", lat: 12.9406, lng: 75.785, tags: ["trekking", "hiking", "camping"] },
  { name: "Pondicherry", region: "Puducherry", country: "India", continent: "Asia", lat: 11.9416, lng: 79.8083, tags: ["beach", "cultural", "cycling", "tourist"] },
  { name: "Kabini", region: "Karnataka", country: "India", continent: "Asia", lat: 11.953, lng: 76.346, tags: ["wildlife", "camping", "water-sports"] },
  { name: "Bannerghatta", region: "Karnataka", country: "India", continent: "Asia", lat: 12.8005, lng: 77.5773, tags: ["wildlife", "cycling", "hiking"] },
  // Nepal
  { name: "Everest Base Camp", region: "Solukhumbu", country: "Nepal", continent: "Asia", lat: 28.0025, lng: 86.8528, tags: ["trekking", "mountain", "adventure"] },
  { name: "Annapurna Circuit", region: "Gandaki", country: "Nepal", continent: "Asia", lat: 28.5964, lng: 83.8203, tags: ["trekking", "mountain", "adventure"] },
  { name: "Langtang Valley", region: "Bagmati", country: "Nepal", continent: "Asia", lat: 28.213, lng: 85.614, tags: ["trekking", "mountain", "camping"] },
  { name: "Chitwan National Park", region: "Narayani", country: "Nepal", continent: "Asia", lat: 27.5, lng: 84.333, tags: ["wildlife", "adventure", "camping"] },
  // Southeast Asia
  { name: "Angkor Wat", region: "Siem Reap", country: "Cambodia", continent: "Asia", lat: 13.4125, lng: 103.867, tags: ["cultural", "tourist", "cycling"] },
  { name: "Ha Long Bay", region: "Quang Ninh", country: "Vietnam", continent: "Asia", lat: 20.9101, lng: 107.1839, tags: ["tourist", "water-sports", "adventure"] },
  { name: "Sapa", region: "Lao Cai", country: "Vietnam", continent: "Asia", lat: 22.3363, lng: 103.8438, tags: ["trekking", "hiking", "cultural"] },
  { name: "Mount Rinjani", region: "Lombok", country: "Indonesia", continent: "Asia", lat: -8.4118, lng: 116.457, tags: ["trekking", "mountain", "adventure"] },
  { name: "Komodo Islands", region: "NTT", country: "Indonesia", continent: "Asia", lat: -8.55, lng: 119.45, tags: ["adventure", "wildlife", "water-sports"] },
  { name: "Raja Ampat", region: "West Papua", country: "Indonesia", continent: "Asia", lat: -0.489, lng: 130.389, tags: ["water-sports", "beach", "adventure"] },
  { name: "Mount Kinabalu", region: "Sabah", country: "Malaysia", continent: "Asia", lat: 6.0753, lng: 116.5585, tags: ["trekking", "mountain", "adventure"] },
  { name: "Krabi", region: "Krabi", country: "Thailand", continent: "Asia", lat: 8.0863, lng: 98.9063, tags: ["beach", "water-sports", "adventure"] },
  { name: "Pai", region: "Mae Hong Son", country: "Thailand", continent: "Asia", lat: 19.3586, lng: 98.4429, tags: ["hiking", "camping", "cultural"] },
  { name: "Palawan", region: "Mimaropa", country: "Philippines", continent: "Asia", lat: 9.4855, lng: 118.5472, tags: ["beach", "water-sports", "adventure"] },
  { name: "Mount Fuji", region: "Shizuoka", country: "Japan", continent: "Asia", lat: 35.3606, lng: 138.7274, tags: ["trekking", "mountain", "cultural"] },
  { name: "Jeju Island", region: "Jeju", country: "South Korea", continent: "Asia", lat: 33.4996, lng: 126.5312, tags: ["hiking", "tourist", "beach"] },
  { name: "Great Wall of China", region: "Beijing", country: "China", continent: "Asia", lat: 40.4319, lng: 116.5704, tags: ["hiking", "cultural", "tourist"] },
  { name: "Tiger Leaping Gorge", region: "Yunnan", country: "China", continent: "Asia", lat: 27.1851, lng: 100.111, tags: ["trekking", "hiking", "mountain"] },
  { name: "Zhangjiajie", region: "Hunan", country: "China", continent: "Asia", lat: 29.325, lng: 110.479, tags: ["hiking", "mountain", "tourist"] },
  // Central Asia
  { name: "Petra", region: "Ma'an", country: "Jordan", continent: "Asia", lat: 30.3285, lng: 35.4444, tags: ["cultural", "hiking", "tourist", "desert"] },
  { name: "Wadi Rum", region: "Aqaba", country: "Jordan", continent: "Asia", lat: 29.532, lng: 35.411, tags: ["desert", "camping", "adventure", "road-trip"] },
  { name: "Cappadocia", region: "Nevşehir", country: "Turkey", continent: "Asia", lat: 38.6431, lng: 34.8289, tags: ["tourist", "hiking", "adventure", "cultural"] },
  { name: "Pamukkale", region: "Denizli", country: "Turkey", continent: "Asia", lat: 37.9204, lng: 29.1191, tags: ["tourist", "cultural"] },
  { name: "Maldives", region: "Malé", country: "Maldives", continent: "Asia", lat: 3.2028, lng: 73.2207, tags: ["beach", "water-sports", "tourist"] },
]

// ─── EUROPE DESTINATIONS ────────────────────────────────────────────────────
const EUROPE_DEST: WorldDestination[] = [
  { name: "Mont Blanc", region: "Haute-Savoie", country: "France", continent: "Europe", lat: 45.8326, lng: 6.8652, tags: ["trekking", "mountain", "adventure", "winter-sports"] },
  { name: "Tour du Mont Blanc", region: "Alps", country: "France", continent: "Europe", lat: 45.89, lng: 6.88, tags: ["trekking", "mountain", "hiking"] },
  { name: "Dolomites", region: "Trentino-Alto Adige", country: "Italy", continent: "Europe", lat: 46.41, lng: 11.84, tags: ["trekking", "hiking", "mountain", "winter-sports", "cycling"] },
  { name: "Cinque Terre", region: "Liguria", country: "Italy", continent: "Europe", lat: 44.1461, lng: 9.6533, tags: ["hiking", "tourist", "beach", "cultural"] },
  { name: "Amalfi Coast", region: "Campania", country: "Italy", continent: "Europe", lat: 40.6333, lng: 14.6029, tags: ["tourist", "hiking", "beach", "road-trip"] },
  { name: "Swiss Alps", region: "Valais", country: "Switzerland", continent: "Europe", lat: 46.35, lng: 7.98, tags: ["trekking", "hiking", "mountain", "winter-sports"] },
  { name: "Matterhorn", region: "Valais", country: "Switzerland", continent: "Europe", lat: 45.9763, lng: 7.6586, tags: ["trekking", "mountain", "adventure"] },
  { name: "Jungfrau Region", region: "Bern", country: "Switzerland", continent: "Europe", lat: 46.5567, lng: 7.9607, tags: ["trekking", "mountain", "winter-sports", "hiking"] },
  { name: "Scottish Highlands", region: "Scotland", country: "United Kingdom", continent: "Europe", lat: 57.12, lng: -4.71, tags: ["hiking", "trekking", "camping", "road-trip"] },
  { name: "Lake District", region: "England", country: "United Kingdom", continent: "Europe", lat: 54.4609, lng: -3.0886, tags: ["hiking", "camping", "cycling"] },
  { name: "Camino de Santiago", region: "Galicia", country: "Spain", continent: "Europe", lat: 42.8782, lng: -8.5448, tags: ["hiking", "trekking", "cultural"] },
  { name: "Picos de Europa", region: "Cantabria", country: "Spain", continent: "Europe", lat: 43.18, lng: -4.85, tags: ["trekking", "hiking", "mountain"] },
  { name: "Norwegian Fjords", region: "Vestland", country: "Norway", continent: "Europe", lat: 61.0, lng: 6.0, tags: ["tourist", "hiking", "water-sports", "adventure"] },
  { name: "Trolltunga", region: "Vestland", country: "Norway", continent: "Europe", lat: 60.124, lng: 6.74, tags: ["hiking", "trekking", "mountain", "adventure"] },
  { name: "Lofoten Islands", region: "Nordland", country: "Norway", continent: "Europe", lat: 68.2, lng: 14.0, tags: ["hiking", "camping", "adventure", "beach"] },
  { name: "Preikestolen", region: "Rogaland", country: "Norway", continent: "Europe", lat: 58.9863, lng: 6.1903, tags: ["hiking", "adventure"] },
  { name: "Kungsleden Trail", region: "Lapland", country: "Sweden", continent: "Europe", lat: 68.35, lng: 18.7, tags: ["trekking", "hiking", "camping", "mountain"] },
  { name: "Iceland Ring Road", region: "Iceland", country: "Iceland", continent: "Europe", lat: 64.5, lng: -18.5, tags: ["road-trip", "adventure", "hiking", "camping"] },
  { name: "Plitvice Lakes", region: "Lika-Senj", country: "Croatia", continent: "Europe", lat: 44.8654, lng: 15.5820, tags: ["tourist", "hiking"] },
  { name: "Transylvania", region: "Transylvania", country: "Romania", continent: "Europe", lat: 46.5, lng: 25.3, tags: ["hiking", "cultural", "camping", "road-trip"] },
  { name: "Tatras Mountains", region: "Tatra", country: "Poland", continent: "Europe", lat: 49.232, lng: 20.04, tags: ["trekking", "hiking", "mountain", "winter-sports"] },
  { name: "Bavarian Alps", region: "Bavaria", country: "Germany", continent: "Europe", lat: 47.42, lng: 11.07, tags: ["hiking", "trekking", "winter-sports", "cycling"] },
  { name: "Algarve Coast", region: "Algarve", country: "Portugal", continent: "Europe", lat: 37.019, lng: -7.93, tags: ["beach", "hiking", "water-sports", "cycling"] },
  { name: "Azores", region: "Azores", country: "Portugal", continent: "Europe", lat: 37.7412, lng: -25.6756, tags: ["hiking", "adventure", "water-sports", "tourist"] },
  { name: "Meteora", region: "Thessaly", country: "Greece", continent: "Europe", lat: 39.717, lng: 21.631, tags: ["hiking", "cultural", "tourist"] },
  { name: "Crete", region: "Crete", country: "Greece", continent: "Europe", lat: 35.2401, lng: 24.4709, tags: ["hiking", "beach", "cultural", "tourist"] },
  { name: "Julian Alps", region: "Upper Carniola", country: "Slovenia", continent: "Europe", lat: 46.35, lng: 13.83, tags: ["trekking", "hiking", "mountain", "adventure"] },
  { name: "Lake Bled", region: "Upper Carniola", country: "Slovenia", continent: "Europe", lat: 46.3683, lng: 14.1146, tags: ["tourist", "hiking", "water-sports"] },
]

// ─── AMERICAS DESTINATIONS ──────────────────────────────────────────────────
const AMERICAS_DEST: WorldDestination[] = [
  // North America
  { name: "Grand Canyon", region: "Arizona", country: "United States", continent: "North America", lat: 36.1069, lng: -112.1129, tags: ["hiking", "trekking", "adventure", "camping"] },
  { name: "Yosemite National Park", region: "California", country: "United States", continent: "North America", lat: 37.8651, lng: -119.5383, tags: ["hiking", "trekking", "camping", "mountain"] },
  { name: "Yellowstone", region: "Wyoming", country: "United States", continent: "North America", lat: 44.428, lng: -110.5885, tags: ["hiking", "camping", "wildlife", "adventure"] },
  { name: "Rocky Mountains", region: "Colorado", country: "United States", continent: "North America", lat: 39.5501, lng: -105.7821, tags: ["trekking", "hiking", "mountain", "winter-sports", "camping"] },
  { name: "Appalachian Trail", region: "Eastern US", country: "United States", continent: "North America", lat: 37.0, lng: -81.0, tags: ["trekking", "hiking", "camping"] },
  { name: "Pacific Crest Trail", region: "Western US", country: "United States", continent: "North America", lat: 40.7, lng: -121.5, tags: ["trekking", "hiking", "mountain", "camping"] },
  { name: "Zion National Park", region: "Utah", country: "United States", continent: "North America", lat: 37.2982, lng: -113.0263, tags: ["hiking", "trekking", "camping", "adventure"] },
  { name: "Glacier National Park", region: "Montana", country: "United States", continent: "North America", lat: 48.7596, lng: -113.787, tags: ["hiking", "trekking", "mountain", "wildlife"] },
  { name: "Mount Rainier", region: "Washington", country: "United States", continent: "North America", lat: 46.8523, lng: -121.7603, tags: ["trekking", "mountain", "winter-sports"] },
  { name: "Denali", region: "Alaska", country: "United States", continent: "North America", lat: 63.0695, lng: -151.0074, tags: ["trekking", "mountain", "adventure", "wildlife"] },
  { name: "Hawaii Volcanoes", region: "Hawaii", country: "United States", continent: "North America", lat: 19.441, lng: -155.2378, tags: ["hiking", "adventure", "beach"] },
  { name: "Moab", region: "Utah", country: "United States", continent: "North America", lat: 38.5733, lng: -109.5498, tags: ["hiking", "mountain", "cycling", "adventure", "desert"] },
  { name: "Banff National Park", region: "Alberta", country: "Canada", continent: "North America", lat: 51.4968, lng: -115.9281, tags: ["hiking", "trekking", "mountain", "winter-sports", "camping"] },
  { name: "Jasper National Park", region: "Alberta", country: "Canada", continent: "North America", lat: 52.8734, lng: -117.8009, tags: ["hiking", "trekking", "mountain", "wildlife", "camping"] },
  { name: "West Coast Trail", region: "British Columbia", country: "Canada", continent: "North America", lat: 48.66, lng: -124.93, tags: ["trekking", "hiking", "beach", "camping"] },
  { name: "Niagara Falls", region: "Ontario", country: "Canada", continent: "North America", lat: 43.0896, lng: -79.0849, tags: ["tourist", "adventure"] },
  { name: "Copper Canyon", region: "Chihuahua", country: "Mexico", continent: "North America", lat: 27.5, lng: -108.3, tags: ["hiking", "trekking", "adventure", "cultural"] },
  { name: "Arenal Volcano", region: "Alajuela", country: "Costa Rica", continent: "North America", lat: 10.462, lng: -84.703, tags: ["hiking", "adventure", "wildlife"] },
  // South America
  { name: "Machu Picchu", region: "Cusco", country: "Peru", continent: "South America", lat: -13.1631, lng: -72.545, tags: ["trekking", "cultural", "tourist", "mountain"] },
  { name: "Inca Trail", region: "Cusco", country: "Peru", continent: "South America", lat: -13.2, lng: -72.5, tags: ["trekking", "hiking", "cultural", "mountain"] },
  { name: "Salar de Uyuni", region: "Potosí", country: "Bolivia", continent: "South America", lat: -20.1338, lng: -67.4891, tags: ["adventure", "desert", "tourist", "road-trip"] },
  { name: "Torres del Paine", region: "Magallanes", country: "Chile", continent: "South America", lat: -51.0, lng: -73.0, tags: ["trekking", "hiking", "mountain", "adventure", "camping"] },
  { name: "Atacama Desert", region: "Antofagasta", country: "Chile", continent: "South America", lat: -23.8634, lng: -69.1328, tags: ["desert", "adventure", "hiking", "camping"] },
  { name: "Patagonia", region: "Patagonia", country: "Argentina", continent: "South America", lat: -47.0, lng: -71.0, tags: ["trekking", "hiking", "mountain", "adventure", "camping"] },
  { name: "Mount Fitz Roy", region: "Santa Cruz", country: "Argentina", continent: "South America", lat: -49.2713, lng: -73.0428, tags: ["trekking", "mountain", "adventure"] },
  { name: "Iguazu Falls", region: "Misiones", country: "Argentina", continent: "South America", lat: -25.6953, lng: -54.4367, tags: ["tourist", "adventure", "wildlife"] },
  { name: "Galápagos Islands", region: "Galápagos", country: "Ecuador", continent: "South America", lat: -0.9538, lng: -90.9656, tags: ["wildlife", "adventure", "water-sports", "tourist"] },
  { name: "Amazon Rainforest", region: "Amazonas", country: "Brazil", continent: "South America", lat: -3.4653, lng: -62.2159, tags: ["adventure", "wildlife", "camping", "water-sports"] },
  { name: "Angel Falls", region: "Bolívar", country: "Venezuela", continent: "South America", lat: 5.9701, lng: -62.5362, tags: ["adventure", "hiking", "tourist"] },
  { name: "Huayna Picchu", region: "Cusco", country: "Peru", continent: "South America", lat: -13.1547, lng: -72.547, tags: ["trekking", "mountain", "adventure"] },
]

// ─── AFRICA DESTINATIONS ────────────────────────────────────────────────────
const AFRICA_DEST: WorldDestination[] = [
  { name: "Mount Kilimanjaro", region: "Kilimanjaro", country: "Tanzania", continent: "Africa", lat: -3.0674, lng: 37.3556, tags: ["trekking", "mountain", "adventure"] },
  { name: "Serengeti", region: "Mara", country: "Tanzania", continent: "Africa", lat: -2.3333, lng: 34.8333, tags: ["wildlife", "camping", "adventure", "tourist"] },
  { name: "Ngorongoro Crater", region: "Arusha", country: "Tanzania", continent: "Africa", lat: -3.2, lng: 35.5, tags: ["wildlife", "adventure", "tourist"] },
  { name: "Masai Mara", region: "Narok", country: "Kenya", continent: "Africa", lat: -1.4061, lng: 35.0101, tags: ["wildlife", "camping", "adventure"] },
  { name: "Mount Kenya", region: "Central", country: "Kenya", continent: "Africa", lat: -0.1521, lng: 37.3084, tags: ["trekking", "mountain", "adventure"] },
  { name: "Table Mountain", region: "Western Cape", country: "South Africa", continent: "Africa", lat: -33.9628, lng: 18.4098, tags: ["hiking", "tourist", "adventure"] },
  { name: "Drakensberg Mountains", region: "KwaZulu-Natal", country: "South Africa", continent: "Africa", lat: -29.0, lng: 29.25, tags: ["trekking", "hiking", "mountain", "camping"] },
  { name: "Garden Route", region: "Western Cape", country: "South Africa", continent: "Africa", lat: -33.9, lng: 22.5, tags: ["road-trip", "hiking", "beach", "tourist"] },
  { name: "Kruger National Park", region: "Limpopo", country: "South Africa", continent: "Africa", lat: -23.988, lng: 31.552, tags: ["wildlife", "camping", "adventure"] },
  { name: "Victoria Falls", region: "Matabeleland North", country: "Zimbabwe", continent: "Africa", lat: -17.9243, lng: 25.8572, tags: ["tourist", "adventure", "water-sports"] },
  { name: "Sahara Desert", region: "Sahara", country: "Morocco", continent: "Africa", lat: 31.0, lng: -4.0, tags: ["desert", "camping", "adventure", "road-trip"] },
  { name: "Atlas Mountains", region: "High Atlas", country: "Morocco", continent: "Africa", lat: 31.06, lng: -7.9, tags: ["trekking", "hiking", "mountain"] },
  { name: "Mount Toubkal", region: "Marrakech-Safi", country: "Morocco", continent: "Africa", lat: 31.0596, lng: -7.9153, tags: ["trekking", "mountain", "adventure"] },
  { name: "Gorilla Trekking Bwindi", region: "Western", country: "Uganda", continent: "Africa", lat: -0.99, lng: 29.62, tags: ["trekking", "wildlife", "adventure"] },
  { name: "Fish River Canyon", region: "Karas", country: "Namibia", continent: "Africa", lat: -27.6, lng: 17.55, tags: ["trekking", "hiking", "adventure", "desert"] },
  { name: "Namib Desert", region: "Erongo", country: "Namibia", continent: "Africa", lat: -24.75, lng: 15.28, tags: ["desert", "adventure", "camping"] },
  { name: "Simien Mountains", region: "Amhara", country: "Ethiopia", continent: "Africa", lat: 13.25, lng: 38.25, tags: ["trekking", "hiking", "mountain", "adventure"] },
  { name: "Pyramids of Giza", region: "Giza", country: "Egypt", continent: "Africa", lat: 29.9792, lng: 31.1342, tags: ["cultural", "tourist"] },
  { name: "Zanzibar Beaches", region: "Zanzibar", country: "Tanzania", continent: "Africa", lat: -6.1659, lng: 39.2026, tags: ["beach", "water-sports", "tourist"] },
  { name: "Rwenzori Mountains", region: "Western", country: "Uganda", continent: "Africa", lat: 0.3833, lng: 29.9167, tags: ["trekking", "mountain", "adventure"] },
]

// ─── OCEANIA DESTINATIONS ───────────────────────────────────────────────────
const OCEANIA_DEST: WorldDestination[] = [
  { name: "Great Barrier Reef", region: "Queensland", country: "Australia", continent: "Oceania", lat: -18.2871, lng: 147.6992, tags: ["water-sports", "adventure", "tourist", "beach"] },
  { name: "Blue Mountains", region: "New South Wales", country: "Australia", continent: "Oceania", lat: -33.7, lng: 150.3, tags: ["hiking", "trekking", "camping"] },
  { name: "Uluru", region: "Northern Territory", country: "Australia", continent: "Oceania", lat: -25.3444, lng: 131.0369, tags: ["cultural", "hiking", "tourist", "desert"] },
  { name: "Great Ocean Road", region: "Victoria", country: "Australia", continent: "Oceania", lat: -38.6804, lng: 143.392, tags: ["road-trip", "tourist", "beach", "hiking"] },
  { name: "Tasmania Overland Track", region: "Tasmania", country: "Australia", continent: "Oceania", lat: -41.68, lng: 145.95, tags: ["trekking", "hiking", "camping", "mountain"] },
  { name: "Milford Track", region: "Fiordland", country: "New Zealand", continent: "Oceania", lat: -44.8, lng: 167.85, tags: ["trekking", "hiking", "mountain"] },
  { name: "Tongariro Alpine Crossing", region: "Waikato", country: "New Zealand", continent: "Oceania", lat: -39.2, lng: 175.7, tags: ["hiking", "trekking", "mountain", "adventure"] },
  { name: "Milford Sound", region: "Fiordland", country: "New Zealand", continent: "Oceania", lat: -44.6414, lng: 167.8974, tags: ["tourist", "water-sports", "adventure"] },
  { name: "Routeburn Track", region: "Otago", country: "New Zealand", continent: "Oceania", lat: -44.72, lng: 168.3, tags: ["trekking", "hiking", "mountain"] },
  { name: "Abel Tasman", region: "Nelson", country: "New Zealand", continent: "Oceania", lat: -40.9, lng: 172.9, tags: ["hiking", "beach", "water-sports", "camping"] },
  { name: "Bora Bora", region: "Leeward Islands", country: "French Polynesia", continent: "Oceania", lat: -16.5004, lng: -151.7415, tags: ["beach", "water-sports", "tourist"] },
]

// ─── Combined database ──────────────────────────────────────────────────────
export const WORLD_DESTINATIONS: WorldDestination[] = [
  ...ASIA_DEST,
  ...EUROPE_DEST,
  ...AMERICAS_DEST,
  ...AFRICA_DEST,
  ...OCEANIA_DEST,
]

// ─── Utility functions ──────────────────────────────────────────────────────

/** Search destinations by name, country, or tag */
export function searchDestinations(query: string, limit = 20): WorldDestination[] {
  if (!query.trim()) return []
  const q = query.toLowerCase().trim()
  const prefixMatches: WorldDestination[] = []
  const includesMatches: WorldDestination[] = []
  for (const dest of WORLD_DESTINATIONS) {
    const name = dest.name.toLowerCase()
    if (name.startsWith(q)) {
      prefixMatches.push(dest)
    } else if (
      name.includes(q) ||
      dest.country.toLowerCase().includes(q) ||
      dest.region.toLowerCase().includes(q) ||
      dest.tags.some((t) => t.includes(q))
    ) {
      includesMatches.push(dest)
    }
  }
  return [...prefixMatches, ...includesMatches].slice(0, limit)
}

/** Get popular destinations (diverse selection) */
export function getPopularDestinations(limit = 16): WorldDestination[] {
  // Hand-pick a diverse set of iconic destinations
  const iconic = [
    "Everest Base Camp", "Machu Picchu", "Grand Canyon", "Mont Blanc",
    "Mount Kilimanjaro", "Milford Track", "Torres del Paine", "Dolomites",
    "Ladakh", "Angkor Wat", "Great Barrier Reef", "Norwegian Fjords",
    "Patagonia", "Banff National Park", "Maldives", "Serengeti",
  ]
  const result: WorldDestination[] = []
  for (const name of iconic) {
    const d = WORLD_DESTINATIONS.find((dest) => dest.name === name)
    if (d) result.push(d)
    if (result.length >= limit) break
  }
  return result
}

/** Get destinations near a location */
export function getNearbyDestinations(
  lat: number,
  lng: number,
  limit = 12
): WorldDestination[] {
  const R = 6371
  return WORLD_DESTINATIONS
    .map((d) => {
      const dLat = ((d.lat - lat) * Math.PI) / 180
      const dLng = ((d.lng - lng) * Math.PI) / 180
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat * Math.PI) / 180) *
        Math.cos((d.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2
      const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      return { ...d, distance: dist }
    })
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit)
}

/** Get destinations filtered by tags */
export function getDestinationsByTag(tag: DestinationTag, limit = 30): WorldDestination[] {
  return WORLD_DESTINATIONS.filter((d) => d.tags.includes(tag)).slice(0, limit)
}
