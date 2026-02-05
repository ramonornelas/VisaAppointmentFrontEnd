import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ConfigProvider } from "antd";
import { AuthProvider } from "./utils/AuthContext";
import theme from "./config/theme";
import "./index.css";
import LogIn from "./components/auth/LogIn";
import Home from "./components/home/Home";
import RegisterUser from "./components/auth/RegisterUser";
import QuickStartApplicant from "./components/applicants/QuickStartApplicant";
import Applicants from "./components/applicants/Applicants";
import ApplicantForm from "./components/applicants/ApplicantForm";
import ApplicantView from "./components/applicants/ApplicantView";
import DeleteApplicant from "./components/applicants/DeleteApplicant";
import LogOut from "./components/auth/LogOut";
import PremiumUpgrade from "./components/premium/PremiumUpgrade";
import ChangePassword from "./components/auth/ChangePassword";

import Users from "./components/users/Users";
import VerifyEmail from "./components/auth/VerifyEmail";

import "./locales/i18n"; // Initialize i18n

const container = document.getElementById("root");
const root = createRoot(container);

root.render(
  <ConfigProvider theme={theme}>
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LogIn />} />
          <Route path="/home" element={<Home />} />
          <Route path="/registeruser" element={<RegisterUser />} />
          <Route path="/quickstart" element={<QuickStartApplicant />} />
          <Route path="/applicants" element={<Applicants />} />
          <Route path="/applicant-form" element={<ApplicantForm />} />
          <Route path="/viewapplicant" element={<ApplicantView />} />
          <Route path="/view-applicant/:id" element={<ApplicantView />} />
          <Route path="/deleteapplicant" element={<DeleteApplicant />} />
          <Route path="/logout" element={<LogOut />} />
          <Route path="/premium-upgrade" element={<PremiumUpgrade />} />
          <Route path="/change-password" element={<ChangePassword />} />
          <Route path="/users" element={<Users />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
        </Routes>
      </Router>
    </AuthProvider>
  </ConfigProvider>
);
