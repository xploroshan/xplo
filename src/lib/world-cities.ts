// Comprehensive world cities database with coordinates for geolocation-based proximity sorting
// Each city has lat/lng to calculate distance from user's location

export interface WorldCity {
  name: string
  region: string // state, province, or region
  country: string
  continent: string
  lat: number
  lng: number
}

// ─── ASIA ───────────────────────────────────────────────────────────────────
const ASIA: WorldCity[] = [
  // India
  { name: "Mumbai", region: "Maharashtra", country: "India", continent: "Asia", lat: 19.076, lng: 72.8777 },
  { name: "Delhi", region: "Delhi", country: "India", continent: "Asia", lat: 28.7041, lng: 77.1025 },
  { name: "Bangalore", region: "Karnataka", country: "India", continent: "Asia", lat: 12.9716, lng: 77.5946 },
  { name: "Hyderabad", region: "Telangana", country: "India", continent: "Asia", lat: 17.385, lng: 78.4867 },
  { name: "Chennai", region: "Tamil Nadu", country: "India", continent: "Asia", lat: 13.0827, lng: 80.2707 },
  { name: "Kolkata", region: "West Bengal", country: "India", continent: "Asia", lat: 22.5726, lng: 88.3639 },
  { name: "Pune", region: "Maharashtra", country: "India", continent: "Asia", lat: 18.5204, lng: 73.8567 },
  { name: "Ahmedabad", region: "Gujarat", country: "India", continent: "Asia", lat: 23.0225, lng: 72.5714 },
  { name: "Jaipur", region: "Rajasthan", country: "India", continent: "Asia", lat: 26.9124, lng: 75.7873 },
  { name: "Lucknow", region: "Uttar Pradesh", country: "India", continent: "Asia", lat: 26.8467, lng: 80.9462 },
  { name: "Chandigarh", region: "Punjab/Haryana", country: "India", continent: "Asia", lat: 30.7333, lng: 76.7794 },
  { name: "Goa", region: "Goa", country: "India", continent: "Asia", lat: 15.2993, lng: 74.124 },
  { name: "Kochi", region: "Kerala", country: "India", continent: "Asia", lat: 9.9312, lng: 76.2673 },
  { name: "Thiruvananthapuram", region: "Kerala", country: "India", continent: "Asia", lat: 8.5241, lng: 76.9366 },
  { name: "Mysore", region: "Karnataka", country: "India", continent: "Asia", lat: 12.2958, lng: 76.6394 },
  { name: "Coorg", region: "Karnataka", country: "India", continent: "Asia", lat: 12.3375, lng: 75.8069 },
  { name: "Udaipur", region: "Rajasthan", country: "India", continent: "Asia", lat: 24.5854, lng: 73.7125 },
  { name: "Jodhpur", region: "Rajasthan", country: "India", continent: "Asia", lat: 26.2389, lng: 73.0243 },
  { name: "Varanasi", region: "Uttar Pradesh", country: "India", continent: "Asia", lat: 25.3176, lng: 82.9739 },
  { name: "Rishikesh", region: "Uttarakhand", country: "India", continent: "Asia", lat: 30.0869, lng: 78.2676 },
  { name: "Dehradun", region: "Uttarakhand", country: "India", continent: "Asia", lat: 30.3165, lng: 78.0322 },
  { name: "Manali", region: "Himachal Pradesh", country: "India", continent: "Asia", lat: 32.2396, lng: 77.1887 },
  { name: "Shimla", region: "Himachal Pradesh", country: "India", continent: "Asia", lat: 31.1048, lng: 77.1734 },
  { name: "Leh", region: "Ladakh", country: "India", continent: "Asia", lat: 34.1526, lng: 77.5771 },
  { name: "Srinagar", region: "Jammu & Kashmir", country: "India", continent: "Asia", lat: 34.0837, lng: 74.7973 },
  { name: "Amritsar", region: "Punjab", country: "India", continent: "Asia", lat: 31.634, lng: 74.8723 },
  { name: "Indore", region: "Madhya Pradesh", country: "India", continent: "Asia", lat: 22.7196, lng: 75.8577 },
  { name: "Bhopal", region: "Madhya Pradesh", country: "India", continent: "Asia", lat: 23.2599, lng: 77.4126 },
  { name: "Nagpur", region: "Maharashtra", country: "India", continent: "Asia", lat: 21.1458, lng: 79.0882 },
  { name: "Coimbatore", region: "Tamil Nadu", country: "India", continent: "Asia", lat: 11.0168, lng: 76.9558 },
  { name: "Madurai", region: "Tamil Nadu", country: "India", continent: "Asia", lat: 9.9252, lng: 78.1198 },
  { name: "Visakhapatnam", region: "Andhra Pradesh", country: "India", continent: "Asia", lat: 17.6868, lng: 83.2185 },
  { name: "Patna", region: "Bihar", country: "India", continent: "Asia", lat: 25.6093, lng: 85.1376 },
  { name: "Guwahati", region: "Assam", country: "India", continent: "Asia", lat: 26.1445, lng: 91.7362 },
  { name: "Bhubaneswar", region: "Odisha", country: "India", continent: "Asia", lat: 20.2961, lng: 85.8245 },
  { name: "Ranchi", region: "Jharkhand", country: "India", continent: "Asia", lat: 23.3441, lng: 85.3096 },
  { name: "Surat", region: "Gujarat", country: "India", continent: "Asia", lat: 21.1702, lng: 72.8311 },
  { name: "Mangalore", region: "Karnataka", country: "India", continent: "Asia", lat: 12.9141, lng: 74.856 },
  { name: "Pondicherry", region: "Puducherry", country: "India", continent: "Asia", lat: 11.9416, lng: 79.8083 },
  { name: "Gokarna", region: "Karnataka", country: "India", continent: "Asia", lat: 14.55, lng: 74.3167 },
  { name: "Chikmagalur", region: "Karnataka", country: "India", continent: "Asia", lat: 13.3153, lng: 75.7754 },
  { name: "Hampi", region: "Karnataka", country: "India", continent: "Asia", lat: 15.335, lng: 76.46 },
  { name: "Ooty", region: "Tamil Nadu", country: "India", continent: "Asia", lat: 11.4102, lng: 76.6950 },
  { name: "Munnar", region: "Kerala", country: "India", continent: "Asia", lat: 10.0889, lng: 77.0595 },
  { name: "Darjeeling", region: "West Bengal", country: "India", continent: "Asia", lat: 27.041, lng: 88.2663 },
  { name: "Gangtok", region: "Sikkim", country: "India", continent: "Asia", lat: 27.3389, lng: 88.6065 },
  { name: "Shillong", region: "Meghalaya", country: "India", continent: "Asia", lat: 25.5788, lng: 91.8933 },
  // Southeast Asia
  { name: "Bangkok", region: "Bangkok", country: "Thailand", continent: "Asia", lat: 13.7563, lng: 100.5018 },
  { name: "Chiang Mai", region: "Chiang Mai", country: "Thailand", continent: "Asia", lat: 18.7883, lng: 98.9853 },
  { name: "Phuket", region: "Phuket", country: "Thailand", continent: "Asia", lat: 7.8804, lng: 98.3923 },
  { name: "Singapore", region: "Singapore", country: "Singapore", continent: "Asia", lat: 1.3521, lng: 103.8198 },
  { name: "Kuala Lumpur", region: "Federal Territory", country: "Malaysia", continent: "Asia", lat: 3.139, lng: 101.6869 },
  { name: "Jakarta", region: "DKI Jakarta", country: "Indonesia", continent: "Asia", lat: -6.2088, lng: 106.8456 },
  { name: "Bali", region: "Bali", country: "Indonesia", continent: "Asia", lat: -8.3405, lng: 115.092 },
  { name: "Ho Chi Minh City", region: "Ho Chi Minh", country: "Vietnam", continent: "Asia", lat: 10.8231, lng: 106.6297 },
  { name: "Hanoi", region: "Hanoi", country: "Vietnam", continent: "Asia", lat: 21.0278, lng: 105.8342 },
  { name: "Manila", region: "Metro Manila", country: "Philippines", continent: "Asia", lat: 14.5995, lng: 120.9842 },
  { name: "Phnom Penh", region: "Phnom Penh", country: "Cambodia", continent: "Asia", lat: 11.5564, lng: 104.9282 },
  { name: "Siem Reap", region: "Siem Reap", country: "Cambodia", continent: "Asia", lat: 13.3671, lng: 103.8448 },
  { name: "Yangon", region: "Yangon", country: "Myanmar", continent: "Asia", lat: 16.8661, lng: 96.1951 },
  // East Asia
  { name: "Tokyo", region: "Tokyo", country: "Japan", continent: "Asia", lat: 35.6762, lng: 139.6503 },
  { name: "Osaka", region: "Osaka", country: "Japan", continent: "Asia", lat: 34.6937, lng: 135.5023 },
  { name: "Kyoto", region: "Kyoto", country: "Japan", continent: "Asia", lat: 35.0116, lng: 135.7681 },
  { name: "Seoul", region: "Seoul", country: "South Korea", continent: "Asia", lat: 37.5665, lng: 126.978 },
  { name: "Busan", region: "Busan", country: "South Korea", continent: "Asia", lat: 35.1796, lng: 129.0756 },
  { name: "Beijing", region: "Beijing", country: "China", continent: "Asia", lat: 39.9042, lng: 116.4074 },
  { name: "Shanghai", region: "Shanghai", country: "China", continent: "Asia", lat: 31.2304, lng: 121.4737 },
  { name: "Hong Kong", region: "Hong Kong", country: "China", continent: "Asia", lat: 22.3193, lng: 114.1694 },
  { name: "Taipei", region: "Taipei", country: "Taiwan", continent: "Asia", lat: 25.033, lng: 121.5654 },
  { name: "Shenzhen", region: "Guangdong", country: "China", continent: "Asia", lat: 22.5431, lng: 114.0579 },
  { name: "Guangzhou", region: "Guangdong", country: "China", continent: "Asia", lat: 23.1291, lng: 113.2644 },
  { name: "Chengdu", region: "Sichuan", country: "China", continent: "Asia", lat: 30.5728, lng: 104.0668 },
  // Central/West Asia
  { name: "Dubai", region: "Dubai", country: "UAE", continent: "Asia", lat: 25.2048, lng: 55.2708 },
  { name: "Abu Dhabi", region: "Abu Dhabi", country: "UAE", continent: "Asia", lat: 24.4539, lng: 54.3773 },
  { name: "Doha", region: "Doha", country: "Qatar", continent: "Asia", lat: 25.2854, lng: 51.531 },
  { name: "Riyadh", region: "Riyadh", country: "Saudi Arabia", continent: "Asia", lat: 24.7136, lng: 46.6753 },
  { name: "Tel Aviv", region: "Tel Aviv", country: "Israel", continent: "Asia", lat: 32.0853, lng: 34.7818 },
  { name: "Istanbul", region: "Istanbul", country: "Turkey", continent: "Asia", lat: 41.0082, lng: 28.9784 },
  { name: "Kathmandu", region: "Bagmati", country: "Nepal", continent: "Asia", lat: 27.7172, lng: 85.324 },
  { name: "Pokhara", region: "Gandaki", country: "Nepal", continent: "Asia", lat: 28.2096, lng: 83.9856 },
  { name: "Colombo", region: "Western", country: "Sri Lanka", continent: "Asia", lat: 6.9271, lng: 79.8612 },
  { name: "Thimphu", region: "Thimphu", country: "Bhutan", continent: "Asia", lat: 27.4728, lng: 89.6393 },
  { name: "Dhaka", region: "Dhaka", country: "Bangladesh", continent: "Asia", lat: 23.8103, lng: 90.4125 },
  { name: "Islamabad", region: "ICT", country: "Pakistan", continent: "Asia", lat: 33.6844, lng: 73.0479 },
  { name: "Lahore", region: "Punjab", country: "Pakistan", continent: "Asia", lat: 31.5204, lng: 74.3587 },
  { name: "Karachi", region: "Sindh", country: "Pakistan", continent: "Asia", lat: 24.8607, lng: 67.0011 },
  { name: "Tashkent", region: "Tashkent", country: "Uzbekistan", continent: "Asia", lat: 41.2995, lng: 69.2401 },
  { name: "Almaty", region: "Almaty", country: "Kazakhstan", continent: "Asia", lat: 43.2551, lng: 76.9126 },
  { name: "Tbilisi", region: "Tbilisi", country: "Georgia", continent: "Asia", lat: 41.7151, lng: 44.8271 },
  { name: "Baku", region: "Baku", country: "Azerbaijan", continent: "Asia", lat: 40.4093, lng: 49.8671 },
]

