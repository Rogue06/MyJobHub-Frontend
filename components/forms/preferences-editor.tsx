"use client";

import * as React from "react";
import { X, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { CONTRACT_TYPES, DEFAULT_DOMAINS, SENIORITY_LEVELS, SeniorityId, WizardPreferences } from "@/lib/preferences";
import { cn } from "@/lib/utils";

interface Props {
  value: WizardPreferences;
  onChange: (next: WizardPreferences) => void;
}

export function PreferencesEditor({ value, onChange }: Props) {
  const [customDomain, setCustomDomain] = React.useState("");
  const [newPreferred, setNewPreferred] = React.useState("");
  const [newExcluded, setNewExcluded] = React.useState("");

  const update = (patch: Partial<WizardPreferences>) => onChange({ ...value, ...patch });

  const toggleContract = (id: string) => {
    update({
      contractTypes: value.contractTypes.includes(id)
        ? value.contractTypes.filter((c) => c !== id)
        : [...value.contractTypes, id],
    });
  };
  const toggleDomain = (id: string) => {
    update({
      domains: value.domains.includes(id) ? value.domains.filter((d) => d !== id) : [...value.domains, id],
    });
  };

  const formatEur = (n: number) => `${n.toLocaleString("fr-FR")} €/an`;

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <div>
          <Label>Type de contrat recherché</Label>
          <p className="text-xs text-muted-foreground">Sélectionne tous ceux qui t'intéressent</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {CONTRACT_TYPES.map((c) => {
            const selected = value.contractTypes.includes(c.id);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => toggleContract(c.id)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm transition-colors",
                  selected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background hover:bg-accent"
                )}
                title={c.description}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </section>

      <Separator />

      <section className="space-y-3">
        <div>
          <Label>Niveau d'expérience</Label>
          <p className="text-xs text-muted-foreground">
            Multi-sélection : tu peux cocher plusieurs niveaux pour viser
            simultanément (ex. débutant + confirmé après une transition).
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {SENIORITY_LEVELS.map((s) => {
            const selected = value.seniority.includes(s.id);
            const toggle = () => {
              const next: SeniorityId[] = selected
                ? value.seniority.filter((x) => x !== s.id)
                : [...value.seniority, s.id];
              // Au moins un niveau doit rester sélectionné, sinon on ne sait
              // plus ce que cherche l'utilisateur.
              update({ seniority: next.length === 0 ? [s.id] : next });
            };
            return (
              <button
                key={s.id}
                type="button"
                onClick={toggle}
                className={cn(
                  "flex flex-col items-start gap-0.5 rounded-md border px-4 py-2 text-left transition-colors",
                  selected ? "border-primary bg-primary/5" : "border-border bg-background hover:bg-accent"
                )}
              >
                <span className="text-sm font-medium">{s.label}</span>
                <span className="text-xs text-muted-foreground">{s.description}</span>
              </button>
            );
          })}
        </div>
      </section>

      <Separator />

      <section className="space-y-3">
        <div>
          <Label>Domaines visés</Label>
          <p className="text-xs text-muted-foreground">Sélectionne ce qui t'intéresse, ou ajoute des domaines libres</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {DEFAULT_DOMAINS.map((d) => {
            const selected = value.domains.includes(d.id);
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => toggleDomain(d.id)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm transition-colors",
                  selected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background hover:bg-accent"
                )}
              >
                {d.label}
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap items-center gap-2 pt-2">
          {value.customDomains.map((d) => (
            <Badge key={d} variant="secondary" className="gap-1.5 pr-1">
              {d}
              <button
                type="button"
                onClick={() => update({ customDomains: value.customDomains.filter((x) => x !== d) })}
                className="rounded-full p-0.5 hover:bg-background/50"
                aria-label={`Retirer ${d}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          <div className="flex items-center gap-2">
            <Input
              placeholder="Ajouter un domaine libre"
              value={customDomain}
              onChange={(e) => setCustomDomain(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && customDomain.trim()) {
                  e.preventDefault();
                  update({ customDomains: [...value.customDomains, customDomain.trim()] });
                  setCustomDomain("");
                }
              }}
              className="w-56"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                if (customDomain.trim()) {
                  update({ customDomains: [...value.customDomains, customDomain.trim()] });
                  setCustomDomain("");
                }
              }}
            >
              <Plus className="mr-1 h-3 w-3" /> Ajouter
            </Button>
          </div>
        </div>
      </section>

      <Separator />

      <section className="space-y-4">
        <div>
          <Label>Rémunération brute annuelle souhaitée</Label>
          <p className="text-xs text-muted-foreground">Ajuste les deux poignées : minimum (refus en dessous) et cible.</p>
        </div>
        <div className="flex items-center justify-between text-sm">
          <div>
            <span className="text-xs text-muted-foreground">Minimum</span>
            <p className="text-base font-semibold">{formatEur(value.salaryMin)}</p>
          </div>
          <div className="text-right">
            <span className="text-xs text-muted-foreground">Cible</span>
            <p className="text-base font-semibold">{formatEur(value.salaryTarget)}</p>
          </div>
        </div>
        <Slider
          value={[value.salaryMin, value.salaryTarget]}
          min={15000}
          max={150000}
          step={1000}
          onValueChange={(v) => {
            const arr = Array.isArray(v) ? v : [v, v];
            const [min, target] = arr;
            update({ salaryMin: min, salaryTarget: Math.max(target, min) });
          }}
        />
        <div className="flex items-center gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Minimum (€)</Label>
            <Input
              type="number"
              value={value.salaryMin}
              onChange={(e) => {
                const n = Number(e.target.value) || 0;
                update({ salaryMin: n, salaryTarget: Math.max(value.salaryTarget, n) });
              }}
              className="w-32"
              min={0}
              step={500}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Cible (€)</Label>
            <Input
              type="number"
              value={value.salaryTarget}
              onChange={(e) => {
                const n = Number(e.target.value) || 0;
                update({ salaryTarget: Math.max(n, value.salaryMin) });
              }}
              className="w-32"
              min={0}
              step={500}
            />
          </div>
        </div>
      </section>

      <Separator />

      <section className="space-y-4">
        <div>
          <Label>Mobilité géographique</Label>
          <p className="text-xs text-muted-foreground">Ta ville de base et la distance que tu acceptes</p>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Ville de base</Label>
            <Input
              placeholder="Ex. Nice, Lyon, Paris…"
              value={value.baseCity}
              onChange={(e) => update({ baseCity: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Distance maximale : {value.mobilityKm} km</Label>
            <Slider
              value={[value.mobilityKm]}
              min={0}
              max={300}
              step={5}
              onValueChange={(v) => {
                const n = Array.isArray(v) ? v[0] : v;
                update({ mobilityKm: n });
              }}
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Switch checked={value.remoteOk} onCheckedChange={(v) => update({ remoteOk: v })} id="remote-ok-shared" />
          <Label htmlFor="remote-ok-shared" className="text-sm font-normal">
            J'accepte le télétravail total ou partiel
          </Label>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-xs">Villes préférées (en plus de ta base)</Label>
            <div className="flex flex-wrap gap-1.5">
              {value.preferredLocations.map((c) => (
                <Badge key={c} variant="secondary" className="gap-1.5 pr-1">
                  {c}
                  <button
                    type="button"
                    onClick={() => update({ preferredLocations: value.preferredLocations.filter((x) => x !== c) })}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Ajouter une ville"
                value={newPreferred}
                onChange={(e) => setNewPreferred(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newPreferred.trim()) {
                    e.preventDefault();
                    update({ preferredLocations: [...value.preferredLocations, newPreferred.trim()] });
                    setNewPreferred("");
                  }
                }}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (newPreferred.trim()) {
                    update({ preferredLocations: [...value.preferredLocations, newPreferred.trim()] });
                    setNewPreferred("");
                  }
                }}
              >
                Ajouter
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Villes à exclure</Label>
            <div className="flex flex-wrap gap-1.5">
              {value.excludedLocations.map((c) => (
                <Badge key={c} variant="destructive" className="gap-1.5 pr-1">
                  {c}
                  <button
                    type="button"
                    onClick={() => update({ excludedLocations: value.excludedLocations.filter((x) => x !== c) })}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Ajouter une ville à exclure"
                value={newExcluded}
                onChange={(e) => setNewExcluded(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newExcluded.trim()) {
                    e.preventDefault();
                    update({ excludedLocations: [...value.excludedLocations, newExcluded.trim()] });
                    setNewExcluded("");
                  }
                }}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (newExcluded.trim()) {
                    update({ excludedLocations: [...value.excludedLocations, newExcluded.trim()] });
                    setNewExcluded("");
                  }
                }}
              >
                Ajouter
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
