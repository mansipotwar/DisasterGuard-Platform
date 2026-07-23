import { useState } from 'react';
import { Waves, Flame, Mountain, Activity, Wind, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

const disasters = [
  {
    id: 'flood',
    label: 'Flood',
    icon: Waves,
    color: '#38bdf8',
    emoji: '🌊',
    explanation: 'Floods occur when water overflows onto normally dry land. They can be caused by heavy rainfall, storm surges, dam failures, or snowmelt. Flash floods are particularly dangerous, developing within minutes.',
    dos: [
      'Move immediately to higher ground or the upper floors of a building.',
      'Disconnect electrical appliances before floodwaters enter your home.',
      'Carry emergency supplies: water, food, flashlight, and first aid kit.',
      'Listen to official emergency alerts and follow evacuation orders.',
      'Avoid walking or driving through floodwaters — 6 inches can knock you down.',
    ],
    donts: [
      "Don't enter flooded roads — 12 inches of water can sweep away a small vehicle.",
      "Don't touch electrical equipment in wet conditions.",
      "Don't drink floodwater — it is heavily contaminated.",
      "Don't return home until authorities declare it safe.",
      "Don't ignore early warning signs like rising river levels.",
    ],
    emergency: [
      'Call emergency services: 911 / local emergency number.',
      'Signal for help from upper floors with a light or brightly colored cloth.',
      'If trapped in a vehicle, exit through the window if water enters.',
      'Avoid storm drains, ditches, culverts, and channels.',
    ],
  },
  {
    id: 'wildfire',
    label: 'Wildfire',
    icon: Flame,
    color: '#fb923c',
    emoji: '🔥',
    explanation: 'Wildfires are uncontrolled fires that spread rapidly through vegetation. They are fueled by dry conditions, wind, and available combustible material. They can spread faster than a person can run.',
    dos: [
      'Evacuate immediately when ordered — never wait to gather belongings.',
      'Clear brush, dead leaves, and dry vegetation within 30 feet of your home.',
      'Wear protective clothing: long sleeves, sturdy shoes, and N95 mask if available.',
      'Close all windows and doors to keep smoke and embers out.',
      'Keep car fueled and facing the exit direction in case of emergency escape.',
    ],
    donts: [
      "Don't start any outdoor fires during high-risk conditions.",
      "Don't ignore evacuation orders — wildfires change direction unpredictably.",
      "Don't park vehicles under trees or in dry grass areas.",
      "Don't use ceiling fans or HVAC during a wildfire (it brings in smoke).",
      "Don't return until air quality index is safe and fire is fully contained.",
    ],
    emergency: [
      'If caught in a wildfire: lie face down in a depression or ditch, cover yourself.',
      'Cover your nose and mouth with a wet cloth to filter smoke.',
      'Stay low where air is cleaner and cooler.',
      'Call emergency services immediately and provide your exact location.',
    ],
  },
  {
    id: 'landslide',
    label: 'Landslide',
    icon: Mountain,
    color: '#a78bfa',
    emoji: '⛰️',
    explanation: 'Landslides involve the movement of rock, soil, or debris down a slope. Triggered by rainfall, earthquakes, or volcanic activity, they can travel at high speed with almost no warning in steep terrain.',
    dos: [
      'Move away from the slide path immediately — move to higher, stable ground.',
      'Listen for unusual sounds: cracking trees, rumbling, or rushing water.',
      'Stay alert during periods of heavy or prolonged rain in hilly areas.',
      'Check your home for unusual cracks in the foundation, walls, or ground.',
      'Follow official evacuation advisories in mountainous regions.',
    ],
    donts: [
      "Don't build on or below steep slopes without professional hazard assessment.",
      "Don't try to outrun a landslide on roads — move perpendicular to the flow.",
      "Don't re-enter hazard zones after a slide without clearance.",
      "Don't ignore warning signs: tilted trees, bulging ground, cracked terrain.",
      "Don't channel water runoff onto steep slopes.",
    ],
    emergency: [
      'Move to the nearest stable, high ground immediately.',
      'Avoid river valleys and low-lying areas after heavy rain.',
      'Check for injured people without entering the landslide area.',
      'Contact local emergency services and report the slide location.',
    ],
  },
  {
    id: 'earthquake',
    label: 'Earthquake',
    icon: Activity,
    color: '#facc15',
    emoji: '🌍',
    explanation: 'Earthquakes are caused by sudden energy release in Earth\'s crust, creating seismic waves. They can cause ground rupture, building collapse, tsunamis, and secondary hazards like landslides.',
    dos: [
      'Drop, Cover, and Hold On: get under a sturdy table or desk.',
      'Stay away from windows, heavy furniture, and exterior walls.',
      'If outside, move away from buildings, streetlights, and utility wires.',
      'If driving, pull over safely away from bridges and overpasses.',
      'Secure heavy furniture, bookshelves, and water heaters to walls.',
    ],
    donts: [
      "Don't run outside during shaking — most injuries occur from falling debris near exits.",
      "Don't use elevators after an earthquake.",
      "Don't light candles or matches — gas leaks may be present.",
      "Don't enter damaged buildings until structurally cleared.",
      "Don't stand in doorways — this is an outdated myth.",
    ],
    emergency: [
      'Check yourself and others for injuries. Apply first aid if trained.',
      'Smell for gas leaks — if detected, open windows and evacuate.',
      'Turn off utilities only if you know how and suspect damage.',
      'Expect aftershocks. Stay away from damaged structures.',
    ],
  },
  {
    id: 'hurricane',
    label: 'Hurricane',
    icon: Wind,
    color: '#4ade80',
    emoji: '🌀',
    explanation: 'Hurricanes are powerful tropical cyclones with sustained winds of 74+ mph. They bring heavy rainfall, storm surges, tornadoes, and widespread flooding. Coastal areas are most at risk.',
    dos: [
      'Board up windows and doors well before the storm arrives.',
      'Stock at least 3 days of water, food, medication, and supplies.',
      'Know your evacuation zone and plan multiple routes.',
      'Move to an interior room on the lowest floor above flood level during the storm.',
      'Charge all devices and have battery-powered radio for updates.',
    ],
    donts: [
      "Don't go outside during the storm, including in the eye — the worst winds may return.",
      "Don't use generators indoors — carbon monoxide poisoning is fatal.",
      "Don't ignore evacuation orders for coastal or low-lying areas.",
      "Don't drive into flooded roads after the storm.",
      "Don't touch downed power lines — assume they are live.",
    ],
    emergency: [
      'Shelter in an interior room away from windows during peak storm.',
      'Do not go outside until official all-clear from emergency services.',
      'Watch for storm surge flooding, especially within 1 mile of coast.',
      'Use 911 only for life-threatening emergencies to keep lines open.',
    ],
  },
];

export default function Safety() {
  const [selected, setSelected] = useState(disasters[0]);
  const [tab, setTab] = useState<'dos' | 'donts' | 'emergency'>('dos');

  return (
    <div className="page-container" style={{ padding: '5rem 1.5rem 3rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <div className="tag tag-orange" style={{ marginBottom: '0.875rem' }}>Safety Guides</div>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 800, margin: '0 0 0.5rem', letterSpacing: '-0.02em' }}>
          Disaster Safety Recommendations
        </h1>
        <p style={{ color: '#475569', fontSize: '0.9375rem', margin: 0 }}>
          Comprehensive preparedness guides for five critical natural disaster scenarios.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '0.625rem', marginBottom: '1.75rem', flexWrap: 'wrap' }}>
        {disasters.map(d => (
          <button key={d.id} onClick={() => { setSelected(d); setTab('dos'); }} style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.5rem 1rem', borderRadius: '0.5rem',
            background: selected.id === d.id ? `${d.color}15` : 'rgba(30, 41, 59, 0.6)',
            border: `1px solid ${selected.id === d.id ? d.color + '40' : 'rgba(255,255,255,0.08)'}`,
            color: selected.id === d.id ? d.color : '#64748b',
            fontWeight: 600, fontSize: '0.8125rem',
            cursor: 'pointer', transition: 'all 0.2s ease',
          }}>
            <span>{d.emoji}</span> {d.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
        <div className="glass-card" style={{ borderRadius: '1rem', padding: '1.25rem', gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.875rem' }}>
            <span style={{ fontSize: '1.5rem' }}>{selected.emoji}</span>
            <div>
              <p style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '1rem', margin: 0 }}>About {selected.label}s</p>
              <p style={{ color: '#475569', fontSize: '0.75rem', margin: 0 }}>Understanding the hazard</p>
            </div>
          </div>
          <p style={{ color: '#64748b', fontSize: '0.875rem', lineHeight: 1.75, margin: 0 }}>{selected.explanation}</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
        {([['dos', CheckCircle, 'Do\'s', '#4ade80'], ['donts', XCircle, "Don'ts", '#f87171'], ['emergency', AlertTriangle, 'Emergency Steps', '#fb923c']] as const).map(([id, Icon, label, color]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.5rem 1.125rem', borderRadius: '0.5rem',
            background: tab === id ? `${color}15` : 'rgba(30, 41, 59, 0.6)',
            border: `1px solid ${tab === id ? color + '40' : 'rgba(255,255,255,0.08)'}`,
            color: tab === id ? color : '#64748b',
            fontWeight: 600, fontSize: '0.8125rem',
            cursor: 'pointer', transition: 'all 0.2s ease',
          }}>
            <Icon size={13} />
            {label}
          </button>
        ))}
      </div>

      <div className="glass-card animate-fade-in" style={{ borderRadius: '1rem', padding: '1.25rem' }}>
        {tab === 'dos' && (
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {selected.dos.map((tip, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <CheckCircle size={16} color="#4ade80" style={{ flexShrink: 0, marginTop: 2 }} />
                <span style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.6 }}>{tip}</span>
              </li>
            ))}
          </ul>
        )}
        {tab === 'donts' && (
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {selected.donts.map((tip, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <XCircle size={16} color="#f87171" style={{ flexShrink: 0, marginTop: 2 }} />
                <span style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.6 }}>{tip}</span>
              </li>
            ))}
          </ul>
        )}
        {tab === 'emergency' && (
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {selected.emergency.map((step, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <div style={{
                  width: '1.375rem', height: '1.375rem', borderRadius: '50%',
                  background: 'rgba(251, 146, 60, 0.15)',
                  border: '1px solid rgba(251, 146, 60, 0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, marginTop: 2,
                }}>
                  <span style={{ color: '#fb923c', fontSize: '0.6875rem', fontWeight: 800 }}>{i + 1}</span>
                </div>
                <span style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.6 }}>{step}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