// ─── EUROPE ─────────────────────────────────────────────────────────────────
const EUROPE: WorldCity[] = [
  { name: "London", region: "England", country: "United Kingdom", continent: "Europe", lat: 51.5074, lng: -0.1278 },
  { name: "Edinburgh", region: "Scotland", country: "United Kingdom", continent: "Europe", lat: 55.9533, lng: -3.1883 },
  { name: "Manchester", region: "England", country: "United Kingdom", continent: "Europe", lat: 53.4808, lng: -2.2426 },
  { name: "Paris", region: "Île-de-France", country: "France", continent: "Europe", lat: 48.8566, lng: 2.3522 },
  { name: "Lyon", region: "Auvergne-Rhône-Alpes", country: "France", continent: "Europe", lat: 45.764, lng: 4.8357 },
  { name: "Nice", region: "Provence-Alpes-Côte d'Azur", country: "France", continent: "Europe", lat: 43.7102, lng: 7.262 },
  { name: "Marseille", region: "Provence", country: "France", continent: "Europe", lat: 43.2965, lng: 5.3698 },
  { name: "Chamonix", region: "Auvergne-Rhône-Alpes", country: "France", continent: "Europe", lat: 45.9237, lng: 6.8694 },
  { name: "Berlin", region: "Berlin", country: "Germany", continent: "Europe", lat: 52.52, lng: 13.405 },
  { name: "Munich", region: "Bavaria", country: "Germany", continent: "Europe", lat: 48.1351, lng: 11.582 },
  { name: "Hamburg", region: "Hamburg", country: "Germany", continent: "Europe", lat: 53.5511, lng: 9.9937 },
  { name: "Frankfurt", region: "Hesse", country: "Germany", continent: "Europe", lat: 50.1109, lng: 8.6821 },
  { name: "Rome", region: "Lazio", country: "Italy", continent: "Europe", lat: 41.9028, lng: 12.4964 },
  { name: "Milan", region: "Lombardy", country: "Italy", continent: "Europe", lat: 45.4642, lng: 9.19 },
  { name: "Florence", region: "Tuscany", country: "Italy", continent: "Europe", lat: 43.7696, lng: 11.2558 },
  { name: "Venice", region: "Veneto", country: "Italy", continent: "Europe", lat: 45.4408, lng: 12.3155 },
  { name: "Naples", region: "Campania", country: "Italy", continent: "Europe", lat: 40.8518, lng: 14.2681 },
  { name: "Madrid", region: "Madrid", country: "Spain", continent: "Europe", lat: 40.4168, lng: -3.7038 },
  { name: "Barcelona", region: "Catalonia", country: "Spain", continent: "Europe", lat: 41.3874, lng: 2.1686 },
  { name: "Seville", region: "Andalusia", country: "Spain", continent: "Europe", lat: 37.3891, lng: -5.9845 },
  { name: "Valencia", region: "Valencia", country: "Spain", continent: "Europe", lat: 39.4699, lng: -0.3763 },
  { name: "Lisbon", region: "Lisbon", country: "Portugal", continent: "Europe", lat: 38.7223, lng: -9.1393 },
  { name: "Porto", region: "Porto", country: "Portugal", continent: "Europe", lat: 41.1579, lng: -8.6291 },
  { name: "Amsterdam", region: "North Holland", country: "Netherlands", continent: "Europe", lat: 52.3676, lng: 4.9041 },
  { name: "Brussels", region: "Brussels", country: "Belgium", continent: "Europe", lat: 50.8503, lng: 4.3517 },
  { name: "Vienna", region: "Vienna", country: "Austria", continent: "Europe", lat: 48.2082, lng: 16.3738 },
  { name: "Innsbruck", region: "Tyrol", country: "Austria", continent: "Europe", lat: 47.2692, lng: 11.4041 },
  { name: "Zurich", region: "Zurich", country: "Switzerland", continent: "Europe", lat: 47.3769, lng: 8.5417 },
  { name: "Geneva", region: "Geneva", country: "Switzerland", continent: "Europe", lat: 46.2044, lng: 6.1432 },
  { name: "Interlaken", region: "Bern", country: "Switzerland", continent: "Europe", lat: 46.6863, lng: 7.8632 },
  { name: "Zermatt", region: "Valais", country: "Switzerland", continent: "Europe", lat: 46.0207, lng: 7.7491 },
  { name: "Prague", region: "Prague", country: "Czech Republic", continent: "Europe", lat: 50.0755, lng: 14.4378 },
  { name: "Budapest", region: "Budapest", country: "Hungary", continent: "Europe", lat: 47.4979, lng: 19.0402 },
  { name: "Warsaw", region: "Masovia", country: "Poland", continent: "Europe", lat: 52.2297, lng: 21.0122 },
  { name: "Krakow", region: "Lesser Poland", country: "Poland", continent: "Europe", lat: 50.0647, lng: 19.945 },
  { name: "Stockholm", region: "Stockholm", country: "Sweden", continent: "Europe", lat: 59.3293, lng: 18.0686 },
  { name: "Copenhagen", region: "Capital Region", country: "Denmark", continent: "Europe", lat: 55.6761, lng: 12.5683 },
  { name: "Oslo", region: "Oslo", country: "Norway", continent: "Europe", lat: 59.9139, lng: 10.7522 },
  { name: "Bergen", region: "Vestland", country: "Norway", continent: "Europe", lat: 60.3913, lng: 5.3221 },
  { name: "Tromsø", region: "Troms", country: "Norway", continent: "Europe", lat: 69.6492, lng: 18.9553 },
  { name: "Helsinki", region: "Uusimaa", country: "Finland", continent: "Europe", lat: 60.1699, lng: 24.9384 },
  { name: "Reykjavik", region: "Capital Region", country: "Iceland", continent: "Europe", lat: 64.1466, lng: -21.9426 },
  { name: "Dublin", region: "Leinster", country: "Ireland", continent: "Europe", lat: 53.3498, lng: -6.2603 },
  { name: "Athens", region: "Attica", country: "Greece", continent: "Europe", lat: 37.9838, lng: 23.7275 },
  { name: "Santorini", region: "South Aegean", country: "Greece", continent: "Europe", lat: 36.3932, lng: 25.4615 },
  { name: "Dubrovnik", region: "Dubrovnik-Neretva", country: "Croatia", continent: "Europe", lat: 42.6507, lng: 18.0944 },
  { name: "Split", region: "Split-Dalmatia", country: "Croatia", continent: "Europe", lat: 43.5081, lng: 16.4402 },
  { name: "Bucharest", region: "Bucharest", country: "Romania", continent: "Europe", lat: 44.4268, lng: 26.1025 },
  { name: "Sofia", region: "Sofia", country: "Bulgaria", continent: "Europe", lat: 42.6977, lng: 23.3219 },
  { name: "Moscow", region: "Moscow", country: "Russia", continent: "Europe", lat: 55.7558, lng: 37.6173 },
  { name: "St. Petersburg", region: "St. Petersburg", country: "Russia", continent: "Europe", lat: 59.9343, lng: 30.3351 },
  { name: "Ljubljana", region: "Central Slovenia", country: "Slovenia", continent: "Europe", lat: 46.0569, lng: 14.5058 },
  { name: "Bratislava", region: "Bratislava", country: "Slovakia", continent: "Europe", lat: 48.1486, lng: 17.1077 },
  { name: "Tallinn", region: "Harju", country: "Estonia", continent: "Europe", lat: 59.437, lng: 24.7536 },
  { name: "Riga", region: "Riga", country: "Latvia", continent: "Europe", lat: 56.9496, lng: 24.1052 },
]

