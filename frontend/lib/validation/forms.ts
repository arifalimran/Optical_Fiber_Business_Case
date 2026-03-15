// Form validation utilities for modern UX
// Import React at the top for hooks
import React from 'react';

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface FormData {
  projectName: string;
  clientName: string;
  location: string;
  description: string;
  clientContactPhone: string;
  clientContactEmail: string;
  selectedTemplate: string;
}

// Main form validation hook
export const useFormValidation = (formData: Partial<FormData>) => {
  const [errors, setErrors] = React.useState<ValidationError[]>([]);

  const validateField = (field: string, value: string) => {
    const newErrors = errors.filter(error => error.field !== field);
    
    let fieldError: string | undefined;
    
    switch (field) {
      case 'projectName':
        if (!value.trim()) {
          fieldError = 'Project name is required';
        } else if (value.length < 3) {
          fieldError = 'Project name must be at least 3 characters';
        } else if (value.length > 100) {
          fieldError = 'Project name must be less than 100 characters';
        }
        break;
      
      case 'clientName':
        if (value && value.length < 2) {
          fieldError = 'Client name must be at least 2 characters if provided';
        } else if (value && value.length > 100) {
          fieldError = 'Client name must be less than 100 characters';
        }
        break;
      
      case 'location':
        if (value && value.length < 2) {
          fieldError = 'Location must be at least 2 characters if provided';
        } else if (value && value.length > 200) {
          fieldError = 'Location must be less than 200 characters';
        }
        break;
      
      case 'description':
        if (value && value.length > 500) {
          fieldError = 'Description must be less than 500 characters';
        }
        break;

      case 'clientContactPhone':
        if (value && !/^\+?[0-9\s\-()]{7,20}$/.test(value)) {
          fieldError = 'Enter a valid contact phone number';
        }
        break;

      case 'clientContactEmail':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          fieldError = 'Enter a valid contact email address';
        }
        break;
      
      case 'selectedTemplate':
        if (!value) {
          fieldError = 'Please select a project template';
        }
        break;
    }
    
    if (fieldError) {
      newErrors.push({ field, message: fieldError });
    }
    
    setErrors(newErrors);
  };

  const validateForm = (data: Partial<FormData>): ValidationResult => {
    const tempErrors: ValidationError[] = [];

    // Validate each field
    Object.entries(data).forEach(([field, value]) => {
      if (typeof value === 'string') {
        validateField(field, value);
      }
    });

    const finalErrors = [...tempErrors];
    
    return {
      isValid: finalErrors.length === 0,
      errors: finalErrors
    };
  };

  const hasFieldError = (field: string): boolean => {
    return errors.some(error => error.field === field);
  };

  const getFieldError = (field: string): string | undefined => {
    return errors.find(error => error.field === field)?.message;
  };

  const isFormValid = React.useMemo(() => {
    const requiredFields = ['projectName', 'selectedTemplate'];
    const hasRequiredFields = requiredFields.every(field => 
      formData[field as keyof typeof formData]?.toString().trim()
    );
    const hasNoErrors = errors.length === 0;
    
    return hasRequiredFields && hasNoErrors;
  }, [formData, errors]);

  return {
    validateField,
    validateForm,
    hasFieldError,
    getFieldError,
    isFormValid,
    errors
  };
};

export const validateProjectForm = (data: {
  projectName: string;
  clientName: string;
  location: string;
  description?: string;
  clientContactPhone?: string;
  clientContactEmail?: string;
  selectedTemplate: string;
}): ValidationResult => {
  const errors: ValidationError[] = [];

  // Project name validation
  if (!data.projectName.trim()) {
    errors.push({ field: 'projectName', message: 'Project name is required' });
  } else if (data.projectName.length < 3) {
    errors.push({ field: 'projectName', message: 'Project name must be at least 3 characters' });
  } else if (data.projectName.length > 100) {
    errors.push({ field: 'projectName', message: 'Project name must be less than 100 characters' });
  }

  // Client name validation (optional but if provided, should be valid)
  if (data.clientName && data.clientName.length < 2) {
    errors.push({ field: 'clientName', message: 'Client name must be at least 2 characters if provided' });
  } else if (data.clientName && data.clientName.length > 100) {
    errors.push({ field: 'clientName', message: 'Client name must be less than 100 characters' });
  }

  // Location validation (optional but if provided, should be valid)
  if (data.location && data.location.length < 2) {
    errors.push({ field: 'location', message: 'Location must be at least 2 characters if provided' });
  } else if (data.location && data.location.length > 200) {
    errors.push({ field: 'location', message: 'Location must be less than 200 characters' });
  }

  // Template selection validation
  if (!data.selectedTemplate) {
    errors.push({ field: 'selectedTemplate', message: 'Please select a project template' });
  }

  if (data.description && data.description.length > 500) {
    errors.push({ field: 'description', message: 'Description must be less than 500 characters' });
  }

  if (data.clientContactPhone && !/^\+?[0-9\s\-()]{7,20}$/.test(data.clientContactPhone)) {
    errors.push({ field: 'clientContactPhone', message: 'Enter a valid contact phone number' });
  }

  if (data.clientContactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.clientContactEmail)) {
    errors.push({ field: 'clientContactEmail', message: 'Enter a valid contact email address' });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const getFieldError = (errors: ValidationError[], field: string): string | undefined => {
  return errors.find(error => error.field === field)?.message;
};

// Real-time validation with debouncing
export const useRealTimeValidation = (
  value: string,
  validator: (value: string) => string | undefined,
  debounceMs = 500
) => {
  const [error, setError] = React.useState<string | undefined>();
  const [isValidating, setIsValidating] = React.useState(false);

  React.useEffect(() => {
    if (!value) {
      setError(undefined);
      return;
    }

    setIsValidating(true);
    const timer = setTimeout(() => {
      const validationError = validator(value);
      setError(validationError);
      setIsValidating(false);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [value, validator, debounceMs]);

  return { error, isValidating };
};

// Success messages for better UX
export const getSuccessMessage = (action: string): string => {
  const messages = {
    'project-created': 'Project created successfully! Redirecting to project overview...',
    'project-updated': 'Project updated successfully!',
    'project-deleted': 'Project deleted successfully',
    'template-loaded': 'Template loaded successfully',
  };
  return messages[action as keyof typeof messages] || 'Operation completed successfully';
};