import React, { useMemo, useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { CalendarDays, CheckCircle2, Clock3, MessageCircle, Plus, Search, Stethoscope, Ticket, Trash2, UserRound } from "lucide-react";
import "./style.css";

const doctors = ["د. أحمد محمد", "د. سارة علي", "د. خالد حسن"];
const visitTypes = ["كشف جديد", "مراجعة", "استشارة"];
const periods = ["صباح", "مساء"];
const statuses = ["في الانتظار", "دخل للدكتور", "تم الكشف", "ملغي"];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function makeTicketNumber(count) {
  return `A-${String(count + 1).padStart(3, "0")}`;
}

function loadBookings() {
  try {
    const saved = localStorage.getItem("osmas_bookings");
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function App() {
  const [tab, setTab] = useState("patient");
  const [bookings, setBookings] = useState(loadBookings);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    age: "",
    doctor: doctors[0],
    type: visitTypes[0],
    date: todayISO(),
    period: periods[0],
    notes: "",
  });
  const [lastTicket, setLastTicket] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    localStorage.setItem("osmas_bookings", JSON.stringify(bookings));
  }, [bookings]);

  const stats = useMemo(() => {
    const today = bookings.filter((b) => b.date === todayISO());
    return {
      total: today.length,
      waiting: today.filter((b) => b.status === "في الانتظار").length,
      inside: today.filter((b) => b.status === "دخل للدكتور").length,
      done: today.filter((b) => b.status === "تم الكشف").length,
    };
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const text = `${b.ticket} ${b.name} ${b.phone} ${b.doctor} ${b.status}`;
      return text.toLowerCase().includes(search.toLowerCase());
    });
  }, [bookings, search]);

  function submitBooking(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      alert("يرجى إدخال اسم المريض ورقم الجوال");
      return;
    }

    const now = new Date();
    const ticket = makeTicketNumber(bookings.length);
    const newBooking = {
      id: Date.now(),
      ticket,
      ...form,
      status: "في الانتظار",
      createdAt: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
    };

    setBookings([newBooking, ...bookings]);
    setLastTicket(newBooking);
    setForm({
      name: "",
      phone: "",
      age: "",
      doctor: doctors[0],
      type: visitTypes[0],
      date: todayISO(),
      period: periods[0],
      notes: "",
    });
  }

  function updateStatus(id, status) {
    setBookings((list) => list.map((b) => (b.id === id ? { ...b, status } : b)));
  }

  function deleteBooking(id) {
    if (confirm("هل تريد حذف هذا الحجز؟")) {
      setBookings((list) => list.filter((b) => b.id !== id));
    }
  }

  function clearAll() {
    if (confirm("سيتم حذف كل الحجوزات من هذا الجهاز، هل أنت متأكد؟")) {
      setBookings([]);
      setLastTicket(null);
    }
  }

  function whatsappLink(ticket) {
    const msg = `تم حجز تذكرتك في تطبيق أوسماس بواسطة مجموعة إرادة بلس%0Aرقم التذكرة: ${ticket.ticket}%0Aالاسم: ${ticket.name}%0Aالدكتور: ${ticket.doctor}%0Aالتاريخ: ${ticket.date}%0Aالفترة: ${ticket.period}%0Aالحالة: ${ticket.status}`;
    return `https://wa.me/?text=${msg}`;
  }

  return (
    <main className="app" dir="rtl">
      <div className="container">
        <header className="hero">
          <div className="heroText">
            <div className="badge"><Stethoscope size={18} /> تطبيق حجز تذاكر الدكتور</div>
            <h1>أوسماس</h1>
            <p>بواسطة مجموعة إرادة بلس</p>
          </div>

          <div className="stats">
            <Stat icon={<Ticket />} label="حجوزات اليوم" value={stats.total} />
            <Stat icon={<Clock3 />} label="في الانتظار" value={stats.waiting} />
            <Stat icon={<UserRound />} label="داخل العيادة" value={stats.inside} />
            <Stat icon={<CheckCircle2 />} label="تم الكشف" value={stats.done} />
          </div>
        </header>

        <div className="tabs">
          <button className={tab === "patient" ? "active patient" : ""} onClick={() => setTab("patient")}>حجز المريض</button>
          <button className={tab === "admin" ? "active admin" : ""} onClick={() => setTab("admin")}>لوحة الاستقبال</button>
        </div>

        {tab === "patient" ? (
          <section className="grid">
            <div className="card">
              <div className="titleRow">
                <div className="iconBox"><Plus /></div>
                <div>
                  <h2>احجز تذكرتك الآن</h2>
                  <p>أدخل بيانات المريض وسيظهر رقم التذكرة مباشرة.</p>
                </div>
              </div>

              <form onSubmit={submitBooking} className="form">
                <Input label="اسم المريض" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="مثال: أحمد محمد" required />
                <Input label="رقم الجوال" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="05xxxxxxxx" required />
                <Input label="العمر" value={form.age} onChange={(v) => setForm({ ...form, age: v })} placeholder="اختياري" />
                <Select label="الدكتور" value={form.doctor} onChange={(v) => setForm({ ...form, doctor: v })} options={doctors} />
                <Select label="نوع الزيارة" value={form.type} onChange={(v) => setForm({ ...form, type: v })} options={visitTypes} />
                <Select label="الفترة" value={form.period} onChange={(v) => setForm({ ...form, period: v })} options={periods} />
                <Input label="التاريخ" type="date" value={form.date} onChange={(v) => setForm({ ...form, date: v })} />
                <div className="full">
                  <label>ملاحظات</label>
                  <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="أي ملاحظة طبية أو إدارية مختصرة" />
                </div>
                <button className="mainBtn full">تأكيد الحجز وإصدار التذكرة</button>
              </form>
            </div>

            <div className="ticketCard">
              <div className="titleRow">
                <div className="iconBox dark"><Ticket /></div>
                <div>
                  <h2>آخر تذكرة</h2>
                  <p>تظهر هنا بيانات آخر حجز.</p>
                </div>
              </div>

              {lastTicket ? (
                <div className="ticketPaper">
                  <span>رقم التذكرة</span>
                  <strong>{lastTicket.ticket}</strong>
                  <p>الاسم: {lastTicket.name}</p>
                  <p>الدكتور: {lastTicket.doctor}</p>
                  <p>التاريخ: {lastTicket.date}</p>
                  <p>الفترة: {lastTicket.period}</p>
                  <a href={whatsappLink(lastTicket)} target="_blank"><MessageCircle size={18} /> مشاركة على واتساب</a>
                </div>
              ) : (
                <div className="empty">لم يتم إنشاء تذكرة جديدة بعد.</div>
              )}
            </div>
          </section>
        ) : (
          <section className="card">
            <div className="adminHead">
              <div>
                <h2>لوحة الاستقبال</h2>
                <p>إدارة الحجوزات وتغيير حالة المريض.</p>
              </div>
              <button className="dangerSmall" onClick={clearAll}>مسح الكل</button>
            </div>

            <div className="search">
              <Search size={18} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث بالاسم أو الجوال أو رقم التذكرة" />
            </div>

            <div className="table">
              <div className="tableHead">
                <span>التذكرة</span><span>المريض</span><span>الجوال</span><span>الدكتور</span><span>الحالة</span><span></span>
              </div>
              {filteredBookings.map((b) => (
                <div className="row" key={b.id}>
                  <strong className="ticketNo">{b.ticket}</strong>
                  <div><b>{b.name}</b><small>{b.date} - {b.period} - {b.createdAt}</small></div>
                  <span>{b.phone}</span>
                  <span>{b.doctor}</span>
                  <select value={b.status} onChange={(e) => updateStatus(b.id, e.target.value)}>
                    {statuses.map((s) => <option key={s}>{s}</option>)}
                  </select>
                  <button className="delete" onClick={() => deleteBooking(b.id)}><Trash2 size={18} /></button>
                </div>
              ))}
              {filteredBookings.length === 0 && <div className="empty light">لا توجد حجوزات.</div>}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function Stat({ icon, label, value }) {
  return <div className="stat">{icon}<strong>{value}</strong><span>{label}</span></div>;
}

function Input({ label, value, onChange, placeholder, type = "text", required = false }) {
  return (
    <div>
      <label>{label}</label>
      <input type={type} required={required} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <div>
      <label>{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