// ─── NORTH AMERICA ──────────────────────────────────────────────────────────
const NORTH_AMERICA: WorldCity[] = [
  { name: "New York", region: "New York", country: "United States", continent: "North America", lat: 40.7128, lng: -74.006 },
  { name: "Los Angeles", region: "California", country: "United States", continent: "North America", lat: 34.0522, lng: -118.2437 },
  { name: "San Francisco", region: "California", country: "United States", continent: "North America", lat: 37.7749, lng: -122.4194 },
  { name: "Chicago", region: "Illinois", country: "United States", continent: "North America", lat: 41.8781, lng: -87.6298 },
  { name: "Miami", region: "Florida", country: "United States", continent: "North America", lat: 25.7617, lng: -80.1918 },
  { name: "Seattle", region: "Washington", country: "United States", continent: "North America", lat: 47.6062, lng: -122.3321 },
  { name: "Denver", region: "Colorado", country: "United States", continent: "North America", lat: 39.7392, lng: -104.9903 },
  { name: "Boston", region: "Massachusetts", country: "United States", continent: "North America", lat: 42.3601, lng: -71.0589 },
  { name: "Austin", region: "Texas", country: "United States", continent: "North America", lat: 30.2672, lng: -97.7431 },
  { name: "Houston", region: "Texas", country: "United States", continent: "North America", lat: 29.7604, lng: -95.3698 },
  { name: "Portland", region: "Oregon", country: "United States", continent: "North America", lat: 45.5051, lng: -122.675 },
  { name: "Nashville", region: "Tennessee", country: "United States", continent: "North America", lat: 36.1627, lng: -86.7816 },
  { name: "Washington DC", region: "District of Columbia", country: "United States", continent: "North America", lat: 38.9072, lng: -77.0369 },
  { name: "Las Vegas", region: "Nevada", country: "United States", continent: "North America", lat: 36.1699, lng: -115.1398 },
  { name: "San Diego", region: "California", country: "United States", continent: "North America", lat: 32.7157, lng: -117.1611 },
  { name: "Phoenix", region: "Arizona", country: "United States", continent: "North America", lat: 33.4484, lng: -112.074 },
  { name: "Atlanta", region: "Georgia", country: "United States", continent: "North America", lat: 33.749, lng: -84.388 },
  { name: "Salt Lake City", region: "Utah", country: "United States", continent: "North America", lat: 40.7608, lng: -111.891 },
  { name: "Honolulu", region: "Hawaii", country: "United States", continent: "North America", lat: 21.3069, lng: -157.8583 },
  { name: "Anchorage", region: "Alaska", country: "United States", continent: "North America", lat: 61.2181, lng: -149.9003 },
  { name: "Toronto", region: "Ontario", country: "Canada", continent: "North America", lat: 43.6532, lng: -79.3832 },
  { name: "Vancouver", region: "British Columbia", country: "Canada", continent: "North America", lat: 49.2827, lng: -123.1207 },
  { name: "Montreal", region: "Quebec", country: "Canada", continent: "North America", lat: 45.5017, lng: -73.5673 },
  { name: "Calgary", region: "Alberta", country: "Canada", continent: "North America", lat: 51.0447, lng: -114.0719 },
  { name: "Ottawa", region: "Ontario", country: "Canada", continent: "North America", lat: 45.4215, lng: -75.6972 },
  { name: "Banff", region: "Alberta", country: "Canada", continent: "North America", lat: 51.1784, lng: -115.5708 },
  { name: "Mexico City", region: "CDMX", country: "Mexico", continent: "North America", lat: 19.4326, lng: -99.1332 },
  { name: "Cancun", region: "Quintana Roo", country: "Mexico", continent: "North America", lat: 21.1619, lng: -86.8515 },
  { name: "Guadalajara", region: "Jalisco", country: "Mexico", continent: "North America", lat: 20.6597, lng: -103.3496 },
  { name: "Havana", region: "Havana", country: "Cuba", continent: "North America", lat: 23.1136, lng: -82.3666 },
  { name: "San Jose", region: "San Jose", country: "Costa Rica", continent: "North America", lat: 9.9281, lng: -84.0907 },
  { name: "Panama City", region: "Panama", country: "Panama", continent: "North America", lat: 8.9824, lng: -79.5199 },
]

