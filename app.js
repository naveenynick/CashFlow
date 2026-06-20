const denominations = [
  { key: "n500", label: "₹500", value: 500 },
  { key: "n100", label: "₹100", value: 100 },
  { key: "n50", label: "₹50", value: 50 },
  { key: "n20", label: "₹20", value: 20 },
  { key: "n10", label: "₹10", value: 10 },
  { key: "coins", label: "Coins", amountMode: true },
  { key: "milkLeft", label: "Milk Left", amountMode: true },
  { key: "bundle", label: "Bundle", amountMode: true }
];

const storeConfigs = [
  {
    id: "sion",
    title: "Sion Cash Flow",
    storeLabel: "OM PATANJALI AYURVED",
    supabaseUrl: "https://prpgmphpecwnkeklnupy.supabase.co",
    supabasePublishableKey: "sb_publishable_isydLWDaXWw_9Wl0b81whw__0bGYfWv"
  },
  {
    id: "andheri",
    title: "Andheri Cash Flow",
    storeLabel: "OM SHIV SHAKTI ENTERPRISES",
    supabaseUrl: "https://tksnvmdueqpeqddvqeqp.supabase.co",
    supabasePublishableKey: "sb_publishable_Na_Ei0GL-B0wMXPgDK_90g_LFIvAzVI"
  }
];
const tableName = "daily_cash_entries";
let activeStore;
let currentEntryDate = "";
let formModified = false;
let baseYesterdayBalance = null;

const elements = {
  storeEyebrow: document.querySelector("#storeEyebrow"),
  appTitle: document.querySelector("#appTitle"),
  appShell: document.querySelector("#appShell"),
  authShell: document.querySelector("#authShell"),
  loginForm: document.querySelector("#loginForm"),
  loginEmail: document.querySelector("#loginEmail"),
  loginPassword: document.querySelector("#loginPassword"),
  authMessage: document.querySelector("#authMessage"),
  signOutButton: document.querySelector("#signOutButton"),
  dbStatus: document.querySelector("#dbStatus"),
  drawerTotal: document.querySelector("#drawerTotal"),
  digitalPaymentsTotal: document.querySelector("#digitalPaymentsTotal"),
  calculatedSaleTotal: document.querySelector("#calculatedSaleTotal"),
  paymentGrandTotal: document.querySelector("#paymentGrandTotal"),
  saleDifference: document.querySelector("#saleDifference"),
  differenceResult: document.querySelector("#differenceResult"),
  cashBreakdownTotal: document.querySelector("#cashBreakdownTotal"),
  totalCashSaleToday: document.querySelector("#totalCashSaleToday"),
  denominationGrid: document.querySelector("#denominationGrid"),
  entryForm: document.querySelector("#entryForm"),
  entryDate: document.querySelector("#entryDate"),
  yesterdayBalance: document.querySelector("#yesterdayBalance"),
  cardSettlement: document.querySelector("#cardSettlement"),
  sscSettlement: document.querySelector("#sscSettlement"),
  upiSettlement: document.querySelector("#upiSettlement"),
  systemSale: document.querySelector("#systemSale"),
  bankDepositCash: document.querySelector("#bankDepositCash"),
  bankDepositSsc: document.querySelector("#bankDepositSsc"),
  bankDepositTotal: document.querySelector("#bankDepositTotal"),
  notes: document.querySelector("#notes"),
  searchDate: document.querySelector("#searchDate"),
  loadDateButton: document.querySelector("#loadDateButton"),
  newEntryButton: document.querySelector("#newEntryButton"),
  deleteButton: document.querySelector("#deleteButton"),
  saveButton: document.querySelector("#saveButton"),
  saveMessage: document.querySelector("#saveMessage"),
  historyList: document.querySelector("#historyList")
};

function money(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(Number(value) || 0);
}

function signedMoney(value) {
  const amount = Number(value) || 0;
  if (Math.abs(amount) < 0.5) return money(0);
  return `${amount > 0 ? "+" : "-"}${money(Math.abs(amount))}`;
}

