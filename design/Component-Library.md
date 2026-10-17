# COMPONENT LIBRARY - Copy-Paste Ready Code
## For Any AI Tool (Claude, ChatGPT, Codex, etc.)

---

## STATUS BADGE - Complete Component

**Copy this entire section for implementation:**

```html
<!-- Status Badges Container -->
<section class="flex flex-col gap-6">
  <div class="flex items-center justify-between">
    <h3 class="text-lg font-semibold">System Status</h3>
    <span class="text-xs text-[#9CA3AF]">Live updating every 5s</span>
  </div>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    <!-- Status Badge: Healthy -->
    <div class="animate-fadeInUp bg-[#111827] border border-[#10B981]/30 p-4 rounded-xl flex items-center justify-between hover:scale-[1.02] transition-transform cursor-pointer" style="animation-delay: 0ms">
      <div class="flex items-center gap-3">
        <span class="w-3 h-3 rounded-full bg-[#10B981] pulse-dot-regular"></span>
        <span class="font-medium text-sm">Healthy</span>
      </div>
      <span class="text-lg font-bold mono text-[#10B981]">12</span>
    </div>
    <!-- Status Badge: Warning -->
    <div class="animate-fadeInUp bg-[#111827] border border-[#F59E0B]/30 p-4 rounded-xl flex items-center justify-between hover:scale-[1.02] transition-transform cursor-pointer" style="animation-delay: 100ms">
      <div class="flex items-center gap-3">
        <span class="w-3 h-3 rounded-full bg-[#F59E0B] pulse-dot-regular"></span>
        <span class="font-medium text-sm">Warning</span>
      </div>
      <span class="text-lg font-bold mono text-[#F59E0B]">02</span>
    </div>
    <!-- Status Badge: Critical -->
    <div class="animate-fadeInUp bg-[#111827] border border-[#EF4444]/30 p-4 rounded-xl flex items-center justify-between hover:scale-[1.02] transition-transform cursor-pointer" style="animation-delay: 200ms">
      <div class="flex items-center gap-3">
        <span class="w-3 h-3 rounded-full bg-[#EF4444] pulse-dot-critical"></span>
        <span class="font-medium text-sm">Critical</span>
      </div>
      <span class="text-lg font-bold mono text-[#EF4444]">01</span>
    </div>
    <!-- Status Badge: Maintenance -->
    <div class="animate-fadeInUp bg-[#111827] border border-[#3B82F6]/30 p-4 rounded-xl flex items-center justify-between hover:scale-[1.02] transition-transform cursor-pointer" style="animation-delay: 300ms">
      <div class="flex items-center gap-3">
        <span class="w-3 h-3 rounded-full bg-[#3B82F6] pulse-dot-regular"></span>
        <span class="font-medium text-sm">Maintenance</span>
      </div>
      <span class="text-lg font-bold mono text-[#3B82F6]">04</span>
    </div>
  </div>
</section>
```

**CSS Required:**
```css
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fadeInUp {
  animation: fadeInUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

@keyframes pulse-dot {
  0%, 100% { opacity: 0.6; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.2); }
}

.pulse-dot-regular {
  animation: pulse-dot 2s infinite;
}

@keyframes pulse-critical {
  0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
  50% { box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
}

.pulse-dot-critical {
  animation: pulse-dot 1s infinite, pulse-critical 1s infinite;
}
```

---

## TELEMETRY CARD - Complete Component

