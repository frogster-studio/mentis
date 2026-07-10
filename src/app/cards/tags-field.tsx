"use client";

import { X } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { normalizeTag } from "@/lib/cards/schema";

// Free-form Tag editor shared by the create and edit forms. Committed Tags
// travel as repeated hidden "tags" fields, so the server actions read them
// with formData.getAll("tags"); the schema re-normalizes on save.
export function TagsField({ defaultTags = [] }: { defaultTags?: string[] }) {
  const [tags, setTags] = useState(defaultTags);
  const [draft, setDraft] = useState("");

  function commitDraft() {
    const tag = normalizeTag(draft);
    setDraft("");
    if (tag === "" || tags.includes(tag)) return;
    setTags([...tags, tag]);
  }

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="tag-input">Tags</Label>
      {tags.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {tags.map((tag) => (
            <Badge key={tag} variant="outline">
              {tag}
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="size-4"
                aria-label={`Remove Tag ${tag}`}
                onClick={() => setTags(tags.filter((t) => t !== tag))}
              >
                <X />
              </Button>
              <input type="hidden" name="tags" value={tag} />
            </Badge>
          ))}
        </div>
      ) : null}
      <Input
        id="tag-input"
        value={draft}
        placeholder="Add a Tag and press Enter"
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          // Enter commits the draft instead of submitting the whole form.
          if (event.key === "Enter" || event.key === ",") {
            event.preventDefault();
            commitDraft();
          }
        }}
        onBlur={commitDraft}
      />
      {/* Mentis is collaborative — every editor follows the same Tag rules. */}
      <p className="text-muted-foreground text-xs">
        Shared rules: Tags are lowercase French, without accents (é, à…) or
        punctuation; anglicisms are fine when French has no real equivalent
        (shopping, startup). Keep them singular (animal, not animaux) and prefer
        a single word — or one multi-word Tag when needed (developpement
        personnel rather than developpement + personnel).
      </p>
    </div>
  );
}