function numberValue(element) {
  return Number.parseInt(element.value, 10) || 0;
}

function entryValue(value, fallback = "") {
  return value ?? fallback;
}

function entryNumberValue(value) {
  return Number.parseInt(value, 10) || 0;
}

function updateYesterdayBalanceFromBankCash() {
  const depositCash = numberValue(elements.bankDepositCash);
  if (baseYesterdayBalance === null) {
    baseYesterdayBalance = numberValue(elements.yesterdayBalance) + depositCash;
  }
  const adjusted = Math.max(0, baseYesterdayBalance - depositCash);
  elements.yesterdayBalance.value = adjusted;
  calculate();
}

function syncBaseYesterdayBalanceFromUserInput() {
  baseYesterdayBalance = numberValue(elements.yesterdayBalance) + numberValue(elements.bankDepositCash);
}

function integerInputValue(value) {
  const digitsOnly = String(value ?? "").replace(/\D/g, "");
  return digitsOnly.replace(/^0+(?=\d)/, "");
}

function normalizeIntegerInput(input) {
  const nextValue = integerInputValue(input.value);
  if (input.value !== nextValue) input.value = nextValue;
}

function setupIntegerInputs(root = document) {
  root.querySelectorAll('input[type="number"]').forEach((input) => {
    input.step = "1";
    input.inputMode = "numeric";
    input.pattern = "[0-9]*";

    normalizeIntegerInput(input);

    input.addEventListener("keydown", (event) => {
      if (event.key === "ArrowUp" || event.key === "ArrowDown") {
        event.preventDefault();
      }
    });

    input.addEventListener("input", () => normalizeIntegerInput(input));
  });
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(date, days) {
  const [year, month, day] = date.split("-").map(Number);
  const nextDate = new Date(year, month - 1, day + days);
  const nextYear = nextDate.getFullYear();
  const nextMonth = String(nextDate.getMonth() + 1).padStart(2, "0");
  const nextDay = String(nextDate.getDate()).padStart(2, "0");
  return `${nextYear}-${nextMonth}-${nextDay}`;
}

function buildDenominations() {
  elements.denominationGrid.innerHTML = denominations
    .map((item) => {
      const help = item.amountMode ? "Enter total rupee value" : `Note value: ${money(item.value)}`;
      return `
        <div class="denomination-card">
          <label>
            ${item.label}
            <input type="number" min="0" step="1" inputmode="numeric" pattern="[0-9]*" required data-denomination="${item.key}">
          </label>
          <span id="${item.key}Total">${help}</span>
        </div>
      `;
    })
    .join("");
}

function getDenominationCounts() {
  return denominations.reduce((counts, item) => {
    const input = document.querySelector(`[data-denomination="${item.key}"]`);
    counts[item.key] = Number.parseInt(input.value, 10) || 0;
    return counts;
  }, {});
}

function calculate(counts = getDenominationCounts()) {
  const cashDrawer = denominations.reduce((total, item) => {
    const amount = counts[item.key] || 0;
    return total + (item.amountMode ? amount : amount * item.value);
  }, 0);
  const sscSettlement = numberValue(elements.sscSettlement);
  const cardSettlement = numberValue(elements.cardSettlement);
  const upiSettlement = numberValue(elements.upiSettlement);
  const digitalPayments = sscSettlement + cardSettlement + upiSettlement;
  const yesterdayBalance = numberValue(elements.yesterdayBalance);
  const totalCashSaleToday = cashDrawer - yesterdayBalance;
  const calculatedSale = totalCashSaleToday + digitalPayments;
  const systemSale = numberValue(elements.systemSale);
  const difference = calculatedSale - systemSale;
  const bankDepositCash = numberValue(elements.bankDepositCash);
  const bankDepositSsc = numberValue(elements.bankDepositSsc);
  const bankDeposit = bankDepositCash + bankDepositSsc;

  denominations.forEach((item) => {
    const amount = counts[item.key] || 0;
    const total = item.amountMode ? amount : amount * item.value;
    const label = document.querySelector(`#${item.key}Total`);
    label.textContent = item.amountMode ? `Amount: ${money(total)}` : `Total: ${money(total)}`;
  });

  const differenceText = signedMoney(difference);
  const differenceClass = difference > 0 ? "positive" : difference < 0 ? "negative" : "";

  if (elements.drawerTotal) elements.drawerTotal.textContent = money(cashDrawer);
  elements.cashBreakdownTotal.textContent = money(cashDrawer);
  elements.totalCashSaleToday.textContent = money(totalCashSaleToday);
  if (elements.digitalPaymentsTotal) elements.digitalPaymentsTotal.textContent = money(digitalPayments);
  if (elements.calculatedSaleTotal) elements.calculatedSaleTotal.textContent = money(calculatedSale);
  elements.paymentGrandTotal.textContent = money(calculatedSale);
  elements.bankDepositTotal.textContent = money(bankDeposit);
  if (elements.saleDifference) elements.saleDifference.textContent = differenceText;
  elements.differenceResult.textContent = differenceText;
  [elements.saleDifference, elements.differenceResult].filter(Boolean).forEach((node) => {
    node.classList.toggle("positive", differenceClass === "positive");
    node.classList.toggle("negative", differenceClass === "negative");
  });

  return {
    cashDrawer,
    sscSettlement,
    cardSettlement,
    upiSettlement,
    yesterdayBalance,
    totalCashSaleToday,
    digitalPayments,
    calculatedSale,
    systemSale,
    difference,
    bankDepositCash,
    bankDepositSsc,
    bankDeposit
  };
}

function rowToEntry(row) {
  if (!row) return null;
  return {
    date: row.entry_date,
    counts: row.counts || {},
    cashDrawer: Number(row.cash_drawer) || 0,
    yesterdayBalance: Number(row.yesterday_balance) || 0,
    totalCashSaleToday: Number(row.total_cash_sale_today) || 0,
    sscSettlement: Number(row.ssc_settlement) || 0,
    cardSettlement: Number(row.card_settlement) || 0,
    upiSettlement: Number(row.upi_settlement) || 0,
    digitalPayments: Number(row.digital_payments) || 0,
    calculatedSale: Number(row.calculated_sale) || 0,
    systemSale: Number(row.system_sale) || 0,
    difference: Number(row.difference) || 0,
    bankDepositCash: Number(row.bank_deposit_cash) || 0,
    bankDepositSsc: Number(row.bank_deposit_ssc) || 0,
    bankDeposit: Number(row.bank_deposit) || 0,
    notes: row.notes || ""
  };
}

function entryToRow(entry) {
  return {
    entry_date: entry.date,
    counts: entry.counts,
    cash_drawer: entry.cashDrawer,
    yesterday_balance: entry.yesterdayBalance,
    total_cash_sale_today: entry.totalCashSaleToday,
    ssc_settlement: entry.sscSettlement,
    card_settlement: entry.cardSettlement,
    upi_settlement: entry.upiSettlement,
    digital_payments: entry.digitalPayments,
    calculated_sale: entry.calculatedSale,
    system_sale: entry.systemSale,
    difference: entry.difference,
    bank_deposit_cash: entry.bankDepositCash,
    bank_deposit_ssc: entry.bankDepositSsc,
    bank_deposit: entry.bankDeposit,
    notes: entry.notes,
    updated_at: new Date().toISOString()
  };
}

async function getEntry(date) {
  const { data, error } = await activeStore.client.from(tableName).select("*").eq("entry_date", date).maybeSingle();
  if (error) throw error;
  return rowToEntry(data);
}

async function getAllEntries(limit) {
  let query = activeStore.client.from(tableName).select("*").order("entry_date", { ascending: false });
  if (limit) query = query.limit(limit);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(rowToEntry);
}

async function getLatestEntry() {
  const { data, error } = await activeStore.client
    .from(tableName)
    .select("*")
    .order("entry_date", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return rowToEntry(data);
}

async function saveEntry(entry) {
  const { error } = await activeStore.client.from(tableName).upsert(entryToRow(entry), { onConflict: "entry_date" });
  if (error) throw error;
}

async function deleteEntry(date) {
  const { error } = await activeStore.client.from(tableName).delete().eq("entry_date", date);
  if (error) throw error;
}

function entryTotalCashSaleToday(entry) {
  return entry?.totalCashSaleToday ?? ((Number(entry?.cashDrawer) || 0) - (Number(entry?.yesterdayBalance) || 0));
}

function entryCashDrawer(entry) {
  return Number(entry?.cashDrawer) || 0;
}

function withTimeout(promise, message, timeoutMs = 15000) {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), timeoutMs);
  });

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
}

