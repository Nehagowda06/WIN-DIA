'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import windialogo from './windia-logo.png'
import qrCode from './qrCode.jpeg'

/* ── Announcement messages ── */
const annMessages = [
  'Free shipping on orders above ₹499',
  '100% natural · No preservatives · No additives',
  'Handcrafted Thins — The Divine Healthy Crunch',
  'Use the code <highlight>WINDIA10</highlight> to get 10% off on your first order',
]

function renderAnnMessage(msg) {
  const parts = msg.split(/(<highlight>.*?<\/highlight>)/g)
  return parts.map((part, i) => {
    if (part.startsWith('<highlight>')) {
      const text = part.replace(/<\/?highlight>/g, '')
      return <span key={i} className="ann-highlight">{text}</span>
    }
    return part
  })
}

/* ── Nav links ── */
const navLinks = [
  { href: '/',        label: 'Home'           },
  { href: '/shop',    label: 'Shop'           },
  { href: '/story',   label: 'Our Story'      },
  { href: '/science', label: 'Health Benefits'},
  { href: '/contact', label: 'Contact'        },
]

const bottomNavItems = [
  {
    href: '/', label: 'Home',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  },
  {
    href: '/shop', label: 'Shop',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
  },
  {
    href: '/story', label: 'Story',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"/><path d="M12 8v4l3 3"/></svg>,
  },
  {
    href: '/science', label: 'Health',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2v-4M9 21H5a2 2 0 0 1-2-2v-4m0 0h18"/></svg>,
  },
  {
    href: '/contact', label: 'Contact',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  },
]

