import { useEffect, useMemo, useState } from "react";
import { Link, Route, Routes, useNavigate, useParams } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { ListingCard } from "./components/ListingCard";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { api } from "./lib/api";
import { clearAuth, clearPending, loadAuth, loadPending, saveAuth, savePending } from "./lib/session";

const defaultListingForm = {
  title: "",
  description: "",
  price: 700,
  start_date: "",
  end_date: "",
  bedrooms: 1,
  bathrooms: 1,
  address: "",
  amenities: "WiFi, Parking",
};

function BoilerSubApp() {
  const [auth, setAuth] = useState(loadAuth() || { accessToken: "", user: null });
  const [pending, setPending] = useState(loadPending() || { email: "", phone: "", session: null, debugCode: "" });
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (auth?.accessToken) {
      api.auth
        .me(auth.accessToken)
        .then((user) => {
          const next = { accessToken: auth.accessToken, user };
          setAuth(next);
          saveAuth(next);
        })
        .catch(() => {
          setAuth({ accessToken: "", user: null });
          clearAuth();
        });
    }
  }, []);

  const authApi = useMemo(
    () => ({
      auth,
      pending,
      setNotice,
      async completeLogin(payload) {
        const next = { accessToken: payload.session?.access_token || "", user: payload.user };
        setAuth(next);
        saveAuth(next);
        setPending({ email: "", phone: "", session: null, debugCode: "" });
        clearPending();
      },
      setPendingState(next) {
        setPending(next);
        savePending(next);
      },
      async logout() {
        if (auth.accessToken) {
          try {
            await api.auth.logout(auth.accessToken);
          } catch {
            // Ignore local demo logout failures and clear client state.
          }
        }
        setAuth({ accessToken: "", user: null });
        clearAuth();
        setPending({ email: "", phone: "", session: null, debugCode: "" });
        clearPending();
      },
    }),
    [auth, pending],
  );

  return (
    <AppShell auth={auth} onLogout={authApi.logout}>
      {notice ? <div className="banner">{notice}</div> : null}
      <Routes>
        <Route path="/" element={<Home auth={auth} />} />
        <Route path="/signup" element={<SignupPage authApi={authApi} />} />
        <Route path="/verify-email" element={<VerifyEmailPage authApi={authApi} />} />
        <Route path="/verify-phone" element={<VerifyPhonePage authApi={authApi} />} />
        <Route path="/verify-phone/code" element={<VerifyPhoneCodePage authApi={authApi} />} />
        <Route path="/login" element={<LoginPage authApi={authApi} />} />
        <Route path="/listings" element={<ProtectedRoute auth={auth}><ListingsPage auth={auth} /></ProtectedRoute>} />
        <Route path="/listings/new" element={<ProtectedRoute auth={auth}><ListingEditorPage authApi={authApi} mode="create" /></ProtectedRoute>} />
        <Route path="/listings/:id" element={<ProtectedRoute auth={auth}><ListingDetailPage auth={auth} /></ProtectedRoute>} />
        <Route path="/listings/:id/edit" element={<ProtectedRoute auth={auth}><ListingEditorPage authApi={authApi} mode="edit" /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute auth={auth}><ProfilePage authApi={authApi} /></ProtectedRoute>} />
        <Route path="/profile/listings" element={<ProtectedRoute auth={auth}><MyListingsPage auth={auth} /></ProtectedRoute>} />
        <Route path="/users/:id" element={<ProtectedRoute auth={auth}><PublicProfilePage auth={auth} /></ProtectedRoute>} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AppShell>
  );
}

function Home({ auth }) {
  return (
    <section className="hero">
      <div>
        <div className="eyebrow">Purdue-only sublease marketplace</div>
        <h1>Verified housing flows for Boilermakers.</h1>
        <p className="hero-copy">
          BoilerSub now runs end-to-end locally with real signup, verification, listings, profile editing, and owner-only listing management.
        </p>
        <div className="hero-actions">
          <Link className="primary-button link-button" to={auth.user ? "/listings" : "/signup"}>
            {auth.user ? "Browse Listings" : "Sign Up"}
          </Link>
          <Link className="secondary-button link-button" to="/listings">
            Explore Demo Data
          </Link>
        </div>
      </div>
      <div className="hero-panel">
        <h3>Demo credentials</h3>
        <p className="muted">Use any seeded account after launching the backend.</p>
        <div className="demo-credentials">
          <div><strong>student1@purdue.edu</strong><span>BoilerSub123!</span></div>
          <div><strong>student2@purdue.edu</strong><span>BoilerSub123!</span></div>
        </div>
      </div>
    </section>
  );
}