function formToEntry() {
  const counts = getDenominationCounts();
  const totals = calculate(counts);
  return {
    date: elements.entryDate.value,
    counts,
    notes: elements.notes.value.trim(),
    createdOrUpdatedAt: new Date().toISOString(),
    ...totals
  };
}

function scrollEntryToTop() {
  elements.entryForm.scrollIntoView({ behavior: "smooth", block: "start" });
}

function applyEntry(entry) {
  currentEntryDate = entry?.date || "";
  formModified = false;
  elements.entryDate.value = entry?.date || todayIso();
  elements.searchDate.value = elements.entryDate.value;
  elements.cardSettlement.value = entryValue(entry?.cardSettlement);
  elements.sscSettlement.value = entryValue(entry?.sscSettlement);
  elements.upiSettlement.value = entryValue(entry?.upiSettlement);
  elements.yesterdayBalance.value = entryValue(entry?.yesterdayBalance);
  elements.systemSale.value = entryValue(entry?.systemSale);
  elements.bankDepositCash.value = entryValue(entry?.bankDepositCash);
  elements.bankDepositSsc.value = entryValue(entry?.bankDepositSsc);
  elements.notes.value = entry?.notes || "";
  baseYesterdayBalance = numberValue(elements.yesterdayBalance) + numberValue(elements.bankDepositCash);

  denominations.forEach((item) => {
    const input = document.querySelector(`[data-denomination="${item.key}"]`);
    input.value = entry ? entryNumberValue(entry.counts?.[item.key]) : "";
  });

  elements.deleteButton.disabled = !entry;
  elements.saveButton.textContent = entry ? "Update daily entry" : "Save daily entry";
  elements.saveMessage.textContent = entry ? "SAVED" : "";
  calculate();
}

