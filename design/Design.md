# Design.md - Industrial IoT Telemetry Console
## Complete AI-Ready Implementation Blueprint

**Version**: 1.0  
**Last Updated**: 2024  
**Status**: Production Ready  
**Format**: Portable for All AI Tools (Claude, GPT-4, Codex, etc.)

---

## 📋 PROJECT SUMMARY

**Name**: Industrial IoT Telemetry & Incident Remediation Console  
**Type**: Web Dashboard (Dark Theme, Desktop-First)  
**Purpose**: Real-time monitoring of industrial machinery with sensor telemetry, anomaly detection, root-cause diagnostics, and technician dispatch  
**Target**: 5-15 machines per dashboard view  
**Tech Stack**: HTML5 + Tailwind CSS + Vanilla JS (No frameworks required)

---

## 🎨 DESIGN SYSTEM

### Color Palette (CSS Variables)

```css
/* Status Colors */
--status-healthy: #10B981;      /* Emerald Green */
--status-warning: #F59E0B;      /* Amber/Orange */
--status-critical: #EF4444;     /* Red */
--status-maintenance: #3B82F6;  /* Blue */

/* Neutral Colors */
--bg-primary: #1F2937;          /* Dark Charcoal - Main background */
--bg-surface: #111827;          /* Darker Charcoal - Cards & surfaces */
--bg-elevated: #374151;         /* Medium Gray - Modals & overlays */
--text-primary: #F3F4F6;        /* Light Gray - Main text */
--text-secondary: #9CA3AF;      /* Medium Gray - Secondary text */
--border: #374151;              /* Dark Gray - Borders & dividers */
--accent: #06B6D4;              /* Cyan - Highlights & CTAs */
```

### Typography

| Level | Font | Size | Weight | Usage |
|-------|------|------|--------|-------|
| Display | CabinetGrotesk | 48px | Bold (700) | Page title |
| H1 | CabinetGrotesk | 28px | Semibold (600) | Section headers |
| H2 | CabinetGrotesk | 20px | Semibold (600) | Subsection headers |
| H3 | CabinetGrotesk | 16px | Medium (500) | Card titles |
| Body | CabinetGrotesk | 14px | Regular (400) | Main content |
| Caption | CabinetGrotesk | 12px | Regular (400) | Labels & meta |
| Mono | JetBrainsMono | 13px | Regular (400) | Sensor values, codes |

**Font Imports**:
```html
<link href="https://fonts.cdnfonts.com/css/cabinet-grotesk" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
```

---

## 🧩 COMPLETE COMPONENT LIBRARY

### 1. STATUS BADGE COMPONENT

**Purpose**: Display system health with status indicator, label, and count  
**Used In**: Dashboard header summary section

**HTML Structure**:
```html
<div class="animate-fadeInUp bg-[#111827] border border-[#10B981]/30 p-4 rounded-xl flex items-center justify-between hover:scale-[1.02] transition-transform cursor-pointer">
  <div class="flex items-center gap-3">
    <span class="w-3 h-3 rounded-full bg-[#10B981] pulse-dot-regular"></span>
    <span class="font-medium text-sm">Healthy</span>
  </div>
  <span class="text-lg font-bold mono text-[#10B981]">12</span>
</div>
```

**CSS Styles**:
```css
.animate-fadeInUp {
  animation: fadeInUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.pulse-dot-regular {
  animation: pulse-dot 2s infinite;
}

@keyframes pulse-dot {
  0%, 100% { opacity: 0.6; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.2); }
}

/* Status Variants */
.status-healthy { border-color: rgba(16, 185, 129, 0.3); background-color: rgba(16, 185, 129, 0.05); }
.status-warning { border-color: rgba(245, 158, 11, 0.3); background-color: rgba(245, 158, 11, 0.05); }
.status-critical { border-color: rgba(239, 68, 68, 0.3); background-color: rgba(239, 68, 68, 0.05); }
.status-maintenance { border-color: rgba(59, 130, 246, 0.3); background-color: rgba(59, 130, 246, 0.05); }

/* Pulse Animation for Critical */
.pulse-dot-critical {
  animation: pulse-dot 1s infinite, pulse-critical 1s infinite;
}

@keyframes pulse-critical {
  0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
  50% { box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
}
```