// ─── SOUTH AMERICA ──────────────────────────────────────────────────────────
const SOUTH_AMERICA: WorldCity[] = [
  { name: "São Paulo", region: "São Paulo", country: "Brazil", continent: "South America", lat: -23.5505, lng: -46.6333 },
  { name: "Rio de Janeiro", region: "Rio de Janeiro", country: "Brazil", continent: "South America", lat: -22.9068, lng: -43.1729 },
  { name: "Buenos Aires", region: "Buenos Aires", country: "Argentina", continent: "South America", lat: -34.6037, lng: -58.3816 },
  { name: "Mendoza", region: "Mendoza", country: "Argentina", continent: "South America", lat: -32.8895, lng: -68.8458 },
  { name: "Bariloche", region: "Río Negro", country: "Argentina", continent: "South America", lat: -41.1335, lng: -71.3103 },
  { name: "Lima", region: "Lima", country: "Peru", continent: "South America", lat: -12.0464, lng: -77.0428 },
  { name: "Cusco", region: "Cusco", country: "Peru", continent: "South America", lat: -13.532, lng: -71.9675 },
  { name: "Bogota", region: "Bogota", country: "Colombia", continent: "South America", lat: 4.711, lng: -74.0721 },
  { name: "Medellin", region: "Antioquia", country: "Colombia", continent: "South America", lat: 6.2476, lng: -75.5658 },
  { name: "Santiago", region: "Santiago", country: "Chile", continent: "South America", lat: -33.4489, lng: -70.6693 },
  { name: "Valparaiso", region: "Valparaíso", country: "Chile", continent: "South America", lat: -33.0472, lng: -71.6127 },
  { name: "Quito", region: "Pichincha", country: "Ecuador", continent: "South America", lat: -0.1807, lng: -78.4678 },
  { name: "La Paz", region: "La Paz", country: "Bolivia", continent: "South America", lat: -16.4897, lng: -68.1193 },
  { name: "Montevideo", region: "Montevideo", country: "Uruguay", continent: "South America", lat: -34.9011, lng: -56.1645 },
  { name: "Cartagena", region: "Bolívar", country: "Colombia", continent: "South America", lat: 10.391, lng: -75.5144 },
]

