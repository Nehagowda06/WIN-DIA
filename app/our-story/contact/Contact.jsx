"use client";
import "./Contact.css";
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const Contact = () => {
  const [form, setForm] = useState({ 
    name: '', 
    email: '', 
    phone: '', 
    subject: '', 
    message: '' 
  });
  const [sent, setSent] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) { toast.error('Please enter your name'); return; }
    if (!/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/.test(form.email.trim())) {
      toast.error('Please enter a valid email address');
      return;
    }
    if (!form.message.trim() || form.message.trim().length < 10) {
      toast.error('Please write a message (at least 10 characters)');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      const result = await response.json();

      if (result.success) {
        setSent(true);
        toast.success("Message sent — we'll get back to you soon.");
        setTimeout(() => {
          setSent(false);
          setForm({ name: '', email: '', phone: '', subject: '', message: '' });
        }, 3000);
      } else {
        toast.error(result.error || 'Something went wrong. Please try again.');
      }
    } catch {
      toast.error('Could not send your message. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="win-contact-page">
      {/* Hero Section with Different Background Color */}
      <section className="win-contact-hero">
        <div className="win-container">
          <div className={`win-hero-content ${isVisible ? 'win-animate-in' : ''}`}>
            <span className="win-hero-badge">Contact Us</span>
            <h1 className="win-hero-title">Let's Connect</h1>
            <div className="win-hero-line"></div>
            <p className="win-hero-subtitle">
              We'd love to hear from you. Whether you have a question about an order, 
              need support, or want to explore partnership opportunities.
            </p>
          </div>
        </div>
      </section>

      {/* Map & Contact Info Grid Section */}
      <section className="win-contact-main-section">
        <div className="win-container">
          <div className="win-contact-split-grid">
            {/* Left Side - Google Map */}
            <div className="win-map-side">
              <div className="win-map-container">
                <iframe 
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3897.8067602198375!2d76.57044797453725!3d12.328789728646433!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3baf7b977f91431f%3A0xaf63ab8e0f922f23!2skalpavristi%20coco%20foods%20OPC%20pvt%20ltd!5e0!3m2!1sen!2sin!4v1776312786069!5m2!1sen!2sin" 
                  width="100%" 
                  height="100%" 
                  style={{ border: 0 }} 
                  allowFullScreen 
                  loading="lazy" 
                  referrerPolicy="no-referrer-when-downgrade"
                  title="WIN-DIA Office Location"
                />
              </div>
            </div>

            {/* Right Side - Contact Information Cards (Vertical Stack) */}
            <div className="win-info-side">
              <div className="win-contact-cards-vertical">
                {/* Location Card */}
                <div className="win-info-card-vertical">
                  <div className="win-card-accent"></div>
                  <div className="win-card-content">
                    <h3 className="win-card-title-vertical">Location</h3>
                    <p className="win-card-text-vertical">Bengaluru, Karnataka</p>
                    <p className="win-card-subtext-vertical">India</p>
                  </div>
                </div>

                {/* Email Card */}
                <div className="win-info-card-vertical">
                  <div className="win-card-accent"></div>
                  <div className="win-card-content">
                    <h3 className="win-card-title-vertical">Email</h3>
                    <a href="mailto:support@win-dia.com" className="win-card-link-vertical">support@win-dia.com</a>
                    <a href="mailto:hello@win-dia.com" className="win-card-link-vertical">hello@win-dia.com</a>
                  </div>
                </div>

                {/* Phone Card */}
                <div className="win-info-card-vertical">
                  <div className="win-card-accent"></div>
                  <div className="win-card-content">
                    <h3 className="win-card-title-vertical">Phone</h3>
                    <a href="tel:+919876543210" className="win-card-link-vertical">+91 98765 43210</a>
                    <p className="win-card-hours-vertical">Monday - Friday, 9:00 AM - 6:00 PM IST</p>
                  </div>
                </div>

                {/* Social Card */}
                <div className="win-info-card-vertical">
                  <div className="win-card-accent"></div>
                  <div className="win-card-content">
                    <h3 className="win-card-title-vertical">Social</h3>
                    <div className="win-social-links-vertical">
                      <a href="#" className="win-social-link-vertical">Instagram</a>
                      <a href="#" className="win-social-link-vertical">Facebook</a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="win-form-section">
        <div className="win-container">
          <div className="win-form-container">
            <div className="win-form-header">
              <h2>Send Us a Message</h2>
              <p>You can also reach us by filling out the form below</p>
            </div>
            
            <form className="win-contact-form" onSubmit={handleSubmit}>
              <div className="win-form-row">
                <div className="win-form-group">
                  <label htmlFor="win-name">Full Name</label>
                  <input
                    id="win-name"
                    name="name"
                    type="text"
                    value={form.name}
                    onChange={handleChange}
                    required
                    placeholder="John Doe"
                  />
                </div>
                
                <div className="win-form-group">
                  <label htmlFor="win-email">Email Address</label>
                  <input
                    id="win-email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    placeholder="hello@example.com"
                  />
                </div>
              </div>

              <div className="win-form-row">
                <div className="win-form-group">
                  <label htmlFor="win-phone">Phone Number</label>
                  <input
                    id="win-phone"
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="+91 98765 43210"
                  />
                </div>
                
                <div className="win-form-group">
                  <label htmlFor="win-subject">Subject</label>
                  <input
                    id="win-subject"
                    name="subject"
                    type="text"
                    value={form.subject}
                    onChange={handleChange}
                    required
                    placeholder="How can we help?"
                  />
                </div>
              </div>
              
              <div className="win-form-group">
                <label htmlFor="win-message">Message</label>
                <textarea
                  id="win-message"
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  required
                  placeholder="Tell us more about your inquiry..."
                />
              </div>
              
              <button type="submit" className="win-submit-btn" disabled={submitting}>
                {submitting ? 'Sending…' : 'Send Message'}

                <span className="win-btn-arrow">→</span>
              </button>
              
              {sent && (
                <div className="win-success-message">
                  <span className="win-success-icon">✓</span>
                  <p>Thank you! Your message has been sent successfully.</p>
                </div>
              )}
            </form>
          </div>
        </div>
      </section>

{/* Business Inquiries Section */}
<section className="win-business-section">
  <div className="win-container">
    <div className="win-business-content">
      <div className="win-business-line"></div>

      <h2>Business Inquiries</h2>

      <p>
        For partnership opportunities, wholesale orders, or corporate gifting,
        please reach out to our business development team.
      </p>

      <a
        href="https://mail.google.com/mail/?view=cm&fs=1&to=business@win-dia.com"
        target="_blank"
        rel="noopener noreferrer"
        className="win-business-email"
      >
        BUSINESS@WIN-DIA.COM
        <span className="win-arrow">→</span>
      </a>
    </div>
  </div>
</section>
    </div>
  );
};

export default Contact;