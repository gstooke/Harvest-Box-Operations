import { useState, useEffect, useCallback } from "react";
import { supabase } from "./lib/supabase";



const COLORS = {
  cream: "#FDF6EC", warmWhite: "#FEFAF4", amber: "#D4830A", amberLight: "#F0A830",
  amberPale: "#FEF3DC", green: "#2D5016", greenMid: "#4A7C2F", greenLight: "#8AB46A",
  greenPale: "#EEF5E8", brown: "#5C3D1E", brownLight: "#8B6344", brownPale: "#F5EDE3",
  charcoal: "#2C2416", muted: "#9A8A74", border: "#E8D9C4", red: "#C0392B", redPale: "#FDECEA",
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

const NAV = ["Incoming Stock", "Products", "Production", "Orders", "Settings"];

const PlusIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>;
const TrashIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>;
const EditIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const CloseIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>;
const ArrowIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>;
const OrdersIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>;
const SettingsIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
const PrintIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>;

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position:"fixed",inset:0,zIndex:1000,background:"rgba(44,36,22,0.5)",display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(3px)" }}>
      <div style={{ background:"#FEFAF4",borderRadius:16,padding:32,width:"100%",maxWidth:580,boxShadow:"0 24px 64px rgba(44,36,22,0.25)",border:"1px solid #E8D9C4",maxHeight:"90vh",overflowY:"auto" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24 }}>
          <h3 style={{ margin:0,fontSize:18,fontWeight:700,color:"#2C2416",fontFamily:"Georgia,serif" }}>{title}</h3>
          <button onClick={onClose} style={{ background:"none",border:"none",cursor:"pointer",color:"#9A8A74",padding:4,borderRadius:6,display:"flex" }}><CloseIcon /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

const inp = { width:"100%",padding:"10px 12px",border:"1.5px solid #E8D9C4",borderRadius:8,fontSize:14,color:"#2C2416",background:"#FDF6EC",outline:"none",fontFamily:"inherit",boxSizing:"border-box" };
const sel = { width:"100%",padding:"10px 12px",border:"1.5px solid #E8D9C4",borderRadius:8,fontSize:14,color:"#2C2416",background:"#FDF6EC",outline:"none",fontFamily:"inherit",boxSizing:"border-box",cursor:"pointer" };
const lbl = { display:"block",fontSize:11,fontWeight:700,color:"#8B6344",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.06em" };

function Field({ label, children }) {
  return <div style={{ marginBottom:16 }}><label style={lbl}>{label}</label>{children}</div>;
}
function SaveCancel({ onClose, onSave, saveLabel="Save" }) {
  return (
    <div style={{ display:"flex",gap:10,justifyContent:"flex-end",marginTop:8 }}>
      <button onClick={onClose} style={{ padding:"10px 20px",borderRadius:8,border:"1.5px solid #E8D9C4",background:"none",cursor:"pointer",color:"#9A8A74",fontSize:14,fontWeight:600 }}>Cancel</button>
      <button onClick={onSave} style={{ padding:"10px 20px",borderRadius:8,border:"none",background:"#2D5016",cursor:"pointer",color:"#fff",fontSize:14,fontWeight:600 }}>{saveLabel}</button>
    </div>
  );
}
function ActionBtns({ onEdit, onDelete }) {
  return (
    <div style={{ display:"flex",gap:6 }}>
      <button onClick={onEdit} style={{ background:"#EEF5E8",border:"none",borderRadius:7,padding:"6px 10px",cursor:"pointer",color:"#4A7C2F",display:"flex",alignItems:"center" }}><EditIcon /></button>
      <button onClick={onDelete} style={{ background:"#FDECEA",border:"none",borderRadius:7,padding:"6px 10px",cursor:"pointer",color:"#C0392B",display:"flex",alignItems:"center" }}><TrashIcon /></button>
    </div>
  );
}
function StatusBadge({ date }) {
  if (!date) return null;
  const diff = Math.ceil((new Date(date) - new Date()) / 86400000);
  if (diff < 0) return <span style={{ padding:"3px 10px",borderRadius:20,fontSize:12,fontWeight:600,color:"#C0392B",background:"#FDECEA" }}>Overdue</span>;
  if (diff <= 3) return <span style={{ padding:"3px 10px",borderRadius:20,fontSize:12,fontWeight:600,color:"#D4830A",background:"#FEF3DC" }}>Due Soon</span>;
  return <span style={{ padding:"3px 10px",borderRadius:20,fontSize:12,fontWeight:600,color:"#4A7C2F",background:"#EEF5E8" }}>On Track</span>;
}
function Toast({ toast }) {
  if (!toast) return null;
  return <div style={{ position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",zIndex:2000,background:"#2C2416",color:"#fff",padding:"12px 24px",borderRadius:12,fontSize:14,fontWeight:600,boxShadow:"0 8px 32px rgba(0,0,0,0.2)",borderLeft:`4px solid ${toast.color}`,whiteSpace:"nowrap" }}>{toast.msg}</div>;
}

const thS = { padding:"10px 14px",textAlign:"left",fontSize:11,fontWeight:700,color:"#8B6344",textTransform:"uppercase",letterSpacing:"0.06em",whiteSpace:"nowrap",borderBottom:"2px solid #E8D9C4" };
const tdS = (i) => ({ padding:"13px 14px", background: i%2===0 ? "transparent" : "#F5EDE333" });

const CheckIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;

function IncomingStockForm({ initial, onSave, onClose }) {
  const emptyItem = () => ({ id: Date.now() + Math.random(), code: "", description: "", qty: "", cost: "", receivedQty: "", usedQty: "" });
  const empty = { supplier:"", dateRaised:"", expectedDelivery:"", po:"", reference:"", status:"Pending", notes:"", items:[] };
  const [form, setForm] = useState(initial ? { ...empty, ...initial } : { ...empty, items:[emptyItem()] });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const setItem = (id, k, v) => setForm(f=>({...f, items: f.items.map(it=>it.id===id?{...it,[k]:v}:it)}));
  const addItem = () => setForm(f=>({...f, items:[...f.items, emptyItem()]}));
  const removeItem = (id) => setForm(f=>({...f, items: f.items.filter(it=>it.id!==id)}));

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
          <button onClick={addItem} style={{ display:"flex",alignItems:"center",gap:4,fontSize:12,fontWeight:700,color:"#4A7C2F",background:"#EEF5E8",border:"1.5px solid #8AB46A",borderRadius:7,padding:"4px 10px",cursor:"pointer" }}>
            <PlusIcon /> Add Item
          </button>
        </div>
        <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
          {form.items.map((item) => (
            <div key={item.id} style={{ background:"#F5EDE3",borderRadius:10,padding:"12px 12px 8px" }}>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 2fr 1fr auto",gap:8,marginBottom:8 }}>
                <div>
                  <label style={{...lbl,marginBottom:3}}>Item Code</label>
                  <input style={inp} value={item.code} onChange={e=>setItem(item.id,"code",e.target.value)} placeholder="NUT-ALMOND-1KG" />
                </div>
                <div>
                  <label style={{...lbl,marginBottom:3}}>Description</label>
                  <input style={inp} value={item.description} onChange={e=>setItem(item.id,"description",e.target.value)} placeholder="Roasted Almonds 1kg" />
                </div>
                <div>
                  <label style={{...lbl,marginBottom:3}}>Unit Cost ($)</label>
                  <input style={inp} type="number" min="0" step="0.01" value={item.cost} onChange={e=>setItem(item.id,"cost",e.target.value)} placeholder="0.00" />
                </div>
                <button onClick={()=>removeItem(item.id)} style={{ background:"#FDECEA",border:"none",borderRadius:7,padding:"8px 10px",cursor:"pointer",color:"#C0392B",display:"flex",alignItems:"center",alignSelf:"end",marginBottom:1 }}><TrashIcon /></button>
              </div>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8 }}>
                <div>
                  <label style={{...lbl,marginBottom:3}}>Ordered Qty</label>
                  <input style={inp} type="number" min="0" value={item.qty} onChange={e=>setItem(item.id,"qty",e.target.value)} placeholder="0" />
                </div>
                <div>
                  <label style={{...lbl,marginBottom:3}}>Received Qty</label>
                  <input style={inp} type="number" min="0" value={item.receivedQty} onChange={e=>setItem(item.id,"receivedQty",e.target.value)} placeholder="0" />
                </div>
                <div>
                  <label style={{...lbl,marginBottom:3}}>Used Qty</label>
                  <input style={{...inp,background:"#EDE0D4"}} type="number" min="0" value={item.usedQty} onChange={e=>setItem(item.id,"usedQty",e.target.value)} placeholder="auto" />
                </div>
              </div>
            </div>
          ))}
          {form.items.length===0 && <div style={{ fontSize:12,color:"#9A8A74",padding:"8px 0" }}>No items added — click Add Item above.</div>}
        </div>
      </div>

      <Field label="Notes"><textarea style={{...inp,resize:"vertical",minHeight:60,lineHeight:1.5}} value={form.notes} onChange={e=>set("notes",e.target.value)} placeholder="Any notes about this order..." /></Field>
      <SaveCancel onClose={onClose} onSave={()=>onSave(form)} />
    </div>
  );
}

function StockStatusBadge({ row }) {
  if (row.status === "Received") return <span style={{ padding:"3px 10px",borderRadius:20,fontSize:12,fontWeight:600,color:"#2D5016",background:"#C6E6A8" }}>✓ Received</span>;
  const diff = Math.ceil((new Date(row.expectedDelivery) - new Date()) / 86400000);
  if (!row.expectedDelivery) return null;
  if (diff < 0) return <span style={{ padding:"3px 10px",borderRadius:20,fontSize:12,fontWeight:600,color:"#C0392B",background:"#FDECEA" }}>Overdue</span>;
  if (diff <= 3) return <span style={{ padding:"3px 10px",borderRadius:20,fontSize:12,fontWeight:600,color:"#D4830A",background:"#FEF3DC" }}>Due Soon</span>;
  return <span style={{ padding:"3px 10px",borderRadius:20,fontSize:12,fontWeight:600,color:"#4A7C2F",background:"#EEF5E8" }}>Pending</span>;
}

function ItemQtyBar({ ordered, received, used }) {
  const ord = Number(ordered)||0;
  const rec = Number(received)||0;
  const use = Number(used)||0;
  if (ord === 0) return null;
  const recPct = Math.min(100, (rec/ord)*100);
  const usePct = Math.min(recPct, (use/ord)*100);
  return (
    <div style={{ height:5,background:"#E8D9C4",borderRadius:4,overflow:"hidden",position:"relative",marginTop:4 }}>
      <div style={{ position:"absolute",left:0,top:0,height:"100%",width:`${recPct}%`,background:"#8AB46A",borderRadius:4 }}/>
      <div style={{ position:"absolute",left:0,top:0,height:"100%",width:`${usePct}%`,background:"#4A7C2F",borderRadius:4 }}/>
    </div>
  );
}

function IncomingStockTab({ data, setData }) {
  const [modal, setModal] = useState(false);
  const [edit, setEdit] = useState(null);
  const close = () => { setModal(false); setEdit(null); };
  const save = (form) => {
    const items = (form.items||[])
      .map(it=>({...it, qty:Number(it.qty)||0, cost:Number(it.cost)||0, receivedQty:Number(it.receivedQty)||0, usedQty:Number(it.usedQty)||0}))
      .filter(it=>it.code||it.description);
    const record = { ...form, items };
    if (edit) setData(d=>d.map(r=>r.id===edit.id?{...record,id:r.id}:r));
    else setData(d=>[...d,{...record,id:Date.now(),status:"Pending"}]);
    close();
  };
  const markReceived = (id) => setData(d=>d.map(r=>{
    if (r.id!==id) return r;
    const items = r.items.map(it=>({...it, receivedQty: it.receivedQty>0 ? it.receivedQty : it.qty}));
    return {...r, status:"Received", items};
  }));

  const pendingCount = data.filter(r=>r.status!=="Received").length;
  const receivedCount = data.filter(r=>r.status==="Received").length;

  return (
    <div>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24 }}>
        <div>
          <h2 style={{ margin:0,fontSize:22,fontWeight:800,color:"#2C2416",fontFamily:"Georgia,serif" }}>Incoming Stock</h2>
          <p style={{ margin:"4px 0 0",fontSize:13,color:"#9A8A74" }}>{pendingCount} pending · {receivedCount} received</p>
        </div>
        <button onClick={()=>setModal(true)} style={{ display:"flex",alignItems:"center",gap:7,padding:"10px 18px",background:"#2D5016",color:"#fff",border:"none",borderRadius:10,cursor:"pointer",fontSize:14,fontWeight:700 }}>
          <PlusIcon /> New Order
        </button>
      </div>

      {data.length===0 ? (
        <div style={{ textAlign:"center",padding:"60px 0",color:"#9A8A74" }}><div style={{ fontSize:40,marginBottom:12 }}>📦</div><p>No incoming stock orders yet</p></div>
      ) : (
        <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
          {data.map(row=>(
            <div key={row.id} style={{ background:"#FEFAF4",border:`1.5px solid ${row.status==="Received"?"#8AB46A":"#E8D9C4"}`,borderRadius:14,overflow:"hidden" }}>
              {/* Header row */}
              <div style={{ padding:"14px 20px",display:"flex",alignItems:"center",gap:12,flexWrap:"wrap",background:row.status==="Received"?"#F2FAEE":"#FDF6EC",borderBottom:"1px solid #E8D9C4" }}>
                <div style={{ flex:1,minWidth:160 }}>
                  <div style={{ fontWeight:700,color:"#2C2416",fontSize:15 }}>{row.supplier}</div>
                  <div style={{ display:"flex",gap:6,marginTop:5,flexWrap:"wrap",alignItems:"center" }}>
                    <span style={{ fontFamily:"monospace",fontSize:12,background:"#FEF3DC",color:"#D4830A",padding:"2px 8px",borderRadius:5,fontWeight:700 }}>{row.po}</span>
                    <span style={{ fontFamily:"monospace",fontSize:12,color:"#9A8A74" }}>{row.reference}</span>
                  </div>
                </div>
                <div style={{ display:"flex",alignItems:"center",gap:8,flexWrap:"wrap" }}>
                  <div style={{ fontSize:12,color:"#8B6344" }}>
                    <span style={{ fontWeight:600 }}>Raised:</span> {row.dateRaised}
                  </div>
                  <div style={{ fontSize:12,color:"#8B6344" }}>
                    <span style={{ fontWeight:600 }}>Due:</span> {row.expectedDelivery}
                  </div>
                  <StockStatusBadge row={row} />
                </div>
                <div style={{ display:"flex",gap:6,alignItems:"center" }}>
                  {row.status!=="Received" && (
                    <button onClick={()=>markReceived(row.id)} title="Mark as Received" style={{ display:"flex",alignItems:"center",gap:5,padding:"6px 12px",background:"#2D5016",border:"none",borderRadius:7,cursor:"pointer",color:"#fff",fontSize:12,fontWeight:700 }}>
                      <CheckIcon /> Received
                    </button>
                  )}
                  <button onClick={()=>{setEdit(row);setModal(true);}} style={{ background:"#EEF5E8",border:"none",borderRadius:7,padding:"6px 10px",cursor:"pointer",color:"#4A7C2F",display:"flex",alignItems:"center" }}><EditIcon /></button>
                  <button onClick={()=>setData(d=>d.filter(r=>r.id!==row.id))} style={{ background:"#FDECEA",border:"none",borderRadius:7,padding:"6px 10px",cursor:"pointer",color:"#C0392B",display:"flex",alignItems:"center" }}><TrashIcon /></button>
                </div>
              </div>

              {/* Items table with per-item qty tracking */}
              {row.items?.length>0 && (
                <div style={{ padding:"12px 20px 0" }}>
                  <table style={{ width:"100%",borderCollapse:"collapse",fontSize:13 }}>
                    <thead>
                      <tr style={{ borderBottom:"1.5px solid #E8D9C4" }}>
                        <th style={{...thS,padding:"7px 10px"}}>Item Code</th>
                        <th style={{...thS,padding:"7px 10px"}}>Description</th>
                        <th style={{...thS,padding:"7px 10px",textAlign:"right"}}>Unit Cost</th>
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
                            <td style={{ padding:"8px 10px",borderBottom:"1px solid #F0E8DC" }}>
                              <span style={{ fontFamily:"monospace",fontSize:12,color:"#D4830A",fontWeight:700 }}>{item.code}</span>
                            </td>
                            <td style={{ padding:"8px 10px",color:"#2C2416",borderBottom:"1px solid #F0E8DC" }}>
                              <div>{item.description}</div>
                              <ItemQtyBar ordered={item.qty} received={item.receivedQty} used={item.usedQty} />
                            </td>
                            <td style={{ padding:"8px 10px",textAlign:"right",color:"#8B6344",fontWeight:600,borderBottom:"1px solid #F0E8DC" }}>{item.cost!=null&&item.cost!==""?`$${Number(item.cost).toFixed(2)}`:"—"}</td>
                            <td style={{ padding:"8px 10px",textAlign:"right",color:"#8B6344",fontWeight:600,borderBottom:"1px solid #F0E8DC" }}>{item.qty}</td>
                            <td style={{ padding:"8px 10px",textAlign:"right",color:"#4A7C2F",fontWeight:700,borderBottom:"1px solid #F0E8DC" }}>{item.receivedQty||0}</td>
                            <td style={{ padding:"8px 10px",textAlign:"right",color:"#2D5016",fontWeight:700,borderBottom:"1px solid #F0E8DC" }}>{item.usedQty||0}</td>
                            <td style={{ padding:"8px 10px",textAlign:"right",fontWeight:800,borderBottom:"1px solid #F0E8DC",color:remaining>0?"#D4830A":"#9A8A74" }}>{remaining}</td>
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
                          <tr style={{ borderTop:"2px solid #E8D9C4",background:"#F5EDE333" }}>
                            <td colSpan={2} style={{ padding:"8px 10px",fontSize:11,fontWeight:700,color:"#8B6344",textTransform:"uppercase",letterSpacing:"0.05em" }}>Total</td>
                            <td style={{ padding:"8px 10px",textAlign:"right",fontWeight:800,color:"#8B6344" }}>{(()=>{const t=row.items.reduce((s,it)=>s+(Number(it.cost)||0)*(Number(it.qty)||0),0);return t>0?`$${t.toFixed(2)}`:"—";})()}</td>
                            <td style={{ padding:"8px 10px",textAlign:"right",fontWeight:800,color:"#8B6344" }}>{totOrd}</td>
                            <td style={{ padding:"8px 10px",textAlign:"right",fontWeight:800,color:"#4A7C2F" }}>{totRec}</td>
                            <td style={{ padding:"8px 10px",textAlign:"right",fontWeight:800,color:"#2D5016" }}>{totUsed}</td>
                            <td style={{ padding:"8px 10px",textAlign:"right",fontWeight:800,color:totRem>0?"#D4830A":"#9A8A74" }}>{totRem}</td>
                          </tr>
                        );
                      })()}
                    </tfoot>
                  </table>
                </div>
              )}

              {/* Notes */}
              {row.notes && (
                <div style={{ margin:"12px 20px",background:"#FEF3DC",borderRadius:8,padding:"8px 12px",fontSize:13,color:"#8B6344",borderLeft:"3px solid #D4830A",fontStyle:"italic" }}>
                  📝 {row.notes}
                </div>
              )}
              <div style={{ height:12 }}/>
            </div>
          ))}
        </div>
      )}
      {modal && <Modal title={edit?"Edit Purchase Order":"New Purchase Order"} onClose={close}><IncomingStockForm initial={edit} onSave={save} onClose={close} /></Modal>}
    </div>
  );
}

