import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./base.css";
import { GlobalContextProviders } from "./components/_globalContextProviders";
import HomePage from "./pages/_index";
import homeLayout from "./pages/_index.pageLayout";
import IssuerPage from "./pages/issuer";
import issuerLayout from "./pages/issuer.pageLayout";
import VerifyPage from "./pages/verify.$credentialId";
import verifyLayout from "./pages/verify.$credentialId.pageLayout";
import CredentialPage from "./pages/credential.$credentialId";
import credentialLayout from "./pages/credential.$credentialId.pageLayout";

type Layout = React.ComponentType<{ children: React.ReactNode }>;
const page = (layouts: Layout[], Page: React.ComponentType) =>
  layouts.reduceRight<React.ReactNode>(
    (child, L) => <L>{child}</L>,
    <Page />,
  );

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <GlobalContextProviders>
        <Routes>
          <Route path="/" element={page(homeLayout, HomePage)} />
          <Route path="/issuer" element={page(issuerLayout, IssuerPage)} />
          <Route path="/verify/:credentialId" element={page(verifyLayout, VerifyPage)} />
          <Route path="/credential/:credentialId" element={page(credentialLayout, CredentialPage)} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </GlobalContextProviders>
    </BrowserRouter>
  </React.StrictMode>,
);
