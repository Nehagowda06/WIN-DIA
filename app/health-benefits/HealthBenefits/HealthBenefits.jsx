'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import './HealthBenefits.css';
import heroImg from './images/healthbenefits-hero.jpeg';
import coconutFlour from './images/coconut.jpg';
import wholeWheat from './images/whole-wheat.jpg';
import sunflowerOil from './images/sunflower-oil.jpg';
import pinkSalt from './images/pink-salt.jpg';
import redChilli from './images/red-chilli.jpg';
import garlic from './images/garlic.jpg';
import curryLeaves from './images/curry-leaf.jpg';
import moringa from './images/moringa.jpg';
import hiwGI from './images/hiw-gi.jpg';
import hiwCholesterol from './images/hiw-cholesterol.jpg';
import hiwProtein from './images/hiw-protein.jpg';
import hiwFiber from './images/hiw-fiber.jpg';


// ─── Data ─────────────────────────────────────────────────────────
// FIX: Removed unused constants: healthGoalTabs, medicinalValues,
//      feelBenefits, and the plain `ingredients` array.
//      Only nutritionData is kept since it's used by NutritionCarousel.

const nutritionData = [
  { label: 'Energy',         value: '516.74', unit: 'kcal', rda: '10.34%', fill: 42, color: '#E86A4A', note: 'Sustained fuel without the crash' },
  { label: 'Protein',        value: '22.13',  unit: 'g',    rda: '17.70%', fill: 72, color: '#2D6A4F', note: 'Builds and repairs muscle tissue' },
  { label: 'Dietary Fiber',  value: '4.84',   unit: 'g',    rda: '—',      fill: 58, color: '#D4A373', note: "Feeds your gut's good bacteria" },
  { label: 'Total Fat',      value: '28.65',  unit: 'g',    rda: '17.10%', fill: 44, color: '#E86A4A', note: 'Healthy fats from coconut' },
  { label: 'Cholesterol',    value: '0.00',   unit: 'mg',   rda: '0%',     fill: 0,  color: '#2D6A4F', note: 'Completely heart-safe — zero detected' },
  { label: 'Potassium',      value: '400.09', unit: 'mg',   rda: '—',      fill: 38, color: '#E86A4A', note: 'Supports heart rhythm' },
  { label: 'Calcium',        value: '94.49',  unit: 'mg',   rda: '6.30%',  fill: 24, color: '#D4A373', note: 'Strengthens bones and teeth' },
  { label: 'Iron',           value: '3.71',   unit: 'mg',   rda: '8.71%',  fill: 32, color: '#E86A4A', note: 'Boosts oxygen transport in blood' },
];

// ─── Hook ─────────────────────────────────────────────────────────
// FIX: Added isMounted guard to prevent setState on unmounted component
function useInView(threshold = 0.2) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (isMounted) setIsVisible(entry.isIntersecting);
      },
      { threshold }
    );
    const el = ref.current;
    if (el) observer.observe(el);
    return () => {
      isMounted = false;
      if (el) observer.unobserve(el);
    };
  }, [threshold]);

  return [ref, isVisible];
}