**Variants**: Create 4 status badges with `animation-delay: 0ms, 100ms, 200ms, 300ms`

---

### 2. MACHINE TELEMETRY CARD

**Purpose**: Display real-time sensor data with waveform chart and key metrics  
**Used In**: Main dashboard grid

**HTML Structure**:
```html
<div class="animate-fadeInUp bg-[#111827] border border-[#374151] rounded-xl p-5 flex flex-col gap-6 hover:border-[#06B6D4]/50 transition-colors" style="animation-delay: 400ms">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h4 class="font-bold text-[#F3F4F6]">Motor A - Vibration</h4>
      <p class="text-[10px] text-[#9CA3AF] uppercase tracking-wider mt-0.5">Production Line 1</p>
    </div>
    <span class="w-2.5 h-2.5 rounded-full bg-[#10B981] shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
  </div>

  <!-- Chart -->
  <div class="h-20">
    <svg viewBox="0 0 300 80" class="w-full h-full">
      <path d="M0,40 Q15,10 30,50 T60,30 T90,40 T120,60 T150,20 T180,45 T210,35 T240,55 T270,30 L300,40" 
            fill="none" stroke="#10B981" stroke-width="2" />
      <rect width="300" height="80" fill="rgba(16,185,129,0.05)" />
    </svg>
  </div>

  <!-- Metrics Grid -->
  <div class="grid grid-cols-3 gap-2 border-y border-[#374151] py-4">
    <div class="flex flex-col gap-1">
      <span class="text-[10px] text-[#9CA3AF] uppercase">Current</span>
      <span class="text-sm font-semibold mono text-[#F3F4F6]">4.23 mm/s</span>
    </div>
    <div class="flex flex-col gap-1">
      <span class="text-[10px] text-[#9CA3AF] uppercase">Max 24h</span>
      <span class="text-sm font-semibold mono text-[#F3F4F6]">6.18 mm/s</span>
    </div>
    <div class="flex flex-col gap-1">
      <span class="text-[10px] text-[#9CA3AF] uppercase">Trend</span>
      <span class="text-sm font-semibold text-[#10B981] flex items-center gap-1">↑ 0.8%</span>
    </div>
  </div>

  <!-- Footer -->
  <div class="flex items-center justify-between text-[11px] text-[#9CA3AF]">
    <span>Last updated: 2s ago</span>
    <button class="text-[#06B6D4] hover:underline font-semibold">Full Data</button>
  </div>
</div>
```

**CSS for Critical State**:
```css
.card-critical {
  border-color: rgba(239, 68, 68, 0.5);
  border-width: 2px;
}

.card-critical::before {
  content: 'Priority 1';
  position: absolute;
  top: 0;
  right: 0;
  background-color: rgba(239, 68, 68, 0.1);
  color: #EF4444;
  padding: 4px 12px;
  font-size: 10px;
  font-weight: bold;
  text-transform: uppercase;
  border-bottom: 1px solid rgba(239, 68, 68, 0.3);
  border-left: 1px solid rgba(239, 68, 68, 0.3);
  border-bottom-left-radius: 8px;
}
```

---

### 3. ANOMALY ALERT CARD

**Purpose**: Display critical/warning alerts with action buttons  
**Used In**: Alert feed section

**HTML Structure**:
```html
<div class="bg-[#111827] border-l-4 border-[#EF4444] rounded-r-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
  <!-- Icon & Content -->
  <div class="flex items-start gap-4 flex-1">
    <div class="bg-[#EF4444]/20 p-2.5 rounded-lg flex items-center justify-center">
      <svg class="w-6 h-6 text-[#EF4444]"><!-- Alert Triangle Icon --></svg>
    </div>
    <div class="flex flex-col gap-1.5">
      <div class="flex items-center gap-3">
        <h4 class="font-bold">Motor B - Temperature Critical Spike</h4>
        <span class="bg-[#EF4444] text-[10px] font-bold text-white px-2 py-0.5 rounded uppercase">Critical</span>
      </div>
      <p class="text-sm text-[#9CA3AF]">The winding temperature of Motor B has exceeded the safe threshold of 75°C. Current temperature: 82.5°C.</p>
      <span class="text-[11px] text-[#9CA3AF] mono italic">Timestamp: 2023-11-20 14:42:01 • Line 1, Station 4</span>
    </div>
  </div>

  <!-- Action Buttons -->
  <div class="flex items-center gap-3 w-full md:w-auto">
    <button onclick="openDiagnostic()" class="bg-[#374151] hover:bg-[#4b5563] text-white px-5 py-2.5 rounded-lg text-sm font-semibold">
      Investigate
    </button>
    <button class="bg-[#06B6D4] hover:bg-[#0891b2] text-[#111827] px-5 py-2.5 rounded-lg text-sm font-bold shadow-[0_0_15px_rgba(6,182,212,0.3)]">
      Dispatch Technician
    </button>
  </div>
</div>
```

