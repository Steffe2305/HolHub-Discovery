import React, { useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";

const BTR_CONTENT_REGISTRY = "0x17B8b74E1D0C50878ab8Bf5642b4E3E8702D178a";

const ABI_CONTENT = [
  "function getContent(uint256 id) external view returns (tuple(uint256 id, address author, string uri, bool active))"
];

const CATEGORY_CODES = [
  { code: "ADV", label: "Agenzia di viaggio", keywords: ["agenzia", "travel agency", "adv"] },
  { code: "TOP", label: "Tour Operator", keywords: ["tour operator", "to", "top"] },
  { code: "DMC", label: "Destination Management Company", keywords: ["dmc", "destination"] },
  { code: "HTL", label: "Strutture alberghiere", keywords: ["hotel", "strutture", "hospitality", "resort", "b&b", "agriturismo", "htl"] },
  { code: "FLY", label: "Compagnie aeree", keywords: ["airline", "compagnia aerea", "volo", "fly"] },
  { code: "FER", label: "Traghetti e ferry", keywords: ["ferry", "traghetto", "fer"] },
  { code: "CRU", label: "Crociere", keywords: ["cruise", "crociera", "cru"] },
  { code: "CAR", label: "Noleggio auto", keywords: ["car", "auto", "rent a car", "noleggio auto"] },
  { code: "BIK", label: "Noleggio bici", keywords: ["bike", "bici", "bicycle", "bik"] },
  { code: "GUI", label: "Guide locali", keywords: ["guida", "guide", "local guide", "gui"] },
  { code: "EXC", label: "Escursioni e visite", keywords: ["excursion", "escursione", "tour", "visita", "exc"] },
  { code: "F&B", label: "Food & Beverage", keywords: ["food", "beverage", "ristorante", "restaurant", "f&b", "bar"] },
  { code: "TKT", label: "Biglietteria", keywords: ["ticket", "biglietto", "museo", "event ticket", "tkt"] },
  { code: "TRF", label: "Transfer", keywords: ["transfer", "shuttle", "ncc", "driver", "trf"] },
  { code: "EVT", label: "Eventi", keywords: ["event", "evento", "mice", "wedding", "evt"] },
  { code: "VEN", label: "Venue e location", keywords: ["venue", "location", "congress", "meeting room", "ven"] },
  { code: "INS", label: "Assicurazioni", keywords: ["insurance", "assicurazione", "ins"] },
  { code: "RAI", label: "Rail", keywords: ["rail", "train", "treno", "ferrovia", "rai"] },
  { code: "SEA", label: "Nautica e turismo mare", keywords: ["sea", "nautica", "yacht", "sailing", "charter", "diving"] },
  { code: "EDU", label: "Educational travel", keywords: ["education", "school", "academy", "language", "edu"] },
  { code: "MED", label: "Medical / Wellness", keywords: ["medical", "wellness", "spa", "retreat", "med"] },
  { code: "CMP", label: "Corporate travel", keywords: ["corporate", "business travel", "tmc", "cmp"] },
];

function ipfsCid(uri) {
  if (!uri) return "";
  return uri.replace("ipfs://", "").trim();
}

function ipfsToGateway(uri) {
  if (!uri) return "";
  if (uri.startsWith("ipfs://")) {
    return `https://ipfs.io/ipfs/${ipfsCid(uri)}`;
  }
  return uri;
}

function ipfsGateways(uri) {
  const cid = ipfsCid(uri);
  if (!cid) return [];
  return [
    `https://ipfs.io/ipfs/${cid}`,
    `https://gateway.pinata.cloud/ipfs/${cid}`,
    `https://cloudflare-ipfs.com/ipfs/${cid}`
  ];
}

async function fetchIpfsJson(uri) {
  const gateways = ipfsGateways(uri);
  let lastError = null;

  for (const url of gateways) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        lastError = new Error(`Gateway ${url} returned ${response.status}`);
        continue;
      }
      return await response.json();
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("Impossibile leggere JSON IPFS");
}

