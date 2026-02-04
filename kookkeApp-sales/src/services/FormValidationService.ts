import { z } from 'zod';

// Customer Type Schemas
export const StockAuditFormSchema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  quantity: z.number().min(0, 'Quantity must be non-negative').max(10000, 'Quantity seems unusually high. Please verify.'),
  unitOfMeasure: z.enum(['units', 'cases', 'pallets'], {
    errorMap: () => ({ message: 'Please select a valid unit of measure' }),
  }),
  notes: z.string().optional(),
});

export const BrandPresenceFormSchema = z.object({
  brandName: z.string().min(1, 'Brand name is required'),
  displayQuality: z.number().min(1, 'Please rate the display quality').max(5, 'Rating must be between 1 and 5'),
  facingsCount: z.number().min(0, 'Facings count must be non-negative'),
  shelfPosition: z.enum(['top', 'middle', 'bottom', 'endcap'], {
    errorMap: () => ({ message: 'Please select a shelf position' }),
  }),
  competitorPresence: z.boolean().optional(),
});

export const FieldIntelligenceFormSchema = z.object({
  notes: z.string().min(1, 'Notes are required').max(1000, 'Notes must be less than 1000 characters'),
  voiceNote: z.string().optional(),
  ownerName: z.string().optional(),
  ownerContact: z.string().optional(),
  storeCondition: z.enum(['excellent', 'good', 'fair', 'poor'], {
    errorMap: () => ({ message: 'Please select a store condition' }),
  }).optional(),
});

export const DeliveryNoteFormSchema = z.object({
  deliveryDate: z.string().datetime().or(z.string()),
  orderId: z.string().min(1, 'Order ID is required'),
  itemsDelivered: z.number().min(1, 'Must deliver at least 1 item'),
  totalAmount: z.number().min(0, 'Amount must be non-negative'),
  customerSignature: z.string().optional(),
  notes: z.string().optional(),
});

// Unified Form Schema by Customer Type
export type RetailFormData = z.infer<typeof StockAuditFormSchema> &
  Partial<z.infer<typeof BrandPresenceFormSchema>> &
  Partial<z.infer<typeof FieldIntelligenceFormSchema>>;

export type WholesaleFormData = z.infer<typeof BrandPresenceFormSchema> &
  Partial<z.infer<typeof StockAuditFormSchema>>;

export type DistributorFormData = z.infer<typeof StockAuditFormSchema> &
  z.infer<typeof DeliveryNoteFormSchema>;

// Create schema based on customer type
export const getFormSchemaByCustomerType = (customerType: string) => {
  switch (customerType.toLowerCase()) {
    case 'retail':
      return z.object({
        ...StockAuditFormSchema.shape,
        ...BrandPresenceFormSchema.shape,
        ...FieldIntelligenceFormSchema.shape,
      });
    case 'wholesale':
      return z.object({
        ...BrandPresenceFormSchema.shape,
        ...StockAuditFormSchema.shape,
      });
    case 'distributor':
      return z.object({
        ...StockAuditFormSchema.shape,
        ...DeliveryNoteFormSchema.shape,
      });
    default:
      return z.object({
        notes: z.string().optional(),
      });
  }
};

// Real-time field validation
export class FormValidator {
  static validateField(fieldName: string, value: any, schema: z.ZodSchema): string | null {
    try {
      schema.parseAsync({ [fieldName]: value });
      return null;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return error.errors[0]?.message || 'Validation failed';
      }
      return 'Validation error';
    }
  }

  static validateStockQuantity(quantity: number): string | null {
    try {
      StockAuditFormSchema.shape.quantity.parse(quantity);
      return null;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return error.errors[0]?.message || null;
      }
      return null;
    }
  }

  static validateBrandDisplayQuality(rating: number): string | null {
    try {
      BrandPresenceFormSchema.shape.displayQuality.parse(rating);
      return null;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return error.errors[0]?.message || null;
      }
      return null;
    }
  }

  static validateFieldNotes(notes: string): string | null {
    try {
      FieldIntelligenceFormSchema.shape.notes.parse(notes);
      return null;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return error.errors[0]?.message || null;
      }
      return null;
    }
  }

  static validateForm(formData: any, schema: z.ZodSchema): { valid: boolean; errors: Record<string, string> } {
    try {
      schema.parse(formData);
      return { valid: true, errors: {} };
    } catch (error) {
      const errors: Record<string, string> = {};
      if (error instanceof z.ZodError) {
        error.errors.forEach((err) => {
          const path = err.path.join('.');
          errors[path] = err.message;
        });
      }
      return { valid: false, errors };
    }
  }

  static getFieldError(fieldName: string, formErrors: Record<string, string>): string | null {
    return formErrors[fieldName] || null;
  }
}

// Validation rules for specific fields
export const ValidationRules = {
  stockQuantity: {
    min: 0,
    max: 10000,
    warningThreshold: 100,
    warningMessage: (qty: number) => `Please verify this quantity; it seems unusually high: ${qty}`,
  },
  displayQuality: {
    min: 1,
    max: 5,
    labels: ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'],
  },
  notes: {
    maxLength: 1000,
    minLength: 1,
  },
  deliveryAmount: {
    min: 0,
    max: 999999,
  },
};