```html
<!-- Machine Card 1: Healthy -->
<div class="animate-fadeInUp bg-[#111827] border border-[#374151] rounded-xl p-5 flex flex-col gap-6 hover:border-[#06B6D4]/50 transition-colors group" style="animation-delay: 400ms">
  <div class="flex items-center justify-between">
    <div>
      <h4 class="font-bold text-[#F3F4F6]">Motor A - Vibration</h4>
      <p class="text-[10px] text-[#9CA3AF] uppercase tracking-wider mt-0.5">Production Line 1</p>
    </div>
    <span class="w-2.5 h-2.5 rounded-full bg-[#10B981] shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
  </div>
  <div class="h-20">
    <svg viewBox="0 0 300 80" class="w-full h-full">
      <path d="M0,40 Q15,10 30,50 T60,30 T90,40 T120,60 T150,20 T180,45 T210,35 T240,55 T270,30 L300,40" fill="none" stroke="#10B981" stroke-width="2" />
      <rect width="300" height="80" fill="rgba(16,185,129,0.05)" />
    </svg>
  </div>
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
  <div class="flex items-center justify-between text-[11px] text-[#9CA3AF]">
    <span>Last updated: 2s ago</span>
    <button class="text-[#06B6D4] hover:underline font-semibold">Full Data</button>
  </div>
</div>

<!-- Machine Card 2: Critical -->
<div class="animate-fadeInUp bg-[#111827] border-2 border-[#EF4444]/50 rounded-xl p-5 flex flex-col gap-6 hover:border-[#EF4444] transition-colors relative overflow-hidden" style="animation-delay: 500ms">
  <div class="absolute top-0 right-0 bg-[#EF4444]/10 px-3 py-1 rounded-bl-lg border-b border-l border-[#EF4444]/30">
    <span class="text-[10px] font-bold text-[#EF4444] uppercase tracking-tighter">Priority 1</span>
  </div>
  <div class="flex items-center justify-between">
    <div>
      <h4 class="font-bold text-[#F3F4F6]">Motor B - Temperature</h4>
      <p class="text-[10px] text-[#9CA3AF] uppercase tracking-wider mt-0.5">Production Line 1</p>
    </div>
    <span class="w-2.5 h-2.5 rounded-full bg-[#EF4444] pulse-dot-critical"></span>
  </div>
  <div class="h-20">
    <svg viewBox="0 0 300 80" class="w-full h-full">
      <path d="M0,50 Q10,70 20,40 T40,60 T60,30 T80,80 T100,20 T120,60 T140,10 T160,70 T180,40 T200,60 T220,10 T240,80 T260,30 T280,50 L300,45" fill="none" stroke="#EF4444" stroke-width="2" />
      <rect width="300" height="80" fill="rgba(239,68,68,0.05)" />
    </svg>
  </div>
  <div class="grid grid-cols-3 gap-2 border-y border-[#374151] py-4">
    <div class="flex flex-col gap-1">
      <span class="text-[10px] text-[#9CA3AF] uppercase">Current</span>
      <span class="text-sm font-semibold mono text-[#EF4444]">82.5°C</span>
    </div>
    <div class="flex flex-col gap-1">
      <span class="text-[10px] text-[#9CA3AF] uppercase">Max 24h</span>
      <span class="text-sm font-semibold mono text-[#F3F4F6]">84.1°C</span>
    </div>
    <div class="flex flex-col gap-1">
      <span class="text-[10px] text-[#9CA3AF] uppercase">Trend</span>
      <span class="text-sm font-semibold text-[#EF4444] flex items-center gap-1">↑ 12.4%</span>
    </div>
  </div>
  <div class="flex items-center justify-between text-[11px] text-[#9CA3AF]">
    <span>Alert active for: 4m 21s</span>
    <button onclick="openDiagnostic()" class="text-[#EF4444] hover:underline font-bold bg-[#EF4444]/10 px-2 py-0.5 rounded">Diagnostics</button>
  </div>
</div>
```

---

## ALERT CARD - Complete Component

