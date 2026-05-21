import React, { useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";

const BTR_CONTENT_REGISTRY = "0x17B8b74E1D0C50878ab8Bf5642b4E3E8702D178a";

const ABI_CONTENT = [
  "function getContent(uint256 id) external view returns (tuple(uint256 id, address author, string uri, bool active))"
];

const HOLIHUB_ICON = "data:image/png;base64,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";

const CATEGORY_CODES = [
  { code: "ADV", label: "Agenzie", full: "Agenzie di viaggio", icon: "▣", keywords: ["agenzia", "travel agency", "adv"] },
  { code: "TOP", label: "Tour Operator", full: "Tour Operator", icon: "⌬", keywords: ["tour operator", "to", "top"] },
  { code: "DMC", label: "DMC", full: "Destination Management Company", icon: "⌂", keywords: ["dmc", "destination"] },
  { code: "HTL", label: "Hotel", full: "Strutture alberghiere", icon: "▥", keywords: ["hotel", "strutture", "hospitality", "resort", "b&b", "agriturismo", "htl"] },
  { code: "EXC", label: "Esperienze", full: "Esperienze e visite", icon: "○", keywords: ["excursion", "escursione", "tour", "visita", "exc", "experience"] },
  { code: "TRF", label: "Trasporti", full: "Transfer e trasporti", icon: "▰", keywords: ["transfer", "shuttle", "ncc", "driver", "trf", "transport"] },
  { code: "SEA", label: "Nautica", full: "Nautica e turismo mare", icon: "△", keywords: ["sea", "nautica", "yacht", "sailing", "charter", "diving"] },
  { code: "F&B", label: "Food & Beverage", full: "Food & Beverage", icon: "♨", keywords: ["food", "beverage", "ristorante", "restaurant", "f&b", "bar"] },
  { code: "MICE", label: "MICE", full: "Eventi e MICE", icon: "☷", keywords: ["event", "evento", "mice", "wedding", "evt", "venue"] },
  { code: "SUP", label: "Altro", full: "Altri fornitori", icon: "…", keywords: [] }
];

function ipfsCid(uri) {
  if (!uri) return "";
  return uri.replace("ipfs://", "").trim();
}

function ipfsToGateway(uri) {
  if (!uri) return "";
  if (uri.startsWith("ipfs://")) return `https://ipfs.io/ipfs/${ipfsCid(uri)}`;
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

function isOperatorProfile(json, profile) {
  const type = String(
    json?.type ||
    profile?.type ||
    json?.recordType ||
    profile?.recordType ||
    json?.kind ||
    profile?.kind ||
    ""
  ).toLowerCase();

  const hasBookingSignals =
    type.includes("booking") ||
    type.includes("proof") ||
    type.includes("voucher") ||
    Boolean(json?.booking) ||
    Boolean(json?.bookingProof) ||
    Boolean(json?.voucher) ||
    Boolean(json?.roomBooking) ||
    Boolean(profile?.booking) ||
    Boolean(profile?.bookingProof) ||
    Boolean(profile?.voucher) ||
    Boolean(profile?.roomBooking);

  if (hasBookingSignals) return false;

  return Boolean(
    profile?.name ||
    profile?.category ||
    profile?.sector ||
    profile?.roles
  );
}

function normalizeImages(json, profile) {
  const raw = json?.photos || json?.images || json?.gallery || json?.media || profile?.photos || profile?.images || profile?.gallery || profile?.media || [];
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    if (typeof item === "string") return ipfsToGateway(item);
    if (item?.url) return ipfsToGateway(item.url);
    if (item?.uri) return ipfsToGateway(item.uri);
    if (item?.ipfsUri) return ipfsToGateway(item.ipfsUri);
    if (item?.src) return ipfsToGateway(item.src);
    return "";
  }).filter(Boolean);
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
  const found = CATEGORY_CODES.find((cat) => cat.keywords.some((keyword) => text.includes(keyword.toLowerCase())));
  return found?.code || "SUP";
}