**Severity Variants**:
```css
.alert-critical { border-left-color: #EF4444; background-color: rgba(239, 68, 68, 0.05); }
.alert-warning { border-left-color: #F59E0B; background-color: rgba(245, 158, 11, 0.05); }
.alert-info { border-left-color: #3B82F6; background-color: rgba(59, 130, 246, 0.05); }
```

---

### 4. ROOT-CAUSE DIAGNOSTICS MODAL

**Purpose**: Display AI-powered analysis with recommendations  
**Used In**: Alert investigation workflow

**HTML Structure**:
```html
<div id="diagnostic-modal" class="fixed inset-0 z-[100] hidden items-center justify-center">
  <!-- Overlay -->
  <div id="modal-overlay" onclick="closeDiagnostic()" class="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>

  <!-- Modal Content -->
  <div class="relative bg-[#111827] border border-[#374151] rounded-2xl w-[90%] max-w-2xl overflow-hidden">
    <!-- Header -->
    <div class="flex items-center justify-between p-6 border-b border-[#374151]">
      <div class="flex items-center gap-3">
        <div class="bg-[#06B6D4]/10 p-2 rounded-lg">
          <!-- Brain Circuit Icon -->
        </div>
        <h2 class="text-xl font-bold">AI Diagnostics: Motor B Spike</h2>
      </div>
      <button onclick="closeDiagnostic()" class="text-[#9CA3AF] hover:text-[#F3F4F6] text-3xl">&times;</button>
    </div>

    <!-- Body -->
    <div class="p-8 flex flex-col gap-8 max-h-[70vh] overflow-y-auto">
      <!-- Confidence Score -->
      <div class="flex flex-col gap-3">
        <div class="flex justify-between text-sm">
          <span class="text-[#9CA3AF] font-medium">AI Confidence Score</span>
          <span class="text-[#06B6D4] font-bold mono">92%</span>
        </div>
        <div class="h-2 bg-[#374151] rounded-full overflow-hidden">
          <div class="h-full bg-gradient-to-r from-[#3B82F6] to-[#06B6D4] w-[92%]"></div>
        </div>
      </div>

      <!-- Primary Hypothesis -->
      <div>
        <h3 class="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-widest mb-4">Primary Hypothesis</h3>
        <div class="bg-[#EF4444]/5 border-l-4 border-[#EF4444] p-5 rounded-r-xl">
          <h4 class="font-bold text-[#F3F4F6] mb-1">Winding Insulation Failure</h4>
          <p class="text-sm text-[#9CA3AF]">Telemetry patterns suggest partial insulation breakdown in the stator windings.</p>
        </div>
      </div>

      <!-- Alternative Hypotheses -->
      <div>
        <h3 class="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-widest mb-3">Alternative Hypotheses</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div class="bg-[#374151]/30 border border-[#374151] p-4 rounded-xl">
            <span class="text-[10px] text-[#F59E0B] font-bold uppercase mb-1 block">15% Likely</span>
            <h5 class="text-sm font-bold mb-1">Bearing Overheat</h5>
            <p class="text-xs text-[#9CA3AF]">Slight Y-axis vibration increase noted.</p>
          </div>
          <div class="bg-[#374151]/30 border border-[#374151] p-4 rounded-xl">
            <span class="text-[10px] text-[#3B82F6] font-bold uppercase mb-1 block">8% Likely</span>
            <h5 class="text-sm font-bold mb-1">Ambient Air Blockage</h5>
            <p class="text-xs text-[#9CA3AF]">Air intake sensor shows normal flow rate.</p>
          </div>
        </div>
      </div>

      <!-- Recommendations -->
      <div>
        <h3 class="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-widest mb-4">Recommended Remediation</h3>
        <div class="flex flex-col gap-3">
          <div class="flex items-start gap-4">
            <span class="w-6 h-6 flex-shrink-0 bg-[#06B6D4] text-[#111827] rounded-full flex items-center justify-center font-bold text-xs">1</span>
            <p class="text-sm">Shutdown production line 1 immediately for emergency motor inspection.</p>
          </div>
          <div class="flex items-start gap-4">
            <span class="w-6 h-6 flex-shrink-0 bg-[#06B6D4] text-[#111827] rounded-full flex items-center justify-center font-bold text-xs">2</span>
            <p class="text-sm">Perform surge testing and insulation resistance (Megger) check on Motor B.</p>
          </div>
          <div class="flex items-start gap-4">
            <span class="w-6 h-6 flex-shrink-0 bg-[#06B6D4] text-[#111827] rounded-full flex items-center justify-center font-bold text-xs">3</span>
            <p class="text-sm">Prepare replacement Motor (Type M3-X) for rapid swap if test fails.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="p-6 border-t border-[#374151] flex justify-end gap-3 bg-[#1F2937]">
      <button onclick="closeDiagnostic()" class="px-6 py-2.5 rounded-lg border border-[#374151] text-[#F3F4F6] hover:bg-[#374151]">
        Dismiss
      </button>
      <button class="px-6 py-2.5 rounded-lg bg-[#06B6D4] text-[#111827] hover:bg-[#0891b2] font-bold">
        Create Maintenance Task
      </button>
    </div>
  </div>
</div>
```

