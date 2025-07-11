// PDF generation service for invoices
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { Invoice } from './invoice-service'
import { format } from 'date-fns'

export interface CompanyInfo {
  name: string
  address: string
  phone: string
  email: string
  gstin: string
  logoUrl?: string
}

export class PDFGenerator {
  private companyInfo: CompanyInfo

  constructor(companyInfo: CompanyInfo) {
    this.companyInfo = companyInfo
  }

  async generateInvoicePDF(invoice: Invoice): Promise<Blob> {
    // Create a temporary div for the invoice HTML
    const invoiceElement = document.createElement('div')
    invoiceElement.innerHTML = this.generateInvoiceHTML(invoice)
    invoiceElement.style.position = 'absolute'
    invoiceElement.style.left = '-9999px'
    invoiceElement.style.width = '210mm'
    invoiceElement.style.padding = '20px'
    invoiceElement.style.backgroundColor = 'white'
    invoiceElement.style.fontFamily = 'Arial, sans-serif'
    
    document.body.appendChild(invoiceElement)

    try {
      // Convert to canvas
      const canvas = await html2canvas(invoiceElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      })

      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4')
      const imgData = canvas.toDataURL('image/png')
      
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      
      return pdf.output('blob')
    } finally {
      document.body.removeChild(invoiceElement)
    }
  }

  private generateInvoiceHTML(invoice: Invoice): string {
    const subtotal = invoice.items.reduce((sum, item) => sum + item.amount, 0)
    const totalTax = invoice.items.reduce((sum, item) => sum + item.taxAmount, 0)
    
    return `
      <div style="max-width: 800px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 30px; border-bottom: 2px solid #3b82f6; padding-bottom: 20px;">
          <div>
            ${this.companyInfo.logoUrl ? `<img src="${this.companyInfo.logoUrl}" alt="Logo" style="max-height: 60px; margin-bottom: 10px;">` : ''}
            <h1 style="color: #3b82f6; margin: 0; font-size: 24px;">${this.companyInfo.name}</h1>
            <p style="margin: 5px 0; color: #666;">${this.companyInfo.address}</p>
            <p style="margin: 5px 0; color: #666;">Phone: ${this.companyInfo.phone}</p>
            <p style="margin: 5px 0; color: #666;">Email: ${this.companyInfo.email}</p>
            <p style="margin: 5px 0; color: #666;">GSTIN: ${this.companyInfo.gstin}</p>
          </div>
          <div style="text-align: right;">
            <h2 style="color: #3b82f6; margin: 0; font-size: 28px;">INVOICE</h2>
            <p style="margin: 10px 0; font-size: 16px;"><strong>${invoice.id}</strong></p>
            <p style="margin: 5px 0; color: #666;">Date: ${format(new Date(invoice.date), 'dd/MM/yyyy')}</p>
            <p style="margin: 5px 0; color: #666;">Due Date: ${format(new Date(invoice.dueDate), 'dd/MM/yyyy')}</p>
          </div>
        </div>

        <!-- Bill To -->
        <div style="margin-bottom: 30px;">
          <h3 style="color: #374151; margin-bottom: 10px;">Bill To:</h3>
          <div style="background: #f9fafb; padding: 15px; border-radius: 8px;">
            <p style="margin: 5px 0; font-weight: bold; font-size: 16px;">${invoice.customerName}</p>
            ${invoice.customerAddress ? `<p style="margin: 5px 0; color: #666;">${invoice.customerAddress}</p>` : ''}
            ${invoice.customerPhone ? `<p style="margin: 5px 0; color: #666;">Phone: ${invoice.customerPhone}</p>` : ''}
            ${invoice.customerEmail ? `<p style="margin: 5px 0; color: #666;">Email: ${invoice.customerEmail}</p>` : ''}
            ${invoice.customerGSTIN ? `<p style="margin: 5px 0; color: #666;">GSTIN: ${invoice.customerGSTIN}</p>` : ''}
          </div>
        </div>

        <!-- Items Table -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
          <thead>
            <tr style="background: #3b82f6; color: white;">
              <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Item</th>
              <th style="padding: 12px; text-align: center; border: 1px solid #ddd;">Qty</th>
              <th style="padding: 12px; text-align: right; border: 1px solid #ddd;">Rate</th>
              <th style="padding: 12px; text-align: right; border: 1px solid #ddd;">Amount</th>
              <th style="padding: 12px; text-align: right; border: 1px solid #ddd;">Tax</th>
              <th style="padding: 12px; text-align: right; border: 1px solid #ddd;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.items.map((item, index) => `
              <tr style="background: ${index % 2 === 0 ? '#f9fafb' : 'white'};">
                <td style="padding: 12px; border: 1px solid #ddd;">
                  <strong>${item.productName}</strong>
                  ${item.description ? `<br><small style="color: #666;">${item.description}</small>` : ''}
                </td>
                <td style="padding: 12px; text-align: center; border: 1px solid #ddd;">${item.quantity}</td>
                <td style="padding: 12px; text-align: right; border: 1px solid #ddd;">₹${item.rate.toFixed(2)}</td>
                <td style="padding: 12px; text-align: right; border: 1px solid #ddd;">₹${item.amount.toFixed(2)}</td>
                <td style="padding: 12px; text-align: right; border: 1px solid #ddd;">₹${item.taxAmount.toFixed(2)}</td>
                <td style="padding: 12px; text-align: right; border: 1px solid #ddd; font-weight: bold;">₹${(item.amount + item.taxAmount).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <!-- Totals -->
        <div style="display: flex; justify-content: flex-end; margin-bottom: 30px;">
          <div style="width: 300px;">
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
              <span>Subtotal:</span>
              <span>₹${subtotal.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
              <span>Tax:</span>
              <span>₹${totalTax.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 12px 0; font-weight: bold; font-size: 18px; background: #f3f4f6; margin-top: 10px; padding-left: 15px; padding-right: 15px; border-radius: 8px;">
              <span>Total:</span>
              <span style="color: #3b82f6;">₹${invoice.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <!-- Notes -->
        ${invoice.notes ? `
          <div style="margin-bottom: 30px;">
            <h3 style="color: #374151; margin-bottom: 10px;">Notes:</h3>
            <p style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 0; color: #666;">${invoice.notes}</p>
          </div>
        ` : ''}

        <!-- Payment Terms -->
        ${invoice.paymentTerms ? `
          <div style="margin-bottom: 30px;">
            <h3 style="color: #374151; margin-bottom: 10px;">Payment Terms:</h3>
            <p style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 0; color: #666;">${invoice.paymentTerms}</p>
          </div>
        ` : ''}

        <!-- Footer -->
        <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #666; font-size: 12px;">
          <p>Thank you for your business!</p>
          <p>This is a computer-generated invoice and does not require a signature.</p>
        </div>
      </div>
    `
  }

  async downloadInvoicePDF(invoice: Invoice): Promise<void> {
    const blob = await this.generateInvoicePDF(invoice)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${invoice.id}.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  async printInvoice(invoice: Invoice): Promise<void> {
    const blob = await this.generateInvoicePDF(invoice)
    const url = URL.createObjectURL(blob)
    const printWindow = window.open(url)
    
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print()
        printWindow.close()
        URL.revokeObjectURL(url)
      }
    }
  }

  generateWhatsAppMessage(invoice: Invoice): string {
    const message = `Hi ${invoice.customerName},

Your invoice ${invoice.id} for ₹${invoice.total.toFixed(2)} is ready.

Due Date: ${format(new Date(invoice.dueDate), 'dd/MM/yyyy')}

Please find the invoice details and make the payment by the due date.

Thank you for your business!

Best regards,
${this.companyInfo.name}`

    return encodeURIComponent(message)
  }

  generateEmailMessage(invoice: Invoice): { subject: string; body: string } {
    const subject = `Invoice ${invoice.id} - ${this.companyInfo.name}`
    const body = `Dear ${invoice.customerName},

Please find attached your invoice ${invoice.id} for ₹${invoice.total.toFixed(2)}.

Invoice Details:
- Invoice Number: ${invoice.id}
- Date: ${format(new Date(invoice.date), 'dd/MM/yyyy')}
- Due Date: ${format(new Date(invoice.dueDate), 'dd/MM/yyyy')}
- Amount: ₹${invoice.total.toFixed(2)}

Please make the payment by the due date to avoid any late fees.

If you have any questions regarding this invoice, please don't hesitate to contact us.

Thank you for your business!

Best regards,
${this.companyInfo.name}
${this.companyInfo.phone}
${this.companyInfo.email}`

    return { subject, body }
  }
}