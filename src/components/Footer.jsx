import React from "react";
import "./Footer.css"; // make sure this path is correct relative to the file

const Footer = () => {
  return (
    <footer className="footer-container" aria-labelledby="footer-heading">
      <div className="footer-inner">
        {/* Logo + About */}
        <div className="footer-col footer-about-col">
          <h2 id="footer-heading" className="footer-logo">🌿 Greenhouse Dashboard</h2>
          <p className="footer-about">
            A smart monitoring and control system for modern greenhouses.
            Helping growers maintain optimal plant health using IoT + Digital Twin.
          </p>
        </div>

        {/* Quick Links */}
        <div className="footer-col">
          <h3 className="footer-title">Quick Links</h3>
          <ul className="footer-links" aria-label="Quick links">
            <li><a href="/dashboard">Dashboard</a></li>
            <li><a href="/plants">Plants</a></li>
            <li><a href="/analytics">Analytics</a></li>
            <li><a href="/settings">Settings</a></li>
          </ul>
        </div>

        {/* Contact */}
        <div className="footer-col">
          <h3 className="footer-title">Contact</h3>
          <address className="footer-contact">
            <a href="mailto:support@greenhouse.com">support@greenhouse.com</a><br/>
            <a href="tel:+919876543210">+91 98765 43210</a>
          </address>
        </div>

        {/* Socials */}
        <div className="footer-col">
          <h3 className="footer-title">Follow Us</h3>
          <div className="footer-socials" aria-label="Social links">
            <a className="social-btn" href="#link" aria-label="Website link">🔗</a>
            <a className="social-btn" href="#twitter" aria-label="Twitter">🐦</a>
            <a className="social-btn" href="#facebook" aria-label="Facebook">📘</a>
            <a className="social-btn" href="#instagram" aria-label="Instagram">📸</a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} Greenhouse Dashboard | All Rights Reserved</p>
      </div>
    </footer>
  );
};

export default Footer;
