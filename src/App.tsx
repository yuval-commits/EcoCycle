import { FormEvent, ReactNode, useCallback, useEffect, useState } from "react";
import {
  ArrowDownToLine, ArrowRight, Bell, CalendarDays, Check, ChevronDown, CircleHelp,
  ClipboardList, Leaf, LogOut, Menu, Plus, Recycle, Settings, ShieldCheck, Sparkles,
  Trash2, TrendingUp, X,
} from "lucide-react";
import { api, clearToken, Dashboard, getToken, InventoryInput, Item, Pickup, PickupInput, saveToken, User } from "./api";

type View = "overview" | "inventory" | "schedule" | "settings";

const categories = ["Plastic", "Paper", "Glass", "Metal", "Other"];
const categoryIcons: Record<string, string> = { Plastic: "♻", Paper: "▤", Glass: "◉", Metal: "⚙", Other: "＋" };
const categoryColors: Record<string, string> = {
  Plastic: "mint", Paper: "blue", Glass: "violet", Metal: "amber", Other: "gray",
};

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<View>("overview");
  const [authReady, setAuthReady] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [authError, setAuthError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      setAuthReady(true);
      return;
    }
    api.me().then(setUser).catch(() => clearToken()).finally(() => setAuthReady(true));
  }, []);

  const signOut = async () => {
    try { await api.logout(); } catch { /* The local token is still cleared when the server is unavailable. */ }
    clearToken();
    setUser(null);
    setView("overview");
  };

  const authenticate = async (mode: "login" | "register", values: Record<string, string>) => {
    setBusy(true);
    setAuthError("");
    try {
      const result = mode === "login"
        ? await api.login({ email: values.email, password: values.password })
        : await api.register({ name: values.name, email: values.email, password: values.password, community: values.community });
      saveToken(result.token);
      setUser(result.user);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Unable to sign in.");
    } finally {
      setBusy(false);
    }
  };

  if (!authReady) return <div className="loading-screen"><Recycle size={30} /><span>Getting your recycling space ready…</span></div>;
  if (!user) return <AuthScreen onSubmit={authenticate} error={authError} busy={busy} />;

  const nav = [
    { id: "overview" as const, label: "Overview", icon: TrendingUp },
    { id: "inventory" as const, label: "My inventory", icon: ClipboardList },
    { id: "schedule" as const, label: "Community pickups", icon: CalendarDays },
    { id: "settings" as const, label: "Preferences", icon: Settings },
  ];

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? "sidebar-open" : ""}`}>
        <a className="brand" href="#" onClick={(e) => { e.preventDefault(); setView("overview"); }}>
          <span className="brand-mark"><Recycle size={22} /></span>
          <span>eco<span className="brand-light">cycle</span><small>COMMUNITY RECYCLING</small></span>
        </a>
        <div className="side-label">WORKSPACE</div>
        <nav className="side-nav">
          {nav.map(({ id, label, icon: Icon }) => (
            <button key={id} className={`nav-link ${view === id ? "active" : ""}`} onClick={() => { setView(id); setMenuOpen(false); }}>
              <Icon size={18} strokeWidth={1.8} /><span>{label}</span>
              {id === "schedule" && <span className="nav-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-spacer" />
        <div className="sdg-card">
          <span className="sdg-icon"><Leaf size={17} /></span>
          <div><strong>Small changes,<br />lasting impact.</strong><p>Contributing to SDG 12</p></div>
          <div className="sdg-progress"><i /></div>
          <span className="sdg-foot">RESPONSIBLE CONSUMPTION</span>
        </div>
        <button className="profile-chip" onClick={() => setView("settings")}>
          <Avatar name={user.name} />
          <span className="profile-text"><b>{user.name}</b><small>{user.community}</small></span>
          <ChevronDown size={15} />
        </button>
      </aside>
      {menuOpen && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMenuOpen(false)} />}
      <main className="main-area">
        <header className="topbar">
          <button className="mobile-menu" aria-label="Open menu" onClick={() => setMenuOpen(true)}><Menu size={21} /></button>
          <div className="breadcrumbs">Workspace <span>/</span> <b>{nav.find((item) => item.id === view)?.label}</b></div>
          <div className="topbar-right">
            <div className="community-pill"><span /> {user.community}</div>
            <button className="icon-button notification-button" aria-label="Notifications"><Bell size={18} /><i /></button>
            <button className="top-avatar" aria-label="Sign out" title="Sign out" onClick={signOut}><Avatar name={user.name} /></button>
          </div>
        </header>
        <div className="page-content">
          {view === "overview" && <Overview user={user} go={setView} />}
          {view === "inventory" && <Inventory />}
          {view === "schedule" && <Schedule user={user} />}
          {view === "settings" && <Preferences user={user} onUpdate={setUser} onSignOut={signOut} />}
          <footer className="footer"><span>Made for a greener neighborhood.</span><span>SDG 12 <i>·</i> Target 12.5 <i>·</i> Waste less, recycle more</span></footer>
        </div>
      </main>
    </div>
  );
}

function Avatar({ name }: { name: string }) {
  return <span className="avatar">{name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("")}</span>;
}

function AuthScreen({ onSubmit, error, busy }: {
  onSubmit: (mode: "login" | "register", values: Record<string, string>) => Promise<void>;
  error: string;
  busy: boolean;
}) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [values, setValues] = useState({ name: "", email: "", password: "", community: "" });
  const submit = (event: FormEvent) => { event.preventDefault(); void onSubmit(mode, values); };
  return (
    <div className="auth-page">
      <section className="auth-story">
        <a className="brand auth-brand" href="#"><span className="brand-mark"><Recycle size={22} /></span><span>eco<span className="brand-light">cycle</span></span></a>
        <div className="story-content">
          <div className="eyebrow"><span /> A BETTER KIND OF EVERYDAY</div>
          <h1>Your little<br />recycling corner<br /><em>can change a lot.</em></h1>
          <p>Keep track of what you recycle, know when your bin is full, and make collection day a community effort.</p>
          <div className="story-impact">
            <span className="impact-icon"><Leaf size={18} /></span>
            <span><b>Every item counts.</b><small>Progress toward a more circular future.</small></span>
            <span className="impact-sdg">12</span>
          </div>
        </div>
        <span className="story-foot">SDG 12 · RESPONSIBLE CONSUMPTION & PRODUCTION</span>
      </section>
      <section className="auth-panel">
        <div className="auth-form-wrap">
          <div className="form-kicker">{mode === "login" ? "WELCOME BACK" : "JOIN YOUR COMMUNITY"}</div>
          <h2>{mode === "login" ? "Good to see you." : "Let's get started."}</h2>
          <p className="form-subtitle">{mode === "login" ? "Sign in to your recycling space." : "Create an account to start making a difference."}</p>
          <form onSubmit={submit} className="auth-form">
            {mode === "register" && <label>Your name<input required minLength={2} maxLength={80} autoComplete="name" placeholder="e.g. Alex Morgan" value={values.name} onChange={(e) => setValues({ ...values, name: e.target.value })} /></label>}
            <label>Email address<input type="email" required autoComplete="email" placeholder="you@example.com" value={values.email} onChange={(e) => setValues({ ...values, email: e.target.value })} /></label>
            <label>Password<input type="password" required minLength={8} autoComplete={mode === "login" ? "current-password" : "new-password"} placeholder="At least 8 characters" value={values.password} onChange={(e) => setValues({ ...values, password: e.target.value })} /></label>
            {mode === "register" && <label>Your community<input required minLength={2} maxLength={100} placeholder="Neighborhood or town" value={values.community} onChange={(e) => setValues({ ...values, community: e.target.value })} /></label>}
            {error && <div className="inline-error" role="alert">{error}</div>}
            <button className="button button-primary auth-submit" disabled={busy}>{busy ? "One moment…" : mode === "login" ? "Sign in" : "Create account"}<ArrowRight size={16} /></button>
          </form>
          <div className="auth-switch">{mode === "login" ? "New to EcoCycle?" : "Already have an account?"}<button onClick={() => { setMode(mode === "login" ? "register" : "login"); }}>{mode === "login" ? "Create an account" : "Sign in"}</button></div>
          <div className="auth-assurance"><ShieldCheck size={15} /> Your account is private and secure</div>
        </div>
      </section>
    </div>
  );
}

function PageHeading({ eyebrow, title, subtitle, action }: { eyebrow: string; title: string; subtitle: string; action?: ReactNode }) {
  return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{subtitle}</p></div>{action}</div>;
}

function useDashboardData() {
  const [data, setData] = useState<{ dashboard: Dashboard; items: Item[]; pickups: Pickup[] } | null>(null);
  const [error, setError] = useState("");
  const refresh = useCallback(async () => {
    try {
      const [dashboard, items, pickups] = await Promise.all([api.dashboard(), api.items(), api.pickups()]);
      setData({ dashboard, items, pickups });
      setError("");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not load your recycling data."); }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  return { data, error, refresh };
}

function Overview({ user, go }: { user: User; go: (view: View) => void }) {
  const { data, error, refresh } = useDashboardData();
  if (!data) return <LoadingContent error={error} retry={refresh} />;
  const { dashboard, items, pickups } = data;
  const upcoming = pickups.filter((item) => item.status === "Scheduled" && new Date(item.pickupDate) >= new Date(new Date().toDateString())).slice(0, 3);
  const full = dashboard.capacityPercent >= 80;
  const greeting = new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 18 ? "Good afternoon" : "Good evening";
  return (
    <>
      <PageHeading eyebrow="YOUR RECYCLING SPACE" title={`${greeting}, ${user.name.split(" ")[0]}.`} subtitle="Here's the good you're doing for your neighborhood." action={<button className="button button-primary" onClick={() => go("inventory")}><Plus size={17} /> Add recyclables</button>} />
      {full && <div className="capacity-alert"><span className="alert-symbol"><Bell size={17} /></span><span><b>Your storage is getting full</b><small>You have used {dashboard.capacityPercent}% of your storage space. A pickup might be a good idea.</small></span><button onClick={() => go("schedule")}>Find a pickup <ArrowRight size={15} /></button></div>}
      <section className="metric-grid">
        <article className="metric-card primary-metric"><span className="metric-icon"><Recycle size={19} /></span><span className="metric-label">RECYCLED & READY</span><div className="metric-value">{dashboard.totalKg}<small>kg</small></div><div className="metric-note"><span className="trend-pill"><TrendingUp size={13} /> Tracking</span> across your inventory</div><div className="metric-decoration" /></article>
        <article className="metric-card"><span className="metric-icon icon-blue"><ClipboardList size={19} /></span><span className="metric-label">ITEMS TRACKED</span><div className="metric-value">{dashboard.itemCount}<small>items</small></div><div className="metric-note">Across {Object.keys(dashboard.categoryKg).length} material types</div></article>
        <article className="metric-card"><span className="metric-icon icon-amber"><ArrowDownToLine size={19} /></span><span className="metric-label">STORAGE CAPACITY</span><div className="metric-value">{dashboard.capacityPercent}<small>%</small></div><div className="capacity-track"><i style={{ width: `${dashboard.capacityPercent}%` }} /></div><div className="metric-note">{dashboard.totalKg} kg of {dashboard.capacityKg} kg used</div></article>
      </section>
      <div className="content-grid">
        <section className="panel material-panel">
          <div className="panel-heading"><div><h2>Materials breakdown</h2><p>What you've collected so far</p></div><button className="text-link" onClick={() => go("inventory")}>View inventory <ArrowRight size={14} /></button></div>
          {Object.keys(dashboard.categoryKg).length === 0 ? <EmptyState icon={<Recycle size={20} />} title="Your recycling story starts here" text="Add your first recyclable item to see your impact take shape." action="Add an item" onClick={() => go("inventory")} /> :
            <div className="material-list">{categories.filter((category) => category in dashboard.categoryKg).map((category) => {
              const value = dashboard.categoryKg[category];
              const share = dashboard.totalKg ? Math.max(4, value / dashboard.totalKg * 100) : 0;
              return <div className="material-row" key={category}><span className={`category-icon ${categoryColors[category]}`}>{categoryIcons[category]}</span><span className="material-name">{category}<small>{items.filter((item) => item.category === category).length} entries</small></span><span className="material-bar"><i className={categoryColors[category]} style={{ width: `${share}%` }} /></span><b>{value}<small> kg</small></b></div>;
            })}</div>}
        </section>
        <section className="panel pickup-panel">
          <div className="panel-heading"><div><h2>Coming up</h2><p>Community collection days</p></div><button className="round-add" aria-label="Schedule pickup" onClick={() => go("schedule")}><Plus size={17} /></button></div>
          {upcoming.length === 0 ? <EmptyState icon={<CalendarDays size={20} />} title="Nothing on the calendar" text="Be the first to plan a collection for your community." action="Plan a pickup" onClick={() => go("schedule")} /> :
            <div className="pickup-list">{upcoming.map((pickup) => <div className="pickup-row" key={pickup.id}><div className="date-tile"><small>{new Date(pickup.pickupDate).toLocaleDateString(undefined, { month: "short" }).toUpperCase()}</small><b>{new Date(pickup.pickupDate).getDate()}</b></div><div><b>{pickup.title}</b><small>{pickup.location}</small></div><span className="status-dot" /> </div>)}</div>}
          <button className="panel-bottom-link" onClick={() => go("schedule")}>See community schedule <ArrowRight size={14} /></button>
        </section>
      </div>
      <section className="habit-banner"><span className="habit-spark"><Sparkles size={19} /></span><span><b>A little reminder</b><small>Rinse containers before recycling to help keep good materials in the cycle.</small></span><span className="habit-leaf">✳</span></section>
    </>
  );
}

function Inventory() {
  const { data, error, refresh } = useDashboardData();
  const [modal, setModal] = useState<Item | "new" | null>(null);
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const save = async (input: InventoryInput, item?: Item) => {
    if (item) await api.updateItem(item.id, input); else await api.addItem(input);
    setModal(null);
    setNotice(item ? "Your item was updated." : "Item added to your inventory.");
    await refresh();
  };
  const remove = async (item: Item) => {
    if (!window.confirm(`Remove "${item.name}" from your inventory?`)) return;
    try { await api.deleteItem(item.id); setNotice("Item removed."); await refresh(); }
    catch (e) { setNotice(e instanceof Error ? e.message : "Could not remove item."); }
  };
  if (!data) return <><PageHeading eyebrow="YOUR MATERIALS" title="My inventory" subtitle="Keep a simple record of what your household is setting aside." /><LoadingContent error={error} retry={refresh} /></>;
  const filtered = data.items.filter((item) => `${item.name} ${item.category}`.toLowerCase().includes(search.toLowerCase()));
  return <>
    <PageHeading eyebrow="YOUR MATERIALS" title="My inventory" subtitle="Keep a simple record of what your household is setting aside." action={<button className="button button-primary" onClick={() => setModal("new")}><Plus size={17} /> Add an item</button>} />
    {notice && <div className="notice-bar"><Check size={15} />{notice}<button onClick={() => setNotice("")}><X size={15} /></button></div>}
    <section className="inventory-summary"><div><span className="summary-icon"><Recycle size={19} /></span><span><small>TOTAL WEIGHT</small><b>{data.dashboard.totalKg} kg</b></span></div><div><span className="summary-icon summary-blue"><ClipboardList size={19} /></span><span><small>ITEM ENTRIES</small><b>{data.dashboard.itemCount}</b></span></div><label className="search-box"><input aria-label="Search inventory" placeholder="Search materials..." value={search} onChange={(e) => setSearch(e.target.value)} /><span>⌕</span></label></section>
    <section className="panel table-panel"><div className="table-header"><div><h2>Household materials</h2><p>Your recyclable materials, all in one place</p></div><span className="count-badge">{filtered.length} {filtered.length === 1 ? "entry" : "entries"}</span></div>
      {filtered.length === 0 ? <EmptyState icon={<Recycle size={20} />} title={search ? "No matching materials" : "Your inventory is waiting"} text={search ? "Try another search term." : "Add an item you've set aside for recycling."} action={search ? undefined : "Add your first item"} onClick={() => search ? undefined : setModal("new")} /> :
        <div className="table-scroll"><table><thead><tr><th>MATERIAL</th><th>CATEGORY</th><th>QUANTITY</th><th>LAST UPDATED</th><th></th></tr></thead><tbody>{filtered.map((item) =>
          <tr key={item.id}><td><span className={`category-icon tiny ${categoryColors[item.category] || "gray"}`}>{categoryIcons[item.category] || "＋"}</span><span className="table-item-name">{item.name}{item.notes && <small>{item.notes}</small>}</span></td><td><span className={`category-tag ${categoryColors[item.category] || "gray"}`}>{item.category}</span></td><td><b>{item.quantity}</b> <span className="unit-muted">{item.unit}</span></td><td className="muted-cell">{item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : "—"}</td><td><div className="row-actions"><button aria-label={`Edit ${item.name}`} title="Edit" onClick={() => setModal(item)}><Settings size={15} /></button><button aria-label={`Remove ${item.name}`} title="Remove" onClick={() => void remove(item)}><Trash2 size={15} /></button></div></td></tr>)}</tbody></table></div>}
    </section>
    <div className="inventory-tip"><CircleHelp size={16} /><span><b>Quick tip</b> — Weight units (kg and g) count toward your storage capacity. Items measured in pieces are tracked separately.</span></div>
    {modal && <InventoryModal item={modal === "new" ? undefined : modal} onClose={() => setModal(null)} onSave={save} />}
  </>;
}

function InventoryModal({ item, onClose, onSave }: { item?: Item; onClose: () => void; onSave: (input: InventoryInput, item?: Item) => Promise<void> }) {
  const [form, setForm] = useState<InventoryInput>({
    name: item?.name || "", category: item?.category || "Plastic", quantity: item?.quantity || 1, unit: item?.unit || "kg", notes: item?.notes || "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try { await onSave(form, item); } catch (e) { setError(e instanceof Error ? e.message : "Unable to save item."); } finally { setBusy(false); }
  };
  return <Modal title={item ? "Update this item" : "Add to your inventory"} onClose={onClose}><form className="modal-form" onSubmit={submit}>
    <label>Material name<input required minLength={2} maxLength={80} placeholder="e.g. Weekly paper & cardboard" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
    <div className="form-row"><label>Category<select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label><label>Quantity<input required type="number" min="0.01" max="1000000" step="any" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} /></label><label>Unit<select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}><option value="kg">kg</option><option value="g">g</option><option value="pcs">pcs</option></select></label></div>
    <label>Notes <span className="optional-label">OPTIONAL</span><textarea maxLength={300} rows={3} placeholder="Anything useful to remember…" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
    {error && <div className="inline-error">{error}</div>}
    <div className="modal-actions"><button className="button button-quiet" type="button" onClick={onClose}>Cancel</button><button className="button button-primary" disabled={busy}>{busy ? "Saving…" : item ? "Save changes" : "Add item"}</button></div>
  </form></Modal>;
}

function Schedule({ user }: { user: User }) {
  const [pickups, setPickups] = useState<Pickup[] | null>(null);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(false);
  const [notice, setNotice] = useState("");
  const load = useCallback(() => api.pickups().then((data) => { setPickups(data); setError(""); }).catch((e) => setError(e instanceof Error ? e.message : "Could not load pickups.")), []);
  useEffect(() => { void load(); }, [load]);
  const create = async (input: PickupInput) => {
    await api.addPickup(input);
    setModal(false);
    setNotice("Your collection has been added to the community schedule.");
    await load();
  };
  const setStatus = async (pickup: Pickup, status: Pickup["status"]) => {
    try { await api.updatePickup(pickup.id, status); await load(); }
    catch (e) { setNotice(e instanceof Error ? e.message : "Could not update pickup."); }
  };
  const active = pickups?.filter((pickup) => pickup.status === "Scheduled") || [];
  const past = pickups?.filter((pickup) => pickup.status !== "Scheduled") || [];
  return <>
    <PageHeading eyebrow="BETTER, TOGETHER" title="Community pickups" subtitle={`Collection days shared with neighbors in ${user.community}.`} action={<button className="button button-primary" onClick={() => setModal(true)}><Plus size={17} /> Plan a collection</button>} />
    <div className="community-note"><span className="community-note-icon"><Leaf size={18} /></span><span><b>A shared neighborhood calendar</b><small>Everyone in {user.community} can see and add collection days.</small></span><span className="member-count"><span className="member-dot" /><span>Community schedule</span></span></div>
    {notice && <div className="notice-bar"><Check size={15} />{notice}<button onClick={() => setNotice("")}><X size={15} /></button></div>}
    {!pickups ? <LoadingContent error={error} retry={load} /> : <div className="schedule-layout"><section className="panel schedule-panel"><div className="panel-heading"><div><h2>Upcoming collections</h2><p>Plan ahead and bring your recyclables along</p></div><span className="count-badge">{active.length} planned</span></div>
      {active.length === 0 ? <EmptyState icon={<CalendarDays size={20} />} title="No collections planned yet" text="Start a collection day and invite your community to join." action="Plan a collection" onClick={() => setModal(true)} /> :
        <div className="schedule-list">{active.map((pickup) => <article className="schedule-card" key={pickup.id}><div className="schedule-date"><span>{new Date(pickup.pickupDate).toLocaleDateString(undefined, { month: "short" }).toUpperCase()}</span><b>{new Date(pickup.pickupDate).getDate()}</b><small>{new Date(pickup.pickupDate).toLocaleDateString(undefined, { weekday: "short" })}</small></div><div className="schedule-details"><span className="scheduled-label"><i /> SCHEDULED</span><h3>{pickup.title}</h3><p><CalendarDays size={14} />{new Date(pickup.pickupDate).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })} <span>·</span> {pickup.location}</p>{pickup.notes && <div className="schedule-note">{pickup.notes}</div>}<small className="schedule-community">Organized by a neighbor · {pickup.community}</small></div><button className="complete-button" title="Mark completed" aria-label={`Mark ${pickup.title} completed`} onClick={() => void setStatus(pickup, "Completed")}><Check size={17} /></button></article>)}</div>}
    </section><aside className="schedule-aside"><section className="panel organize-card"><span className="organize-icon"><Sparkles size={18} /></span><h3>Make it a neighborhood thing.</h3><p>One well-planned pickup can help more recyclables find their way back into use.</p><button className="button button-primary" onClick={() => setModal(true)}><Plus size={16} /> Add a collection day</button></section>
      <section className="panel past-card"><div className="past-title"><h3>Recently wrapped up</h3><span>{past.length}</span></div>{past.length === 0 ? <p className="past-empty">Completed collections will show up here.</p> : past.slice(0, 4).map((pickup) => <div className="past-row" key={pickup.id}><span className={pickup.status === "Completed" ? "past-check" : "past-cancel"}>{pickup.status === "Completed" ? <Check size={12} /> : <X size={12} />}</span><span><b>{pickup.title}</b><small>{new Date(pickup.pickupDate).toLocaleDateString()} · {pickup.status}</small></span></div>)}</section></aside></div>}
    {modal && <PickupModal onClose={() => setModal(false)} onSave={create} />}
  </>;
}

function PickupModal({ onClose, onSave }: { onClose: () => void; onSave: (input: PickupInput) => Promise<void> }) {
  const [form, setForm] = useState<PickupInput>({ title: "", pickupDate: "", location: "", notes: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try { await onSave({ ...form, pickupDate: new Date(form.pickupDate).toISOString() }); }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to schedule collection."); } finally { setBusy(false); }
  };
  const minDate = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  return <Modal title="Plan a community collection" onClose={onClose}><form className="modal-form" onSubmit={submit}>
    <label>Collection name<input required minLength={3} maxLength={100} placeholder="e.g. Saturday neighborhood recycling" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
    <label>Date and time<input required type="datetime-local" min={minDate} value={form.pickupDate} onChange={(e) => setForm({ ...form, pickupDate: e.target.value })} /></label>
    <label>Meeting point<input required minLength={2} maxLength={160} placeholder="e.g. Community hall, north entrance" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></label>
    <label>Notes <span className="optional-label">OPTIONAL</span><textarea maxLength={300} rows={3} placeholder="Materials accepted, contact details, or other helpful info…" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
    {error && <div className="inline-error">{error}</div>}
    <div className="modal-actions"><button className="button button-quiet" type="button" onClick={onClose}>Cancel</button><button className="button button-primary" disabled={busy}>{busy ? "Scheduling…" : "Schedule pickup"}</button></div>
  </form></Modal>;
}

function Preferences({ user, onUpdate, onSignOut }: { user: User; onUpdate: (user: User) => void; onSignOut: () => void }) {
  const [community, setCommunity] = useState(user.community);
  const [capacity, setCapacity] = useState(user.capacityKg);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const save = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true); setNotice(""); setError("");
    try {
      const updated = await api.updateProfile({ community, capacityKg: Number(capacity) });
      onUpdate(updated); setCommunity(updated.community); setCapacity(updated.capacityKg); setNotice("Your preferences have been saved.");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save preferences."); }
    finally { setBusy(false); }
  };
  return <>
    <PageHeading eyebrow="YOUR SPACE" title="Preferences" subtitle="A few details help EcoCycle fit your household and community." />
    {notice && <div className="notice-bar"><Check size={15} />{notice}</div>}
    <div className="settings-layout"><form className="panel settings-panel" onSubmit={save}><div className="panel-heading"><div><h2>Household & community</h2><p>Personalize your local recycling space</p></div></div>
      <label>Your name<div className="readonly-field"><Avatar name={user.name} />{user.name}<span>Account name</span></div></label>
      <label>Email address<div className="readonly-field"><span className="readonly-email">{user.email}</span><span>Account email</span></div></label>
      <label>Community<input required minLength={2} maxLength={100} value={community} onChange={(e) => setCommunity(e.target.value)} /><small className="field-help">Pickup calendars are shared with members in the same community.</small></label>
      <label>Household storage limit<div className="capacity-input"><input type="number" min="1" max="10000" step="0.5" required value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} /><span>kg</span></div><small className="field-help">You'll get a reminder when your tracked recyclable weight reaches 80% of this limit.</small></label>
      {error && <div className="inline-error">{error}</div>}
      <div className="settings-actions"><button className="button button-primary" disabled={busy}>{busy ? "Saving…" : "Save preferences"}</button></div>
    </form><aside className="settings-side"><section className="panel about-card"><span className="about-icon"><Leaf size={19} /></span><h3>Doing our part, together.</h3><p>EcoCycle is built around UN Sustainable Development Goal 12: responsible consumption and production.</p><div className="about-target"><b>Target 12.5</b><span>Reduce waste through prevention, reduction, recycling, and reuse.</span></div></section><button className="button button-signout" onClick={onSignOut}><LogOut size={16} /> Sign out of EcoCycle</button></aside></div>
  </>;
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => { const close = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); }; window.addEventListener("keydown", close); return () => window.removeEventListener("keydown", close); }, [onClose]);
  return <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}><div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="modal-heading"><div><span className="form-kicker">ECOCYCLE</span><h2 id="modal-title">{title}</h2></div><button className="modal-close" aria-label="Close" onClick={onClose}><X size={18} /></button></div>{children}</div></div>;
}

function EmptyState({ icon, title, text, action, onClick }: { icon: ReactNode; title: string; text: string; action?: string; onClick?: () => void }) {
  return <div className="empty-state"><span className="empty-icon">{icon}</span><b>{title}</b><p>{text}</p>{action && <button className="text-link" onClick={onClick}>{action} <ArrowRight size={14} /></button>}</div>;
}

function LoadingContent({ error, retry }: { error: string; retry: () => void }) {
  if (error) return <div className="load-error"><p>{error}</p><button className="button button-quiet" onClick={() => void retry()}>Try again</button></div>;
  return <div className="content-loading"><span className="spinner" />Loading your community data…</div>;
}

export default App;