function normalizeProfile(json) {
  return json?.profile || json || {};
}

function normalizeImages(json, profile) {
  const raw =
    json?.photos ||
    json?.images ||
    json?.gallery ||
    json?.media ||
    profile?.photos ||
    profile?.images ||
    profile?.gallery ||
    profile?.media ||
    [];

  if (!Array.isArray(raw)) return [];

  return raw
    .map((item) => {
      if (typeof item === "string") return ipfsToGateway(item);
      if (item?.url) return ipfsToGateway(item.url);
      if (item?.uri) return ipfsToGateway(item.uri);
      if (item?.ipfsUri) return ipfsToGateway(item.ipfsUri);
      if (item?.src) return ipfsToGateway(item.src);
      return "";
    })
    .filter(Boolean);
}

function extractRoles(profile) {
  const seller = Boolean(profile?.roles?.seller);
  const buyer = Boolean(profile?.roles?.buyer);

  if (seller && buyer) return ["Buyer", "Seller"];
  if (seller) return ["Seller"];
  if (buyer) return ["Buyer"];

  return [];
}

function countryToCode(country) {
  const value = String(country || "").trim().toLowerCase();

  if (["italia", "italy", "it", "ita"].includes(value)) return "ITA";
  if (["francia", "france", "fr", "fra"].includes(value)) return "FRA";
  if (["spagna", "spain", "es", "esp"].includes(value)) return "ESP";
  if (["germania", "germany", "de", "deu"].includes(value)) return "DEU";
  if (["regno unito", "united kingdom", "uk", "gb", "gbr"].includes(value)) return "GBR";
  if (["usa", "united states", "stati uniti", "us"].includes(value)) return "USA";

  return value.slice(0, 3).toUpperCase() || "INT";
}

function detectCategoryCode(profile) {
  const explicit = String(profile?.categoryCode || profile?.sectorCode || "").trim().toUpperCase();
  if (CATEGORY_CODES.some((c) => c.code === explicit)) return explicit;

  const text = `${profile?.category || ""} ${profile?.sector || ""} ${profile?.subtype || ""}`.toLowerCase();

  const found = CATEGORY_CODES.find((cat) =>
    cat.keywords.some((keyword) => text.includes(keyword.toLowerCase()))
  );

  return found?.code || "SUP";
}

function categoryLabel(code) {
  return CATEGORY_CODES.find((c) => c.code === code)?.label || "Supplier";
}

function makeHolidId(operator) {
  const country = countryToCode(operator.country);
  const category = operator.categoryCode || "SUP";
  const number = String(operator.contentId).padStart(6, "0");
  return `HOL-${country}-${category}-${number}`;
}

function parseHolidId(holid) {
  const parts = String(holid || "").split("-");
  const id = Number(parts[3]);
  return Number.isFinite(id) ? id : null;
}

function getHolidFromHash() {
  const hash = window.location.hash || "";
  const match = hash.match(/^#\/id\/(.+)$/);
  return match ? decodeURIComponent(match[1]) : "";
}

function qrUrlFor(value) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=14&data=${encodeURIComponent(value)}`;
}

function verificationUrl(holid) {
  return `${window.location.origin}/#/id/${encodeURIComponent(holid)}`;
}