// ─── AFRICA ─────────────────────────────────────────────────────────────────
const AFRICA: WorldCity[] = [
  { name: "Cape Town", region: "Western Cape", country: "South Africa", continent: "Africa", lat: -33.9249, lng: 18.4241 },
  { name: "Johannesburg", region: "Gauteng", country: "South Africa", continent: "Africa", lat: -26.2041, lng: 28.0473 },
  { name: "Durban", region: "KwaZulu-Natal", country: "South Africa", continent: "Africa", lat: -29.8587, lng: 31.0218 },
  { name: "Cairo", region: "Cairo", country: "Egypt", continent: "Africa", lat: 30.0444, lng: 31.2357 },
  { name: "Marrakech", region: "Marrakech-Safi", country: "Morocco", continent: "Africa", lat: 31.6295, lng: -7.9811 },
  { name: "Casablanca", region: "Casablanca-Settat", country: "Morocco", continent: "Africa", lat: 33.5731, lng: -7.5898 },
  { name: "Nairobi", region: "Nairobi", country: "Kenya", continent: "Africa", lat: -1.2921, lng: 36.8219 },
  { name: "Zanzibar", region: "Zanzibar", country: "Tanzania", continent: "Africa", lat: -6.1659, lng: 39.2026 },
  { name: "Dar es Salaam", region: "Dar es Salaam", country: "Tanzania", continent: "Africa", lat: -6.7924, lng: 39.2083 },
  { name: "Lagos", region: "Lagos", country: "Nigeria", continent: "Africa", lat: 6.5244, lng: 3.3792 },
  { name: "Accra", region: "Greater Accra", country: "Ghana", continent: "Africa", lat: 5.6037, lng: -0.187 },
  { name: "Addis Ababa", region: "Addis Ababa", country: "Ethiopia", continent: "Africa", lat: 9.0054, lng: 38.7636 },
  { name: "Kigali", region: "Kigali", country: "Rwanda", continent: "Africa", lat: -1.9403, lng: 29.8739 },
  { name: "Kampala", region: "Central", country: "Uganda", continent: "Africa", lat: 0.3476, lng: 32.5825 },
  { name: "Windhoek", region: "Khomas", country: "Namibia", continent: "Africa", lat: -22.5609, lng: 17.0658 },
  { name: "Victoria Falls", region: "Matabeleland North", country: "Zimbabwe", continent: "Africa", lat: -17.9243, lng: 25.8572 },
  { name: "Arusha", region: "Arusha", country: "Tanzania", continent: "Africa", lat: -3.3869, lng: 36.6830 },
  { name: "Tunis", region: "Tunis", country: "Tunisia", continent: "Africa", lat: 36.8065, lng: 10.1815 },
]

