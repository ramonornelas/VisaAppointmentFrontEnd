import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import BannerImage from "../../assets/fastvisa-icon.png";
import "./PreLoginHeader.css";

const PreLoginHeader = () => {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="prelogin-header">
      <div className="prelogin-header__sheet">
        <button
          type="button"
          className="prelogin-header__hamburger"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
        >
          <span className="prelogin-header__hamburger-line" />
          <span className="prelogin-header__hamburger-line" />
          <span className="prelogin-header__hamburger-line" />
        </button>

        {/* Bloque 1: Logo */}
        <div className="prelogin-header__block prelogin-header__block--logo">
          <Link to="/" className="prelogin-header__logo" onClick={closeMenu}>
            <img
              src={BannerImage}
              alt="FastVisa"
              className="prelogin-header__logo-img"
            />
          </Link>
        </div>

        {/* Bloque 2: Navegación (Inicio, Nosotros, Contáctanos) - drawer en móvil */}
        <nav
          className={`prelogin-header__block prelogin-header__nav ${
            menuOpen ? "prelogin-header__nav--open" : ""
          }`}
          role="navigation"
        >
          <div className="prelogin-header__drawer-inner">
            <button
              type="button"
              className="prelogin-header__drawer-close"
              onClick={closeMenu}
              aria-label={t("closeMenu", "Cerrar menú")}
            >
              <svg className="prelogin-header__drawer-close-x" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <ul className="prelogin-header__nav-list">
            <li>
              <Link
                to="/"
                onClick={closeMenu}
                className="prelogin-header__nav-link"
              >
                {t("inicio", "Inicio")}
              </Link>
            </li>
            <li>
              <a
                href={`${process.env.PUBLIC_URL || ""}/landing/Nosotros.html`}
                onClick={closeMenu}
                className="prelogin-header__nav-link"
              >
                {t("nosotros", "Nosotros")}
              </a>
            </li>
            <li>
              <a
                href={`${
                  process.env.PUBLIC_URL || ""
                }/landing/index.html#block-9`}
                onClick={closeMenu}
                className="prelogin-header__nav-link"
              >
                {t("contactanos", "Contáctanos")}
              </a>
            </li>
            <li className="prelogin-header__nav-ctas">
              <Link
                to="/registeruser"
                onClick={closeMenu}
                className="prelogin-header__nav-cta prelogin-header__nav-cta--primary"
              >
                {t("crearCuenta", "CREAR CUENTA")}
              </Link>
              <Link
                to="/login"
                onClick={closeMenu}
                className="prelogin-header__nav-cta prelogin-header__nav-cta--secondary"
              >
                {t("iniciarSesion", "INICIAR SESIÓN")}
              </Link>
            </li>
          </ul>
          </div>
        </nav>

        {/* Bloque 3: Botones CREAR CUENTA e INICIAR SESIÓN */}
        <div className="prelogin-header__block prelogin-header__block--ctas">
          <Link
            to="/login"
            className="prelogin-header__btn prelogin-header__btn--secondary"
            onClick={closeMenu}
          >
            {t("iniciarSesion", "INICIAR SESIÓN")}
          </Link>
          <Link
            to="/registeruser"
            className="prelogin-header__btn prelogin-header__btn--primary"
            onClick={closeMenu}
          >
            {t("crearCuenta", "CREAR CUENTA")}
          </Link>
        </div>
      </div>

      {menuOpen && (
        <div
          className="prelogin-header__overlay"
          onClick={closeMenu}
          onKeyDown={(e) => e.key === "Escape" && closeMenu()}
          role="button"
          tabIndex={-1}
          aria-label="Close menu"
        />
      )}
    </header>
  );
};

export default PreLoginHeader;
