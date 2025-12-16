'use client'

import { ScrollableArea } from './ScrollableArea'
import { FileText, Receipt, CreditCard, Check, AlertCircle, Plus, Mail } from 'lucide-react'

// Mock billing data structure
interface ChargeItem {
  id: string
  cptCode: string
  description: string
  units: number
  unitPrice: number
  total: number
}

interface PaymentTransaction {
  id: string
  date: Date
  method: string
  amount: number
  cardLast4?: string
}

interface PaymentMethod {
  id: string
  type: 'card' | 'bank'
  brand?: string // Visa, Mastercard, etc.
  last4: string
  expiryMonth?: number
  expiryYear?: number
  isDefault: boolean
}

export interface BillingData {
  charges: ChargeItem[]
  subtotal: number
  tax: number
  totalCharges: number
  amountPaid: number
  balanceDue: number
  status: 'draft' | 'pending' | 'partial' | 'paid' | 'no_charges'
  invoiceStatus: 'draft' | 'sent' | 'paid'
  transactions: PaymentTransaction[]
  paymentMethod?: PaymentMethod
  insurance?: {
    company: string
    memberId: string
    groupNumber?: string
  }
}

interface BillingTabProps {
  appointmentId: string
  billingData: BillingData
}

// Card brand icon placeholder
function CardBrandIcon({ brand }: { brand?: string }) {
  return (
    <div className="h-8 w-12 rounded border border-border bg-muted/30 flex items-center justify-center">
      <CreditCard className="h-5 w-5 text-muted-foreground" />
    </div>
  )
}

