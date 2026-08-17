'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import './Footer.css';

import qrCodeImg from './qrCode.jpeg'

export default function Footer() {
  const [qrPopupVisible, setQrPopupVisible] = useState(false)

  const handleQrClick = (e) => {
    e.stopPropagation()

    if (window.innerWidth <= 768) {
      setQrPopupVisible((prev) => !prev)
    }
  }

  useEffect(() => {
    const closePopup = () => setQrPopupVisible(false)

    document.addEventListener('click', closePopup)

    return () => {
      document.removeEventListener('click', closePopup)
    }
  }, [])

  return (
    <footer className="footer">
      <div className="footer-inner">

        {/* Top Section */}
        <div className="footer-top">

          <div className="footer-brand">
            <div className="footer-logo">WIN-DIA</div>

            <div className="footer-tagline">
              THE DIVINE HEALTHY CRUNCH
            </div>

            <p className="footer-desc">
              Ancient wisdom meets modern wellness.
              <br />
              Crafted with love, backed by science.
            </p>
          </div>

          <div className="footer-brand-right">
            <div className="footer-rule-v" />

            <p className="footer-copy">
              © {new Date().getFullYear()} Kalpavristi Coco Foods.
              <br />
              All rights reserved.
            </p>
          </div>

        </div>

        <div className="footer-divider" />

        {/* Footer Columns */}
        <div className="footer-cols">

          {/* Quick Links */}
          <div className="footer-col">
            <h4 className="footer-col-title">
              Quick Links
            </h4>

            <div className="footer-col-rule" />

            <ul className="footer-links">
              <li>
                <Link href="/shop">
                  Shop
                </Link>
              </li>

              <li>
  <Link href="/our-story/about">
    Our Story
  </Link>
</li>

<li>
  <Link href="/health-benefits">
    Health Benefits
  </Link>
</li>

<li>
  <Link href="/our-story/contact">
    Contact
  </Link>
</li>

              <li>
                <Link href="/account">
                  Track Order
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Location */}
          <div className="footer-col">

            <h4 className="footer-col-title">
              Contact & Location
            </h4>

            <div className="footer-col-rule" />

            <ul className="footer-contact">

              <li>
                <a href="tel:+919686153413">
                  +91 96861 53413
                </a>
              </li>

              <li>
                <a href="mailto:care@windia.com">
                  care@windia.com
                </a>
              </li>

            </ul>

            <div className="footer-address">
              #1058/C, Basavanahalli Main Road,
              <br />
              Belvadi Village, Ilavala Hobli,
              <br />
              Mysuru – 570032, Karnataka
            </div>

            <div className="footer-locate">

              {/* QR CODE */}
              <div
                className="footer-qr-wrap"
                onClick={handleQrClick}
              >
                <Image
                  src={qrCodeImg}
                  alt="QR Code"
                  className="footer-qr"
                  width={58}
                  height={58}
                />

                <span className="footer-qr-label">
                  Scan To Locate Us
                </span>

                <div
                  className={`footer-qr-popup ${
                    qrPopupVisible
                      ? 'footer-qr-popup--visible'
                      : ''
                  }`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Image
                    src={qrCodeImg}
                    alt="Location QR"
                    width={130}
                    height={130}
                    className="footer-qr-popup-img"
                  />

                  <div className="footer-qr-popup-label">
                    Scan To Locate Us
                  </div>
                </div>
              </div>

              {/* MAP BUTTON */}
              <a
                href="https://maps.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-map-btn"
              >
                OPEN IN MAPS
              </a>

            </div>

          </div>

          {/* Certifications */}
          <div className="footer-col">

            <h4 className="footer-col-title">
              Certifications
            </h4>

            <div className="footer-col-rule" />

            <ul className="footer-certs">

              <li>
                <span className="cert-dot">✦</span>
                FSSAI Certified
              </li>

              <li>
                <span className="cert-dot">✦</span>
                NABL Lab Tested
              </li>

              <li>
                <span className="cert-dot">✦</span>
                DST-ITBI Supported
              </li>

              <li>
                <span className="cert-dot">✦</span>
                Startup Karnataka
              </li>

              <li>
                <span className="cert-dot">✦</span>
                PMFME Recognized
              </li>

            </ul>

          </div>

        </div>
      </div>

      {/* Bottom Bar */}
      <div className="footer-bar">
        <span>
          Made with love in Mysuru 🌿
        </span>
      </div>
    </footer>
  )
}