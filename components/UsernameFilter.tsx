"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface UsernameFilterProps {
  usernames: string[];
  currentUsername: string | null;
}

export function UsernameFilter({
  usernames,
  currentUsername,
}: UsernameFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete("username");
    } else {
      params.set("username", value);
    }
    router.push(`/?${params.toString()}`);
  };

  const handleClear = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("username");
    router.push(`/?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2">
      <Select
        value={currentUsername ?? "all"}
        onValueChange={handleChange}
      >
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Filter by trainer" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All trainers</SelectItem>
          {usernames.map((u) => (
            <SelectItem key={u} value={u}>
              {u}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {currentUsername && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClear}
          aria-label="Clear filter"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
