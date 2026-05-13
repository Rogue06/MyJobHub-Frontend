"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Plus } from "lucide-react";

export interface IdentityValue {
  full_name?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  portfolio_url?: string;
  github?: string;
  headline?: string;
  exit_story?: string;
  superpowers?: string[];
  primary_roles?: string[];
}

interface Props {
  value: IdentityValue;
  onChange: (next: IdentityValue) => void;
}

export function IdentityEditor({ value, onChange }: Props) {
  const [newPower, setNewPower] = React.useState("");
  const [newRole, setNewRole] = React.useState("");

  const update = (patch: Partial<IdentityValue>) => onChange({ ...value, ...patch });

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold">Identité</h3>
          <p className="text-xs text-muted-foreground">Informations de contact reprises dans tes CV adaptés</p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Nom complet" id="full_name">
            <Input
              id="full_name"
              value={value.full_name ?? ""}
              onChange={(e) => update({ full_name: e.target.value })}
            />
          </Field>
          <Field label="Email" id="email">
            <Input
              id="email"
              type="email"
              value={value.email ?? ""}
              onChange={(e) => update({ email: e.target.value })}
            />
          </Field>
          <Field label="Téléphone" id="phone">
            <Input id="phone" value={value.phone ?? ""} onChange={(e) => update({ phone: e.target.value })} />
          </Field>
          <Field label="Ville (résidence)" id="location">
            <Input
              id="location"
              value={value.location ?? ""}
              onChange={(e) => update({ location: e.target.value })}
            />
          </Field>
          <Field label="LinkedIn" id="linkedin">
            <Input
              id="linkedin"
              value={value.linkedin ?? ""}
              placeholder="linkedin.com/in/…"
              onChange={(e) => update({ linkedin: e.target.value })}
            />
          </Field>
          <Field label="Portfolio (URL)" id="portfolio_url">
            <Input
              id="portfolio_url"
              value={value.portfolio_url ?? ""}
              placeholder="https://"
              onChange={(e) => update({ portfolio_url: e.target.value })}
            />
          </Field>
          <Field label="GitHub" id="github">
            <Input
              id="github"
              value={value.github ?? ""}
              placeholder="github.com/…"
              onChange={(e) => update({ github: e.target.value })}
            />
          </Field>
        </div>
      </section>

      <Separator />

      <section className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold">Récit professionnel</h3>
          <p className="text-xs text-muted-foreground">Comment l'IA présente ton parcours dans les lettres de motivation</p>
        </div>
        <Field label="Phrase d'accroche" id="headline">
          <Input
            id="headline"
            placeholder="Conseiller bancaire spécialisé en clientèle particuliers, 3 ans d'expérience"
            value={value.headline ?? ""}
            onChange={(e) => update({ headline: e.target.value })}
          />
        </Field>
        <Field label="Récit court (2-3 phrases)" id="exit_story">
          <Textarea
            id="exit_story"
            rows={3}
            placeholder="Pourquoi tu cherches, ce qui te motive, ce que tu apportes."
            value={value.exit_story ?? ""}
            onChange={(e) => update({ exit_story: e.target.value })}
          />
        </Field>
        <Field label="Forces principales" id="superpowers">
          <div className="flex flex-wrap gap-1.5">
            {(value.superpowers ?? []).map((p) => (
              <Badge key={p} variant="secondary" className="gap-1.5 pr-1">
                {p}
                <button
                  type="button"
                  onClick={() =>
                    update({ superpowers: (value.superpowers ?? []).filter((x) => x !== p) })
                  }
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2 pt-2">
            <Input
              placeholder="Ex. relation client, vente, gestion de portefeuille…"
              value={newPower}
              onChange={(e) => setNewPower(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newPower.trim()) {
                  e.preventDefault();
                  update({ superpowers: [...(value.superpowers ?? []), newPower.trim()] });
                  setNewPower("");
                }
              }}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (newPower.trim()) {
                  update({ superpowers: [...(value.superpowers ?? []), newPower.trim()] });
                  setNewPower("");
                }
              }}
            >
              <Plus className="mr-1 h-3 w-3" /> Ajouter
            </Button>
          </div>
        </Field>

        <Field label="Postes ciblés (intitulés)" id="primary_roles">
          <div className="flex flex-wrap gap-1.5">
            {(value.primary_roles ?? []).map((r) => (
              <Badge key={r} variant="secondary" className="gap-1.5 pr-1">
                {r}
                <button
                  type="button"
                  onClick={() => update({ primary_roles: (value.primary_roles ?? []).filter((x) => x !== r) })}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2 pt-2">
            <Input
              placeholder="Ex. Conseiller clientèle particuliers, Chargé d'accueil bancaire"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newRole.trim()) {
                  e.preventDefault();
                  update({ primary_roles: [...(value.primary_roles ?? []), newRole.trim()] });
                  setNewRole("");
                }
              }}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (newRole.trim()) {
                  update({ primary_roles: [...(value.primary_roles ?? []), newRole.trim()] });
                  setNewRole("");
                }
              }}
            >
              <Plus className="mr-1 h-3 w-3" /> Ajouter
            </Button>
          </div>
        </Field>
      </section>
    </div>
  );
}

function Field({ id, label, children }: { id?: string; label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs">
        {label}
      </Label>
      {children}
    </div>
  );
}
