import { useState, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { X, Upload, CloudUpload } from "lucide-react";
import { useDropzone } from "react-dropzone";

const serviceSchema = z.object({
  title: z.string()
    .min(1, "Título é obrigatório")
    .trim()
    .refine(val => val.length > 0, "Título não pode estar vazio"),
  serviceType: z.array(z.string()).min(1, "Selecione pelo menos um tipo de serviço"),
  requesterId: z.string().min(1, "Solicitante é obrigatório"),
  providerId: z.string().optional(),
  status: z.string().default("Pendente"),
  value: z.string().optional(),
  isMonthlyPackage: z.boolean().default(false),
  isCourtesy: z.boolean().default(false),
  creditsUsed: z.number().default(0),
  description: z.string().optional().default(""),
  requestDate: z.string().min(1, "Data de solicitação é obrigatória"),
  completionDate: z.string().optional(),
});

type ServiceFormData = z.infer<typeof serviceSchema>;

interface NewServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onServiceCreated: () => void;
}

export default function NewServiceModal({ isOpen, onClose, onServiceCreated }: NewServiceModalProps) {
  const { toast } = useToast();
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAdmin] = useState(() => localStorage.getItem('isAdmin') === 'true');

  const form = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      title: "",
      serviceType: [],
      requesterId: "",
      providerId: "",
      status: "Pendente",
      value: "",
      isMonthlyPackage: false,
      isCourtesy: false,
      creditsUsed: 0,
      description: "",
      requestDate: new Date().toISOString().split('T')[0],
      completionDate: "",
    },
  });

  const { watch, setValue, handleSubmit, reset, setError, register } = form;

  const { data: requestersResponse } = useQuery<{
    requesters: any[];
    pagination: any;
  }>({
    queryKey: ["/api/requesters"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: isOpen,
  });

  const { data: providersResponse } = useQuery<{
    providers: any[];
    pagination: any;
  }>({
    queryKey: ["/api/providers"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: isOpen,
  });

  const requesters = Array.isArray(requestersResponse?.requesters) ? requestersResponse.requesters : [];
  const providers = Array.isArray(providersResponse?.providers) ? providersResponse.providers : [];

  const { data: stats } = useQuery<{ creditsUsed: number }>({
    queryKey: ["/api/services/stats", {
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear()
    }],
    enabled: isOpen,
    queryFn: async () => {
      const response = await fetch("/api/services/stats?" + new URLSearchParams({
        month: (new Date().getMonth() + 1).toString(),
        year: new Date().getFullYear().toString()
      }));
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    }
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setSelectedImages(prev => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    multiple: true,
  });

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const isMonthlyPackage = watch('isMonthlyPackage');
  const isCourtesy = watch('isCourtesy');

  const currentCreditsUsed = stats?.creditsUsed || 0;
  const remainingCredits = Math.max(0, 4 - currentCreditsUsed);

  // Watch for changes in monthly package and courtesy
  useEffect(() => {
    if (isMonthlyPackage && !isCourtesy) {
      setValue('creditsUsed', Math.min(remainingCredits, 4));
    } else if (!isMonthlyPackage) {
      setValue('creditsUsed', 0);
    }
  }, [isMonthlyPackage, setValue, isCourtesy, remainingCredits]);

  useEffect(() => {
    if (isCourtesy) {
      setValue('isMonthlyPackage', false);
      setValue('value', '');
      setValue('creditsUsed', 0);
    }
  }, [isCourtesy, setValue]);

  useEffect(() => {
    if (isMonthlyPackage && isCourtesy) {
      setValue('isCourtesy', false);
    }
  }, [isMonthlyPackage, isCourtesy, setValue]);

  const onSubmit = async (data: ServiceFormData) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();

      formData.append('title', data.title);
      formData.append('description', data.description || '');
      formData.append('requesterId', data.requesterId || '');
      formData.append('providerId', data.providerId || '');
      formData.append('status', data.status);

      if (data.isCourtesy) {
        formData.append('value', '');
        formData.append('isMonthlyPackage', 'false');
        formData.append('creditsUsed', '0');
      } else {
        formData.append('value', data.value || '');
        formData.append('isMonthlyPackage', data.isMonthlyPackage.toString());
        formData.append('creditsUsed', data.isMonthlyPackage ? (data.creditsUsed?.toString() || '0') : '0');
      }

      formData.append('isCourtesy', data.isCourtesy ? 'true' : 'false');

      // Fix date bug by adjusting for timezone offset
      const requestDate = new Date(data.requestDate);
      if (requestDate.getTime() !== new Date(data.requestDate).getTime()) { // Check if date is valid
        const adjustedRequestDate = new Date(requestDate.getTime() - requestDate.getTimezoneOffset() * 60000);
        formData.append('requestDate', adjustedRequestDate.toISOString());
      } else {
        formData.append('requestDate', requestDate.toISOString());
      }

      if (data.completionDate) {
        const completionDate = new Date(data.completionDate);
        if (completionDate.getTime() !== new Date(data.completionDate).getTime()) { // Check if date is valid
          const adjustedCompletionDate = new Date(completionDate.getTime() - completionDate.getTimezoneOffset() * 60000);
          formData.append('completionDate', adjustedCompletionDate.toISOString());
        } else {
          formData.append('completionDate', completionDate.toISOString());
        }
      }

      data.serviceType.forEach(type => {
        formData.append('serviceType', type);
      });

      selectedImages.forEach((image) => {
        formData.append('images', image);
      });

      const response = await apiRequest('POST', '/api/services', formData);

      toast({
        title: "Sucesso",
        description: "Serviço criado com sucesso!",
      });

      onServiceCreated();
      form.reset();
      setSelectedImages([]);
    } catch (error: any) {
      console.error('Form submission error:', error);

      if (error.response?.data?.errors) {
        const validationErrors = error.response.data.errors;
        const errorMessages = validationErrors.map((err: any) => err.message).join(', ');
        toast({
          title: "Erro de Validação",
          description: errorMessages,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro",
          description: error.message || "Erro ao criar serviço",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-blue-900">Novo Serviço</DialogTitle>
          <DialogDescription>
            Preencha as informações para criar um novo serviço.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Image Upload */}
                <div>
                  <Label className="text-sm font-medium text-gray-900 mb-2 block">
                    Imagens do Serviço
                  </Label>
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                      isDragActive
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <input {...getInputProps()} />
                    <CloudUpload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-600 mb-2">Arraste e solte suas imagens aqui</p>
                    <p className="text-sm text-gray-500 mb-4">ou clique para selecionar</p>
                    <Button type="button" variant="outline" size="sm">
                      Selecionar Imagens
                    </Button>
                  </div>

                  {selectedImages.length > 0 && (
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      {selectedImages.map((image, index) => (
                        <div key={index} className="relative">
                          <img
                            src={URL.createObjectURL(image)}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-20 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título do Serviço *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Manutenção do ar condicionado" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="serviceType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Serviço *</FormLabel>
                      <div className="grid grid-cols-2 gap-3">
                        {["Manutenção", "Reparo", "Instalação", "Montagem", "Limpeza", "Correção", "Orçamento"].map((type) => (
                          <div key={type} className="flex items-center space-x-2">
                            <Checkbox
                              id={type}
                              checked={field.value?.includes(type) || false}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  field.onChange([...(field.value || []), type]);
                                } else {
                                  field.onChange(field.value?.filter((t: string) => t !== type) || []);
                                }
                              }}
                            />
                            <Label htmlFor={type} className="text-sm">{type}</Label>
                          </div>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="requesterId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Solicitante</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o solicitante" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {requesters.map((requester) => (
                            <SelectItem key={requester.id} value={requester.id}>
                              {requester.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="providerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fornecedor</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o fornecedor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {providers.map((provider) => (
                            <SelectItem key={provider.id} value={provider.id}>
                              {provider.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {isAdmin && (
                  <div className="flex gap-4">
                    <FormField
                      control={form.control}
                      name="isMonthlyPackage"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              id="isMonthlyPackage"
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={remainingCredits <= 0 && currentCreditsUsed >= 4}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <Label htmlFor="isMonthlyPackage">
                              Incluído no Pacote Mensal
                              {remainingCredits <= 0 && currentCreditsUsed >= 4 && (
                                <span className="text-red-500 text-xs ml-2">
                                  (Limite mensal atingido: {currentCreditsUsed}/4)
                                </span>
                              )}
                              {remainingCredits > 0 && currentCreditsUsed > 0 && (
                                <span className="text-orange-500 text-xs ml-2">
                                  (Restam: {remainingCredits}/4 créditos)
                                </span>
                              )}
                            </Label>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="isCourtesy"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              id="isCourtesy"
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={isMonthlyPackage}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <Label htmlFor="isCourtesy">
                              Cortesia
                              {isMonthlyPackage && (
                                <span className="text-gray-400 text-xs ml-2">
                                  (Bloqueado - Pacote Mensal ativo)
                                </span>
                              )}
                            </Label>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {isAdmin && isMonthlyPackage && (
                  <FormField
                    control={form.control}
                    name="creditsUsed"
                    render={({ field }) => (
                      <FormItem>
                        <Label>
                          Créditos Utilizados
                          <span className="text-sm text-gray-500 ml-2">
                            (Máx: {Math.min(remainingCredits, 4)} - Usados este mês: {currentCreditsUsed}/4)
                          </span>
                        </Label>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            max={Math.min(remainingCredits, 4)}
                            value={field.value === 0 ? '' : field.value}
                            onChange={(e) => {
                              const value = parseInt(e.target.value);
                              if (!isNaN(value) && value >= 1 && value <= Math.min(remainingCredits, 4)) {
                                field.onChange(value);
                              } else if (e.target.value === '') {
                                field.onChange(0);
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                        {remainingCredits < 4 && currentCreditsUsed < 4 && (
                          <p className="text-orange-600 text-xs">
                            Atenção: Você só pode usar até {remainingCredits} créditos este mês.
                          </p>
                        )}
                        {currentCreditsUsed >= 4 && (
                          <p className="text-red-600 text-xs">
                            Limite mensal de créditos atingido.
                          </p>
                        )}
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Status *</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="PENDENTE" id="PENDENTE" />
                            <Label htmlFor="PENDENTE">Pendente</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="RESOLVIDO" id="RESOLVIDO" />
                            <Label htmlFor="RESOLVIDO">Resolvido</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="PROGRAMADO" id="PROGRAMADO" />
                            <Label htmlFor="PROGRAMADO">Programado</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {isAdmin && (
                  <FormField
                    control={form.control}
                    name="value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor do Serviço (R$)</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            placeholder="0,00"
                            {...field}
                            disabled={isCourtesy || isMonthlyPackage}
                            onChange={(e) => {
                              const value = e.target.value.replace(/[^\d,.-]/g, '');
                              field.onChange(value);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="requestDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Solicitação *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="completionDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Conclusão</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={4}
                      maxLength={200}
                      placeholder="Descreva os detalhes do serviço... (máximo 200 caracteres)"
                      {...field}
                    />
                  </FormControl>
                  <p className="text-xs text-gray-500">
                    {field.value?.length || 0}/200 caracteres
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Salvando..." : "Salvar Serviço"}
              </Button>
            </div>
            <div className="text-center text-gray-500 text-xs mt-8">
              <p>Desenvolvido por Dilney Santos</p>
              <p>Todos os direitos reservados</p>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}