async function renderHistory() {
  const entries = await getAllEntries(30);

  if (!entries.length) {
    elements.historyList.innerHTML = `<p class="empty-state">No entries saved yet.</p>`;
    return;
  }

  elements.historyList.innerHTML = entries
    .map((entry) => {
      const totalCashSaleToday = entryTotalCashSaleToday(entry);
      const calculatedSale =
        entry.calculatedSale ??
        (totalCashSaleToday +
          (Number(entry.sscSettlement) || 0) +
          (Number(entry.cardSettlement) || 0) +
          (Number(entry.upiSettlement) || 0));
      const systemSale = Number(entry.systemSale) || 0;
      const difference = calculatedSale - systemSale;
      const diffClass = Math.abs(difference) < 0.5 ? "diff-ok" : "diff-bad";
      return `
        <button type="button" class="history-card" data-date="${entry.date}">
          <strong>${entry.date}<span class="${diffClass}">${signedMoney(difference)}</span></strong>
          <small>Calculated ${money(calculatedSale)} | System ${money(systemSale)}</small>
        </button>
      `;
    })
    .join("");
}

async function loadEntryForDate(date) {
  if (!date) return;
  const entry = await getEntry(date);
  if (entry) {
    applyEntry(entry);
  } else {
    const previousEntry = await getPreviousEntry(date);
    applyEntry(null);
    elements.yesterdayBalance.value = previousEntry ? entryCashDrawer(previousEntry) : "";
    baseYesterdayBalance = numberValue(elements.yesterdayBalance);
  }
  elements.entryDate.value = date;
  elements.searchDate.value = date;
  calculate();
}