function categoryLabel(code) {
  return CATEGORY_CODES.find((c) => c.code === code)?.full || "Fornitore";
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
  return <style>{`
    :root {
      --purple-950:#160532; --purple-900:#24075c; --purple-800:#36108a; --purple-700:#5311b7;
      --purple-600:#6d1dd4; --purple-500:#8928e8; --violet:#b91ee1; --ink:#110a36;
      --muted:#665e86; --soft:#f7f3ff; --line:#e9ddfb; --gray-logo:#a8b4bd;
    }
    * { box-sizing:border-box; }
    body { margin:0; font-family:Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background:#fbf9ff; color:var(--ink); }
    .page { min-height:100vh; background: radial-gradient(900px 420px at 12% 0%, rgba(137,40,232,.10), transparent 58%), radial-gradient(760px 520px at 96% 0%, rgba(185,30,225,.10), transparent 60%), linear-gradient(180deg,#fff 0%,#fbf8ff 54%,#fff 100%); }
    .wrap { width:min(100% - 56px, 1620px); margin:0 auto; }
    .topbar { height:102px; display:grid; grid-template-columns: 320px minmax(280px,580px) 1fr; align-items:center; gap:28px; }
    .brand { display:flex; align-items:center; gap:14px; min-width:0; }
    .brand-icon { width:78px; height:64px; object-fit:contain; flex:0 0 auto; }
    .brand-title { font-size:34px; font-weight:950; letter-spacing:-.055em; line-height:.92; white-space:nowrap; }
    .brand-title .holi { color:var(--gray-logo); }
    .brand-title .hub { background:linear-gradient(135deg,#5c15ba,#b91ee1); -webkit-background-clip:text; background-clip:text; color:transparent; }
    .brand-sub { margin-top:6px; font-size:13px; font-weight:800; color:#3b2a69; }
    .search-top { height:58px; border:1px solid var(--line); background:#faf7ff; border-radius:22px; padding:0 20px; display:flex; align-items:center; gap:14px; box-shadow: inset 0 1px 0 rgba(255,255,255,.9); }
    .search-top span { color:#381071; font-size:22px; }
    .search-top input { width:100%; border:0; outline:0; background:transparent; color:var(--ink); font-size:15px; }
    .nav { display:flex; align-items:center; justify-content:flex-end; gap:34px; font-size:14px; font-weight:950; }
    .nav a { color:#08011f; text-decoration:none; }
    .login { border:0; border-radius:16px; padding:17px 26px; font-size:14px; font-weight:950; color:white; cursor:pointer; background:linear-gradient(135deg,#3b0b88,#6d13ca); box-shadow:0 20px 40px -28px rgba(61,10,135,.85); }
    .hero { position:relative; overflow:hidden; border-radius:18px; min-height:248px; padding:46px 54px; color:white; background: radial-gradient(620px 280px at 82% 54%, rgba(185,30,225,.62), transparent 70%), radial-gradient(760px 320px at 76% 56%, rgba(122,31,214,.50), transparent 72%), linear-gradient(135deg,#1d074d 0%,#2b096e 44%,#150535 100%); box-shadow:0 30px 70px -48px rgba(25,5,76,.8); }
    .hero:before { content:""; position:absolute; right:-62px; top:-74px; width:760px; height:430px; opacity:.72; background: radial-gradient(circle at 50% 54%, rgba(255,255,255,.95) 0 4px, transparent 5px), radial-gradient(circle at 74% 38%, rgba(255,255,255,.75) 0 3px, transparent 4px), radial-gradient(circle at 30% 72%, rgba(255,255,255,.75) 0 3px, transparent 4px), radial-gradient(circle at 65% 64%, rgba(255,255,255,.45) 0 2px, transparent 3px), radial-gradient(ellipse at center, rgba(136,54,238,.58), rgba(88,20,168,.22) 50%, transparent 72%); border-radius:50%; border:1px dashed rgba(255,255,255,.34); transform:rotate(-8deg); }
    .hero:after { content:""; position:absolute; right:36px; top:-8px; width:610px; height:320px; opacity:.42; background: radial-gradient(ellipse at 60% 52%, rgba(181,106,255,.36), transparent 55%), repeating-linear-gradient(90deg, transparent 0 34px, rgba(255,255,255,.22) 35px 36px), repeating-linear-gradient(0deg, transparent 0 34px, rgba(255,255,255,.12) 35px 36px); border-radius: 50%; transform: rotate(-11deg); }
    .hero-content { position:relative; z-index:2; max-width:980px; }
    .hero h1 { margin:0 0 18px; color:white; font-size:clamp(36px,4.8vw,58px); line-height:.98; letter-spacing:-.06em; font-weight:950; }
    .hero p { margin:0; max-width:780px; font-size:20px; line-height:1.5; color:rgba(255,255,255,.92); }
    .hero-points { display:grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap:24px; margin-top:44px; max-width:920px; }
    .hero-point { display:flex; align-items:center; gap:16px; min-width:0; padding-right:24px; border-right:1px solid rgba(255,255,255,.15); }
    .hero-point:last-child { border-right:0; }
    .point-icon { width:48px; height:48px; flex:0 0 48px; display:grid; place-items:center; border-radius:16px; border:1px solid rgba(255,255,255,.35); color:white; } .point-icon svg { width:26px; height:26px; stroke-width:2.2; }
    .point-title { font-weight:950; font-size:16px; }
    .point-caption { margin-top:4px; color:rgba(255,255,255,.82); font-size:14px; }
    .dashboard { display:grid; grid-template-columns: 315px 315px 1fr; gap:18px; margin-top:28px; align-items:stretch; }
    .stat-card, .category-panel, .tools-panel, .operator-card, .benefits, .modal { background:rgba(255,255,255,.92); border:1px solid rgba(70,24,125,.10); box-shadow:0 18px 55px -42px rgba(37,7,87,.55); }
    .stat-card { border-radius:18px; padding:34px 36px; display:grid; grid-template-columns:76px 1fr; gap:24px; align-items:start; min-height:150px; }
    .stat-icon, .cat-icon, .benefit-icon { background:#f0e7ff; color:#6d13ca; display:grid; place-items:center; }
    .stat-icon { width:68px; height:68px; border-radius:50%; } .stat-icon svg { width:32px; height:32px; stroke-width:2.2; }
    .stat-value { font-size:42px; line-height:1; font-weight:950; letter-spacing:-.04em; }
    .stat-label { margin-top:8px; font-weight:950; font-size:19px; color:#23024e; }
    .stat-text { margin-top:8px; color:#544979; font-size:13px; line-height:1.45; }
    .category-panel { border-radius:18px; padding:26px 34px; }
    .panel-head { display:flex; align-items:center; justify-content:space-between; gap:20px; margin-bottom:20px; }
    .panel-title { font-size:20px; font-weight:950; letter-spacing:-.02em; color:#100433; }
    .see-all { border:0; background:transparent; color:#6d13ca; font-size:14px; font-weight:950; text-decoration:none; cursor:pointer; padding:0; }
    .cat-grid { display:grid; grid-template-columns: repeat(5,minmax(0,1fr)); gap:22px 28px; }
    .cat-item { display:grid; grid-template-columns:54px 1fr; gap:14px; align-items:center; min-width:0; }
    .cat-icon { width:48px; height:48px; border-radius:12px; } .cat-icon svg { width:25px; height:25px; stroke-width:2.1; }
    .cat-label { font-size:14px; line-height:1.1; font-weight:900; color:#150538; }
    .cat-count { margin-top:6px; color:#5c09bd; font-size:14px; font-weight:950; }
    .tools-panel { margin-top:20px; border-radius:18px; padding:24px; }
    .tools-grid { display:grid; grid-template-columns: 1fr 1fr 1.8fr auto; gap:14px; align-items:end; }
    .field label { display:block; color:#766994; font-size:11px; font-weight:950; text-transform:uppercase; letter-spacing:.08em; margin-bottom:8px; }
    .field input, .field select { width:100%; height:52px; border:1px solid var(--line); background:#fbf8ff; color:var(--ink); border-radius:16px; padding:0 16px; font-size:14px; outline:0; }
    .field input:focus, .field select:focus { border-color:#b88bea; box-shadow:0 0 0 4px rgba(109,19,202,.10); }
    .load-btn { height:52px; border:0; border-radius:16px; padding:0 26px; color:white; font-weight:950; background:linear-gradient(135deg,#4c0baa,#8a20df); cursor:pointer; white-space:nowrap; }
    .load-btn:disabled { opacity:.55; cursor:not-allowed; }
    .status { margin-top:14px; color:#5e527c; font-size:13px; font-weight:800; }
    .debug-details { margin-top:14px; color:#5e527c; font-size:13px; font-weight:850; }
    .debug-details summary { cursor:pointer; }
    .debug { margin-top:10px; border-radius:16px; background:#12052e; color:#eee7ff; padding:14px; font-size:12px; white-space:pre-wrap; overflow:auto; max-height:180px; }
    .section-head { margin:28px 0 16px; display:flex; align-items:center; justify-content:space-between; }
    .section-title { margin:0; font-size:22px; font-weight:950; letter-spacing:-.025em; color:#100433; }
    .operator-grid { display:grid; grid-template-columns: repeat(5,minmax(0,1fr)); gap:22px; }
    .operator-card { border-radius:16px; overflow:hidden; text-align:left; cursor:pointer; padding:0; transition:.16s ease; }
    .operator-card:hover { transform:translateY(-3px); box-shadow:0 24px 70px -42px rgba(37,7,87,.65); }
    .op-image { height:138px; position:relative; background:linear-gradient(135deg,#eae0ff,#f8fbff); overflow:hidden; }
    .op-image img { width:100%; height:100%; object-fit:cover; display:block; }
    .op-fallback { height:100%; display:grid; place-items:center; color:#6d13ca; font-size:38px; font-weight:950; }
    .verified-badge { position:absolute; top:14px; right:14px; border-radius:999px; padding:8px 12px; background:white; color:#5c09bd; font-size:12px; font-weight:950; box-shadow:0 12px 28px -20px rgba(26,4,64,.8); }
    .op-avatar { position:absolute; left:18px; bottom:-30px; width:76px; height:76px; border-radius:50%; border:5px solid white; background:white; display:grid; place-items:center; color:#26045b; font-weight:950; font-size:19px; box-shadow:0 16px 28px -24px rgba(0,0,0,.65); }
    .op-body { padding:42px 18px 18px; }
    .op-name { margin:0; font-size:19px; line-height:1.08; letter-spacing:-.03em; color:#12042f; font-weight:950; }
    .op-location { margin-top:10px; color:#2a1457; font-size:13px; display:flex; gap:6px; align-items:center; }
    .op-pill { display:inline-flex; margin-top:12px; border-radius:999px; padding:7px 11px; background:#efe3ff; color:#5c09bd; font-size:12px; font-weight:900; }
    .op-time { margin-top:14px; color:#63577d; font-size:13px; }
    .empty { border:1px dashed #d8c5ef; background:rgba(255,255,255,.72); border-radius:18px; padding:38px; text-align:center; color:#675b82; font-weight:800; }
    .benefits { margin:28px 0 18px; border-radius:18px; display:grid; grid-template-columns: repeat(4,1fr); overflow:hidden; }
    .benefit { padding:26px 28px; display:grid; grid-template-columns:70px 1fr; gap:20px; align-items:center; border-right:1px solid rgba(70,24,125,.10); }
    .benefit:last-child { border-right:0; }
    .benefit-icon { width:70px; height:70px; border-radius:50%; } .benefit-icon svg { width:34px; height:34px; stroke-width:2.1; }
    .benefit h3 { margin:0; font-size:18px; color:#5c09bd; letter-spacing:-.02em; }
    .benefit p { margin:8px 0 0; color:#2d1a59; font-size:14px; line-height:1.45; }
    .footer { margin-top:18px; background:linear-gradient(135deg,#21074c,#15042f); color:white; }
    .footer .wrap { height:88px; display:flex; align-items:center; justify-content:space-between; gap:22px; }
    .footer-brand { display:flex; align-items:center; gap:12px; }
    .footer-brand img { width:54px; height:44px; object-fit:contain; filter:brightness(1.3); }
    .footer-title { font-size:27px; font-weight:950; letter-spacing:-.05em; }
    .footer-links { display:flex; gap:38px; color:rgba(255,255,255,.9); font-size:14px; }
    .modal-backdrop { position:fixed; inset:0; z-index:50; padding:24px; background:rgba(17,7,45,.55); backdrop-filter:blur(10px); display:flex; align-items:center; justify-content:center; }
    .modal { width:min(1040px,100%); max-height:90vh; overflow:auto; border-radius:28px; background:white; box-shadow:0 40px 120px -52px rgba(0,0,0,.8); }
    .modal-hero { height:280px; position:relative; background:linear-gradient(135deg,#eee5ff,#f8fbff); overflow:hidden; }
    .modal-hero img { width:100%; height:100%; object-fit:cover; display:block; }
    .modal-close { position:absolute; right:18px; top:18px; border:0; border-radius:999px; background:rgba(18,4,47,.76); color:white; padding:11px 14px; font-weight:950; cursor:pointer; }
    .modal-body { padding:28px; }
    .modal-title { margin:0; color:#100433; font-size:34px; letter-spacing:-.045em; }
    .holid { display:inline-flex; margin-top:12px; border-radius:999px; padding:8px 12px; background:#efe3ff; color:#5c09bd; border:1px solid #dfc9ff; font-size:12px; font-weight:950; }
    .meta { margin-top:10px; color:#5e527c; font-size:14px; line-height:1.5; }
    .modal-grid { margin-top:20px; display:grid; grid-template-columns:1fr 320px; gap:20px; }
    .detail-card { border-radius:20px; border:1px solid rgba(70,24,125,.10); background:#fbf8ff; padding:18px; }
    .detail-label { color:#7b7094; font-size:11px; font-weight:950; text-transform:uppercase; letter-spacing:.08em; margin-bottom:9px; }
    .description { color:#5d5376; font-size:14px; line-height:1.55; }
    .qr-box { display:grid; gap:12px; place-items:center; border-radius:20px; background:white; border:1px solid #dfc9ff; padding:18px; text-align:center; }
    .qr-box img { width:190px; height:190px; border-radius:14px; }
    .qr-link { color:#675b82; font-size:12px; word-break:break-all; }
    .secondary-btn { border:1px solid #dfc9ff; background:#fff; color:#5c09bd; border-radius:14px; padding:12px 16px; font-weight:950; cursor:pointer; }
    .gallery { display:grid; grid-template-columns: repeat(3,1fr); gap:8px; margin-top:12px; }
    .gallery img { width:100%; height:86px; object-fit:cover; border-radius:14px; }
    .technical { margin-top:18px; color:#5e527c; font-size:13px; font-weight:800; }
    .technical summary { cursor:pointer; color:#5c09bd; }
    .technical-box { margin-top:10px; border-radius:16px; background:#12052e; color:#eee7ff; padding:14px; font-size:12px; word-break:break-all; line-height:1.55; }
    @media (max-width:1250px) { .topbar{grid-template-columns:280px 1fr;} .nav{grid-column:1/-1; justify-content:flex-start; padding-bottom:16px;} .topbar{height:auto; padding:18px 0;} .dashboard{grid-template-columns:1fr 1fr;} .category-panel{grid-column:1/-1;} .operator-grid{grid-template-columns:repeat(3,1fr);} .cat-grid{grid-template-columns:repeat(3,1fr);} }
    @media (max-width:850px) { .wrap{width:min(100% - 28px, 1620px);} .topbar{grid-template-columns:1fr;} .brand-title{font-size:30px;} .hero{padding:34px 24px;} .hero-points{grid-template-columns:1fr;} .hero-point{border-right:0; padding-right:0;} .dashboard{grid-template-columns:1fr;} .tools-grid{grid-template-columns:1fr;} .operator-grid{grid-template-columns:1fr;} .benefits{grid-template-columns:1fr;} .benefit{border-right:0;border-bottom:1px solid rgba(70,24,125,.10);} .modal-grid{grid-template-columns:1fr;} .footer .wrap{height:auto; padding:22px 0; flex-direction:column; align-items:flex-start;} .cat-grid{grid-template-columns:1fr 1fr;} }
  `}</style>;
}