```html
<!-- Critical Alert -->
<div class="bg-[#111827] border-l-4 border-[#EF4444] rounded-r-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:bg-[#111827]/80 transition-colors animate-fadeInUp" style="animation-delay: 700ms">
  <div class="flex items-start gap-4 flex-1">
    <div class="bg-[#EF4444]/20 p-2.5 rounded-lg flex items-center justify-center">
      <svg class="w-6 h-6 text-[#EF4444]" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
      </svg>
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
  <div class="flex items-center gap-3 w-full md:w-auto">
    <button onclick="openDiagnostic()" class="flex-1 md:flex-none bg-[#374151] hover:bg-[#4b5563] text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors">
      Investigate
    </button>
    <button class="flex-1 md:flex-none bg-[#06B6D4] hover:bg-[#0891b2] text-[#111827] px-5 py-2.5 rounded-lg text-sm font-bold transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)]">
      Dispatch Technician
    </button>
  </div>
</div>

<!-- Warning Alert -->
<div class="bg-[#111827] border-l-4 border-[#F59E0B] rounded-r-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:bg-[#111827]/80 transition-colors animate-fadeInUp" style="animation-delay: 800ms">
  <div class="flex items-start gap-4 flex-1">
    <div class="bg-[#F59E0B]/20 p-2.5 rounded-lg flex items-center justify-center">
      <svg class="w-6 h-6 text-[#F59E0B]" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
      </svg>
    </div>
    <div class="flex flex-col gap-1.5">
      <div class="flex items-center gap-3">
        <h4 class="font-bold">Conveyor Belt X - Friction Increase</h4>
        <span class="bg-[#F59E0B] text-[10px] font-bold text-white px-2 py-0.5 rounded uppercase">Warning</span>
      </div>
      <p class="text-sm text-[#9CA3AF]">Increased current draw detected on the main conveyor belt. Possible belt misalignment or pulley friction.</p>
      <span class="text-[11px] text-[#9CA3AF] mono italic">Timestamp: 2023-11-20 14:15:32 • Loading Bay B</span>
    </div>
  </div>
  <div class="flex items-center gap-3 w-full md:w-auto">
    <button class="flex-1 md:flex-none bg-[#374151] hover:bg-[#4b5563] text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors">
      Dismiss
    </button>
    <button class="flex-1 md:flex-none border border-[#F59E0B] text-[#F59E0B] hover:bg-[#F59E0B]/10 px-5 py-2.5 rounded-lg text-sm font-bold transition-all">
      Schedule Maintenance
    </button>
  </div>
</div>
```

---

## DIAGNOSTICS MODAL - Complete Component

```html
<div id="diagnostic-modal" class="fixed inset-0 z-[100] hidden items-center justify-center">
  <div id="modal-overlay" onclick="closeDiagnostic()" class="absolute inset-0 bg-black/60 backdrop-blur-sm transition-all duration-300"></div>
  <div class="relative bg-[#111827] border border-[#374151] rounded-2xl w-[90%] max-w-2xl overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] transform transition-all scale-95 opacity-0 duration-300">
    <div class="flex items-center justify-between p-6 border-b border-[#374151] bg-[#111827]">
      <div class="flex items-center gap-3">
        <div class="bg-[#06B6D4]/10 p-2 rounded-lg">
          <svg class="w-5 h-5 text-[#06B6D4]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </div>
        <h2 class="text-xl font-bold">AI Diagnostics: Motor B Spike</h2>
      </div>
      <button onclick="closeDiagnostic()" class="text-[#9CA3AF] hover:text-[#F3F4F6] text-3xl font-light leading-none">&times;</button>
    </div>

    <div class="p-8 flex flex-col gap-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
      <div class="flex flex-col gap-3">
        <div class="flex justify-between text-sm">
          <span class="text-[#9CA3AF] font-medium">AI Confidence Score</span>
          <span class="text-[#06B6D4] font-bold mono">92%</span>
        </div>
        <div class="h-2 bg-[#374151] rounded-full overflow-hidden">
          <div class="h-full bg-gradient-to-r from-[#3B82F6] to-[#06B6D4] rounded-full w-[92%] transition-all duration-1000 ease-out"></div>
        </div>
      </div>

      <div class="flex flex-col gap-4">
        <h3 class="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-widest">Primary Hypothesis</h3>
        <div class="bg-[#EF4444]/5 border-l-4 border-[#EF4444] p-5 rounded-r-xl">
          <h4 class="font-bold text-[#F3F4F6] mb-1">Winding Insulation Failure</h4>
          <p class="text-sm text-[#9CA3AF] leading-relaxed">
            Telemetry patterns suggest partial insulation breakdown in the stator windings. High frequency current noise detected matches known degradation signatures for Class F insulation at 3000 RPM.
          </p>
        </div>

        <h3 class="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-widest mt-2">Alternative Hypotheses</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div class="bg-[#374151]/30 border border-[#374151] p-4 rounded-xl">
            <span class="text-[10px] text-[#F59E0B] font-bold uppercase mb-1 block">15% Likely</span>
            <h5 class="text-sm font-bold mb-1">Bearing Overheat</h5>
            <p class="text-xs text-[#9CA3AF]">Slight Y-axis vibration increase noted, but temperature distribution favors core fault.</p>
          </div>
          <div class="bg-[#374151]/30 border border-[#374151] p-4 rounded-xl">
            <span class="text-[10px] text-[#3B82F6] font-bold uppercase mb-1 block">8% Likely</span>
            <h5 class="text-sm font-bold mb-1">Ambient Air Blockage</h5>
            <p class="text-xs text-[#9CA3AF]">Air intake sensor shows normal flow rate; cooling fins checked via visual AI (OK).</p>
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-4">
        <h3 class="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-widest">Recommended Remediation</h3>
        <div class="flex flex-col gap-3">
          <div class="flex items-start gap-4">
            <span class="w-6 h-6 flex-shrink-0 bg-[#06B6D4] text-[#111827] rounded-full flex items-center justify-center font-bold text-xs mt-0.5">1</span>
            <p class="text-sm">Shutdown production line 1 immediately for emergency motor inspection.</p>
          </div>
          <div class="flex items-start gap-4">
            <span class="w-6 h-6 flex-shrink-0 bg-[#06B6D4] text-[#111827] rounded-full flex items-center justify-center font-bold text-xs mt-0.5">2</span>
            <p class="text-sm">Perform surge testing and insulation resistance (Megger) check on Motor B.</p>
          </div>
          <div class="flex items-start gap-4">
            <span class="w-6 h-6 flex-shrink-0 bg-[#06B6D4] text-[#111827] rounded-full flex items-center justify-center font-bold text-xs mt-0.5">3</span>
            <p class="text-sm">Prepare replacement Motor (Type M3-X) for rapid swap if test fails.</p>
          </div>
        </div>
      </div>
    </div>

    <div class="p-6 border-t border-[#374151] flex justify-end gap-3 bg-[#1F2937]">
      <button onclick="closeDiagnostic()" class="px-6 py-2.5 rounded-lg border border-[#374151] text-[#F3F4F6] hover:bg-[#374151] transition-colors text-sm font-semibold">
        Dismiss
      </button>
      <button class="px-6 py-2.5 rounded-lg bg-[#06B6D4] text-[#111827] hover:bg-[#0891b2] font-bold transition-all text-sm">
        Create Maintenance Task
      </button>
    </div>
  </div>
</div>
```