// ─── OCEANIA ────────────────────────────────────────────────────────────────
const OCEANIA: WorldCity[] = [
  { name: "Sydney", region: "New South Wales", country: "Australia", continent: "Oceania", lat: -33.8688, lng: 151.2093 },
  { name: "Melbourne", region: "Victoria", country: "Australia", continent: "Oceania", lat: -37.8136, lng: 144.9631 },
  { name: "Brisbane", region: "Queensland", country: "Australia", continent: "Oceania", lat: -27.4698, lng: 153.0251 },
  { name: "Perth", region: "Western Australia", country: "Australia", continent: "Oceania", lat: -31.9505, lng: 115.8605 },
  { name: "Adelaide", region: "South Australia", country: "Australia", continent: "Oceania", lat: -34.9285, lng: 138.6007 },
  { name: "Auckland", region: "Auckland", country: "New Zealand", continent: "Oceania", lat: -36.8485, lng: 174.7633 },
  { name: "Queenstown", region: "Otago", country: "New Zealand", continent: "Oceania", lat: -45.0312, lng: 168.6626 },
  { name: "Wellington", region: "Wellington", country: "New Zealand", continent: "Oceania", lat: -41.2865, lng: 174.7762 },
  { name: "Christchurch", region: "Canterbury", country: "New Zealand", continent: "Oceania", lat: -43.532, lng: 172.6306 },
  { name: "Fiji", region: "Viti Levu", country: "Fiji", continent: "Oceania", lat: -17.7134, lng: 178.065 },
]

