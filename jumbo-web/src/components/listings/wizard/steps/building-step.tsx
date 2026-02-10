"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useListingWizardStore } from "@/store/listing-wizard-store";
import { Building2, Plus, Search, MapPin, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface BuildingRecord {
  id: string;
  name: string;
  locality: string | null;
  city: string | null;
}

export function BuildingStep() {
  const building = useListingWizardStore((state) => state.building);
  const setBuilding = useListingWizardStore((state) => state.setBuilding);

  const [searchQuery, setSearchQuery] = React.useState("");
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [buildings, setBuildings] = React.useState<BuildingRecord[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [newBuilding, setNewBuilding] = React.useState({
    name: "",
    locality: "",
    city: "Bangalore",
  });

  // Fetch buildings from API
  React.useEffect(() => {
    async function fetchBuildings() {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({ limit: "100" });
        if (searchQuery) {
          params.set("search", searchQuery);
        }
        const response = await fetch(`/api/v1/buildings?${params}`);
        if (response.ok) {
          const result = await response.json();
          setBuildings(result.data || []);
        }
      } catch (error) {
        console.error("Error fetching buildings:", error);
      } finally {
        setIsLoading(false);
      }
    }

    const debounce = setTimeout(fetchBuildings, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const handleSelectBuilding = (b: BuildingRecord) => {
    setBuilding({
      id: b.id,
      name: b.name,
      locality: b.locality || "",
      city: b.city || "",
      isNew: false,
    });
  };

  const handleCreateBuilding = () => {
    if (!newBuilding.name || !newBuilding.locality) return;

    setBuilding({
      name: newBuilding.name,
      locality: newBuilding.locality,
      city: newBuilding.city,
      isNew: true,
    });

    setIsDialogOpen(false);
    setNewBuilding({ name: "", locality: "", city: "Bangalore" });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Select Building</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Search for an existing building or create a new one.
        </p>
      </div>

      {/* Search and Add New */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search buildings by name or locality..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Plus className="size-4" />
              New Building
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Building</DialogTitle>
              <DialogDescription>
                Enter the details of the new building. You can add more details later.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Building Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Prestige Lake Ridge"
                  value={newBuilding.name}
                  onChange={(e) =>
                    setNewBuilding((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="locality">Locality *</Label>
                <Input
                  id="locality"
                  placeholder="e.g., Whitefield"
                  value={newBuilding.locality}
                  onChange={(e) =>
                    setNewBuilding((prev) => ({ ...prev, locality: e.target.value }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  placeholder="e.g., Bangalore"
                  value={newBuilding.city}
                  onChange={(e) =>
                    setNewBuilding((prev) => ({ ...prev, city: e.target.value }))
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateBuilding}
                disabled={!newBuilding.name || !newBuilding.locality}
              >
                Add Building
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Building Grid */}
      {!isLoading && buildings.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {buildings.map((b) => {
            const isSelected = building?.id === b.id;
            return (
              <button
                key={b.id}
                onClick={() => handleSelectBuilding(b)}
                className={cn(
                  "flex items-start gap-3 p-4 rounded-lg border-2 text-left transition-all",
                  "hover:border-primary/50 hover:bg-muted/50",
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-muted bg-background"
                )}
              >
                <div
                  className={cn(
                    "flex size-10 items-center justify-center rounded-lg shrink-0",
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <Building2 className="size-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm truncate">{b.name}</p>
                    {isSelected && (
                      <Check className="size-4 text-primary shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground mt-1">
                    <MapPin className="size-3" />
                    <span className="text-xs">
                      {[b.locality, b.city].filter(Boolean).join(", ") || "No location"}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Selected Building Display (if new) */}
      {building?.isNew && (
        <div className="p-4 rounded-lg border-2 border-primary bg-primary/5">
          <div className="flex items-center gap-2 text-sm">
            <Check className="size-4 text-primary" />
            <span className="font-medium">New building will be created:</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {building.name} — {building.locality}, {building.city}
          </p>
        </div>
      )}

      {!isLoading && buildings.length === 0 && !building?.isNew && (
        <div className="text-center py-8 text-muted-foreground">
          <Building2 className="size-12 mx-auto mb-3 opacity-50" />
          {searchQuery ? (
            <>
              <p className="text-sm">No buildings found matching &ldquo;{searchQuery}&rdquo;</p>
              <p className="text-xs mt-1">Try a different search or add a new building.</p>
            </>
          ) : (
            <>
              <p className="text-sm">No buildings yet</p>
              <p className="text-xs mt-1">Click &ldquo;New Building&rdquo; to add your first building.</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