async function getPreviousEntry(date) {
  const { data, error } = await activeStore.client
    .from(tableName)
    .select("*")
    .lt("entry_date", date)
    .order("entry_date", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return rowToEntry(data);
}

async function getNextOpenDate() {
  const latestEntry = await getLatestEntry();
  return latestEntry ? addDays(latestEntry.date, 1) : todayIso();
}

async function startFreshForDate(date) {
  const previousEntry = await getPreviousEntry(date);
  applyEntry(null);
  elements.entryDate.value = date;
  elements.searchDate.value = date;
  elements.yesterdayBalance.value = previousEntry ? entryCashDrawer(previousEntry) : "";
  baseYesterdayBalance = numberValue(elements.yesterdayBalance);
  calculate();
}

function attachEvents() {
  setupIntegerInputs(elements.entryForm);

  elements.entryForm.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && event.target !== elements.notes) {
      event.preventDefault();
    }
  });

  elements.entryForm.addEventListener("input", () => {
    formModified = true;
    elements.saveMessage.textContent = "NOT SAVED";
    calculate();
  });

  elements.entryForm.addEventListener("change", () => {
    formModified = true;
    elements.saveMessage.textContent = "NOT SAVED";
    calculate();
  });

  elements.entryDate.addEventListener("input", () => {
    formModified = true;
    elements.saveMessage.textContent = "NOT SAVED";
    const isLoadedDate = currentEntryDate && elements.entryDate.value === currentEntryDate;
    elements.deleteButton.disabled = !isLoadedDate;
    elements.saveButton.textContent = isLoadedDate ? "Update daily entry" : "Save daily entry";
  });

  elements.entryForm.addEventListener("submit", (event) => event.preventDefault());

  elements.bankDepositCash.addEventListener("input", () => {
    updateYesterdayBalanceFromBankCash();
    formModified = true;
    elements.saveMessage.textContent = "NOT SAVED";
  });

  elements.yesterdayBalance.addEventListener("input", () => {
    syncBaseYesterdayBalanceFromUserInput();
  });

  elements.saveButton.addEventListener("click", async () => {
    if (!elements.entryForm.reportValidity()) return;
    const originalButtonText = elements.saveButton.textContent;
    elements.saveButton.disabled = true;
    elements.saveButton.textContent = "Saving...";
    elements.dbStatus.textContent = "Saving...";
    elements.saveMessage.textContent = "";
    let savedSuccessfully = false;

    try {
      await saveEntry(formToEntry());
      savedSuccessfully = true;
      formModified = false;
      elements.dbStatus.textContent = "Saved";
      elements.saveMessage.textContent = "SAVED";
      await renderHistory();
      await startFreshForDate(await getNextOpenDate());
    } catch (error) {
      const message = error.message || "Could not save entry.";
      const missingBankColumns =
        message.includes("bank_deposit_cash") ||
        message.includes("bank_deposit_ssc") ||
        message.includes("schema cache");
      const friendlyMessage = missingBankColumns
        ? "Save failed. Run the bank deposit SQL migration in this shop's Supabase project, then try again."
        : `Save failed: ${message}`;
      elements.dbStatus.textContent = missingBankColumns ? "Save failed: SQL needed" : "Save failed";
      elements.saveMessage.textContent = friendlyMessage;
      console.error(error);
    } finally {
      elements.saveButton.disabled = false;
      if (!savedSuccessfully) {
        elements.saveButton.textContent = originalButtonText;
      }
    }
  });

  elements.newEntryButton.addEventListener("click", async () => {
    scrollEntryToTop();
    await startFreshForDate(todayIso());
  });

  elements.loadDateButton.addEventListener("click", async () => {
    scrollEntryToTop();
    await loadEntryForDate(elements.searchDate.value);
  });

  elements.historyList.addEventListener("click", async (event) => {
    const card = event.target.closest("[data-date]");
    if (card) {
      scrollEntryToTop();
      await loadEntryForDate(card.dataset.date);
    }
  });

  elements.deleteButton.addEventListener("click", async () => {
    const date = currentEntryDate || elements.entryDate.value;
    if (!date) return;
    if (!confirm(`Delete the entry for ${date}?`)) return;
    await deleteEntry(date);
    elements.dbStatus.textContent = "Deleted";
    applyEntry(null);
    await renderHistory();
  });

  elements.loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    elements.authMessage.textContent = "Signing in...";
    const submitButton = elements.loginForm.querySelector("button[type='submit']");
    submitButton.disabled = true;

    try {
      const loginResult = await signInToMatchingStore(elements.loginEmail.value.trim(), elements.loginPassword.value);
      if (!loginResult.store) {
        elements.authMessage.textContent = loginResult.error || "Invalid login for all configured shops.";
        return;
      }
      activeStore = loginResult.store;
      elements.loginPassword.value = "";
      await showApp();
    } catch (error) {
      elements.authMessage.textContent = error.message || "Could not sign in.";
    } finally {
      submitButton.disabled = false;
    }
  });

  elements.signOutButton.addEventListener("click", async () => {
    if (activeStore) await activeStore.client.auth.signOut();
    activeStore = null;
    showLogin();
  });
}

