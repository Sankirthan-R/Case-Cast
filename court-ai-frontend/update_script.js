const fs = require('fs');
let data = fs.readFileSync('src/pages/MainPortal.jsx', 'utf8');

// 1. Add AnimatedCount
const animatedCountStr = `const AnimatedCount = ({ value, duration = 1.5 }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0; const end = parseFloat(value); if (isNaN(end)) return;
    const stepTime = Math.abs(Math.floor((duration * 1000) / 60));
    let current = start; const increment = end / 60;
    const timer = setInterval(() => {
      current += increment;
      if (current >= end) { setCount(end); clearInterval(timer); } else { setCount(current); }
    }, stepTime);
    return () => clearInterval(timer);
  }, [value, duration]);
  return <>{count.toFixed(1)}</>;
};

  useEffect(() => {
    if (showModelOverlay) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; }
  }, [showModelOverlay]);

  const CircularGauge`;

data = data.replace('const CircularGauge', animatedCountStr);

// 2. Replace static % with Animated %
data = data.replace(/\{value\}%/g, '<AnimatedCount value={value} />%');
data = data.replace(/\{details\.accuracy\}%/g, '<AnimatedCount value={details.accuracy} />%');
data = data.replace(/\{details\.f1\}%/g, '<AnimatedCount value={details.f1} />%');
data = data.replace(/\{details\.precision\}%/g, '<AnimatedCount value={details.precision} />%');
data = data.replace(/\{details\.recall\}%/g, '<AnimatedCount value={details.recall} />%');

// 3. Update Supabase Database Catch error toast
data = data.replace(/catch\s*\(e\)\s*\{\}/g, 'catch(e) { console.error("DB Save Failed", e); setFormError("Failed to store prediction locally or in database."); }');

// 4. Remove Animate presence from More Info so it is instant
data = data.replace(/<AnimatePresence>([\s\S]*?)<motion\.div initial=\{\{ height: 0, opacity: 0 \}\}([\s\S]*?)className=\"overflow-hidden\">/g, '<div className="overflow-hidden">');
data = data.replace(/<\/motion\.div>([\s\S]*?)<\/AnimatePresence>/g, '</div>');

fs.writeFileSync('src/pages/MainPortal.jsx', data);
console.log('Update Success');