function StyleTag() {
  return (
    <style>{`
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background: #f6f7fb;
        color: #111827;
      }
      .page {
        min-height: 100vh;
        padding: 28px;
        background:
          radial-gradient(900px 520px at 85% 0%, rgba(99,102,241,.22), transparent),
          radial-gradient(760px 500px at 0% 15%, rgba(14,165,233,.18), transparent),
          linear-gradient(135deg, #f8fafc 0%, #eef2ff 52%, #f0f9ff 100%);
      }
      .shell {
        max-width: 1180px;
        margin: 0 auto;
        overflow: hidden;
        border-radius: 34px;
        border: 1px solid rgba(99,102,241,.16);
        background: rgba(255,255,255,.82);
        box-shadow: 0 28px 80px -45px rgba(15,23,42,.55);
        backdrop-filter: blur(14px);
      }
      .header {
        padding: 34px;
        border-bottom: 1px solid rgba(15,23,42,.08);
        background:
          radial-gradient(700px 300px at 80% 0%, rgba(79,70,229,.16), transparent),
          rgba(255,255,255,.72);
      }
      .badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        border-radius: 999px;
        padding: 8px 12px;
        background: #eef2ff;
        color: #3730a3;
        border: 1px solid #c7d2fe;
        font-size: 12px;
        font-weight: 800;
      }
      .dot {
        width: 8px;
        height: 8px;
        border-radius: 999px;
        background: #06b6d4;
        box-shadow: 0 0 0 5px rgba(6,182,212,.14);
      }
      h1 {
        margin: 16px 0 8px;
        font-size: clamp(32px, 5vw, 54px);
        line-height: 1;
        letter-spacing: -0.055em;
        color: #0f172a;
      }
      .subtitle {
        max-width: 760px;
        margin: 0;
        color: #64748b;
        font-size: 15px;
        line-height: 1.65;
      }
      .content { padding: 28px; }
      .stats {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 14px;
      }
      @media (max-width: 900px) {
        .stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .page { padding: 14px; }
      }
      @media (max-width: 560px) {
        .stats { grid-template-columns: 1fr; }
      }
      .stat {
        border-radius: 26px;
        border: 1px solid rgba(15,23,42,.08);
        background: rgba(255,255,255,.9);
        padding: 20px;
        box-shadow: 0 14px 45px -32px rgba(15,23,42,.55);
      }
      .stat-value {
        font-size: 34px;
        font-weight: 950;
        letter-spacing: -0.04em;
        color: #111827;
      }
      .stat-label {
        margin-top: 2px;
        color: #475569;
        font-size: 12px;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: .08em;
      }
      .stat-caption {
        margin: 10px 0 0;
        color: #64748b;
        font-size: 12px;
        line-height: 1.45;
      }
      .panel {
        margin-top: 20px;
        border-radius: 28px;
        border: 1px solid rgba(15,23,42,.08);
        background: rgba(248,250,252,.78);
        padding: 18px;
      }
      .controls {
        display: grid;
        grid-template-columns: 1fr 1fr 2fr auto;
        gap: 12px;
        align-items: end;
      }
      @media (max-width: 920px) {
        .controls { grid-template-columns: 1fr; }
      }
      .label {
        display: block;
        margin-bottom: 7px;
        color: #475569;
        font-size: 11px;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: .08em;
      }
      input {
        width: 100%;
        border: 1px solid rgba(15,23,42,.12);
        background: rgba(255,255,255,.92);
        color: #111827;
        border-radius: 18px;
        padding: 13px 14px;
        font-size: 14px;
        outline: none;
      }
      input:focus {
        border-color: rgba(79,70,229,.45);
        box-shadow: 0 0 0 4px rgba(79,70,229,.12);
      }
      .btn {
        border: 0;
        border-radius: 18px;
        padding: 13px 18px;
        font-size: 14px;
        font-weight: 900;
        color: white;
        cursor: pointer;
        background: linear-gradient(135deg, #3730a3, #06b6d4);
        box-shadow: 0 16px 35px -28px rgba(15,23,42,.75);
      }
      .btn.secondary {
        background: #fff;
        color: #3730a3;
        border: 1px solid #c7d2fe;
      }
      .btn:disabled {
        opacity: .55;
        cursor: not-allowed;
      }
      .filters {
        display: flex;
        flex-wrap: wrap;
        gap: 9px;
        margin-top: 16px;
      }
      .filter-btn {
        border: 1px solid rgba(15,23,42,.08);
        background: white;
        color: #475569;
        border-radius: 999px;
        padding: 10px 14px;
        font-size: 13px;
        font-weight: 900;
        cursor: pointer;
      }
      .filter-btn.active {
        color: white;
        border-color: transparent;
        background: linear-gradient(135deg, #3730a3, #06b6d4);
      }
      .status {
        margin-top: 14px;
        color: #475569;
        font-size: 13px;
        font-weight: 650;
      }
      .debug {
        margin-top: 12px;
        border-radius: 18px;
        background: #0f172a;
        color: #e2e8f0;
        padding: 12px;
        font-size: 12px;
        white-space: pre-wrap;
        overflow: auto;
        max-height: 180px;
      }
      .list {
        margin-top: 18px;
        display: grid;
        gap: 12px;
      }
      .row {
        border: 0;
        text-align: left;
        width: 100%;
        cursor: pointer;
        border-radius: 28px;
        border: 1px solid rgba(15,23,42,.08);
        background: rgba(255,255,255,.9);
        padding: 0;
        overflow: hidden;
        box-shadow: 0 12px 45px -36px rgba(15,23,42,.65);
        transition: .16s ease;
      }
      .row:hover {
        transform: translateY(-2px);
        border-color: rgba(79,70,229,.28);
        box-shadow: 0 20px 60px -38px rgba(15,23,42,.75);
      }
      .row-inner {
        display: grid;
        grid-template-columns: 170px 1fr;
        gap: 18px;
        padding: 18px;
      }
      @media (max-width: 720px) {
        .row-inner { grid-template-columns: 1fr; }
      }
      .thumb {
        min-height: 128px;
        border-radius: 22px;
        overflow: hidden;
        background:
          radial-gradient(300px 160px at 85% 0%, rgba(6,182,212,.25), transparent),
          linear-gradient(135deg, #eef2ff, #f0f9ff);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #3730a3;
        font-weight: 950;
        font-size: 26px;
        letter-spacing: -0.04em;
      }
      .thumb img {
        width: 100%;
        height: 100%;
        min-height: 128px;
        object-fit: cover;
        display: block;
      }
      .row-head {
        display: flex;
        justify-content: space-between;
        gap: 16px;
        align-items: flex-start;
      }
      @media (max-width: 720px) {
        .row-head { flex-direction: column; }
      }
      .titleline {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
      }
      .op-title {
        margin: 0;
        color: #0f172a;
        font-size: 18px;
        font-weight: 950;
        letter-spacing: -0.03em;
      }
      .description {
        margin-top: 10px;
        max-width: 620px;
        color: #64748b;
        font-size: 13px;
        line-height: 1.55;
      }
      .meta {
        margin-top: 8px;
        color: #64748b;
        font-size: 14px;
        line-height: 1.5;
      }
      .holid {
        display: inline-flex;
        margin-top: 10px;
        border-radius: 999px;
        padding: 7px 11px;
        background: #eef2ff;
        color: #3730a3;
        border: 1px solid #c7d2fe;
        font-size: 12px;
        font-weight: 950;
      }
      .roles {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 13px;
      }
      .pill {
        display: inline-flex;
        align-items: center;
        border-radius: 999px;
        padding: 6px 10px;
        font-size: 12px;
        font-weight: 900;
        border: 1px solid;
      }
      .pill.default { background: #f8fafc; color: #475569; border-color: #e2e8f0; }
      .pill.seller { background: #ecfdf5; color: #047857; border-color: #bbf7d0; }
      .pill.buyer { background: #eef2ff; color: #3730a3; border-color: #c7d2fe; }
      .pill.verified { background: #ecfeff; color: #0e7490; border-color: #a5f3fc; }
      .pill.pending { background: #fffbeb; color: #92400e; border-color: #fde68a; }
      .contacts {
        min-width: 230px;
        color: #475569;
        font-size: 14px;
        line-height: 1.55;
        word-break: break-word;
        text-align: right;
      }
      @media (max-width: 720px) {
        .contacts { text-align: left; }
      }
      .contacts-label {
        margin-bottom: 6px;
        color: #94a3b8;
        font-size: 11px;
        font-weight: 950;
        text-transform: uppercase;
        letter-spacing: .08em;
      }
      .empty {
        border-radius: 28px;
        border: 1px dashed rgba(15,23,42,.18);
        background: rgba(255,255,255,.7);
        padding: 34px;
        text-align: center;
        color: #64748b;
        font-size: 14px;
      }
      .modal-backdrop {
        position: fixed;
        inset: 0;
        z-index: 50;
        padding: 24px;
        background: rgba(15,23,42,.42);
        backdrop-filter: blur(10px);
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .modal {
        width: min(1060px, 100%);
        max-height: 90vh;
        overflow: auto;
        border-radius: 34px;
        background: #fff;
        box-shadow: 0 35px 100px -45px rgba(15,23,42,.85);
      }
      .modal-hero {
        height: 280px;
        background:
          radial-gradient(700px 280px at 80% 0%, rgba(6,182,212,.25), transparent),
          linear-gradient(135deg, #eef2ff, #f0f9ff);
        overflow: hidden;
        position: relative;
      }
      .modal-hero img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }
      .modal-close {
        position: absolute;
        right: 18px;
        top: 18px;
        border: 0;
        border-radius: 999px;
        background: rgba(15,23,42,.74);
        color: white;
        padding: 10px 13px;
        font-weight: 900;
        cursor: pointer;
      }
      .modal-body { padding: 26px; }
      .modal-title {
        margin: 0;
        color: #0f172a;
        font-size: 32px;
        letter-spacing: -0.045em;
      }
      .detail-grid {
        display: grid;
        grid-template-columns: 1fr 320px;
        gap: 22px;
        margin-top: 18px;
      }
      @media (max-width: 860px) {
        .detail-grid { grid-template-columns: 1fr; }
      }
      .detail-card {
        border-radius: 24px;
        border: 1px solid rgba(15,23,42,.08);
        background: #f8fafc;
        padding: 18px;
      }
      .detail-label {
        color: #94a3b8;
        font-size: 11px;
        font-weight: 950;
        text-transform: uppercase;
        letter-spacing: .08em;
        margin-bottom: 8px;
      }
      .qr-box {
        margin-top: 14px;
        display: grid;
        gap: 12px;
        place-items: center;
        border-radius: 24px;
        border: 1px solid #c7d2fe;
        background: linear-gradient(135deg, #ffffff, #eef2ff);
        padding: 18px;
        text-align: center;
      }
      .qr-box img {
        width: 210px;
        height: 210px;
        border-radius: 16px;
        background: white;
      }
      .qr-link {
        width: 100%;
        color: #475569;
        font-size: 12px;
        word-break: break-all;
      }
      .gallery {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
        margin-top: 12px;
      }
      .gallery img {
        width: 100%;
        height: 90px;
        object-fit: cover;
        border-radius: 16px;
      }
      .category-grid {
        margin-top: 12px;
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 8px;
      }
      @media (max-width: 800px) {
        .category-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      }
      .category-mini {
        border-radius: 16px;
        border: 1px solid #e2e8f0;
        background: white;
        padding: 10px;
      }
      .category-code {
        color: #3730a3;
        font-weight: 950;
        font-size: 13px;
      }
      .category-label {
        color: #64748b;
        font-size: 11px;
        margin-top: 3px;
      }
    `}</style>
  );
}