function ProductForm({ initial, onSave, onClose }) {
  const [productId, setProductId] = useState(initial?.productId||"");
  const [description, setDescription] = useState(initial?.description||"");
  return (
    <div>
      <Field label="Product ID"><input style={inp} value={productId} onChange={e=>setProductId(e.target.value)} placeholder="HB-001" /></Field>
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

function ProductsTab({ data, setData, orders }) {
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
          <h2 style={{ margin:0,fontSize:22,fontWeight:800,color:"#2C2416",fontFamily:"Georgia,serif" }}>Products</h2>
          <p style={{ margin:"4px 0 0",fontSize:13,color:"#9A8A74" }}>{data.length} product{data.length!==1?"s":""} · {totalUnits} total units across all batches</p>
        </div>
        <button onClick={()=>setModal("product")} style={{ display:"flex",alignItems:"center",gap:7,padding:"10px 18px",background:"#D4830A",color:"#fff",border:"none",borderRadius:10,cursor:"pointer",fontSize:14,fontWeight:700 }}>
          <PlusIcon /> Add Product
        </button>
      </div>

      {data.length===0 ? (
        <div style={{ textAlign:"center",padding:"60px 0",color:"#9A8A74" }}><div style={{ fontSize:40,marginBottom:12 }}>🥜</div><p>No products added yet</p></div>
      ) : (
        <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
          {data.map(product=>{
            const totalQty = product.batches.reduce((s,b)=>s+b.qty,0);
            return (
              <div key={product.id} style={{ background:"#FEFAF4",border:"1.5px solid #E8D9C4",borderRadius:14,overflow:"hidden" }}>
                {/* Product header row */}
                <div style={{ padding:"14px 20px",display:"flex",alignItems:"center",gap:12,background:"#FDF6EC",borderBottom:"1px solid #E8D9C4",flexWrap:"wrap" }}>
                  <span style={{ fontFamily:"monospace",fontSize:12,fontWeight:700,background:"#FEF3DC",color:"#D4830A",padding:"3px 9px",borderRadius:6 }}>{product.productId}</span>
                  <span style={{ fontWeight:700,color:"#2C2416",fontSize:15,flex:1 }}>{product.description}</span>
                  <div style={{ display:"flex",alignItems:"center",gap:16,marginLeft:"auto" }}>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontSize:10,color:"#9A8A74",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.05em" }}>Total Stock</div>
                      <div style={{ fontSize:22,fontWeight:800,color:"#2D5016",lineHeight:1 }}>{totalQty}</div>
                    </div>
                    <div style={{ display:"flex",gap:6 }}>
                      <button onClick={()=>{setBatchTarget(product.id);setModal("batch");}} style={{ display:"flex",alignItems:"center",gap:5,padding:"6px 12px",background:"#EEF5E8",border:"none",borderRadius:7,cursor:"pointer",color:"#4A7C2F",fontSize:12,fontWeight:700 }}>
                        <PlusIcon /> Batch
                      </button>
                      <button onClick={()=>{setEdit(product);setModal("product");}} style={{ background:"#EEF5E8",border:"none",borderRadius:7,padding:"6px 10px",cursor:"pointer",color:"#4A7C2F",display:"flex",alignItems:"center" }}><EditIcon /></button>
                      <button onClick={()=>setData(d=>d.filter(p=>p.id!==product.id))} style={{ background:"#FDECEA",border:"none",borderRadius:7,padding:"6px 10px",cursor:"pointer",color:"#C0392B",display:"flex",alignItems:"center" }}><TrashIcon /></button>
                    </div>
                  </div>
                </div>

                {/* Batch rows */}
                {product.batches.length===0 ? (
                  <div style={{ padding:"12px 20px",fontSize:13,color:"#9A8A74",fontStyle:"italic" }}>No batches yet — click "+ Batch" to add one</div>
                ) : (
                  <div style={{ padding:"12px 20px" }}>
                    <table style={{ width:"100%",borderCollapse:"collapse",fontSize:13 }}>
                      <thead>
                        <tr style={{ borderBottom:"1px solid #E8D9C4" }}>
                          <th style={{ padding:"6px 10px",textAlign:"left",fontSize:10,fontWeight:700,color:"#9A8A74",textTransform:"uppercase",letterSpacing:"0.06em" }}>Batch</th>
                          <th style={{ padding:"6px 10px",textAlign:"right",fontSize:10,fontWeight:700,color:"#9A8A74",textTransform:"uppercase",letterSpacing:"0.06em" }}>Qty</th>
                          <th style={{ padding:"6px 10px",textAlign:"right",fontSize:10,fontWeight:700,color:"#D4830A",textTransform:"uppercase",letterSpacing:"0.06em" }}>Allocated</th>
                          <th style={{ padding:"6px 10px",textAlign:"right",fontSize:10,fontWeight:700,color:"#4A7C2F",textTransform:"uppercase",letterSpacing:"0.06em" }}>Available</th>
                          <th style={{ padding:"6px 10px",textAlign:"right",fontSize:10,fontWeight:700,color:"#9A8A74",textTransform:"uppercase",letterSpacing:"0.06em" }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {product.batches.map((b,i)=>{
                          const isEditing = editingBatch?.pid===product.id && editingBatch?.origBatch===b.batch;
                          const allocated = (orders||[]).filter(o=>o.status!=="Collected").reduce((sum,o)=>{
                            return sum + o.items.filter(it=>it.productId===product.productId&&it.batch===b.batch).reduce((s,it)=>s+(Number(it.qty)||0),0);
                          },0);
                          const available = Math.max(0, b.qty - allocated);
                          return (
                            <tr key={b.batch} style={{ borderBottom:i<product.batches.length-1?"1px solid #E8D9C422":"none",background:isEditing?"#FEF3DC":"transparent" }}>
                              <td style={{ padding:"6px 10px" }}>
                                {isEditing
                                  ? <input autoFocus style={{...inp,fontFamily:"monospace",fontWeight:700,padding:"5px 8px",fontSize:13,width:160}} value={editingBatch.batch} onChange={e=>setEditingBatch(eb=>({...eb,batch:e.target.value}))} />
                                  : <span style={{ fontFamily:"monospace",fontWeight:700,color:"#2C2416",background:"#EEF5E8",padding:"2px 8px",borderRadius:5 }}>{b.batch}</span>
                                }
                              </td>
                              <td style={{ padding:"6px 10px",textAlign:"right" }}>
                                {isEditing
                                  ? <input style={{...inp,textAlign:"right",fontWeight:800,padding:"5px 8px",fontSize:14,width:80}} type="number" min="0" value={editingBatch.qty} onChange={e=>setEditingBatch(eb=>({...eb,qty:e.target.value}))} />
                                  : <span style={{ fontWeight:800,fontSize:16,color:"#4A7C2F" }}>{b.qty}</span>
                                }
                              </td>
                              <td style={{ padding:"6px 10px",textAlign:"right" }}>
                                <span style={{ fontWeight:700,fontSize:14,color:allocated>0?"#D4830A":"#C8C0B4" }}>{allocated>0?allocated:"—"}</span>
                              </td>
                              <td style={{ padding:"6px 10px",textAlign:"right" }}>
                                <span style={{ fontWeight:700,fontSize:14,color:available<=0?"#C0392B":available<5?"#D4830A":"#4A7C2F" }}>{available}</span>
                              </td>
                              <td style={{ padding:"6px 8px",textAlign:"right" }}>
                                {isEditing ? (
                                  <div style={{ display:"flex",gap:4,justifyContent:"flex-end" }}>
                                    <button onClick={updateBatch} style={{ background:"#2D5016",border:"none",borderRadius:6,padding:"4px 10px",cursor:"pointer",color:"#fff",fontSize:11,fontWeight:700 }}>Save</button>
                                    <button onClick={()=>setEditingBatch(null)} style={{ background:"none",border:"1px solid #E8D9C4",borderRadius:6,padding:"4px 8px",cursor:"pointer",color:"#9A8A74",fontSize:11 }}>Cancel</button>
                                  </div>
                                ) : (
                                  <div style={{ display:"flex",gap:4,justifyContent:"flex-end" }}>
                                    <button onClick={()=>setEditingBatch({pid:product.id,origBatch:b.batch,batch:b.batch,qty:String(b.qty)})} style={{ background:"none",border:"none",cursor:"pointer",color:"#4A7C2F",opacity:0.7,display:"flex",padding:3 }} title="Edit batch"><EditIcon /></button>
                                    <button onClick={()=>deleteBatch(product.id,b.batch)} style={{ background:"none",border:"none",cursor:"pointer",color:"#C0392B",opacity:0.5,display:"flex",padding:3 }} title="Delete batch"><TrashIcon /></button>
                                  </div>
                                )}
                              </td>
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
      )}

      {modal==="product" && <Modal title={edit?"Edit Product":"Add Product"} onClose={close}><ProductForm initial={edit} onSave={saveProduct} onClose={close} /></Modal>}
      {modal==="batch" && <Modal title="Add Batch" onClose={close}><BatchForm onSave={saveBatch} onClose={close} /></Modal>}
    </div>
  );
}

function ProductionForm({ initial, incomingStock, products, recipes, onSave, onClose }) {
  const emptyLine = () => ({ stockId: "", itemId: "", qty: "" });
  const [stockLines, setStockLines] = useState(
    initial?.stockLines?.length ? initial.stockLines.map(l=>({stockId:String(l.stockId),itemId:String(l.itemId),qty:String(l.qty)})) : [emptyLine()]
  );
  const [productId, setProductId] = useState(initial?.productId || "");
  const [batch, setBatch] = useState(initial?.batch || "");
  const [qty, setQty] = useState(initial?.qty ? String(initial.qty) : "");

  const setLine = (i, k, v) => setStockLines(ls => ls.map((l,idx)=>idx===i?{...l,[k]:v}:l));
  const addLine = () => setStockLines(ls=>[...ls, emptyLine()]);
  const removeLine = (i) => setStockLines(ls=>ls.filter((_,idx)=>idx!==i));

  // Build stock lines from recipe — always populate items, compute qty if qty is known
  const buildRecipeLines = (pid, qtyVal) => {
    const raw = recipes?.[pid] || [];
    const recipe = Array.isArray(raw) ? raw : (raw.lines || []);
    if (!recipe.length) return null;
    const q = Number(qtyVal) || 0;
    return recipe.map(r => ({
      stockId: String(r.stockId),
      itemId: String(r.itemId),
      qty: q > 0 ? String(Math.round(q * r.pct / 100)) : "",
    }));
  };

  const applyRecipe = (pid, qtyVal) => {
    if (initial) return;
    const lines = buildRecipeLines(pid, qtyVal);
    if (lines) setStockLines(lines);
  };

  // On mount: if no existing run and a product has a recipe, pre-fill stock lines
  const [recipeApplied, setRecipeApplied] = useState(false);
  if (!initial && !recipeApplied && productId) {
    const lines = buildRecipeLines(productId, qty);
    if (lines) { setStockLines(lines); setRecipeApplied(true); }
  }

  const selectedProduct = products.find(p=>p.productId===productId);
  const validLines = stockLines.filter(l=>l.stockId && l.itemId && Number(l.qty)>0);
  const valid = validLines.length>0 && productId && batch && Number(qty)>0;

  // Flat list of all items across all POs for the dropdown
  const allStockItems = incomingStock.flatMap(s =>
    (s.items||[]).map(it => ({
      stockId: s.id,
      itemId: it.id,
      label: `${it.code} · ${it.description}`,
      po: s.po,
      supplier: s.supplier,
      available: Math.max(0, (Number(it.receivedQty)||0) - (Number(it.usedQty)||0)),
    }))
  );

  return (
    <div>
      {/* Output Product */}
      <div style={{ background:"#FEF3DC",border:"1.5px solid #F0A830",borderRadius:10,padding:16,marginBottom:20 }}>
        <div style={{ fontSize:11,fontWeight:700,color:"#D4830A",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:12 }}>① Output Product & Batch</div>
        <Field label="Select Product">
          <select style={sel} value={productId} onChange={e=>{ setProductId(e.target.value); applyRecipe(e.target.value, qty); }}>
            <option value="">— Choose a product —</option>
            {products.map(p=><option key={p.productId} value={p.productId}>{p.productId} · {p.description}</option>)}
          </select>
        </Field>
        <Field label="Batch — type a new batch or pick an existing one">
          <input style={inp} value={batch} onChange={e=>setBatch(e.target.value)} placeholder="e.g. B2026-04A" list="batch-opts" />
          {selectedProduct && <datalist id="batch-opts">{selectedProduct.batches.map(b=><option key={b.batch} value={b.batch}/>)}</datalist>}
          {selectedProduct?.batches.length>0 && (
            <div style={{ marginTop:8,display:"flex",gap:6,flexWrap:"wrap" }}>
              <span style={{ fontSize:11,color:"#9A8A74",alignSelf:"center" }}>Existing:</span>
              {selectedProduct.batches.map(b=>(
                <button key={b.batch} onClick={()=>setBatch(b.batch)} style={{ fontSize:11,padding:"3px 10px",borderRadius:6,border:"1.5px solid #E8D9C4",background:batch===b.batch?"#D4830A":"#FEFAF4",color:batch===b.batch?"#fff":"#8B6344",cursor:"pointer",fontFamily:"monospace",fontWeight:700 }}>
                  {b.batch} <span style={{ opacity:0.7,fontWeight:400 }}>({b.qty})</span>
                </button>
              ))}
            </div>
          )}
        </Field>
        <Field label="Qty Produced"><input style={inp} type="number" min="1" value={qty} onChange={e=>{ setQty(e.target.value); applyRecipe(productId, e.target.value); }} placeholder="0" /></Field>
      </div>

      {/* Arrow */}
      <div style={{ display:"flex",alignItems:"center",justifyContent:"center",marginBottom:20,gap:8 }}>
        <div style={{ flex:1,height:2,background:"linear-gradient(to right,#E8D9C4,#4A7C2F)",borderRadius:2 }}/>
        <span style={{ fontSize:11,fontWeight:700,color:"#4A7C2F",textTransform:"uppercase",letterSpacing:"0.1em",whiteSpace:"nowrap" }}>made from</span>
        <ArrowIcon />
        <div style={{ flex:1,height:2,background:"linear-gradient(to right,#4A7C2F,#E8D9C4)",borderRadius:2 }}/>
      </div>

      {/* Stock Inputs */}
      <div style={{ background:"#EEF5E8",border:"1.5px solid #8AB46A",borderRadius:10,padding:16,marginBottom:20 }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12 }}>
          <div style={{ fontSize:11,fontWeight:700,color:"#4A7C2F",textTransform:"uppercase",letterSpacing:"0.07em" }}>② Incoming Stock Used</div>
          <button onClick={addLine} style={{ display:"flex",alignItems:"center",gap:5,fontSize:12,fontWeight:700,color:"#4A7C2F",background:"#fff",border:"1.5px solid #8AB46A",borderRadius:7,padding:"4px 10px",cursor:"pointer" }}>
            <PlusIcon /> Add Stock Line
          </button>
        </div>
        <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
          {stockLines.map((line, i) => {
            const selected = allStockItems.find(it=>it.stockId===Number(line.stockId)&&it.itemId===Number(line.itemId));
            const stockItem = incomingStock.find(s=>s.id===Number(line.stockId));
            return (
              <div key={i} style={{ background:"#FEFAF4",borderRadius:8,padding:"10px 12px",border:"1px solid #E8D9C4" }}>
                <div style={{ display:"grid",gridTemplateColumns:"1fr auto",gap:8,alignItems:"start" }}>
                  <div>
                    <label style={lbl}>Stock Item</label>
                    <select style={sel} value={line.stockId&&line.itemId?`${line.stockId}:${line.itemId}`:""} onChange={e=>{
                      const [sid,iid] = e.target.value.split(":");
                      setLine(i,"stockId",sid);
                      setLine(i,"itemId",iid);
                    }}>
                      <option value="">— Choose a stock item —</option>
                      {incomingStock.map(s=>(
                        <optgroup key={s.id} label={`${s.supplier} · ${s.po}`}>
                          {(s.items||[]).map(it=>{
                            const avail = Math.max(0,(Number(it.receivedQty)||0)-(Number(it.usedQty)||0));
                            return <option key={it.id} value={`${s.id}:${it.id}`}>{it.code} · {it.description} (avail: {avail})</option>;
                          })}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                  <div style={{ display:"flex",gap:8,alignItems:"end" }}>
                    <div style={{ width:110 }}>
                      <label style={lbl}>Qty Used</label>
                      <input style={inp} type="number" min="1" value={line.qty} onChange={e=>setLine(i,"qty",e.target.value)} placeholder="0" />
                    </div>
                    {stockLines.length>1 && (
                      <button onClick={()=>removeLine(i)} style={{ background:"#FDECEA",border:"none",borderRadius:7,padding:"10px 10px",cursor:"pointer",color:"#C0392B",display:"flex",alignItems:"center",height:42,marginBottom:0 }}><TrashIcon /></button>
                    )}
                  </div>
                </div>
                {selected && (
                  <div style={{ display:"flex",gap:12,marginTop:8,flexWrap:"wrap",alignItems:"center" }}>
                    <span style={{ fontSize:11,color:"#9A8A74" }}>Supplier: <strong style={{color:"#2C2416"}}>{selected.supplier}</strong></span>
                    <span style={{ fontFamily:"monospace",fontSize:11,background:"#FEF3DC",color:"#D4830A",padding:"1px 6px",borderRadius:4 }}>{selected.po}</span>
                    <span style={{ fontSize:11,color:"#9A8A74" }}>Available: <strong style={{color:selected.available>0?"#D4830A":"#C0392B"}}>{selected.available}</strong></span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <SaveCancel onClose={onClose} onSave={()=>valid&&onSave({ stockLines:validLines.map(l=>({stockId:Number(l.stockId),itemId:Number(l.itemId),qty:Number(l.qty)})), productId, batch, qty:Number(qty) })} saveLabel={initial?"Save Changes":"Create Production Run"} />
      {!valid && <p style={{ textAlign:"center",fontSize:12,color:"#9A8A74",marginTop:8 }}>Add at least one stock line and fill all product fields</p>}
    </div>
  );
}

function PrintModal({ row, incomingStock, onClose }) {
  if (!row) return null;
  const today = new Date().toLocaleDateString("en-AU",{weekday:"long",year:"numeric",month:"long",day:"numeric"});
  return (
    <div style={{ position:"fixed",inset:0,zIndex:2000,background:"rgba(44,36,22,0.6)",display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(3px)" }}>
      <div style={{ background:"#fff",borderRadius:16,width:"100%",maxWidth:720,maxHeight:"90vh",overflowY:"auto",boxShadow:"0 24px 64px rgba(0,0,0,0.3)" }}>
        {/* Toolbar — hidden on print */}
        <div className="no-print" style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 24px",borderBottom:"1px solid #E8D9C4",background:"#FDF6EC" }}>
          <span style={{ fontWeight:700,color:"#2C2416",fontSize:15 }}>Production Record — {row.batch}</span>
          <div style={{ display:"flex",gap:8 }}>
            <button onClick={()=>window.print()} style={{ display:"flex",alignItems:"center",gap:6,padding:"8px 16px",background:"#2D5016",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontSize:13,fontWeight:700 }}>
              <PrintIcon /> Print / Save PDF
            </button>
            <button onClick={onClose} style={{ padding:"8px 14px",background:"none",border:"1.5px solid #E8D9C4",borderRadius:8,cursor:"pointer",color:"#9A8A74",fontSize:13,fontWeight:600 }}>Close</button>
          </div>
        </div>
        {/* Printable content */}
        <div id="print-area" style={{ padding:"32px 40px",fontFamily:"Georgia,serif",color:"#2C2416",fontSize:13 }}>
          <style>{`@media print { .no-print { display:none !important; } #print-area { padding: 20px !important; } }`}</style>
          {/* Header */}
          <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:8 }}>
            <div>
              <div style={{ fontFamily:"Georgia,serif",fontWeight:800,color:"#2D5016",fontSize:24,lineHeight:1.1 }}>Production Record</div>
              <div style={{ fontFamily:"system-ui",fontSize:11,color:"#9A8A74",marginTop:4 }}>Harvest Box Operations · {today}</div>
            </div>
            <div style={{ fontFamily:"Georgia,serif",fontWeight:800,color:"#2D5016",fontSize:18,letterSpacing:"0.04em",lineHeight:1.1,textAlign:"right" }}>HARVEST BOX<br/>OPERATIONS</div>
          </div>
          <div style={{ height:2,background:"linear-gradient(to right,#2D5016,#E8D9C4)",borderRadius:2,margin:"16px 0 20px" }}/>
          {/* Meta grid */}
          <div style={{ display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr",gap:1,background:"#E8D9C4",border:"1px solid #E8D9C4",borderRadius:10,overflow:"hidden",marginBottom:24 }}>
            {[
              {label:"Product",value:row.description,mono:false},
              {label:"Product ID",value:row.productId,mono:true,color:"#5C3D1E",bg:"#F5EDE3"},
              {label:"Batch",value:row.batch,mono:true,color:"#4A7C2F",bg:"#EEF5E8"},
              {label:"Qty Produced",value:`${row.qty} units`,mono:false,big:true},
            ].map(m=>(
              <div key={m.label} style={{ background:"#FEFAF4",padding:"12px 16px" }}>
                <div style={{ fontFamily:"system-ui",fontSize:10,fontWeight:700,color:"#8B6344",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:5 }}>{m.label}</div>
                {m.mono
                  ? <span style={{ fontFamily:"monospace",fontWeight:700,fontSize:13,background:m.bg,color:m.color,padding:"2px 8px",borderRadius:4 }}>{m.value}</span>
                  : <div style={{ fontWeight:700,fontSize:m.big?20:14,color:m.big?"#2D5016":"#2C2416" }}>{m.value}</div>
                }
              </div>
            ))}
          </div>
          {/* Stock table */}
          <div style={{ fontFamily:"system-ui",fontSize:11,fontWeight:700,color:"#8B6344",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:8 }}>Incoming Stock Used</div>
          <table style={{ width:"100%",borderCollapse:"collapse",fontFamily:"system-ui",fontSize:12,marginBottom:32 }}>
            <thead>
              <tr style={{ background:"#F5EDE3" }}>
                {["Item Code","Description","Supplier","PO #","Qty Used"].map((h,i)=>(
                  <th key={h} style={{ padding:"8px 10px",textAlign:i===4?"right":"left",fontSize:10,fontWeight:700,color:"#8B6344",textTransform:"uppercase",letterSpacing:"0.06em",borderBottom:"2px solid #E8D9C4" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(row.stockLines||[]).map((line,i)=>{
                const s = incomingStock.find(st=>st.id===line.stockId);
                const it = s?.items?.find(it=>it.id===line.itemId);
                return (
                  <tr key={i} style={{ borderBottom:"1px solid #F0E8DC",background:i%2===0?"#fff":"#FEFAF4" }}>
                    <td style={{ padding:"9px 10px",fontFamily:"monospace",fontWeight:700,color:"#D4830A",fontSize:11 }}>{it?.code||"—"}</td>
                    <td style={{ padding:"9px 10px",color:"#2C2416",fontWeight:600 }}>{it?.description||"Unknown"}</td>
                    <td style={{ padding:"9px 10px",color:"#8B6344" }}>{s?.supplier||"—"}</td>
                    <td style={{ padding:"9px 10px",fontFamily:"monospace",fontSize:11,color:"#D4830A",fontWeight:700 }}>{s?.po||"—"}</td>
                    <td style={{ padding:"9px 10px",textAlign:"right",fontWeight:800,color:"#2D5016" }}>{line.qty}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {/* Signature section */}
          <div style={{ fontFamily:"system-ui",fontSize:11,fontWeight:700,color:"#8B6344",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:16 }}>Authorisation & Sign-off</div>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:24 }}>
            {["Produced by","Checked by","Authorised by"].map(label=>(
              <div key={label}>
                <div style={{ fontFamily:"system-ui",fontSize:11,fontWeight:700,color:"#8B6344",marginBottom:6 }}>{label}</div>
                <div style={{ height:56,borderBottom:"1.5px solid #2C2416",marginBottom:6 }}/>
                <div style={{ fontFamily:"system-ui",fontSize:10,color:"#9A8A74" }}>Name / Signature</div>
                <div style={{ height:28,borderBottom:"1px solid #E8D9C4",marginTop:16,marginBottom:4 }}/>
                <div style={{ fontFamily:"system-ui",fontSize:10,color:"#9A8A74" }}>Date (DD/MM/YYYY)</div>
              </div>
            ))}
          </div>
          {/* Footer */}
          <div style={{ marginTop:32,paddingTop:12,borderTop:"1px solid #E8D9C4",fontFamily:"system-ui",fontSize:10,color:"#9A8A74",display:"flex",justifyContent:"space-between" }}>
            <span>© Harvest Box · harvestbox.com.au</span>
            <span>Production Record · {row.batch} · {row.productId}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductionTab({ data, setData, incomingStock, setIncomingStock, products, setProducts, recipes }) {
  const [modal, setModal] = useState(false);
  const [edit, setEdit] = useState(null);
  const [toast, setToast] = useState(null);
  const [printRecord, setPrintRecord] = useState(null);
  const close = () => { setModal(false); setEdit(null); };
  const showToast = (msg,color) => { setToast({msg,color}); setTimeout(()=>setToast(null),2500); };

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

    showToast(`✅ ${newQty} units → ${product?.description} [${form.batch}]`,"#4A7C2F");
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
    showToast(`🗑️ ${row.qty} units removed from ${row.description} [${row.batch}]`,"#C0392B");
  };

  const total = data.reduce((s,r)=>s+Number(r.qty||0),0);
  const canAdd = incomingStock.length>0 && products.length>0;

  return (
    <div>
      <Toast toast={toast} />
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24 }}>
        <div>
          <h2 style={{ margin:0,fontSize:22,fontWeight:800,color:"#2C2416",fontFamily:"Georgia,serif" }}>Production</h2>
          <p style={{ margin:"4px 0 0",fontSize:13,color:"#9A8A74" }}>{data.length} run{data.length!==1?"s":""} · {total} units total</p>
        </div>
        <button onClick={()=>canAdd&&setModal(true)} style={{ display:"flex",alignItems:"center",gap:7,padding:"10px 18px",background:canAdd?"#5C3D1E":"#ccc",color:"#fff",border:"none",borderRadius:10,cursor:canAdd?"pointer":"not-allowed",fontSize:14,fontWeight:700 }}>
          <PlusIcon /> New Run
        </button>
      </div>
      {!canAdd && (
        <div style={{ background:"#FEF3DC",border:"1.5px solid #F0A830",borderRadius:10,padding:14,marginBottom:20,fontSize:13,color:"#D4830A",fontWeight:600 }}>
          ⚠️ You need both incoming stock and products before creating a production run.
        </div>
      )}
      {data.length===0 ? (
        <div style={{ textAlign:"center",padding:"60px 0",color:"#9A8A74" }}><div style={{ fontSize:40,marginBottom:12 }}>⚙️</div><p>No production runs yet</p></div>
      ) : (
        <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
          {data.map((row)=>(
            <div key={row.id} style={{ background:"#FEFAF4",border:"1.5px solid #E8D9C4",borderRadius:14,overflow:"hidden" }}>
              {/* Header */}
              <div style={{ padding:"14px 20px",display:"flex",alignItems:"center",gap:12,background:"#FDF6EC",borderBottom:"1px solid #E8D9C4",flexWrap:"wrap" }}>
                <div style={{ flex:1,minWidth:180 }}>
                  <div style={{ fontSize:10,fontWeight:700,color:"#D4830A",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:4 }}>Output Product</div>
                  <div style={{ fontWeight:700,color:"#2C2416",fontSize:16 }}>{row.description}</div>
                  <div style={{ display:"flex",gap:6,marginTop:5,alignItems:"center",flexWrap:"wrap" }}>
                    <span style={{ fontFamily:"monospace",fontSize:12,background:"#F5EDE3",color:"#5C3D1E",padding:"2px 7px",borderRadius:5,fontWeight:700 }}>{row.productId}</span>
                    <span style={{ fontFamily:"monospace",fontSize:12,background:"#EEF5E8",color:"#4A7C2F",padding:"2px 7px",borderRadius:5,fontWeight:700 }}>{row.batch}</span>
                  </div>
                </div>
                <div style={{ textAlign:"center",padding:"0 8px" }}>
                  <div style={{ fontSize:10,fontWeight:700,color:"#9A8A74",textTransform:"uppercase",letterSpacing:"0.07em" }}>Produced</div>
                  <div style={{ fontSize:30,fontWeight:800,color:"#4A7C2F",lineHeight:1 }}>{row.qty}</div>
                  <div style={{ fontSize:11,color:"#9A8A74" }}>units</div>
                </div>
                <div style={{ display:"flex",gap:6,marginLeft:"auto" }}>
                  <button onClick={()=>handlePrint(row)} title="Print production record" style={{ display:"flex",alignItems:"center",gap:5,padding:"6px 12px",background:"#F5EDE3",border:"none",borderRadius:7,cursor:"pointer",color:"#5C3D1E",fontSize:12,fontWeight:700 }}><PrintIcon /> Print</button>
                  <button onClick={()=>{setEdit(row);setModal(true);}} style={{ background:"#EEF5E8",border:"none",borderRadius:7,padding:"6px 10px",cursor:"pointer",color:"#4A7C2F",display:"flex",alignItems:"center" }}><EditIcon /></button>
                  <button onClick={()=>handleDelete(row, setIncomingStock)} style={{ background:"#FDECEA",border:"none",borderRadius:7,padding:"6px 10px",cursor:"pointer",color:"#C0392B",display:"flex",alignItems:"center" }}><TrashIcon /></button>
                </div>
              </div>

              {/* Stock lines */}
              <div style={{ padding:"12px 20px" }}>
                <div style={{ fontSize:10,fontWeight:700,color:"#4A7C2F",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:8 }}>
                  From {row.stockLines?.length || 0} Stock Item{row.stockLines?.length!==1?"s":""}
                </div>
                <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
                  {(row.stockLines||[]).map((line,i) => {
                    const s = incomingStock.find(st=>st.id===line.stockId);
                    const it = s?.items?.find(it=>it.id===line.itemId);
                    return (
                      <div key={i} style={{ display:"flex",alignItems:"center",gap:10,background:"#EEF5E8",borderRadius:8,padding:"8px 12px",flexWrap:"wrap" }}>
                        <div style={{ flex:1,minWidth:140 }}>
                          <div style={{ fontWeight:700,color:"#2C2416",fontSize:13 }}>{it?.description || "Unknown item"}</div>
                          <div style={{ display:"flex",gap:6,marginTop:3,flexWrap:"wrap",alignItems:"center" }}>
                            <span style={{ fontFamily:"monospace",fontSize:11,background:"#F5EDE3",color:"#5C3D1E",padding:"1px 6px",borderRadius:4,fontWeight:700 }}>{it?.code}</span>
                            <span style={{ fontFamily:"monospace",fontSize:11,background:"#FEF3DC",color:"#D4830A",padding:"1px 6px",borderRadius:4 }}>{s?.po}</span>
                            <span style={{ fontSize:11,color:"#9A8A74" }}>{s?.supplier}</span>
                          </div>
                        </div>
                        <div style={{ textAlign:"right" }}>
                          <div style={{ fontSize:10,color:"#9A8A74",textTransform:"uppercase",letterSpacing:"0.05em" }}>Qty Used</div>
                          <div style={{ fontSize:18,fontWeight:800,color:"#4A7C2F" }}>{line.qty}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {modal && (
        <Modal title={edit?"Edit Production Run":"New Production Run"} onClose={close}>
          <ProductionForm
            initial={edit}
            incomingStock={incomingStock}
            products={products}
            recipes={recipes}
            onSave={(form)=>save(form, setIncomingStock)}
            onClose={close}
          />
        </Modal>
      )}
      {printRecord && <PrintModal row={printRecord} incomingStock={incomingStock} onClose={()=>setPrintRecord(null)} />}
    </div>
  );
}


function SettingsTab({ products, incomingStock, recipes, setRecipes }) {
  const emptyLine = () => ({ stockId:"", itemId:"", pct:"" });
  const [editingId, setEditingId] = useState(null);
  const [lines, setLines] = useState([emptyLine()]);
  const [weight, setWeight] = useState("");
  const [weightUnit, setWeightUnit] = useState("g");

  const startEdit = (productId) => {
    const existing = recipes[productId] || {};
    const existingLines = existing.lines || (Array.isArray(existing) ? existing : []);
    setLines(existingLines.length ? existingLines.map(l=>({...l,pct:String(l.pct)})) : [emptyLine()]);
    setWeight(existing.weight!=null ? String(existing.weight) : "");
    setWeightUnit(existing.weightUnit || "g");
    setEditingId(productId);
  };
  const cancelEdit = () => { setEditingId(null); setLines([emptyLine()]); setWeight(""); setWeightUnit("g"); };
  const saveRecipe = (productId) => {
    const valid = lines.filter(l=>l.stockId&&l.itemId&&Number(l.pct)>0);
    setRecipes(r=>({...r,[productId]:{
      lines: valid.map(l=>({stockId:Number(l.stockId),itemId:Number(l.itemId),pct:Number(l.pct)})),
      weight: weight!==""?Number(weight):null,
      weightUnit,
    }}));
    setEditingId(null);
  };
  const setLine = (i,k,v) => setLines(ls=>ls.map((l,idx)=>idx===i?{...l,[k]:v}:l));
  const addLine = () => setLines(ls=>[...ls,emptyLine()]);
  const removeLine = (i) => setLines(ls=>ls.filter((_,idx)=>idx!==i));

  const allItems = incomingStock.flatMap(s=>(s.items||[]).map(it=>({
    stockId:s.id, itemId:it.id, code:it.code, description:it.description, supplier:s.supplier, po:s.po,
  })));

  return (
    <div>
      <div style={{ marginBottom:24 }}>
        <h2 style={{ margin:0,fontSize:22,fontWeight:800,color:"#2C2416",fontFamily:"Georgia,serif" }}>Settings</h2>
        <p style={{ margin:"4px 0 0",fontSize:13,color:"#9A8A74" }}>Define the stock ingredients that make up each product (Bill of Materials)</p>
      </div>

      {products.length===0 ? (
        <div style={{ textAlign:"center",padding:"60px 0",color:"#9A8A74" }}><div style={{ fontSize:40,marginBottom:12 }}>⚙️</div><p>Add products first before defining recipes</p></div>
      ) : (
        <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
          {products.map(product=>{
            const recipeData = recipes[product.productId] || [];
            const recipe = Array.isArray(recipeData) ? recipeData : (recipeData.lines || []);
            const recipeWeight = Array.isArray(recipeData) ? null : recipeData.weight;
            const recipeWeightUnit = Array.isArray(recipeData) ? "g" : (recipeData.weightUnit || "g");
            const isEditing = editingId===product.productId;
            const totalPct = lines.reduce((s,l)=>s+(Number(l.pct)||0),0);
            return (
              <div key={product.productId} style={{ background:"#FEFAF4",border:`1.5px solid ${recipe.length>0?"#8AB46A":"#E8D9C4"}`,borderRadius:14,overflow:"hidden" }}>
                {/* Header */}
                <div style={{ padding:"14px 20px",display:"flex",alignItems:"center",gap:12,background:recipe.length>0?"#F2FAEE":"#FDF6EC",borderBottom:"1px solid #E8D9C4",flexWrap:"wrap" }}>
                  <span style={{ fontFamily:"monospace",fontSize:12,fontWeight:700,background:"#FEF3DC",color:"#D4830A",padding:"3px 9px",borderRadius:6 }}>{product.productId}</span>
                  <span style={{ fontWeight:700,color:"#2C2416",fontSize:15,flex:1 }}>{product.description}</span>
                  <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                    {recipe.length>0 && !isEditing && (
                      <span style={{ fontSize:12,color:"#4A7C2F",fontWeight:600,background:"#EEF5E8",padding:"3px 10px",borderRadius:20 }}>✓ {recipe.length} ingredient{recipe.length!==1?"s":""}</span>
                    )}
                    {!isEditing && (
                      <button onClick={()=>startEdit(product.productId)} style={{ display:"flex",alignItems:"center",gap:5,padding:"6px 14px",background:"#5C3D1E",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:700 }}>
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
                        <tr style={{ borderBottom:"1px solid #E8D9C4" }}>
                          {["Item Code","Description","Unit Cost","% of Qty"].map((h,i)=>(
                            <th key={h} style={{ padding:"6px 10px",textAlign:i>=2?"right":"left",fontSize:10,fontWeight:700,color:"#9A8A74",textTransform:"uppercase",letterSpacing:"0.06em" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {recipe.map((line,i)=>{
                          const s=incomingStock.find(st=>st.id===Number(line.stockId));
                          const it=s?.items?.find(it=>it.id===Number(line.itemId));
                          return (
                            <tr key={i} style={{ borderBottom:i<recipe.length-1?"1px solid #F0E8DC":"none" }}>
                              <td style={{ padding:"8px 10px" }}><span style={{ fontFamily:"monospace",fontSize:11,color:"#D4830A",fontWeight:700 }}>{it?.code||"—"}</span></td>
                              <td style={{ padding:"8px 10px",fontWeight:600,color:"#2C2416" }}>{it?.description||"—"}</td>
                              <td style={{ padding:"8px 10px",textAlign:"right",color:"#8B6344",fontWeight:600 }}>{it?.cost!=null&&it?.cost!==""?`$${Number(it.cost).toFixed(2)}`:"—"}</td>
                              <td style={{ padding:"8px 10px",textAlign:"right",fontWeight:800,color:"#4A7C2F" }}>{line.pct}%</td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr style={{ borderTop:"2px solid #E8D9C4",background:"#F5EDE333" }}>
                          <td colSpan={3} style={{ padding:"7px 10px",fontSize:11,fontWeight:700,color:"#8B6344",textTransform:"uppercase" }}>Total</td>
                          <td style={{ padding:"7px 10px",textAlign:"right",fontWeight:800,color:recipe.reduce((s,l)=>s+l.pct,0)===100?"#4A7C2F":"#D4830A" }}>{recipe.reduce((s,l)=>s+l.pct,0)}%</td>
                        </tr>
                      </tfoot>
                    </table>
                    {recipeWeight!=null && (()=>{
                      const totalCostPer = recipe.reduce((sum,line)=>{
                        const s2=incomingStock.find(st=>st.id===Number(line.stockId));
                        const it2=s2?.items?.find(it=>it.id===Number(line.itemId));
                        return sum + (it2?.cost!=null ? Number(it2.cost) * line.pct/100 : 0);
                      },0);
                      const costPerGram = recipeWeight>0 ? totalCostPer * recipeWeight / 1000 : null;
                      return (
                        <div style={{ marginTop:10,display:"flex",gap:16,flexWrap:"wrap" }}>
                          <div style={{ background:"#FEF3DC",border:"1px solid #F0A830",borderRadius:8,padding:"8px 14px",display:"flex",gap:20,alignItems:"center" }}>
                            <div>
                              <div style={{ fontSize:10,fontWeight:700,color:"#8B6344",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:2 }}>Product Weight</div>
                              <div style={{ fontWeight:800,fontSize:16,color:"#D4830A" }}>{recipeWeight}{recipeWeightUnit}</div>
                            </div>
                            <div>
                              <div style={{ fontSize:10,fontWeight:700,color:"#8B6344",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:2 }}>Est. Ingredient Cost / Unit</div>
                              <div style={{ fontWeight:800,fontSize:16,color:"#2D5016" }}>${totalCostPer.toFixed(4)}</div>
                            </div>
                            {costPerGram!=null && (
                              <div>
                                <div style={{ fontSize:10,fontWeight:700,color:"#8B6344",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:2 }}>Cost / {recipeWeightUnit}</div>
                                <div style={{ fontWeight:800,fontSize:16,color:"#2D5016" }}>${costPerGram.toFixed(4)}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
                {!isEditing && recipe.length===0 && (
                  <div style={{ padding:"12px 20px",fontSize:13,color:"#9A8A74",fontStyle:"italic" }}>No recipe defined — click "Set Recipe" to add ingredients</div>
                )}

                {/* Edit mode */}
                {isEditing && (
                  <div style={{ padding:"16px 20px",background:"#FFFDF8" }}>
                    <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16,padding:"12px 14px",background:"#FEF3DC",border:"1.5px solid #F0A830",borderRadius:8 }}>
                      <div>
                        <div style={{ fontSize:10,fontWeight:700,color:"#8B6344",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:5 }}>Product Weight</div>
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
                        <div style={{ fontSize:11,color:"#8B6344" }}>Used to calculate <strong>cost per gram</strong> and total ingredient value for each production run.</div>
                      </div>
                    </div>
                    <div style={{ fontSize:11,fontWeight:700,color:"#8B6344",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:12 }}>
                      Recipe Ingredients — enter % of production qty each stock item contributes
                    </div>
                    <div style={{ display:"flex",flexDirection:"column",gap:8,marginBottom:12 }}>
                      {lines.map((line,i)=>{
                        const s=incomingStock.find(st=>st.id===Number(line.stockId));
                        return (
                          <div key={i} style={{ display:"grid",gridTemplateColumns:"1fr 120px auto",gap:8,alignItems:"center" }}>
                            <select style={sel} value={line.stockId&&line.itemId?`${line.stockId}:${line.itemId}`:""} onChange={e=>{
                              const [sid,iid]=e.target.value.split(":");
                              setLine(i,"stockId",sid); setLine(i,"itemId",iid);
                            }}>
                              <option value="">— Choose stock item —</option>
                              {incomingStock.map(s=>(
                                <optgroup key={s.id} label={`${s.supplier} · ${s.po}`}>
                                  {(s.items||[]).map(it=>(
                                    <option key={it.id} value={`${s.id}:${it.id}`}>{it.code} · {it.description}</option>
                                  ))}
                                </optgroup>
                              ))}
                            </select>
                            <div style={{ display:"flex",alignItems:"center",gap:4 }}>
                              <input style={{...inp,textAlign:"right",padding:"9px 8px"}} type="number" min="0" max="100" step="0.1" value={line.pct} onChange={e=>setLine(i,"pct",e.target.value)} placeholder="0" />
                              <span style={{ fontSize:14,fontWeight:700,color:"#8B6344",whiteSpace:"nowrap" }}>%</span>
                            </div>
                            {lines.length>1
                              ? <button onClick={()=>removeLine(i)} style={{ background:"#FDECEA",border:"none",borderRadius:7,padding:"9px 10px",cursor:"pointer",color:"#C0392B",display:"flex",alignItems:"center" }}><TrashIcon /></button>
                              : <div style={{ width:36 }}/>
                            }
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                      <div style={{ display:"flex",alignItems:"center",gap:12 }}>
                        <button onClick={addLine} style={{ display:"flex",alignItems:"center",gap:5,fontSize:12,fontWeight:700,color:"#4A7C2F",background:"#EEF5E8",border:"1.5px solid #8AB46A",borderRadius:7,padding:"6px 12px",cursor:"pointer" }}>
                          <PlusIcon /> Add Ingredient
                        </button>
                        <span style={{ fontSize:12,color:totalPct===100?"#4A7C2F":totalPct>100?"#C0392B":"#D4830A",fontWeight:700 }}>
                          Total: {totalPct.toFixed(1)}% {totalPct===100?"✓":totalPct>100?"(over 100%)":""}
                        </span>
                      </div>
                      <div style={{ display:"flex",gap:8 }}>
                        <button onClick={cancelEdit} style={{ padding:"8px 16px",borderRadius:8,border:"1.5px solid #E8D9C4",background:"none",cursor:"pointer",color:"#9A8A74",fontSize:13,fontWeight:600 }}>Cancel</button>
                        <button onClick={()=>saveRecipe(product.productId)} style={{ padding:"8px 16px",borderRadius:8,border:"none",background:"#2D5016",cursor:"pointer",color:"#fff",fontSize:13,fontWeight:700 }}>Save Recipe</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
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

      <div style={{ background:"#EEF5E8",border:"1.5px solid #8AB46A",borderRadius:10,padding:16 }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12 }}>
          <div style={{ fontSize:11,fontWeight:700,color:"#4A7C2F",textTransform:"uppercase",letterSpacing:"0.07em" }}>Line Items</div>
          <button onClick={addItem} style={{ display:"flex",alignItems:"center",gap:5,fontSize:12,fontWeight:700,color:"#4A7C2F",background:"#fff",border:"1.5px solid #8AB46A",borderRadius:7,padding:"4px 10px",cursor:"pointer" }}><PlusIcon /> Add Item</button>
        </div>
        <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
          {items.map(function(item, i) {
            const prod = products.find(function(p) { return p.productId === item.productId; });
            return (
              <div key={item.id} style={{ background:"#FEFAF4",borderRadius:8,padding:"10px 12px",border:"1px solid #E8D9C4" }}>
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
                    <button onClick={function(){removeItem(i);}} style={{ background:"#FDECEA",border:"none",borderRadius:6,padding:"9px 10px",cursor:"pointer",color:"#C0392B",display:"flex",alignItems:"center",alignSelf:"end" }}><TrashIcon /></button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display:"flex",justifyContent:"flex-end",gap:8,paddingTop:4 }}>
        <button onClick={onClose} style={{ padding:"9px 18px",borderRadius:8,border:"1.5px solid #E8D9C4",background:"none",cursor:"pointer",color:"#9A8A74",fontSize:13,fontWeight:600 }}>Cancel</button>
        <button onClick={handleSave} disabled={!valid} style={{ padding:"9px 18px",borderRadius:8,border:"none",background:valid?"#2D5016":"#ccc",cursor:valid?"pointer":"not-allowed",color:"#fff",fontSize:13,fontWeight:700 }}>
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
  const toggleCollapse = function(id) { setCollapsed(function(c) { return Object.assign({}, c, {[id]: c[id] === false ? true : false}); }); };
  const [filterStatus, setFilterStatus] = useState(null);
  const toggleFilter = function(s) { setFilterStatus(function(cur) { return cur === s ? null : s; }); };
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
      showToast("Order " + form.invoiceNumber + " updated", "#4A7C2F");
    } else {
      setData(function(d) { return d.concat([Object.assign({}, form, {id: Date.now()})]); });
      showToast("Order " + form.invoiceNumber + " created", "#4A7C2F");
    }
    close();
  };

  const deleteOrder = function(id) {
    setData(function(d) { return d.filter(function(o) { return o.id !== id; }); });
    showToast("Order deleted", "#C0392B");
  };

  const STATUS_STYLE = {
    Open:               { bg:"#F5EDE3",  color:"#8B6344", label:"Open" },
    "Stock Allocated":  { bg:"#FEF3DC",  color:"#D4830A", label:"Stock Allocated" },
    "Paper Work Attached": { bg:"#E8EEF5", color:"#3A5F8A", label:"Paper Work Attached" },
    Collected:          { bg:"#EEF5E8",  color:"#4A7C2F", label:"Collected" },
  };
  const STATUS_LIST = ["Open","Stock Allocated","Paper Work Attached","Collected"];

  return (
    <div>
      <Toast toast={toast} />
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24,gap:16 }}>
        <div>
          <h2 style={{ margin:0,fontSize:22,fontWeight:800,color:"#2C2416",fontFamily:"Georgia,serif" }}>Orders</h2>
          <p style={{ margin:"4px 0 0",fontSize:13,color:"#9A8A74" }}>{(filterStatus ? data.filter(function(o){return o.status===filterStatus;}).length : data.length) + " order" + (data.length !== 1 ? "s" : "") + (filterStatus ? " · filtered by " + filterStatus : "")}</p>
        </div>
        <div style={{ flex:1,maxWidth:320,position:"relative" }}>
          <input value={search} onChange={function(e){setSearch(e.target.value);}} placeholder="Search by invoice, customer, product..." style={{ width:"100%",padding:"10px 36px 10px 14px",borderRadius:10,border:"1.5px solid #E8D9C4",fontSize:13,background:"#fff",boxSizing:"border-box" }} />
          {search && <button onClick={function(){setSearch("");}} style={{ position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"#9A8A74",fontSize:16,lineHeight:1,padding:0 }}>✕</button>}
        </div>
      </div>

      <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:24 }}>
        {STATUS_LIST.map(function(s) {
          const st = STATUS_STYLE[s];
          const count = data.filter(function(o){return o.status===s;}).length;
          return (
            <div key={s} onClick={function(){toggleFilter(s);}} style={{ background:filterStatus===s?st.color:st.bg,border:"1.5px solid " + st.color,borderRadius:10,padding:"10px 14px",cursor:"pointer",transition:"background 0.15s" }}>
              <div style={{ fontSize:10,fontWeight:700,color:filterStatus===s?"#fff":st.color,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:4 }}>{st.label}</div>
              <div style={{ fontSize:22,fontWeight:800,color:filterStatus===s?"#fff":st.color,lineHeight:1 }}>{count}</div>
              {filterStatus===s && <div style={{ fontSize:10,color:"#fff",opacity:0.8,marginTop:3 }}>click to clear</div>}
            </div>
          );
        })}
      </div>

      {data.length === 0 ? (
        <div style={{ textAlign:"center",padding:"60px 0",color:"#9A8A74" }}><div style={{ fontSize:40,marginBottom:12 }}>🧾</div><p>No orders yet</p></div>
      ) : (
        <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
          {filterStatus && <div style={{ fontSize:12,color:"#8B6344",marginBottom:4 }}>Showing <strong>{filterStatus}</strong> orders — <span onClick={function(){setFilterStatus(null);}} style={{ cursor:"pointer",textDecoration:"underline" }}>clear filter</span></div>}
          {data.filter(function(o){
            if (filterStatus && o.status !== filterStatus) return false;
            if (search) {
              var q = search.toLowerCase();
              var matchHeader = o.invoiceNumber.toLowerCase().indexOf(q) !== -1 || o.customer.toLowerCase().indexOf(q) !== -1 || (o.reference||"").toLowerCase().indexOf(q) !== -1;
              var matchItems = o.items.some(function(it){ return (it.productId||"").toLowerCase().indexOf(q) !== -1 || (it.description||"").toLowerCase().indexOf(q) !== -1 || (it.batch||"").toLowerCase().indexOf(q) !== -1; });
              if (!matchHeader && !matchItems) return false;
            }
            return true;
          }).slice().sort(function(a,b){
            const order = ["Open","Stock Allocated","Paper Work Attached","Collected"];
            const si = order.indexOf(a.status) - order.indexOf(b.status);
            if (si !== 0) return si;
            if (!a.dueDate && !b.dueDate) return 0;
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return a.dueDate < b.dueDate ? -1 : a.dueDate > b.dueDate ? 1 : 0;
          }).map(function(order) {
            const st = STATUS_STYLE[order.status] || STATUS_STYLE.Draft;
            const overdue = order.status !== "Collected" && order.dueDate && new Date(order.dueDate) < new Date();
            return (
              <div key={order.id} style={{ background:"#FEFAF4",border:"1.5px solid " + (overdue ? "#C0392B" : "#E8D9C4"),borderRadius:14,overflow:"hidden" }}>
                <div style={{ padding:"14px 20px",display:"flex",alignItems:"center",gap:12,background:overdue?"#FFF0EE":"#FDF6EC",borderBottom:"1px solid #E8D9C4",flexWrap:"wrap" }}>
                  <div style={{ flex:1,minWidth:180 }}>
                    <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:3 }}>
                      <span onClick={function(){toggleCollapse(order.id);}} style={{ fontFamily:"monospace",fontSize:13,fontWeight:800,color:"#2C2416",cursor:"pointer",textDecoration:"underline dotted",userSelect:"none" }}>{order.invoiceNumber}</span>
                      <span style={{ fontSize:11,color:"#9A8A74" }}>{collapsed[order.id] === false ? "▼" : "▶"}</span>
                      <span style={{ fontWeight:700,color:"#5C3D1E",fontSize:14 }}>{order.customer}</span>
                      {order.reference && <span style={{ fontSize:11,color:"#9A8A74",background:"#F0E8DC",padding:"1px 7px",borderRadius:10,fontFamily:"monospace" }}>{order.reference}</span>}
                      <button onClick={function(){
                          const idx = STATUS_LIST.indexOf(order.status);
                          const next = STATUS_LIST[(idx + 1) % STATUS_LIST.length];
                          setData(function(d){ return d.map(function(o){ return o.id===order.id ? Object.assign({},o,{status:next}) : o; }); });
                        }} title={"Advance to: " + STATUS_LIST[(STATUS_LIST.indexOf(order.status)+1) % STATUS_LIST.length]} style={{ fontSize:11,fontWeight:700,background:st.bg,color:st.color,padding:"2px 10px",borderRadius:20,border:"1px solid " + st.color,cursor:"pointer" }}>{st.label} →</button>
                      {overdue && <span style={{ fontSize:11,fontWeight:700,background:"#FDECEA",color:"#C0392B",padding:"2px 8px",borderRadius:20 }}>Overdue</span>}
                    </div>
                    <div style={{ fontSize:11,color:"#9A8A74",marginTop:2 }}>
                      {order.date ? "Issued " + order.date : ""}{order.dueDate ? " · Due " + order.dueDate : ""}
                    </div>
                  </div>
                  <div style={{ display:"flex",gap:6,marginLeft:"auto",alignItems:"center" }}>
                    <button onClick={function(){setEdit(order);setModal(true);}} style={{ background:"#EEF5E8",border:"none",borderRadius:7,padding:"6px 10px",cursor:"pointer",color:"#4A7C2F",display:"flex",alignItems:"center" }}><EditIcon /></button>
                    <button onClick={function(){deleteOrder(order.id);}} style={{ background:"#FDECEA",border:"none",borderRadius:7,padding:"6px 10px",cursor:"pointer",color:"#C0392B",display:"flex",alignItems:"center" }}><TrashIcon /></button>
                  </div>
                </div>

                {collapsed[order.id] === false && (
                  <div style={{ padding:"12px 20px" }}>
                    <div style={{ marginBottom:10 }}>
                      {inlineEdit && inlineEdit.orderId === order.id && inlineEdit.field === "notes" ? (
                        <div style={{ display:"flex",gap:6,alignItems:"center" }}>
                          <input autoFocus value={inlineVal} onChange={function(e){setInlineVal(e.target.value);}} placeholder="Add a note..." style={{ flex:1,fontSize:12,borderRadius:6,border:"1.5px solid #F0A830",padding:"6px 10px",background:"#FFFDF8" }} />
                          <button onClick={saveInline} style={{ background:"#2D5016",border:"none",borderRadius:6,padding:"5px 12px",cursor:"pointer",color:"#fff",fontSize:11,fontWeight:700 }}>Save</button>
                          <button onClick={cancelInline} style={{ background:"none",border:"1px solid #E8D9C4",borderRadius:6,padding:"5px 8px",cursor:"pointer",color:"#9A8A74",fontSize:11 }}>Cancel</button>
                        </div>
                      ) : (
                        <div onClick={function(){startInline(order.id,"notes",order.notes||"",null);}} style={{ background:"#FEF3DC",border:"1px dashed #F0A830",borderRadius:7,padding:"7px 12px",fontSize:12,color:order.notes?"#8B6344":"#C4A870",cursor:"pointer",userSelect:"none" }}>
                          {order.notes ? ("📝 " + order.notes) : "＋ Add note..."}
                          <span style={{ fontSize:10,color:"#C4A870",marginLeft:6 }}>✎</span>
                        </div>
                      )}
                    </div>
                    <table style={{ width:"100%",borderCollapse:"collapse",fontSize:13 }}>
                      <thead>
                        <tr style={{ borderBottom:"1px solid #E8D9C4" }}>
                          <th style={{ padding:"6px 10px",textAlign:"left",fontSize:10,fontWeight:700,color:"#9A8A74",textTransform:"uppercase",letterSpacing:"0.06em" }}>Product ID</th>
                          <th style={{ padding:"6px 10px",textAlign:"left",fontSize:10,fontWeight:700,color:"#9A8A74",textTransform:"uppercase",letterSpacing:"0.06em" }}>Description</th>
                          <th style={{ padding:"6px 10px",textAlign:"left",fontSize:10,fontWeight:700,color:"#9A8A74",textTransform:"uppercase",letterSpacing:"0.06em" }}>Batch</th>
                          <th style={{ padding:"6px 10px",textAlign:"right",fontSize:10,fontWeight:700,color:"#9A8A74",textTransform:"uppercase",letterSpacing:"0.06em" }}>Qty</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.items.map(function(item, i) {
                          const isEditingBatch = inlineEdit && inlineEdit.orderId === order.id && inlineEdit.field === "batch" && inlineEdit.itemId === item.id;
                          const prod = products.find(function(p){return p.productId === item.productId;});
                          return (
                            <tr key={item.id} style={{ borderBottom: i < order.items.length - 1 ? "1px solid #F0E8DC" : "none", background: i % 2 === 0 ? "transparent" : "#FEFAF4" }}>
                              <td style={{ padding:"8px 10px" }}><span style={{ fontFamily:"monospace",fontSize:11,color:"#D4830A",fontWeight:700 }}>{item.productId}</span></td>
                              <td style={{ padding:"8px 10px",fontWeight:600,color:"#2C2416" }}>{item.description}</td>
                              <td style={{ padding:"6px 10px" }}>
                                {isEditingBatch ? (
                                  <div style={{ display:"flex",gap:4,alignItems:"center" }}>
                                    {prod && prod.batches && prod.batches.length > 0 ? (
                                      <select autoFocus value={inlineVal} onChange={function(e){setInlineVal(e.target.value);}} style={{ fontSize:12,fontWeight:700,borderRadius:6,border:"1.5px solid #8AB46A",padding:"3px 6px",background:"#fff",fontFamily:"monospace" }}>
                                        <option value="">— batch —</option>
                                        {prod.batches.map(function(b){return <option key={b.batch} value={b.batch}>{b.batch + " (" + b.qty + ")"}</option>;})}
                                      </select>
                                    ) : (
                                      <input autoFocus value={inlineVal} onChange={function(e){setInlineVal(e.target.value);}} style={{ fontSize:12,fontFamily:"monospace",fontWeight:700,borderRadius:6,border:"1.5px solid #8AB46A",padding:"3px 7px",width:140 }} />
                                    )}
                                    <button onClick={saveInline} style={{ background:"#2D5016",border:"none",borderRadius:6,padding:"3px 10px",cursor:"pointer",color:"#fff",fontSize:11,fontWeight:700 }}>Save</button>
                                    <button onClick={cancelInline} style={{ background:"none",border:"1px solid #E8D9C4",borderRadius:6,padding:"3px 7px",cursor:"pointer",color:"#9A8A74",fontSize:11 }}>Cancel</button>
                                  </div>
                                ) : (
                                  <button onClick={function(){startInline(order.id,"batch",item.batch,item.id);}} style={{ fontFamily:"monospace",fontSize:11,background:"#EEF5E8",color:"#4A7C2F",padding:"2px 7px",borderRadius:4,fontWeight:700,border:"1px dashed #8AB46A",cursor:"pointer" }}>{item.batch || "set batch"} ✎</button>
                                )}
                              </td>
                              <td style={{ padding:"8px 10px",textAlign:"right",fontWeight:700 }}>{item.qty}</td>
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
    <div style={{ minHeight:"100vh",background:"#2D5016",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"system-ui,sans-serif" }}>
      <div style={{ background:"#FEFAF4",borderRadius:20,padding:"48px 44px",width:"100%",maxWidth:400,boxShadow:"0 20px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ textAlign:"center",marginBottom:36 }}>
          <div style={{ fontFamily:"Georgia,serif",fontWeight:800,color:"#2D5016",fontSize:26,letterSpacing:"0.04em",lineHeight:1.2,marginBottom:6 }}>HARVEST BOX</div>
          <div style={{ fontSize:12,color:"#8AB46A",fontWeight:700,letterSpacing:"0.14em",textTransform:"uppercase" }}>Operations</div>
          <div style={{ width:48,height:3,background:"linear-gradient(to right,#2D5016,#D4830A)",borderRadius:2,margin:"16px auto 0" }}></div>
        </div>

        <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
          <div>
            <label style={{ fontSize:11,fontWeight:700,color:"#8B6344",textTransform:"uppercase",letterSpacing:"0.07em",display:"block",marginBottom:5 }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={function(e){setEmail(e.target.value); setError("");}}
              onKeyDown={handleKey}
              placeholder="you@harvestbox.com.au"
              style={{ width:"100%",padding:"11px 14px",borderRadius:9,border:"1.5px solid #E8D9C4",fontSize:14,background:"#fff",boxSizing:"border-box",outline:"none" }}
            />
          </div>
          <div>
            <label style={{ fontSize:11,fontWeight:700,color:"#8B6344",textTransform:"uppercase",letterSpacing:"0.07em",display:"block",marginBottom:5 }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={function(e){setPassword(e.target.value); setError("");}}
              onKeyDown={handleKey}
              placeholder="••••••••"
              style={{ width:"100%",padding:"11px 14px",borderRadius:9,border:"1.5px solid #E8D9C4",fontSize:14,background:"#fff",boxSizing:"border-box",outline:"none" }}
            />
          </div>

          {error && (
            <div style={{ background:"#FDECEA",border:"1px solid #E8A0A0",borderRadius:8,padding:"9px 12px",fontSize:13,color:"#C0392B",fontWeight:500 }}>
              {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            style={{ marginTop:4,padding:"13px",borderRadius:10,border:"none",background:loading?"#8AB46A":"#2D5016",color:"#fff",fontSize:15,fontWeight:700,cursor:loading?"not-allowed":"pointer",letterSpacing:"0.03em" }}
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
          <button
            onClick={function(){onLogin({access_token:"preview",user:{email:"preview@harvestbox.com.au"},preview:true});}}
            style={{ marginTop:4,padding:"10px",borderRadius:10,border:"1.5px dashed #E8D9C4",background:"none",color:"#9A8A74",fontSize:12,fontWeight:600,cursor:"pointer",letterSpacing:"0.03em" }}
          >
            Preview Mode (no login)
          </button>
        </div>

        <p style={{ textAlign:"center",fontSize:11,color:"#9A8A74",marginTop:28,marginBottom:0 }}>
          Harvest Box · harvestbox.com.au
        </p>
        <p style={{ textAlign:"center",fontSize:10,color:"#C4B8A8",marginTop:8,marginBottom:0 }}>
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

  const [tab, setTab] = useState("Incoming Stock");
  const [incomingStock, setIncomingStock] = useState([]);
  const [products, setProducts] = useState([]);
  const [production, setProduction] = useState([]);
  const [recipes, setRecipes] = useState({});
  const [orders, setOrders] = useState([]);
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
      supabase.from("products").select("*"),
      supabase.from("production").select("*"),
      supabase.from("orders").select("*"),
      supabase.from("recipes").select("*"),
    ]).then(function(results) {
      const [stock, prods, prod, ords, recs] = results;
      if (stock.error) { setDataError("Could not load data: " + (stock.error.message || "Check Supabase tables exist.")); setDataLoading(false); return; }
      const parseJ = function(val) { if (!val) return val; try { return typeof val === "string" ? JSON.parse(val) : val; } catch { return val; } };
      if (stock.data) setIncomingStock(stock.data.map(function(r){ return Object.assign({},r,{items:parseJ(r.items)||[]}); }));
      if (prods.data) setProducts(prods.data.map(function(r){ return Object.assign({},r,{batches:parseJ(r.batches)||[]}); }));
      if (prod.data) setProduction(prod.data.map(function(r){ return Object.assign({},r,{stockLines:parseJ(r.stockLines)||[]}); }));
      if (ords.data) setOrders(ords.data.map(function(r){ return Object.assign({},r,{items:parseJ(r.items)||[]}); }));
      if (recs.data && recs.data.length > 0) {
        const recipeMap = {};
        recs.data.forEach(function(r){ recipeMap[r.product_id] = parseJ(r.recipe); });
        setRecipes(recipeMap);
      }
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
      return copy;
    });
    const { error } = await supabase.from(table).upsert(payload);
    if (error) console.warn("Supabase save error:", table, error);
  }, [session, dbConnected]);

  const syncSetIncomingStock = function(fn) { setIncomingStock(function(prev){ const next=typeof fn==="function"?fn(prev):fn; saveToDb("incoming_stock",next); return next; }); };
  const syncSetProducts = function(fn) { setProducts(function(prev){ const next=typeof fn==="function"?fn(prev):fn; saveToDb("products",next); return next; }); };
  const syncSetProduction = function(fn) { setProduction(function(prev){ const next=typeof fn==="function"?fn(prev):fn; saveToDb("production",next); return next; }); };
  const syncSetOrders = function(fn) { setOrders(function(prev){ const next=typeof fn==="function"?fn(prev):fn; saveToDb("orders",next); return next; }); };
  const syncSetRecipes = function(fn) { setRecipes(function(prev){ const next=typeof fn==="function"?fn(prev):fn; const rows=Object.entries(next).map(function([k,v]){return {product_id:k,recipe:JSON.stringify(v)};}); saveToDb("recipes",rows); return next; }); };

  if (authLoading) return <div style={{ minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#2D5016",color:"#8AB46A",fontFamily:"Georgia,serif",fontSize:18 }}>Loading…</div>;
  if (!session) return <LoginScreen onLogin={handleLogin} />;
  if (dataLoading) return <div style={{ minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#FDF6EC",color:"#4A7C2F",fontFamily:"Georgia,serif",fontSize:18,flexDirection:"column",gap:12 }}><div>Loading data…</div>{dataError && <div style={{fontSize:13,color:"#C0392B",marginTop:8}}>{dataError}</div>}</div>;

  const counts = { "Incoming Stock":incomingStock.length, Products:products.length, Production:production.length, Orders:orders.length, Settings:null };
  const navIcons = {
    "Incoming Stock": <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 8h14M5 8a2 2 0 1 0-4 0v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8m-14 0V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M12 12v4m-2-2h4"/></svg>,
    Products: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8m-4-4v4"/></svg>,
    Production: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>,
    Orders: <OrdersIcon />,
    Settings: <SettingsIcon />,
  };
  const totalUnits = products.reduce((s,p)=>s+p.batches.reduce((ss,b)=>ss+b.qty,0),0);
  return (
    <>
      <style>{`* { box-sizing:border-box; } body { margin:0; font-family:system-ui,sans-serif; background:#FDF6EC; }`}</style>
      <div style={{ minHeight:"100vh",display:"flex",flexDirection:"column" }}>
        <header style={{ background:"#2D5016",padding:"0 32px",display:"flex",alignItems:"center",justifyContent:"space-between",height:64,boxShadow:"0 2px 12px rgba(44,36,22,0.15)" }}>
          <div style={{ display:"flex",alignItems:"center",gap:4 }}>
            <div style={{ fontFamily:"Georgia,serif",fontWeight:800,color:"#fff",fontSize:20,letterSpacing:"0.04em",lineHeight:1 }}>HARVEST BOX</div>
            <div style={{ width:1,height:22,background:"#8AB46A",margin:"0 8px" }}></div>
            <div style={{ fontSize:11,color:"#8AB46A",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase" }}>Operations</div>
          </div>
          <div style={{ display:"flex",alignItems:"center",gap:16 }}>
            {isConfigured && <div style={{ display:"flex",alignItems:"center",gap:5,fontSize:11 }}>
              <div style={{ width:7,height:7,borderRadius:"50%",background:dbConnected?"#8AB46A":"#F0A830" }}></div>
              <span style={{ color:"#8AB46A" }}>{dbConnected?"Live":"Local"}</span>
            </div>}
            <div style={{ fontSize:12,color:"#8AB46A" }}>{new Date().toLocaleDateString("en-AU",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</div>
            <button onClick={handleSignOut} style={{ fontSize:12,color:"#8AB46A",background:"rgba(255,255,255,0.1)",border:"1px solid rgba(138,180,106,0.4)",borderRadius:7,padding:"5px 12px",cursor:"pointer",fontWeight:600 }}>Sign Out</button>
          </div>
        </header>

        <div style={{ display:"flex",flex:1 }}>
          <nav style={{ width:220,background:"#FEFAF4",borderRight:"1.5px solid #E8D9C4",padding:"24px 12px",display:"flex",flexDirection:"column",gap:4 }}>
            {NAV.map(t=>{
              const active=t===tab;
              return (
                <button key={t} onClick={()=>setTab(t)} style={{ display:"flex",alignItems:"center",gap:10,padding:"11px 14px",borderRadius:10,border:"none",cursor:"pointer",textAlign:"left",background:active?"#2D5016":"transparent",color:active?"#fff":"#8B6344",fontWeight:active?700:500,fontSize:14 }}>
                  <span style={{ opacity:active?1:0.6 }}>{navIcons[t]}</span>
                  <span style={{ flex:1 }}>{t}</span>
                  {counts[t]!==null && <span style={{ fontSize:11,fontWeight:700,background:active?"rgba(255,255,255,0.2)":"#E8D9C4",color:active?"#fff":"#9A8A74",padding:"1px 7px",borderRadius:20 }}>{counts[t]}</span>}
                </button>
              );
            })}
          </nav>
          <main style={{ flex:1,padding:32,overflowY:"auto" }}>
            {tab==="Incoming Stock" && <IncomingStockTab data={incomingStock} setData={syncSetIncomingStock} />}
            {tab==="Products" && <ProductsTab data={products} setData={syncSetProducts} orders={orders} />}
            {tab==="Production" && <ProductionTab data={production} setData={syncSetProduction} incomingStock={incomingStock} setIncomingStock={syncSetIncomingStock} products={products} setProducts={syncSetProducts} recipes={recipes} />}
            {tab==="Orders" && <OrdersTab data={orders} setData={syncSetOrders} products={products} />}
            {tab==="Settings" && <SettingsTab products={products} incomingStock={incomingStock} recipes={recipes} setRecipes={syncSetRecipes} />}
          </main>
        </div>
        <footer style={{ borderTop:"1px solid #E8D9C4",padding:"12px 32px",display:"flex",justifyContent:"space-between",background:"#FEFAF4" }}>
          <span style={{ fontSize:12,color:"#9A8A74" }}>© 2026 Harvest Box · harvestbox.com.au</span>
          <span style={{ fontSize:12,color:"#9A8A74" }}>Operations Management System</span>
        </footer>
      </div>
    </>
  );
}