function showLogin() {
  elements.appShell.classList.add("hidden");
  elements.authShell.classList.remove("hidden");
  elements.storeEyebrow.textContent = "PATANJALI STORE";
  elements.dbStatus.textContent = "Signed out";
}

async function showApp() {
  const { data } = await activeStore.client.auth.getUser();
  const storeName = data.user?.user_metadata?.cash_flow_title || activeStore.title;
  elements.storeEyebrow.textContent = activeStore.storeLabel || "PATANJALI STORE";
  elements.appTitle.textContent = storeName;
  document.title = storeName;
  elements.authShell.classList.add("hidden");
  elements.appShell.classList.remove("hidden");
  elements.dbStatus.textContent = `Connected: ${storeName}`;
  await loadEntryForDate(await getNextOpenDate());
  await renderHistory();
}

async function signInToMatchingStore(email, password) {
  let lastError = "";

  for (const store of storeConfigs) {
    elements.authMessage.textContent = `Checking ${store.title}...`;
    const { error } = await withTimeout(
      store.client.auth.signInWithPassword({ email, password }),
      `Sign in timed out for ${store.title}.`
    );

    if (!error) return { store };
    lastError = error.message;
  }

  return { store: null, error: lastError };
}

async function initData() {
  elements.entryDate.value = todayIso();
  elements.searchDate.value = todayIso();

  try {
    for (const store of storeConfigs) {
      const { data } = await store.client.auth.getSession();
      if (data.session) {
        activeStore = store;
        await showApp();
        return;
      }
    }
    showLogin();
  } catch (error) {
    elements.dbStatus.textContent = "Database error";
    elements.authMessage.textContent = error.message || "Could not connect to Supabase.";
    console.error(error);
  }
}

async function init() {
  buildDenominations();
  attachEvents();
  if (!window.supabase) {
    elements.authMessage.textContent = "Supabase library could not load. Check internet connection.";
    showLogin();
    return;
  }
  storeConfigs.forEach((store) => {
    store.client = window.supabase.createClient(store.supabaseUrl, store.supabasePublishableKey, {
      auth: {
        storageKey: `cash-flow-${store.id}-auth`
      }
    });
  });
  await initData();
}

init();
