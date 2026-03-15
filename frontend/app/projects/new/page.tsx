'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/useAuth';
import { toast } from 'sonner';
import { validateProjectForm, ValidationError, useFormValidation } from '@/lib/validation/forms';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { InputEnhanced } from '@/components/ui/input-enhanced';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { 
  ArrowLeft,
  Cable,
  Radio,
  Building2,
  Loader2,
  CheckCircle,
  Info,
  Clock,
  Users,
  Zap,
  Sparkles,
  AlertTriangle,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';

interface Template {
  code: string;
  name: string;
  description: string;
  version: string;
  isActive: boolean;
  parameterCount: number;
  estimatedTime: string;
}

const TEMPLATE_ICONS: Record<string, React.ComponentType<any>> = {
  'OPTICAL_FIBER': Cable,
  '5G_TOWER': Radio,
  default: Building2
};

const TEMPLATE_COLORS: Record<string, string> = {
  'OPTICAL_FIBER': 'from-blue-500/10 to-cyan-500/10 border-blue-500/20',
  '5G_TOWER': 'from-green-500/10 to-emerald-500/10 border-green-500/20',
  default: 'from-gray-500/10 to-slate-500/10 border-gray-500/20'
};

export default function NewProjectPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [projectName, setProjectName] = useState('');
  const [clientName, setClientName] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [clientCompanyAddress, setClientCompanyAddress] = useState('');
  const [clientContactPerson, setClientContactPerson] = useState('');
  const [clientContactPhone, setClientContactPhone] = useState('');
  const [clientContactEmail, setClientContactEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  
  // Real-time validation
  const {
    validateField,
    getFieldError,
    hasFieldError,
    validateForm,
    isFormValid
  } = useFormValidation({
    projectName,
    clientName,
    location,
    description,
    clientContactPhone,
    clientContactEmail,
    selectedTemplate
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/templates');
      if (!response.ok) throw new Error('Failed to fetch templates');
      const data = await response.json();
      setTemplates(data);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowValidation(true);
    
    // Validate form
    const formData = {
      projectName: projectName.trim(),
      clientName: clientName.trim(),
      location: location.trim(),
      description: description.trim(),
      clientCompanyAddress: clientCompanyAddress.trim(),
      clientContactPerson: clientContactPerson.trim(),
      clientContactPhone: clientContactPhone.trim(),
      clientContactEmail: clientContactEmail.trim(),
      selectedTemplate
    };
    
    const validation = validateForm(formData);
    
    if (!validation.isValid) {
      toast.error('Please fix the validation errors before submitting');
      return;
    }

    setCreating(true);
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateCode: selectedTemplate,
          projectName: formData.projectName,
          clientName: formData.clientName || null,
          location: formData.location || null,
          description: formData.description || null,
          clientCompanyAddress: formData.clientCompanyAddress || null,
          clientContactPerson: formData.clientContactPerson || null,
          clientContactPhone: formData.clientContactPhone || null,
          clientContactEmail: formData.clientContactEmail || null
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create project');
      }

      const project = await response.json();
      toast.success('Project created successfully! 🎉');
      router.push(`/projects/${project.id}`);
    } catch (error: any) {
      console.error('Error creating project:', error);
      toast.error(error.message || 'Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  const getTemplateIcon = (templateCode: string) => {
    const IconComponent = TEMPLATE_ICONS[templateCode] || TEMPLATE_ICONS.default;
    return IconComponent;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="space-y-8">
          {/* Header Skeleton */}
          <div className="space-y-3">
            <div className="h-6 bg-gradient-to-r from-muted to-muted/60 rounded-lg w-32 animate-pulse"></div>
            <div className="h-8 bg-gradient-to-r from-muted to-muted/60 rounded-lg w-80 animate-pulse"></div>
            <div className="h-4 bg-gradient-to-r from-muted to-muted/60 rounded-lg w-96 animate-pulse"></div>
          </div>
          
          {/* Template Selection Skeleton */}
          <div className="glass-card p-6 space-y-4">
            <div className="h-6 bg-gradient-to-r from-muted to-muted/60 rounded-lg w-48 animate-pulse"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="border border-border rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-gradient-to-r from-muted to-muted/60 rounded-lg animate-pulse"></div>
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-gradient-to-r from-muted to-muted/60 rounded w-24 animate-pulse"></div>
                      <div className="h-3 bg-gradient-to-r from-muted to-muted/60 rounded w-16 animate-pulse"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gradient-to-r from-muted to-muted/60 rounded animate-pulse"></div>
                    <div className="h-3 bg-gradient-to-r from-muted to-muted/60 rounded w-3/4 animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Form Skeleton */}
          <div className="glass-card p-6 space-y-4">
            <div className="h-6 bg-gradient-to-r from-muted to-muted/60 rounded-lg w-40 animate-pulse"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="h-4 bg-gradient-to-r from-muted to-muted/60 rounded w-24 animate-pulse"></div>
                <div className="h-10 bg-gradient-to-r from-muted to-muted/60 rounded-lg animate-pulse"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gradient-to-r from-muted to-muted/60 rounded w-20 animate-pulse"></div>
                <div className="h-10 bg-gradient-to-r from-muted to-muted/60 rounded-lg animate-pulse"></div>
              </div>
            </div>
            <div className="h-24 bg-gradient-to-r from-muted to-muted/60 rounded-lg animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="mb-8 space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/projects">
            <Button variant="outline" size="sm" className="glass-button">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Projects
            </Button>
          </Link>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/20">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                Create New Project
              </h1>
              <p className="text-muted-foreground text-lg">
                Choose a template and provide project details to get started
              </p>
            </div>
          </div>
          
          {/* Progress indicator */}
          <div className="flex items-center gap-2">
            <div className={cn(
              "flex items-center gap-2 px-3 py-1 rounded-full border text-sm",
              selectedTemplate 
                ? "bg-primary/10 border-primary/30 text-primary" 
                : "bg-muted border-border text-muted-foreground"
            )}>
              <div className={cn(
                "w-2 h-2 rounded-full",
                selectedTemplate ? "bg-primary" : "bg-muted-foreground"
              )} />
              Template Selection
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <div className={cn(
              "flex items-center gap-2 px-3 py-1 rounded-full border text-sm",
              projectName.trim() 
                ? "bg-primary/10 border-primary/30 text-primary" 
                : "bg-muted border-border text-muted-foreground"
            )}>
              <div className={cn(
                "w-2 h-2 rounded-full",
                projectName.trim() ? "bg-primary" : "bg-muted-foreground"
              )} />
              Project Details
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Template Selection */}
        <Card className="glass-card border-none shadow-xl">
          <CardHeader className="space-y-4">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              Select Template
              {selectedTemplate && (
                <Badge variant="outline" className="ml-auto bg-primary/10 border-primary/30 text-primary">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Selected
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="text-base">
              Choose the type of project you want to analyze. Each template includes pre-configured parameters and calculations.
            </CardDescription>
            
            {hasFieldError('selectedTemplate') && showValidation && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
                <span className="text-sm text-destructive">
                  {getFieldError('selectedTemplate')}
                </span>
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {templates.map((template) => {
                const IconComponent = getTemplateIcon(template.code);
                const isSelected = selectedTemplate === template.code;
                
                return (
                  <div
                    key={template.code}
                    onClick={() => setSelectedTemplate(template.code)}
                    className={cn(
                      "group relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-300",
                      "hover:scale-[1.02] hover:shadow-lg",
                      isSelected 
                        ? "border-primary bg-gradient-to-br from-primary/10 via-primary/5 to-transparent shadow-lg shadow-primary/20" 
                        : "border-border bg-gradient-to-br from-background to-background/80 hover:border-primary/50 hover:bg-gradient-to-br hover:from-primary/5 hover:to-transparent"
                    )}
                  >
                    {isSelected && (
                      <div className="absolute top-4 right-4">
                        <div className="p-1 rounded-full bg-primary text-primary-foreground">
                          <CheckCircle className="h-4 w-4" />
                        </div>
                      </div>
                    )}
                    
                    <div className="space-y-4">
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          "p-3 rounded-xl transition-colors duration-200",
                          isSelected 
                            ? "bg-primary text-primary-foreground shadow-lg" 
                            : "bg-gradient-to-br from-muted to-muted/60 group-hover:from-primary/10 group-hover:to-primary/20"
                        )}>
                          <IconComponent className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg">{template.name}</h3>
                            <Badge variant="secondary" className="text-xs">
                              v{template.version}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {template.description}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-2 border-t border-border/50">
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            <span>{template.parameterCount} params</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>~{template.estimatedTime}</span>
                          </div>
                        </div>
                        {isSelected && (
                          <div className="text-xs text-primary font-medium">
                            Ready to configure
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {templates.length === 0 && (
              <div className="text-center py-12">
                <Building2 className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground">No templates available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Project Details */}
        <Card className="glass-card border-none shadow-xl">
          <CardHeader className="space-y-4">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
                <Info className="h-5 w-5 text-primary" />
              </div>
              Project Details
              {projectName.trim() && (
                <Badge variant="outline" className="ml-auto bg-primary/10 border-primary/30 text-primary">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Ready
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="text-base">
              Provide basic information about your project to help organize and identify it.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="projectName" className="text-base font-medium flex items-center gap-2">
                  Project Name 
                  <span className="text-destructive">*</span>
                  {hasFieldError('projectName') && showValidation && (
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                  )}
                </Label>
                <InputEnhanced
                  id="projectName"
                  placeholder="e.g., Dhaka Metro Fiber Network"
                  value={projectName}
                  onChange={(e) => {
                    setProjectName(e.target.value);
                    if (showValidation) validateField('projectName', e.target.value.trim());
                  }}
                  error={hasFieldError('projectName') && showValidation ? getFieldError('projectName') : ''}
                  hint="Enter a descriptive name for your project"
                  required
                  className="h-12"
                />
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="clientName" className="text-base font-medium">Client Name</Label>
                <InputEnhanced
                  id="clientName"
                  placeholder="e.g., Dhaka Transport Authority"
                  value={clientName}
                  onChange={(e) => {
                    setClientName(e.target.value);
                    if (showValidation) validateField('clientName', e.target.value.trim());
                  }}
                  hint="Optional: Client or organization name"
                  className="h-12"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="location" className="text-base font-medium">Location</Label>
              <InputEnhanced
                id="location"
                placeholder="e.g., Dhaka, Bangladesh"
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value);
                  if (showValidation) validateField('location', e.target.value.trim());
                }}
                hint="Optional: Project location or region"
                className="h-12"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="description" className="text-base font-medium">Description</Label>
              <div className="relative">
                <textarea
                  id="description"
                  className={cn(
                    "w-full min-h-[120px] px-4 py-3 border rounded-xl bg-background/50 backdrop-blur-sm",
                    "text-sm placeholder:text-muted-foreground",
                    "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:border-transparent",
                    "transition-all duration-200 resize-none",
                    hasFieldError('description') && showValidation
                      ? "border-destructive focus:ring-destructive"
                      : "border-border hover:border-primary/50"
                  )}
                  placeholder="Brief description of the project scope and objectives..."
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    if (showValidation) validateField('description', e.target.value.trim());
                  }}
                />
                <div className="absolute bottom-3 right-3 text-xs text-muted-foreground">
                  {description.length}/500
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Optional: Describe the project goals, scope, and any special requirements
              </p>
              {hasFieldError('description') && showValidation && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  {getFieldError('description')}
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-border/50">
              <h3 className="text-base font-semibold">Client Contact Details</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Capture these now so executives can review and edit them later in Assumptions.
              </p>
            </div>

            <div className="space-y-3">
              <Label htmlFor="clientCompanyAddress" className="text-base font-medium">Client Company Address</Label>
              <InputEnhanced
                id="clientCompanyAddress"
                placeholder="e.g., House 25, Road 12, Banani, Dhaka"
                value={clientCompanyAddress}
                onChange={(e) => setClientCompanyAddress(e.target.value)}
                hint="Optional: Registered or operating address"
                className="h-12"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="clientContactPerson" className="text-base font-medium">Contact Person</Label>
                <InputEnhanced
                  id="clientContactPerson"
                  placeholder="e.g., Md. Rahman"
                  value={clientContactPerson}
                  onChange={(e) => setClientContactPerson(e.target.value)}
                  hint="Optional: Primary point of contact"
                  className="h-12"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="clientContactPhone" className="text-base font-medium">
                  Contact Phone Number
                  {hasFieldError('clientContactPhone') && showValidation && (
                    <AlertTriangle className="h-4 w-4 text-destructive inline-block ml-2" />
                  )}
                </Label>
                <InputEnhanced
                  id="clientContactPhone"
                  placeholder="e.g., +8801XXXXXXXXX"
                  value={clientContactPhone}
                  onChange={(e) => {
                    setClientContactPhone(e.target.value);
                    if (showValidation) validateField('clientContactPhone', e.target.value.trim());
                  }}
                  error={hasFieldError('clientContactPhone') && showValidation ? getFieldError('clientContactPhone') : ''}
                  hint="Optional: Include country code when possible"
                  className="h-12"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="clientContactEmail" className="text-base font-medium">
                Contact Email Address
                {hasFieldError('clientContactEmail') && showValidation && (
                  <AlertTriangle className="h-4 w-4 text-destructive inline-block ml-2" />
                )}
              </Label>
              <InputEnhanced
                id="clientContactEmail"
                type="email"
                placeholder="e.g., contact@client-company.com"
                value={clientContactEmail}
                onChange={(e) => {
                  setClientContactEmail(e.target.value);
                  if (showValidation) validateField('clientContactEmail', e.target.value.trim());
                }}
                error={hasFieldError('clientContactEmail') && showValidation ? getFieldError('clientContactEmail') : ''}
                hint="Optional: Used for project communication"
                className="h-12"
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-6 border-t border-border/50">
          <div className="text-sm text-muted-foreground">
            {selectedTemplate && projectName.trim() ? (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle className="h-4 w-4" />
                Ready to create project
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Please select a template and enter a project name
              </div>
            )}
          </div>
          
          <div className="flex gap-3 w-full sm:w-auto">
            <Link href="/projects" className="flex-1 sm:flex-none">
              <Button type="button" variant="outline" className="w-full sm:w-auto">
                Cancel
              </Button>
            </Link>
            <Button 
              type="submit" 
              disabled={!isFormValid || creating}
              className={cn(
                "min-w-[160px] flex-1 sm:flex-none relative overflow-hidden",
                (!isFormValid || creating) && "opacity-60"
              )}
            >
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Project...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Create Project
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}