function SignupPage({ authApi }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const data = await api.auth.signup({ email: form.email, password: form.password });
      authApi.setPendingState({ email: form.email, phone: "", session: null, debugCode: data.debug_code || "" });
      authApi.setNotice(data.debug_code ? `Demo email code: ${data.debug_code}` : "Check your Purdue email for the verification code.");
      navigate("/verify-email");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return <AuthCard title="Create your BoilerSub account" subtitle="Start with your Purdue email and a password.">{authForm({ form, setForm, handleSubmit, loading, error, type: "signup" })}</AuthCard>;
}

function LoginPage({ authApi }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api.auth.login(form);
      await authApi.completeLogin(data);
      authApi.setNotice("Logged in successfully.");
      navigate("/listings");
    } catch (err) {
      if (err.code === "verification_required") {
        authApi.setPendingState({ ...authApi.pending, email: form.email });
        navigate(err.details?.stage === "pending_phone_verification" ? "/verify-phone" : "/verify-email");
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }

  return <AuthCard title="Welcome back to BoilerSub" subtitle="Use a verified Purdue account to browse and manage listings.">{authForm({ form, setForm, handleSubmit, loading, error, type: "login" })}</AuthCard>;
}

function VerifyEmailPage({ authApi }) {
  const navigate = useNavigate();
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await api.auth.verifyEmail({ email: authApi.pending.email, token });
      authApi.setPendingState({
        ...authApi.pending,
        session: data.session || null,
      });
      authApi.setNotice("Email verified. Enter your phone number next.");
      navigate("/verify-phone");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    const data = await api.auth.resendEmailOtp({ email: authApi.pending.email });
    authApi.setPendingState({ ...authApi.pending, debugCode: data.debug_code || "" });
    authApi.setNotice(data.debug_code ? `New demo email code: ${data.debug_code}` : "Email code resent.");
  }

  return (
    <AuthCard title="Verify your Purdue email" subtitle={`We sent a 6-digit code to ${authApi.pending.email || "your email"}.`}>
      <form className="panel-form" onSubmit={submit}>
        <input value={token} onChange={(event) => setToken(event.target.value)} placeholder="6-digit code" maxLength={6} />
        {authApi.pending.debugCode ? <p className="hint">Demo code: {authApi.pending.debugCode}</p> : null}
        {error ? <p className="error-text">{error}</p> : null}
        <button className="primary-button" disabled={loading} type="submit">{loading ? "Verifying..." : "Verify Email"}</button>
        <button className="ghost-button" onClick={resend} type="button">Resend Code</button>
      </form>
    </AuthCard>
  );
}

function VerifyPhonePage({ authApi }) {
  const navigate = useNavigate();
  const [phone, setPhone] = useState(authApi.pending.phone || "+1");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const accessToken = authApi.pending.session?.access_token;
      const data = await api.auth.sendPhoneOtp({ phone }, accessToken);
      authApi.setPendingState({
        ...authApi.pending,
        phone,
        debugCode: data.debug_code || "",
      });
      authApi.setNotice(data.debug_code ? `Demo SMS code: ${data.debug_code}` : "SMS code sent.");
      navigate("/verify-phone/code");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard title="Add your phone number" subtitle="Use a US +1 number to complete verification.">
      <form className="panel-form" onSubmit={submit}>
        <input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+17651234567" />
        {error ? <p className="error-text">{error}</p> : null}
        <button className="primary-button" disabled={loading} type="submit">{loading ? "Sending..." : "Send Code"}</button>
      </form>
    </AuthCard>
  );
}

function VerifyPhoneCodePage({ authApi }) {
  const navigate = useNavigate();
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await api.auth.verifyPhone({ phone: authApi.pending.phone, token });
      await authApi.completeLogin(data);
      authApi.setNotice("Phone verified. You are ready to browse and list.");
      navigate("/listings");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    const data = await api.auth.resendPhoneOtp({ phone: authApi.pending.phone });
    authApi.setPendingState({ ...authApi.pending, debugCode: data.debug_code || "" });
    authApi.setNotice(data.debug_code ? `New demo SMS code: ${data.debug_code}` : "SMS code resent.");
  }

  return (
    <AuthCard title="Verify your phone" subtitle={`Enter the code sent to ${authApi.pending.phone || "your phone"}.`}>
      <form className="panel-form" onSubmit={submit}>
        <input value={token} onChange={(event) => setToken(event.target.value)} placeholder="6-digit code" maxLength={6} />
        {authApi.pending.debugCode ? <p className="hint">Demo code: {authApi.pending.debugCode}</p> : null}
        {error ? <p className="error-text">{error}</p> : null}
        <button className="primary-button" disabled={loading} type="submit">{loading ? "Verifying..." : "Verify Phone"}</button>
        <button className="ghost-button" onClick={resend} type="button">Resend Code</button>
      </form>
    </AuthCard>
  );
}

