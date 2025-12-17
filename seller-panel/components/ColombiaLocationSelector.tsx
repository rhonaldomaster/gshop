'use client'

import { useState, useEffect } from 'react'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getDepartmentNames, getCitiesByDepartment } from '@/lib/colombia-locations'

interface ColombiaLocationSelectorProps {
  departmentValue: string
  cityValue: string
  onDepartmentChange: (value: string) => void
  onCityChange: (value: string) => void
  departmentLabel?: string
  cityLabel?: string
  required?: boolean
}

export function ColombiaLocationSelector({
  departmentValue,
  cityValue,
  onDepartmentChange,
  onCityChange,
  departmentLabel = 'Departamento',
  cityLabel = 'Ciudad',
  required = false
}: ColombiaLocationSelectorProps) {
  const [departments] = useState<string[]>(getDepartmentNames())
  const [cities, setCities] = useState<string[]>([])

  // Update cities when department changes
  useEffect(() => {
    if (departmentValue) {
      const departmentCities = getCitiesByDepartment(departmentValue)
      setCities(departmentCities)

      // Reset city if it's not in the new department's cities
      if (cityValue && !departmentCities.includes(cityValue)) {
        onCityChange('')
      }
    } else {
      setCities([])
      onCityChange('')
    }
  }, [departmentValue])

  const handleDepartmentChange = (value: string) => {
    onDepartmentChange(value)
  }

  const handleCityChange = (value: string) => {
    onCityChange(value)
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="department">
          {departmentLabel} {required && '*'}
        </Label>
        <Select value={departmentValue} onValueChange={handleDepartmentChange}>
          <SelectTrigger id="department">
            <SelectValue placeholder="Selecciona un departamento" />
          </SelectTrigger>
          <SelectContent>
            {departments.map((dept) => (
              <SelectItem key={dept} value={dept}>
                {dept}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="city">
          {cityLabel} {required && '*'}
        </Label>
        <Select
          value={cityValue}
          onValueChange={handleCityChange}
          disabled={!departmentValue || cities.length === 0}
        >
          <SelectTrigger id="city">
            <SelectValue placeholder={
              !departmentValue
                ? "Primero selecciona un departamento"
                : cities.length === 0
                  ? "No hay ciudades disponibles"
                  : "Selecciona una ciudad"
            } />
          </SelectTrigger>
          <SelectContent>
            {cities.map((city) => (
              <SelectItem key={city} value={city}>
                {city}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