export default function ClientShell({ children }) {
  const [searchOpen,  setSearchOpen]  = useState(false)
  const [scrolled,    setScrolled]    = useState(false)
  const [activeLink,  setActiveLink]  = useState('/')
  const [annCurrent,  setAnnCurrent]  = useState(0)
  const [annPhase,    setAnnPhase]    = useState('visible')
  const [showTooltip, setShowTooltip] = useState(false)
  const [showQr, setShowQr] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })

    const annInterval = setInterval(() => {
      setAnnPhase('exit')
      setTimeout(() => {
        setAnnCurrent(prev => (prev + 1) % annMessages.length)
        setAnnPhase('visible')
      }, 500)
    }, 3800)

    return () => {
      window.removeEventListener('scroll', onScroll)
      clearInterval(annInterval)
    }
  }, [])

  function goToAnn(i) {
    if (i === annCurrent) return
    setAnnPhase('exit')
    setTimeout(() => { setAnnCurrent(i); setAnnPhase('visible') }, 500)
  }

  const waUrl = `https://wa.me/919686153413?text=${encodeURIComponent('Hi! I have a question about WIN-DIA Thins.')}`

  return (
    <>

    {/* ── ANNOUNCEMENT BAR (below nav) ── */}
      <div className="ann-bar" role="region" aria-label="Announcements">
        <div className="ann-inner">
          <span className="ann-dot" aria-hidden="true" />
          <div className="ann-slot" aria-live="polite" aria-atomic="true">
            <span className={`ann-text ${annPhase}`}>
              {renderAnnMessage(annMessages[annCurrent])}
            </span>
          </div>
          <span className="ann-dot" aria-hidden="true" />
          <div className="ann-pips" aria-label="Announcement navigation">
            {annMessages.map((_, i) => (
              <button
                key={i}
                className={`ann-pip${i === annCurrent ? ' active' : ''}`}
                onClick={() => goToAnn(i)}
                aria-label={`Go to announcement ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>


      {/* ── NAV ── */}
      <nav id="mainNav" className={scrolled ? 'scrolled' : ''}>
        <Link href="/" className="logo" onClick={() => setActiveLink('/')}>
          <Image src={windialogo} alt="WIN-DIA logo" className="logo-emblem" priority />
          <div className="logo-text-group">
            <div className="logo-name">
              WIN-<span>DIA</span>
              <sup className="logo-trademark">™</sup>
            </div>
            <div className="logo-tagline">The Divine Healthy Crunch</div>
          </div>
        </Link>

        <ul>
          {navLinks.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className={activeLink === href ? 'active' : ''}
                onClick={() => setActiveLink(href)}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="nav-icons">
          <div className="nav-search-bar">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(196,151,107,0.6)" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input type="text" placeholder="Search Thins..." />
          </div>

          <button className="nav-icon-btn mobile-search-btn" aria-label="Search" onClick={() => setSearchOpen(true)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </button>

          <Link href="/wishlist" className="nav-icon-btn" aria-label="Wishlist">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </Link>

          <Link href="/cart" className="nav-icon-btn cart-btn" aria-label="Cart">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
          </Link>

          <Link href="/account" className="nav-icon-btn" aria-label="Account">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </Link>
        </div>
      </nav>

      {/* ── MOBILE SEARCH OVERLAY ── */}
      {searchOpen && (
        <div className="mobile-search-overlay">
          <div className="mobile-search-inner">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(196,151,107,0.6)" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input type="text" placeholder="Search Thins..." className="mobile-search-input" autoFocus />
            <button className="mobile-search-close" onClick={() => setSearchOpen(false)} aria-label="Close search">✕</button>
          </div>
        </div>
      )}

      {/* ── MOBILE BOTTOM NAV ── */}
      <div className="bottom-nav">
        {bottomNavItems.map(({ href, label, icon }) => (
          <Link
            key={href}
            href={href}
            className={`bottom-nav-item${activeLink === href ? ' active' : ''}`}
            onClick={() => setActiveLink(href)}
          >
            {icon}
            <span>{label}</span>
          </Link>
        ))}
      </div>

      {/* ── PAGE CONTENT ── */}
      <main>{children}</main>

     {/* ── FOOTER ── */}
<footer className="footer">
  <div className="footer-inner">
    <div className="footer-top">
      <div className="footer-brand">
        <div className="footer-logo">WIN-DIA</div>
        <div className="footer-tagline">The Divine Healthy Crunch</div>
        <p className="footer-desc">
          Ancient wisdom meets modern wellness.<br />
          Crafted with love, backed by science.
        </p>
      </div>
      <div className="footer-brand-right">
        <div className="footer-rule-v" />
        <p className="footer-copy">© 2025 Kalpavristi Coco Foods. All rights reserved.</p>
      </div>
    </div>

    <div className="footer-divider" />

    <div className="footer-cols">
      <div className="footer-col">
        <h4 className="footer-col-title">Quick Links</h4>
        <div className="footer-col-rule" />
        <ul className="footer-links">
          <li><Link href="/shop">Shop</Link></li>
          <li><Link href="/our-story/about">About</Link></li>
          <li><Link href="/health-benefits">Health Benefits</Link></li>
          <li><Link href="/contact">Contact</Link></li>
          <li><Link href="/track-order">Track Order</Link></li>
        </ul>
      </div>

      <div className="footer-col">
        <h4 className="footer-col-title">Contact &amp; Location</h4>
        <div className="footer-col-rule" />
        <ul className="footer-contact">
          <li><a href="tel:+919686153413">+91 96861 53413</a></li>
          <li><a href="mailto:care@windia.com">care@windia.com</a></li>
          <li className="footer-address">
            #1058/C, Basavanahalli Main Road,<br />
            Belvadi Village, Ilavala Hobli,<br />
            Mysuru – 570032, Karnataka
          </li>
        </ul>
        <div className="footer-locate">

          {/* ✅ Tap backdrop to close on mobile */}
          {showQr && (
            <div
              style={{ position: 'fixed', inset: 0, zIndex: 98 }}
              onClick={() => setShowQr(false)}
            />
          )}

          <div
  className="footer-qr-wrap"
  onClick={() => {
    if (window.innerWidth <= 768) {
      setShowQr(prev => !prev)
    }
  }}
>
            <Image
              src={qrCode}
              alt="Scan to find WIN-DIA on Google Maps"
              className="footer-qr"
              width={62}
              height={62}
            />
            <span className="footer-qr-label">Scan to locate us</span>

            {/* ✅ Popup — hover on desktop, tap on mobile */}
            <div className={`footer-qr-popup${showQr ? ' footer-qr-popup--visible' : ''}`}>
              <Image
                src={qrCode}
                alt="WIN-DIA on Google Maps – scan to open"
                width={180}
                height={180}
              />
              <p className="footer-qr-popup-label">Scan to locate us</p>
            </div>
          </div>

          
           <a href="https://maps.google.com/?q=1058/C,Basavanahalli+Main+Road,Belvadi+Village,Ilavala+Hobli,Mysuru+570032"
            target="_blank" rel="noopener noreferrer" className="footer-map-btn"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
              <circle cx="12" cy="9" r="2.5"/>
            </svg>
            Open in Maps
          </a>
        </div>
      </div>

      <div className="footer-col">
        <h4 className="footer-col-title">Certifications</h4>
        <div className="footer-col-rule" />
        <ul className="footer-certs">
          <li><span className="cert-dot">✦</span> FSSAI Certified</li>
          <li><span className="cert-dot">✦</span> NABL Lab Tested</li>
          <li><span className="cert-dot">✦</span> DST-iTBI Supported</li>
          <li><span className="cert-dot">✦</span> Startup Karnataka</li>
          <li><span className="cert-dot">✦</span> PMFME Recognized</li>
        </ul>
      </div>
    </div>
  </div>

  <div className="footer-bar">
    <span>Made with love in Mysuru 🌿</span>
  </div>
</footer>

      {/* ── WHATSAPP BUTTON ── */}
      <div className="wa-wrapper">
        {showTooltip && <div className="wa-tooltip">Need help? Chat with us</div>}
        <a
          href={waUrl} target="_blank" rel="noopener noreferrer"
          className="wa-btn" aria-label="Chat with us on WhatsApp"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.532 5.853L.057 23.09a.75.75 0 0 0 .906.918l5.344-1.503A11.942 11.942 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.726 9.726 0 0 1-4.976-1.365l-.356-.212-3.699 1.04 1.003-3.595-.232-.369A9.718 9.718 0 0 1 2.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/>
          </svg>
        </a>
      </div>
    </>
  )
}