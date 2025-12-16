'use client'

import { ScrollableArea } from './ScrollableArea'
import { FileText, CreditCard, Check, AlertCircle, Plus, Mail, XCircle, Zap } from 'lucide-react'
import type { BillingData, PaymentMethod, InvoiceLineItem, PaymentTransaction, InsuranceInfo } from '@/data/mock-billing'

// Re-export types for convenience
export type { BillingData, PaymentMethod, InvoiceLineItem, PaymentTransaction, InsuranceInfo }

// Re-export the getBillingStatusPreview function from mock-billing
export { getBillingStatusPreview } from '@/data/mock-billing'

interface BillingTabProps {
  appointmentId: string
  billingData: BillingData
}

// =============================================================================
// Helper Components
// =============================================================================

function CardBrandIcon({ brand }: { brand?: string }) {
  // Simple card brand color coding
  const getBrandColor = () => {
    switch (brand?.toLowerCase()) {
      case 'visa':
        return 'text-blue-600'
      case 'mastercard':
        return 'text-orange-500'
      case 'amex':
        return 'text-blue-800'
      case 'hsa':
        return 'text-green-600'
      default:
        return 'text-muted-foreground'
    }
  }

  return (
    <div className="h-8 w-12 rounded border border-border bg-muted/30 flex items-center justify-center">
      <CreditCard className={`h-5 w-5 ${getBrandColor()}`} />
    </div>
  )
}

function InvoiceStatusBadge({ status }: { status: BillingData['invoiceStatus'] }) {
  const config = {
    draft: { label: 'Draft', color: 'bg-slate-100 text-slate-600' },
    sent: { label: 'Sent', color: 'bg-blue-100 text-blue-700' },
    paid: { label: 'Paid', color: 'bg-green-100 text-green-700' },
    partial: { label: 'Partial', color: 'bg-amber-100 text-amber-700' },
    void: { label: 'Void', color: 'bg-slate-100 text-slate-600' },
  }

  const { label, color } = config[status]

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${color}`}>
      {label}
    </span>
  )
}

// =============================================================================
// BillingTab Component
// =============================================================================

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
    autoPay,
    insurance,
  } = billingData

  const isPaid = status === 'paid'
  const isFailed = status === 'failed'
  const isPartial = status === 'partial'
  const hasCharges = charges.length > 0

  // Get the latest transaction for display
  const latestTransaction = transactions.length > 0 ? transactions[0] : null

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
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">
                        {paymentMethod.brand || 'Card'} ending in {paymentMethod.last4}
                      </p>
                      {autoPay && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary">
                          <Zap className="h-2.5 w-2.5" />
                          Auto-pay
                        </span>
                      )}
                    </div>
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
                            {charge.cptCode} {charge.quantity > 1 && `× ${charge.quantity}`}
                          </p>
                        </div>
                        <span className="text-sm font-medium tabular-nums">
                          ${charge.lineTotal.toFixed(2)}
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
                    {latestTransaction && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        ${latestTransaction.amount.toFixed(2)} · {latestTransaction.cardBrand || latestTransaction.method}
                        {latestTransaction.cardLast4 && ` ****${latestTransaction.cardLast4}`}
                        {' · '}
                        {latestTransaction.timestamp.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}{' '}
                        {latestTransaction.timestamp.toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </p>
                    )}
                    {autoPay && (
                      <p className="text-xs text-primary mt-1 flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        Auto-charged on file
                      </p>
                    )}
                  </div>
                </div>
              ) : isFailed ? (
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                      <XCircle className="h-4 w-4 text-red-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-red-700">Payment Failed</p>
                      {latestTransaction && latestTransaction.failureReason && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {latestTransaction.failureReason}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-0.5">
                        ${balanceDue.toFixed(2)} due
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button className="flex-1 h-10 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                      Retry Payment
                    </button>
                    <button className="flex-1 h-10 text-sm font-medium rounded-md border border-border hover:bg-muted transition-colors">
                      Update Card
                    </button>
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
                        {isPartial ? 'Partially Paid' : 'Unpaid'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        ${balanceDue.toFixed(2)} due
                        {amountPaid > 0 && ` ($${amountPaid.toFixed(2)} paid)`}
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
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium">{insurance.company}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Member ID: {insurance.memberId}
                      {insurance.groupNumber && ` · Group: ${insurance.groupNumber}`}
                    </p>
                  </div>
                  <button className="text-xs font-medium text-primary hover:text-primary/80">
                    View Details
                  </button>
                </div>
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
            <button
              className={`flex-1 flex items-center justify-center gap-2 h-10 text-sm font-medium rounded-md border border-border transition-colors ${
                isPaid ? 'hover:bg-muted' : 'opacity-50 cursor-not-allowed'
              }`}
              disabled={!isPaid}
            >
              <Mail className="h-4 w-4" />
              Email Receipt
            </button>
          </section>
        </div>
      </ScrollableArea>
    </div>
  )
}