function Logo({ footer = false }) {
  return (
    <div className="brand">
      <img className="brand-icon" src={HOLIHUB_ICON} alt="Holihub" />
      <div>
        <div className="brand-title"><span className="holi">Holi</span><span className="hub">hub</span></div>
        <div className="brand-sub">Rete & Fiducia del Turismo</div>
      </div>
    </div>
  );
}


function Icon({ name }) {
  const common = { fill: "none", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", viewBox: "0 0 24 24", "aria-hidden": "true" };
  const paths = {
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
    shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-5"/></>,
    network: <><circle cx="12" cy="5" r="3"/><circle cx="5" cy="19" r="3"/><circle cx="19" cy="19" r="3"/><path d="M10.4 7.6 6.6 16.4"/><path d="m13.6 7.6 3.8 8.8"/><path d="M8 19h8"/></>,
    badge: <><path d="M12 3 14.3 7.7 19.5 8.4 15.8 12 16.7 17.2 12 14.7 7.3 17.2 8.2 12 4.5 8.4 9.7 7.7 12 3Z"/><path d="M8 21h8"/></>,
    building: <><path d="M4 21V7a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v14"/><path d="M16 11h2a2 2 0 0 1 2 2v8"/><path d="M8 9h4"/><path d="M8 13h4"/><path d="M8 17h4"/></>,
    briefcase: <><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M3 12h18"/></>,
    home: <><path d="m3 11 9-8 9 8"/><path d="M5 10v11h14V10"/><path d="M9 21v-6h6v6"/></>,
    bus: <><rect x="5" y="3" width="14" height="16" rx="2"/><path d="M7 8h10"/><path d="M7 13h10"/><circle cx="8" cy="17" r="1"/><circle cx="16" cy="17" r="1"/><path d="M8 21h8"/></>,
    sail: <><path d="M4 20h16"/><path d="M7 18 12 4v14"/><path d="M12 6c3 2 5 5 6 9h-6"/></>,
    food: <><path d="M4 3v8"/><path d="M8 3v8"/><path d="M4 7h4"/><path d="M6 11v10"/><path d="M16 3v18"/><path d="M16 3c3 2 3 6 0 8"/></>,
    gear: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2 3-.2-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21h-3.4v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.2.1-2-3 .1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H5v-3.4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1 2-3 .2.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5V3h3.4v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.2-.1 2 3-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1h.1v3.4h-.1a1.7 1.7 0 0 0-1.5 1Z"/></>,
    dots: <><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></>,
    lock: <><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>,
    pin: <><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="3"/></>
  };
  return <svg {...common}>{paths[name] || paths.dots}</svg>;
}

function StatCard({ value, label, text }) {
  return (
    <div className="stat-card">
      <div className="stat-icon"><Icon name="users" /></div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        <div className="stat-text">{text}</div>
      </div>
    </div>
  );
}

function CategoryPanel({ operators, onCategory }) {
  const categories = CATEGORY_CODES.slice(0, 10).map((cat) => ({
    ...cat,
    total: operators.filter((op) => op.categoryCode === cat.code || (cat.code === "SUP" && !CATEGORY_CODES.some((c) => c.code === op.categoryCode))).length
  }));

  return (
    <div className="category-panel">
      <div className="panel-head">
        <div className="panel-title">Operatori per categoria</div>
        <button className="see-all" onClick={() => onCategory("All")}>Vedi tutte →</button>
      </div>
      <div className="cat-grid">
        {categories.map((cat) => (
          <button key={cat.code} className="cat-item" onClick={() => onCategory(cat.code)} style={{ border: 0, background: "transparent", padding: 0, textAlign: "left", cursor: "pointer" }}>
            <div className="cat-icon"><Icon name={cat.code === "HTL" ? "building" : cat.code === "TOP" ? "network" : cat.code === "DMC" ? "home" : cat.code === "TRF" ? "bus" : cat.code === "SEA" ? "sail" : cat.code === "F&B" ? "food" : cat.code === "MICE" ? "users" : cat.code === "SUP" ? "dots" : "briefcase"} /></div>
            <div>
              <div className="cat-label">{cat.label}</div>
              <div className="cat-count">{cat.total}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function OperatorCard({ operator, onSelect }) {
  const firstImage = operator.images?.[0];
  const initials = operator.name?.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "HH";
  return (
    <button className="operator-card" onClick={() => onSelect(operator)}>
      <div className="op-image">
        {firstImage ? <img src={firstImage} alt={operator.name} /> : <div className="op-fallback">{initials}</div>}
        <div className="verified-badge">Verificato</div>
        <div className="op-avatar">{initials}</div>
      </div>
      <div className="op-body">
        <h3 className="op-name">{operator.name || "Operatore senza nome"}</h3>
        <div className="op-location"><span style={{width:16,height:16,display:"inline-grid"}}><Icon name="pin" /></span> {operator.city || "Città non indicata"}, {operator.country || "Paese non indicato"}</div>
        <div className="op-pill">{categoryLabel(operator.categoryCode)}</div>
        <div className="op-time">Profilo verificabile Holid</div>
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
          <h2 className="modal-title">{operator.name}</h2>
          <div className="holid">{operator.holid}</div>
          <div className="meta">Profilo ID {operator.contentId} · {categoryLabel(operator.categoryCode)} · {operator.city || "Città non indicata"}, {operator.country || "Paese non indicato"}</div>
          <div className="modal-grid">
            <div className="detail-card">
              <div className="detail-label">Descrizione</div>
              <div className="description">{operator.description || "Descrizione non disponibile."}</div>
              {operator.images?.length > 1 && (
                <>
                  <div className="detail-label" style={{ marginTop: 18 }}>Gallery</div>
                  <div className="gallery">
                    {operator.images.slice(1, 7).map((src, i) => <img key={i} src={src} alt={`${operator.name} ${i + 1}`} />)}
                  </div>
                </>
              )}
              <details className="technical">
                <summary>Dettagli tecnici di verifica</summary>
                <div className="technical-box">
                  Camino registry: {BTR_CONTENT_REGISTRY}<br />
                  Autore wallet: {operator.author}<br />
                  URI IPFS: {operator.uri}
                </div>
              </details>
            </div>
            <div className="detail-card">
              <div className="detail-label">QR Holid verificabile</div>
              <div className="qr-box">
                <img src={qrUrlFor(url)} alt={`QR ${operator.holid}`} />
                <strong>{operator.holid}</strong>
                <div className="qr-link">{url}</div>
                <button className="secondary-btn" onClick={copyUrl}>Copia link pubblico</button>
              </div>
              <div className="detail-label" style={{ marginTop: 18 }}>Contatti</div>
              <div className="description">
                {operator.email || "Email non indicata"}<br />
                {operator.phone || "Telefono non indicato"}<br />
                {operator.website || "Sito web non indicato"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HolihubDiscovery() {
  const [fromId, setFromId] = useState("1");
  const [toId, setToId] = useState("100");
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [operators, setOperators] = useState([]);
  const [selectedOperator, setSelectedOperator] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("Pronto per leggere i profili verificabili da Camino.");
  const [debug, setDebug] = useState("");
  const [requestedHolid, setRequestedHolid] = useState(getHolidFromHash());

  const stats = useMemo(() => {
    const sellers = operators.filter((o) => o.roles.includes("Seller")).length;
    const buyers = operators.filter((o) => o.roles.includes("Buyer")).length;
    return { sellers, buyers, total: operators.length };
  }, [operators]);

  const filteredOperators = operators.filter((operator) => {
    const searchable = `${operator.holid} ${operator.name} ${operator.categoryCode} ${operator.category} ${operator.city} ${operator.country}`.toLowerCase();
    const matchesQuery = searchable.includes(query.toLowerCase());
    const matchesCategory = categoryFilter === "All" || operator.categoryCode === categoryFilter;
    return matchesQuery && matchesCategory;
  });

  const latestOperators = [...operators].sort((a, b) => b.contentId - a.contentId).slice(0, 5);

  function showAllOperators() {
    setCategoryFilter("All");
    setTimeout(() => {
      document.getElementById("all-operators")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  useEffect(() => {
    function onHashChange() { setRequestedHolid(getHolidFromHash()); }
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
      if (!Number.isFinite(start) || !Number.isFinite(end) || start > end) throw new Error("Intervallo profili non valido.");

      const provider = new ethers.JsonRpcProvider("https://columbus.camino.network/ext/bc/C/rpc");
      const contract = new ethers.Contract(BTR_CONTENT_REGISTRY, ABI_CONTENT, provider);
      const loaded = [];
      const notes = [];

      for (let id = start; id <= end; id++) {
        try {
          setStatus(`Lettura profilo ${id}...`);
          const content = await contract.getContent(id);
          const contentId = Number(content[0]);
          const author = content[1];
          const uri = content[2];
          const active = Boolean(content[3]);
          if (!uri || !uri.startsWith("ipfs://")) {
            notes.push(`Profilo ${id}: nessun contenuto pubblico valido`);
            continue;
          }

          const json = await fetchIpfsJson(uri);
          const profile = normalizeProfile(json);

          if (!isOperatorProfile(json, profile)) {
            notes.push(`Profilo ${id}: nascosto perché non è un profilo operatore Holihub`);
            continue;
          }

          const images = normalizeImages(json, profile);
          const categoryCode = detectCategoryCode(profile);
          const operator = {
            contentId, author, active, uri, categoryCode,
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
          notes.push(`Profilo ${id}: caricato ${operator.holid}`);
        } catch (error) {
          notes.push(`Profilo ${id}: saltato (${error?.shortMessage || error?.message || "errore"})`);
        }
      }

      setOperators(loaded);
      setStatus(`Caricati ${loaded.length} profili verificabili da Camino.`);
      setDebug(notes.slice(-35).join("\n"));
      if (autoOpenHolid) {
        const found = loaded.find((op) => op.holid === autoOpenHolid);
        if (found) setSelectedOperator(found);
        else setStatus(`Nessun profilo trovato per ${autoOpenHolid}.`);
      }
    } catch (error) {
      console.error(error);
      setStatus(error.message || "Errore durante la lettura dei profili.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <StyleTag />
      <div className="wrap">
        <header className="topbar">
          <Logo />
          <div className="search-top">
            <span>⌕</span>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cerca hotel, operatori, esperienze..." />
          </div>
          <nav className="nav">
            <a href="#explore">Esplora</a>
            <a href="#about">Chi siamo</a>
            <a href="#contacts">Contatti</a>
            <button className="login">Accedi / Registrati</button>
          </nav>
        </header>

        <section className="hero">
          <div className="hero-content">
            <h1>Scopri. Connettiti. Collabora.</h1>
            <p>La rete pubblica degli operatori del turismo, con identità e contenuti verificabili su Camino.</p>
            <div className="hero-points">
              <div className="hero-point"><div className="point-icon"><Icon name="shield" /></div><div><div className="point-title">Operatori verificati</div><div className="point-caption">Identità e contenuti verificabili</div></div></div>
              <div className="hero-point"><div className="point-icon"><Icon name="network" /></div><div><div className="point-title">Rete globale</div><div className="point-caption">Collaborazioni e accordi B2B</div></div></div>
              <div className="hero-point"><div className="point-icon"><Icon name="badge" /></div><div><div className="point-title">Fiducia e trasparenza</div><div className="point-caption">Verifiche pubbliche e immutabili</div></div></div>
            </div>
          </div>
        </section>

        <section className="dashboard">
          <StatCard value={stats.buyers} label="Buyer" text="Operatori che acquistano servizi da altri attori della rete." />
          <StatCard value={stats.sellers} label="Seller" text="Operatori che pubblicano servizi, inventory o contenuti." />
          <CategoryPanel operators={operators} onCategory={setCategoryFilter} />
        </section>

        <section className="tools-panel">
          <div className="tools-grid">
            <div className="field"><label>Da profilo</label><input value={fromId} onChange={(e) => setFromId(e.target.value)} /></div>
            <div className="field"><label>A profilo</label><input value={toId} onChange={(e) => setToId(e.target.value)} /></div>
            <div className="field"><label>Categoria</label><select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}><option value="All">Tutte le categorie</option>{CATEGORY_CODES.map((cat) => <option key={cat.code} value={cat.code}>{cat.full}</option>)}</select></div>
            <button onClick={() => loadOperators()} disabled={loading} className="load-btn">{loading ? "Lettura..." : "Carica profili"}</button>
          </div>
          <div className="status">{status}</div>
          {debug && <details className="debug-details"><summary>Dettagli tecnici</summary><div className="debug">{debug}</div></details>}
        </section>

        <section id="explore">
          <div className="section-head">
            <h2 className="section-title">Ultimi operatori registrati</h2>
            <button className="see-all" onClick={showAllOperators}>Vedi tutti →</button>
          </div>
          {latestOperators.length > 0 ? (
            <div className="operator-grid">
              {latestOperators.map((operator) => <OperatorCard key={operator.contentId} operator={operator} onSelect={setSelectedOperator} />)}
            </div>
          ) : (
            <div className="empty">{loading ? "Caricamento profili Holid..." : "Nessun profilo caricato. Clicca “Carica profili” per leggere gli operatori verificabili da Camino."}</div>
          )}
        </section>

        <section id="all-operators">
          <div className="section-head">
            <h2 className="section-title">Tutti gli operatori verificabili</h2>
            <div className="status" style={{ marginTop: 0 }}>{filteredOperators.length} profili visualizzati</div>
          </div>
          {filteredOperators.length > 0 ? (
            <div className="operator-grid">
              {filteredOperators.map((operator) => <OperatorCard key={`all-${operator.contentId}`} operator={operator} onSelect={setSelectedOperator} />)}
            </div>
          ) : (
            <div className="empty">{loading ? "Caricamento profili Holid..." : "Nessun operatore trovato con i filtri attuali."}</div>
          )}
        </section>

        <section className="benefits" id="about">
          <div className="benefit"><div className="benefit-icon"><Icon name="shield" /></div><div><h3>Identità Verificate</h3><p>Ogni operatore è verificato con Holid e registrato su Camino.</p></div></div>
          <div className="benefit"><div className="benefit-icon"><Icon name="lock" /></div><div><h3>Contenuti di proprietà</h3><p>I contenuti sono tuoi. Sempre. Su IPFS.</p></div></div>
          <div className="benefit"><div className="benefit-icon"><Icon name="network" /></div><div><h3>Rete & Collaborazioni</h3><p>Entra in contatto, crea accordi e sviluppa nuove opportunità.</p></div></div>
          <div className="benefit"><div className="benefit-icon"><Icon name="badge" /></div><div><h3>Fiducia Immutabile</h3><p>Verifiche pubbliche, immutabili e sempre consultabili.</p></div></div>
        </section>
      </div>

      <footer className="footer" id="contacts">
        <div className="wrap">
          <div className="footer-brand"><img src={HOLIHUB_ICON} alt="Holihub" /><div><div className="footer-title"><span style={{ color: "#a8b4bd" }}>Holi</span><span style={{ color: "#b91ee1" }}>hub</span></div><div>Rete & Fiducia del Turismo</div></div></div>
          <div className="footer-links"><span>Esplora</span><span>Chi siamo</span><span>Contatti</span><span>Privacy</span><span>Termini</span></div>
          <div>© 2025 Holihub. Tutti i diritti riservati.</div>
        </div>
      </footer>
      <DetailModal operator={selectedOperator} onClose={() => setSelectedOperator(null)} />
    </div>
  );
}