function Pill({ children, tone = "default" }) {
  return <span className={`pill ${tone}`}>{children}</span>;
}

function StatCard({ label, value, caption }) {
  return (
    <div className="stat">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      <p className="stat-caption">{caption}</p>
    </div>
  );
}

function OperatorRow({ operator, onSelect }) {
  const firstImage = operator.images?.[0];

  return (
    <button className="row" onClick={() => onSelect(operator)}>
      <div className="row-inner">
        <div className="thumb">
          {firstImage ? (
            <img src={firstImage} alt={operator.name} />
          ) : (
            <span>{operator.name?.slice(0, 2)?.toUpperCase() || "HH"}</span>
          )}
        </div>

        <div className="row-head">
          <div>
            <div className="titleline">
              <h3 className="op-title">{operator.name || "Operatore senza nome"}</h3>
              {operator.active ? (
                <Pill tone="verified">Verified by Holid</Pill>
              ) : (
                <Pill tone="pending">Non attivo</Pill>
              )}
            </div>

            <div className="holid">{operator.holid}</div>

            <div className="meta">
              <strong>BTR ID {operator.contentId}</strong>
              {" · "}
              {operator.categoryCode} — {categoryLabel(operator.categoryCode)}
              {" · "}
              {operator.city || "Città non indicata"}, {operator.country || "Paese non indicato"}
            </div>

            {operator.description && (
              <div className="description">
                {operator.description.length > 180
                  ? `${operator.description.slice(0, 180)}...`
                  : operator.description}
              </div>
            )}

            <div className="roles">
              {operator.roles.length > 0 ? (
                operator.roles.map((role) => (
                  <Pill key={role} tone={role === "Seller" ? "seller" : "buyer"}>
                    {role === "Seller" ? "Seller" : "Buyer"}
                  </Pill>
                ))
              ) : (
                <Pill>Nessun ruolo</Pill>
              )}
            </div>
          </div>

          <div className="contacts">
            <div className="contacts-label">Contatti</div>
            <div>{operator.email || "Email non indicata"}</div>
            <div>{operator.website || "Sito web non indicato"}</div>
          </div>
        </div>
      </div>
    </button>
  );
}

