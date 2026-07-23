export async function fetchHospitals(lat: number, lon: number) {
  const query = `
    [out:json];
    node
      ["amenity"="hospital"]
      (around:5000,${lat},${lon});
    out;
  `;

  const url = "https://overpass-api.de/api/interpreter";

  const res = await fetch(url, {
    method: "POST",
    body: query,
  });

  const data = await res.json();

  return data.elements.map((h: any) => ({
    name: h.tags?.name || "Hospital",
    lat: h.lat,
    lon: h.lon,
  }));
}