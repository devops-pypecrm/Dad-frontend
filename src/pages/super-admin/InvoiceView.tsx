import type { BillingInvoice } from '@/services/superAdminBillingService'

const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
const two = (n: number) => (n < 20 ? ones[n] : `${tens[Math.floor(n / 10)]}${n % 10 ? ' ' + ones[n % 10] : ''}`)
const three = (n: number) => (n >= 100 ? `${ones[Math.floor(n / 100)]} Hundred${n % 100 ? ' ' + two(n % 100) : ''}` : two(n))
export function rupeesInWords(amount: number): string {
  let n = Math.round(amount)
  if (n === 0) return 'Rupees Zero Only'
  const parts: string[] = []
  const crore = Math.floor(n / 10000000); n %= 10000000
  const lakh = Math.floor(n / 100000); n %= 100000
  const thousand = Math.floor(n / 1000); n %= 1000
  if (crore) parts.push(`${three(crore)} Crore`)
  if (lakh) parts.push(`${three(lakh)} Lakh`)
  if (thousand) parts.push(`${three(thousand)} Thousand`)
  if (n) parts.push(three(n))
  return `Rupees ${parts.join(' ')} Only`
}

const inr = (v: number) => `₹${v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const d = (v: string | Date) => new Date(v).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })
const GREEN = '#21a05e'

/** Printable invoice — layout mirrors the approved Pype CRM invoice design. */
export function InvoiceView({ invoice }: { invoice: BillingInvoice }) {
  const monthsLabel = invoice.months === 1 ? invoice.lines[0]?.label : `${invoice.lines[0]?.label.split(' ')[0].slice(0, 3)} – ${invoice.lines[invoice.lines.length - 1]?.label.replace(/^(\w{3})\w*/, '$1')}`
  const users = Math.max(...invoice.lines.map((l) => l.users), 0)
  const standardTotal = invoice.lines.reduce((a, l) => a + l.users * invoice.standardRate, 0)
  const discounted = invoice.ratePerUser < invoice.standardRate
  const org = invoice.organisation?.name || 'Organisation'
  const box: React.CSSProperties = { border: '1px solid #e5e7eb', borderRadius: 12, padding: 16 }
  const label: React.CSSProperties = { fontSize: 9, letterSpacing: 2, color: GREEN, fontWeight: 700, marginBottom: 8 }
  return (
    <div id="invoice-print" style={{ background: '#fff', color: '#1a1a2e', fontFamily: 'Poppins, Inter, system-ui, sans-serif', padding: 40, width: '100%', maxWidth: 794, margin: '0 auto', fontSize: 12 }}>
      <style>{`@media print { body * { visibility: hidden !important; } #invoice-print, #invoice-print * { visibility: visible !important; } #invoice-print { position: absolute; left: 0; top: 0; width: 100%; padding: 24px !important; } @page { size: A4; margin: 10mm; } }`}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 28, fontWeight: 700, color: GREEN }}>Pype CRM</div>
          <div style={{ fontSize: 11, color: '#6b7280' }}>by Prohostix LLP · pypecrm.com · info@pypecrm.com</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 30, fontWeight: 800 }}>INVOICE</div>
          <div style={{ fontSize: 11, color: '#6b7280', lineHeight: 1.7 }}>
            Invoice No: <b style={{ color: '#111' }}>{invoice.invoiceNumber}</b><br />
            Invoice Date: <b style={{ color: '#111' }}>{d(invoice.issueDate)}</b><br />
            Billing Month: <b style={{ color: '#111' }}>{monthsLabel}</b><br />
            Due Date: <b style={{ color: '#111' }}>{d(invoice.dueDate)}</b>
          </div>
          {invoice.status === 'paid' && <div style={{ marginTop: 6, display: 'inline-block', border: `2px solid ${GREEN}`, color: GREEN, fontWeight: 800, padding: '2px 12px', borderRadius: 6, letterSpacing: 2 }}>PAID</div>}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 28 }}>
        <div style={box}><div style={label}>BILLED TO</div><div style={{ fontSize: 15, fontWeight: 700 }}>{org}</div><div>Subscription Plan: Enterprise</div></div>
        <div style={box}><div style={label}>BILLED BY</div><div style={{ fontSize: 15, fontWeight: 700 }}>Pype CRM – Prohostix LLP</div><div>Kochi, Kerala · info@pypecrm.com</div></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 14 }}>
        {[['Billing Period', `${d(invoice.periodStart)} – ${d(invoice.periodEnd)}`], ['Subscription Duration', `${invoice.months} Month${invoice.months > 1 ? 's' : ''}`], ['Active Users', `${users} Users`], ['Rate', `₹${invoice.ratePerUser} / user / month`]].map(([k, v]) => (
          <div key={k} style={{ background: '#eaf3ee', borderRadius: 10, padding: '10px 12px' }}><div style={{ fontSize: 10, color: '#6b7280' }}>{k}</div><div style={{ fontWeight: 700, marginTop: 2 }}>{v}</div></div>
        ))}
      </div>

      <div style={{ marginTop: 22, background: GREEN, color: '#fff', borderRadius: 10, padding: '10px 14px', display: 'grid', gridTemplateColumns: '3fr 0.7fr 1fr 1.6fr 1.2fr', fontWeight: 600, fontSize: 11 }}>
        <div>Description</div><div style={{ textAlign: 'right' }}>Users</div><div style={{ paddingLeft: 16 }}>Duration</div><div style={{ textAlign: 'right' }}>Rate (per user / month)</div><div style={{ textAlign: 'right' }}>Amount</div>
      </div>
      {invoice.lines.map((l) => (
        <div key={l.month} style={{ display: 'grid', gridTemplateColumns: '3fr 0.7fr 1fr 1.6fr 1.2fr', padding: '14px 14px', borderBottom: '1px solid #e5e7eb', alignItems: 'center' }}>
          <div>Pype CRM Enterprise Subscription<div style={{ fontSize: 9, color: '#9ca3af', marginTop: 4 }}>Billing period: {d(l.start)} – {d(l.end)}</div></div>
          <div style={{ textAlign: 'right' }}>{l.users}</div><div style={{ paddingLeft: 16 }}>1 month</div>
          <div style={{ textAlign: 'right' }}>{inr(l.rate)}</div><div style={{ textAlign: 'right' }}>{inr(l.amount)}</div>
        </div>
      ))}

      <div style={{ width: '58%', marginLeft: 'auto', marginTop: 18, lineHeight: 2.1 }}>
        {discounted && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Standard Price ({users} × ₹{invoice.standardRate.toFixed(2)} × {invoice.months} month{invoice.months > 1 ? 's' : ''})</span><span style={{ textDecoration: 'line-through', color: '#9ca3af' }}>{inr(standardTotal)}</span></div>}
        {discounted && <div style={{ display: 'flex', justifyContent: 'space-between', color: GREEN }}><span>Custom Price ({users} × ₹{invoice.ratePerUser.toFixed(2)} × {invoice.months} month{invoice.months > 1 ? 's' : ''})</span><span>{inr(invoice.total)}</span></div>}
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Subtotal</span><span>{inr(invoice.subtotal)}</span></div>
        <div style={{ background: GREEN, color: '#fff', borderRadius: 10, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 14 }}><span>Total Amount Due</span><span>{inr(invoice.total)}</span></div>
        <div style={{ textAlign: 'right', fontSize: 10, color: '#6b7280' }}>{rupeesInWords(invoice.total)}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 24 }}>
        <div style={box}>
          <div style={label}>BANK DETAILS FOR PAYMENT</div>
          {[['Account Name', 'IITS DELHI PVT LTD'], ['Account Number', '50200108828170'], ['IFSC Code', 'HDFC0000671'], ['Bank', 'HDFC Bank'], ['Branch', 'Simax Tower, Kannur Road, Nadakkavu, Kozhikode 673001']].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '4px 0', fontSize: 11 }}><span style={{ color: '#6b7280' }}>{k}</span><b style={{ textAlign: 'right' }}>{v}</b></div>
          ))}
        </div>
        <div style={box}>
          <div style={label}>NOTES</div>
          <p style={{ margin: '0 0 8px' }}>Charged for {users} active users, as verified with {org} for {invoice.lines.map((l) => l.label).join(' and ')}.</p>
          <p style={{ margin: '0 0 8px' }}>Rate: ₹{invoice.ratePerUser} per user per month. Duration: {invoice.months} month{invoice.months > 1 ? 's' : ''}.</p>
          <p style={{ margin: 0 }}>Please quote the invoice number when making payment.</p>
          {invoice.notes && <p style={{ margin: '8px 0 0' }}>{invoice.notes}</p>}
        </div>
      </div>
      <div style={{ borderTop: '1px solid #e5e7eb', marginTop: 24, paddingTop: 10, textAlign: 'center', fontSize: 9, color: '#9ca3af' }}>This is a computer-generated invoice. For queries, contact info@pypecrm.com</div>
    </div>
  )
}
