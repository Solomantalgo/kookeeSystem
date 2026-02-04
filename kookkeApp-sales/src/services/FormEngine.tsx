import React, { useMemo } from 'react';
import { Controller, useForm, SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

export type CustomerType = 'wholesale' | 'retail' | 'key_account' | 'endpoint';

export type FormFieldType = 'stock_audit' | 'brand_presence' | 'field_intelligence' | 'text_note' | 'voice_note';

export interface FormField {
  id: string;
  name: string;
  label: string;
  type: FormFieldType;
  required: boolean;
  customizable: boolean;
  validationRules?: {
    min?: number;
    max?: number;
    pattern?: string;
    errorMessage?: string;
  };
  options?: { value: string; label: string }[];
  placeholder?: string;
}

export interface FormTemplate {
  customerId: string;
  customerType: CustomerType;
  fields: FormField[];
  lastVisitData?: Record<string, any>;
}

/**
 * Form Schema Validator using Zod
 * Dynamically creates validation schemas based on form template
 */
const buildDynamicSchema = (fields: FormField[]): z.ZodSchema => {
  const schemaObject: Record<string, z.ZodTypeAny> = {};

  fields.forEach((field) => {
    let fieldSchema: z.ZodTypeAny = z.any();

    switch (field.type) {
      case 'stock_audit':
        fieldSchema = z.number().int().nonnegative('Stock count cannot be negative');
        if (field.validationRules?.max) {
          fieldSchema = fieldSchema.max(field.validationRules.max, `Stock count cannot exceed ${field.validationRules.max}`);
        }
        if (field.validationRules?.min) {
          fieldSchema = fieldSchema.min(field.validationRules.min);
        }
        break;

      case 'brand_presence':
        fieldSchema = z.number().int().min(1).max(5, 'Rating must be between 1 and 5');
        break;

      case 'field_intelligence':
      case 'text_note':
        fieldSchema = z.string().min(0).max(500, 'Notes cannot exceed 500 characters');
        break;

      case 'voice_note':
        fieldSchema = z.string().url('Invalid voice note URI').optional();
        break;
    }

    if (!field.required) {
      fieldSchema = fieldSchema.optional();
    }

    schemaObject[field.id] = fieldSchema;
  });

  return z.object(schemaObject);
};

/**
 * FormEngine Component
 * Dynamically renders forms based on customer type and field definitions
 */
interface FormEngineProps {
  formTemplate: FormTemplate;
  onSubmit: (data: Record<string, any>) => void;
  onFieldChange?: (fieldId: string, value: any) => void;
  isSubmitting?: boolean;
  initialData?: Record<string, any>;
}

export const FormEngine: React.FC<FormEngineProps> = ({
  formTemplate,
  onSubmit,
  onFieldChange,
  isSubmitting = false,
  initialData = {},
}) => {
  const validationSchema = useMemo(() => buildDynamicSchema(formTemplate.fields), [formTemplate.fields]);

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty, dirtyFields },
    watch,
    setValue,
  } = useForm({
    resolver: zodResolver(validationSchema),
    mode: 'onBlur',
    defaultValues: initialData,
  });

  const formValues = watch();

  const handleFieldChange = (fieldId: string, value: any) => {
    setValue(fieldId, value, { shouldDirty: true });
    onFieldChange?.(fieldId, value);
  };

  const processSubmit: SubmitHandler<Record<string, any>> = (data) => {
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(processSubmit)} className="visit-form">
      <div className="form-fields">
        {formTemplate.fields.map((field) => (
          <div key={field.id} className="form-field-wrapper">
            <label htmlFor={field.id} className="form-label">
              {field.label}
              {field.required && <span className="required-indicator">*</span>}
            </label>

            {field.type === 'stock_audit' && (
              <Controller
                name={field.id}
                control={control}
                render={({ field: fieldProps }) => (
                  <div className="stock-audit-input">
                    <input
                      {...fieldProps}
                      type="number"
                      placeholder={field.placeholder || 'Enter quantity'}
                      className="form-input"
                      min={field.validationRules?.min || 0}
                      max={field.validationRules?.max}
                      onChange={(e) => {
                        const value = e.target.value ? parseInt(e.target.value, 10) : 0;
                        handleFieldChange(field.id, value);
                        fieldProps.onChange(value);
                      }}
                    />
                    {formTemplate.lastVisitData?.[field.id] !== undefined && (
                      <span className="last-visit-hint">
                        Last visit: {formTemplate.lastVisitData[field.id]} (grayed out as reference)
                      </span>
                    )}
                  </div>
                )}
              />
            )}

            {field.type === 'brand_presence' && (
              <Controller
                name={field.id}
                control={control}
                render={({ field: fieldProps }) => (
                  <div className="brand-presence-input">
                    <div className="star-rating">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          className={`star ${formValues[field.id] >= star ? 'filled' : ''}`}
                          onClick={() => {
                            handleFieldChange(field.id, star);
                            fieldProps.onChange(star);
                          }}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                    {field.options && (
                      <select
                        {...fieldProps}
                        className="form-input"
                        onChange={(e) => {
                          handleFieldChange(field.id, e.target.value);
                          fieldProps.onChange(e.target.value);
                        }}
                      >
                        <option value="">Select option</option>
                        {field.options.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}
              />
            )}

            {(field.type === 'field_intelligence' || field.type === 'text_note') && (
              <Controller
                name={field.id}
                control={control}
                render={({ field: fieldProps }) => (
                  <textarea
                    {...fieldProps}
                    placeholder={field.placeholder || 'Enter notes...'}
                    className="form-input form-textarea"
                    maxLength={500}
                    onChange={(e) => {
                      handleFieldChange(field.id, e.target.value);
                      fieldProps.onChange(e.target.value);
                    }}
                  />
                )}
              />
            )}

            {field.type === 'voice_note' && (
              <div className="voice-note-input">
                <button type="button" className="voice-note-button">
                  🎤 Record Voice Note
                </button>
                {formValues[field.id] && <span className="voice-note-indicator">✓ Voice note recorded</span>}
              </div>
            )}

            {errors[field.id] && (
              <span className="error-message">
                {errors[field.id]?.message as string}
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="form-actions">
        <button type="submit" disabled={isSubmitting || !isDirty} className="btn btn-primary">
          {isSubmitting ? 'Saving...' : 'Save & Continue'}
        </button>
        <div className="dirty-fields-indicator">
          {Object.keys(dirtyFields).length > 0 && (
            <span className="unsaved-indicator">⚠ Unsaved changes</span>
          )}
        </div>
      </div>

      <style jsx>{`
        .visit-form {
          padding: 16px;
        }

        .form-fields {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-field-wrapper {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-label {
          font-weight: 600;
          font-size: 14px;
          color: #333;
        }

        .required-indicator {
          color: #e74c3c;
          margin-left: 4px;
        }

        .form-input,
        .form-textarea {
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          font-family: inherit;
        }

        .form-input:focus,
        .form-textarea:focus {
          outline: none;
          border-color: #2196f3;
          box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.1);
        }

        .form-textarea {
          resize: vertical;
          min-height: 80px;
        }

        .stock-audit-input {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .last-visit-hint {
          font-size: 12px;
          color: #999;
          font-style: italic;
        }

        .star-rating {
          display: flex;
          gap: 8px;
        }

        .star {
          background: none;
          border: none;
          font-size: 28px;
          cursor: pointer;
          color: #ddd;
          transition: color 0.2s;
        }

        .star.filled {
          color: #ffc107;
        }

        .brand-presence-input {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .voice-note-button {
          padding: 12px 16px;
          background-color: #2196f3;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 600;
        }

        .voice-note-indicator {
          font-size: 12px;
          color: #4caf50;
        }

        .error-message {
          color: #e74c3c;
          font-size: 12px;
          margin-top: 4px;
        }

        .form-actions {
          margin-top: 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .btn {
          padding: 12px 24px;
          border: none;
          border-radius: 4px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .btn-primary {
          background-color: #2196f3;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background-color: #1976d2;
        }

        .btn-primary:disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }

        .unsaved-indicator {
          color: #ff9800;
          font-size: 12px;
        }
      `}</style>
    </form>
  );
};

/**
 * Form Template Generator based on Customer Type
 */
export const generateFormTemplate = (customerType: CustomerType, customerId: string, lastVisitData?: Record<string, any>): FormTemplate => {
  const baseFields: Record<CustomerType, FormField[]> = {
    wholesale: [
      {
        id: 'wholesale_stock_level',
        name: 'Wholesale Stock Level',
        label: 'Current Stock Quantity',
        type: 'stock_audit',
        required: true,
        customizable: true,
        validationRules: { min: 0, max: 10000, errorMessage: 'Stock must be between 0 and 10,000' },
        placeholder: 'e.g., 500',
      },
      {
        id: 'display_quality',
        name: 'Display Quality',
        label: 'Product Display Quality',
        type: 'brand_presence',
        required: true,
        customizable: false,
        options: [
          { value: 'excellent', label: 'Excellent' },
          { value: 'good', label: 'Good' },
          { value: 'fair', label: 'Fair' },
          { value: 'poor', label: 'Poor' },
        ],
      },
      {
        id: 'field_notes',
        name: 'Field Notes',
        label: 'Additional Observations',
        type: 'field_intelligence',
        required: false,
        customizable: true,
        placeholder: 'Enter any relevant observations...',
      },
    ],
    retail: [
      {
        id: 'retail_stock',
        name: 'Retail Stock',
        label: 'Units in Stock',
        type: 'stock_audit',
        required: true,
        customizable: true,
        validationRules: { min: 0, max: 1000 },
        placeholder: 'e.g., 50',
      },
      {
        id: 'shelf_visibility',
        name: 'Shelf Visibility',
        label: 'Shelf Space & Visibility',
        type: 'brand_presence',
        required: true,
        customizable: false,
      },
      {
        id: 'retail_notes',
        name: 'Retail Notes',
        label: 'Retail Observations',
        type: 'text_note',
        required: false,
        customizable: true,
      },
    ],
    key_account: [
      {
        id: 'key_stock',
        name: 'Key Account Stock',
        label: 'Total Stock Units',
        type: 'stock_audit',
        required: true,
        customizable: true,
        validationRules: { min: 0, max: 50000 },
        placeholder: 'e.g., 2000',
      },
      {
        id: 'key_display',
        name: 'Key Display',
        label: 'Premium Display Rating',
        type: 'brand_presence',
        required: true,
        customizable: false,
      },
      {
        id: 'key_intelligence',
        name: 'Key Intelligence',
        label: 'Strategic Notes',
        type: 'field_intelligence',
        required: false,
        customizable: true,
        placeholder: 'Market insights, customer feedback...',
      },
      {
        id: 'key_voice',
        name: 'Voice Note',
        label: 'Voice Note',
        type: 'voice_note',
        required: false,
        customizable: true,
      },
    ],
    endpoint: [
      {
        id: 'endpoint_stock',
        name: 'Endpoint Stock',
        label: 'Stock Count',
        type: 'stock_audit',
        required: true,
        customizable: true,
        validationRules: { min: 0, max: 5000 },
      },
      {
        id: 'endpoint_notes',
        name: 'Endpoint Notes',
        label: 'Notes',
        type: 'text_note',
        required: false,
        customizable: true,
      },
    ],
  };

  return {
    customerId,
    customerType,
    fields: baseFields[customerType],
    lastVisitData,
  };
};
