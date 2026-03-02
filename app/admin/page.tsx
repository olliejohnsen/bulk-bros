"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Shield, LogOut, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";

interface BulkCard {
  id: string;
  imageUrl: string;
  username: string;
  likes: number;
  createdAt: string;
  cardName?: string | null;
  setName?: string | null;
  sameCardSlabCount?: number;
  sameCardSlabIndex?: number;
}

export default function AdminPage() {
  const [authStatus, setAuthStatus] = useState<"loading" | "unauthenticated" | "authenticated">("loading");
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [cards, setCards] = useState<BulkCard[]>([]);
  const [cardsLoading, setCardsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/verify");
      setAuthStatus(res.ok ? "authenticated" : "unauthenticated");
      return res.ok;
    } catch {
      setAuthStatus("unauthenticated");
      return false;
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const fetchCards = useCallback(async () => {
    setCardsLoading(true);
    try {
      const res = await fetch("/api/cards?limit=100&sort=newest");
      if (!res.ok) throw new Error("Failed to fetch cards");
      const data = await res.json();
      setCards(data.cards ?? []);
    } catch {
      toast.error("Failed to load cards");
    } finally {
      setCardsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authStatus === "authenticated") fetchCards();
  }, [authStatus, fetchCards]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error ?? "Invalid password");
        return;
      }
      setAuthStatus("authenticated");
      setPassword("");
      toast.success("Logged in");
    } catch {
      setLoginError("Something went wrong");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthStatus("unauthenticated");
    setCards([]);
    toast.success("Logged out");
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/cards/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Delete failed");
      }
      setCards((prev) => prev.filter((c) => c.id !== id));
      toast.success("Card deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeletingId(null);
    }
  };

  if (authStatus === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (authStatus === "unauthenticated") {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="size-5" />
              Admin
            </CardTitle>
            <CardDescription>
              Enter the admin password to manage the card library.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-password">Password</Label>
                <Input
                  id="admin-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Admin password"
                  autoFocus
                  disabled={loginLoading}
                />
              </div>
              {loginError && (
                <p className="text-sm text-destructive">{loginError}</p>
              )}
              <Button type="submit" className="w-full" disabled={loginLoading}>
                {loginLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Checking…
                  </>
                ) : (
                  "Log in"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin</h1>
          <p className="text-muted-foreground">
            Delete cards from the library. {cards.length} card{cards.length !== 1 ? "s" : ""} loaded.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleLogout}>
          <LogOut className="size-4" />
          Log out
        </Button>
      </div>

      {cardsLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      ) : cards.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No cards in the library.
          </CardContent>
        </Card>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <li
              key={card.id}
              className="group relative overflow-hidden rounded-xl border bg-card"
            >
              <Link
                href={`/card/${card.id}`}
                className="block focus:outline-none focus:ring-2 focus:ring-primary rounded-xl"
              >
                <div className="relative aspect-[3/4] w-full bg-muted">
                  <Image
                    src={card.imageUrl}
                    alt={card.cardName ?? "Card"}
                    fill
                    className="object-contain"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
                <div className="p-3">
                  <p className="font-medium truncate">{card.cardName ?? "—"}</p>
                  <p className="text-sm text-muted-foreground">@{card.username}</p>
                </div>
              </Link>
              <Button
                variant="destructive"
                size="icon"
                className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
                onClick={(e) => {
                  e.preventDefault();
                  if (confirm("Delete this card from the library?")) {
                    handleDelete(card.id);
                  }
                }}
                disabled={deletingId === card.id}
                aria-label={`Delete ${card.cardName ?? "card"}`}
              >
                {deletingId === card.id ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Trash2 className="size-4" />
                )}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
