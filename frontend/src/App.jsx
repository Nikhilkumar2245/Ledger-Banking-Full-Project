
import React, { useEffect, useState } from "react";
import axios from "axios";

import {
  Landmark,
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  LogOut,
  Plus,
  Send,
  RefreshCw,
  ShieldCheck,
  ArrowUpRight,
  Menu,
  X,
  Copy,
} from "lucide-react";

// ================= API CONFIGURATION =================

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    "http://localhost:3000/api",
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("ledger_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// ================= HELPER =================

const money = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

// ================= MAIN APP =================

export default function App() {
  const [token, setToken] = useState(
    localStorage.getItem("ledger_token")
  );

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("ledger_user") || "null"
      );
    } catch {
      return null;
    }
  });

  const [page, setPage] = useState("Overview");
  const [accounts, setAccounts] = useState([]);
  const [balances, setBalances] = useState({});
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [menu, setMenu] = useState(false);

  // ================= NOTIFICATION =================

  const flash = (message) => {
    setNotice(message);

    window.setTimeout(() => {
      setNotice("");
    }, 5000);
  };

  // ================= LOAD ACCOUNTS =================

  async function load() {
    try {
      const response = await api.get("/accounts");

      const accountData = response.data.accounts || [];

      setAccounts(accountData);

      const balanceData = {};

      await Promise.all(
        accountData.map(async (account) => {
          try {
            const result = await api.get(
              `/accounts/balance/${account._id}`
            );

            balanceData[account._id] =
              result.data.balance;
          } catch {
            balanceData[account._id] = 0;
          }
        })
      );

      setBalances(balanceData);
    } catch (error) {
      flash(
        error.response?.data?.message ||
          "Backend connection failed. Check backend and MongoDB."
      );
    }
  }

  useEffect(() => {
    if (token) {
      load();
    }
  }, [token]);

  // ================= LOGIN / REGISTER =================

  async function auth(mode, body) {
    setBusy(true);

    try {
      const response = await api.post(
        `/auth/${mode}`,
        body
      );

      const receivedToken = response.data.token;
      const receivedUser = response.data.user;

      localStorage.setItem(
        "ledger_token",
        receivedToken
      );

      localStorage.setItem(
        "ledger_user",
        JSON.stringify(receivedUser)
      );

      setToken(receivedToken);
      setUser(receivedUser);

      flash(
        mode === "login"
          ? "Successfully signed in"
          : "Successfully registered"
      );
    } catch (error) {
      flash(
        error.response?.data?.message ||
          "Could not connect to backend"
      );
    } finally {
      setBusy(false);
    }
  }

  // ================= LOGOUT =================

  async function logout() {
    try {
      await api.post("/auth/logout");
    } catch {
      // Clear local session even if logout API is unavailable
    }

    localStorage.removeItem("ledger_token");
    localStorage.removeItem("ledger_user");

    setToken(null);
    setUser(null);
    setAccounts([]);
    setBalances({});
    setPage("Overview");
  }

  // ================= CREATE ACCOUNT =================

  async function create() {
    try {
      await api.post("/accounts", {});

      await load();

      flash("Account created successfully");
    } catch (error) {
      flash(
        error.response?.data?.message ||
          "Account creation failed"
      );
    }
  }

  // ================= AUTH PAGE =================

  if (!token) {
    return (
      <Auth
        auth={auth}
        busy={busy}
        notice={notice}
      />
    );
  }

  // ================= DASHBOARD DATA =================

  const total = Object.values(balances).reduce(
    (sum, amount) =>
      sum + (Number(amount) || 0),
    0
  );

  const activeAccounts = accounts.filter(
    (account) =>
      account.status?.toLowerCase() === "active"
  ).length;

  return (
    <div className="app">

      {/* ================= SIDEBAR ================= */}

      <aside
        className={`sidebar ${menu ? "show" : ""}`}
      >
        <div className="brand">
          <span className="brandicon">
            <Landmark size={23} />
          </span>

          <span>
            ledger
            <small>PERSONAL BANKING</small>
          </span>

          <button
            className="close mobile"
            onClick={() => setMenu(false)}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <p className="navlabel">WORKSPACE</p>

        {[
          [LayoutDashboard, "Overview"],
          [Wallet, "My accounts"],
          [ArrowLeftRight, "Transfer money"],
        ].map(([Icon, name]) => (
          <button
            key={name}
            className={`nav ${
              page === name ? "selected" : ""
            }`}
            onClick={() => {
              setPage(name);
              setMenu(false);
            }}
          >
            <Icon size={18} />
            <span>{name}</span>
          </button>
        ))}

        <div className="sidefoot">
          <div className="secure">
            <ShieldCheck size={23} />

            <span>
              <b>Secure banking</b>
              <small>Authenticated session</small>
            </span>
          </div>

          <button
            className="userrow"
            onClick={logout}
            title="Logout"
          >
            <div className="avatar">
              {(user?.name || "U")[0].toUpperCase()}
            </div>

            <span>
              <b>{user?.name || "User"}</b>
              <small>{user?.email}</small>
            </span>

            <LogOut size={17} />
          </button>
        </div>
      </aside>

      {/* ================= MAIN CONTENT ================= */}

      {/* IMPORTANT: className="main" FIXES SIDEBAR OVERLAP */}

      <main className="main">

        {/* TOP HEADER */}

        <header className="top">
          <button
            className="mobile menubtn"
            onClick={() => setMenu(!menu)}
            aria-label="Toggle menu"
          >
            <Menu size={21} />
          </button>

          <span>
            Workspace / <b>{page}</b>
          </span>

          <div className="online">
            <i />
            <span>Backend connected</span>

            <div className="avatar">
              {(user?.name || "U")[0].toUpperCase()}
            </div>
          </div>
        </header>

        {/* DASHBOARD */}

        <div className="content">

          {notice && (
            <div className="notice">
              <span>{notice}</span>

              <button
                onClick={() => setNotice("")}
                aria-label="Dismiss notification"
              >
                ×
              </button>
            </div>
          )}

          {/* PAGE HEADING */}

          <div className="welcome">
            <div>
              <small>YOUR MONEY, YOUR WAY</small>

              <h1>
                {page === "Overview"
                  ? `Welcome back, ${
                      (user?.name || "Customer").split(
                        " "
                      )[0]
                    } 👋`
                  : page}
              </h1>

              <p>
                {page === "Overview"
                  ? "Here is your financial overview."
                  : "Manage your banking securely."}
              </p>
            </div>

            <button
              className="lightbtn"
              onClick={load}
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>

          {/* OVERVIEW */}

          {page === "Overview" && (
            <>
              <div className="hero">
                <div className="herolabel">
                  TOTAL AVAILABLE BALANCE

                  <span>● SECURE</span>
                </div>

                <h2>{money(total)}</h2>

                <div className="herobottom">
                  <span>
                    Across {accounts.length} account(s)
                  </span>

                  <button
                    onClick={() =>
                      setPage("Transfer money")
                    }
                  >
                    Make a transfer
                    <ArrowUpRight size={16} />
                  </button>
                </div>
              </div>

              {/* STATS */}

              <div className="stats">
                <div className="stat">
                  <span>Active accounts</span>
                  <b>{activeAccounts}</b>
                  <small>Ready for transactions</small>
                </div>

                <div className="stat">
                  <span>Currency</span>
                  <b>INR ₹</b>
                  <small>Indian Rupee</small>
                </div>

                <div className="stat">
                  <span>Security</span>
                  <b className="green">
                    Protected
                  </b>
                  <small>Authenticated session</small>
                </div>
              </div>
            </>
          )}

          {/* ACCOUNTS */}

          {(page === "Overview" ||
            page === "My accounts") && (
            <section className="section">
              <div className="sectionhead">
                <div>
                  <h2>
                    {page === "Overview"
                      ? "Your accounts"
                      : "All accounts"}
                  </h2>

                  <p>
                    Live data from your connected
                    banking backend.
                  </p>
                </div>

                <button
                  className="primary"
                  onClick={create}
                >
                  <Plus size={17} />
                  New account
                </button>
              </div>

              <div className="accountlist">
                {accounts.length === 0 ? (
                  <div className="empty">
                    <Wallet size={30} />

                    <h3>No accounts yet</h3>

                    <p>
                      Create your first bank account
                      to get started.
                    </p>

                    <button
                      className="primary"
                      onClick={create}
                    >
                      <Plus size={16} />
                      Create account
                    </button>
                  </div>
                ) : (
                  accounts.map((account) => (
                    <div
                      className="account"
                      key={account._id}
                    >
                      <div className="accicon">
                        <Landmark size={21} />
                      </div>

                      <div className="accdetail">
                        <b>
                          Ledger account

                          <span>
                            {account.status || "Active"}
                          </span>
                        </b>

                        <small>
                          Account ID: {account._id}

                          <button
                            className="copy"
                            title="Copy account ID"
                            onClick={() =>
                              navigator.clipboard?.writeText(
                                account._id
                              )
                            }
                          >
                            <Copy size={13} />
                          </button>
                        </small>
                      </div>

                      <div className="balance">
                        <small>
                          Available balance
                        </small>

                        <b>
                          {money(
                            balances[account._id]
                          )}
                        </b>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          )}

          {/* TRANSFER */}

          {page === "Transfer money" && (
            <Transfer
              accounts={accounts}
              done={async () => {
                await load();
                flash(
                  "Transaction completed successfully"
                );
              }}
              flash={flash}
            />
          )}

          {/* FOOTER */}

          <footer>
            <span>© 2026 Ledger Banking</span>

            <span>
              <ShieldCheck size={14} />
              Secure connection to your API
            </span>
          </footer>

        </div>
      </main>

      {/* MOBILE SIDEBAR OVERLAY */}

      {menu && (
        <div
          className="shade mobile"
          onClick={() => setMenu(false)}
        />
      )}
    </div>
  );
}

// ================= AUTH COMPONENT =================

function Auth({ auth, busy, notice }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function submit(event) {
    event.preventDefault();

    auth(mode, {
      ...(mode === "register" ? { name } : {}),
      email,
      password,
    });
  }

  return (
    <div className="auth">

      <div className="authleft">
        <div className="brand">
          <span className="brandicon">
            <Landmark />
          </span>

          <span>
            ledger
            <small>PERSONAL BANKING</small>
          </span>
        </div>

        <div className="pitch">
          <small>
            MODERN BANKING, MADE SIMPLE
          </small>

          <h1>
            Your money.
            <br />
            <em>Your way.</em>
          </h1>

          <p>
            Manage your accounts and move money
            with a secure, simple banking experience.
          </p>

          <div className="secure">
            <ShieldCheck />

            <span>
              <b>Secure by design</b>
              <small>
                Connected to your own banking backend
              </small>
            </span>
          </div>
        </div>

        <small>© 2026 Ledger Financial</small>
      </div>

      <div className="authright">
        <form onSubmit={submit}>
          <small className="kicker">
            WELCOME{" "}
            {mode === "login" ? "BACK" : "ABOARD"}
          </small>

          <h2>
            {mode === "login"
              ? "Sign in to Ledger"
              : "Create your account"}
          </h2>

          <p>
            {mode === "login"
              ? "Enter your details to access your dashboard."
              : "Register to start using your banking dashboard."}
          </p>

          {notice && (
            <div className="notice">
              {notice}
            </div>
          )}

          {mode === "register" && (
            <>
              <label>Full name</label>

              <input
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                placeholder="Your full name"
                required
              />
            </>
          )}

          <label>Email address</label>

          <input
            type="email"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            placeholder="you@example.com"
            required
          />

          <label>Password</label>

          <input
            type="password"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            placeholder="Enter password"
            required
          />

          <button
            className="primary wide"
            disabled={busy}
          >
            {busy
              ? "Please wait..."
              : mode === "login"
              ? "Sign in securely"
              : "Create account"}

            <ArrowUpRight size={17} />
          </button>

          <div className="switch">
            {mode === "login"
              ? "Don't have an account?"
              : "Already registered?"}

            <button
              type="button"
              onClick={() =>
                setMode(
                  mode === "login"
                    ? "register"
                    : "login"
                )
              }
            >
              {mode === "login"
                ? "Create account"
                : "Sign in"}
            </button>
          </div>

          <div className="safety">
            <ShieldCheck size={15} />
            Credentials are sent to your configured
            backend.
          </div>
        </form>
      </div>
    </div>
  );
}

// ================= TRANSFER COMPONENT =================

function Transfer({ accounts, done, flash }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();

    if (from === to) {
      return flash(
        "Sender and receiver must be different accounts."
      );
    }

    if (Number(amount) <= 0) {
      return flash(
        "Please enter a valid transfer amount."
      );
    }

    setBusy(true);

    try {
      const response = await api.post(
        "/transaction",
        {
          fromAccount: from,
          toAccount: to,
          amount: Number(amount),
          idempotencyKey: crypto.randomUUID(),
        }
      );

      flash(
        response.data.message ||
          "Transaction submitted"
      );

      setAmount("");

      await done();
    } catch (error) {
      flash(
        error.response?.data?.message ||
          "Transfer failed"
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="transfer">

      <div>
        <div className="transferbadge">
          <Send />
        </div>

        <h2>Send money</h2>

        <p>
          Transfer funds securely between Ledger
          accounts. Transaction processing and
          balance validation happen on your backend.
        </p>

        <div className="secure">
          <ShieldCheck />

          <span>
            <b>Protected transfers</b>
            <small>
              Transactions are authenticated and
              validated by your server.
            </small>
          </span>
        </div>
      </div>

      <form onSubmit={submit}>
        <h3>Transfer details</h3>

        <label>From account</label>

        <select
          value={from}
          onChange={(event) =>
            setFrom(event.target.value)
          }
          required
        >
          <option value="">
            Choose source account
          </option>

          {accounts.map((account) => (
            <option
              key={account._id}
              value={account._id}
            >
              {account._id}
            </option>
          ))}
        </select>

        <label>Recipient account ID</label>

        <input
          value={to}
          onChange={(event) =>
            setTo(event.target.value)
          }
          placeholder="Paste recipient account ID"
          required
        />

        <label>Amount (INR)</label>

        <input
          type="number"
          min="0.01"
          step="0.01"
          value={amount}
          onChange={(event) =>
            setAmount(event.target.value)
          }
          placeholder="0.00"
          required
        />

        <button
          className="primary wide"
          disabled={busy || accounts.length === 0}
        >
          {busy
            ? "Processing..."
            : "Transfer securely"}

          {!busy && <ArrowUpRight size={17} />}
        </button>

        <small className="hint">
          Double-check recipient details before
          sending.
        </small>
      </form>
    </div>
  );
}