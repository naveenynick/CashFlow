// Polyfill fetch for older Node versions
if (!globalThis.fetch) {
  const nodeFetch = require('node-fetch');
  globalThis.fetch = nodeFetch;
}

const API_BASE = "https://appctrl204.sahakari.patanjaliayurved.org/bposmainapi/api";

const storeApiConfigs = {
  sion: {
    origin: "https://507581.sahakari.patanjaliayurved.org/",
    username: "admin",
    password: "12345"
  },
  andheri: {
    origin: "https://122606.sahakari.patanjaliayurved.org/",
    username: "admin",
    password: "871989"
  }
};

function dashboardHeaders(origin, token) {
  const headers = {
    Accept: "*/*",
    "User-Agent": "Thunder Client (https://www.thunderclient.com/)",
    Origin: origin,
    Referer: origin
  };
  if (token) headers.Authorization = token;
  return headers;
}

function isoToDashboardDate(date) {
  const [year, month, day] = String(date || "").split("-");
  if (!year || !month || !day) throw new Error("A valid entry date is required.");
  return `${month}/${day}/${year}`;
}

function bearerToken(tokenValue) {
  if (!tokenValue) throw new Error("JWT response did not include a token.");
  return String(tokenValue).startsWith("Bearer ") ? String(tokenValue) : `Bearer ${tokenValue}`;
}

async function fetchSystemSale(storeId, isoDate) {
  const config = storeApiConfigs[storeId];
  if (!config) throw new Error("Unknown store for system sale lookup.");

  const jwtResponse = await fetch(`${API_BASE}/jwt`, {
    method: "POST",
    headers: {
      ...dashboardHeaders(config.origin),
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      username: config.username,
      password: config.password,
      isOffline: 0,
      appType: 1
    })
  });

  if (!jwtResponse.ok) {
    const errorText = await jwtResponse.text().catch(() => "");
    throw new Error(`JWT request failed with status ${jwtResponse.status}. ${errorText.slice(0, 120)}`);
  }

  const jwtData = await jwtResponse.json();
  const token = bearerToken(jwtData.token || jwtData.result?.token || jwtData.access_token);
  const dashboardDate = isoToDashboardDate(isoDate);

  const dashboardResponse = await fetch(`${API_BASE}/getBusinessDashboard?date=${encodeURIComponent(dashboardDate)}`, {
    headers: dashboardHeaders(config.origin, token)
  });

  if (!dashboardResponse.ok) {
    const errorText = await dashboardResponse.text().catch(() => "");
    throw new Error(`Dashboard request failed with status ${dashboardResponse.status}. ${errorText.slice(0, 120)}`);
  }

  const dashboardData = await dashboardResponse.json();
  const dashboardsales = dashboardData.result?.dashboardsales || {};
  const dashboardtender = dashboardData.result?.dashboardtender || {};

  return {
    date: isoDate,
    dashboardDate,
    todaysale: Math.round(Number(dashboardsales.Todaysale) || 0),
    sambridhi: Math.round(Number(dashboardtender.Sambridhi) || 0)
  };
}

exports.handler = async (event) => {
  try {
    const payload = await fetchSystemSale(event.queryStringParameters?.store, event.queryStringParameters?.date);
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      },
      body: JSON.stringify(payload)
    };
  } catch (error) {
    return {
      statusCode: 502,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      },
      body: JSON.stringify({ error: error.message || "Could not fetch system sale." })
    };
  }
};