**JavaScript Required:**
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

## CUSTOM SCROLLBAR - CSS

```css
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: var(--bg-surface);
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 3px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: var(--text-secondary);
}
```

---

## SIDEBAR NAVIGATION - Complete Component

```html
<aside class="w-[240px] flex-shrink-0 bg-[#111827] border-r border-[#374151] flex flex-col fixed h-screen z-50">
  <div class="p-6 border-b border-[#374151]">
    <h1 class="text-2xl font-bold tracking-tight text-[#06B6D4] flex items-center gap-2">
      🏭
      IoT CONSOLE
    </h1>
  </div>
  <nav class="flex-1 p-4 flex flex-col gap-2 overflow-y-auto custom-scrollbar">
    <a href="#" class="sidebar-link-active flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all hover:bg-[#374151]">
      📊 Dashboard
    </a>
    <a href="#" class="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold text-[#9CA3AF] transition-all hover:bg-[#374151] hover:text-[#F3F4F6]">
      🔔 Alerts
      <span class="ml-auto bg-[#EF4444] text-white text-[10px] px-1.5 py-0.5 rounded-full">3</span>
    </a>
    <a href="#" class="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold text-[#9CA3AF] transition-all hover:bg-[#374151] hover:text-[#F3F4F6]">
      ⚙️ Machines
    </a>
    <a href="#" class="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold text-[#9CA3AF] transition-all hover:bg-[#374151] hover:text-[#F3F4F6]">
      📋 Reports
    </a>
    <a href="#" class="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold text-[#9CA3AF] mt-auto transition-all hover:bg-[#374151] hover:text-[#F3F4F6]">
      ⚙️ Settings
    </a>
  </nav>
</aside>
```

**CSS for Active Link:**
```css
.sidebar-link-active {
  background-color: rgba(6, 182, 212, 0.1);
  border-left: 3px solid var(--accent);
  color: var(--accent);
  padding-left: calc(16px - 3px);
}
```

---

END OF COMPONENT LIBRARY