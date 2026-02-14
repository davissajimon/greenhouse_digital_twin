import React from "react";
import "./Footer.css";

const Footer = () => {
  return (
    <footer className="footer-bar">
      {/* Left */}
      <span className="footer-copy">
        © {new Date().getFullYear()} GREENHOUSE DIGITAL TWIN
      </span>

      {/* Center */}
      <div className="footer-center">
        <a href="mailto:greenhousedigitaltwin@gmail.com" className="footer-email">
          GREENHOUSEDIGITALTWIN@GMAIL.COM
        </a>
      </div>

      {/* Right */}
      <span className="footer-legal">
        DIGITAL TWIN PROJECT
      </span>
    </footer>
  );
};

export default Footer;