**JavaScript**:
```javascript
function openDiagnostic() {
  const modal = document.getElementById('diagnostic-modal');
  const content = modal.querySelector('.relative');
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  setTimeout(() => {
    content.classList.remove('scale-95', 'opacity-0');
    content.classList.add('scale-100', 'opacity-100');
  }, 10);
}

function closeDiagnostic() {
  const modal = document.getElementById('diagnostic-modal');
  const content = modal.querySelector('.relative');
  content.classList.remove('scale-100', 'opacity-100');
  content.classList.add('scale-95', 'opacity-0');
  setTimeout(() => {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }, 300);
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeDiagnostic();
});
```

---

### 5. BUTTON COMPONENT

**Purpose**: Consistent, accessible button interactions  
**Used In**: All modals, cards, and action areas

**HTML Variants**:
```html
<!-- Primary Button -->
<button class="px-6 py-2.5 rounded-lg bg-[#06B6D4] text-[#111827] hover:bg-[#0891b2] font-bold transition-all">
  Dispatch Technician
</button>

<!-- Secondary Button -->
<button class="px-6 py-2.5 rounded-lg border border-[#374151] text-[#F3F4F6] hover:bg-[#374151] transition-colors">
  Dismiss
</button>

<!-- Small Button -->
<button class="px-3 py-1.5 rounded text-sm bg-[#374151] hover:bg-[#4b5563]">
  View
</button>

<!-- Disabled State -->
<button disabled class="opacity-50 cursor-not-allowed">
  Processing...
</button>
```

