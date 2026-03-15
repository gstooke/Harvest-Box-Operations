import { useState, useEffect, useCallback, Fragment } from "react";
import { supabase } from "./lib/supabase";

const SUPABASE_FUNCTIONS_URL = import.meta.env.VITE_SUPABASE_URL + "/functions/v1";



const COLORS = {
  bg: "#FFFFFF", surface: "#F9FAFB", surfaceAlt: "#F3F4F6",
  border: "#E5E7EB", borderDark: "#D1D5DB",
  text: "#111827", muted: "#6B7280", mutedLight: "#9CA3AF",
  green: "#15803D", greenMid: "#16A34A", greenLight: "#86EFAC", greenPale: "#F0FDF4",
  amber: "#D97706", amberLight: "#F59E0B", amberPale: "#FEF3C7",
  red: "#DC2626", redPale: "#FEF2F2",
  blue: "#1D4ED8", bluePale: "#EFF6FF",
};

const initialProducts = [
  { id: 1, productId: "HB-001", description: "Nibble Box 25 Pack", batches: [{ batch: "B2026-03A", qty: 120 }] },
  { id: 2, productId: "HB-002", description: "Power Mix 10x45g", batches: [{ batch: "B2026-03B", qty: 85 }] },
  { id: 3, productId: "HB-003", description: "Dipped Dark Choc 10x40g", batches: [{ batch: "B2026-03C", qty: 50 }] },
];

const initialIncomingStock = [
  { id: 1, supplier: "Nuts & Co", dateRaised: "2026-03-01", expectedDelivery: "2026-03-10", po: "PO-2026-001", reference: "REF-NUT-44A", status: "Pending", notes: "",
    items: [
      { id: 1, code: "NUT-ALMOND-1KG", description: "Roasted Almonds 1kg", qty: 200, cost: 12.50, receivedQty: 0, usedQty: 0 },
      { id: 2, code: "NUT-CASHEW-1KG", description: "Raw Cashews 1kg", qty: 300, cost: 18.00, receivedQty: 0, usedQty: 0 },
    ]
  },
  { id: 2, supplier: "SeedSource AU", dateRaised: "2026-03-03", expectedDelivery: "2026-03-12", po: "PO-2026-002", reference: "REF-SEED-21B", status: "Received", notes: "Arrived 1 day early, good condition.",
    items: [
      { id: 1, code: "SEED-PUMP-500G", description: "Pumpkin Seeds 500g", qty: 120, cost: 6.80, receivedQty: 120, usedQty: 40 },
      { id: 2, code: "SEED-SUNF-500G", description: "Sunflower Seeds 500g", qty: 80, cost: 4.50, receivedQty: 80, usedQty: 20 },
    ]
  },
  { id: 3, supplier: "OrganicFarm QLD", dateRaised: "2026-03-05", expectedDelivery: "2026-03-20", po: "PO-2026-003", reference: "REF-ORG-09C", status: "Pending", notes: "",
    items: [
      { id: 1, code: "ORG-DCHOC-200G", description: "Dark Chocolate Chips 200g", qty: 150, cost: 9.20, receivedQty: 0, usedQty: 0 },
      { id: 2, code: "ORG-COCO-500G", description: "Organic Coconut Flakes 500g", qty: 100, cost: 7.40, receivedQty: 0, usedQty: 0 },
      { id: 3, code: "ORG-GOJI-250G", description: "Dried Goji Berries 250g", qty: 100, cost: 14.00, receivedQty: 0, usedQty: 0 },
    ]
  },
];

const initialProduction = [
  {
    id: 1,
    productId: "HB-001",
    description: "Nibble Box 25 Pack",
    batch: "B2026-03A",
    qty: 60,
    stockLines: [
      { stockId: 1, itemId: 1, qty: 40 },
      { stockId: 2, itemId: 1, qty: 20 },
    ],
  },
];

const NAV = ["Incoming PO", "Raws", "Production", "Orders", "Products", "Settings"];

const PlusIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>;
const TrashIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>;
const EditIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const CloseIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>;
const ArrowIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>;
const OrdersIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>;
const SettingsIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
const PrintIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>;

