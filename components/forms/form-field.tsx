"use client"

import type React from "react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface FormFieldProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  type?: "text" | "email" | "url" | "number" | "date" | "textarea" | "select"
  placeholder?: string
  required?: boolean
  helpText?: string
  options?: { value: string; label: string }[]
  icon?: React.ReactNode
}

export function FormField({
  id,
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required = false,
  helpText,
  options,
  icon,
}: FormFieldProps) {
  const renderInput = () => {
    switch (type) {
      case "textarea":
        return (
          <Textarea
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="bg-card border-border text-white min-h-[100px]"
            required={required}
          />
        )
      case "select":
        return (
          <Select value={value} onValueChange={onChange}>
            <SelectTrigger className="bg-card border-border text-white">
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              {options?.map((option) => (
                <SelectItem key={option.value} value={option.value} className="text-white hover:bg-card/50">
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      case "date":
        return (
          <div className="relative">
            <Input
              id={id}
              type="date"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="bg-card border-border text-white"
              required={required}
            />
            {icon && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none">
                {icon}
              </div>
            )}
          </div>
        )
      default:
        return (
          <Input
            id={id}
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="bg-card border-border text-white"
            required={required}
          />
        )
    }
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-white font-medium">
        {label} {required && "*"}
      </Label>
      {renderInput()}
      {helpText && <p className="text-sm text-muted-foreground">{helpText}</p>}
    </div>
  )
}