**CSS**:
```css
.btn-primary {
  background-color: #06B6D4;
  color: #111827;
  font-weight: bold;
  padding: 10px 24px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: all 200ms ease-in-out;
}

.btn-primary:hover:not(:disabled) {
  background-color: #0891b2;
  box-shadow: 0 4px 12px rgba(6, 182, 212, 0.3);
}

.btn-primary:active:not(:disabled) {
  transform: scale(0.98);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

---

## 📐 COMPLETE LAYOUT STRUCTURE

### Master Dashboard Layout

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Industrial IoT Console</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.cdnfonts.com/css/cabinet-grotesk" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --status-healthy: #10B981;
      --status-warning: #F59E0B;
      --status-critical: #EF4444;
      --status-maintenance: #3B82F6;
      --bg-primary: #1F2937;
      --bg-surface: #111827;
      --text-primary: #F3F4F6;
      --text-secondary: #9CA3AF;
      --accent: #06B6D4;
      --border: #374151;
    }

    body {
      font-family: 'Cabinet Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background-color: var(--bg-primary);
      color: var(--text-primary);
      margin: 0;
    }

    .mono { font-family: 'JetBrains Mono', monospace; }
  </style>
</head>
<body>
  <div class="flex min-h-screen bg-[#1F2937]">
    <!-- Sidebar (240px fixed) -->
    <aside class="w-[240px] flex-shrink-0 bg-[#111827] border-r border-[#374151] flex flex-col fixed h-screen z-50">
      <!-- Logo -->
      <!-- Navigation -->
    </aside>

    <!-- Main Content -->
    <main class="flex-1 ml-[240px] flex flex-col">
      <!-- Header (70px sticky) -->
      <header class="h-[70px] border-b border-[#374151] bg-[#1F2937]/80 sticky top-0 z-40">
        <!-- Title + Search + Actions -->
      </header>

      <!-- Content Area -->
      <div class="p-8 flex flex-col gap-10">
        <!-- Status Summary Section -->
        <!-- Machine Telemetry Grid -->
        <!-- Alert Feed Section -->
      </div>
    </main>

    <!-- Modal -->
    <div id="diagnostic-modal"><!-- ... --></div>
  </div>
</body>
</html>
```

### Grid Layout Configuration

**Responsive Breakpoints**:
```css
/* Mobile: 320px - 640px */
.grid-mobile { grid-template-columns: 1fr; }

/* Tablet: 641px - 1024px */
.grid-tablet { grid-template-columns: repeat(2, 1fr); }

/* Desktop: 1025px+ */
.grid-desktop { grid-template-columns: repeat(3, 1fr); }

@media (max-width: 1024px) {
  .grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 768px) {
  .grid { grid-template-columns: 1fr; }
  aside { display: none; } /* Hide sidebar on mobile */
  main { margin-left: 0; }
}
```

---

## ✨ ANIMATION LIBRARY

### Core Animations

**1. Page Load Stagger**:
```css
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fadeInUp {
  animation: fadeInUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

/* Apply stagger delay to each item */
.item:nth-child(1) { animation-delay: 0ms; }
.item:nth-child(2) { animation-delay: 100ms; }
.item:nth-child(3) { animation-delay: 200ms; }
/* ... continue pattern */
```

**2. Pulse Effects**:
```css
@keyframes pulse-dot {
  0%, 100% { opacity: 0.6; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.2); }
}

.pulse-dot-regular {
  animation: pulse-dot 2s infinite;
}

.pulse-dot-critical {
  animation: pulse-dot 1s infinite, pulse-critical 1s infinite;
}

@keyframes pulse-critical {
  0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
  50% { box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
}
```

**3. Hover Transitions**:
```css
.card:hover {
  border-color: rgba(6, 182, 212, 0.5);
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
  transition: all 200ms ease-in-out;
}
```

**4. Modal Animation**:
```css
.modal-content {
  transform: scale(0.95) translateY(10px);
  opacity: 0;
  transition: all 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

.modal.show .modal-content {
  transform: scale(1) translateY(0);
  opacity: 1;
}
```

---

## 🎯 IMPLEMENTATION CHECKLIST

For ANY AI tool implementing this design:

- [ ] Import fonts: CabinetGrotesk + JetBrainsMono
- [ ] Define CSS variables for all colors
- [ ] Create base HTML structure with sidebar + main
- [ ] Build status badge component (4 variants)
- [ ] Build telemetry card component (with SVG chart)
- [ ] Build alert card component (3 severity variants)
- [ ] Build diagnostics modal component
- [ ] Build button component (primary, secondary, sizes)
- [ ] Apply responsive grid (1/2/3 columns)
- [ ] Add animations: fadeInUp stagger, pulse, hover
- [ ] Add modal open/close JavaScript
- [ ] Add keyboard event (ESC to close modal)
- [ ] Test color contrast (WCAG AA compliance)
- [ ] Test responsive design (320px, 768px, 1024px)
- [ ] Add custom scrollbar styling
- [ ] Optimize font loading

---

## 📝 DATA INTEGRATION GUIDE

### Real-time Sensor Data