function Modal({ title, onClose, children, maxWidth=580 }) {
  return (
    <div style={{ position:"fixed",inset:0,zIndex:1000,background:"rgba(0,0,0,0.4)",display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(3px)" }}>
      <div style={{ background:"#fff",borderRadius:10,padding:32,width:"100%",maxWidth,boxShadow:"0 8px 30px rgba(0,0,0,0.12)",border:"1px solid #E5E7EB",maxHeight:"90vh",overflowY:"auto" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24 }}>
          <h3 style={{ margin:0,fontSize:18,fontWeight:700,color:"#111827" }}>{title}</h3>
          <button onClick={onClose} style={{ background:"none",border:"none",cursor:"pointer",color:"#9CA3AF",padding:4,borderRadius:6,display:"flex" }}><CloseIcon /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

const inp = { width:"100%",padding:"9px 12px",border:"1px solid #E5E7EB",borderRadius:6,fontSize:14,color:"#111827",background:"#fff",outline:"none",fontFamily:"inherit",boxSizing:"border-box" };
const sel = { width:"100%",padding:"9px 12px",border:"1px solid #E5E7EB",borderRadius:6,fontSize:14,color:"#111827",background:"#fff",outline:"none",fontFamily:"inherit",boxSizing:"border-box",cursor:"pointer" };
const lbl = { display:"block",fontSize:11,fontWeight:600,color:"#6B7280",marginBottom:4,textTransform:"uppercase",letterSpacing:"0.05em" };

function Field({ label, children }) {
  return <div style={{ marginBottom:16 }}><label style={lbl}>{label}</label>{children}</div>;
}
function SaveCancel({ onClose, onSave, saveLabel="Save", disabled=false }) {
  return (
    <div style={{ display:"flex",gap:10,justifyContent:"flex-end",marginTop:8 }}>
      <button onClick={onClose} style={{ padding:"10px 20px",borderRadius:8,border:"1px solid #E5E7EB",background:"none",cursor:"pointer",color:"#6B7280",fontSize:14,fontWeight:600 }}>Cancel</button>
      <button onClick={onSave} disabled={disabled} style={{ padding:"10px 20px",borderRadius:8,border:"none",background:disabled?"#86EFAC":"#15803D",cursor:disabled?"not-allowed":"pointer",color:"#fff",fontSize:14,fontWeight:600 }}>{saveLabel}</button>
    </div>
  );
}
function ActionBtns({ onEdit, onDelete }) {
  return (
    <div style={{ display:"flex",gap:6 }}>
      <button onClick={onEdit} style={{ background:"#F0FDF4",border:"none",borderRadius:7,padding:"6px 10px",cursor:"pointer",color:"#16A34A",display:"flex",alignItems:"center" }}><EditIcon /></button>
      <button onClick={onDelete} style={{ background:"#FEF2F2",border:"none",borderRadius:7,padding:"6px 10px",cursor:"pointer",color:"#DC2626",display:"flex",alignItems:"center" }}><TrashIcon /></button>
    </div>
  );
}
function StatusBadge({ date }) {
  if (!date) return null;
  const diff = Math.ceil((new Date(date) - new Date()) / 86400000);
  if (diff < 0) return <span style={{ padding:"3px 10px",borderRadius:20,fontSize:12,fontWeight:600,color:"#DC2626",background:"#FEF2F2" }}>Overdue</span>;
  if (diff <= 3) return <span style={{ padding:"3px 10px",borderRadius:20,fontSize:12,fontWeight:600,color:"#D97706",background:"#FEF3C7" }}>Due Soon</span>;
  return <span style={{ padding:"3px 10px",borderRadius:20,fontSize:12,fontWeight:600,color:"#16A34A",background:"#F0FDF4" }}>On Track</span>;
}
function Toast({ toast }) {
  if (!toast) return null;
  return <div style={{ position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",zIndex:2000,background:"#111827",color:"#fff",padding:"12px 24px",borderRadius:8,fontSize:14,fontWeight:600,boxShadow:"0 4px 16px rgba(0,0,0,0.15)",borderLeft:`4px solid ${toast.color}`,whiteSpace:"nowrap" }}>{toast.msg}</div>;
}

const thS = { padding:"9px 14px",textAlign:"left",fontSize:11,fontWeight:600,color:"#6B7280",textTransform:"uppercase",letterSpacing:"0.05em",whiteSpace:"nowrap",borderBottom:"1px solid #E5E7EB",background:"#F9FAFB" };
const tdS = (i) => ({ padding:"12px 14px", background: i%2===0 ? "transparent" : "#F9FAFB" });

const CheckIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;

function IncomingStockForm({ initial, onSave, onClose, rawDefs, onMarkReceived }) {
  const emptyItem = () => ({ id: Date.now() + Math.random(), code: "", description: "", qty: "", cost: "", receivedQty: "", usedQty: "", batch: "", usedBy: "", receivedAt: "" });
  const empty = { supplier:"", dateRaised:"", expectedDelivery:"", po:"", reference:"", status:"Pending", notes:"", items:[] };
  const [form, setForm] = useState(initial ? { ...empty, ...initial } : { ...empty, items:[emptyItem()] });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const setItem = (id, k, v) => setForm(f=>({...f, items: f.items.map(it=>it.id===id?{...it,[k]:v}:it)}));
  const addItem = () => setForm(f=>({...f, items:[...f.items, emptyItem()]}));
  const removeItem = (id) => setForm(f=>({...f, items: f.items.filter(it=>it.id!==id)}));
  const rawList = rawDefs || [];
  const canSave = true;
  const canReceive = form.items.length > 0 && form.items.every(it => it.code && Number(it.receivedQty) > 0);

  return (
    <div>
      <Field label="Supplier"><input style={inp} value={form.supplier} onChange={e=>set("supplier",e.target.value)} placeholder="e.g. Nuts & Co" /></Field>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
        <Field label="Date Raised"><input style={inp} type="date" value={form.dateRaised} onChange={e=>set("dateRaised",e.target.value)} /></Field>
        <Field label="Expected Delivery"><input style={inp} type="date" value={form.expectedDelivery} onChange={e=>set("expectedDelivery",e.target.value)} /></Field>
      </div>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
        <Field label="PO #"><input style={inp} value={form.po} onChange={e=>set("po",e.target.value)} placeholder="PO-2026-001" /></Field>
        <Field label="Reference"><input style={inp} value={form.reference} onChange={e=>set("reference",e.target.value)} placeholder="REF-NUT-44A" /></Field>
      </div>

      {/* Line Items */}
      <div style={{ marginBottom:16 }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8 }}>
          <label style={lbl}>Line Items</label>
          <button onClick={addItem} style={{ display:"flex",alignItems:"center",gap:4,fontSize:12,fontWeight:700,color:"#16A34A",background:"#F0FDF4",border:"1px solid #86EFAC",borderRadius:7,padding:"4px 10px",cursor:"pointer" }}>
            <PlusIcon /> Add Item
          </button>
        </div>
        <div style={{ overflowX:"auto",WebkitOverflowScrolling:"touch" }}>
          <table style={{ width:"100%",minWidth:900,borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ background:"#F9FAFB" }}>
                {["Raw ID","Description","Cost ($)","Ord Qty","Rcvd Qty","Batch","Use By","Received At",""].map((h,i) => (
                  <th key={i} style={{ padding:"6px 8px",fontSize:11,fontWeight:700,color:"#6B7280",textTransform:"uppercase",letterSpacing:"0.04em",textAlign:"left",whiteSpace:"nowrap",borderBottom:"1px solid #E5E7EB" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {form.items.map((item, idx) => (
                <tr key={item.id} style={{ background:idx%2===0?"#fff":"#F9FAFB" }}>
                  <td style={{ padding:"4px 6px",minWidth:160 }}>
                    {rawList.length > 0 ? (
                      <select style={{ ...sel, fontSize:12, padding:"5px 8px", borderColor: item.code ? "#E5E7EB" : "#DC2626" }} value={item.code} onChange={e => {
                        const rd = rawList.find(r => r.raw_id === e.target.value);
                        setItem(item.id, "code", e.target.value);
                        if (rd) setItem(item.id, "description", rd.description);
                      }}>
                        <option value="">— select —</option>
                        {RAW_TYPES.map(type => {
                          const group = rawList.filter(r => r.raw_type === type);
                          if (group.length === 0) return null;
                          return <optgroup key={type} label={type}>{group.map(r => <option key={r.id} value={r.raw_id}>{r.raw_id}</option>)}</optgroup>;
                        })}
                        {rawList.filter(r => !r.raw_type || !RAW_TYPES.includes(r.raw_type)).map(r => <option key={r.id} value={r.raw_id}>{r.raw_id}</option>)}
                      </select>
                    ) : (
                      <input style={{ ...inp, fontSize:12, padding:"5px 8px", borderColor: item.code ? "#E5E7EB" : "#DC2626" }} value={item.code} onChange={e=>setItem(item.id,"code",e.target.value)} placeholder="RAW-ID" />
                    )}
                  </td>
                  <td style={{ padding:"4px 6px",minWidth:160 }}>
                    <input style={{ ...inp, fontSize:12, padding:"5px 8px" }} value={item.description} onChange={e=>setItem(item.id,"description",e.target.value)} placeholder="Description" />
                  </td>
                  <td style={{ padding:"4px 6px",minWidth:80 }}>
                    <input style={{ ...inp, fontSize:12, padding:"5px 8px" }} type="number" min="0" step="0.01" value={item.cost} onChange={e=>setItem(item.id,"cost",e.target.value)} placeholder="0.00" />
                  </td>
                  <td style={{ padding:"4px 6px",minWidth:75 }}>
                    <input style={{ ...inp, fontSize:12, padding:"5px 8px" }} type="number" min="0" value={item.qty} onChange={e=>setItem(item.id,"qty",e.target.value)} placeholder="0" />
                  </td>
                  <td style={{ padding:"4px 6px",minWidth:75 }}>
                    <input style={{ ...inp, fontSize:12, padding:"5px 8px" }} type="number" min="0" value={item.receivedQty} onChange={e=>setItem(item.id,"receivedQty",e.target.value)} placeholder="0" />
                  </td>
                  <td style={{ padding:"4px 6px",minWidth:110 }}>
                    <input style={{ ...inp, fontSize:12, padding:"5px 8px" }} value={item.batch||""} onChange={e=>setItem(item.id,"batch",e.target.value)} placeholder="B2026-001" />
                  </td>
                  <td style={{ padding:"4px 6px",minWidth:120 }}>
                    <input style={{ ...inp, fontSize:12, padding:"5px 8px" }} type="date" value={item.usedBy||""} onChange={e=>setItem(item.id,"usedBy",e.target.value)} />
                  </td>
                  <td style={{ padding:"4px 6px",minWidth:140,whiteSpace:"nowrap",fontSize:12,color:"#6B7280" }}>
                    {item.receivedAt ? new Date(item.receivedAt).toLocaleString("en-AU",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"}) : <span style={{color:"#D1D5DB"}}>—</span>}
                  </td>
                  <td style={{ padding:"4px 6px" }}>
                    <button onClick={()=>removeItem(item.id)} style={{ background:"#FEF2F2",border:"none",borderRadius:6,padding:"5px 8px",cursor:"pointer",color:"#DC2626",display:"flex",alignItems:"center" }}><TrashIcon /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {form.items.length===0 && <div style={{ fontSize:12,color:"#9CA3AF",padding:"10px 0" }}>No items added — click Add Item above.</div>}
        </div>
      </div>

      <Field label="Notes"><textarea style={{...inp,resize:"vertical",minHeight:60,lineHeight:1.5}} value={form.notes} onChange={e=>set("notes",e.target.value)} placeholder="Any notes about this order..." /></Field>
      {onMarkReceived && (
        <button onClick={canReceive ? ()=>onMarkReceived(form) : undefined} disabled={!canReceive} style={{ display:"flex",alignItems:"center",gap:6,width:"100%",justifyContent:"center",padding:"10px 0",marginBottom:12,background:canReceive?"#15803D":"#D1D5DB",border:"none",borderRadius:8,cursor:canReceive?"pointer":"not-allowed",color:canReceive?"#fff":"#9CA3AF",fontSize:14,fontWeight:700 }}>
          <CheckIcon /> Mark as Received
        </button>
      )}
      <SaveCancel onClose={onClose} onSave={()=>onSave(form)} disabled={!canSave} />
    </div>
  );
}

function StockStatusBadge({ row }) {
  if (row.status === "Processed") return <span style={{ padding:"3px 10px",borderRadius:20,fontSize:12,fontWeight:600,color:"#15803D",background:"#DCFCE7" }}>✓ Processed</span>;
  const diff = Math.ceil((new Date(row.expectedDelivery) - new Date()) / 86400000);
  if (!row.expectedDelivery) return null;
  if (diff < 0) return <span style={{ padding:"3px 10px",borderRadius:20,fontSize:12,fontWeight:600,color:"#DC2626",background:"#FEF2F2" }}>Overdue</span>;
  if (diff <= 3) return <span style={{ padding:"3px 10px",borderRadius:20,fontSize:12,fontWeight:600,color:"#D97706",background:"#FEF3C7" }}>Due Soon</span>;
  return <span style={{ padding:"3px 10px",borderRadius:20,fontSize:12,fontWeight:600,color:"#16A34A",background:"#F0FDF4" }}>Pending</span>;
}

function ItemQtyBar({ ordered, received, used }) {
  const ord = Number(ordered)||0;
  const rec = Number(received)||0;
  const use = Number(used)||0;
  if (ord === 0) return null;
  const recPct = Math.min(100, (rec/ord)*100);
  const usePct = Math.min(recPct, (use/ord)*100);
  return (
    <div style={{ height:5,background:"#E5E7EB",borderRadius:4,overflow:"hidden",position:"relative",marginTop:4 }}>
      <div style={{ position:"absolute",left:0,top:0,height:"100%",width:`${recPct}%`,background:"#86EFAC",borderRadius:4 }}/>
      <div style={{ position:"absolute",left:0,top:0,height:"100%",width:`${usePct}%`,background:"#16A34A",borderRadius:4 }}/>
    </div>
  );
}

function StockTab({ data, onDelete, onUpdate, stockCodes, rawDefs, production, incomingStock }) {
  const [search, setSearch] = useState("");
  const [editRow, setEditRow] = useState(null);
  const [form, setForm] = useState({});
  const setF = (k, v) => setForm(f => ({...f, [k]: v}));

  const openEdit = (row) => {
    setEditRow(row);
    setForm({
      code: row.code||"",
      description: row.description||"",
      supplier: row.supplier||"",
      po_number: row.po_number||"",
      received_at: row.received_at ? row.received_at.slice(0,10) : "",
      qty_received: row.qty_received??0,
      qty_available: row.qty_available??0,
      batch: row.batch||"",
      best_before: row.best_before||"",
    });
  };
  const closeEdit = () => setEditRow(null);
  const saveEdit = () => {
    const saved = {
      ...editRow,
      ...form,
      qty_received: Number(form.qty_received)||0,
      qty_available: Number(form.qty_available)||0,
      received_at: form.received_at ? new Date(form.received_at+"T00:00:00").toISOString() : editRow.received_at,
      best_before: form.best_before||null,
    };
    onUpdate(saved);
    closeEdit();
  };

  const [collapsed, setCollapsed] = useState({});
  const toggle = (code) => setCollapsed(c => ({...c, [code]: c[code] !== false ? false : true}));

  // Calculate qty used for a raw lot from production runs.
  // Match: production stockLine.stockId === lot.po_id, and the PO item at stockLine.itemId has same code.
  const calcUsed = (lot) => {
    return (production||[]).reduce((total, run) => {
      return total + (run.stockLines||[]).reduce((s, line) => {
        if (Number(line.stockId) !== Number(lot.po_id)) return s;
        const po = (incomingStock||[]).find(p => p.id === Number(line.stockId));
        const item = (po?.items||[]).find(it => it.id === Number(line.itemId));
        return item?.code === lot.code ? s + Number(line.qty) : s;
      }, 0);
    }, 0);
  };
  const calcAvail = (lot) => Math.max(0, (Number(lot.qty_received)||0) - calcUsed(lot));

  const allRows = data.filter(row => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (row.code||"").toLowerCase().includes(q) ||
           (row.description||"").toLowerCase().includes(q) ||
           (row.supplier||"").toLowerCase().includes(q) ||
           (row.po_number||"").toLowerCase().includes(q) ||
           (row.batch||"").toLowerCase().includes(q);
  });

  // Group by code, sorted by code name
  const codeGroups = Object.values(
    allRows.reduce((acc, row) => {
      const key = row.code || "(no code)";
      if (!acc[key]) acc[key] = { code: key, description: row.description||"", lots: [] };
      acc[key].lots.push(row);
      return acc;
    }, {})
  ).sort((a,b) => a.code.localeCompare(b.code));

  // Group code groups by raw type
  const getRawType = (code) => (rawDefs||[]).find(r => r.raw_id === code)?.raw_type || "Other";
  const typeMap = {};
  codeGroups.forEach(cg => {
    const t = getRawType(cg.code);
    if (!typeMap[t]) typeMap[t] = [];
    typeMap[t].push(cg);
  });
  const TYPE_ORDER = ["Food", "Packaging", "Chemical", "Other"];
  const allTypes = [...TYPE_ORDER, ...Object.keys(typeMap).filter(t => !TYPE_ORDER.includes(t))];
  const typeGroups = allTypes.filter(t => typeMap[t]).map(t => ({ type: t, codeGroups: typeMap[t] }));
  const groups = codeGroups; // keep for totalAvail calc

  const totalAvail = allRows.reduce((s,r)=>s+calcAvail(r),0);
  const thS = { textAlign:"left",fontWeight:600,color:"#6B7280",fontSize:11,textTransform:"uppercase",letterSpacing:"0.05em",whiteSpace:"nowrap",padding:"8px 12px",background:"#F9FAFB" };

  const bbColour = (bb) => {
    if (!bb) return {};
    const days = Math.ceil((new Date(bb) - new Date()) / 86400000);
    if (days < 0) return { color:"#DC2626", fontWeight:700 };
    if (days <= 30) return { color:"#D97706", fontWeight:700 };
    return { color:"#15803D" };
  };

  const EditIcon = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;

  return (
    <div>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16,gap:12,flexWrap:"wrap" }}>
        <div>
          <h2 style={{ margin:0,fontSize:22,fontWeight:800,color:"#111827" }}>Raws</h2>
          <p style={{ margin:"4px 0 0",fontSize:13,color:"#9CA3AF" }}>{groups.length} codes · {allRows.length} lots · {totalAvail} units available</p>
        </div>
        <button onClick={()=>openEdit({id:Date.now(),code:"",description:"",batch:"",best_before:"",supplier:"",po_number:"",received_at:new Date().toISOString().slice(0,10),qty_received:0,qty_available:0})} style={{ display:"flex",alignItems:"center",gap:7,padding:"10px 18px",background:"#15803D",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontSize:14,fontWeight:700,flexShrink:0 }}>
          <PlusIcon /> Add Raw
        </button>
      </div>

      <div style={{ position:"relative",marginBottom:16 }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round" style={{ position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",pointerEvents:"none" }}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search code, description, supplier, batch…" style={{ width:"100%",padding:"9px 32px 9px 34px",borderRadius:8,border:"1px solid #E5E7EB",fontSize:13,background:"#fff",boxSizing:"border-box" }} />
        {search && <button onClick={()=>setSearch("")} style={{ position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"#9CA3AF",fontSize:16,lineHeight:1,padding:0 }}>✕</button>}
      </div>

      {codeGroups.length === 0 ? (
        <div style={{ textAlign:"center",padding:"48px 24px",color:"#9CA3AF",fontSize:14 }}>
          {data.length === 0 ? "No stock yet — mark a PO as processed to add stock." : "No results match your search."}
        </div>
      ) : (
        <div style={{ display:"flex",flexDirection:"column",gap:20 }}>
          {typeGroups.map(({ type, codeGroups: typeCodes }) => {
            const typeAvail = typeCodes.reduce((s,cg)=>s+cg.lots.reduce((ss,r)=>ss+calcAvail(r),0),0);
            return (
              <div key={type}>
                <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:8 }}>
                  <span style={{ fontSize:13,fontWeight:800,color:"#374151",textTransform:"uppercase",letterSpacing:"0.07em" }}>{type}</span>
                  <span style={{ fontSize:12,color:"#9CA3AF" }}>{typeCodes.length} code{typeCodes.length!==1?"s":""}</span>
                  <span style={{ fontSize:12,fontWeight:700,color:typeAvail>0?"#15803D":"#9CA3AF",background:typeAvail>0?"#F0FDF4":"#F9FAFB",padding:"2px 10px",borderRadius:20 }}>{typeAvail} avail</span>
                </div>
                <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                  {typeCodes.map(group => {
                    const isOpen = collapsed[group.code] === false;
                    const groupAvail = group.lots.reduce((s,r)=>s+calcAvail(r),0);
                    const groupRcvd  = group.lots.reduce((s,r)=>s+(Number(r.qty_received)||0),0);
                    return (
                      <div key={group.code} style={{ border:"1px solid #E5E7EB",borderRadius:8,overflow:"hidden",background:"#fff" }}>
                        <div onClick={()=>toggle(group.code)} style={{ display:"flex",alignItems:"center",gap:10,padding:"11px 14px",cursor:"pointer",background:groupAvail>0?"#fff":"#F9FAFB",flexWrap:"wrap" }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink:0,transform:isOpen?"rotate(0deg)":"rotate(-90deg)",transition:"transform 0.18s" }}><polyline points="6 9 12 15 18 9"/></svg>
                          <span style={{ fontFamily:"monospace",fontSize:13,color:"#374151",fontWeight:700,background:"#F3F4F6",padding:"2px 9px",borderRadius:5,flexShrink:0 }}>{group.code}</span>
                          <span style={{ fontSize:13,color:"#111827",fontWeight:600,flex:1,minWidth:0 }}>{group.description}</span>
                          <span style={{ fontSize:12,color:"#9CA3AF",whiteSpace:"nowrap" }}>{group.lots.length} lot{group.lots.length!==1?"s":""}</span>
                          <span style={{ fontSize:13,fontWeight:800,color:groupAvail>0?"#15803D":"#9CA3AF",whiteSpace:"nowrap",background:groupAvail>0?"#F0FDF4":"#F9FAFB",padding:"3px 10px",borderRadius:20 }}>{groupAvail} avail</span>
                        </div>
                        {isOpen && (
                          <div style={{ overflowX:"auto",WebkitOverflowScrolling:"touch",borderTop:"1px solid #E5E7EB" }}>
                            <table style={{ width:"100%",minWidth:640,borderCollapse:"collapse",fontSize:12 }}>
                              <thead>
                                <tr style={{ background:"#F9FAFB" }}>
                                  <th style={thS}>Batch</th>
                                  <th style={thS}>Best Before</th>
                                  <th style={thS}>Supplier</th>
                                  <th style={thS}>PO #</th>
                                  <th style={thS}>Received</th>
                                  <th style={{...thS,textAlign:"right"}}>Rcvd Qty</th>
                                  <th style={{...thS,textAlign:"right"}}>Available</th>
                                  <th style={thS}></th>
                                </tr>
                              </thead>
                              <tbody>
                                {group.lots.sort((a,b)=>(b.received_at||"").localeCompare(a.received_at||"")).map((row,i) => (
                                  <tr key={row.id} style={{ borderTop:"1px solid #E5E7EB",background:i%2===0?"#fff":"#F9FAFB" }}>
                                    <td style={{ padding:"8px 12px",fontFamily:"monospace",color:"#374151" }}>{row.batch||<span style={{color:"#D1D5DB"}}>—</span>}</td>
                                    <td style={{ padding:"8px 12px",whiteSpace:"nowrap",...bbColour(row.best_before) }}>
                                      {row.best_before ? new Date(row.best_before+"T00:00:00").toLocaleDateString("en-AU",{day:"2-digit",month:"short",year:"numeric"}) : <span style={{color:"#D1D5DB"}}>—</span>}
                                    </td>
                                    <td style={{ padding:"8px 12px",color:"#374151",whiteSpace:"nowrap" }}>{row.supplier||"—"}</td>
                                    <td style={{ padding:"8px 12px",fontFamily:"monospace",color:"#9CA3AF",whiteSpace:"nowrap" }}>{row.po_number||"—"}</td>
                                    <td style={{ padding:"8px 12px",color:"#9CA3AF",whiteSpace:"nowrap" }}>
                                      {row.received_at ? new Date(row.received_at).toLocaleDateString("en-AU",{day:"2-digit",month:"short",year:"numeric"}) : "—"}
                                    </td>
                                    <td style={{ padding:"8px 12px",textAlign:"right",color:"#6B7280",fontWeight:600 }}>{Number(row.qty_received)||0}</td>
                                    <td style={{ padding:"8px 12px",textAlign:"right",fontWeight:800,color:calcAvail(row)>0?"#15803D":"#9CA3AF" }}>{calcAvail(row)}</td>
                                    <td style={{ padding:"8px 12px" }}>
                                      <div style={{ display:"flex",gap:5 }}>
                                        <button onClick={()=>openEdit(row)} title="Edit lot" style={{ background:"#F0FDF4",border:"none",borderRadius:7,padding:"5px 8px",cursor:"pointer",color:"#15803D",display:"flex",alignItems:"center" }}><EditIcon /></button>
                                        <button onClick={()=>onDelete(row.id)} title="Delete lot" style={{ background:"#FEF2F2",border:"none",borderRadius:7,padding:"5px 8px",cursor:"pointer",color:"#DC2626",display:"flex",alignItems:"center" }}><TrashIcon /></button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot>
                                <tr style={{ borderTop:"1px solid #E5E7EB",background:"#F9FAFB" }}>
                                  <td colSpan={5} style={{ padding:"7px 12px",fontSize:11,fontWeight:700,color:"#6B7280",textTransform:"uppercase",letterSpacing:"0.05em" }}>Total</td>
                                  <td style={{ padding:"7px 12px",textAlign:"right",fontWeight:800,color:"#6B7280" }}>{groupRcvd}</td>
                                  <td style={{ padding:"7px 12px",textAlign:"right",fontWeight:800,color:groupAvail>0?"#15803D":"#9CA3AF" }}>{groupAvail}</td>
                                  <td></td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editRow && (
        <Modal title="Edit Raw Lot" onClose={closeEdit}>
          <Field label="Item Code">
            {stockCodes && stockCodes.length > 0 ? (
              <select style={sel} value={form.code} onChange={e => {
                const sc = stockCodes.find(r => r.code === e.target.value);
                setF("code", e.target.value);
                if (sc) setF("description", sc.description);
              }}>
                <option value="">— select code —</option>
                {STOCK_TYPES.map(type => {
                  const group = stockCodes.filter(r => r.type === type);
                  if (!group.length) return null;
                  return <optgroup key={type} label={type}>{group.map(r => <option key={r.id} value={r.code}>{r.code} · {r.description}</option>)}</optgroup>;
                })}
              </select>
            ) : (
              <input style={inp} value={form.code} onChange={e=>setF("code",e.target.value)} placeholder="NUT-ALMOND-1KG" />
            )}
          </Field>
          <Field label="Description"><input style={inp} value={form.description} onChange={e=>setF("description",e.target.value)} placeholder="Description" /></Field>
          <Field label="Batch"><input style={inp} value={form.batch} onChange={e=>setF("batch",e.target.value)} placeholder="e.g. B2026-03-A" /></Field>
          <Field label="Best Before"><input style={inp} type="date" value={form.best_before} onChange={e=>setF("best_before",e.target.value)} /></Field>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <Field label="Supplier"><input style={inp} value={form.supplier} onChange={e=>setF("supplier",e.target.value)} placeholder="Supplier" /></Field>
            <Field label="PO #"><input style={inp} value={form.po_number} onChange={e=>setF("po_number",e.target.value)} placeholder="PO-2026-001" /></Field>
          </div>
          <Field label="Date Received"><input style={inp} type="date" value={form.received_at} onChange={e=>setF("received_at",e.target.value)} /></Field>
          <Field label="Qty Received"><input style={inp} type="number" min="0" value={form.qty_received} onChange={e=>setF("qty_received",e.target.value)} /></Field>
          <SaveCancel onClose={closeEdit} onSave={saveEdit} />
        </Modal>
      )}
    </div>
  );
}

function IncomingStockTab({ data, setData, rawDefs, setRawDefs, onDelete, onReceived }) {
  const [modal, setModal] = useState(false);
  const [edit, setEdit] = useState(null);
  const [search, setSearch] = useState("");
  const [hideReceived, setHideReceived] = useState(true);

  const [collapsed, setCollapsed] = useState({});
  const toggleCollapse = (id) => setCollapsed(c => ({ ...c, [id]: c[id] === false ? true : false }));

  const close = () => { setModal(false); setEdit(null); };
  const save = (form) => {
    const items = (form.items||[])
      .map(it=>({ id:it.id, code:it.code||"", description:it.description||"", qty:Number(it.qty)||0, cost:Number(it.cost)||0, receivedQty:Number(it.receivedQty)||0, usedQty:Number(it.usedQty)||0, batch:it.batch||"", usedBy:it.usedBy||"", receivedAt:it.receivedAt||"" }))
      .filter(it=>it.code||it.description);
    const record = { ...form, items };
    if (edit) {
      const status = edit.status === "Processed" ? "Processed" : record.status;
      const saved = { ...record, id: edit.id, status };
      setData(d=>d.map(r => r.id===edit.id ? saved : r));
      // Direct targeted update so batch/usedBy/receivedAt are reliably persisted
      supabase.from("incoming_stock").update({
        supplier: saved.supplier,
        po: saved.po,
        reference: saved.reference,
        status: saved.status,
        notes: saved.notes,
        dateraised: saved.dateRaised || saved.dateraised || "",
        expecteddelivery: saved.expectedDelivery || saved.expecteddelivery || "",
        items: JSON.stringify(items),
      }).eq("id", edit.id).then(({ error }) => { if (error) console.warn("PO update error:", error); });
    } else {
      const newId = Date.now();
      const saved = { ...record, id: newId, status: "Pending" };
      setData(d=>[...d, saved]);
      supabase.from("incoming_stock").insert({
        id: newId,
        supplier: saved.supplier,
        po: saved.po,
        reference: saved.reference,
        status: saved.status,
        notes: saved.notes,
        dateraised: saved.dateRaised || saved.dateraised || "",
        expecteddelivery: saved.expectedDelivery || saved.expecteddelivery || "",
        items: JSON.stringify(items),
      }).then(({ error }) => { if (error) console.warn("PO insert error:", error); });
    }
    // Auto-register any new raw IDs into raw_defs
    if (setRawDefs) {
      items.forEach(it => {
        if (!it.code) return;
        setRawDefs(prev => {
          if (prev.find(r => r.raw_id === it.code)) return prev;
          return [...prev, { id: Date.now() + Math.random(), raw_id: it.code, description: it.description || "", available: true, raw_type: "Food" }];
        });
      });
    }
    close();
  };
  const markReceived = (id, formItems) => {
    const row = data.find(r => r.id === id);
    const now = new Date().toISOString();
    const sourceItems = formItems || row?.items || [];
    const updatedItems = sourceItems.map(it=>({...it, receivedQty: it.receivedQty>0 ? it.receivedQty : it.qty, receivedAt: it.receivedAt || now}));
    setData(d=>d.map(r=>{
      if (r.id!==id) return r;
      return {...r, status:"Processed", items: updatedItems};
    }));
    supabase.from("incoming_stock").update({
      status: "Processed",
      items: JSON.stringify(updatedItems),
    }).eq("id", id).then(({ error }) => { if (error) console.warn("Mark received error:", error); });
    if (onReceived && row) onReceived({...row, items: updatedItems});
  };

  const pendingCount = data.filter(r=>r.status!=="Processed").length;
  const receivedCount = data.filter(r=>r.status==="Processed").length;

  const filtered = data.filter(row => {
    if (hideReceived && row.status === "Processed") return false;
    if (search) {
      const q = search.toLowerCase();
      const inHeader = (row.supplier||"").toLowerCase().includes(q) || (row.po||"").toLowerCase().includes(q) || (row.reference||"").toLowerCase().includes(q);
      const inItems = (row.items||[]).some(it => (it.code||"").toLowerCase().includes(q) || (it.description||"").toLowerCase().includes(q));
      if (!inHeader && !inItems) return false;
    }
    return true;
  }).sort((a,b) => (b.expectedDelivery||"").localeCompare(a.expectedDelivery||""));

  return (
    <div>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16,gap:12,flexWrap:"wrap" }}>
        <div>
          <h2 style={{ margin:0,fontSize:22,fontWeight:800,color:"#111827" }}>Incoming PO</h2>
          <p style={{ margin:"4px 0 0",fontSize:13,color:"#9CA3AF" }}>{pendingCount} pending · {receivedCount} received</p>
        </div>
        <button onClick={()=>setModal(true)} style={{ display:"flex",alignItems:"center",gap:7,padding:"10px 18px",background:"#15803D",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontSize:14,fontWeight:700,flexShrink:0 }}>
          <PlusIcon /> New Order
        </button>
      </div>

      <div style={{ display:"flex",gap:10,alignItems:"center",marginBottom:16,flexWrap:"wrap" }}>
        <div style={{ position:"relative",flex:1,minWidth:200 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round" style={{ position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",pointerEvents:"none" }}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search supplier, PO, item code…" style={{ width:"100%",padding:"9px 32px 9px 34px",borderRadius:8,border:"1px solid #E5E7EB",fontSize:13,background:"#fff",boxSizing:"border-box" }} />
          {search && <button onClick={()=>setSearch("")} style={{ position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"#9CA3AF",fontSize:16,lineHeight:1,padding:0 }}>✕</button>}
        </div>
        <label style={{ display:"flex",alignItems:"center",gap:8,fontSize:13,fontWeight:600,color:"#374151",cursor:"pointer",whiteSpace:"nowrap",userSelect:"none",background:"#F9FAFB",border:"1px solid #E5E7EB",borderRadius:8,padding:"8px 14px" }}>
          <input type="checkbox" checked={hideReceived} onChange={e=>setHideReceived(e.target.checked)} style={{ width:16,height:16,accentColor:"#15803D",cursor:"pointer" }} />
          Hide Processed
        </label>
      </div>

      {data.length===0 ? (
        <div style={{ textAlign:"center",padding:"60px 0",color:"#9CA3AF" }}><div style={{ fontSize:40,marginBottom:12 }}>📦</div><p>No incoming stock orders yet</p></div>
      ) : filtered.length===0 ? (
        <div style={{ textAlign:"center",padding:"40px 0",color:"#9CA3AF" }}><p>No orders match your search{hideReceived ? " (processed orders are hidden)" : ""}.</p></div>
      ) : (
        <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
          {filtered.map(row=>{
            const isCollapsed = collapsed[row.id] !== false;
            return (
            <div key={row.id} style={{ background:"#fff",border:`1px solid ${row.status==="Processed"?"#86EFAC":"#E5E7EB"}`,borderRadius:8,overflow:"hidden" }}>
              {/* Header row */}
              <div style={{ padding:"10px 12px",display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",background:row.status==="Processed"?"#F0FDF4":"#fff",borderBottom:isCollapsed?"none":"1px solid #E5E7EB" }}>
                <span onClick={()=>toggleCollapse(row.id)} style={{ fontWeight:700,color:"#111827",fontSize:14,whiteSpace:"nowrap",cursor:"pointer" }}>{row.supplier}</span>
                <span onClick={()=>toggleCollapse(row.id)} style={{ fontFamily:"monospace",fontSize:12,background:"#FEF3C7",color:"#D97706",padding:"2px 8px",borderRadius:5,fontWeight:700,whiteSpace:"nowrap",cursor:"pointer" }}>{row.po}</span>
                {row.reference && <span style={{ fontFamily:"monospace",fontSize:12,color:"#9CA3AF",whiteSpace:"nowrap" }}>{row.reference}</span>}
                <span style={{ width:1,height:14,background:"#E5E7EB",flexShrink:0 }} />
                <span style={{ fontSize:12,color:"#6B7280",whiteSpace:"nowrap" }}><span style={{ fontWeight:600 }}>Raised:</span> {row.dateRaised}</span>
                <span style={{ fontSize:12,color:"#6B7280",whiteSpace:"nowrap" }}><span style={{ fontWeight:600 }}>Due:</span> {row.expectedDelivery}</span>
                {row.receivedAt && <span style={{ fontSize:12,color:"#15803D",fontWeight:600,whiteSpace:"nowrap" }}>Rcvd: {new Date(row.receivedAt).toLocaleString("en-AU",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"})}</span>}
                <StockStatusBadge row={row} />
                <div style={{ marginLeft:"auto",display:"flex",gap:6,alignItems:"center",flexShrink:0 }}>
                  <svg onClick={()=>toggleCollapse(row.id)} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round" style={{ cursor:"pointer",transform:isCollapsed?"rotate(-90deg)":"rotate(0deg)",transition:"transform 0.2s",flexShrink:0 }}><polyline points="6 9 12 15 18 9"/></svg>
                  <button onClick={()=>{setEdit(row);setModal(true);}} style={{ background:"#F0FDF4",border:"none",borderRadius:7,padding:"5px 9px",cursor:"pointer",color:"#16A34A",display:"flex",alignItems:"center" }}><EditIcon /></button>
                </div>
              </div>

              {/* Items table with per-item qty tracking */}
              {!isCollapsed && row.items?.length>0 && (
                <div style={{ padding:"12px 16px 0", overflowX:"auto", WebkitOverflowScrolling:"touch" }}>
                  <table style={{ width:"100%",minWidth:480,borderCollapse:"collapse",fontSize:13 }}>
                    <thead>
                      <tr style={{ borderBottom:"1px solid #E5E7EB" }}>
                        <th style={{...thS,padding:"7px 10px"}}>Item Code</th>
                        <th style={{...thS,padding:"7px 10px"}}>Description</th>
                        <th style={{...thS,padding:"7px 10px",textAlign:"right"}}>Ordered</th>
                        <th style={{...thS,padding:"7px 10px",textAlign:"right"}}>Received</th>
                        <th style={{...thS,padding:"7px 10px",textAlign:"right"}}>Used</th>
                        <th style={{...thS,padding:"7px 10px",textAlign:"right"}}>Remaining</th>
                      </tr>
                    </thead>
                    <tbody>
                      {row.items.map((item,i)=>{
                        const remaining = Math.max(0, (Number(item.receivedQty)||0) - (Number(item.usedQty)||0));
                        return (
                          <tr key={item.id||i}>
                            <td style={{ padding:"8px 10px",borderBottom:"1px solid #E5E7EB" }}>
                              <span style={{ fontFamily:"monospace",fontSize:12,color:"#374151",fontWeight:700,background:"#F3F4F6",padding:"1px 6px",borderRadius:4 }}>{item.code}</span>
                            </td>
                            <td style={{ padding:"8px 10px",color:"#111827",borderBottom:"1px solid #E5E7EB" }}>
                              <div>{item.description}</div>
                              <ItemQtyBar ordered={item.qty} received={item.receivedQty} used={item.usedQty} />
                            </td>
                            <td style={{ padding:"8px 10px",textAlign:"right",color:"#6B7280",fontWeight:600,borderBottom:"1px solid #E5E7EB" }}>{item.qty}</td>
                            <td style={{ padding:"8px 10px",textAlign:"right",color:"#16A34A",fontWeight:700,borderBottom:"1px solid #E5E7EB" }}>{item.receivedQty||0}</td>
                            <td style={{ padding:"8px 10px",textAlign:"right",color:"#15803D",fontWeight:700,borderBottom:"1px solid #E5E7EB" }}>{item.usedQty||0}</td>
                            <td style={{ padding:"8px 10px",textAlign:"right",fontWeight:800,borderBottom:"1px solid #E5E7EB",color:remaining>0?"#D97706":"#9CA3AF" }}>{remaining}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      {(()=>{
                        const totOrd = row.items.reduce((s,it)=>s+(Number(it.qty)||0),0);
                        const totRec = row.items.reduce((s,it)=>s+(Number(it.receivedQty)||0),0);
                        const totUsed = row.items.reduce((s,it)=>s+(Number(it.usedQty)||0),0);
                        const totRem = Math.max(0,totRec-totUsed);
                        return (
                          <tr style={{ borderTop:"1px solid #E5E7EB",background:"#F9FAFB" }}>
                            <td colSpan={3} style={{ padding:"8px 10px",fontSize:11,fontWeight:700,color:"#6B7280",textTransform:"uppercase",letterSpacing:"0.05em" }}>Total</td>
                            <td style={{ padding:"8px 10px",textAlign:"right",fontWeight:800,color:"#6B7280" }}>{totOrd}</td>
                            <td style={{ padding:"8px 10px",textAlign:"right",fontWeight:800,color:"#16A34A" }}>{totRec}</td>
                            <td style={{ padding:"8px 10px",textAlign:"right",fontWeight:800,color:"#15803D" }}>{totUsed}</td>
                            <td style={{ padding:"8px 10px",textAlign:"right",fontWeight:800,color:totRem>0?"#D97706":"#9CA3AF" }}>{totRem}</td>
                          </tr>
                        );
                      })()}
                    </tfoot>
                  </table>
                </div>
              )}

              {/* Notes */}
              {!isCollapsed && row.notes && (
                <div style={{ margin:"12px 20px",background:"#FFFBEB",borderRadius:8,padding:"8px 12px",fontSize:13,color:"#92400E",borderLeft:"3px solid #D97706",fontStyle:"italic" }}>
                  📝 {row.notes}
                </div>
              )}
              {!isCollapsed && <div style={{ height:12 }}/>}
            </div>
          );
          })}
        </div>
      )}
      {modal && <Modal title={edit?"Edit Purchase Order":"New Purchase Order"} onClose={close} maxWidth={1100}><IncomingStockForm initial={edit} onSave={save} onClose={close} rawDefs={rawDefs} onMarkReceived={edit && edit.status!=="Processed" ? (form)=>{markReceived(edit.id, form.items);close();} : null} /></Modal>}
    </div>
  );
}

function ProductForm({ initial, onSave, onClose, stockCodes }) {
  const [productId, setProductId] = useState(initial?.productId||"");
  const [description, setDescription] = useState(initial?.description||"");
  return (
    <div>
      <Field label="Product ID">
        {stockCodes && stockCodes.length > 0 ? (
          <select style={sel} value={productId} onChange={e => {
            const sc = stockCodes.find(r => r.code === e.target.value);
            setProductId(e.target.value);
            if (sc && !description) setDescription(sc.description);
          }}>
            <option value="">— select code —</option>
            {stockCodes.map(r => <option key={r.id} value={r.code}>{r.code}{r.description ? ` · ${r.description}` : ""}</option>)}
          </select>
        ) : (
          <input style={inp} value={productId} onChange={e=>setProductId(e.target.value)} placeholder="HB-001" />
        )}
      </Field>
      <Field label="Description"><input style={inp} value={description} onChange={e=>setDescription(e.target.value)} placeholder="e.g. Nibble Box 25 Pack" /></Field>
      <SaveCancel onClose={onClose} onSave={()=>productId&&description&&onSave({productId,description})} />
    </div>
  );
}

function BatchForm({ onSave, onClose }) {
  const [batch, setBatch] = useState("");
  const [qty, setQty] = useState("");
  return (
    <div>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
        <Field label="Batch"><input style={inp} value={batch} onChange={e=>setBatch(e.target.value)} placeholder="B2026-03A" /></Field>
        <Field label="Qty"><input style={inp} type="number" min="0" value={qty} onChange={e=>setQty(e.target.value)} placeholder="0" /></Field>
      </div>
      <SaveCancel onClose={onClose} onSave={()=>batch&&qty&&onSave({batch,qty:Number(qty)})} />
    </div>
  );
}

function ProductsTab({ data, setData, orders, stockCodes }) {
  const [modal, setModal] = useState(null);
  const [edit, setEdit] = useState(null);
  const [batchTarget, setBatchTarget] = useState(null);
  const close = () => { setModal(null); setEdit(null); setBatchTarget(null); };

  const saveProduct = (form) => {
    if (edit) setData(d=>d.map(r=>r.id===edit.id?{...r,...form}:r));
    else setData(d=>[...d,{id:Date.now(),...form,batches:[]}]);
    close();
  };
  const saveBatch = (form) => {
    setData(d=>d.map(p=>p.id===batchTarget?{...p,batches:[...p.batches,form]}:p));
    close();
  };
  const deleteBatch = (pid,batchName) => setData(d=>d.map(p=>p.id===pid?{...p,batches:p.batches.filter(b=>b.batch!==batchName)}:p));
  const [editingBatch, setEditingBatch] = useState(null); // {pid, batch, qty}
  const [expandedBatches, setExpandedBatches] = useState(new Set());
  const toggleBatch = (key) => setExpandedBatches(prev => { const s=new Set(prev); s.has(key)?s.delete(key):s.add(key); return s; });
  const updateBatch = () => {
    if (!editingBatch) return;
    setData(d=>d.map(p=>p.id===editingBatch.pid?{...p,batches:p.batches.map(b=>b.batch===editingBatch.origBatch?{batch:editingBatch.batch,qty:Number(editingBatch.qty)||0}:b)}:p));
    setEditingBatch(null);
  };
  const totalUnits = data.reduce((s,p)=>s+p.batches.reduce((ss,b)=>ss+b.qty,0),0);

  return (
    <div>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24 }}>
        <div>
          <h2 style={{ margin:0,fontSize:22,fontWeight:800,color:"#111827" }}>Products</h2>
          <p style={{ margin:"4px 0 0",fontSize:13,color:"#9CA3AF" }}>{data.length} product{data.length!==1?"s":""} · {totalUnits} total units across all batches</p>
        </div>
        <button onClick={()=>setModal("product")} style={{ display:"flex",alignItems:"center",gap:7,padding:"10px 18px",background:"#15803D",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontSize:14,fontWeight:700 }}>
          <PlusIcon /> Add Product
        </button>
      </div>

      {data.length===0 ? (
        <div style={{ textAlign:"center",padding:"60px 0",color:"#9CA3AF" }}><div style={{ fontSize:40,marginBottom:12 }}>🥜</div><p>No products added yet</p></div>
      ) : (
        <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
          {data.map(product=>{
            const totalQty = product.batches.reduce((s,b)=>s+b.qty,0);
            return (
              <div key={product.id} style={{ background:"#fff",border:"1px solid #E5E7EB",borderRadius:8,overflow:"hidden" }}>
                {/* Product header row */}
                <div style={{ padding:"14px 20px",display:"flex",alignItems:"center",gap:12,background:"#F9FAFB",borderBottom:"1px solid #E5E7EB",flexWrap:"wrap" }}>
                  <span style={{ fontFamily:"monospace",fontSize:12,fontWeight:700,background:"#FEF3C7",color:"#D97706",padding:"3px 9px",borderRadius:6 }}>{product.productId}</span>
                  <span style={{ fontWeight:700,color:"#111827",fontSize:15,flex:1 }}>{product.description}</span>
                  <div style={{ display:"flex",alignItems:"center",gap:16,marginLeft:"auto" }}>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontSize:10,color:"#9CA3AF",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.05em" }}>Total Stock</div>
                      <div style={{ fontSize:22,fontWeight:800,color:"#15803D",lineHeight:1 }}>{totalQty}</div>
                    </div>
                    <div style={{ display:"flex",gap:6 }}>
                      <button onClick={()=>{setBatchTarget(product.id);setModal("batch");}} style={{ display:"flex",alignItems:"center",gap:5,padding:"6px 12px",background:"#F0FDF4",border:"none",borderRadius:7,cursor:"pointer",color:"#16A34A",fontSize:12,fontWeight:700 }}>
                        <PlusIcon /> Batch
                      </button>
                      <button onClick={()=>{setEdit(product);setModal("product");}} style={{ background:"#F0FDF4",border:"none",borderRadius:7,padding:"6px 10px",cursor:"pointer",color:"#16A34A",display:"flex",alignItems:"center" }}><EditIcon /></button>
                      <button onClick={()=>setData(d=>d.filter(p=>p.id!==product.id))} style={{ background:"#FEF2F2",border:"none",borderRadius:7,padding:"6px 10px",cursor:"pointer",color:"#DC2626",display:"flex",alignItems:"center" }}><TrashIcon /></button>
                    </div>
                  </div>
                </div>

                {/* Batch rows */}
                {product.batches.length===0 ? (
                  <div style={{ padding:"12px 20px",fontSize:13,color:"#9CA3AF",fontStyle:"italic" }}>No batches yet — click "+ Batch" to add one</div>
                ) : (
                  <div style={{ padding:"12px 20px" }}>
                    <table style={{ width:"100%",borderCollapse:"collapse",fontSize:13 }}>
                      <thead>
                        <tr style={{ borderBottom:"1px solid #E5E7EB" }}>
                          <th style={{ padding:"6px 10px",textAlign:"left",fontSize:10,fontWeight:600,color:"#9CA3AF",textTransform:"uppercase",letterSpacing:"0.05em" }}>Batch</th>
                          <th style={{ padding:"6px 10px",textAlign:"right",fontSize:10,fontWeight:600,color:"#9CA3AF",textTransform:"uppercase",letterSpacing:"0.05em" }}>Qty</th>
                          <th style={{ padding:"6px 10px",textAlign:"right",fontSize:10,fontWeight:600,color:"#D97706",textTransform:"uppercase",letterSpacing:"0.05em" }}>Allocated</th>
                          <th style={{ padding:"6px 10px",textAlign:"right",fontSize:10,fontWeight:600,color:"#16A34A",textTransform:"uppercase",letterSpacing:"0.05em" }}>Available</th>
                          <th style={{ padding:"6px 10px",textAlign:"right",fontSize:10,fontWeight:600,color:"#9CA3AF",textTransform:"uppercase",letterSpacing:"0.05em" }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {product.batches.map((b,i)=>{
                          const isEditing = editingBatch?.pid===product.id && editingBatch?.origBatch===b.batch;
                          const batchKey = `${product.id}-${b.batch}`;
                          const isExpanded = expandedBatches.has(batchKey);
                          const allocatedOrders = (orders||[]).filter(o=>o.status!=="Collected").map(o=>({
                            ...o,
                            batchQty: o.items.filter(it=>it.productId===product.productId&&it.batch===b.batch).reduce((s,it)=>s+(Number(it.qty)||0),0)
                          })).filter(o=>o.batchQty>0);
                          const allocated = allocatedOrders.reduce((s,o)=>s+o.batchQty,0);
                          const available = Math.max(0, b.qty - allocated);
                          const isLast = i===product.batches.length-1;
                          return (
                            <Fragment key={b.batch}>
                              <tr style={{ borderBottom:(!isExpanded&&isLast)?"none":"1px solid #E5E7EB",background:isEditing?"#FEF3C7":"transparent" }}>
                                <td style={{ padding:"6px 10px" }}>
                                  {isEditing
                                    ? <input autoFocus style={{...inp,fontFamily:"monospace",fontWeight:700,padding:"5px 8px",fontSize:13,width:160}} value={editingBatch.batch} onChange={e=>setEditingBatch(eb=>({...eb,batch:e.target.value}))} />
                                    : (
                                      <span onClick={()=>toggleBatch(batchKey)} style={{ fontFamily:"monospace",fontWeight:700,color:"#111827",background:"#F0FDF4",padding:"2px 8px",borderRadius:5,cursor:"pointer",userSelect:"none",display:"inline-flex",alignItems:"center",gap:5 }}>
                                        {b.batch}
                                        <span style={{ fontSize:9,color:"#9CA3AF" }}>{isExpanded?"▲":"▼"}</span>
                                      </span>
                                    )
                                  }
                                </td>
                                <td style={{ padding:"6px 10px",textAlign:"right" }}>
                                  {isEditing
                                    ? <input style={{...inp,textAlign:"right",fontWeight:800,padding:"5px 8px",fontSize:14,width:80}} type="number" min="0" value={editingBatch.qty} onChange={e=>setEditingBatch(eb=>({...eb,qty:e.target.value}))} />
                                    : <span style={{ fontWeight:800,fontSize:16,color:"#16A34A" }}>{b.qty}</span>
                                  }
                                </td>
                                <td style={{ padding:"6px 10px",textAlign:"right" }}>
                                  <span style={{ fontWeight:700,fontSize:14,color:allocated>0?"#D97706":"#D1D5DB" }}>{allocated>0?allocated:"—"}</span>
                                </td>
                                <td style={{ padding:"6px 10px",textAlign:"right" }}>
                                  <span style={{ fontWeight:700,fontSize:14,color:available<=0?"#DC2626":available<5?"#D97706":"#16A34A" }}>{available}</span>
                                </td>
                                <td style={{ padding:"6px 8px",textAlign:"right" }}>
                                  {isEditing ? (
                                    <div style={{ display:"flex",gap:4,justifyContent:"flex-end" }}>
                                      <button onClick={updateBatch} style={{ background:"#15803D",border:"none",borderRadius:6,padding:"4px 10px",cursor:"pointer",color:"#fff",fontSize:11,fontWeight:700 }}>Save</button>
                                      <button onClick={()=>setEditingBatch(null)} style={{ background:"none",border:"1px solid #E5E7EB",borderRadius:6,padding:"4px 8px",cursor:"pointer",color:"#9CA3AF",fontSize:11 }}>Cancel</button>
                                    </div>
                                  ) : (
                                    <div style={{ display:"flex",gap:4,justifyContent:"flex-end" }}>
                                      <button onClick={()=>setEditingBatch({pid:product.id,origBatch:b.batch,batch:b.batch,qty:String(b.qty)})} style={{ background:"none",border:"none",cursor:"pointer",color:"#16A34A",opacity:0.7,display:"flex",padding:3 }} title="Edit batch"><EditIcon /></button>
                                      <button onClick={()=>deleteBatch(product.id,b.batch)} style={{ background:"none",border:"none",cursor:"pointer",color:"#DC2626",opacity:0.5,display:"flex",padding:3 }} title="Delete batch"><TrashIcon /></button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                              {isExpanded && (
                                <tr style={{ borderBottom:isLast?"none":"1px solid #E5E7EB" }}>
                                  <td colSpan={5} style={{ padding:"0 10px 10px 28px",background:"#FAFAFA" }}>
                                    {allocatedOrders.length===0 ? (
                                      <div style={{ fontSize:12,color:"#9CA3AF",fontStyle:"italic",padding:"8px 0" }}>No orders allocated to this batch</div>
                                    ) : (
                                      <div style={{ display:"flex",flexDirection:"column",gap:5,paddingTop:6 }}>
                                        {allocatedOrders.map(o=>(
                                          <div key={o.id} style={{ display:"flex",alignItems:"center",gap:10,background:"#fff",border:"1px solid #E5E7EB",borderRadius:7,padding:"7px 12px",flexWrap:"wrap" }}>
                                            <span style={{ fontFamily:"monospace",fontSize:12,fontWeight:700,color:"#374151" }}>{o.invoiceNumber||"—"}</span>
                                            <span style={{ fontSize:13,color:"#111827",fontWeight:600,flex:1 }}>{o.customer}</span>
                                            <span style={{ fontSize:11,padding:"2px 8px",borderRadius:20,fontWeight:700,background:o.status==="Open"?"#EFF6FF":o.status==="Stock Allocated"?"#FEF3C7":o.status==="Collected"?"#F0FDF4":"#F9FAFB",color:o.status==="Open"?"#1D4ED8":o.status==="Stock Allocated"?"#D97706":o.status==="Collected"?"#16A34A":"#6B7280" }}>{o.status}</span>
                                            <span style={{ fontSize:13,fontWeight:800,color:"#D97706",marginLeft:"auto" }}>{o.batchQty} units</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              )}
                            </Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {modal==="product" && <Modal title={edit?"Edit Product":"Add Product"} onClose={close}><ProductForm initial={edit} onSave={saveProduct} onClose={close} stockCodes={stockCodes} /></Modal>}
      {modal==="batch" && <Modal title="Add Batch" onClose={close}><BatchForm onSave={saveBatch} onClose={close} /></Modal>}
    </div>
  );
}

function ProductionForm({ initial, incomingStock, products, recipes, rawDefs, onSave, onClose }) {
  const [productId, setProductId] = useState(initial?.productId || "");
  const [batch, setBatch] = useState(initial?.batch || "");
  const [qty, setQty] = useState(initial?.qty ? String(initial.qty) : "");
  const [stockLines, setStockLines] = useState(
    initial?.stockLines?.length
      ? initial.stockLines.map(l=>({stockId:String(l.stockId),itemId:String(l.itemId),qty:String(l.qty)}))
      : []
  );

  const getRecipe = (pid) => {
    const raw = recipes?.[pid] || [];
    return Array.isArray(raw) ? raw : (raw.lines || []);
  };
  const recipe = getRecipe(productId);

  const buildLines = (pid, qtyVal, keepLots) => {
    const r = getRecipe(pid);
    const q = Number(qtyVal) || 0;
    return r.map((item, i) => {
      const existing = keepLots ? (stockLines[i] || {}) : {};
      let stockId = existing.stockId || "";
      let itemId = existing.itemId || "";
      if (!stockId) {
        for (const s of incomingStock) {
          const it = (s.items||[]).find(it => it.code === item.rawId);
          if (it) { stockId = String(s.id); itemId = String(it.id); break; }
        }
      }
      return { stockId, itemId, qty: q > 0 ? String(Math.round((item.amount||item.pct||0) * q)) : "" };
    });
  };

  const [recipeApplied, setRecipeApplied] = useState(false);
  if (!initial && !recipeApplied && productId && recipe.length) {
    setStockLines(buildLines(productId, qty, false));
    setRecipeApplied(true);
  }

  const setLine = (i, k, v) => setStockLines(ls => ls.map((l,idx)=>idx===i?{...l,[k]:v}:l));
  const selectedProduct = products.find(p=>p.productId===productId);
  const validLines = stockLines.filter(l=>l.stockId && l.itemId && Number(l.qty)>0);
  const valid = productId && batch && Number(qty)>0;

  return (
    <div>
      {/* ── Output product strip ── */}
      <div style={{ background:"#FEF3C7",border:"1px solid #F59E0B",borderRadius:10,padding:"16px 20px",marginBottom:20 }}>
        <div style={{ fontSize:10,fontWeight:700,color:"#D97706",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:14 }}>① Output Product & Batch</div>
        <div style={{ display:"grid",gridTemplateColumns:"2fr 1fr 1fr",gap:16,alignItems:"start" }}>
          <Field label="Product">
            <select style={sel} value={productId} onChange={e=>{
              const p = e.target.value;
              setProductId(p);
              setRecipeApplied(false);
              setStockLines(buildLines(p, qty, false));
            }}>
              <option value="">— Choose a product —</option>
              {products.map(p=><option key={p.productId} value={p.productId}>{p.productId} · {p.description}</option>)}
            </select>
          </Field>
          <Field label="Batch Number">
            <input style={inp} value={batch} onChange={e=>setBatch(e.target.value)} placeholder="e.g. B2026-04A" list="batch-opts" />
            {selectedProduct && <datalist id="batch-opts">{selectedProduct.batches.map(b=><option key={b.batch} value={b.batch}/>)}</datalist>}
          </Field>
          <Field label="Qty Produced">
            <input style={inp} type="number" min="1" value={qty} onChange={e=>{
              setQty(e.target.value);
              setStockLines(buildLines(productId, e.target.value, true));
            }} placeholder="0" />
          </Field>
        </div>
        {selectedProduct?.batches.length>0 && (
          <div style={{ marginTop:10,display:"flex",gap:6,flexWrap:"wrap",alignItems:"center" }}>
            <span style={{ fontSize:11,color:"#9A8A74" }}>Existing batches:</span>
            {selectedProduct.batches.map(b=>(
              <button key={b.batch} onClick={()=>setBatch(b.batch)} style={{ fontSize:11,padding:"3px 10px",borderRadius:6,border:"1px solid #E5E7EB",background:batch===b.batch?"#D97706":"#F9FAFB",color:batch===b.batch?"#fff":"#6B7280",cursor:"pointer",fontFamily:"monospace",fontWeight:700 }}>
                {b.batch} <span style={{ opacity:0.7,fontWeight:400 }}>({b.qty})</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Made From divider ── */}
      <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:16 }}>
        <div style={{ flex:1,height:2,background:"linear-gradient(to right,#E5E7EB,#16A34A)",borderRadius:2 }}/>
        <span style={{ fontSize:11,fontWeight:700,color:"#16A34A",textTransform:"uppercase",letterSpacing:"0.12em",whiteSpace:"nowrap" }}>made from</span>
        <ArrowIcon />
        <div style={{ flex:1,height:2,background:"linear-gradient(to right,#16A34A,#E5E7EB)",borderRadius:2 }}/>
      </div>

      {/* ── Raw materials section ── */}
      <div style={{ background:"#F0FDF4",border:"1px solid #86EFAC",borderRadius:10,padding:"16px 20px",marginBottom:20 }}>
        <div style={{ fontSize:10,fontWeight:700,color:"#16A34A",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:14 }}>② Raw Materials Used</div>

        {!productId && (
          <div style={{ textAlign:"center",padding:"28px 0",color:"#9CA3AF",fontSize:13 }}>Select a product above to see recipe ingredients</div>
        )}
        {productId && recipe.length===0 && (
          <div style={{ textAlign:"center",padding:"28px 0",color:"#9CA3AF",fontSize:13 }}>No recipe defined for this product — add one in Settings → Recipes</div>
        )}

        {recipe.length>0 && (
          <>
            {/* Column headers */}
            <div style={{ display:"grid",gridTemplateColumns:"200px 1fr 140px",gap:14,paddingBottom:8,borderBottom:"2px solid #BBF7D0",marginBottom:10 }}>
              <div style={{ fontSize:10,fontWeight:700,color:"#16A34A",textTransform:"uppercase",letterSpacing:"0.07em" }}>Recipe Ingredient</div>
              <div style={{ fontSize:10,fontWeight:700,color:"#16A34A",textTransform:"uppercase",letterSpacing:"0.07em" }}>Stock Lot</div>
              <div style={{ fontSize:10,fontWeight:700,color:"#16A34A",textTransform:"uppercase",letterSpacing:"0.07em",textAlign:"right" }}>Qty Used</div>
            </div>

            {recipe.map((recipeItem, i) => {
              const rd = (rawDefs||[]).find(r=>r.raw_id===recipeItem.rawId);
              const line = stockLines[i] || { stockId:"", itemId:"", qty:"" };
              const matchingLots = incomingStock.flatMap(s=>
                (s.items||[])
                  .filter(it=>it.code===recipeItem.rawId)
                  .map(it=>({
                    key:`${s.id}:${it.id}`,
                    stockId:s.id, itemId:it.id,
                    supplier:s.supplier, po:s.po,
                    batch:it.batch||"", usedBy:it.usedBy||"",
                    available:Math.max(0,(Number(it.receivedQty)||0)-(Number(it.usedQty)||0)),
                  }))
              );
              const selectedLot = matchingLots.find(x=>String(x.stockId)===String(line.stockId)&&String(x.itemId)===String(line.itemId));

              return (
                <div key={i} style={{ display:"grid",gridTemplateColumns:"200px 1fr 140px",gap:14,alignItems:"start",background:"#fff",borderRadius:8,padding:"14px 16px",border:"1px solid #D1FAE5",marginBottom:8 }}>

                  {/* Recipe ingredient info */}
                  <div style={{ display:"flex",flexDirection:"column",gap:4 }}>
                    <span style={{ fontFamily:"monospace",fontSize:12,fontWeight:700,color:"#D97706",background:"#FEF3C7",display:"inline-block",padding:"2px 8px",borderRadius:5,width:"fit-content" }}>{recipeItem.rawId}</span>
                    <span style={{ fontSize:13,fontWeight:600,color:"#111827" }}>{rd?.description||""}</span>
                    {recipeItem.amount ? (
                      <span style={{ fontSize:11,color:"#9A8A74" }}>Amt per unit: <strong style={{color:"#374151"}}>{recipeItem.amount}</strong></span>
                    ) : null}
                  </div>

                  {/* Stock lot selector */}
                  <div>
                    {matchingLots.length===0 ? (
                      <div style={{ fontSize:12,color:"#DC2626",padding:"8px 0",fontStyle:"italic" }}>No received stock found for this raw</div>
                    ) : (
                      <>
                        <select style={sel} value={line.stockId&&line.itemId?`${line.stockId}:${line.itemId}`:""} onChange={e=>{
                          const [sid,iid]=e.target.value.split(":");
                          setLine(i,"stockId",sid||"");
                          setLine(i,"itemId",iid||"");
                        }}>
                          <option value="">— Select lot —</option>
                          {matchingLots.map(x=>(
                            <option key={x.key} value={x.key}>
                              {x.po}{x.batch?` · ${x.batch}`:""} — avail: {x.available}
                            </option>
                          ))}
                        </select>
                        {selectedLot && (
                          <div style={{ display:"flex",gap:8,marginTop:6,flexWrap:"wrap",alignItems:"center" }}>
                            <span style={{ fontSize:11,color:"#6B7280" }}>{selectedLot.supplier}</span>
                            <span style={{ fontSize:11,fontFamily:"monospace",background:"#FEF3C7",color:"#D97706",padding:"1px 6px",borderRadius:4 }}>{selectedLot.po}</span>
                            {selectedLot.batch && <span style={{ fontSize:11,fontFamily:"monospace",background:"#EFF6FF",color:"#1D4ED8",padding:"1px 6px",borderRadius:4 }}>{selectedLot.batch}</span>}
                            {selectedLot.usedBy && <span style={{ fontSize:11,color:"#6B7280" }}>BB: {selectedLot.usedBy}</span>}
                            <span style={{ fontSize:11,fontWeight:700,color:selectedLot.available>0?"#16A34A":"#DC2626" }}>Avail: {selectedLot.available}</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Qty used */}
                  <div>
                    <input style={{...inp,textAlign:"right"}} type="number" min="0" value={line.qty} onChange={e=>setLine(i,"qty",e.target.value)} placeholder="0" />
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      <SaveCancel onClose={onClose} onSave={()=>valid&&onSave({ stockLines:validLines.map(l=>({stockId:Number(l.stockId),itemId:Number(l.itemId),qty:Number(l.qty)})), productId, batch, qty:Number(qty) })} saveLabel={initial?"Save Changes":"Create Production Run"} />
      {!valid && <p style={{ textAlign:"center",fontSize:12,color:"#9CA3AF",marginTop:8 }}>Select a product, batch and quantity to continue</p>}
    </div>
  );
}

function PrintModal({ row, incomingStock, onClose }) {
  if (!row) return null;
  const today = new Date().toLocaleDateString("en-AU",{weekday:"long",year:"numeric",month:"long",day:"numeric"});
  return (
    <div style={{ position:"fixed",inset:0,zIndex:2000,background:"rgba(0,0,0,0.4)",display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(3px)" }}>
      <div style={{ background:"#fff",borderRadius:8,width:"100%",maxWidth:720,maxHeight:"90vh",overflowY:"auto",boxShadow:"0 8px 30px rgba(0,0,0,0.12)",border:"1px solid #E5E7EB" }}>
        {/* Toolbar — hidden on print */}
        <div className="no-print" style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 24px",borderBottom:"1px solid #E5E7EB",background:"#F9FAFB" }}>
          <span style={{ fontWeight:700,color:"#111827",fontSize:15 }}>Production Record — {row.batch}</span>
          <div style={{ display:"flex",gap:8 }}>
            <button onClick={()=>window.print()} style={{ display:"flex",alignItems:"center",gap:6,padding:"8px 16px",background:"#15803D",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontSize:13,fontWeight:700 }}>
              <PrintIcon /> Print / Save PDF
            </button>
            <button onClick={onClose} style={{ padding:"8px 14px",background:"none",border:"1px solid #E5E7EB",borderRadius:8,cursor:"pointer",color:"#9CA3AF",fontSize:13,fontWeight:600 }}>Close</button>
          </div>
        </div>
        {/* Printable content */}
        <div id="print-area" style={{ padding:"32px 40px",fontFamily:"system-ui,sans-serif",color:"#111827",fontSize:13 }}>
          <style>{`@media print { .no-print { display:none !important; } #print-area { padding: 20px !important; } }`}</style>
          {/* Header */}
          <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:8 }}>
            <div>
              <div style={{ fontWeight:800,color:"#15803D",fontSize:24,lineHeight:1.1 }}>Production Record</div>
              <div style={{ fontSize:11,color:"#9CA3AF",marginTop:4 }}>Harvest Box Operations · {today}</div>
            </div>
            <div style={{ fontWeight:800,color:"#15803D",fontSize:18,letterSpacing:"0.04em",lineHeight:1.1,textAlign:"right" }}>HARVEST BOX<br/>OPERATIONS</div>
          </div>
          <div style={{ height:2,background:"linear-gradient(to right,#15803D,#E5E7EB)",borderRadius:2,margin:"16px 0 20px" }}/>
          {/* Meta grid */}
          <div style={{ display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr",gap:1,background:"#E5E7EB",border:"1px solid #E5E7EB",borderRadius:8,overflow:"hidden",marginBottom:24 }}>
            {[
              {label:"Product",value:row.description,mono:false},
              {label:"Product ID",value:row.productId,mono:true,color:"#374151",bg:"#F3F4F6"},
              {label:"Batch",value:row.batch,mono:true,color:"#16A34A",bg:"#F0FDF4"},
              {label:"Qty Produced",value:`${row.qty} units`,mono:false,big:true},
            ].map(m=>(
              <div key={m.label} style={{ background:"#fff",padding:"12px 16px" }}>
                <div style={{ fontSize:10,fontWeight:600,color:"#6B7280",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:5 }}>{m.label}</div>
                {m.mono
                  ? <span style={{ fontFamily:"monospace",fontWeight:700,fontSize:13,background:m.bg,color:m.color,padding:"2px 8px",borderRadius:4 }}>{m.value}</span>
                  : <div style={{ fontWeight:700,fontSize:m.big?20:14,color:m.big?"#15803D":"#111827" }}>{m.value}</div>
                }
              </div>
            ))}
          </div>
          {/* Stock table */}
          <div style={{ fontSize:11,fontWeight:600,color:"#6B7280",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:8 }}>Incoming Stock Used</div>
          <table style={{ width:"100%",borderCollapse:"collapse",fontSize:12,marginBottom:32 }}>
            <thead>
              <tr style={{ background:"#F9FAFB" }}>
                {["Item Code","Description","Supplier","PO #","Qty Used"].map((h,i)=>(
                  <th key={h} style={{ padding:"8px 10px",textAlign:i===4?"right":"left",fontSize:10,fontWeight:600,color:"#6B7280",textTransform:"uppercase",letterSpacing:"0.06em",borderBottom:"1px solid #E5E7EB" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(row.stockLines||[]).map((line,i)=>{
                const s = incomingStock.find(st=>st.id===line.stockId);
                const it = s?.items?.find(it=>it.id===line.itemId);
                return (
                  <tr key={i} style={{ borderBottom:"1px solid #E5E7EB",background:i%2===0?"#fff":"#F9FAFB" }}>
                    <td style={{ padding:"9px 10px",fontFamily:"monospace",fontWeight:700,color:"#374151",fontSize:11 }}>{it?.code||"—"}</td>
                    <td style={{ padding:"9px 10px",color:"#111827",fontWeight:600 }}>{it?.description||"Unknown"}</td>
                    <td style={{ padding:"9px 10px",color:"#6B7280" }}>{s?.supplier||"—"}</td>
                    <td style={{ padding:"9px 10px",fontFamily:"monospace",fontSize:11,color:"#D97706",fontWeight:700 }}>{s?.po||"—"}</td>
                    <td style={{ padding:"9px 10px",textAlign:"right",fontWeight:800,color:"#15803D" }}>{line.qty}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {/* Signature section */}
          <div style={{ fontSize:11,fontWeight:600,color:"#6B7280",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:16 }}>Authorisation & Sign-off</div>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:24 }}>
            {["Produced by","Checked by","Authorised by"].map(label=>(
              <div key={label}>
                <div style={{ fontSize:11,fontWeight:600,color:"#6B7280",marginBottom:6 }}>{label}</div>
                <div style={{ height:56,borderBottom:"1px solid #111827",marginBottom:6 }}/>
                <div style={{ fontSize:10,color:"#9CA3AF" }}>Name / Signature</div>
                <div style={{ height:28,borderBottom:"1px solid #E5E7EB",marginTop:16,marginBottom:4 }}/>
                <div style={{ fontSize:10,color:"#9CA3AF" }}>Date (DD/MM/YYYY)</div>
              </div>
            ))}
          </div>
          {/* Footer */}
          <div style={{ marginTop:32,paddingTop:12,borderTop:"1px solid #E5E7EB",fontSize:10,color:"#9CA3AF",display:"flex",justifyContent:"space-between" }}>
            <span>© Harvest Box · harvestbox.com.au</span>
            <span>Production Record · {row.batch} · {row.productId}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductionTab({ data, setData, incomingStock, setIncomingStock, products, setProducts, recipes, rawDefs }) {
  const [modal, setModal] = useState(false);
  const [edit, setEdit] = useState(null);
  const [toast, setToast] = useState(null);
  const [printRecord, setPrintRecord] = useState(null);
  const close = () => { setModal(false); setEdit(null); };
  const showToast = (msg,color) => { setToast({msg,color}); setTimeout(()=>setToast(null),2500); };
  const [expandedRuns, setExpandedRuns] = useState(new Set());
  const toggleRun = (id) => setExpandedRuns(prev => { const s=new Set(prev); s.has(id)?s.delete(id):s.add(id); return s; });

  const handlePrint = (row) => { setPrintRecord(row); };

  // Recompute usedQty per item from scratch based on all production runs
  const recomputeUsedQty = (allRuns, setIncoming) => {
    if (!setIncoming) return;
    setIncoming(prev => prev.map(s => {
      const items = s.items.map(it => {
        const usedQty = allRuns.reduce((sum, run) => {
          const line = (run.stockLines || []).find(l => l.stockId === s.id && l.itemId === it.id);
          return sum + (line ? Number(line.qty) : 0);
        }, 0);
        return { ...it, usedQty };
      });
      return { ...s, items };
    }));
  };

  const save = (form, setIncoming) => {
    const product = products.find(p=>p.productId===form.productId);
    const newQty = Number(form.qty);
    const run = { productId:form.productId, description:product?.description||"", batch:form.batch, qty:newQty, stockLines:form.stockLines };

    let updatedRuns;
    if (edit) {
      // Reverse old product batch qty
      setProducts(ps=>ps.map(p=>{
        if (p.productId!==edit.productId) return p;
        const batches = p.batches.map(b=>b.batch===edit.batch?{...b,qty:Math.max(0,b.qty-edit.qty)}:b).filter(b=>b.qty>0);
        return {...p,batches};
      }));
      updatedRuns = data.map(r=>r.id===edit.id?{...run,id:r.id}:r);
      setData(updatedRuns);
    } else {
      updatedRuns = [...data, {...run,id:Date.now()}];
      setData(updatedRuns);
    }

    // Recompute all usedQty from the updated run list
    recomputeUsedQty(updatedRuns, setIncoming);

    // Add qty to product batch
    setProducts(ps=>ps.map(p=>{
      if (p.productId!==form.productId) return p;
      const existing = p.batches.find(b=>b.batch===form.batch);
      const batches = existing
        ? p.batches.map(b=>b.batch===form.batch?{...b,qty:b.qty+newQty}:b)
        : [...p.batches,{batch:form.batch,qty:newQty}];
      return {...p,batches};
    }));

    showToast(`✅ ${newQty} units → ${product?.description} [${form.batch}]`,"#16A34A");
    close();
  };

  const handleDelete = (row, setIncoming) => {
    // Reverse product batch qty
    setProducts(ps=>ps.map(p=>{
      if (p.productId!==row.productId) return p;
      const batches = p.batches.map(b=>b.batch===row.batch?{...b,qty:Math.max(0,b.qty-row.qty)}:b).filter(b=>b.qty>0);
      return {...p,batches};
    }));
    const updatedRuns = data.filter(r=>r.id!==row.id);
    setData(updatedRuns);
    // Recompute all usedQty from remaining runs
    recomputeUsedQty(updatedRuns, setIncoming);
    showToast(`🗑️ ${row.qty} units removed from ${row.description} [${row.batch}]`,"#DC2626");
  };

  const total = data.reduce((s,r)=>s+Number(r.qty||0),0);
  const canAdd = incomingStock.length>0 && products.length>0;

  return (
    <div>
      <Toast toast={toast} />
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24 }}>
        <div>
          <h2 style={{ margin:0,fontSize:22,fontWeight:800,color:"#111827" }}>Production</h2>
          <p style={{ margin:"4px 0 0",fontSize:13,color:"#9CA3AF" }}>{data.length} run{data.length!==1?"s":""} · {total} units total</p>
        </div>
        <button onClick={()=>canAdd&&setModal(true)} style={{ display:"flex",alignItems:"center",gap:7,padding:"10px 18px",background:canAdd?"#15803D":"#D1D5DB",color:"#fff",border:"none",borderRadius:8,cursor:canAdd?"pointer":"not-allowed",fontSize:14,fontWeight:700 }}>
          <PlusIcon /> New Run
        </button>
      </div>
      {!canAdd && (
        <div style={{ background:"#FEF3C7",border:"1px solid #F59E0B",borderRadius:8,padding:14,marginBottom:20,fontSize:13,color:"#D97706",fontWeight:600 }}>
          ⚠️ You need both incoming stock and products before creating a production run.
        </div>
      )}
      {data.length===0 ? (
        <div style={{ textAlign:"center",padding:"60px 0",color:"#9CA3AF" }}><div style={{ fontSize:40,marginBottom:12 }}>⚙️</div><p>No production runs yet</p></div>
      ) : (()=>{
        const thP = { textAlign:"left",fontWeight:600,color:"#6B7280",fontSize:11,textTransform:"uppercase",letterSpacing:"0.05em",whiteSpace:"nowrap",padding:"8px 12px",background:"#F9FAFB" };
        // Group runs by productId, preserving first-seen order
        const productOrder = [];
        const productGroups = {};
        data.forEach(row=>{
          if (!productGroups[row.productId]) {
            productOrder.push(row.productId);
            productGroups[row.productId] = { productId:row.productId, description:row.description, runs:[] };
          }
          productGroups[row.productId].runs.push(row);
        });
        return (
          <div style={{ display:"flex",flexDirection:"column",gap:20 }}>
            {productOrder.map(pid=>{
              const group = productGroups[pid];
              const groupTotal = group.runs.reduce((s,r)=>s+Number(r.qty||0),0);
              return (
                <div key={pid}>
                  {/* Product section header — matches Raws type header */}
                  <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:8 }}>
                    <span style={{ fontFamily:"monospace",fontSize:12,fontWeight:800,color:"#374151",background:"#F3F4F6",padding:"2px 9px",borderRadius:5 }}>{pid}</span>
                    <span style={{ fontSize:13,fontWeight:800,color:"#374151",textTransform:"uppercase",letterSpacing:"0.07em" }}>{group.description}</span>
                    <span style={{ fontSize:12,color:"#9CA3AF" }}>{group.runs.length} run{group.runs.length!==1?"s":""}</span>
                    <span style={{ fontSize:12,fontWeight:700,color:groupTotal>0?"#15803D":"#9CA3AF",background:groupTotal>0?"#F0FDF4":"#F9FAFB",padding:"2px 10px",borderRadius:20 }}>{groupTotal} units</span>
                  </div>

                  {/* Batch cards — matches Raws code group cards */}
                  <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                    {group.runs.map(row=>{
                      const isOpen = expandedRuns.has(row.id);
                      return (
                        <div key={row.id} style={{ border:"1px solid #E5E7EB",borderRadius:8,overflow:"hidden",background:"#fff" }}>
                          {/* Collapsible batch header */}
                          <div style={{ display:"flex",alignItems:"center",gap:10,padding:"11px 14px",flexWrap:"wrap" }}>
                            <div style={{ display:"flex",alignItems:"center",gap:10,flex:1,minWidth:200,cursor:"pointer" }} onClick={()=>toggleRun(row.id)}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink:0,transform:isOpen?"rotate(0deg)":"rotate(-90deg)",transition:"transform 0.18s" }}><polyline points="6 9 12 15 18 9"/></svg>
                              <span style={{ fontFamily:"monospace",fontSize:13,color:"#374151",fontWeight:700,background:"#F3F4F6",padding:"2px 9px",borderRadius:5,flexShrink:0 }}>{row.batch}</span>
                              <span style={{ fontSize:12,color:"#6B7280" }}>{(row.stockLines||[]).length} ingredient{(row.stockLines||[]).length!==1?"s":""}</span>
                            </div>
                            <span style={{ fontSize:13,fontWeight:800,color:row.qty>0?"#15803D":"#9CA3AF",background:row.qty>0?"#F0FDF4":"#F9FAFB",padding:"3px 10px",borderRadius:20,whiteSpace:"nowrap" }}>{row.qty} units</span>
                            <div style={{ display:"flex",gap:5 }}>
                              <button onClick={()=>handlePrint(row)} title="Print" style={{ display:"flex",alignItems:"center",gap:5,padding:"5px 11px",background:"#F3F4F6",border:"none",borderRadius:7,cursor:"pointer",color:"#374151",fontSize:12,fontWeight:700 }}><PrintIcon /> Print</button>
                              <button onClick={()=>{setEdit(row);setModal(true);}} title="Edit" style={{ background:"#F0FDF4",border:"none",borderRadius:7,padding:"5px 8px",cursor:"pointer",color:"#15803D",display:"flex",alignItems:"center" }}><EditIcon /></button>
                              <button onClick={()=>handleDelete(row, setIncomingStock)} title="Delete" style={{ background:"#FEF2F2",border:"none",borderRadius:7,padding:"5px 8px",cursor:"pointer",color:"#DC2626",display:"flex",alignItems:"center" }}><TrashIcon /></button>
                            </div>
                          </div>

                          {/* Stock lines table — shown on expand */}
                          {isOpen && (row.stockLines||[]).length>0 && (
                            <div style={{ overflowX:"auto",WebkitOverflowScrolling:"touch",borderTop:"1px solid #E5E7EB" }}>
                              <table style={{ width:"100%",minWidth:520,borderCollapse:"collapse",fontSize:12 }}>
                                <thead>
                                  <tr>
                                    <th style={thP}>Code</th>
                                    <th style={thP}>Description</th>
                                    <th style={thP}>PO</th>
                                    <th style={thP}>Supplier</th>
                                    <th style={{...thP,textAlign:"right"}}>Qty Used</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {(row.stockLines||[]).map((line,i)=>{
                                    const s = incomingStock.find(st=>st.id===line.stockId);
                                    const it = s?.items?.find(it=>it.id===line.itemId);
                                    return (
                                      <tr key={i} style={{ borderTop:"1px solid #E5E7EB",background:i%2===0?"#fff":"#F9FAFB" }}>
                                        <td style={{ padding:"8px 12px",fontFamily:"monospace",color:"#374151",fontWeight:700 }}>{it?.code||"—"}</td>
                                        <td style={{ padding:"8px 12px",color:"#111827",fontWeight:600 }}>{it?.description||"Unknown"}</td>
                                        <td style={{ padding:"8px 12px",fontFamily:"monospace",color:"#9CA3AF",whiteSpace:"nowrap" }}>{s?.po||"—"}</td>
                                        <td style={{ padding:"8px 12px",color:"#6B7280",whiteSpace:"nowrap" }}>{s?.supplier||"—"}</td>
                                        <td style={{ padding:"8px 12px",textAlign:"right",fontWeight:800,color:"#15803D" }}>{line.qty}</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}
      {modal && (
        <Modal title={edit?"Edit Production Run":"New Production Run"} onClose={close} maxWidth={940}>
          <ProductionForm
            initial={edit}
            incomingStock={incomingStock}
            products={products}
            recipes={recipes}
            rawDefs={rawDefs}
            onSave={(form)=>save(form, setIncomingStock)}
            onClose={close}
          />
        </Modal>
      )}
      {printRecord && <PrintModal row={printRecord} incomingStock={incomingStock} onClose={()=>setPrintRecord(null)} />}
    </div>
  );
}


function StocktakeTab({ products, incomingStock }) {
  const printDate = new Date().toLocaleDateString("en-AU", { day:"2-digit", month:"short", year:"numeric" });

  // Flatten all incoming stock line items with remaining qty
  const rawItems = incomingStock.flatMap(s =>
    (s.items || []).map(it => ({
      supplier: s.supplier,
      po:       s.po,
      code:     it.code,
      description: it.description,
      ordered:  it.qty || 0,
      used:     it.usedQty || 0,
      remaining: (it.qty || 0) - (it.usedQty || 0),
    }))
  ).filter(it => it.ordered > 0);

  // Products with batch totals
  const productRows = products.map(p => ({
    productId:   p.productId,
    description: p.description,
    batches:     p.batches || [],
    total:       (p.batches || []).reduce((s, b) => s + (b.qty || 0), 0),
  }));

  const thStyle = { padding:"8px 12px", textAlign:"left", fontSize:10, fontWeight:600, color:"#9CA3AF", textTransform:"uppercase", letterSpacing:"0.07em", whiteSpace:"nowrap" };
  const thR     = { ...thStyle, textAlign:"right" };
  const td      = { padding:"10px 12px", fontSize:13, color:"#111827", borderBottom:"1px solid #E5E7EB" };
  const tdR     = { ...td, textAlign:"right", fontWeight:600 };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24, flexWrap:"wrap", gap:12 }}>
        <div>
          <h2 style={{ margin:0, fontSize:22, fontWeight:800, color:"#111827" }}>Stocktake</h2>
          <p style={{ margin:"4px 0 0", fontSize:13, color:"#9CA3AF" }}>As at {printDate}</p>
        </div>
        <button onClick={() => window.print()} style={{ display:"flex", alignItems:"center", gap:6, padding:"9px 16px", background:"#15803D", color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontSize:13, fontWeight:700 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
          Print
        </button>
      </div>

      {/* Raw Ingredients */}
      <div style={{ marginBottom:32 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
          <div style={{ width:4, height:20, background:"#D97706", borderRadius:2 }}></div>
          <h3 style={{ margin:0, fontSize:15, fontWeight:800, color:"#111827" }}>Raw Ingredients</h3>
          <span style={{ fontSize:12, color:"#9CA3AF" }}>{rawItems.length} line items</span>
        </div>
        {rawItems.length === 0 ? (
          <div style={{ padding:"24px", textAlign:"center", color:"#9CA3AF", background:"#fff", borderRadius:8, border:"1px solid #E5E7EB" }}>No incoming stock items found</div>
        ) : (
          <div className="responsive-table" style={{ background:"#fff", border:"1px solid #E5E7EB", borderRadius:8, overflow:"hidden" }}>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead style={{ background:"#F9FAFB" }}>
                <tr>
                  <th style={thStyle}>Supplier / PO</th>
                  <th style={thStyle}>Code</th>
                  <th style={thStyle}>Description</th>
                  <th style={thR}>Ordered</th>
                  <th style={thR}>Used</th>
                  <th style={thR}>Remaining</th>
                </tr>
              </thead>
              <tbody>
                {rawItems.map((it, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? "transparent" : "#F9FAFB" }}>
                    <td style={td}>
                      <div style={{ fontWeight:600, color:"#374151" }}>{it.supplier}</div>
                      {it.po && <div style={{ fontSize:11, color:"#9CA3AF", fontFamily:"monospace" }}>{it.po}</div>}
                    </td>
                    <td style={td}><span style={{ fontFamily:"monospace", fontSize:12, color:"#374151", fontWeight:700, background:"#F3F4F6", padding:"1px 6px", borderRadius:4 }}>{it.code || "—"}</span></td>
                    <td style={td}>{it.description}</td>
                    <td style={tdR}>{it.ordered}</td>
                    <td style={tdR}>{it.used}</td>
                    <td style={{ ...tdR, color: it.remaining <= 0 ? "#DC2626" : it.remaining < it.ordered * 0.2 ? "#D97706" : "#16A34A" }}>
                      {it.remaining}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot style={{ background:"#F9FAFB", borderTop:"1px solid #E5E7EB" }}>
                <tr>
                  <td colSpan={3} style={{ ...td, fontWeight:700, color:"#374151" }}>Total</td>
                  <td style={tdR}>{rawItems.reduce((s,it)=>s+it.ordered,0)}</td>
                  <td style={tdR}>{rawItems.reduce((s,it)=>s+it.used,0)}</td>
                  <td style={{ ...tdR, color:"#16A34A" }}>{rawItems.reduce((s,it)=>s+it.remaining,0)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Finished Products */}
      <div>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
          <div style={{ width:4, height:20, background:"#16A34A", borderRadius:2 }}></div>
          <h3 style={{ margin:0, fontSize:15, fontWeight:800, color:"#111827" }}>Finished Products</h3>
          <span style={{ fontSize:12, color:"#9CA3AF" }}>{productRows.length} products</span>
        </div>
        {productRows.length === 0 ? (
          <div style={{ padding:"24px", textAlign:"center", color:"#9CA3AF", background:"#fff", borderRadius:8, border:"1px solid #E5E7EB" }}>No products found</div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {productRows.map(p => (
              <div key={p.productId} style={{ background:"#fff", border:`1px solid ${p.total > 0 ? "#86EFAC" : "#E5E7EB"}`, borderRadius:8, overflow:"hidden" }}>
                <div style={{ padding:"12px 16px", display:"flex", alignItems:"center", gap:10, background: p.total > 0 ? "#F0FDF4" : "#F9FAFB", flexWrap:"wrap" }}>
                  <span style={{ fontFamily:"monospace", fontSize:12, fontWeight:700, background:"#FEF3C7", color:"#D97706", padding:"3px 9px", borderRadius:6 }}>{p.productId}</span>
                  <span style={{ fontWeight:700, color:"#111827", flex:1 }}>{p.description}</span>
                  <span style={{ fontSize:14, fontWeight:800, color: p.total > 0 ? "#16A34A" : "#9CA3AF" }}>{p.total} units</span>
                </div>
                {p.batches.length > 0 && (
                  <div style={{ padding:"8px 16px 12px" }}>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                      {p.batches.map((b, i) => (
                        <span key={i} style={{ fontSize:12, fontFamily:"monospace", fontWeight:700, background: b.qty > 0 ? "#F0FDF4" : "#F9FAFB", color: b.qty > 0 ? "#16A34A" : "#9CA3AF", padding:"4px 10px", borderRadius:20, border:`1px solid ${b.qty > 0 ? "#86EFAC" : "#E5E7EB"}` }}>
                          {b.batch} · {b.qty}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


const STOCK_TYPES = ["Food", "Cardboard", "Film", "Rewind"];
const RAW_TYPES = ["Food", "Packaging", "Chemical", "Other"];

function RawDefsTab({ data, setData }) {
  const [modal, setModal] = useState(false);
  const [edit, setEdit] = useState(null);
  const [rawId, setRawId] = useState("");
  const [desc, setDesc] = useState("");
  const [rawType, setRawType] = useState("Food");
  const [available, setAvailable] = useState(false);
  const [search, setSearch] = useState("");

  const openNew = () => { setRawId(""); setDesc(""); setRawType("Food"); setAvailable(false); setEdit(null); setModal(true); };
  const openEdit = (r) => { setRawId(r.raw_id); setDesc(r.description); setRawType(r.raw_type||"Food"); setAvailable(!!r.available); setEdit(r); setModal(true); };
  const close = () => { setModal(false); setEdit(null); };
  const save = () => {
    if (!rawId.trim()) return;
    if (edit) {
      setData(d => d.map(r => r.id === edit.id ? { ...r, raw_id: rawId.trim(), description: desc, raw_type: rawType, available } : r));
    } else {
      setData(d => [...d, { id: Date.now(), raw_id: rawId.trim(), description: desc, raw_type: rawType, available }]);
    }
    close();
  };

  const filtered = data.filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (r.raw_id||"").toLowerCase().includes(q) || (r.description||"").toLowerCase().includes(q) || (r.raw_type||"").toLowerCase().includes(q);
  });

  const typeBadge = (t) => {
    const colours = { Food:"#DCFCE7:#15803D", Packaging:"#FEF3C7:#D97706", Chemical:"#EDE9FE:#7C3AED", Other:"#F3F4F6:#6B7280" };
    const [bg, color] = (colours[t] || "#F3F4F6:#6B7280").split(":");
    return <span style={{ fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:10,background:bg,color }}>{t}</span>;
  };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16, flexWrap:"wrap", gap:10 }}>
        <div>
          <h3 style={{ margin:0, fontSize:17, fontWeight:800, color:"#111827" }}>Raws</h3>
          <p style={{ margin:"4px 0 0", fontSize:13, color:"#9CA3AF" }}>{data.length} raw material{data.length!==1?"s":""} defined</p>
        </div>
        <button onClick={openNew} style={{ display:"flex",alignItems:"center",gap:7,padding:"9px 16px",background:"#15803D",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontSize:13,fontWeight:700 }}>
          <PlusIcon /> Add Raw
        </button>
      </div>

      <div style={{ position:"relative", marginBottom:14 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round" style={{ position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",pointerEvents:"none" }}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search ID, description, type…" style={{ width:"100%",padding:"8px 12px 8px 32px",borderRadius:8,border:"1px solid #E5E7EB",fontSize:13,background:"#fff",boxSizing:"border-box" }} />
        {search && <button onClick={()=>setSearch("")} style={{ position:"absolute",right:9,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"#9CA3AF",fontSize:15,padding:0 }}>✕</button>}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign:"center", padding:"40px 0", color:"#9CA3AF" }}>
          {data.length === 0 ? <p>No raws defined yet — click Add Raw to get started.</p> : <p>No results match your search.</p>}
        </div>
      ) : (
        <div style={{ overflowX:"auto", WebkitOverflowScrolling:"touch" }}>
          <table style={{ width:"100%", minWidth:420, borderCollapse:"collapse" }}>
            <thead style={{ background:"#F9FAFB" }}>
              <tr>
                <th style={thS}>Raw ID</th>
                <th style={thS}>Description</th>
                <th style={thS}>Type</th>
                <th style={{ ...thS, textAlign:"right" }}>Available</th>
                <th style={{ ...thS, textAlign:"right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr key={r.id} style={{ background: i%2===0?"transparent":"#F9FAFB" }}>
                  <td style={{ ...tdS(i), fontFamily:"monospace", color:"#374151", fontWeight:700, whiteSpace:"nowrap", background:"#F3F4F6" }}>{r.raw_id}</td>
                  <td style={tdS(i)}>{r.description}</td>
                  <td style={tdS(i)}>{typeBadge(r.raw_type||"Food")}</td>
                  <td style={{ ...tdS(i), textAlign:"right" }}><span style={{ fontSize:11,fontWeight:700,padding:"2px 10px",borderRadius:20,background:r.available?"#DCFCE7":"#F3F4F6",color:r.available?"#15803D":"#9CA3AF" }}>{r.available?"Yes":"No"}</span></td>
                  <td style={{ ...tdS(i), textAlign:"right" }}>
                    <ActionBtns onEdit={() => openEdit(r)} onDelete={() => setData(d => d.filter(x => x.id !== r.id))} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <Modal title={edit ? "Edit Raw" : "Add Raw"} onClose={close}>
          <Field label="Raw ID *">
            <input style={inp} value={rawId} onChange={e=>setRawId(e.target.value)} placeholder="e.g. RAW-ALMOND-1KG" autoFocus />
            {!rawId.trim() && <span style={{ fontSize:11,color:"#DC2626" }}>Raw ID is required</span>}
          </Field>
          <Field label="Description"><input style={inp} value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Roasted Almonds 1kg" /></Field>
          <Field label="Raw Type">
            <select style={sel} value={rawType} onChange={e=>setRawType(e.target.value)}>
              {RAW_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Available">
            <select style={sel} value={available?"yes":"no"} onChange={e=>setAvailable(e.target.value==="yes")}>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </Field>
          <SaveCancel onClose={close} onSave={save} disabled={!rawId.trim()} />
        </Modal>
      )}
    </div>
  );
}

function StockCodesTab({ data, setData }) {
  const [modal, setModal] = useState(false);
  const [edit, setEdit] = useState(null);
  const [code, setCode] = useState("");
  const [desc, setDesc] = useState("");
  const [type, setType] = useState("Food");
  const [available, setAvailable] = useState("");
  const [search, setSearch] = useState("");

  const openNew = () => { setCode(""); setDesc(""); setType("Food"); setAvailable(false); setEdit(null); setModal(true); };
  const openEdit = (r) => { setCode(r.code); setDesc(r.description); setType(r.type||"Food"); setAvailable(!!r.available); setEdit(r); setModal(true); };
  const close = () => { setModal(false); setEdit(null); };
  const save = () => {
    if (!code.trim()) return;
    if (edit) {
      setData(d => d.map(r => r.id === edit.id ? { ...r, code: code.trim(), description: desc, type, available } : r));
    } else {
      setData(d => [...d, { id: Date.now(), code: code.trim(), description: desc, type, available }]);
    }
    close();
  };

  const filtered = data.filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (r.code||"").toLowerCase().includes(q) || (r.description||"").toLowerCase().includes(q) || (r.type||"").toLowerCase().includes(q);
  });

  const typeBadge = (t) => {
    const colours = { Food:"#DCFCE7:#15803D", Cardboard:"#FEF3C7:#D97706", Film:"#EDE9FE:#7C3AED", Rewind:"#FEE2E2:#DC2626" };
    const [bg, color] = (colours[t] || "#F3F4F6:#6B7280").split(":");
    return <span style={{ fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:10,background:bg,color }}>{t}</span>;
  };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16, flexWrap:"wrap", gap:10 }}>
        <div>
          <h3 style={{ margin:0, fontSize:17, fontWeight:800, color:"#111827" }}>Products</h3>
          <p style={{ margin:"4px 0 0", fontSize:13, color:"#9CA3AF" }}>{data.length} code{data.length!==1?"s":""}</p>
        </div>
        <button onClick={openNew} style={{ display:"flex",alignItems:"center",gap:7,padding:"9px 16px",background:"#15803D",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontSize:13,fontWeight:700 }}>
          <PlusIcon /> Add Code
        </button>
      </div>

      <div style={{ position:"relative", marginBottom:14 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round" style={{ position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",pointerEvents:"none" }}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search code, description, type…" style={{ width:"100%",padding:"8px 12px 8px 32px",borderRadius:8,border:"1px solid #E5E7EB",fontSize:13,background:"#fff",boxSizing:"border-box" }} />
        {search && <button onClick={()=>setSearch("")} style={{ position:"absolute",right:9,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"#9CA3AF",fontSize:15,padding:0 }}>✕</button>}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign:"center", padding:"40px 0", color:"#9CA3AF" }}>
          {data.length === 0 ? <p>No stock codes yet — click Add Code to get started</p> : <p>No results match your search.</p>}
        </div>
      ) : (
        <div style={{ overflowX:"auto", WebkitOverflowScrolling:"touch" }}>
          <table style={{ width:"100%", minWidth:420, borderCollapse:"collapse" }}>
            <thead style={{ background:"#F9FAFB" }}>
              <tr>
                <th style={thS}>Code</th>
                <th style={thS}>Description</th>
                <th style={thS}>Type</th>
                <th style={{ ...thS, textAlign:"right" }}>Available</th>
                <th style={{ ...thS, textAlign:"right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr key={r.id} style={{ background: i%2===0?"transparent":"#F9FAFB" }}>
                  <td style={{ ...tdS(i), fontFamily:"monospace", color:"#374151", fontWeight:700, whiteSpace:"nowrap", background:"#F3F4F6" }}>{r.code}</td>
                  <td style={tdS(i)}>{r.description}</td>
                  <td style={tdS(i)}>{typeBadge(r.type||"Food")}</td>
                  <td style={{ ...tdS(i), textAlign:"right" }}><span style={{ fontSize:11,fontWeight:700,padding:"2px 10px",borderRadius:20,background:r.available?"#DCFCE7":"#F3F4F6",color:r.available?"#15803D":"#9CA3AF" }}>{r.available?"Yes":"No"}</span></td>
                  <td style={{ ...tdS(i), textAlign:"right" }}>
                    <ActionBtns onEdit={() => openEdit(r)} onDelete={() => setData(d => d.filter(x => x.id !== r.id))} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <Modal title={edit ? "Edit Product" : "Add Product"} onClose={close}>
          <Field label="Code *">
            <input style={inp} value={code} onChange={e=>setCode(e.target.value)} placeholder="e.g. NUT-ALMOND-1KG" autoFocus />
            {!code.trim() && <span style={{ fontSize:11,color:"#DC2626" }}>Code is required</span>}
          </Field>
          <Field label="Description"><input style={inp} value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Roasted Almonds 1kg" /></Field>
          <Field label="Type">
            <select style={sel} value={type} onChange={e=>setType(e.target.value)}>
              {STOCK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Available">
            <select style={sel} value={available?"yes":"no"} onChange={e=>setAvailable(e.target.value==="yes")}>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </Field>
          <SaveCancel onClose={close} onSave={save} disabled={!code.trim()} />
        </Modal>
      )}
    </div>
  );
}

function SettingsTab({ products, incomingStock, recipes, setRecipes, stockCodes, setStockCodes, rawDefs, setRawDefs }) {
  const [settingsTab, setSettingsTab] = useState("Recipes");
  const emptyLine = () => ({ rawId:"", amount:"" });
  const [editingId, setEditingId] = useState(null);
  const [lines, setLines] = useState([emptyLine()]);
  const [weight, setWeight] = useState("");
  const [weightUnit, setWeightUnit] = useState("g");
  const [newRecipeModal, setNewRecipeModal] = useState(false);
  const [newRecipeProductId, setNewRecipeProductId] = useState("");

  const startEdit = (productId) => {
    const existing = recipes[productId] || {};
    const existingLines = existing.lines || (Array.isArray(existing) ? existing : []);
    setLines(existingLines.length ? existingLines.map(l=>({rawId:l.rawId||"",amount:String(l.amount??l.pct??"")})) : [emptyLine()]);
    setWeight(existing.weight!=null ? String(existing.weight) : "");
    setWeightUnit(existing.weightUnit || "g");
    setEditingId(productId);
  };
  const cancelEdit = () => { setEditingId(null); setLines([emptyLine()]); setWeight(""); setWeightUnit("g"); };
  const openNewRecipe = () => { setLines([emptyLine()]); setWeight(""); setWeightUnit("g"); setNewRecipeProductId(""); setNewRecipeModal(true); };
  const closeNewRecipe = () => { setNewRecipeModal(false); setNewRecipeProductId(""); setLines([emptyLine()]); setWeight(""); setWeightUnit("g"); };
  const saveNewRecipe = () => {
    if (!newRecipeProductId) return;
    const valid = lines.filter(l=>l.rawId&&Number(l.amount)>0);
    setRecipes(r=>({...r,[newRecipeProductId]:{ lines: valid.map(l=>({rawId:l.rawId,amount:Number(l.amount)})), weight: weight!==""?Number(weight):null, weightUnit }}));
    closeNewRecipe();
  };
  const saveRecipe = (productId) => {
    const valid = lines.filter(l=>l.rawId&&Number(l.amount)>0);
    setRecipes(r=>({...r,[productId]:{
      lines: valid.map(l=>({rawId:l.rawId,amount:Number(l.amount)})),
      weight: weight!==""?Number(weight):null,
      weightUnit,
    }}));
    setEditingId(null);
  };
  const setLine = (i,k,v) => setLines(ls=>ls.map((l,idx)=>idx===i?{...l,[k]:v}:l));
  const addLine = () => setLines(ls=>[...ls,emptyLine()]);
  const removeLine = (i) => setLines(ls=>ls.filter((_,idx)=>idx!==i));


  return (
    <div>
      <div style={{ marginBottom:20 }}>
        <h2 style={{ margin:"0 0 16px",fontSize:22,fontWeight:800,color:"#111827" }}>Settings</h2>
        <div style={{ display:"flex", gap:4, background:"#F3F4F6", borderRadius:8, padding:4, width:"fit-content" }}>
          {["Recipes","Products","Raws","Stocktake"].map(t => (
            <button key={t} onClick={() => setSettingsTab(t)} style={{ padding:"7px 20px", borderRadius:6, border:"none", cursor:"pointer", fontSize:13, fontWeight:700, background: settingsTab===t ? "#15803D" : "transparent", color: settingsTab===t ? "#fff" : "#6B7280", transition:"background 0.15s" }}>{t}</button>
          ))}
        </div>
      </div>

      {settingsTab === "Stocktake" ? (
        <StocktakeTab products={products} incomingStock={incomingStock} />
      ) : settingsTab === "Products" ? (
        <StockCodesTab data={stockCodes} setData={setStockCodes} />
      ) : settingsTab === "Raws" ? (
        <RawDefsTab data={rawDefs} setData={setRawDefs} />
      ) : products.length===0 ? (
        <div style={{ textAlign:"center",padding:"60px 0",color:"#9CA3AF" }}><div style={{ fontSize:40,marginBottom:12 }}>⚙️</div><p>Add products first before defining recipes</p></div>
      ) : (
        <>
        {newRecipeModal && (
          <Modal title="New Recipe" onClose={closeNewRecipe}>
            <Field label="Product *">
              <select style={sel} value={newRecipeProductId} onChange={e=>setNewRecipeProductId(e.target.value)}>
                <option value="">— select product —</option>
                {products.map(p=><option key={p.productId} value={p.productId}>{p.productId} · {p.description}</option>)}
              </select>
            </Field>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 80px",gap:8,marginBottom:8 }}>
              <Field label="Total Weight"><input style={inp} type="number" min="0" value={weight} onChange={e=>setWeight(e.target.value)} placeholder="e.g. 45" /></Field>
              <Field label="Unit">
                <select style={sel} value={weightUnit} onChange={e=>setWeightUnit(e.target.value)}>
                  <option>g</option><option>kg</option><option>ml</option><option>L</option>
                </select>
              </Field>
            </div>
            <label style={lbl}>Ingredients</label>
            {lines.map((line,i)=>(
              <div key={i} style={{ display:"grid",gridTemplateColumns:"1fr 70px 32px",gap:6,marginBottom:6 }}>
                <select style={{...sel,fontSize:12}} value={line.rawId} onChange={e=>setLine(i,"rawId",e.target.value)}>
                  <option value="">— Choose raw —</option>
                  {rawDefs.filter(r=>r.available!==false).map(r=><option key={r.id} value={r.raw_id}>{r.raw_id} — {r.description}</option>)}
                </select>
                <input style={{...inp,fontSize:12,textAlign:"right"}} type="number" min="0" value={line.amount} onChange={e=>setLine(i,"amount",e.target.value)} placeholder="Amt" />
                <button onClick={()=>removeLine(i)} style={{ background:"#FEF2F2",border:"none",borderRadius:6,cursor:"pointer",color:"#DC2626",display:"flex",alignItems:"center",justifyContent:"center" }}><TrashIcon /></button>
              </div>
            ))}
            <button onClick={addLine} style={{ fontSize:12,fontWeight:700,color:"#16A34A",background:"#F0FDF4",border:"1px solid #86EFAC",borderRadius:7,padding:"5px 12px",cursor:"pointer",marginBottom:12 }}>+ Add Ingredient</button>
            <SaveCancel onClose={closeNewRecipe} onSave={saveNewRecipe} disabled={!newRecipeProductId} saveLabel="Create Recipe" />
          </Modal>
        )}
        <div style={{ display:"flex",justifyContent:"flex-end",marginBottom:12 }}>
          <button onClick={openNewRecipe} style={{ display:"flex",alignItems:"center",gap:7,padding:"10px 18px",background:"#15803D",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontSize:14,fontWeight:700 }}>
            <PlusIcon /> New Recipe
          </button>
        </div>
        <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
          {products.map(product=>{
            const recipeData = recipes[product.productId] || [];
            const recipe = Array.isArray(recipeData) ? recipeData : (recipeData.lines || []);
            const recipeWeight = Array.isArray(recipeData) ? null : recipeData.weight;
            const recipeWeightUnit = Array.isArray(recipeData) ? "g" : (recipeData.weightUnit || "g");
            const isEditing = editingId===product.productId;
            const totalAmount = lines.reduce((s,l)=>s+(Number(l.amount)||0),0);
            return (
              <div key={product.productId} style={{ background:"#fff",border:`1px solid ${recipe.length>0?"#86EFAC":"#E5E7EB"}`,borderRadius:8,overflow:"hidden" }}>
                {/* Header */}
                <div style={{ padding:"14px 20px",display:"flex",alignItems:"center",gap:12,background:recipe.length>0?"#F0FDF4":"#F9FAFB",borderBottom:"1px solid #E5E7EB",flexWrap:"wrap" }}>
                  <span style={{ fontFamily:"monospace",fontSize:12,fontWeight:700,background:"#FEF3C7",color:"#D97706",padding:"3px 9px",borderRadius:6 }}>{product.productId}</span>
                  <span style={{ fontWeight:700,color:"#111827",fontSize:15,flex:1 }}>{product.description}</span>
                  <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                    {recipe.length>0 && !isEditing && (
                      <span style={{ fontSize:12,color:"#16A34A",fontWeight:600,background:"#F0FDF4",padding:"3px 10px",borderRadius:20 }}>✓ {recipe.length} ingredient{recipe.length!==1?"s":""}</span>
                    )}
                    {!isEditing && (
                      <button onClick={()=>startEdit(product.productId)} style={{ display:"flex",alignItems:"center",gap:5,padding:"6px 14px",background:"#15803D",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:700 }}>
                        <EditIcon /> {recipe.length>0?"Edit Recipe":"Set Recipe"}
                      </button>
                    )}
                  </div>
                </div>

                {/* View mode — show existing recipe */}
                {!isEditing && recipe.length>0 && (
                  <div style={{ padding:"12px 20px" }}>
                    <table style={{ width:"100%",borderCollapse:"collapse",fontSize:13 }}>
                      <thead>
                        <tr style={{ borderBottom:"1px solid #E5E7EB" }}>
                          {["Item Code","Description","Unit Cost","Amount"].map((h,i)=>(
                            <th key={h} style={{ padding:"6px 10px",textAlign:i>=2?"right":"left",fontSize:10,fontWeight:700,color:"#9CA3AF",textTransform:"uppercase",letterSpacing:"0.06em" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {recipe.map((line,i)=>{
                          const rd=(rawDefs||[]).find(r=>r.raw_id===line.rawId);
                          return (
                            <tr key={i} style={{ borderBottom:i<recipe.length-1?"1px solid #E5E7EB":"none" }}>
                              <td style={{ padding:"8px 10px" }}><span style={{ fontFamily:"monospace",fontSize:11,color:"#374151",fontWeight:700,background:"#F3F4F6",padding:"1px 6px",borderRadius:4 }}>{rd?.raw_id||line.rawId||"—"}</span></td>
                              <td style={{ padding:"8px 10px",fontWeight:600,color:"#111827" }}>{rd?.description||"—"}</td>
                              <td style={{ padding:"8px 10px",textAlign:"right",color:"#6B7280",fontWeight:600 }}>—</td>
                              <td style={{ padding:"8px 10px",textAlign:"right",fontWeight:800,color:"#16A34A" }}>{line.amount}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr style={{ borderTop:"1px solid #E5E7EB",background:"#F9FAFB" }}>
                          <td colSpan={3} style={{ padding:"7px 10px",fontSize:11,fontWeight:700,color:"#6B7280",textTransform:"uppercase" }}>Total</td>
                          <td style={{ padding:"7px 10px",textAlign:"right",fontWeight:800,color:"#16A34A" }}>{recipe.reduce((s,l)=>s+(l.amount||0),0)}</td>
                        </tr>
                      </tfoot>
                    </table>
                    {recipeWeight!=null && (
                      <div style={{ marginTop:10,display:"flex",gap:16,flexWrap:"wrap" }}>
                        <div style={{ background:"#FEF3C7",border:"1px solid #F59E0B",borderRadius:8,padding:"8px 14px",display:"flex",gap:20,alignItems:"center" }}>
                          <div>
                            <div style={{ fontSize:10,fontWeight:600,color:"#6B7280",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:2 }}>Product Weight</div>
                            <div style={{ fontWeight:800,fontSize:16,color:"#D97706" }}>{recipeWeight}{recipeWeightUnit}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {!isEditing && recipe.length===0 && (
                  <div style={{ padding:"12px 20px",fontSize:13,color:"#9CA3AF",fontStyle:"italic" }}>No recipe defined — click "Set Recipe" to add ingredients</div>
                )}

                {/* Edit mode */}
                {isEditing && (
                  <div style={{ padding:"16px 20px",background:"#FAFAFA" }}>
                    <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16,padding:"12px 14px",background:"#FEF3C7",border:"1px solid #F59E0B",borderRadius:8 }}>
                      <div>
                        <div style={{ fontSize:10,fontWeight:600,color:"#6B7280",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:5 }}>Product Weight</div>
                        <div style={{ display:"flex",gap:6,alignItems:"center" }}>
                          <input style={{...inp,padding:"8px 10px",width:100}} type="number" min="0" step="0.1" value={weight} onChange={e=>setWeight(e.target.value)} placeholder="e.g. 250" />
                          <select style={{...sel,width:70,padding:"8px 6px"}} value={weightUnit} onChange={e=>setWeightUnit(e.target.value)}>
                            <option value="g">g</option>
                            <option value="kg">kg</option>
                            <option value="ml">ml</option>
                            <option value="L">L</option>
                          </select>
                        </div>
                      </div>
                      <div style={{ display:"flex",alignItems:"center" }}>
                        <div style={{ fontSize:11,color:"#6B7280" }}>Used to calculate <strong>cost per gram</strong> and total ingredient value for each production run.</div>
                      </div>
                    </div>
                    <div style={{ fontSize:11,fontWeight:600,color:"#6B7280",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:12 }}>
                      Recipe Ingredients — enter amount per unit for each raw material
                    </div>
                    <div style={{ display:"flex",flexDirection:"column",gap:8,marginBottom:12 }}>
                      {lines.map((line,i)=>{
                        return (
                          <div key={i} style={{ display:"grid",gridTemplateColumns:"1fr 120px auto",gap:8,alignItems:"center" }}>
                            <select style={sel} value={line.rawId} onChange={e=>setLine(i,"rawId",e.target.value)}>
                              <option value="">— Choose raw —</option>
                              {rawDefs.filter(r=>r.available!==false).map(r=><option key={r.id} value={r.raw_id}>{r.raw_id} — {r.description}</option>)}
                            </select>
                            <div style={{ display:"flex",alignItems:"center",gap:4 }}>
                              <input style={{...inp,textAlign:"right",padding:"9px 8px"}} type="number" min="0" step="0.1" value={line.amount} onChange={e=>setLine(i,"amount",e.target.value)} placeholder="0" />
                            </div>
                            {lines.length>1
                              ? <button onClick={()=>removeLine(i)} style={{ background:"#FEF2F2",border:"none",borderRadius:7,padding:"9px 10px",cursor:"pointer",color:"#DC2626",display:"flex",alignItems:"center" }}><TrashIcon /></button>
                              : <div style={{ width:36 }}/>
                            }
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                      <div style={{ display:"flex",alignItems:"center",gap:12 }}>
                        <button onClick={addLine} style={{ display:"flex",alignItems:"center",gap:5,fontSize:12,fontWeight:700,color:"#16A34A",background:"#F0FDF4",border:"1px solid #86EFAC",borderRadius:7,padding:"6px 12px",cursor:"pointer" }}>
                          <PlusIcon /> Add Ingredient
                        </button>
                        <span style={{ fontSize:12,color:"#6B7280",fontWeight:700 }}>
                          Total: {totalAmount.toFixed(1)}
                        </span>
                      </div>
                      <div style={{ display:"flex",gap:8 }}>
                        <button onClick={cancelEdit} style={{ padding:"8px 16px",borderRadius:8,border:"1px solid #E5E7EB",background:"none",cursor:"pointer",color:"#9CA3AF",fontSize:13,fontWeight:600 }}>Cancel</button>
                        <button onClick={()=>saveRecipe(product.productId)} style={{ padding:"8px 16px",borderRadius:8,border:"none",background:"#15803D",cursor:"pointer",color:"#fff",fontSize:13,fontWeight:700 }}>Save Recipe</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        </>
      )}
    </div>
  );
}



const initialOrders = [
  { id:1, invoiceNumber:"INV-2026-001", customer:"The Healthy Pantry", reference:"PO-HP-001", date:"2026-03-05", dueDate:"2026-03-19", status:"Open", notes:"Regular weekly order",
    items:[
      { id:1, productId:"HB-001", description:"Nibble Box 25 Pack", batch:"B2026-03A", qty:10 },
      { id:2, productId:"HB-002", description:"Power Mix 10x45g", batch:"B2026-03B", qty:20 },
    ]},
  { id:2, invoiceNumber:"INV-2026-002", customer:"Organic Grove Markets", reference:"", date:"2026-03-06", dueDate:"2026-03-20", status:"Stock Allocated",
    items:[
      { id:1, productId:"HB-003", description:"Dipped Dark Choc 10x40g", batch:"B2026-03C", qty:15 },
    ]},
];

function OrderForm({ initial, products, onSave, onClose }) {
  const emptyItem = () => ({ id:Date.now(), productId:"", description:"", batch:"", qty:"" });
  const [invoiceNumber, setInvoiceNumber] = useState(initial ? initial.invoiceNumber : "");
  const [customer, setCustomer] = useState(initial ? initial.customer : "");
  const [reference, setReference] = useState(initial ? initial.reference || "" : "");
  const [orderDate, setOrderDate] = useState(initial ? initial.date : new Date().toISOString().slice(0,10));
  const [dueDate, setDueDate] = useState(initial ? initial.dueDate : "");
  const [status, setStatus] = useState(initial ? initial.status : "Open");
  const [notes, setNotes] = useState(initial ? initial.notes : "");
  const [items, setItems] = useState(
    initial && initial.items && initial.items.length
      ? initial.items.map(function(it) { return Object.assign({}, it, {qty: String(it.qty)}); })
      : [emptyItem()]
  );

  const setItem = function(i, k, v) {
    setItems(function(ls) { return ls.map(function(l, idx) { return idx === i ? Object.assign({}, l, {[k]: v}) : l; }); });
  };
  const addItem = function() { setItems(function(ls) { return ls.concat([emptyItem()]); }); };
  const removeItem = function(i) { setItems(function(ls) { return ls.filter(function(_, idx) { return idx !== i; }); }); };

  const valid = invoiceNumber && customer && items.some(function(l) { return l.productId && Number(l.qty) > 0; });

  const handleSave = function() {
    if (!valid) return;
    onSave({
      invoiceNumber: invoiceNumber,
      customer: customer,
      reference: reference,
      date: orderDate,
      dueDate: dueDate,
      status: status,
      notes: notes,
      items: items.filter(function(l) { return l.productId && Number(l.qty) > 0; }).map(function(l) {
        return Object.assign({}, l, {qty: Number(l.qty)});
      }),
    });
  };

  const STATUS_OPTS = ["Open","Stock Allocated","Paper Work Attached","Collected"];

  return (
    <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
        <Field label="Invoice Number"><input style={inp} value={invoiceNumber} onChange={function(e){setInvoiceNumber(e.target.value);}} placeholder="INV-2026-001" /></Field>
        <Field label="Customer / Contact"><input style={inp} value={customer} onChange={function(e){setCustomer(e.target.value);}} placeholder="Customer name" /></Field>
        <Field label="Reference"><input style={inp} value={reference} onChange={function(e){setReference(e.target.value);}} placeholder="PO or reference number" /></Field>
        <Field label="Invoice Date"><input style={inp} type="date" value={orderDate} onChange={function(e){setOrderDate(e.target.value);}} /></Field>
        <Field label="Due Date"><input style={inp} type="date" value={dueDate} onChange={function(e){setDueDate(e.target.value);}} /></Field>
        <Field label="Status">
          <select style={sel} value={status} onChange={function(e){setStatus(e.target.value);}}>
            {STATUS_OPTS.map(function(s) { return <option key={s} value={s}>{s}</option>; })}
          </select>
        </Field>
        <Field label="Notes"><input style={inp} value={notes} onChange={function(e){setNotes(e.target.value);}} placeholder="Optional notes" /></Field>
      </div>

      <div style={{ background:"#F0FDF4",border:"1px solid #86EFAC",borderRadius:8,padding:16 }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12 }}>
          <div style={{ fontSize:11,fontWeight:700,color:"#16A34A",textTransform:"uppercase",letterSpacing:"0.07em" }}>Line Items</div>
          <button onClick={addItem} style={{ display:"flex",alignItems:"center",gap:5,fontSize:12,fontWeight:700,color:"#16A34A",background:"#fff",border:"1px solid #86EFAC",borderRadius:7,padding:"4px 10px",cursor:"pointer" }}><PlusIcon /> Add Item</button>
        </div>
        <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
          {items.map(function(item, i) {
            const prod = products.find(function(p) { return p.productId === item.productId; });
            return (
              <div key={item.id} style={{ background:"#fff",borderRadius:8,padding:"10px 12px",border:"1px solid #E5E7EB" }}>
                <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr auto",gap:8,alignItems:"end" }}>
                  <Field label="Product">
                    <select style={sel} value={item.productId} onChange={function(e) {
                      const p = products.find(function(p) { return p.productId === e.target.value; });
                      setItem(i, "productId", e.target.value);
                      setItem(i, "description", p ? p.description : "");
                      setItem(i, "batch", "");
                    }}>
                      <option value="">Select product</option>
                      {products.map(function(p) { return <option key={p.productId} value={p.productId}>{p.productId + " · " + p.description}</option>; })}
                    </select>
                  </Field>
                  <Field label="Batch">
                    {prod && prod.batches && prod.batches.length > 0
                      ? (
                        <select style={sel} value={item.batch} onChange={function(e){setItem(i,"batch",e.target.value);}}>
                          <option value="">Select batch</option>
                          {prod.batches.map(function(b) { return <option key={b.batch} value={b.batch}>{b.batch + " (" + b.qty + ")"}</option>; })}
                        </select>
                      ) : (
                        <input style={inp} value={item.batch} onChange={function(e){setItem(i,"batch",e.target.value);}} placeholder="Batch code" />
                      )
                    }
                  </Field>
                  <Field label="Qty">
                    <input style={inp} type="number" min="1" value={item.qty} onChange={function(e){setItem(i,"qty",e.target.value);}} placeholder="0" />
                  </Field>
                  {items.length > 1 && (
                    <button onClick={function(){removeItem(i);}} style={{ background:"#FEF2F2",border:"none",borderRadius:6,padding:"9px 10px",cursor:"pointer",color:"#DC2626",display:"flex",alignItems:"center",alignSelf:"end" }}><TrashIcon /></button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display:"flex",justifyContent:"flex-end",gap:8,paddingTop:4 }}>
        <button onClick={onClose} style={{ padding:"9px 18px",borderRadius:8,border:"1px solid #E5E7EB",background:"none",cursor:"pointer",color:"#6B7280",fontSize:13,fontWeight:600 }}>Cancel</button>
        <button onClick={handleSave} disabled={!valid} style={{ padding:"9px 18px",borderRadius:8,border:"none",background:valid?"#15803D":"#D1D5DB",cursor:valid?"pointer":"not-allowed",color:"#fff",fontSize:13,fontWeight:700 }}>
          {initial ? "Update Order" : "Create Order"}
        </button>
      </div>
    </div>
  );
}

function OrdersTab({ data, setData, products }) {
  const [modal, setModal] = useState(false);
  const [edit, setEdit] = useState(null);
  const [toast, setToast] = useState(null);
  const [inlineEdit, setInlineEdit] = useState(null);
  const [inlineVal, setInlineVal] = useState("");
  const [collapsed, setCollapsed] = useState({});
  const toggleCollapse = function(id) { setCollapsed(function(c) { return Object.assign({}, c, {[id]: !c[id]}); }); };
  const [search, setSearch] = useState("");

  const close = function() { setModal(false); setEdit(null); };
  const showToast = function(msg, color) { setToast({msg:msg,color:color}); setTimeout(function(){setToast(null);}, 2500); };

  const startInline = function(orderId, field, current, itemId) {
    setInlineEdit({ orderId:orderId, field:field, itemId:itemId||null });
    setInlineVal(current || "");
  };
  const cancelInline = function() { setInlineEdit(null); };
  const saveInline = function() {
    if (!inlineEdit) return;
    const orderId = inlineEdit.orderId;
    const field = inlineEdit.field;
    const itemId = inlineEdit.itemId;
    setData(function(d) {
      return d.map(function(o) {
        if (o.id !== orderId) return o;
        if (field === "status") return Object.assign({}, o, {status: inlineVal});
        if (field === "notes") return Object.assign({}, o, {notes: inlineVal});
        if (field === "batch") {
          return Object.assign({}, o, {
            items: o.items.map(function(it) {
              return it.id === itemId ? Object.assign({}, it, {batch: inlineVal}) : it;
            })
          });
        }
        return o;
      });
    });
    setInlineEdit(null);
  };

  const save = function(form) {
    if (edit) {
      setData(function(d) { return d.map(function(o) { return o.id === edit.id ? Object.assign({}, o, form) : o; }); });
      showToast("Order " + form.invoiceNumber + " updated", "#16A34A");
    } else {
      setData(function(d) { return d.concat([Object.assign({}, form, {id: Date.now()})]); });
      showToast("Order " + form.invoiceNumber + " created", "#16A34A");
    }
    close();
  };

  const STATUS_STYLE = {
    Open:                  { bg:"#F9FAFB",  color:"#374151",  label:"Open" },
    "Stock Allocated":     { bg:"#FEF3C7",  color:"#D97706",  label:"Stock Allocated" },
    "Paper Work Attached": { bg:"#EFF6FF",  color:"#1D4ED8",  label:"Paper Work Attached" },
    Collected:             { bg:"#F0FDF4",  color:"#15803D",  label:"Collected" },
  };
  const STATUS_LIST = ["Open","Stock Allocated","Paper Work Attached","Collected"];

  const thO = { textAlign:"left",fontWeight:600,color:"#6B7280",fontSize:11,textTransform:"uppercase",letterSpacing:"0.05em",whiteSpace:"nowrap",padding:"8px 12px",background:"#F9FAFB" };

  const filtered = data.filter(function(o) {
    if (!search) return true;
    const q = search.toLowerCase();
    const matchHeader = (o.invoiceNumber||"").toLowerCase().includes(q) || (o.customer||"").toLowerCase().includes(q) || (o.reference||"").toLowerCase().includes(q);
    const matchItems = (o.items||[]).some(function(it){ return (it.productId||"").toLowerCase().includes(q) || (it.description||"").toLowerCase().includes(q); });
    return matchHeader || matchItems;
  });

  return (
    <div>
      <Toast toast={toast} />
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16,gap:12,flexWrap:"wrap" }}>
        <div>
          <h2 style={{ margin:0,fontSize:22,fontWeight:800,color:"#111827" }}>Orders</h2>
          <p style={{ margin:"4px 0 0",fontSize:13,color:"#9CA3AF" }}>{data.length} order{data.length!==1?"s":""}</p>
        </div>
        <button onClick={function(){setModal(true);}} style={{ display:"flex",alignItems:"center",gap:7,padding:"10px 18px",background:"#15803D",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontSize:14,fontWeight:700,flexShrink:0 }}>
          <PlusIcon /> New Order
        </button>
      </div>

      <div style={{ position:"relative",marginBottom:16 }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round" style={{ position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",pointerEvents:"none" }}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input value={search} onChange={function(e){setSearch(e.target.value);}} placeholder="Search invoice, customer, product…" style={{ width:"100%",padding:"9px 32px 9px 34px",borderRadius:8,border:"1px solid #E5E7EB",fontSize:13,background:"#fff",boxSizing:"border-box" }} />
        {search && <button onClick={function(){setSearch("");}} style={{ position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"#9CA3AF",fontSize:16,lineHeight:1,padding:0 }}>✕</button>}
      </div>

      {data.length === 0 ? (
        <div style={{ textAlign:"center",padding:"60px 0",color:"#9CA3AF" }}><div style={{ fontSize:40,marginBottom:12 }}>🧾</div><p>No orders yet</p></div>
      ) : (
        <div style={{ display:"flex",flexDirection:"column",gap:20 }}>
          {STATUS_LIST.map(function(status) {
            const st = STATUS_STYLE[status];
            const group = filtered.filter(function(o){ return o.status === status; })
              .slice().sort(function(a,b){
                if (!a.dueDate && !b.dueDate) return 0;
                if (!a.dueDate) return 1; if (!b.dueDate) return -1;
                return a.dueDate < b.dueDate ? -1 : a.dueDate > b.dueDate ? 1 : 0;
              });
            if (group.length === 0) return null;
            return (
              <div key={status}>
                {/* Status section header — matches Raws type header */}
                <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:8 }}>
                  <span style={{ fontSize:13,fontWeight:800,color:"#374151",textTransform:"uppercase",letterSpacing:"0.07em" }}>{st.label}</span>
                  <span style={{ fontSize:12,color:"#9CA3AF" }}>{group.length} order{group.length!==1?"s":""}</span>
                  <span style={{ fontSize:12,fontWeight:700,color:st.color,background:st.bg,border:"1px solid "+st.color,padding:"2px 10px",borderRadius:20 }}>{group.length}</span>
                </div>

                {/* Order cards */}
                <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                  {group.map(function(order) {
                    const isOpen = !!collapsed[order.id];
                    const overdue = order.status !== "Collected" && order.dueDate && new Date(order.dueDate+"T00:00:00") < new Date();
                    const nextStatus = STATUS_LIST[(STATUS_LIST.indexOf(order.status)+1) % STATUS_LIST.length];
                    return (
                      <div key={order.id} style={{ border:"1px solid "+(overdue?"#FECACA":"#E5E7EB"),borderRadius:8,overflow:"hidden",background:"#fff" }}>
                        {/* Card header */}
                        <div style={{ display:"flex",alignItems:"center",gap:10,padding:"11px 14px",background:overdue?"#FEF2F2":"#fff",flexWrap:"wrap" }}>
                          <div style={{ display:"flex",alignItems:"center",gap:10,flex:1,minWidth:200,cursor:"pointer" }} onClick={function(){toggleCollapse(order.id);}}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink:0,transform:isOpen?"rotate(0deg)":"rotate(-90deg)",transition:"transform 0.18s" }}><polyline points="6 9 12 15 18 9"/></svg>
                            <span style={{ fontFamily:"monospace",fontSize:13,fontWeight:700,color:"#374151",background:"#F3F4F6",padding:"2px 9px",borderRadius:5,flexShrink:0 }}>{order.invoiceNumber}</span>
                            <span style={{ fontSize:13,fontWeight:600,color:"#111827",flex:1,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{order.customer}</span>
                            {overdue && <span style={{ fontSize:11,fontWeight:700,background:"#FEF2F2",color:"#DC2626",padding:"2px 8px",borderRadius:20,flexShrink:0 }}>Overdue</span>}
                          </div>
                          <span style={{ fontSize:12,color:"#9CA3AF",whiteSpace:"nowrap" }}>{order.dueDate ? "Due "+order.dueDate : ""}</span>
                          <div style={{ display:"flex",gap:5 }}>
                            <button onClick={function(){
                              setData(function(d){ return d.map(function(o){ return o.id===order.id ? Object.assign({},o,{status:nextStatus}) : o; }); });
                              showToast("→ "+nextStatus,"#16A34A");
                            }} title={"Advance to: "+nextStatus} style={{ fontSize:11,fontWeight:700,background:st.bg,color:st.color,padding:"4px 10px",borderRadius:20,border:"1px solid "+st.color,cursor:"pointer",whiteSpace:"nowrap" }}>→ {nextStatus}</button>
                            <button onClick={function(){setEdit(order);setModal(true);}} title="Edit" style={{ background:"#F0FDF4",border:"none",borderRadius:7,padding:"5px 8px",cursor:"pointer",color:"#15803D",display:"flex",alignItems:"center" }}><EditIcon /></button>
                          </div>
                        </div>

                        {/* Expanded: notes + items table */}
                        {isOpen && (
                          <div style={{ borderTop:"1px solid #E5E7EB" }}>
                            {/* Notes */}
                            <div style={{ padding:"10px 14px 0" }}>
                              {inlineEdit && inlineEdit.orderId === order.id && inlineEdit.field === "notes" ? (
                                <div style={{ display:"flex",gap:6,alignItems:"center",marginBottom:10 }}>
                                  <input autoFocus value={inlineVal} onChange={function(e){setInlineVal(e.target.value);}} placeholder="Add a note..." style={{ flex:1,fontSize:12,borderRadius:6,border:"1px solid #86EFAC",padding:"6px 10px",background:"#fff" }} />
                                  <button onClick={saveInline} style={{ background:"#15803D",border:"none",borderRadius:6,padding:"5px 12px",cursor:"pointer",color:"#fff",fontSize:11,fontWeight:700 }}>Save</button>
                                  <button onClick={cancelInline} style={{ background:"none",border:"1px solid #E5E7EB",borderRadius:6,padding:"5px 8px",cursor:"pointer",color:"#9CA3AF",fontSize:11 }}>Cancel</button>
                                </div>
                              ) : (
                                <div onClick={function(){startInline(order.id,"notes",order.notes||"",null);}} style={{ marginBottom:10,background:"#FEF3C7",border:"1px dashed #F59E0B",borderRadius:7,padding:"6px 12px",fontSize:12,color:order.notes?"#92400E":"#9CA3AF",cursor:"pointer",userSelect:"none" }}>
                                  {order.notes ? ("📝 "+order.notes) : "＋ Add note…"}<span style={{ fontSize:10,color:"#9CA3AF",marginLeft:6 }}>✎</span>
                                </div>
                              )}
                            </div>
                            {/* Items table */}
                            <div style={{ overflowX:"auto",WebkitOverflowScrolling:"touch" }}>
                              <table style={{ width:"100%",minWidth:480,borderCollapse:"collapse",fontSize:12 }}>
                                <thead>
                                  <tr>
                                    <th style={thO}>Product ID</th>
                                    <th style={thO}>Description</th>
                                    <th style={thO}>Batch</th>
                                    <th style={{...thO,textAlign:"right"}}>Qty</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {(order.items||[]).map(function(item, i) {
                                    const isEditingBatch = inlineEdit && inlineEdit.orderId === order.id && inlineEdit.field === "batch" && inlineEdit.itemId === item.id;
                                    const prod = products.find(function(p){return p.productId === item.productId;});
                                    return (
                                      <tr key={item.id} style={{ borderTop:"1px solid #E5E7EB",background:i%2===0?"#fff":"#F9FAFB" }}>
                                        <td style={{ padding:"8px 12px",fontFamily:"monospace",color:"#374151",fontWeight:700 }}>{item.productId||<span style={{color:"#D1D5DB"}}>—</span>}</td>
                                        <td style={{ padding:"8px 12px",color:"#111827",fontWeight:600 }}>{item.description}</td>
                                        <td style={{ padding:"6px 12px" }}>
                                          {isEditingBatch ? (
                                            <div style={{ display:"flex",gap:4,alignItems:"center" }}>
                                              {prod && prod.batches && prod.batches.length > 0 ? (
                                                <select autoFocus value={inlineVal} onChange={function(e){setInlineVal(e.target.value);}} style={{ fontSize:12,fontWeight:700,borderRadius:6,border:"1px solid #86EFAC",padding:"3px 6px",background:"#fff",fontFamily:"monospace" }}>
                                                  <option value="">— batch —</option>
                                                  {prod.batches.map(function(b){return <option key={b.batch} value={b.batch}>{b.batch+" ("+b.qty+")"}</option>;})}
                                                </select>
                                              ) : (
                                                <input autoFocus value={inlineVal} onChange={function(e){setInlineVal(e.target.value);}} style={{ fontSize:12,fontFamily:"monospace",fontWeight:700,borderRadius:6,border:"1px solid #86EFAC",padding:"3px 7px",width:130 }} />
                                              )}
                                              <button onClick={saveInline} style={{ background:"#15803D",border:"none",borderRadius:6,padding:"3px 10px",cursor:"pointer",color:"#fff",fontSize:11,fontWeight:700 }}>Save</button>
                                              <button onClick={cancelInline} style={{ background:"none",border:"1px solid #E5E7EB",borderRadius:6,padding:"3px 7px",cursor:"pointer",color:"#9CA3AF",fontSize:11 }}>Cancel</button>
                                            </div>
                                          ) : (
                                            <button onClick={function(){startInline(order.id,"batch",item.batch,item.id);}} style={{ fontFamily:"monospace",fontSize:11,background:"#F0FDF4",color:"#15803D",padding:"2px 7px",borderRadius:4,fontWeight:700,border:"1px dashed #86EFAC",cursor:"pointer" }}>{item.batch||"set batch"} ✎</button>
                                          )}
                                        </td>
                                        <td style={{ padding:"8px 12px",textAlign:"right",fontWeight:700,color:"#111827" }}>{item.qty}</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal && (
        <Modal title={edit ? "Edit Order" : "New Order"} onClose={close}>
          <OrderForm initial={edit} products={products} onSave={save} onClose={close} />
        </Modal>
      )}
    </div>
  );
}




// ─── LOGIN SCREEN ────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async function() {
    if (!email || !password) { setError("Please enter your email and password."); return; }
    setLoading(true);
    setError("");
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err || !data.session) { setError(err?.message || "Invalid email or password."); return; }
    onLogin(data.session);
  };

  const handleKey = function(e) { if (e.key === "Enter") handleLogin(); };

  return (
    <div style={{ minHeight:"100vh",background:"#15803D",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"system-ui,sans-serif" }}>
      <div style={{ background:"#fff",borderRadius:12,padding:"48px 44px",width:"100%",maxWidth:400,boxShadow:"0 20px 60px rgba(0,0,0,0.15)" }}>
        <div style={{ textAlign:"center",marginBottom:36 }}>
          <div style={{ fontWeight:800,color:"#15803D",fontSize:26,letterSpacing:"0.04em",lineHeight:1.2,marginBottom:6 }}>HARVEST BOX</div>
          <div style={{ fontSize:12,color:"#16A34A",fontWeight:700,letterSpacing:"0.14em",textTransform:"uppercase" }}>Operations</div>
          <div style={{ width:48,height:3,background:"linear-gradient(to right,#15803D,#16A34A)",borderRadius:2,margin:"16px auto 0" }}></div>
        </div>

        <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
          <div>
            <label style={{ fontSize:11,fontWeight:600,color:"#6B7280",textTransform:"uppercase",letterSpacing:"0.07em",display:"block",marginBottom:5 }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={function(e){setEmail(e.target.value); setError("");}}
              onKeyDown={handleKey}
              placeholder="you@harvestbox.com.au"
              style={{ width:"100%",padding:"11px 14px",borderRadius:8,border:"1px solid #E5E7EB",fontSize:14,background:"#fff",boxSizing:"border-box",outline:"none" }}
            />
          </div>
          <div>
            <label style={{ fontSize:11,fontWeight:600,color:"#6B7280",textTransform:"uppercase",letterSpacing:"0.07em",display:"block",marginBottom:5 }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={function(e){setPassword(e.target.value); setError("");}}
              onKeyDown={handleKey}
              placeholder="••••••••"
              style={{ width:"100%",padding:"11px 14px",borderRadius:8,border:"1px solid #E5E7EB",fontSize:14,background:"#fff",boxSizing:"border-box",outline:"none" }}
            />
          </div>

          {error && (
            <div style={{ background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:8,padding:"9px 12px",fontSize:13,color:"#DC2626",fontWeight:500 }}>
              {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            style={{ marginTop:4,padding:"13px",borderRadius:8,border:"none",background:loading?"#86EFAC":"#15803D",color:"#fff",fontSize:15,fontWeight:700,cursor:loading?"not-allowed":"pointer",letterSpacing:"0.03em" }}
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
          <button
            onClick={function(){onLogin({access_token:"preview",user:{email:"preview@harvestbox.com.au"},preview:true});}}
            style={{ marginTop:4,padding:"10px",borderRadius:8,border:"1px dashed #E5E7EB",background:"none",color:"#9CA3AF",fontSize:12,fontWeight:600,cursor:"pointer",letterSpacing:"0.03em" }}
          >
            Preview Mode (no login)
          </button>
        </div>

        <p style={{ textAlign:"center",fontSize:11,color:"#9CA3AF",marginTop:28,marginBottom:0 }}>
          Harvest Box · harvestbox.com.au
        </p>
        <p style={{ textAlign:"center",fontSize:10,color:"#D1D5DB",marginTop:8,marginBottom:0 }}>
          First time? Create your account in Supabase → Authentication → Users
        </p>
      </div>
    </div>
  );
}
// ────────────────────────────────────────────────────────────────────────────

export default function App() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dbConnected, setDbConnected] = useState(false);

  // Restore session on mount; subscribe to auth changes
  useEffect(function() {
    supabase.auth.getSession().then(function({ data: { session } }) {
      setSession(session);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(function(_event, session) {
      if (session) setSession(session);
    });
    return function() { subscription.unsubscribe(); };
  }, []);

  const handleLogin = function(s) { setSession(s); };
  const handleSignOut = async function() {
    if (!session || !session.preview) await supabase.auth.signOut();
    setSession(null);
    setDbConnected(false);
  };

  const [tab, setTab] = useState("Incoming PO");
  const [incomingStock, setIncomingStock] = useState([]);
  const [stock, setStock] = useState([]);
  const [products, setProducts] = useState([]);
  const [production, setProduction] = useState([]);
  const [recipes, setRecipes] = useState({});
  const [orders, setOrders] = useState([]);
  const [stockCodes, setStockCodes] = useState([]);
  const [rawDefs, setRawDefs] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState("");

  const isConfigured = true;

  // Load data from Supabase when session is established
  useEffect(function() {
    if (!session) return;
    if (session.preview) { setDbConnected(false); setDataLoading(false); return; }
    setDataLoading(true);
    setDataError("");
    Promise.all([
      supabase.from("incoming_stock").select("*"),
      supabase.from("raws").select("*"),
      supabase.from("products").select("*"),
      supabase.from("production").select("*"),
      supabase.from("orders").select("*"),
      supabase.from("recipes").select("*"),
      supabase.from("stockcodes").select("*"),
      supabase.from("raw_defs").select("*"),
    ]).then(function(results) {
      const [incomingRes, stockRes, prods, prod, ords, recs, scRes, rdRes] = results;
      if (incomingRes.error) { setDataError("Could not load data: " + (incomingRes.error.message || "Check Supabase tables exist.")); setDataLoading(false); return; }
      const parseJ = function(val) { if (!val) return val; try { return typeof val === "string" ? JSON.parse(val) : val; } catch { return val; } };
      if (incomingRes.data) setIncomingStock(incomingRes.data.map(function(r){ return Object.assign({},r,{items:parseJ(r.items)||[],dateRaised:r.dateraised||r.dateRaised||"",expectedDelivery:r.expecteddelivery||r.expectedDelivery||"",receivedAt:r.receivedat||r.receivedAt||null}); }));
      if (stockRes.data) setStock(stockRes.data);
      if (prods.data) setProducts(prods.data.map(function(r){ return Object.assign({},r,{batches:parseJ(r.batches)||[],productId:r.productid||r.productId||""}); }));
      if (prod.data) setProduction(prod.data.map(function(r){ return Object.assign({},r,{stockLines:parseJ(r.stocklines||r.stockLines)||[],productId:r.productid||r.productId||""}); }));
      if (ords.data) setOrders(ords.data.map(function(r){ return Object.assign({},r,{items:parseJ(r.items)||[],invoiceNumber:r.invoicenumber||r.invoiceNumber||"",dueDate:r.duedate||r.dueDate||""}); }));
      if (recs.data && recs.data.length > 0) {
        const recipeMap = {};
        recs.data.forEach(function(r){ recipeMap[r.product_id] = parseJ(r.recipe); });
        setRecipes(recipeMap);
      }
      if (scRes.data) setStockCodes(scRes.data);
      if (rdRes.data) setRawDefs(rdRes.data);
      setDbConnected(true);
      setDataLoading(false);
    }).catch(function(e){ setDataError("Could not connect to Supabase. Check your credentials."); setDataLoading(false); });
  }, [session]);

  // Save rows to Supabase (upsert by id)
  const saveToDb = useCallback(async function(table, rows) {
    if (!session || !dbConnected || session.preview) return;
    const payload = rows.map(function(r) {
      const copy = Object.assign({}, r);
      ["items","batches","stockLines"].forEach(function(k){ if (copy[k] && typeof copy[k] !== "string") copy[k] = JSON.stringify(copy[k]); });
      // Normalise camelCase fields to DB lowercase column names
      if (table === "orders") {
        if (copy.invoiceNumber !== undefined) { copy.invoicenumber = copy.invoiceNumber; delete copy.invoiceNumber; }
        if (copy.dueDate !== undefined) { copy.duedate = copy.dueDate; delete copy.dueDate; }
      }
      if (table === "incoming_stock") {
        if (copy.dateRaised !== undefined) { copy.dateraised = copy.dateRaised; delete copy.dateRaised; }
        if (copy.expectedDelivery !== undefined) { copy.expecteddelivery = copy.expectedDelivery; delete copy.expectedDelivery; }
        if (copy.receivedAt !== undefined) { delete copy.receivedAt; }
        if (copy.receivedat !== undefined) { delete copy.receivedat; }
      }
      if (table === "products") {
        if (copy.productId !== undefined) { copy.productid = copy.productId; delete copy.productId; }
      }
      if (table === "production") {
        if (copy.productId !== undefined) { copy.productid = copy.productId; delete copy.productId; }
        if (copy.stockLines !== undefined) { copy.stocklines = copy.stockLines; delete copy.stockLines; }
      }
      return copy;
    });
    const { error } = await supabase.from(table).upsert(payload);
    if (error) console.warn("Supabase save error:", table, error);
  }, [session, dbConnected]);

  const updateStockRow = useCallback(async function(row) {
    const isNew = !stock.find(function(r) { return r.id === row.id; });
    if (isNew) {
      setStock(function(prev) { return [...prev, row]; });
    } else {
      setStock(function(prev) { return prev.map(function(r) { return r.id === row.id ? row : r; }); });
    }
    if (session && !session.preview) {
      const payload = {
        id: row.id,
        code: row.code,
        description: row.description,
        batch: row.batch,
        best_before: row.best_before || null,
        supplier: row.supplier,
        po_number: row.po_number,
        received_at: row.received_at || null,
        qty_received: row.qty_received,
        qty_available: row.qty_available,
      };
      const { error } = await supabase.from("raws").upsert(payload);
      if (error) console.warn("Stock upsert error:", error);
    }
  }, [session, stock]);

  const deleteRow = useCallback(async function(table, id, setter) {
    setter(function(prev) { return prev.filter(function(r) { return r.id !== id; }); });
    if (session && !session.preview) {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) console.warn("Delete error:", table, id, error);
    }
  }, [session]);

  const makeSyncSet = function(setter, table) {
    return function(fn) {
      setter(function(prev) {
        const next = typeof fn === "function" ? fn(prev) : fn;
        saveToDb(table, next);
        return next;
      });
    };
  };
  const syncSetIncomingStock = makeSyncSet(setIncomingStock, "incoming_stock");
  const syncSetProducts      = makeSyncSet(setProducts,      "products");
  const syncSetProduction    = makeSyncSet(setProduction,    "production");
  const syncSetOrders        = makeSyncSet(setOrders,        "orders");
  const syncSetRecipes = function(fn) { setRecipes(function(prev){ const next=typeof fn==="function"?fn(prev):fn; const rows=Object.entries(next).map(function([k,v]){return {product_id:k,recipe:JSON.stringify(v)};}); saveToDb("recipes",rows); return next; }); };
  const syncSetStock = makeSyncSet(setStock, "raws");

  const handlePoReceived = useCallback(async function(po) {
    const now = new Date().toISOString();
    const newLots = (po.items || []).filter(it => it.code || it.description).map(function(item, i) {
      return {
        id: Date.now() + i,
        code: item.code || "",
        description: item.description || "",
        qty_received: Number(item.receivedQty) || Number(item.qty) || 0,
        qty_available: Number(item.receivedQty) || Number(item.qty) || 0,
        po_id: po.id,
        po_number: po.po || "",
        supplier: po.supplier || "",
        received_at: item.receivedAt || now,
        batch: item.batch || "",
        best_before: item.usedBy || null,
      };
    });
    if (newLots.length === 0) return;
    setStock(function(prev) { return [...prev, ...newLots]; });
    if (session && !session.preview) {
      const { error } = await supabase.from("raws").insert(newLots);
      if (error) console.warn("Stock insert error:", error);
    }
  }, [session]);

  const syncSetStockCodes = function(fn) {
    setStockCodes(function(prev) {
      const next = typeof fn === "function" ? fn(prev) : fn;
      if (session && dbConnected && !session.preview) {
        const nextIds = new Set(next.map(r => r.id));
        prev.filter(r => !nextIds.has(r.id)).forEach(r => supabase.from("stockcodes").delete().eq("id", r.id));
      }
      const prevMap = new Map(prev.map(r => [r.id, r]));
      const toUpsert = next.filter(r => { const o = prevMap.get(r.id); return !o || o.code !== r.code || o.description !== r.description || o.type !== r.type || o.available !== r.available; });
      if (toUpsert.length > 0) saveToDb("stockcodes", toUpsert);
      return next;
    });
  };

  const syncSetRawDefs = function(fn) {
    setRawDefs(function(prev) {
      const next = typeof fn === "function" ? fn(prev) : fn;
      if (session && dbConnected && !session.preview) {
        const nextIds = new Set(next.map(r => r.id));
        prev.filter(r => !nextIds.has(r.id)).forEach(r => supabase.from("raw_defs").delete().eq("id", r.id));
      }
      const prevMap = new Map(prev.map(r => [r.id, r]));
      const toUpsert = next.filter(r => { const o = prevMap.get(r.id); return !o || o.raw_id !== r.raw_id || o.description !== r.description || o.raw_type !== r.raw_type || o.available !== r.available; });
      if (toUpsert.length > 0) saveToDb("raw_defs", toUpsert);
      return next;
    });
  };


  if (authLoading) return <div style={{ minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#15803D",color:"#86EFAC",fontSize:18 }}>Loading…</div>;
  if (!session) return <LoginScreen onLogin={handleLogin} />;
  if (dataLoading) return <div style={{ minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#F9FAFB",color:"#16A34A",fontSize:18,flexDirection:"column",gap:12 }}><div>Loading data…</div>{dataError && <div style={{fontSize:13,color:"#DC2626",marginTop:8}}>{dataError}</div>}</div>;

  const counts = { "Incoming PO":incomingStock.length, Raws:stock.length, Products:products.length, Production:production.length, Orders:orders.length, Settings:null };
  const navIcons = {
    "Incoming PO": <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 8h14M5 8a2 2 0 1 0-4 0v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8m-14 0V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M12 12v4m-2-2h4"/></svg>,
    Raws: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
    Products: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8m-4-4v4"/></svg>,
    Production: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>,
    Orders: <OrdersIcon />,
    Settings: <SettingsIcon />,
  };
  const totalUnits = products.reduce((s,p)=>s+p.batches.reduce((ss,b)=>ss+b.qty,0),0);
  return (
    <>
      <style>{`
        * { box-sizing:border-box; }
        body { margin:0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; background:#F9FAFB; }
        .app-body { display:flex; flex:1; }
        .app-nav { width:220px; background:#fff; border-right:1px solid #E5E7EB; padding:20px 10px; display:flex; flex-direction:column; gap:4px; flex-shrink:0; }
        .app-nav-btn { display:flex; align-items:center; gap:10px; padding:11px 14px; border-radius:8px; border:none; cursor:pointer; text-align:left; font-size:14px; width:100%; }
        .app-nav-label { flex:1; }
        .app-main { flex:1; padding:32px; overflow-y:auto; min-width:0; }
        .app-header-date { font-size:12px; color:#6B7280; }
        .app-header-right { display:flex; align-items:center; gap:16px; }
        .responsive-table { overflow-x:auto; -webkit-overflow-scrolling:touch; }
        .status-grid-4 { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; margin-bottom:24px; }
        .status-grid-2 { display:grid; grid-template-columns:repeat(2,1fr); gap:10px; margin-bottom:24px; }
        @media (max-width:768px) {
          .app-body { flex-direction:column; }
          .app-nav { width:100%; flex-direction:row; padding:0; border-right:none; border-top:1px solid #E5E7EB; position:fixed; bottom:0; left:0; right:0; z-index:200; background:#fff; gap:0; }
          .app-nav-btn { flex-direction:column; gap:3px; padding:8px 2px; font-size:10px; border-radius:0; flex:1; justify-content:center; }
          .app-nav-label { flex:none; }
          .app-main { padding:16px; padding-bottom:80px; }
          .app-header-date { display:none; }
          .app-header-right { gap:8px; }
          .status-grid-4 { grid-template-columns:repeat(2,1fr); }
        }
        @media (max-width:480px) {
          .status-grid-4 { grid-template-columns:repeat(2,1fr); }
          .app-main { padding:12px; padding-bottom:80px; }
        }
        /* Make all tables scrollable on small screens */
        @media (max-width:768px) {
          table { display:block; overflow-x:auto; -webkit-overflow-scrolling:touch; white-space:nowrap; }
          table thead, table tbody, table tr { display:table; width:100%; table-layout:fixed; }
        }
      `}</style>
      <div style={{ minHeight:"100vh",display:"flex",flexDirection:"column" }}>
        <header style={{ background:"#fff",padding:"0 16px",display:"flex",alignItems:"center",justifyContent:"space-between",height:56,borderBottom:"1px solid #E5E7EB",boxShadow:"0 1px 3px rgba(0,0,0,0.06)",flexShrink:0 }}>
          <div style={{ display:"flex",alignItems:"center",gap:4 }}>
            <div style={{ fontWeight:800,color:"#15803D",fontSize:18,letterSpacing:"0.04em",lineHeight:1 }}>HARVEST BOX</div>
            <div style={{ width:1,height:20,background:"#E5E7EB",margin:"0 8px" }}></div>
            <div style={{ fontSize:10,color:"#9CA3AF",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase" }}>Ops</div>
          </div>
          <div className="app-header-right">
            {isConfigured && <div style={{ display:"flex",alignItems:"center",gap:5,fontSize:11 }}>
              <div style={{ width:7,height:7,borderRadius:"50%",background:dbConnected?"#16A34A":"#D97706" }}></div>
              <span style={{ color:"#6B7280" }}>{dbConnected?"Live":"Local"}</span>
            </div>}
            <div className="app-header-date">{new Date().toLocaleDateString("en-AU",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</div>
            <button onClick={handleSignOut} style={{ fontSize:12,color:"#374151",background:"#F3F4F6",border:"1px solid #E5E7EB",borderRadius:7,padding:"5px 12px",cursor:"pointer",fontWeight:600 }}>Sign Out</button>
          </div>
        </header>

        <div className="app-body">
          <nav className="app-nav">
            {NAV.map(t=>{
              const active=t===tab;
              return (
                <button key={t} onClick={()=>setTab(t)} className="app-nav-btn" style={{ background:active?"#F0FDF4":"transparent",color:active?"#15803D":"#6B7280",fontWeight:active?600:400 }}>
                  <span style={{ opacity:active?1:0.6,flexShrink:0 }}>{navIcons[t]}</span>
                  <span className="app-nav-label">{t}</span>
                  {counts[t]!==null && <span style={{ fontSize:10,fontWeight:700,background:active?"#15803D":"#F3F4F6",color:active?"#fff":"#9CA3AF",padding:"1px 6px",borderRadius:20,flexShrink:0 }}>{counts[t]}</span>}
                </button>
              );
            })}
          </nav>
          <main className="app-main">
            {tab==="Incoming PO" && <IncomingStockTab data={incomingStock} setData={syncSetIncomingStock} rawDefs={rawDefs} setRawDefs={syncSetRawDefs} onDelete={id=>deleteRow("incoming_stock",id,setIncomingStock)} onReceived={handlePoReceived} />}
            {tab==="Raws" && <StockTab data={stock} onDelete={id=>deleteRow("raws",id,setStock)} onUpdate={updateStockRow} stockCodes={stockCodes} rawDefs={rawDefs} production={production} incomingStock={incomingStock} />}
            {tab==="Products" && <ProductsTab data={products} setData={syncSetProducts} orders={orders} stockCodes={stockCodes} />}
            {tab==="Production" && <ProductionTab data={production} setData={syncSetProduction} incomingStock={incomingStock} setIncomingStock={syncSetIncomingStock} products={products} setProducts={syncSetProducts} recipes={recipes} rawDefs={rawDefs} />}
            {tab==="Orders" && <OrdersTab data={orders} setData={syncSetOrders} products={products} />}
            {tab==="Settings" && <SettingsTab products={products} incomingStock={incomingStock} recipes={recipes} setRecipes={syncSetRecipes} stockCodes={stockCodes} setStockCodes={syncSetStockCodes} rawDefs={rawDefs} setRawDefs={syncSetRawDefs} />}
          </main>
        </div>
        <footer style={{ borderTop:"1px solid #E5E7EB",padding:"12px 32px",display:"flex",justifyContent:"space-between",background:"#fff" }}>
          <span style={{ fontSize:12,color:"#9CA3AF" }}>© 2026 Harvest Box · harvestbox.com.au</span>
          <span style={{ fontSize:12,color:"#9CA3AF" }}>Operations Management System</span>
        </footer>
      </div>
    </>
  );
}