// Invoice status badge
function InvoiceStatusBadge({ status }: { status: BillingData['invoiceStatus'] }) {
  const config = {
    draft: { label: 'Draft', color: 'bg-slate-100 text-slate-600' },
    sent: { label: 'Sent', color: 'bg-blue-100 text-blue-700' },
    paid: { label: 'Paid', color: 'bg-green-100 text-green-700' },
  }

  const { label, color } = config[status]

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${color}`}>
      {label}
    </span>
  )
}

export function BillingTab({ appointmentId, billingData }: BillingTabProps) {
  const {
    charges,
    subtotal,
    tax,
    totalCharges,
    amountPaid,
    balanceDue,
    status,
    invoiceStatus,
    transactions,
    paymentMethod,
    insurance,
  } = billingData

  const isPaid = status === 'paid'
  const hasCharges = charges.length > 0

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h2 className="text-sm font-semibold">Billing</h2>
      </div>

      <ScrollableArea className="flex-1 px-4 py-4" deps={[appointmentId]}>
        <div className="flex flex-col gap-6 max-w-2xl">
          {/* Payment Method Section */}
          <section>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Payment Method on File
            </h3>
            {paymentMethod ? (
              <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                <div className="flex items-center gap-3">
                  <CardBrandIcon brand={paymentMethod.brand} />
                  <div>
                    <p className="text-sm font-medium">
                      {paymentMethod.brand || 'Card'} ending in {paymentMethod.last4}
                    </p>
                    {paymentMethod.expiryMonth && paymentMethod.expiryYear && (
                      <p className="text-xs text-muted-foreground">
                        Expires {String(paymentMethod.expiryMonth).padStart(2, '0')}/{String(paymentMethod.expiryYear).slice(-2)}
                      </p>
                    )}
                  </div>
                </div>
                <button className="text-xs text-primary hover:text-primary/80 font-medium">
                  Change
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 rounded-lg border border-dashed border-border bg-muted/20">
                <p className="text-sm text-muted-foreground">No payment method on file</p>
                <button className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80">
                  <Plus className="h-3.5 w-3.5" />
                  Add Card
                </button>
              </div>
            )}
          </section>

          {/* Today's Invoice Section */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Today's Invoice
              </h3>
              <InvoiceStatusBadge status={invoiceStatus} />
            </div>

            <div className="rounded-lg border border-border bg-card overflow-hidden">
              {hasCharges ? (
                <>
                  {/* Line items */}
                  <div className="divide-y divide-border">
                    {/* Header row */}
                    <div className="flex items-center justify-between px-3 py-2 bg-muted/30 text-xs font-medium text-muted-foreground">
                      <span>Service</span>
                      <span>Amount</span>
                    </div>
                    {/* Charge items */}
                    {charges.map((charge) => (
                      <div key={charge.id} className="flex items-start justify-between px-3 py-2.5">
                        <div className="flex-1 min-w-0 pr-4">
                          <p className="text-sm">{charge.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {charge.cptCode} {charge.units > 1 && `× ${charge.units}`}
                          </p>
                        </div>
                        <span className="text-sm font-medium tabular-nums">
                          ${charge.total.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Totals */}
                  <div className="border-t border-border bg-muted/20 px-3 py-2.5 space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="tabular-nums">${subtotal.toFixed(2)}</span>
                    </div>
                    {tax > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Tax</span>
                        <span className="tabular-nums">${tax.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm font-semibold pt-1 border-t border-border">
                      <span>Total</span>
                      <span className="tabular-nums">${totalCharges.toFixed(2)}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="px-3 py-6 text-center">
                  <p className="text-sm text-muted-foreground">No charges added yet</p>
                </div>
              )}
            </div>

            {/* Add line item button */}
            <button className="flex items-center gap-1.5 mt-2 text-xs font-medium text-primary hover:text-primary/80">
              <Plus className="h-3.5 w-3.5" />
              Add Line Item
            </button>
          </section>

          {/* Payment Status Section */}
          <section>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Payment Status
            </h3>

            <div className="rounded-lg border border-border bg-card p-3">
              {isPaid ? (
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <Check className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-green-700">Paid</p>
                    {transactions.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        ${transactions[0].amount.toFixed(2)} · {transactions[0].method}
                        {transactions[0].cardLast4 && ` ****${transactions[0].cardLast4}`}
                        {' · '}
                        {transactions[0].date.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}{' '}
                        {transactions[0].date.toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </p>
                    )}
                  </div>
                </div>
              ) : hasCharges ? (
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-amber-700">
                        {status === 'partial' ? 'Partially Paid' : 'Unpaid'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        ${balanceDue.toFixed(2)} due
                        {amountPaid > 0 && ` (${amountPaid.toFixed(2)} paid)`}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button className="flex-1 h-10 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                      Collect Payment
                    </button>
                    <button className="flex-1 h-10 text-sm font-medium rounded-md border border-border hover:bg-muted transition-colors">
                      Mark as Paid
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-2">
                  Add charges to collect payment
                </p>
              )}
            </div>
          </section>

          {/* Insurance Section */}
          <section>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Insurance
            </h3>

            {insurance ? (
              <div className="rounded-lg border border-border bg-card p-3">
                <p className="text-sm font-medium">{insurance.company}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Member ID: {insurance.memberId}
                  {insurance.groupNumber && ` · Group: ${insurance.groupNumber}`}
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 rounded-lg border border-dashed border-border bg-muted/20">
                <p className="text-sm text-muted-foreground">Self-pay (no insurance on file)</p>
                <button className="text-xs font-medium text-primary hover:text-primary/80">
                  Add Insurance
                </button>
              </div>
            )}
          </section>

          {/* Action Buttons */}
          <section className="flex gap-2 pt-2">
            <button className="flex-1 flex items-center justify-center gap-2 h-10 text-sm font-medium rounded-md border border-border hover:bg-muted transition-colors">
              <FileText className="h-4 w-4" />
              Generate Superbill
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 h-10 text-sm font-medium rounded-md border border-border hover:bg-muted transition-colors">
              <Mail className="h-4 w-4" />
              Email Receipt
            </button>
          </section>
        </div>
      </ScrollableArea>
    </div>
  )
}

// Helper to get billing status preview for tab bar
export function getBillingStatusPreview(billingData: BillingData): { text: string; color: string } {
  const { totalCharges, balanceDue, status } = billingData

  if (status === 'no_charges' || totalCharges === 0) {
    return { text: 'No charges', color: 'text-muted-foreground' }
  }

  if (status === 'paid') {
    return { text: `$${totalCharges.toFixed(0)} Paid`, color: 'text-green-600' }
  }

  if (status === 'partial') {
    return { text: `$${balanceDue.toFixed(0)} Due`, color: 'text-amber-600' }
  }

  return { text: `$${totalCharges.toFixed(0)} Due`, color: 'text-amber-600' }
}