**Expected Data Format**:
```json
{
  "machines": [
    {
      "id": "motor-a",
      "name": "Motor A - Vibration",
      "location": "Production Line 1",
      "status": "healthy",
      "current_value": 4.23,
      "unit": "mm/s",
      "max_24h": 6.18,
      "trend_percent": 0.8,
      "last_updated": "2s ago"
    }
  ],
  "alerts": [
    {
      "id": "alert-001",
      "title": "Motor B - Temperature Critical Spike",
      "description": "Temperature exceeded safe threshold.",
      "severity": "critical",
      "timestamp": "2023-11-20 14:42:01",
      "location": "Line 1, Station 4",
      "diagnostics_available": true
    }
  ],
  "diagnostics": {
    "confidence": 92,
    "primary_hypothesis": "Winding Insulation Failure",
    "alternatives": [
      { "title": "Bearing Overheat", "likelihood": 15 },
      { "title": "Ambient Air Blockage", "likelihood": 8 }
    ],
    "actions": ["Action 1", "Action 2", "Action 3"]
  }
}
```

### Data Binding Pattern

```javascript
// Example: Dynamically populate status badges
const statusData = { healthy: 12, warning: 2, critical: 1, maintenance: 4 };
Object.entries(statusData).forEach(([status, count], index) => {
  const delay = index * 100;
  // Insert HTML with animation-delay
});

// Example: Dynamically populate machine cards
const machines = [...];
machines.forEach((machine, index) => {
  const delay = 400 + (index * 100);
  // Insert machine card with chart data and metrics
});
```

---

## 🔧 INTEGRATION WITH AI TOOLS

### For Claude / ChatGPT

**Prompt Example**:
```
Using the Design.md specification, create an HTML implementation of the Industrial IoT dashboard.
Follow the color palette, typography, component structure, and animations exactly as specified.
Use Tailwind CSS with HTML5 and vanilla JavaScript.
Do NOT use frameworks like React or Vue.
```

### For Codex / API

**Request Format**:
```
endpoint: /codex/generate
body: {
  "design_spec": "Design.md",
  "component": "status-badge",
  "variants": ["healthy", "warning", "critical", "maintenance"],
  "format": "html"
}
```

### For Anthropic / Other AI

**Context Injection**:
```
You have a Design.md file that specifies an Industrial IoT dashboard UI.
The design uses:
- Dark theme (#1F2937 background, #111827 surface)
- CabinetGrotesk + JetBrainsMono typography
- 4 status colors: green, amber, red, blue
- Tailwind CSS for styling
- Vanilla JavaScript for interactivity

Generate implementation for: [COMPONENT_NAME]
```

---

## 🚀 PRODUCTION DEPLOYMENT

### Before Going Live

1. **Performance**:
   - Minimize CSS (remove unused Tailwind utilities)
   - Lazy-load images and charts
   - Enable gzip compression
   - Cache static assets

2. **Accessibility**:
   - Run WCAG contrast checker
   - Add ARIA labels to all interactive elements
   - Test keyboard navigation (Tab, Enter, Escape)
   - Screen reader testing

3. **Cross-browser Testing**:
   - Chrome/Edge (latest)
   - Firefox (latest)
   - Safari (latest)
   - Mobile browsers (iOS Safari, Chrome Mobile)

4. **Security**:
   - Sanitize user input
   - Validate API responses
   - Use CSP headers
   - HTTPS only

---

## 📞 SUPPORT & UPDATES

**Last Updated**: 2024  
**Format**: Markdown + HTML/CSS  
**Status**: Production Ready  
**Compatibility**: All modern browsers, all AI tools

**For Questions**: Refer to component sections above for exact implementation details.

---

## 🎉 SUCCESS CRITERIA

After implementation, the dashboard should:
- ✅ Display 4 status badges with pulse animations
- ✅ Show 3 machine telemetry cards with SVG waveforms
- ✅ Display 2 alert items with action buttons
- ✅ Open/close diagnostics modal with overlay
- ✅ Respond to viewport changes (responsive)
- ✅ Support real-time data updates
- ✅ Meet WCAG AA contrast requirements
- ✅ Work in all modern browsers
- ✅ Load in <2 seconds (optimized)

---

**END OF DESIGN.md**