function DetailModal({ operator, onClose }) {
  if (!operator) return null;

  const firstImage = operator.images?.[0];
  const url = verificationUrl(operator.holid);

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(url);
      alert("Link Holid copiato.");
    } catch {
      alert(url);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-hero">
          {firstImage && <img src={firstImage} alt={operator.name} />}
          <button className="modal-close" onClick={onClose}>Chiudi</button>
        </div>

        <div className="modal-body">
          <div className="titleline">
            <h2 className="modal-title">{operator.name}</h2>
            {operator.active ? <Pill tone="verified">Verified by Holid</Pill> : <Pill tone="pending">Non attivo</Pill>}
          </div>

          <div className="holid">{operator.holid}</div>

          <div className="meta">
            <strong>BTR Content ID {operator.contentId}</strong> · {operator.categoryCode} — {categoryLabel(operator.categoryCode)} · {operator.city}, {operator.country}
          </div>

          <div className="roles">
            {operator.roles.map((role) => (
              <Pill key={role} tone={role === "Seller" ? "seller" : "buyer"}>{role}</Pill>
            ))}
          </div>

          <div className="detail-grid">
            <div className="detail-card">
              <div className="detail-label">Descrizione</div>
              <div className="description" style={{ maxWidth: "none", marginTop: 0 }}>
                {operator.description || "Descrizione non disponibile."}
              </div>

              {operator.images?.length > 1 && (
                <>
                  <div className="detail-label" style={{ marginTop: 18 }}>Gallery</div>
                  <div className="gallery">
                    {operator.images.slice(1, 7).map((src, i) => (
                      <img key={i} src={src} alt={`${operator.name} ${i + 1}`} />
                    ))}
                  </div>
                </>
              )}

              <div className="detail-label" style={{ marginTop: 18 }}>Proof Camino / IPFS</div>
              <div style={{ wordBreak: "break-all", color: "#475569", fontSize: 13 }}>
                Autore wallet: {operator.author}
                <br />
                URI IPFS: {operator.uri}
              </div>
            </div>

            <div className="detail-card">
              <div className="detail-label">QR Holid verificabile</div>
              <div className="qr-box">
                <img src={qrUrlFor(url)} alt={`QR ${operator.holid}`} />
                <strong>{operator.holid}</strong>
                <div className="qr-link">{url}</div>
                <button className="btn secondary" onClick={copyUrl}>Copia link pubblico</button>
              </div>

              <div className="detail-label" style={{ marginTop: 18 }}>Contatti</div>
              <div>{operator.email || "Email non indicata"}</div>
              <div>{operator.phone || "Telefono non indicato"}</div>
              <div>{operator.website || "Sito web non indicato"}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HolHubDiscoveryWithQR() {
  const [fromId, setFromId] = useState("1");
  const [toId, setToId] = useState("100");
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [operators, setOperators] = useState([]);
  const [selectedOperator, setSelectedOperator] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("Pronto per leggere gli operatori pubblicati su Camino.");
  const [debug, setDebug] = useState("");
  const [requestedHolid, setRequestedHolid] = useState(getHolidFromHash());

  const stats = useMemo(() => {
    const sellers = operators.filter((o) => o.roles.includes("Seller")).length;
    const buyers = operators.filter((o) => o.roles.includes("Buyer")).length;
    const both = operators.filter((o) => o.roles.includes("Buyer") && o.roles.includes("Seller")).length;

    return { sellers, buyers, both, total: operators.length };
  }, [operators]);

  const filteredOperators = operators.filter((operator) => {
    const matchesRole =
      roleFilter === "All" || operator.roles.includes(roleFilter);

    const searchable = `${operator.holid} ${operator.name} ${operator.categoryCode} ${operator.category} ${operator.city} ${operator.country}`.toLowerCase();
    const matchesQuery = searchable.includes(query.toLowerCase());

    return matchesRole && matchesQuery;
  });

  useEffect(() => {
    function onHashChange() {
      setRequestedHolid(getHolidFromHash());
    }

    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    if (!requestedHolid) return;

    const id = parseHolidId(requestedHolid);
    if (!id) {
      setStatus(`Holid ID non valido: ${requestedHolid}`);
      return;
    }

    setFromId(String(id));
    setToId(String(id));
    setQuery(requestedHolid);
    loadOperators(String(id), String(id), requestedHolid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestedHolid]);

  async function loadOperators(customFrom = fromId, customTo = toId, autoOpenHolid = "") {
    try {
      setLoading(true);
      setStatus("Connessione a Camino Columbus...");
      setOperators([]);
      setSelectedOperator(null);
      setDebug("");

      const start = Number(customFrom);
      const end = Number(customTo);

      if (!Number.isFinite(start) || !Number.isFinite(end) || start > end) {
        throw new Error("Intervallo ID non valido.");
      }

      const provider = new ethers.JsonRpcProvider(
        "https://columbus.camino.network/ext/bc/C/rpc"
      );

      const contract = new ethers.Contract(
        BTR_CONTENT_REGISTRY,
        ABI_CONTENT,
        provider
      );

      const loaded = [];
      const notes = [];

      for (let id = start; id <= end; id++) {
        try {
          setStatus(`Lettura Content ID ${id}...`);

          const content = await contract.getContent(id);

          const contentId = Number(content[0]);
          const author = content[1];
          const uri = content[2];
          const active = Boolean(content[3]);

          if (!uri || !uri.startsWith("ipfs://")) {
            notes.push(`ID ${id}: nessun URI IPFS valido`);
            continue;
          }

          const json = await fetchIpfsJson(uri);
          const profile = normalizeProfile(json);
          const images = normalizeImages(json, profile);
          const categoryCode = detectCategoryCode(profile);

          const operator = {
            contentId,
            author,
            active,
            uri,
            categoryCode,
            holid: "",
            name: profile?.name || "Operatore senza nome",
            category: profile?.category || profile?.sector || "Categoria non indicata",
            description: profile?.description || "",
            city: profile?.address?.city || "",
            country: profile?.address?.country || "",
            email: profile?.contacts?.email || "",
            phone: profile?.contacts?.phone || "",
            website: profile?.contacts?.website || "",
            roles: extractRoles(profile),
            images
          };

          operator.holid = makeHolidId(operator);
          loaded.push(operator);

          notes.push(`ID ${id}: caricato ${operator.holid}${images.length ? ` con ${images.length} immagini` : ""}`);
        } catch (error) {
          notes.push(`ID ${id}: saltato (${error?.shortMessage || error?.message || "errore"})`);
        }
      }

      setOperators(loaded);
      setStatus(`Caricati ${loaded.length} profili operatore da Camino.`);
      setDebug(notes.slice(-35).join("\n"));

      if (autoOpenHolid) {
        const found = loaded.find((op) => op.holid === autoOpenHolid);
        if (found) {
          setSelectedOperator(found);
        } else {
          setStatus(`Nessun profilo trovato per ${autoOpenHolid}.`);
        }
      }
    } catch (error) {
      console.error(error);
      setStatus(error.message || "Errore durante la lettura degli operatori.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <StyleTag />
      <div className="shell">
        <div className="header">
          <div className="badge"><span className="dot" /> HolHub Discovery · Holid QR Verification</div>
          <h1>Operatori Buyer & Seller verificabili via QR</h1>
          <p className="subtitle">
            Legge i contenuti pubblicati su Camino Columbus, genera un Holid pubblico nel formato
            HOL-COUNTRY-CATEGORY-NUMBER e apre automaticamente la scheda quando arrivi da un QR Holid.
          </p>
        </div>

        <div className="content">
          <div className="stats">
            <StatCard label="Seller" value={stats.sellers} caption="Operatori che pubblicano servizi o inventory." />
            <StatCard label="Buyer" value={stats.buyers} caption="Operatori che possono acquistare servizi da altri attori." />
            <StatCard label="Entrambi" value={stats.both} caption="Operatori con doppio ruolo buyer/seller." />
            <StatCard label="Totale" value={stats.total} caption="Profili caricati dal registro Camino." />
          </div>

          <div className="panel">
            <div className="controls">
              <label>
                <div className="label">Da ID</div>
                <input value={fromId} onChange={(e) => setFromId(e.target.value)} />
              </label>

              <label>
                <div className="label">A ID</div>
                <input value={toId} onChange={(e) => setToId(e.target.value)} />
              </label>

              <label>
                <div className="label">Cerca</div>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cerca per Holid, nome, città, categoria..."
                />
              </label>

              <button onClick={() => loadOperators()} disabled={loading} className="btn">
                {loading ? "Lettura..." : "Carica operatori"}
              </button>
            </div>

            <div className="filters">
              {[
                ["All", "Tutti"],
                ["Seller", "Seller"],
                ["Buyer", "Buyer"]
              ].map(([role, label]) => (
                <button
                  key={role}
                  onClick={() => setRoleFilter(role)}
                  className={roleFilter === role ? "filter-btn active" : "filter-btn"}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="category-grid">
              {CATEGORY_CODES.slice(0, 12).map((cat) => (
                <div className="category-mini" key={cat.code}>
                  <div className="category-code">{cat.code}</div>
                  <div className="category-label">{cat.label}</div>
                </div>
              ))}
            </div>

            <div className="status">{status}</div>
            {debug && <div className="debug">{debug}</div>}
          </div>

          <div className="list">
            {filteredOperators.length > 0 ? (
              filteredOperators.map((operator) => (
                <OperatorRow key={operator.contentId} operator={operator} onSelect={setSelectedOperator} />
              ))
            ) : (
              <div className="empty">
                {loading ? "Caricamento profilo Holid..." : "Nessun operatore caricato al momento. Clicca “Carica operatori”."}
              </div>
            )}
          </div>
        </div>
      </div>

      <DetailModal operator={selectedOperator} onClose={() => setSelectedOperator(null)} />
    </div>
  );
}