function ListingsPage({ auth }) {
  const [listings, setListings] = useState([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.listings
      .list({ limit: 20, offset }, auth.accessToken)
      .then(setListings)
      .finally(() => setLoading(false));
  }, [auth.accessToken, offset]);

  return (
    <section className="stack">
      <div className="section-header">
        <div>
          <div className="eyebrow">Available now</div>
          <h2>Available Subleases</h2>
        </div>
        <Link className="primary-button link-button" to="/listings/new">List Your Sublease</Link>
      </div>
      {loading ? <div className="panel">Loading listings...</div> : null}
      <div className="listing-grid">{listings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}</div>
      <div className="pager">
        <button className="ghost-button" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - 20))}>Previous</button>
        <button className="ghost-button" disabled={listings.length < 20} onClick={() => setOffset(offset + 20)}>Next</button>
      </div>
    </section>
  );
}

function ListingDetailPage({ auth }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const [listing, setListing] = useState(null);

  useEffect(() => {
    api.listings.getById(id, auth.accessToken).then(setListing);
  }, [auth.accessToken, id]);

  async function handleDelete() {
    await api.listings.delete(id, auth.accessToken);
    navigate("/listings");
  }

  if (!listing) return <div className="panel">Loading listing...</div>;

  const isOwner = auth.user?.id === listing.owner_id;

  return (
    <section className="detail-layout">
      <div className="detail-card">
        <div className="detail-hero" />
        <div className="detail-content">
          <div className="section-header">
            <div>
              <div className="eyebrow">Listing Details</div>
              <h2>{listing.title}</h2>
            </div>
            <div className="price-tag">${listing.price}/mo</div>
          </div>
          <p>{listing.description}</p>
          <div className="meta-grid">
            <div><strong>Dates</strong><span>{listing.start_date} to {listing.end_date}</span></div>
            <div><strong>Layout</strong><span>{listing.bedrooms ?? "?"} bed · {listing.bathrooms ?? "?"} bath</span></div>
            <div><strong>Address</strong><span>{listing.address}</span></div>
          </div>
          <div className="pill-row">{listing.amenities.map((item) => <span className="pill" key={item}>{item}</span>)}</div>
          <div className="owner-box">
            <h3>Owner</h3>
            <p>{listing.owner.full_name || listing.owner.email}</p>
            <Link className="ghost-button link-button" to={`/users/${listing.owner.id}`}>View profile</Link>
          </div>
          {isOwner ? (
            <div className="button-row">
              <Link className="secondary-button link-button" to={`/listings/${listing.id}/edit`}>Edit</Link>
              <button className="danger-button" onClick={handleDelete}>Delete</button>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function ListingEditorPage({ authApi, mode }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = mode === "edit";
  const [form, setForm] = useState(defaultListingForm);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isEdit && id) {
      api.listings.getById(id, authApi.auth.accessToken).then((listing) => {
        setForm({
          title: listing.title,
          description: listing.description || "",
          price: listing.price,
          start_date: listing.start_date,
          end_date: listing.end_date,
          bedrooms: listing.bedrooms || 1,
          bathrooms: listing.bathrooms || 1,
          address: listing.address || "",
          amenities: listing.amenities.join(", "),
        });
      });
    }
  }, [authApi.auth.accessToken, id, isEdit]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    if (!authApi.auth.user?.fully_verified) {
      setError("You need a fully verified account to publish listings.");
      return;
    }

    const payload = {
      ...form,
      price: Number(form.price),
      bedrooms: Number(form.bedrooms),
      bathrooms: Number(form.bathrooms),
      amenities: form.amenities.split(",").map((item) => item.trim()).filter(Boolean),
    };

    try {
      const data = isEdit
        ? await api.listings.update(id, payload, authApi.auth.accessToken)
        : await api.listings.create(payload, authApi.auth.accessToken);
      authApi.setNotice(`Listing ${isEdit ? "updated" : "published"} successfully.`);
      navigate(`/listings/${data.id}`);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="detail-layout">
      <form className="detail-card form-card" onSubmit={handleSubmit}>
        <div className="detail-content">
          <div className="eyebrow">{isEdit ? "Update your listing" : "Create a listing"}</div>
          <h2>{isEdit ? "Edit Listing" : "List Your Sublease"}</h2>
          <div className="form-grid">
            {Object.entries(form).map(([key, value]) => (
              <label className={key === "description" || key === "amenities" ? "full-width" : ""} key={key}>
                <span>{key.replaceAll("_", " ")}</span>
                {key === "description" ? (
                  <textarea rows="5" value={value} onChange={(event) => setForm({ ...form, [key]: event.target.value })} />
                ) : (
                  <input value={value} onChange={(event) => setForm({ ...form, [key]: event.target.value })} type={["price", "bedrooms", "bathrooms"].includes(key) ? "number" : key.includes("date") ? "date" : "text"} />
                )}
              </label>
            ))}
          </div>
          {error ? <p className="error-text">{error}</p> : null}
          <div className="button-row">
            <button className="primary-button" type="submit">{isEdit ? "Save Changes" : "Publish Listing"}</button>
            <button className="ghost-button" onClick={() => navigate("/listings")} type="button">Cancel</button>
          </div>
        </div>
      </form>
    </section>
  );
}

function ProfilePage({ authApi }) {
  const [form, setForm] = useState({
    full_name: authApi.auth.user?.full_name || "",
    bio: authApi.auth.user?.bio || "",
  });
  const [saved, setSaved] = useState("");

  async function submit(event) {
    event.preventDefault();
    const user = await api.users.updateMe(form, authApi.auth.accessToken);
    const next = { accessToken: authApi.auth.accessToken, user };
    saveAuth(next);
    window.location.reload();
    setSaved("Profile saved.");
  }

  return (
    <section className="detail-layout">
      <form className="detail-card form-card" onSubmit={submit}>
        <div className="detail-content">
          <div className="eyebrow">My Profile</div>
          <h2>{authApi.auth.user?.full_name || authApi.auth.user?.email}</h2>
          <div className="meta-grid">
            <div><strong>Email</strong><span>{authApi.auth.user?.email}</span></div>
            <div><strong>Phone</strong><span>{authApi.auth.user?.phone || "Not set"}</span></div>
            <div><strong>Verified</strong><span>{authApi.auth.user?.fully_verified ? "Fully verified" : "Pending"}</span></div>
          </div>
          <div className="form-grid">
            <label>
              <span>Full name</span>
              <input value={form.full_name} onChange={(event) => setForm({ ...form, full_name: event.target.value })} />
            </label>
            <label className="full-width">
              <span>Bio</span>
              <textarea rows="4" value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} />
            </label>
          </div>
          {saved ? <p className="hint">{saved}</p> : null}
          <button className="primary-button" type="submit">Save Changes</button>
        </div>
      </form>
    </section>
  );
}

function PublicProfilePage({ auth }) {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [listings, setListings] = useState([]);

  useEffect(() => {
    api.users.getById(id, auth.accessToken).then(setUser);
    api.listings.list({ owner_id: id }, auth.accessToken).then(setListings);
  }, [auth.accessToken, id]);

  if (!user) return <div className="panel">Loading profile...</div>;

  return (
    <section className="stack">
      <div className="panel">
        <div className="eyebrow">Public profile</div>
        <h2>{user.full_name || user.email}</h2>
        <p>{user.bio || "No bio yet."}</p>
      </div>
      <div className="listing-grid">{listings.map((listing) => <ListingCard key={listing.id} listing={listing} showOwner={false} />)}</div>
    </section>
  );
}

function MyListingsPage({ auth }) {
  const [listings, setListings] = useState([]);

  useEffect(() => {
    api.listings.list({ owner_id: "me" }, auth.accessToken).then(setListings);
  }, [auth.accessToken]);

  return (
    <section className="stack">
      <div className="section-header">
        <div>
          <div className="eyebrow">Owner dashboard</div>
          <h2>My Listings</h2>
        </div>
        <Link className="primary-button link-button" to="/listings/new">Create New Listing</Link>
      </div>
      <div className="listing-grid">{listings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}</div>
    </section>
  );
}

function NotFoundPage() {
  return (
    <section className="panel center-panel">
      <div className="eyebrow">404</div>
      <h2>Page not found</h2>
      <Link className="primary-button link-button" to="/listings">Back to listings</Link>
    </section>
  );
}

function AuthCard({ title, subtitle, children }) {
  return (
    <section className="auth-layout">
      <div className="auth-visual">
        <div className="eyebrow">BoilerSub demo</div>
        <h1>Trusted subleasing for Purdue students.</h1>
        <p>{subtitle}</p>
      </div>
      <div className="auth-card">
        <h2>{title}</h2>
        {children}
      </div>
    </section>
  );
}

function authForm({ form, setForm, handleSubmit, loading, error, type }) {
  return (
    <form className="panel-form" onSubmit={handleSubmit}>
      <input placeholder="example@purdue.edu" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
      <input placeholder="Password" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
      {type === "signup" ? (
        <input placeholder="Confirm password" type="password" value={form.confirmPassword} onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })} />
      ) : null}
      {error ? <p className="error-text">{error}</p> : null}
      <button className="primary-button" disabled={loading} type="submit">{loading ? "Please wait..." : type === "signup" ? "Create Account" : "Log In"}</button>
      <p className="hint">
        {type === "signup" ? (
          <>Already registered? <Link to="/login">Log in</Link></>
        ) : (
          <>Need an account? <Link to="/signup">Sign up</Link></>
        )}
      </p>
    </form>
  );
}

export default BoilerSubApp;