// ─── Hero ─────────────────────────────────────────────────────────
function HeroSection() {
  return (
    <section
      className="win-hb-hero"
      style={{
        backgroundImage: `url(${heroImg.src})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="win-hb-hero-container">
        <div className="win-hb-hero-text">
          <div className="win-hb-hero-overline">THE SCIENCE OF WELLNESS</div>
          <h1 className="win-hb-hero-title">Why WIN-DIA Thins<br />are Different</h1>
          <div className="win-hb-hero-badges">
            <span className="win-hb-badge">Backed by CFTRI research</span>
            <span className="win-hb-badge">NABL lab tested</span>
            <span className="win-hb-badge">GI certified</span>
          </div>
          <div className="win-hb-hero-actions">
            <Link href="/Recipes" className="win-hb-hero-btn">
              Explore Recipes →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Stats Row ────────────────────────────────────────────────────

// ─── Stats Row ────────────────────────────────────────────────────
const STATS = [
  {
    id: 'gi',
    target: 44,
    decimals: 0,
    suffix: '',
    fill: 0.44,
    label: 'GLYCEMIC INDEX',
    verdict: 'LOW ✓',
    grains: [
      { cx: 34, cy: 70, r: 3, delay: 0.9 },
      { cx: 52, cy: 95, r: 3, delay: 1.05 },
      { cx: 68, cy: 60, r: 2.5, delay: 1.2 },
      { cx: 45, cy: 112, r: 2.5, delay: 1.35 },
    ],
  },
  {
    id: 'fiber',
    target: 4.85,
    decimals: 2,
    suffix: 'g',
    fill: 0.8,
    label: 'DIETARY FIBER / 100G',
    verdict: 'GOOD SOURCE ✓',
    grains: [
      { cx: 30, cy: 50, r: 3, delay: 0.9 },
      { cx: 50, cy: 42, r: 3, delay: 1.0 },
      { cx: 66, cy: 55, r: 2.5, delay: 1.1 },
      { cx: 40, cy: 70, r: 2.5, delay: 1.2 },
      { cx: 58, cy: 80, r: 3, delay: 1.3 },
    ],
  },
  {
    id: 'protein',
    target: 22.13,
    decimals: 2,
    suffix: 'g',
    fill: 0.88,
    label: 'PROTEIN / 100G',
    verdict: 'HIGH ✓',
    grains: [
      { cx: 28, cy: 45, r: 3, delay: 0.9 },
      { cx: 48, cy: 38, r: 3, delay: 1.0 },
      { cx: 64, cy: 48, r: 2.5, delay: 1.1 },
      { cx: 38, cy: 60, r: 2.5, delay: 1.2 },
      { cx: 56, cy: 66, r: 3, delay: 1.3 },
      { cx: 70, cy: 72, r: 2.5, delay: 1.4 },
    ],
  },
  {
    id: 'chol',
    target: 0,
    decimals: 0,
    suffix: 'mg',
    fill: 0,
    label: 'CHOLESTEROL',
    verdict: 'ZERO ✓',
    grains: [],
  },
];

const JAR_PATH =
  'M18 30 L14 118 Q14 124 22 124 L82 124 Q90 124 90 118 L86 30 Z';

function StatJar({ stat, inView }) {
  const clipId = `win-hb-clip-${stat.id}`;
  return (
    <svg className="win-hb-jar" viewBox="0 0 104 128">
      <defs>
        <clipPath id={clipId}>
          <path d={JAR_PATH} />
        </clipPath>
      </defs>
      <rect
        className="win-hb-jar-fill"
        style={{ '--fill': stat.fill }}
        data-inview={inView || undefined}
        clipPath={`url(#${clipId})`}
        x="14"
        y="24"
        width="76"
        height="100"
      />
      <g clipPath={`url(#${clipId})`}>
        {stat.grains.map((g, i) => (
          <circle
            key={i}
            className="win-hb-jar-grain"
            data-inview={inView || undefined}
            cx={g.cx}
            cy={g.cy}
            r={g.r}
            style={{ animationDelay: `${g.delay}s` }}
          />
        ))}
      </g>
      <path className="win-hb-jar-outline" d="M18 30 L14 118 Q14 124 22 124 L82 124 Q90 124 90 118 L86 30" />
      <path className="win-hb-jar-outline" d="M15 30 L89 30" strokeLinecap="round" />
      <path
        className="win-hb-jar-outline"
        d="M22 30 L20 20 Q20 16 24 16 L80 16 Q84 16 84 20 L82 30"
        opacity=".5"
      />
    </svg>
  );
}

function StatsRow() {
  const cardRefs = useRef({});
  const [inView, setInView] = useState({});
  const [counts, setCounts] = useState(() =>
    Object.fromEntries(STATS.map((s) => [s.id, 0]))
  );

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.dataset.id;
            const stat = STATS.find((s) => s.id === id);
            setInView((prev) => ({ ...prev, [id]: true }));
            animateCount(stat);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );

    Object.values(cardRefs.current).forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  function animateCount(stat) {
    const dur = 1400;
    const start = performance.now();

    function tick(now) {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const val = stat.target * eased;
      setCounts((prev) => ({
        ...prev,
        [stat.id]: stat.decimals ? Number(val.toFixed(stat.decimals)) : Math.round(val),
      }));
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  return (
    <section className="win-hb-stats-row">
      <div className="win-hb-stats-eyebrow">Lab Verified</div>
      <h2 className="win-hb-stats-heading">What&apos;s really inside</h2>
      <p className="win-hb-stats-sub">
        Watch each measure fill to its true value — every number backed by independent testing.
      </p>

      <div className="win-hb-stats-grid">
        {STATS.map((stat) => (
          <div
            key={stat.id}
            ref={(el) => (cardRefs.current[stat.id] = el)}
            data-id={stat.id}
            className="win-hb-stat-card"
          >
            <div className="win-hb-jar-wrap">
              <StatJar stat={stat} inView={inView[stat.id]} />
            </div>
            <div className="win-hb-stat-number">
              {counts[stat.id]}
              {stat.suffix}
            </div>
            <div className="win-hb-stat-label">{stat.label}</div>
            <div className="win-hb-stat-verdict">{stat.verdict}</div>
          </div>
        ))}
      </div>

      <p className="win-hb-stats-footer">
        <span className="win-hb-stats-seal">✓</span>
        Based on NABL-certified independent lab testing
      </p>
    </section>
  );
}


// ─── Digestive Wellness ───────────────────────────────────────────
function DigestiveWellness() {
  const [ref, visible] = useInView(0.2);
  return (
    <section className="win-hb-digestive" ref={ref}>
      <div className={`win-hb-digestive-editorial ${visible ? 'win-hb-in-view' : ''}`}>
        <div className="win-hb-digestive-left">
          <span className="win-hb-section-overline">DIGESTIVE WELLNESS</span>
          <div className="win-hb-digestive-pillars">
            {['Regular Bowels', 'Coconut Fiber', 'Better Digestion'].map((p) => (
              // FIX: stable key instead of index
              <div key={p} className="win-hb-pillar">
                <div className="win-hb-pillar-dot" />
                <span>{p}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="win-hb-digestive-right">
          <div className="win-hb-big-quote">"</div>
          <blockquote className="win-hb-quote-text">
            With just one meal of WIN-DIA Coconut Flour Thins, many experience a noticeable improvement
            in bowel movement — leaving you feeling light, relieved, and ready to enjoy your entire day.
          </blockquote>
          <div className="win-hb-quote-source">WIN-DIA Digestive Promise</div>
        </div>
      </div>
    </section>
  );
}

// ─── Glycemic Index ───────────────────────────────────────────────
// FIX: --marker-color was set in JSX but never read in CSS.
//      Applied the color directly via inline style on the pin element.
function GlycemicIndex() {
  const [ref, visible] = useInView(0.2);
  const foods = [
    { name: 'WIN-DIA Khakhra', gi: 44, level: 'LOW',    color: '#2D6A4F' },
    { name: 'Brown Rice',      gi: 68, level: 'MEDIUM',  color: '#D4A373' },
    { name: 'White Bread',     gi: 75, level: 'HIGH',    color: '#E86A4A' },
  ];

  return (
    <section className="win-hb-gi-section" ref={ref}>
      <div className="win-hb-gi-inner">
        <span className="win-hb-section-overline">GLYCEMIC INDEX</span>
        <h2 className="win-hb-section-title">Why GI Matters</h2>
        <p className="win-hb-gi-subtitle">Lower GI = slower sugar release = stable energy all day</p>

        <div className="win-hb-gi-spectrum">
          <div className="win-hb-gi-spectrum-bar">
            <div className="win-hb-gi-zone win-hb-gi-low">LOW<br />&lt;55</div>
            <div className="win-hb-gi-zone win-hb-gi-med">MEDIUM<br />56-69</div>
            <div className="win-hb-gi-zone win-hb-gi-high">HIGH<br />≥70</div>
          </div>
          {foods.map((f) => (
            <div
              key={f.name}
              className={`win-hb-gi-marker ${visible ? 'win-hb-gi-marker--animate' : ''}`}
              style={{
                left:
                  f.gi < 55
                    ? `clamp(8%, ${(f.gi / 55) * 55}%, 92%)`
                    : f.gi < 70
                    ? `clamp(8%, ${55 + ((f.gi - 55) / 15) * 14}%, 92%)`
                    : `clamp(8%, ${69 + ((f.gi - 70) / 30) * 31}%, 92%)`
              }}
            >
              {/* FIX: color applied directly to the pin so it's actually visible */}
              <div className="win-hb-gi-marker-pin" style={{ background: f.color }} />
              <div className="win-hb-gi-marker-label" style={{ borderColor: f.color }}>
                <strong style={{ color: f.color }}>{f.gi}</strong>
                <span>{f.name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Health Goals ─────────────────────────────────────────────────
function HealthGoals() {
  const [activeTab, setActiveTab] = useState(0);

  const goals = [
    { icon: '🩺', label: 'Diabetes Control',    badge: 'GI Score: 44',   points: ['Low GI (44) prevents blood sugar spikes', 'High fiber slows glucose absorption', 'Zero added sugars', '22g protein helps stabilize blood sugar'], rec: '2 khakhras as mid-morning or evening snack' },
    { icon: '⚖️', label: 'Weight Loss',          badge: 'High Satiety',   points: ['4.85g fiber keeps you full longer', 'Moderate 516 cal/100g', 'Healthy fats support metabolism', 'Portion controlled snacking'], rec: 'Replace 1 meal with 3 khakhras + veggies' },
    { icon: '❤️', label: 'Heart Health',          badge: 'Zero Cholesterol', points: ['Zero cholesterol — lab verified', 'Healthy MUFA and PUFA fat profile', 'Potassium 400mg supports blood pressure', 'Low sodium option available'], rec: 'Daily with green tea for best results' },
    { icon: '🌿', label: 'Digestive Health',      badge: '4.85g Fiber',   points: ['Prebiotic fiber feeds good gut bacteria', 'Promotes regular bowel movement', 'Easy digestion and lightness', '4.85g fiber per 100g'], rec: '2 khakhras daily + plenty of water' },
    { icon: '💪', label: 'Fitness & Performance', badge: '22g Protein',   points: ['22g protein per 100g fuels muscle recovery', 'Sustained slow-release energy from low GI', 'Portable and convenient post-workout snack', 'Pairs perfectly with protein spreads'], rec: 'Post-workout with a protein spread' },
  ];

  const g = goals[activeTab];

  return (
    <section className="win-hb-health-goals">
      <div className="win-hb-hg-inner">
        <span className="win-hb-section-overline">HEALTH GOALS</span>
        <h2 className="win-hb-section-title">Designed for Your Goal</h2>

        <div className="win-hb-hg-layout">
          <div className="win-hb-hg-tabs">
            {goals.map((goal, i) => (
              <button
                key={goal.label}  // FIX: stable key
                className={`win-hb-hg-tab ${activeTab === i ? 'win-hb-active' : ''}`}
                onClick={() => setActiveTab(i)}
                // FIX: aria-selected for tab accessibility
                aria-selected={activeTab === i}
                role="tab"
                type="button"
              >
                <span className="win-hb-hg-tab-icon" aria-hidden="true">{goal.icon}</span>
                {goal.label}
              </button>
            ))}
          </div>

          <div className="win-hb-hg-panel" role="tabpanel">
            <div className="win-hb-hg-panel-top">
              <h3 className="win-hb-hg-panel-title">{g.label}</h3>
              <span className="win-hb-hg-panel-badge">{g.badge}</span>
            </div>
            <div className="win-hb-hg-points">
              {g.points.map((p) => (
                // FIX: stable key using point text
                <div key={p} className="win-hb-hg-point">
                  <div className="win-hb-hg-point-dot" />
                  <span>{p}</span>
                </div>
              ))}
            </div>
            <div className="win-hb-hg-rec">
              <span className="win-hb-hg-rec-icon" aria-hidden="true">✦</span>
              <span className="win-hb-hg-rec-text">{g.rec}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Ingredients ──────────────────────────────────────────────────
function Ingredients() {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [focusedIndex, setFocusedIndex] = useState(null); // FIX: keyboard support

  const items = [
    { n: '01', name: 'Coconut Flour',  tag: 'Base',         tint: '#2D6A4F', desc: 'High-fibre, low-carb foundation. Naturally gluten-free and rich in prebiotic fibre that nourishes your gut.', img: coconutFlour },
    { n: '02', name: 'Whole Wheat',    tag: 'Binding Agent', tint: '#D4A373', desc: 'A wholesome protein source that binds every thin — adding density and keeping you fuller for longer.', img: wholeWheat },
    { n: '03', name: 'Sunflower Oil',  tag: 'Healthy Fat',  tint: '#E86A4A', desc: 'Rich in Vitamin E and heart-friendly unsaturated fats. Gives WIN-DIA its signature light, crisp texture.', img: sunflowerOil },
    { n: '04', name: 'Pink Salt',      tag: 'Mineral-Rich', tint: '#5C3D2E', desc: '84 trace minerals in every grain. Supports electrolyte balance the smarter, more natural way.', img: pinkSalt },
    { n: '05', name: 'Red Chilli',     tag: 'Metabolism',   tint: '#C0392B', desc: 'Capsaicin and Vitamin C in every bite. A proven metabolism booster with powerful antioxidant benefits.', img: redChilli },
    { n: '06', name: 'Garlic',         tag: 'Immunity',     tint: '#7A5540', desc: 'Allicin actively reduces inflammation, supports your heart, and strengthens your immune defences daily.', img: garlic },
    { n: '07', name: 'Curry Leaves',   tag: 'Antioxidant',  tint: '#2D6A4F', desc: 'Iron-rich, antioxidant-dense, and a centuries-old digestive aid with proven anti-inflammatory properties.', img: curryLeaves },
    { n: '08', name: 'Moringa',        tag: 'Superfood',    tint: '#2D6A4F', desc: "One of Earth's most nutrient-dense plants — vitamins, minerals, and all essential amino acids in one leaf.", img: moringa },
  ];

  const isOpen = (i) => hoveredIndex === i || focusedIndex === i;

  return (
    <section className="win-hb-ingredients-section">
      <div className="win-hb-ingredients-head">
        <span className="win-hb-section-overline">WHAT GOES INSIDE</span>
        <h2 className="win-hb-section-title">Pure Ingredients. Powerful Benefits.</h2>
        <p className="win-hb-ingredients-sub">Hover or focus each ingredient to discover its role</p>
      </div>

      <div className="win-hb-ig-track">
        {items.map((item, i) => (
          <div
            key={item.n}
            className={`win-hb-ig-card ${isOpen(i) ? 'win-hb-ig-card--open' : ''}`}
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
            // FIX: keyboard accessibility
            onFocus={() => setFocusedIndex(i)}
            onBlur={() => setFocusedIndex(null)}
            tabIndex={0}
            role="button"
            aria-label={`${item.name} — ${item.tag}`}
            aria-expanded={isOpen(i)}
          >
            {/* FIX: use item.img?.src ?? item.img to be safe regardless of import type */}
            <img
              className="win-hb-ig-img"
              src={item.img?.src ?? item.img}
              alt={item.name}
              loading="lazy"
            />
            <div className="win-hb-ig-tint" style={{ background: item.tint }} />

            <div className="win-hb-ig-side">
              <span className="win-hb-ig-num">{item.n}</span>
              <span className="win-hb-ig-vname">{item.name}</span>
            </div>

            <div className="win-hb-ig-content">
              <span className="win-hb-ig-tag">{item.tag}</span>
              <div className="win-hb-ig-hname">{item.name}</div>
              <p className="win-hb-ig-desc">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="win-hb-ig-foot">✦ NABL lab-tested &nbsp;·&nbsp; CFTRI research-backed &nbsp;·&nbsp; GI certified</p>
    </section>
  );
}
//Nutrition carousel
// ─── Nutrition Garden ─────────────────────────────────────────────
function NutritionGarden() {
  const [active, setActive] = useState(0);
  const [bumped, setBumped] = useState(null);

  const VIEW_W = 600;
  const GROUND_Y = 260;
  const MAX_H = 170;
  const spacing = VIEW_W / (nutritionData.length + 1);

  const handleActivate = (i) => setActive(i);
  const handleClick = (i) => {
    setActive(i);
    setBumped(i);
    setTimeout(() => setBumped(null), 260);
  };

  const item = nutritionData[active];

  return (
    <section className="win-hb-garden-section">
      <div className="win-hb-garden-container">
        <span className="win-hb-section-overline">NUTRITION FACTS · PER 100G</span>
        <h2 className="win-hb-section-title">What is Inside Every Bite</h2>
        <p className="win-hb-carousel-subtitle">NABL lab verified · CFTRI research backed</p>

        <svg
          className="win-hb-garden-svg"
          viewBox={`0 0 ${VIEW_W} 300`}
          role="img"
          aria-label="Garden showing daily value percentages for each nutrient"
        >
          <path
            d={`M0,${GROUND_Y - 5} Q${VIEW_W / 2},${GROUND_Y + 10} ${VIEW_W},${GROUND_Y - 5} L${VIEW_W},300 L0,300 Z`}
            fill="var(--orange-lt)"
          />
          {nutritionData.map((d, i) => {
            const h = 26 + (MAX_H * Math.min(d.fill, 100)) / 100;
            const x = spacing * (i + 1);
            const topY = GROUND_Y - h;
            const midY = GROUND_Y - h * 0.5;
            const delay = `${i * 0.3}s`;
            return (
              <g
                key={d.label}
                className="win-hb-plant-sway"
                style={{ transformOrigin: `${x}px ${GROUND_Y}px`, animationDelay: delay }}
              >
                <g
                  className={`win-hb-plant-grow${bumped === i ? ' win-hb-plant-bump' : ''}`}
                  style={{
                    animationDelay: bumped === i ? '0s' : delay,
                    transformOrigin: `${x}px ${GROUND_Y}px`,
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`${d.label}, ${d.fill} percent daily value`}
                  onMouseEnter={() => handleActivate(i)}
                  onFocus={() => handleActivate(i)}
                  onClick={() => handleClick(i)}
                >
                  <path
                    d={`M${x},${GROUND_Y} Q${x - 8},${midY} ${x},${topY}`}
                    stroke="var(--color-green)"
                    strokeWidth="4"
                    fill="none"
                    strokeLinecap="round"
                  />
                  {[0.35, 0.6].map((f, li) => {
                    const ly = GROUND_Y - h * f;
                    const lx = li % 2 === 0 ? x - 12 : x + 12;
                    const rot = li % 2 === 0 ? -25 : 25;
                    return (
                      <ellipse
                        key={li}
                        cx={lx}
                        cy={ly}
                        rx="11"
                        ry="6"
                        fill="var(--color-green)"
                        opacity="0.75"
                        transform={`rotate(${rot} ${lx} ${ly})`}
                      />
                    );
                  })}
                  <g className="win-hb-bud-bob" style={{ animationDelay: delay }}>
                    <circle cx={x} cy={topY - 5} r="11" fill={d.color} />
                  </g>
                  <text
                    x={x}
                    y={topY - 22}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="600"
                    className="win-hb-plant-pct"
                  >
                    {d.fill}%
                  </text>
                </g>
              </g>
            );
          })}
        </svg>

        <div className="win-hb-garden-labels">
          {nutritionData.map((d, i) => (
            <button
              key={d.label}
              className={`win-hb-garden-label ${i === active ? 'win-hb-garden-label--active' : ''}`}
              onClick={() => handleClick(i)}
              style={{ color: i === active ? d.color : undefined }}
            >
              {d.label}
            </button>
          ))}
        </div>

        <p className="win-hb-garden-detail">
          {item.label} — {item.value} {item.unit}
          {item.rda !== '—' && ` (${item.rda} RDA)`}
          <span className="win-hb-garden-note"> · {item.note}</span>
        </p>
      </div>
    </section>
  );
}

//---- comparison table----//


const rows = [
  {
    category: 'Blood sugar & energy',
    highlight: true,
    metrics: [
      {
        name: 'Glycaemic index',
        desc: 'Lower = steadier energy',
        rice:  { icon: 'bad',  text: '~73 — High GI' },
        other: { icon: 'bad',  text: '~65–80 — High GI' },
        win:   { icon: 'win',  text: '44 — Certified low GI' },
      },
      {
        name: 'Energy release',
        desc: 'Sustained vs spike & crash',
        rice:  { icon: 'bad',  text: 'Rapid spike' },
        other: { icon: 'bad',  text: 'Rapid spike' },
        win:   { icon: 'win',  text: 'Slow & sustained' },
      },
    ],
  },
  {
    category: 'Nutrition',
    highlight: true,
    metrics: [
      {
        name: 'Protein',
        desc: 'Per 100g',
        rice:  { icon: 'ok',   text: '~2.7 g — Very low' },
        other: { icon: 'ok',   text: '~5–8 g — Low' },
        win:   { icon: 'win',  text: '22 g — 8× more' },
      },
      {
        name: 'Dietary fibre',
        desc: 'Gut health & fullness',
        rice:  { icon: 'bad',  text: '~0.4 g — Negligible' },
        other: { icon: 'ok',   text: '~1–2 g — Low' },
        win:   { icon: 'win',  text: '4.85 g — 12× more' },
      },
      {
        name: 'Cholesterol',
        desc: 'Heart health',
        rice:  { icon: 'good', text: '0 mg — Zero' },
        other: { icon: 'bad',  text: 'Often present' },
        win:   { icon: 'win',  text: '0 mg — Zero' },
      },
      {
        name: 'Superfoods',
        desc: 'Moringa, curry leaf, etc.',
        rice:  { icon: 'bad',  text: 'None' },
        other: { icon: 'bad',  text: 'None' },
        win:   { icon: 'win',  text: 'Yes — 4 superfoods' },
      },
    ],
  },
  {
    category: 'Ingredients & testing',
    highlight: false,
    metrics: [
      {
        name: 'Artificial additives',
        desc: 'Preservatives, colours',
        rice:  { icon: 'good', text: 'None — natural' },
        other: { icon: 'bad',  text: 'Commonly added' },
        win:   { icon: 'win',  text: 'None — clean label' },
      },
      {
        name: 'Independent lab test',
        desc: 'NABL / CFTRI certified',
        rice:  { icon: 'bad',  text: 'Not applicable' },
        other: { icon: 'ok',   text: 'Self-declared' },
        win:   { icon: 'win',  text: 'NABL + CFTRI verified' },
      },
    ],
  },
];

const IconEl = ({ type }) => {
  const map = { good: '✓', ok: '–', bad: '✕', win: '✓' };
  return <span className={`win-ct-icon win-ct-icon--${type}`}>{map[type]}</span>;
};

const Cell = ({ data, isWin = false }) => (
  <div className={`win-ct-cell ${isWin ? 'win-ct-cell--win' : ''}`}>
    <IconEl type={data.icon} />
    <span className={`win-ct-val win-ct-val--${data.icon}`}>{data.text}</span>
  </div>
);

const HighlightSection = ({ group }) => {
  const themeClass = group.category === 'Blood sugar & energy'
    ? 'win-ct-hl--bs'
    : 'win-ct-hl--nu';
  return (
    <div className={`win-ct-hl-card ${themeClass}`}>
      <div className="win-ct-hl-head">
        <div className="win-ct-hl-dot" />
        <span className="win-ct-hl-title">{group.category}</span>
        <span className="win-ct-hl-badge">Key metric</span>
      </div>
      {/* Desktop col labels */}
      <div className="win-ct-col-labels win-ct-desktop-only">
        <div className="win-ct-col-label-empty" />
        <div className="win-ct-col-label-item">Plain rice</div>
        <div className="win-ct-col-label-item win-ct-col-label-item--win">Win Thins</div>
        <div className="win-ct-col-label-item">Other biscuits</div>
      </div>
      <div className="win-ct-hl-body">
        {group.metrics.map((metric) => (
          <div key={metric.name} className="win-ct-metric-row">
            <div className="win-ct-metric-label">
              <span className="win-ct-metric-name">{metric.name}</span>
              <span className="win-ct-metric-desc">{metric.desc}</span>
            </div>
            <div className="win-ct-cells-grid">
              {/* Mobile col headers */}
              <div className="win-ct-mobile-col-label">Plain rice</div>
              <div className="win-ct-mobile-col-label win-ct-mobile-col-label--win">Win Thins</div>
              <div className="win-ct-mobile-col-label">Other</div>
              <Cell data={metric.rice} />
              <Cell data={metric.win} isWin />
              <Cell data={metric.other} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const PlainSection = ({ group }) => (
  <div className="win-ct-plain-section">
    <div className="win-ct-plain-section-label">{group.category}</div>
    {/* Desktop col labels */}
    <div className="win-ct-col-labels win-ct-col-labels--plain win-ct-desktop-only">
      <div className="win-ct-col-label-empty" />
      <div className="win-ct-col-label-plain">Plain rice</div>
      <div className="win-ct-col-label-plain win-ct-col-label-plain--win">Win Thins</div>
      <div className="win-ct-col-label-plain">Other biscuits</div>
    </div>
    {group.metrics.map((metric) => (
      <div key={metric.name} className="win-ct-plain-row">
        <div className="win-ct-metric-label">
          <span className="win-ct-metric-name">{metric.name}</span>
          <span className="win-ct-metric-desc">{metric.desc}</span>
        </div>
        <div className="win-ct-cells-grid">
          <div className="win-ct-mobile-col-label">Plain rice</div>
          <div className="win-ct-mobile-col-label win-ct-mobile-col-label--win">Win Thins</div>
          <div className="win-ct-mobile-col-label">Other</div>
          <Cell data={metric.rice} />
          <Cell data={metric.win} isWin />
          <Cell data={metric.other} />
        </div>
      </div>
    ))}
  </div>
);

function ComparisonTable() {
  const totalMetrics = rows.reduce((acc, r) => acc + r.metrics.length, 0);

  return (
    <section className="win-ct-section">
      <div className="win-ct-container">

        <div className="win-ct-header">
          <span className="win-ct-overline">Why Win wins</span>
          <h2 className="win-ct-heading">Your everyday rice vs our Thins</h2>
          <p className="win-ct-sub">Per 100g · independently lab tested · cooked rice vs Win Thins</p>
        </div>

        {/* Desktop product headers */}
        <div className="win-ct-prod-header win-ct-desktop-only">
          <div className="win-ct-prod-header-empty" />
          <div className="win-ct-prod-card">
            <span className="win-ct-prod-icon">🍚</span>
            <span className="win-ct-prod-eye">Everyday staple</span>
            <span className="win-ct-prod-name">Plain rice</span>
          </div>
          <div className="win-ct-prod-card win-ct-prod-card--win">
            <span className="win-ct-prod-icon">🌿</span>
            <span className="win-ct-prod-eye win-ct-prod-eye--win">Our product</span>
            <span className="win-ct-prod-name win-ct-prod-name--win">Win Thins</span>
            <span className="win-ct-prod-badge">✦ Best choice</span>
          </div>
          <div className="win-ct-prod-card">
            <span className="win-ct-prod-icon">🍟</span>
            <span className="win-ct-prod-eye">Packaged snack</span>
            <span className="win-ct-prod-name">Other snacks</span>
          </div>
        </div>

        {/* Mobile product strip */}
        <div className="win-ct-mobile-prod-strip win-ct-mobile-only">
          <div className="win-ct-mobile-prod"><span>🍚</span><span>Plain rice</span></div>
          <div className="win-ct-mobile-prod win-ct-mobile-prod--win">
            <span>🌿</span><span>Win Thins</span>
            <span className="win-ct-prod-badge">Best choice</span>
          </div>
          <div className="win-ct-mobile-prod"><span>🍟</span><span>Other snacks</span></div>
        </div>

        {rows.map((group) =>
          group.highlight
            ? <HighlightSection key={group.category} group={group} />
            : <PlainSection key={group.category} group={group} />
        )}

        {/* Score row */}
        <div className="win-ct-score-row">
          <div className="win-ct-score-pill">
            <span className="win-ct-score-num">3/{totalMetrics}</span>
            <span className="win-ct-score-lbl">passes</span>
          </div>
          <div className="win-ct-score-pill win-ct-score-pill--win">
            <span className="win-ct-score-num">{totalMetrics}/{totalMetrics}</span>
            <span className="win-ct-score-lbl">passes</span>
          </div>
          <div className="win-ct-score-pill">
            <span className="win-ct-score-num">1/{totalMetrics}</span>
            <span className="win-ct-score-lbl">passes</span>
          </div>
        </div>

        <p className="win-ct-footnote">
          Plain rice values based on cooked white rice per 100g · USDA nutritional database
        </p>

      </div>
    </section>
  );
}


// ─── Marquee CTA ─────────────────────────────────────────────────
function MarqueeCTA() {
  return (
    <div className="win-hb-marquee-container">
      <div className="win-hb-marquee">
        <div className="win-hb-marquee-content">
          Not Just a Label. A Real Difference. WIN-DIA exists because snacking should work with your body — not against it. Every batch tested. Every claim verified.
          <span className="win-hb-marquee-spacer" aria-hidden="true">✦</span>
          Not Just a Label. A Real Difference. WIN-DIA exists because snacking should work with your body — not against it. Every batch tested. Every claim verified.
          <span className="win-hb-marquee-spacer" aria-hidden="true">✦</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────
export default function HealthBenefits() {
  return (
    <div className="win-hb-app">
      <HeroSection />
      <StatsRow />
      <DigestiveWellness />
      <GlycemicIndex />
      <HealthGoals />
      <Ingredients />
      <NutritionGarden />
      <ComparisonTable />
      <MarqueeCTA />
    </div>
  );
}