// ─── Combined database ──────────────────────────────────────────────────────
export const WORLD_CITIES: WorldCity[] = [
  ...ASIA,
  ...EUROPE,
  ...NORTH_AMERICA,
  ...SOUTH_AMERICA,
  ...AFRICA,
  ...OCEANIA,
]

// ─── Utility functions ──────────────────────────────────────────────────────

/** Haversine distance in km between two lat/lng points */
export function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/** Get cities sorted by distance from user location */
export function getNearbyCities(
  lat: number,
  lng: number,
  limit = 12
): (WorldCity & { distance: number })[] {
  return WORLD_CITIES
    .map((city) => ({
      ...city,
      distance: haversineDistance(lat, lng, city.lat, city.lng),
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit)
}

/** Search cities by name (fuzzy prefix match) */
export function searchCities(query: string, limit = 20): WorldCity[] {
  if (!query.trim()) return []
  const q = query.toLowerCase().trim()
  // Exact prefix matches first, then includes
  const prefixMatches: WorldCity[] = []
  const includesMatches: WorldCity[] = []
  for (const city of WORLD_CITIES) {
    const name = city.name.toLowerCase()
    if (name.startsWith(q)) {
      prefixMatches.push(city)
    } else if (
      name.includes(q) ||
      city.country.toLowerCase().includes(q) ||
      city.region.toLowerCase().includes(q)
    ) {
      includesMatches.push(city)
    }
  }
  return [...prefixMatches, ...includesMatches].slice(0, limit)
}

/** Get unique countries from the database */
export function getAllCountries(): string[] {
  return [...new Set(WORLD_CITIES.map((c) => c.country))].sort()
}

/** Get unique continents */
export function getAllContinents(): string[] {
  return [...new Set(WORLD_CITIES.map((c) => c.continent))].sort()
}

/** Get cities for a specific country */
export function getCitiesByCountry(country: string): WorldCity[] {
  return WORLD_CITIES.filter((c) => c.country === country)
}
