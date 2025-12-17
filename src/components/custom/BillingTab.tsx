'use client'

import { ScrollableArea } from './ScrollableArea'
import { SegmentedToggle, type ViewScope } from './SegmentedToggle'
import { FileText, CreditCard, Check, AlertCircle, Plus, Mail, XCircle, Zap, ChevronRight, Package } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import type { BillingData, PaymentMethod, InvoiceLineItem, PaymentTransaction, InsuranceInfo, PatientBillingHistory, BillingHistoryInvoice, InvoiceStatus } from '@/data/mock-billing'

// Re-export types for convenience
export type { BillingData, PaymentMethod, InvoiceLineItem, PaymentTransaction, InsuranceInfo, PatientBillingHistory, BillingHistoryInvoice }

// Re-export the getBillingStatusPreview function from mock-billing
export { getBillingStatusPreview } from '@/data/mock-billing'

interface BillingTabProps {
  appointmentId: string
  billingData: BillingData
  billingHistory: PatientBillingHistory
  viewScope: ViewScope
  onViewScopeChange: (scope: ViewScope) => void
}

// =============================================================================
// Helper Components
// =============================================================================

function CardBrandIcon({ brand }: { brand?: string }) {
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

function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
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

function formatDateShort(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

// =============================================================================
// This Visit Content
// =============================================================================

function ThisVisitContent({ billingData, billingHistory }: { billingData: BillingData; billingHistory: PatientBillingHistory }) {
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

  const latestTransaction = transactions.length > 0 ? transactions[0] : null

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      {/* Today's Charges Section */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Today's Charges
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

      {/* Payment Collection Button */}
      {hasCharges && !isPaid && (
        <section>
          <button className="w-full h-12 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
            Collect ${balanceDue.toFixed(2)}
          </button>
        </section>
      )}

      {/* Payment Status Section */}
      {(isPaid || isFailed) && (
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
                    {latestTransaction?.failureReason && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {latestTransaction.failureReason}
                      </p>
                    )}
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
            ) : null}
          </div>
        </section>
      )}

      {/* Summary Card */}
      <section className="rounded-lg border border-border bg-muted/20 p-4 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Outstanding balance</span>
          <span className={`font-medium tabular-nums ${billingHistory.totalOutstanding > 0 ? 'text-amber-600' : ''}`}>
            ${billingHistory.totalOutstanding.toFixed(2)}
          </span>
        </div>
        {billingHistory.packageCredits > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Package className="h-3.5 w-3.5" />
              Package credits
            </span>
            <span className="font-medium text-primary">{billingHistory.packageCredits} remaining</span>
          </div>
        )}
      </section>

      {/* Links */}
      <section className="space-y-2">
        <button className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors">
          <span className="text-sm">Insurance info</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
        <button className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors">
          <span className="text-sm">Manage packages</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
      </section>
    </div>
  )
}

// =============================================================================
// All Billing Content
// =============================================================================

function AllBillingContent({ billingHistory, billingData }: { billingHistory: PatientBillingHistory; billingData: BillingData }) {
  const { invoices, totalOutstanding, totalPaid, packageCredits } = billingHistory
  const { insurance } = billingData

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      {/* Outstanding Balance Summary */}
      <section className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Outstanding Balance</p>
            <p className={`text-2xl font-semibold tabular-nums ${totalOutstanding > 0 ? 'text-amber-600' : 'text-foreground'}`}>
              ${totalOutstanding.toFixed(2)}
            </p>
          </div>
          {totalOutstanding > 0 && (
            <button className="h-10 px-4 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
              Collect All
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
          <div>
            <p className="text-xs text-muted-foreground">Total Paid</p>
            <p className="text-lg font-medium tabular-nums">${totalPaid.toFixed(2)}</p>
          </div>
          {packageCredits > 0 && (
            <div>
              <p className="text-xs text-muted-foreground">Package Credits</p>
              <p className="text-lg font-medium text-primary">{packageCredits} remaining</p>
            </div>
          )}
        </div>
      </section>

      {/* All Invoices */}
      <section>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          All Invoices
        </h3>

        {invoices.length > 0 ? (
          <div className="rounded-lg border border-border bg-card divide-y divide-border">
            {invoices.map((invoice) => (
              <button
                key={invoice.id}
                className="w-full flex items-center justify-between px-3 py-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{formatDateShort(invoice.date)}</span>
                    <InvoiceStatusBadge status={invoice.status} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{invoice.appointmentType}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-medium tabular-nums">${invoice.total.toFixed(2)}</p>
                    {invoice.amountDue > 0 && (
                      <p className="text-xs text-amber-600 tabular-nums">${invoice.amountDue.toFixed(2)} due</p>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-muted/20 p-6 text-center">
            <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-medium">No billing history</p>
            <p className="text-xs text-muted-foreground mt-1">First visit</p>
          </div>
        )}
      </section>

      {/* Links */}
      <section className="space-y-2">
        <button className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors">
          <span className="text-sm">Insurance info</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
        <button className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors">
          <span className="text-sm">Manage packages</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
      </section>
    </div>
  )
}

// =============================================================================
// BillingTab Component
// =============================================================================

export function BillingTab({ appointmentId, billingData, billingHistory, viewScope, onViewScopeChange }: BillingTabProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header with Toggle */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h2 className="text-sm font-semibold">Billing</h2>
        <SegmentedToggle value={viewScope} onChange={onViewScopeChange} />
      </div>

      <ScrollableArea className="flex-1 px-4 py-4" deps={[appointmentId, viewScope]}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={viewScope}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {viewScope === 'thisVisit' ? (
              <ThisVisitContent billingData={billingData} billingHistory={billingHistory} />
            ) : (
              <AllBillingContent billingHistory={billingHistory} billingData={billingData} />
            )}
          </motion.div>
        </AnimatePresence>
      </ScrollableArea>
    </div>
  )
}
