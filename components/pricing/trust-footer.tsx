"use client"

import { motion } from "framer-motion"
import { CreditCard, Shield, Lock } from "lucide-react"

export function TrustFooter() {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="border-t border-border py-12"
    >
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 mb-8">
          {/* Payment methods */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface border border-border">
              <span className="text-sm font-medium text-muted-foreground">Visa</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface border border-border">
              <span className="text-sm font-medium text-muted-foreground">Mastercard</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface border border-border">
              <span className="text-sm font-medium text-muted-foreground">Pix</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface border border-border">
              <span className="text-sm font-medium text-muted-foreground">Boleto</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            <span>Pagamentos seguros via Stripe</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span>Conformidade LGPD</span>
          </div>
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4" />
            <span>Dados criptografados</span>
          </div>
        </div>
      </div>
    </motion.footer>
  )
}
