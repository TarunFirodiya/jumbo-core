"use client";

import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Building {
  id: string;
  name: string;
  locality: string | null;
}

interface BuildingMultiSelectProps {
  value: string[];
  onChange: (val: string[]) => void;
}

export function BuildingMultiSelect({ value, onChange }: BuildingMultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [buildings, setBuildings] = React.useState<Building[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    async function fetchBuildings() {
      setIsLoading(true);
      try {
        const res = await fetch("/api/v1/buildings?limit=100");
        if (res.ok) {
          const json = await res.json();
          setBuildings(json.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch buildings:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchBuildings();
  }, []);

  const selectedBuildings = buildings.filter((b) => value.includes(b.id));

  const toggleBuilding = (buildingId: string) => {
    if (value.includes(buildingId)) {
      onChange(value.filter((id) => id !== buildingId));
    } else {
      onChange([...value, buildingId]);
    }
  };

  const removeBuilding = (buildingId: string) => {
    onChange(value.filter((id) => id !== buildingId));
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-auto min-h-9 font-normal"
          >
            <span className="text-muted-foreground">
              {value.length > 0
                ? `${value.length} building${value.length > 1 ? "s" : ""} selected`
                : "Select buildings..."}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search buildings..." />
            <CommandList>
              <CommandEmpty>
                {isLoading ? "Loading..." : "No buildings found."}
              </CommandEmpty>
              <CommandGroup>
                {buildings.map((building) => (
                  <CommandItem
                    key={building.id}
                    value={`${building.name} ${building.locality || ""}`}
                    onSelect={() => toggleBuilding(building.id)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value.includes(building.id) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col">
                      <span>{building.name}</span>
                      {building.locality && (
                        <span className="text-xs text-muted-foreground">
                          {building.locality}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedBuildings.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedBuildings.map((building) => (
            <Badge
              key={building.id}
              variant="secondary"
              className="gap-1 pr-1"
            >
              {building.name}
              <button
                type="button"
                className="ml-0.5 rounded-full outline-none hover:bg-muted-foreground/20 p-0.5"
                onClick={() => removeBuilding(building.id)}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
